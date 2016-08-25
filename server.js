// Setup basic express server 
var express = require('express'); 
var app = express(); 
var server = require('http').createServer(app); 
var io = require('socket.io')(server); 
var port = process.env.PORT || 3000;  
 
server.listen(port, function () { 
  console.log('Server listening at port %d', port); 
}); 

// Routing 
app.use(express.static(__dirname + '/public')); 

var connected_users = {};
var goblins_caught = 0;
var goblin_x = 32 + (Math.random() * (512 - 64));
var goblin_y = 32 + (Math.random() * (480 - 64));

// Socket.io
io.on('connection', function (socket) {
    var user_id = Math.random();
    socket.emit('client_setup', {id: user_id, users: connected_users, goblins: goblins_caught, goblin_x: goblin_x, goblin_y: goblin_y});
    connected_users[user_id] = {x: 256, y: 240};
    io.sockets.emit('hero_update', {id: user_id, x: 256, y: 240});
    console.log("User connected to server");
    socket.on('set_username', function(data){
        console.log(user_id + "'s username set to " + data);
        connected_users[user_id].username = data;
    });
    socket.on('update_hero', function(data){
        console.log("Recieved a hero update");
        connected_users[data.id] = {x: data.x, y: data.y};
        console.log("Sending hero location updates");
        io.sockets.emit('hero_update', {id: data.id, username: connected_users[data.id].username, x: data.x, y: data.y});
    });
    socket.on('goblin_caught', function() {
        console.log("Goblin caught by " + user_id + "!");
        goblins_caught++;
        goblin_x = 32 + (Math.random() * (512 - 64));
        goblin_y = 32 + (Math.random() * (480 - 64));
        io.sockets.emit('reset_goblin', {goblin_x: goblin_x, goblin_y: goblin_y, goblins: goblins_caught});
    });
    socket.on('disconnect', function() {
        delete connected_users[user_id];
        io.sockets.emit('remove_hero', user_id);
    });
});