var express = require('express');
var app = express.Router();
var passport = require('passport');
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;
var bCrypt = require('bcrypt-nodejs');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var smtpTransport = nodemailer.createTransport("smtps://ctmalexbatorykleliw%40gmail.com:ntR759Cf-@smtp.gmail.com");
var University = require('../models/university');
var Common = require('./common');

/* Authentication */
var isValidPassword = function(user, password)
{
    return bCrypt.compareSync(password, user.password);
}

var createHash = function(password)
{
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

passport.use('login', new LocalStrategy({
    passReqToCallback : true,
    usernameField: 'email'
},
function(req, email, password, done){
    User.findOne({ 'email': email }, function(err, user){
        if (err)
            return done(err);
        if (!user)
            return done(null, false, req.flash('errMsg', 'User not found. Please try again.'));
        if (!user.validatePassword(password))
            return done(null, false, req.flash('errMsg', 'Incorrect Username or Password.'));

        return done(null, user);
    });
}
));

passport.use('register', new LocalStrategy({ 
    passReqToCallback : true,
    usernameField: 'email'
},
function(req, email, password, done){

    process.nextTick(function(){

        User.findOne({ 'email': email }, function(err, user){

            if(err)
                return done(err);
            if(user)
                return done(null, false, req.flash('errMsg', 'That email is taken. Please try again.'));
            if(req.body.university)
                if(!Common.checkUni(req.body.university))
                    return done(null, false, req.flash('errMsg', 'That is not a valid university. Please try again.'));
            else
            {
                var newUser = new User();
                newUser.email = email;
                newUser.verify_primary_token = crypto.randomBytes(20).toString('hex');
                newUser.verify_primary_token_expires = Date.now() + 7200000;;
                if(req.body.uni_email)
                {
                    newUser.uni_email = req.body.uni_email;
                    newUser.verify_uni_token = crypto.randomBytes(20).toString('hex');
                    newUser.verify_uni_token_expires = Date.now() + 7200000;;
                }
                newUser.password = newUser.generateHash(password);
                newUser.first_name = req.body.first_name;
                newUser.last_name = req.body.last_name;
                if(req.body.university)
                    newUser.university = req.body.university;

                newUser.save(function(err){
                    if(err)
                        throw err;

                    return done(null, newUser);
                });
            }
        });
    });
}
));

/* Reset password */
app.get('/forgot', Common.isNotLogged(), function(req, res){
    res.render('auth/forgot', {
        user: req.user,
        errMsg: req.flash('errMsg'),
        sucMsg: req.flash('sucMsg')
    });
});

app.post('/forgot', function(req, res, next){
    async.waterfall([
    function(done){
        crypto.randomBytes(20, function(err, buf){
            var token = buf.toString('hex');
            done(err, token);
        });
    },
    function(token, done){
        User.findOne({ email: req.body.email }, function(err, user){
            if(!user)
            {
                req.flash('errMsg', 'No account with that email address exists.');
                return res.redirect('forgot');
            }

            user.reset_token = token;
            user.reset_token_expires = Date.now() + 7200000; // 2 hours

            user.save(function(err) {
                done(err, token, user);
            });
        });
    },
    function(token, user, done){
        var mailOptions = {
            to: user.email,
            from: 'autoreply@alex.com',
            subject: 'AlexWork Password Reset',
            text: 'Hello ' + user.first_name + ',\n\nYou are receiving this because you have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to reset your password:\n\n' +
            'http://' + req.headers.host + '/auth/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n\n Thanks,\nAlex'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
            done(err, 'done');
        });
    }], function(err){
        if(err)
            return next(err);

        req.flash('sucMsg', 'Message has been sent to reset password.');
        res.redirect('forgot');
    });
});

app.get('/reset/:token', function(req, res){
    User.findOne({ reset_token: req.params.token, reset_token_expires:{ $gt: Date.now() }}, function(err, user) {
        if(!user)
        {
            req.flash('errMsg', 'Password reset token is invalid or has expired.');
            return res.redirect('/auth/forgot');
        }
        res.render('auth/reset', {
            token: user.reset_token,
            user: null,
            errMsg: req.flash('errMsg')
        });
    });
});

app.post('/reset/:token', function(req, res){
    async.waterfall([
        function(done){
            User.findOne({ reset_token: req.params.token, reset_token_expires: { $gt: Date.now() } }, function(err, user){
                if(!user)
                {
                    req.flash('errMsg', 'Password reset token is invalid or has expired. Please try again.');
                    return res.redirect('/auth/forgot');
                }

                var a = new User();
                user.password = a.generateHash(req.body.password);
                user.reset_token = undefined;
                user.reset_token_expires = undefined;

                user.save(function(err){
                    done(err, user);
                });
            });
        },
        function(user, done){
            var mailOptions = {
                to: user.email,
                from: 'autoreply@alex.com',
                subject: 'Password Reset Confirmation',
                text: 'Hello ' + user.first_name + ',\n\n' +
                'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n\nThanks,\nAlex'
            };
            smtpTransport.sendMail(mailOptions, function(err){
                done(err);
            });
        }
    ], function(err){
            req.flash('sucMsg', 'Success! Your password has been changed.');
            res.redirect('/auth/login');
        });
});

