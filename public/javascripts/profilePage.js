var app = angular.module('profile', ['ngSanitize']);

app.controller('profileCtrl', function($scope, $http){
	angular.module('PreloadedData', []).constant('User', user);
	$scope.user = {};

	$http.get('profile/read/university/' + user.university).success(function(uni){
		$scope.user.uni_name = uni.name;
	});
})