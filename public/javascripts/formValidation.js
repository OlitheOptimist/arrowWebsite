'use strict';

var app = angular.module('validation', ['ngSanitize', 'ui.select']);

app.filter('propsFilter', function() {
	return function(items, props) {
		var out = [];

		if (angular.isArray(items)) {
			items.forEach(function(item) {
				var itemMatches = false;

				var keys = Object.keys(props);
				for (var i = 0; i < keys.length; i++) {
					var prop = keys[i];
					var text = props[prop].toLowerCase();
					if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
						itemMatches = true;
						break;
					}
				}

				if (itemMatches) {
					out.push(item);
				}
			});
		} else {
			// Let the output be the input untouched
			out = items;
		}

		return out;
	}
});

app.controller('registerValidation', function($scope, $http){

	$scope.SubmitForm = function()
	{
		
		if($scope.regForm.$valid){
			if($scope.reg.university)
				$scope.reg.university = $scope.reg.university._id;
			console.log("Yes");
		}
		console.log($scope.reg);
	}

	// Uni List native functions/variables
	$scope.reg = { university: undefined };
	$scope.disabled = undefined;
	$scope.enable = function(){ $scope.disabled = false; };
	$scope.disable = function(){ $scope.disabled = true; };
	$scope.clear = function(){};


	$scope.university = {};
	$scope.uniList = [];
	$http.get('valid/university').then(
		function(res){
				$scope.uniList = res.data;
		},
		function(){
			console.log('Error getting the uni list');
		}
	);

});

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
