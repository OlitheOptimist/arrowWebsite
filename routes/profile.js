var express = require('express');
var router = express.Router();

var Common = require('./common');
/* GET home page. */
router.get('/', Common.isLogged(), function(req, res, next) {
	console.log(req.user);
	res.render('profile/profilePage', { 
		title: 'Profile Page', 
		user: req.user, 
		infoMsg: req.flash('infoMsg')
	});
});

module.exports = router;