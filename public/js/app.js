var app = angular.module('nodechat', ['ngAnimate']);

app.controller('chat', function($scope){
	$scope.thisuser  = '';
	$scope.users     = [];
	$scope.msgs      = [];
	$scope.room      = '';
	$scope.roommates = [];

	var socket = io();

	toastr.options = {
		"closeButton": true,
		"debug": false,
		"positionClass": "toast-top-right",
		"showDuration": "100",
		"hideDuration": "1000",
		"timeOut": "5000",
		"extendedTimeOut": "2000",
		"showEasing": "linear",
		"hideEasing": "linear",
		"showMethod": "slideDown",
		"hideMethod": "hide"
	};

	$('#usermodal').modal({
		backdrop: 'static',
		keyboard: 'diable',
		show    : false
	});

	socket.on('connect', function() {
		$('#usermodal').modal('show');
	});

	$scope.setUser = function() {
		if($scope.userInput) {
			socket.emit('new user', $scope.userInput);
		}
	};

	$scope.msgSend = function() {
		if($scope.msgInput) {
			socket.emit('chat message', $scope.msgInput);
			$scope.msgs.push($scope.msgInput);
			$scope.msgInput = '';
		}
	};

	$scope.chooseUser = function(index) {
		socket.emit('chat with', $scope.users[index]);
	};

	$scope.acceptInvite = function(inviter) {
		socket.emit('chat accepted', inviter);
	};

	$scope.leaveChat = function() {
		socket.emit('leave room', room);
	};

	socket.on('chat message', function(msg) {
		$scope.msgs.push(msg);
		$scope.$apply();
	});

	socket.on('user added', function() {
		$scope.thisuser = $scope.userInput;
		$('#usermodal').modal('hide');
	});

	socket.on('user exists', function() {
		console.log('user exists');
		$scope.userInput = '';
		$scope.$apply();
	});

	socket.on('user list', function(userlist) {
		if(userlist.indexOf($scope.thisuser) > -1)
			userlist.splice(userlist.indexOf($scope.thisuser), 1);
		$scope.users = userlist;
		$scope.$apply();
	});

	socket.on('invitation', function(inviter) {
		var thisToast = toastr.info("Click to join", inviter + " has invited you to chat");
		thisToast.click(function() {
			$scope.acceptInvite(inviter);
		});
	});

	socket.on('joined', function(roomData) {
		$scope.msgs = [];
		$scope.roommates = roomData.users;
		$scope.room      = roomData.room;
		$scope.$apply();
	});

	socket.on('user quit', function(user) {
		$scope.roommates.splice($scope.roommates.indexOf(user, 1));
		$scope.$apply();
	});

	socket.on('room empty', function() {
		$scope.msgs      = [];
		$scope.room      = '';
		$scope.roommates = [];
		$scope.$apply();
	});

	socket.on('left room', function() {
		$scope.msgs      = [];
		$scope.room      = '';
		$scope.roommates = [];
		$scope.$apply();
	});

	socket.on('new user', function(user) {
		if($scope.roommates.indexOf(user) == -1)
			$scope.roommates.push(user);
		console.log($scope.roommates);
	});

	socket.on('disconnect', function() {
		console.log("disconnected");
	});
});

angular.element(document).ready(function() {
	angular.bootstrap(document, ['nodechat']);
});