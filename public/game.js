// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

// Connect to the sockets.io server
var socket = io();
var user_id = null;

// Background image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
	bgReady = true;
};
bgImage.src = "images/background.png";

// Hero image
var heroReady = false;
var heroImage = new Image();
heroImage.onload = function () {
	heroReady = true;
};
heroImage.src = "images/hero.png";

// Monster image
var monsterReady = false;
var monsterImage = new Image();
monsterImage.onload = function () {
	monsterReady = true;
};
monsterImage.src = "images/monster.png";

// Game objects
var hero = {
	speed: 256 // movement in pixels per second
};
var monster = {};
var monstersCaught = 0;
var other_heroes = {};
var monster_is_caught = false;
var then = null;
var username = null;
var elapsedTime = 0;
var heroChanged = false;

var animator = {
    animations: {},
    then: null,
    addAnimation: function(name, images, timeDelay) {
        this.animations[name] = {images: images, timeDelay: timeDelay, currentImage: 0, timeElapsed: 0};
    },
    removeAnimation: function(name) {
        delete this.animations[name];
    },
    update: function() {
        for(animation in this.animations){
            var now = Date.now();
            if(then != null){
                var delta = now - then;
                this.animations[animation][timeElapsed] += delta;
                if(this.animations[animation][timeElapsed] == this.animations[animation][timeDelay]){
                    this.animations[animation][currentImage]++;
                } 
            }
        }
    }
};

// Handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);

// Reset the game when the player catches a monster
var monsterCaught = function () {
    console.log("Caught the monster!");
    monster_is_caught = true;
    socket.emit('monster_caught');
};

// Update game objects
var update = function (modifier) {
    heroDelta = {x: 0, y: 0};
	if (38 in keysDown) { // Player holding up
		hero.y -= hero.speed * modifier;
        hero.y = Math.round(hero.y);
        heroChanged = true;
	}
	if (40 in keysDown) { // Player holding down
		hero.y += hero.speed * modifier;
        hero.y = Math.round(hero.y);
        heroChanged = true;
    }
	if (37 in keysDown) { // Player holding left
		hero.x -= hero.speed * modifier;
        hero.x = Math.round(hero.x);
        heroChanged = true;
	}
	if (39 in keysDown) { // Player holding right
		hero.x += hero.speed * modifier;
        hero.x = Math.round(hero.x);
        heroChanged = true;
	}
    
    // Are they touching?
    if(!monster_is_caught){
	   if (
		  hero.x <= (monster.x + 32)
		  && monster.x <= (hero.x + 32)
		  && hero.y <= (monster.y + 32)
		  && monster.y <= (hero.y + 32)
	   ) {
		  monsterCaught();
	   }
    }
    
    animator.update();
    elapsedTime += (modifier*1000);
  
    if(heroChanged){
      if(elapsedTime >= 50){
        socket.emit('update_hero', {id: user_id, x: hero.x,y: hero.y}); 
        elapsedTime = 0;
        heroChanged = false;
      }
    }
};

socket.on('hero_update', function(data){
    if(data.id != user_id){
        other_heroes[data.id] = {username: data.username, x: data.x, y: data.y};
    }
    //Add the hero sent by the server to the array.
});

socket.on('remove_hero', function(data){
    delete other_heroes[data];
});

socket.on('reset_monster', function(data){
    monster.x = data.monster_x;
    monster.y = data.monster_y;
    monster_is_caught = false;
    monstersCaught = data.monsters;
});

// Draw everything
var render = function () {
    //Draw the game background
	if (bgReady) {
		ctx.drawImage(bgImage, 0, 0);
	}
    
    //Setup the font to draw text
    ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
    ctx.font = "24px Helvetica";
    ctx.fillText("Users:", 32,64);

    //Draw the hero and other heroes
	if (heroReady) {
		ctx.drawImage(heroImage, hero.x, hero.y);
        var i = 2;
        for(other_hero in other_heroes){
            i++
            ctx.drawImage(heroImage, other_heroes[other_hero].x, other_heroes[other_hero].y);
            ctx.font = "10px Helvetica";
            var text_width = ctx.measureText(other_heroes[other_hero].username).width;
            var box_minus_text = parseInt((32 - text_width)/2)
            ctx.fillText(other_heroes[other_hero].username, other_heroes[other_hero].x + box_minus_text, other_heroes[other_hero].y - 20);
            //Change the font size back to large and draw 
            ctx.font = "24px Helvetica";
            ctx.fillText(other_heroes[other_hero].username, 32, 32 * (i));
        }
	}

    //Draw the monster
	if (monsterReady) {
		ctx.drawImage(monsterImage, monster.x, monster.y);
	}

	// Score
	ctx.fillText("Monsters caught: " + monstersCaught, 32, 32);
};

// The main game loop
var main = function () {
	var now = Date.now();
	var delta = now - then;

	update(delta / 1000);
	render();

	then = now;

	// Request to do this again ASAP
	requestAnimationFrame(main);
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
socket.on('client_setup', function(data){
    if(user_id == null){
        if(data.id != null){
            user_id = data.id;
            other_heroes = data.users;
            monstersCaught = data.monsters;
            monster.x = data.monster_x;
            monster.y = data.monster_y;
            hero.x = canvas.width / 2;
	        hero.y = canvas.height / 2;
            username = prompt("Please input a username:");
            socket.emit('set_username', username);
            then = Date.now()
            main();
        }
    }
});

