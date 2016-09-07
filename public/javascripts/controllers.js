var app = angular.module('controllers', ['ngSanitize']);

app.controller('profileCtrl', function($scope, $http){
	angular.module('PreloadedData', []).constant('User', user);
	$scope.user = {};

	$http.get('/profile/read/university/' + user.university).success(function(uni){
		$scope.user.uni_name = uni.name;
	});
});

app.controller('teamCtrl', function($scope, $http){
	angular.module('PreloadedData', []).constant('User', user);
	$scope.user = {};

	$http.get('/profile/read/university/' + user.university).success(function(uni){
		$scope.user.uni_name = uni.name;
	});
});