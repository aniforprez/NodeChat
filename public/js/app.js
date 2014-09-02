var app = angular.module('nodechat', ['ngAnimate']);

app.controller('chat', function($scope){
	$scope.thisuser = '';
	$scope.users    = [];
	$scope.msgs     = [];

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

	$scope.chooseUser = function(index) {
		socket.emit('chat with', $scope.users[index]);
	};

	$scope.acceptInvite = function(inviter) {
		socket.emit('chat accepted', inviter);
	}

	socket.on('chat message', function(msg) {
		$scope.msgs.push(msg);
		$scope.$apply();
	});

	socket.on('user added', function() {
		$scope.thisuser = $scope.usertext;
		$('#usermodal').modal('hide');
	});

	socket.on('user exists', function() {
		console.log('user exists');
		$scope.usertext = '';
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
});

angular.element(document).ready(function() {
	angular.bootstrap(document, ['nodechat']);
});