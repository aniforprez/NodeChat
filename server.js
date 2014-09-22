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
var existingRooms  = [];

io.on('connection', function(socket) {
	socket.on('disconnect', function() {
		var i = userSockets.indexOf(socket);

		if(i > -1) {
			var room = socket.rooms[1];
			console.log(socket.rooms[1]);
			if(room !== 'public') {
				var roomIndex    = getRoomIndex(room);
				var quitterUser  = getUsernameFromSocket(socket);
				var quitterIndex = existingRooms[roomIndex].members.indexOf(quitterUser);

				existingRooms[roomIndex].members.splice(quitterIndex, 1);
				availableUsers.push(quitterUser);

				io.to(room).emit('user quit', quitterUser);

				if(existingRooms[roomIndex].members.length <= 1) {
					var lonesomeUser   = existingRooms[roomIndex].members[0];
					var lonesomeSocket = getSocketFromUsername(lonesomeUser);

					lonesomeSocket.leave(room, function() {
						lonesomeSocket.join('public');
					});

					existingRooms.splice(roomIndex, 1);
					availableUsers.push(lonesomeUser);

					lonesomeSocket.emit('room empty');
				}
			}

			var j = availableUsers.indexOf(allUsers[i]);
			if(j > -1)
				availableUsers.splice(j, 1);

			allUsers.splice(i, 1);
			userSockets.splice(i, 1);
		}

		for(var k = 0; k < userSockets.length; k++)
			userSockets[k].emit('user list', availableUsers);
	});
	socket.on('new user', function(user) {
		if(allUsers.indexOf(user) == -1) {
			allUsers.push(user);
			availableUsers.push(user);
			userSockets.push(socket);

			socket.join('public');

			socket.emit('user added');
			for(var j = 0; j < userSockets.length; j++)
				userSockets[j].emit('user list', availableUsers);
		}
		else {
			socket.emit('user exists');
		}
	});
	socket.on('chat message', function(msg) {
		socket.broadcast.to(socket.rooms[1]).emit('chat message', {sender: getUsernameFromSocket(socket), message: msg});
	});
	socket.on('chat with', function(user) {
		var userInvitee = getSocketFromUsername(user);

		userInvitee.emit('invitation', getUsernameFromSocket(socket));
	});
	socket.on('chat accepted', function(inviter) {
		var inviterSocket = getSocketFromUsername(inviter);
		var invitee       = getUsernameFromSocket(socket);
		var newRoom       = "";

		socket.leave('public');

		if(inviterSocket.rooms[1] == 'public') {
			newRoom = randomstring.generate(5);

			inviterSocket.leave('public');
			inviterSocket.join(newRoom, function() {
				var roomData = {roomID: newRoom, members: [inviter]};

				existingRooms.push(roomData);

				inviterSocket.emit('joined', {users: getRoomMembers(newRoom), room: newRoom});
				io.to(newRoom).emit('new user', inviter);

				socket.join(newRoom, function() {
					existingRooms[getRoomIndex(newRoom)].members.push(invitee);
					availableUsers.splice(availableUsers.indexOf(invitee), 1);

					socket.emit('joined', {users: getRoomMembers(newRoom), room: newRoom});
					io.to(newRoom).emit('new user', invitee);
					for(var j = 0; j < userSockets.length; j++)
						userSockets[j].emit('user list', availableUsers);
				});
				availableUsers.splice(availableUsers.indexOf(inviter), 1);
			});
		}
		else {
			newRoom = inviterSocket.rooms[1];

			socket.join(newRoom, function() {
				existingRooms[getRoomIndex(newRoom)].members.push(invitee);
				availableUsers.splice(availableUsers.indexOf(invitee), 1);

				socket.emit('joined', {users: getRoomMembers(newRoom), room: newRoom});
				io.to(newRoom).emit('new user', invitee);
				for(var j = 0; j < userSockets.length; j++)
					userSockets[j].emit('user list', availableUsers);
			});
		}
	});

	socket.on('leave room', function(room) {
		socket.leave(socket.rooms[1], function() {
			socket.join('public', function() {
				socket.emit('left room');
			});

			var roomIndex    = getRoomIndex(room);
			var quitterUser  = getUsernameFromSocket(socket);
			var quitterIndex = existingRooms[roomIndex].members.indexOf(quitterUser);

			existingRooms[roomIndex].members.splice(quitterIndex, 1);
			availableUsers.push(quitterUser);

			io.to(room).emit('user quit', quitterUser);

			if(existingRooms[roomIndex].members.length <= 1) {
				var lonesomeUser   = existingRooms[roomIndex].members[0];
				var lonesomeSocket = getSocketFromUsername(lonesomeUser);

				lonesomeSocket.leave(room, function() {
					lonesomeSocket.join('public');
				});

				existingRooms.splice(roomIndex, 1);
				availableUsers.push(lonesomeUser);

				lonesomeSocket.emit('room empty');
			}

			for(var j = 0; j < userSockets.length; j++)
				userSockets[j].emit('user list', availableUsers);
		});
	});
});

var getSocketFromUsername = function(username) {
	return userSockets[allUsers.indexOf(username)];
};

var getUsernameFromSocket = function(socket) {
	return allUsers[userSockets.indexOf(socket)];
};

var getRoomMembers = function(searchRoomID) {
	for(var i = 0; i < existingRooms.length; i++) {
		if(existingRooms[i].roomID === searchRoomID) {
			return existingRooms[i].members;
		}
	}
};

var getRoomIndex = function(searchRoomID) {
	for(var i = 0; i < existingRooms.length; i++) {
		if(existingRooms[i].roomID === searchRoomID) {
			return i;
		}
	}
};

var port = process.env.PORT || 3000;

http.listen(port, function() {
	console.log('Listening on port ' + port);
});