/* Verify email address */
app.get('/verify/:type/id/:id', function(req, res){
    async.waterfall([
    function(done){
        crypto.randomBytes(20, function(err, buf){
            var token = buf.toString('hex');
            done(err, token);
        });
    },
    function(token, done){
        User.findOne({ _id: req.params.id }, function(err, user){
            if(!user) {
                req.flash('errMsg', 'There was a problem sending your email. Please contact support!.');
                return res.redirect('../../../');
            }

            if(req.params.type === "email"){
                user.verify_primary_token = token;
                user.verify_primary_token_expires = Date.now() + 7200000; // 2 hours
            } else if (req.params.type === "uni_email"){
                user.verify_uni_token = token;
                user.verify_uni_token_expires = Date.now() + 7200000; // 2 hours
            }

            user.save(function(err) {
                done(err, token, user);
            });
        });
    },
    function(token, user, done){
        var mailOptions;
        if(req.params.type === "email"){
            mailOptions = {
                to: user.email,
                from: 'autoreply@alex.com',
                subject: 'AlexWork Email Verification',
                text: 'Hello ' + user.first_name + ',\n\nYou are receiving this because you have requested to verify your email.\n\n' +
                'Please click on the following link, or paste this into your browser to do so:\n\n' +
                'http://' + req.headers.host + '/auth/verify/email/' + user.verify_primary_token + '\n\n' +
                'Thanks,\nAlex'
            };
        } else if(req.params.type === "uni_email"){
            mailOptions = {
                to: user.uni_email,
                from: 'autoreply@alex.com',
                subject: 'AlexWork UNI Email Verification',
                text: 'Hello ' + user.first_name + ',\n\nYou are receiving this because you have requested to verify your email.\n\n' +
                'Please click on the following link, or paste this into your browser to do so:\n\n' +
                'http://' + req.headers.host + '/auth/verify/uni_email/' + user.verify_uni_token + '\n\n' +
                'Thanks,\nAlex'
            };
        }
        smtpTransport.sendMail(mailOptions, function(err){
            done(err);
        });
    }], function(err){
        if(err)
            return next(err);

        req.flash('sucMsg', 'Confirmation email has been sent.');
        res.redirect('/profile');
    });
});

app.get('/verify/:type/:token', function(req, res){
    async.waterfall([
        function(done){
            var emailObject;
            if(req.params.type === "email"){
                emailObject = {
                    verify_primary_token_expires: { $gt: Date.now() },
                    verify_primary_token: req.params.token
                }
            }
            else if(req.params.type === "uni_email"){
                emailObject = {
                    verify_uni_token_expires: { $gt: Date.now() },
                    verify_uni_token: req.params.token
                }
            }
            User.findOne(emailObject, function(err, user){
                
                if(!user)
                {
                    req.flash('errMsg', 'There was a problem creating your token. Please try again.');
                    return res.redirect('../../../default_error');
                }

                if(req.params.type === "email"){
                    user.verified_primary_email = true;
                    user.verify_primary_token = undefined;
                    user.verify_primary_token_expires = undefined;
                } else if(req.params.type === "uni_email") {
                    user.verified_uni_email = true;
                    user.verify_uni_token = undefined;
                    user.verify_uni_token_expires = undefined;
                }
                

                user.save(function(err){
                    req.login(user, function(err){
                        done(err, user);
                    });
                });
            });
        }
    ], function(err){
        if(err)
            return next(err);

        req.flash('sucMsg', 'Email successfully verified!');
        res.redirect('/profile');
    });
});

/* GET requests */
app.get('/login', Common.isNotLogged(), function(req, res){
    res.render('auth/login', {
        user: req.user,
        errMsg: req.flash('errMsg'),
        sucMsg: req.flash('sucMsg')
    });
});

app.get('/register', Common.isNotLogged(), function(req, res){
    res.render('auth/register', { 
        errMsg: req.flash('errMsg'), 
        user: req.user
    });
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/auth/login');
});

// Route to retrieve all valid universities from the DB
app.get('/valid/university', function(req, res, next){
    University.find({}, function(err, list){
        if(err)
            return next(err);

        res.send(list);
    });
});

/* POST requests */
app.post('/login', passport.authenticate('login', {
    failureRedirect: 'login',
    failureFlash : true
}), function(req, res){
    if(req.body.remember)
        req.session.cookie.maxAge = 2592000000; // 1 Month 
    else
        req.session.cookie.expires = false; // Expires at end of session
    res.redirect('../profile');
});

app.post('/register', passport.authenticate('register', {
    failureRedirect: 'register',
    failureFlash : true
}), function(req, res){
     var mailOptions = {
        to: req.user.email,
        from: 'autoreply@alex.com',
        subject: 'AlexWork Email Verification',
        text: 'Hello ' + req.user.first_name + ',\n\nYou are receiving this because you have requested to verify your email.\n\n' +
        'Please click on the following link, or paste this into your browser to do so:\n\n' +
        'http://' + req.headers.host + '/auth/verify/email/' + req.user.verify_primary_token + '\n\n' +
        'Thanks,\nAlex'
    };
    smtpTransport.sendMail(mailOptions);

    if(req.user.uni_email){
        var mailOptions = {
            to: req.user.uni_email,
            from: 'autoreply@alex.com',
            subject: 'AlexWork UNI Email Verification',
            text: 'Hello ' + req.user.first_name + ',\n\nYou are receiving this because you have requested to verify your email.\n\n' +
            'Please click on the following link, or paste this into your browser to do so:\n\n' +
            'http://' + req.headers.host + '/auth/verify/uni_email/' + req.user.verify_uni_token + '\n\n' +
            'Thanks,\nAlex'
        };
        smtpTransport.sendMail(mailOptions);
        req.flash('infoMsg', "We have just sent verification emails to both your primary and uni email. You must verify both before entering a tournament");
    } else {
        req.flash('infoMsg', "We have just sent a verification email to your primary email. Please verify your email before you can enter a tournament");
    }

    
    res.redirect('../profile/')
});



module.exports = app;