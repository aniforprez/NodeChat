// Initialization of the modules
var express      = require('express');
var app          = express();
var http         = require('http').createServer(app);
var io           = require('socket.io')(http);
var path         = require('path');
var randomstring = require("randomstring");

// Middleware initialisation
// app.use allows express to serve the files inside a directory to the client
app.use(express.static(path.join(__dirname, 'public')));
// this sends the specified file to the client
app.get('/', function(req, res) {
	res.sendFile('index.html', {'root': 'public'});
});

var allUsers       = [];
var userSockets    = [];
var availableUsers = [];

io.on('connection', function(socket) {
	socket.on('disconnect', function() {
		var i = userSockets.indexOf(socket);
		if(i > -1) {
			var j = availableUsers.indexOf(allUsers[i]);
			availableUsers.splice(j, 1);
			allUsers.splice(i, 1);
			userSockets.splice(i, 1);
		}
		io.emit('user list', availableUsers);
	});
	socket.on('new user', function(user) {
		if(allUsers.indexOf(user) == -1) {
			allUsers.push(user);
			availableUsers.push(user);
			userSockets.push(socket);
			socket.emit('user added');
			io.emit('user list', availableUsers);
		}
		else {
			socket.emit('user exists');
		}
	});
	socket.on('chat message', function(msg) {
		if(socket.rooms.length <= 1)
			socket.broadcast.emit('chat message', msg);
		else
			socket.broadcast.to(socket.rooms[1]).emit('chat message', msg);
	});
	socket.on('chat with', function(user) {
		var userInvitee = getSocketFromUsername(user);
		userInvitee.emit('invitation', getUsernameFromSocket(socket));
	});
	socket.on('chat accepted', function(inviter) {
		var inviterSocket = getSocketFromUsername(inviter);
		if(inviterSocket.rooms.length <= 1) {
			var newRoom = randomstring.generate(5);
			inviterSocket.join(newRoom);
			socket.join(newRoom);
			availableUsers.splice(availableUsers.indexOf(inviter), 1);
			availableUsers.splice(availableUsers.indexOf(getUsernameFromSocket(socket)), 1);
			io.emit('user list', availableUsers);
		}
		else {
			socket.join(inviterSocket.rooms[1]);
			availableUsers.splice(availableUsers.indexOf(getUsernameFromSocket(socket)), 1);
			io.emit('user list', availableUsers);
		}
	});
});

var getSocketFromUsername = function(username) {
	return userSockets[allUsers.indexOf(username)];
};

var getUsernameFromSocket = function(socket) {
	return allUsers[userSockets.indexOf(socket)];
}

http.listen(3000, function() {
	console.log('Listening on port 3000');
});