var app = angular.module('nodechat', ['ui.bootstrap']);

app.controller('chat', function($scope){
	$scope.users = [];
	$scope.msgs = [];

	var socket = io();

	$scope.msgsend = function() {
		if($scope.msgtext) {
			socket.emit('chat message', $scope.msgtext);
			$scope.msgs.push($scope.msgtext);
			$scope.msgtext = '';
		}
	}

	socket.on('chat message', function(msg) {
		$scope.msgs.push(msg);
		$scope.$apply();
	});
});