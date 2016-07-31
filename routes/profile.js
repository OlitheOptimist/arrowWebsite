var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var University = require('../models/university');
var User = require('../models/user');

var Common = require('./common');
/* GET home page. */
router.get('/', Common.isLogged(), function(req, res, next) {
	res.render('profile/profilePage', { 
		title: 'Profile Page', 
		user: req.user, 
		infoMsg: req.flash('infoMsg')
	});
});

router.get('/edit', Common.isLogged(), function(req, res, next) {
	res.render('profile/editProfile', { 
		title: 'Edit', 
		user: req.user, 
		infoMsg: req.flash('infoMsg')
	});
});

router.get('/read/university/:id', function(req, res){
 University.findById(req.params.id, function(err, uni){
  if(err)
   res.status(500);

  res.send(uni);
 });
});

router.post('/edit/name/:id', function(req, res){
	User.findById(req.params.id, function(err, user){
		console.log(req.body);
		if(err)
			res.status(500);
		if(req.body.first_name)
			user.first_name = req.body.first_name;
		if(req.body.last_name)
			user.last_name = req.body.last_name;
		user.save(function(err){
			console.log(user);
			if(err)
				res.status(500);
			res.send(user);
		});
	});
});

module.exports = router;