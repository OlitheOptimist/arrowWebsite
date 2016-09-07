var app = angular.module('profile', ['ngSanitize']);

app.directive('pw', function(){
	return {
		require: 'ngModel',
		link: function (scope, elem, attrs, model){
			if(!attrs.pw)
				return;
			scope.$watch(attrs.pw, function(value){
				if(model.$viewValue !== undefined && model.$viewValue !== '')
					model.$setValidity('pw', value === model.$viewValue);
			});
			model.$parsers.push(function(value){
				if (value === undefined || value === '')
				{
					model.$setValidity('pw', true);
					return value;
				}
				var isValid = value === scope.$eval(attrs.pw);
				model.$setValidity('pw', isValid);
				return isValid ? value : undefined;
			});
		}
	};
});

app.controller('profileControl', function($scope, $http){
	angular.module('PreloadedData', []).constant('User', user);
	$scope.user = {};
	$scope.name = {first_name: user.first_name, last_name: user.last_name};
	$scope.successName = false;

	$scope.changeName = function(valid){
		console.log($scope.name);
		$scope.name.submitted = true;
		if(valid){
			$http.post('edit/name/' + user._id, $scope.name).success(function(user){
				$scope.user = user;
				$scope.successName = true;
			});
		}
	}	
});