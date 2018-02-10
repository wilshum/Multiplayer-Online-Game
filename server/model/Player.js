/**
 * Created by wilso on 2018-02-03.
 */
var Player = function (id, name, adminPower) {
    var player = {
        x: X_STARTING_POS,
        y: Y_STARTING_POS,
        id: id,
        username: name,
        admin: adminPower,
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

    return player;
};

