'use strict';

var app = angular.module('validation', ['ngSanitize', 'ui.select'])

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
	// Uni List native functions/variables
	$scope.reg = { university: undefined };
	$scope.reg.email = $scope.reg.uni_email;
	$scope.disabled = undefined;
	$scope.enable = function(){ $scope.disabled = false; };
	$scope.disable = function(){ $scope.disabled = true; };
	$scope.clear = function(){};

	$scope.uniList = [];
	$http.get('valid/university').then(
		function(res){
				$scope.uniList = res.data;
		},
		function(){
			console.log('Error getting the uni list');
		}
	);

	$scope.autofill = function(){
		if(angular.element('input[name=email]').hasClass('ng-pristine'))
			$scope.reg.email = $scope.reg.uni_email;
	}

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
