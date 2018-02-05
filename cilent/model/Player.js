/**
 * Created by wilso on 2018-02-03.
 */
var Player = function (id, name, adminPower) {
    var player = {
        x: 100,
        y: 100,
        id: id,
        username: name,
        admin: adminPower,
        char: 'tyler1',

        rightPress: false,
        leftPress: false,
        upPress: false,
        downPress: false,
        lastPosition: 'down',

        speed: 10
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

    return player;
};

exports.data = Player;