var socket = io();

var signDiv = document.getElementById('signDiv');
var signDivUser = document.getElementById('signDiv-user');
var signDivPass = document.getElementById('signDiv-pass');
var signDivSignIn = document.getElementById('signDiv-signIn');
var signDivSignUp = document.getElementById('signDiv-signUp');
var kmsButton = document.getElementById('kms-button');
var reviveButton = document.getElementById('revive-button')
var timeStamp = document.getElementById('timeStamp');
var playerListDisplay = document.getElementById('player-list');

//RPS Challenge

var RPSBox = document.getElementById('RPSChallenge');
var RPSMessage = document.getElementById('challengeMessage');
var RPSAccept = document.getElementById('RPSAccept');
var RPSDecline = document.getElementById('RPSDecline');
var RPSGame = document.getElementById('RPSGame');

var RPSRock = document.getElementById('RPSRock');
var RPSPaper = document.getElementById('RPSPaper');
var RPSScissors = document.getElementById('RPSScissors');

//Images
var charImg = new Image();
charImg.src = '/cilent/sprites/Tyler1.png';
var imgFrameIndex = 50;
var imgWidth = 50;
var imgHeight = 60;


signDivSignIn.onclick = function () {
    socket.emit('signIn', {user: signDivUser.value.trim(), pass: signDivPass.value.trim()});
};

signDivSignUp.onclick = function () {
    socket.emit('signUp', {user: signDivUser.value.trim(), pass: signDivPass.value.trim()});
};

kmsButton.onclick = function () {
    socket.emit('kms');
};

reviveButton.onclick = function () {
    socket.emit('revive');
};


socket.on('signUpResponse', function (data) {
    if (data.success) {
        alert("Sign Up Successful! Log in with Your Username and Password!")
    }
    else
        alert("Sign Up unsuccessful! Name already taken!");

});

socket.on('signInResponse', function (data) {
    if (data.success) {
        signDiv.style.display = 'none';
        gameDiv.style.display = 'inline-block';
    }
    else
        alert("Sign in unsuccessful");

});


var chatText = document.getElementById('chat-text');
var chatForm = document.getElementById('chat-form');
var chatInput = document.getElementById('chat-input');

var canvas = document.getElementById('myCanvas').getContext("2d");
canvas.font = '15px Arial';


socket.on('addToChat', function (data) {
    chatText.innerHTML += '<div>' + data + '</div>';
});

chatForm.onsubmit = function (event) {
    event.preventDefault();
    if (chatInput.value.substring(0, 1) === "/")
        socket.emit('sendCommandToServer', chatInput.value.substring(1, chatInput.value.length));

    socket.emit('sendMsgToServer', chatInput.value);

    chatInput.value = '';
};


socket.on('playersInfo', function (data) {
    canvas.clearRect(0, 0, 800, 500);

    playerListDisplay.innerHTML = '';


    for (var player of data) {
        canvas.fillText(player.username, player.x, player.y);
        playerListDisplay.innerHTML += '<div>' + player.username + '</div>';


        drawChar(player);
    }
});


// RPS Challenge

socket.on('rpsChallenge', function (data) {

    RPSMessage.innerHTML = ('Rock Paper Scissors Challenge from ' + data);
    RPSBox.style.display = 'inline-block';

    RPSAccept.onclick = function () {
        socket.emit('rpsAccept');

        RPSBox.style.display = 'none';
    };

    RPSDecline.onclick = function () {
        //socket.emit('rpsDecline');

        RPSBox.style.display = 'none';
    };


});

socket.on('RPSGame', function () {
    RPSGame.style.display = 'inline-block';
});


RPSRock.onclick = function () {
    socket.emit('RPSResult', 'Rock');
    RPSGame.style.display = 'none';
};

RPSPaper.onclick = function () {
    socket.emit('RPSResult', 'Paper');
    RPSGame.style.display = 'none';
};

RPSScissors.onclick = function () {
    socket.emit('RPSResult', 'Scissors');
    RPSGame.style.display = 'none';
};

//RPS Challenge


socket.on('Time', function () {
    var date = Date().slice(4, 24);
    timeStamp.innerHTML = date;
});


document.onkeydown = function (event) {
    if (event.keyCode === 68) //d
        socket.emit('keyPress', {inputId: 'right', state: true});
    else if (event.keyCode === 83)  //s
        socket.emit('keyPress', {inputId: 'down', state: true});
    else if (event.keyCode === 65) //a
        socket.emit('keyPress', {inputId: 'left', state: true});
    else if (event.keyCode === 87) //w
        socket.emit('keyPress', {inputId: 'up', state: true});
};

document.onkeyup = function (event) {
    if (event.keyCode === 68) //d
        socket.emit('keyPress', {inputId: 'right', state: false});
    else if (event.keyCode === 83)  //s
        socket.emit('keyPress', {inputId: 'down', state: false});
    else if (event.keyCode === 65) //a
        socket.emit('keyPress', {inputId: 'left', state: false});
    else if (event.keyCode === 87) //w
        socket.emit('keyPress', {inputId: 'up', state: false});
};

function drawChar(player) {

    var playersImg = new Image();
    playersImg.src = '/cilent/sprites/' + player.char + '.png';

    switch (player.lastPosition) {
        case 'down':
            canvas.drawImage(playersImg, 0, 0, imgWidth, imgHeight, player.x, player.y, imgWidth, imgHeight);
            break;
        case 'up':
            canvas.drawImage(playersImg, imgFrameIndex * 1, 0, imgWidth, imgHeight, player.x, player.y, imgWidth, imgHeight);
            break;
        case 'left':
            canvas.drawImage(playersImg, imgFrameIndex * 2, 0, imgWidth, imgHeight, player.x, player.y, imgWidth, imgHeight);
            break;
        case 'right':
            canvas.drawImage(playersImg, imgFrameIndex * 3, 0, imgWidth, imgHeight, player.x, player.y, imgWidth, imgHeight);
            break;
    }
}

function UpdateCharModel(name) {
    charImg.src = '/cilent/sprites/' + name + '.png';
    socket.emit('charUpdate', {charName: name});
}
