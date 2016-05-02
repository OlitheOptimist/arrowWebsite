var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/about', function(req, res, next) {
  res.render('main/about', { title: 'About' });
});

router.get('/tournaments', function(req, res, next) {
  res.render('main/tournaments', { title: 'Tournaments' });
});

module.exports = router;