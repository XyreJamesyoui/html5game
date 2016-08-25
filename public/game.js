// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

//Connect to sockets.io
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

// Handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);

// Reset the game when the player catches a monster
var goblinCaught = function () {
    console.log("Caught the goblin!");
    monster_is_caught = true;
    socket.emit('goblin_caught');
};

// Update game objects
var update = function (modifier) {
	if (38 in keysDown) { // Player holding up
		hero.y -= hero.speed * modifier;
        socket.emit('update_hero', {id: user_id, x: hero.x,y: hero.y});    
        console.log("Sending this heroes location update");
	}
	if (40 in keysDown) { // Player holding down
		hero.y += hero.speed * modifier;
        socket.emit('update_hero', {id: user_id, x: hero.x,y: hero.y});    
        console.log("Sending this heroes location update");
	}
	if (37 in keysDown) { // Player holding left
		hero.x -= hero.speed * modifier;
        socket.emit('update_hero', {id: user_id, x: hero.x,y: hero.y});    
        console.log("Sending this heroes location update");
	}
	if (39 in keysDown) { // Player holding right
		hero.x += hero.speed * modifier;
        socket.emit('update_hero', {id: user_id, x: hero.x,y: hero.y});    
        console.log("Sending this heroes location update");
	}
    
    // Are they touching?
    if(!monster_is_caught){
	   if (
		  hero.x <= (monster.x + 32)
		  && monster.x <= (hero.x + 32)
		  && hero.y <= (monster.y + 32)
		  && monster.y <= (hero.y + 32)
	   ) {
		  goblinCaught();
	   }
    }
};

socket.on('hero_update', function(data){
    console.log("Updating other heroes");
    if(data.id != user_id){
        console.log(data.x + " " + data.y)
        other_heroes[data.id] = {username: data.username, x: data.x, y: data.y};
    }
    console.log(other_heroes);
    //Add the hero sent by the server to the array.
});

socket.on('remove_hero', function(data){
    console.log("Removing user " + data);
    delete other_heroes[data];
    console.log(other_heroes);
});

socket.on('reset_goblin', function(data){
    console.log("Resetting goblin");
    monster.x = data.goblin_x;
    monster.y = data.goblin_y;
    monster_is_caught = false;
    monstersCaught = data.goblins;
});

// Draw everything
var render = function () {
    ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.font = "24px Helvetica";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	if (bgReady) {
		ctx.drawImage(bgImage, 0, 0);
	}

	if (heroReady) {
		ctx.drawImage(heroImage, hero.x, hero.y);
        var i = 0;
        for(other_hero in other_heroes){
            i++;
            console.log("Drawing hero " + other_hero + " at " + other_heroes[other_hero].x + " " + other_heroes[other_hero].y);
            ctx.drawImage(heroImage, other_heroes[other_hero].x, other_heroes[other_hero].y);
            ctx.fillText("Users: " + other_heroes[other_hero].username, 32, 32 * (i+1));
        }
        //Use a loop to draw each hero in the other_heroes array
	}

	if (monsterReady) {
		ctx.drawImage(monsterImage, monster.x, monster.y);
	}

	// Score
	ctx.fillText("Goblins caught: " + monstersCaught, 32, 32);
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
            console.log(data.id);
            console.log(data.users);
            other_heroes = data.users;
            monstersCaught = data.goblins;
            monster.x = data.goblin_x;
            monster.y = data.goblin_y;
            hero.x = canvas.width / 2;
	        hero.y = canvas.height / 2;
            username = prompt("Please input a username:");
            socket.emit('set_username', username);
            then = Date.now()
            main();
        }
    }
});

