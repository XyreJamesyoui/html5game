// Setup basic express server 
var express = require('express'); 
var app = express(); 
var server = require('http').createServer(app); 
var io = require('socket.io')(server); 
var port = process.env.PORT || 25565;  
 
server.listen(port, function () { 
  console.log('Server listening at port %d', port); 
}); 

// Routing 
app.use(express.static(__dirname + '/public')); 

var connected_users = {};
var monsters_caught = 0;
var monster_x = 32 + (Math.random() * (512 - 64));
var monster_y = 32 + (Math.random() * (480 - 64));

// Socket.io
io.on('connection', function (socket) {
    var user_id = Math.random();
    var username = null;
    socket.emit('client_setup', {id: user_id, users: connected_users, monsters: monsters_caught, monster_x: monster_x, monster_y: monster_y});
    console.log("User connected to server");
    socket.on('set_username', function(data){
        console.log(user_id + "'s username set to " + data);
        username = data;
        connected_users[user_id] = {username: data, x: 256, y: 240};
        io.sockets.emit('hero_update', {id: user_id, username: username, x: 256, y: 240});
    });
    socket.on('update_hero', function(data){
        console.log("Recieved a hero update");
        connected_users[user_id] = {username: username, x: data.x, y: data.y};
        console.log("Sending hero location updates");
        io.sockets.emit('hero_update', {id: user_id, username: username, x: data.x, y: data.y});
    });
    socket.on('monster_caught', function() {
        console.log("Monster caught by " + user_id + "!");
        monsters_caught++;
        monster_x = 32 + (Math.random() * (512 - 64));
        monster_y = 32 + (Math.random() * (480 - 64));
        io.sockets.emit('reset_monster', {monster_x: monster_x, monster_y: monster_y, monsters: monsters_caught});
    });
    socket.on('disconnect', function() {
        delete connected_users[user_id];
        io.sockets.emit('remove_hero', user_id);
    });
});