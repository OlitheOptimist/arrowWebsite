var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/about', function(req, res, next) {
  res.render('main/about', { title: 'About', user: req.user });
});

router.get('/tournaments', function(req, res, next) {
  res.render('main/tournaments', { title: 'Tournaments', user: req.user });
});

router.get('/tournaments/arrow', function(req, res, next) {
  res.render('main/tournamentPage', { title: 'Tournaments', user: req.user });
});

router.get('/', function(req, res, next) {
  res.render('main/home', { title: 'Tournaments', user: req.user });
});

router.get('/default_error', function(req, res, next) {
  res.render('default_error', { title: 'Default Error', user: req.user, errMsg: req.flash('errMsg') });
});



module.exports = router;
