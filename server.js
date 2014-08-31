var express = require('express');
var app     = express();
var http    = require('http').createServer(app);
var io      = require('socket.io')(http);
var path    = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
	res.sendFile('index.html', {'root': 'public'});
});

var users     = [];
var usersocks = [];

io.on('connection', function(socket) {
	console.log('A user has connected');
	socket.on('disconnect', function() {
		var i = usersocks.indexOf(socket);
		if(i != -1) {
			console.log("User " + i + " " + users[i] + " is being disconnected")
			users.splice(i, 1);
			usersocks.splice(i, 1);
		}
		else
			console.log("Somebody has disconnected");
	});
	socket.on('new user', function(user) {
		if(users.indexOf(user) == -1) {
			users.push(user);
			usersocks.push(socket);
			socket.emit('user added');
			io.emit('user list', users);
		}
		else {
			socket.emit('user exists');
			console.log('user' + user + 'exists');
		}
	});
	socket.on('chat message', function(msg) {
		socket.broadcast.emit('chat message', msg);
	});
});

http.listen(3000, function() {
	console.log('Listening on port 3000');
});