var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server, {});
var mongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var promise = require('promise');
var dbo;

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/cilent/index.html');
});

app.use('/cilent', express.static(__dirname + '/cilent'));

server.listen(process.env.PORT || SERVER_PORT);
console.log('Server Started! localhost: ' + SERVER_PORT);

var socketList = {};
var playerList = {};

mongoClient.connect(url, function (err, db) {
    if (err) throw err;
    dbo = db.db("mmorpg");
    dbo.createCollection("credentials", function (err, res) {
        if (err) throw err;
        console.log("Collection created!");
    });
});

io.sockets.on('connection', function (socket) {

    socket.id = Math.random();
    socketList[socket.id] = socket;
    console.log("Socket " + socket.id + " has connected");

    socket.on('signUp', function (userData) {
        isValidNewCredential(userData).then(function (res) {
            if (res)
                insertCredential(userData);
            socket.emit('signUpResponse', {success: res});
        })
    });

    socket.on('signIn', function (userData) {
        isCorrectCredential(userData).then(function (res) {
            if (res)
                onConnect(socket, userData.user, false);
            socket.emit('signInResponse', {success: res});
        })
    });

    socket.on('disconnect', function () {
        if (playerList.length != 0) {
            //toAllChat(playerList[socket.id].username + " has disconnected");
        }
        if (socket.id != null) {
            delete socketList[socket.id];
            delete playerList[socket.id];
            console.log(socket.id + " has disconnected");
        }
    });
});

setInterval(function () {
    var pack = [];

    for (var i in playerList) {
        var player = playerList[i];
        player.updatePosition();
        pack.push({
            x: player.x,
            y: player.y,
            username: player.username,
            lastPosition: player.lastPosition,
            char: player.char
        });
    }

    for (var i in socketList) {
        var socket = socketList[i];
        socket.emit('playersInfo', pack);
        socket.emit('Time');
    }
}, REFRESH_RATE);


function isValidNewCredential(userData) {
    return new Promise(function (callback) {
        var query = {
            username: userData.user,
        };
        dbo.collection("credentials").find(query).toArray(function (err, result) {
            if (err) throw err;
            if (result.length == 0) {
                console.log("user credential not taken yet: " + userData);
                callback(true);
            }
            callback(false);
            console.log("User credential already exist: " + JSON.stringify(result));
        });
    });
}

function isCorrectCredential(userData) {
    return new Promise(function (callback) {
        var query = {
            username: userData.user,
            password: userData.pass
        };
        dbo.collection("credentials").find(query).toArray(function (err, result) {
            if (err) throw err;
            console.log("Credentials matching: " + JSON.stringify(result));
            if (result.length != 0) {
                console.log("Matching Credential: " + result[0]);
                callback(true);
            }
            callback(false);
        });
    });
}

function insertCredential(data) {
    var credential = {
        username: data.user,
        password: data.pass
    };
    dbo.collection("credentials").insertOne(credential, function (err, res) {
        if (err) throw err;
        console.log("MongoDB Document Inserted: " + JSON.stringify(credential));
    });
}

function toAllChat(line) {
    for (var i in socketList)
        socketList[i].emit('addToChat', line);
}

function RPSCalculate(player1Choice, player2Choice) { //return 1 ->Player 1 wins, 2-> Player 2 wins, 3-> tie
    if (player1Choice === player2Choice)
        return 0;
    else if (player1Choice === 'Rock') {
        if (player2Choice === 'Scissors')
            return 1;
        else if (player2Choice === 'Paper')
            return 2;
    }
    else if (player1Choice === 'Paper') {
        if (player2Choice === 'Rock')
            return 1
        else if (player2Choice === 'Scissors')
            return 2;
    }
    else if (player1Choice === 'Scissors') {
        if (player2Choice === 'Paper')
            return 1
        else if (player2Choice === 'Rock')
            return 2;
    }
}

function onConnect(socket, name, adminPower) {

    var player = Player(socket.id, name, adminPower);
    playerList[socket.id] = player;

    socket.on('keyPress', function (data) {            //glitchy character movement
        if (data.inputId === 'right')
            player.rightPress = data.state;
        else if (data.inputId === 'left')
            player.leftPress = data.state;
        else if (data.inputId === 'up')
            player.upPress = data.state;
        else if (data.inputId === 'down')
            player.downPress = data.state;

        player.lastPosition = data.inputId;
    });

    socket.on('sendMsgToServer', function (data) {
        var playerName = ("" + player.username);
        toAllChat(playerName + ': ' + data);
    });

    socket.on('sendCommandToServer', function (data) {
        var playerName = ("" + player.username);

///////////////////////RPS Challenge   ->Challenger must go first ->fix error ->should refactor
        if (data.startsWith('rps')) {
            var line = data.split(" ");
            var player1 = player;
            var player2;
            for (var i in playerList) {
                playerChallenged = playerList[i];
                if (playerChallenged.username === line[1]) {
                    player2 = playerChallenged;
                    var socket = socketList[player2.id];
                    socket.emit('rpsChallenge', player1.username);

                    socket.on('rpsAccept', function () {
                        toAllChat('RockPaperScissors between ' + player1.username + ' and ' + player2.username);

                        var socket1 = socketList[player1.id];
                        var socket2 = socketList[player2.id];

                        socket1.emit('RPSGame');
                        socket2.emit('RPSGame');

                        var player1Choice = '';
                        var player2Choice = '';

                        socket1.on('RPSResult', function (data) {
                            //console.log(data);
                            player1Choice = data;

                            socket2.on('RPSResult', function (data) {
                                //console.log(data);
                                player2Choice = data;

                                var result = RPSCalculate(player1Choice, player2Choice);
                                var line = "";

                                switch (result) {
                                    case 0:
                                        line = 'Draw';
                                        break;
                                    case 1:
                                        line = player1.username + ' beats ' + player2.username;
                                        break;
                                    case 2:
                                        line = player2.username + ' beats ' + player1.username;
                                        break;
                                    default:
                                        line = 'Something went wrong!'
                                        break;
                                }
                                toAllChat(line);
                            });

                        });


                    })

                }
            }
        }

////////////////////////////
    });

    socket.on('kms', function () {
        delete playerList[socket.id];
    });

    socket.on('revive', function () {
        playerList[socket.id] = player;
    });

    socket.on('charUpdate', function (data) {
        player.char = data.charName;
    });
}