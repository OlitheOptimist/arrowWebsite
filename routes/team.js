var express = require('express');
var app = express.Router();
var mongoose = require('mongoose');
var Common = require('./common');

var Team = require('../models/team');

app.get('/create', Common.isLogged(), function(req, res, next) {
  res.render('team/create_team', { title: 'Create Team', user: req.user });
});

module.exports = app;