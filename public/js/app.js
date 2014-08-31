var app = angular.module('nodechat', []);

app.controller('chat', function($scope){
	$scope.users = [];
	$scope.msgs = [];

	var socket = io();

	$('#usermodal').modal({
		backdrop: 'static',
		keyboard: 'diable',
		show    : false
	});

	socket.on('connect', function() {
		$('#usermodal').modal('show');
	});

	$scope.setUser = function() {
		if($scope.usertext) {
			socket.emit('new user', $scope.usertext);
		}
	};

	$scope.msgSend = function() {
		if($scope.msgtext) {
			socket.emit('chat message', $scope.msgtext);
			$scope.msgs.push($scope.msgtext);
			$scope.msgtext = '';
		}
	};

	socket.on('chat message', function(msg) {
		$scope.msgs.push(msg);
		$scope.$apply();
	});

	socket.on('user added', function() {
		$('#usermodal').modal('hide');
	});

	socket.on('user exists', function() {
		console.log('user exists');
		$scope.usertext = '';
		$scope.$apply();
	});

	socket.on('user list', function(userlist) {
		$scope.users = userlist;
		$scope.$apply();
	});
});

angular.element(document).ready(function() {
	angular.bootstrap(document, ['nodechat']);
});