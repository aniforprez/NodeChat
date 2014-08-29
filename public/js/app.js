var socket = io();
$('form').submit(function() {
	var message = $('#msgtext').val();
	socket.emit('chat message', message);
	$('#messages').append($('<li>').text(message));
	$('#msgtext').val("");
	return false;
});
socket.on('chat message', function(msg) {
	$('#messages').append($('<li>').text(msg));
});