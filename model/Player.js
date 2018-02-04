/**
 * Created by wilso on 2018-02-03.
 */
var Player = function(id,name, adminPower){
    var self = {
        x: 100,
        y: 100,
        id:id,
        username: name,
        admin:adminPower,
        char: 'tyler1',

        rightPress:false,
        leftPress:false,
        upPress:false,
        downPress:false,
        lastPosition:'down',

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