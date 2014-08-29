var express = require('express');
var app     = express();
var http    = require('http').createServer(app);
var io      = require('socket.io')(http);
var path    = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
	res.sendFile('index.html', {'root': 'public'});
});

io.on('connection', function(socket) {
	console.log('A user has connected');
	socket.on('disconnect', function() {
		console.log('A user has disconnected');
	});
	socket.on('chat message', function(msg) {
		socket.broadcast.emit('chat message', msg);
	});
});

http.listen(3000, function() {
	console.log('listening on port 3000');
});