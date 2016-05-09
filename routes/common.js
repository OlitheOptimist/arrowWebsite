var mongoose = require('mongoose');
var University = require('../models/university');

function Common(){}

Common.prototype.isLogged = function(){
	return function(req, res, next){
		if(!req.isAuthenticated || !req.isAuthenticated()){
			res.redirect('/auth/login');
		} else {
			next();
		}
	}
}

Common.prototype.isNotLogged = function(){
	return function(req, res, next){
		if(!req.isAuthenticated || !req.isAuthenticated()){
			next();
		} else {
			res.redirect('/');			
		}
	}
}

Common.prototype.checkUni = function(id){
	return function(req, res){
		University.findById(id, function(err, res){
			if(err)
				res.json(500, {message: err});
			
			if(!res)
				res.json(500, {message: 'Not a valid University'})
			
			res.json(200);
		});
	}
}

module.exports = new Common();