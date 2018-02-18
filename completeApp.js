/**
 * Created by wilso on 2018-02-03.
 */

const SERVER_PORT = 8000;
const REFRESH_RATE = 25;

const X_STARTING_POS = 100;
const Y_STARTING_POS = 100;
const PLAYER_SPEED = 10;
const STARTING_DIR = 'down';
const MONGO_REPO = "Account";

const RPS = {
    PAPER: "Paper",
    SCISSOR: "Scissors",
    ROCK: "Rock"
};

/**
 * Created by wilso on 2018-02-03.
 */
var Player = function (id, name, points) {
    var player = {
        x: X_STARTING_POS,
        y: Y_STARTING_POS,
        id: id,
        username: name,
        points: points,
        char: 'tyler1',

        rightPress: false,
        leftPress: false,
        upPress: false,
        downPress: false,
        lastPosition: STARTING_DIR,

        speed: PLAYER_SPEED
    };

    player.updatePosition = function () {
        if (player.rightPress)
            player.x += player.speed;
        if (player.leftPress)
            player.x -= player.speed;
        if (player.upPress)
            player.y -= player.speed;
        if (player.downPress)
            player.y += player.speed;
    };

    player.addPoint = function () {
        player.points++;
    };

    return player;
};


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
    dbo.createCollection(MONGO_REPO, function (err, res) {
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
            if (res.valid)
                onConnect(socket, userData.username, res.points);
            socket.emit('signInResponse', {success: res.valid});
        })
    });

    socket.on('disconnect', function () {
        if (socketList[socket.id] != null) {
            delete socketList[socket.id];
            console.log(socket.id + " has disconnected");
        }
        var player = playerList[socket.id];
        if (player != null) {
            toAllChat(player.username + " has disconnected.");

            var query = {
                username: player.username
            };
            var newValues = {$set: {points: player.points}};
            dbo.collection(MONGO_REPO).updateOne(query, newValues, function (err, res) {
                if (err) throw err;
                console.log("MongoDB Document Updated: " + res.result);
            });

            delete playerList[socket.id];
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
            points: player.points,
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
            username: userData.username
        };
        dbo.collection(MONGO_REPO).find(query).toArray(function (err, result) {
            if (err) throw err;
            if (result.length == 0) {
                console.log("user credential not taken yet: " + JSON.stringify(userData));
                callback(true);
            }
            else {
                callback(false);
                console.log("User credential already exist: " + JSON.stringify(result));
            }
        });
    });
}

function isCorrectCredential(userData) {
    return new Promise(function (callback) {
        var query = {
            username: userData.username,
            password: userData.password
        };
        dbo.collection(MONGO_REPO).find(query).toArray(function (err, result) {
            if (err) throw err;
            if (result.length != 0) {
                console.log("Matching Credential: " + JSON.stringify(result[0]));
                callback({valid: true, points: result[0].points});
            }
            else {
                callback({valid: false, points: null});
                console.log("incorrect user or password");
            }
        });
    });
}

function insertCredential(data) {
    var account = {
        username: data.username,
        password: data.password,
        points: 0
    };
    dbo.collection(MONGO_REPO).insertOne(account, function (err, res) {
        if (err) throw err;
        console.log("MongoDB Document Inserted: " + JSON.stringify(account));
    });
}

function toAllChat(line) {
    for (var i in socketList)
        socketList[i].emit('addToChat', line);
}

function RPSCalculate(player, opponent) { //return 1 ->Player 1 wins, 2-> Player 2 wins, 3-> tie

    if (player.RPSchoice === opponent.RPSchoice)
        return null;
    else if (player.RPSchoice === RPS.ROCK) {
        if (opponent.RPSchoice === RPS.SCISSOR)
            return player;
        else if (opponent.RPSchoice === RPS.PAPER)
            return opponent;
    }
    else if (player.RPSchoice === RPS.PAPER) {
        if (opponent.RPSchoice === RPS.ROCK)
            return player;
        else if (opponent.RPSchoice === RPS.SCISSOR)
            return opponent;
    }
    else if (player.RPSchoice === RPS.SCISSOR) {
        if (opponent.RPSchoice === RPS.PAPER)
            return player;
        else if (opponent.RPSchoice === RPS.ROCK)
            return opponent;
    }
}

function onConnect(socket, name, points) {

    var player = Player(socket.id, name, points);
    playerList[socket.id] = player;
    player.addPoint();
    console.log(player.points);

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
        var playerName = player.username.toString();
///////////////////////RPS Challenge   ->Challenger must go first ->fix error ->should refactor
        if (data.startsWith('rps')) {

            var arguments = data.split(" ");
            var opponentName = arguments[1];
            var opponent;

            for (var i in playerList) {
                if (playerList[i].username === opponentName) {
                    opponent = playerList[i];
                }
            }

            var socket = socketList[opponent.id];
            socket.emit('rpsChallenge', player.username);

            socket.on('rpsAccept', function () {
                toAllChat('RockPaperScissors between ' + player.username + ' and ' + opponent.username);

                var socket1 = socketList[player.id];
                var socket2 = socketList[opponent.id];

                socket1.emit('RPSGame');
                socket2.emit('RPSGame');


                socket1.on('RPSResult', function (data) {
                    //console.log(data);
                    player.RPSchoice = data;

                    socket2.on('RPSResult', function (data) {
                        //console.log(data);
                        opponent.RPSchoice = data;

                        var winner = RPSCalculate(player, opponent);
                        if (winner != null) {
                            toAllChat(winner.username + ' wins!');
                            winner.addPoint();
                        }
                        else {
                            toAllChat('Draw!');
                        }
                    });

                });


            })
        }

    });
///////////////////////////

    socket.on('kms', function () {
        if (playerList[socket.id] != null) {
            delete playerList[socket.id];
        }
    });

    socket.on('revive', function () {
        if (playerList[socket.id] == null) {
            playerList[socket.id] = player;
        }
    });

    socket.on('charUpdate', function (data) {
        player.char = data.charName;
    });
}