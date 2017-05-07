var express = require('express');
var app =  express();
var serv = require('http').Server(app);



app.get('/',function(req,res){
    res.sendFile(__dirname + '/cilent/index.html');
});

app.use('/cilent', express.static(__dirname + '/cilent'));

serv.listen(process.env.PORT || 4321);

console.log('Server Started');

var SocketList = {};
var PlayerList = {};

var Player = function(id,name){
    var self = {
        x: 250,
        y: 250,
        id:id,
        username: name,

        rightPress:false,
        leftPress:false,
        upPress:false,
        downPress:false,

        Spd: 10
    }

    self.updatePosition = function(){
        if (self.rightPress)
            self.x += self.Spd;
        if (self.leftPress)
            self.x -= self.Spd;
        if (self.upPress)
            self.y -= self.Spd;
        if (self.downPress)
            self.y += self.Spd;
        }

    return self;
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){

    socket.id = Math.random();
    SocketList[socket.id] = socket;
    console.log(socket.id + " has connected");

    socket.on('signIn',function(data){


        if(true) {
            Player.onConnect(socket, data.user);
            socket.emit('signInResponse', {success: true});
        }
        else
            socket.emit('signInResponse',{success:false});
    });



    socket.on('disconnect',function(){
       delete SocketList[socket.id];
       delete PlayerList[socket.id];
       console.log(socket.id + " has disconnected")
    });

    socket.on('kms',function(){
    	delete PlayerList[socket.id];
    });


});

setInterval(function(){
    var pack = [];

        for (var i in PlayerList){
            var player = PlayerList[i];
            player.updatePosition();
            pack.push({
                x: player.x,
                y: player.y,
                username: player.username
            });
        }

        for (var i in SocketList) {
            var socket = SocketList[i];
            socket.emit('Move', pack);
        }
}, 10);

Player.onConnect = function(socket, name){

    var player = Player(socket.id, name);
    PlayerList[socket.id] = player;

    socket.on('keyPress',function(data){
        if (data.inputId === 'right')
            player.rightPress = data.state;
        else if (data.inputId === 'left')
            player.leftPress = data.state;
        else if (data.inputId === 'up')
            player.upPress = data.state;
        else if (data.inputId === 'down')
            player.downPress = data.state;

    });

    socket.on('sendMsgToServer',function(data){
        var playerName = ("" + player.username);

        for (var i in SocketList){
            SocketList[i].emit('addToChat', playerName + ': ' + data);
        }
    });
}