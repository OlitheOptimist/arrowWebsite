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

/* Authentication */
var isValidPassword = function(user, password)
{
    return bCrypt.compareSync(password, user.password);
}

var createHash = function(password)
{
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

passport.use('signIn', new LocalStrategy({
    passReqToCallback : true,
    usernameField: 'email'
},
function(req, email, password, done){
    User.findOne({ 'primaryEmail': email }, function(err, user){
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

passport.use('signUp', new LocalStrategy({ 
    passReqToCallback : true,
    usernameField: 'email'
},
function(req, email, password, done){

    process.nextTick(function(){

        User.findOne({ 'primaryEmail': email }, function(err, user){

            if(err)
                return done(err);
            if(user)
                return done(null, false, req.flash('errMsg', 'That email is taken. Please try again.'));
            else
            {
                var newUser = new User();
                newUser.primaryEmail = email;
                if(req.body.uniEmail){
                    newUser.uniEmail = req.body.uniEmail;
                }
                newUser.password = newUser.generateHash(password);
                newUser.firstName = req.body.firstName;
                newUser.lastName = req.body.lastName;

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
app.get('/forgotPassword', function(req, res){
    res.render('auth/forgotPassword', {
        user: req.user,
        errMsg: req.flash('errMsg'),
        sucMsg: req.flash('sucMsg')
    });
});

app.post('/forgotPassword', function(req, res, next){
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
                return res.redirect('forgotPassword');
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
        res.redirect('forgotPassword');
    });
});

app.get('/reset/:token', function(req, res){
    User.findOne({ reset_token: req.params.token, reset_token_expires:{ $gt: Date.now() }}, function(err, user) {
        if(!user)
        {
            req.flash('errMsg', 'Password reset token is invalid or has expired. Please try again.');
            return res.redirect('../forgotPassword');
        }
        res.render('auth/reset', {
            user: user,
            errMsg: req.flash('errMsg')
        });
    });
});

app.post('/reset', function(req, res){
    async.waterfall([
        function(done){
            User.findOne({ reset_token: req.body.token, reset_token_expires: { $gt: Date.now() } }, function(err, user){
                if(!user)
                {
                    req.flash('errMsg', 'Password reset token is invalid or has expired. Please try again.');
                    return res.redirect('../forgotPassword');
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
            res.redirect('auth/signIn');
        });
});

/* Verify email address */
app.get('/verify/:type/:id', function(req, res){
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
                req.flash('errMsg', 'Could send email at this time. Please try again later.');
                return res.redirect('../../../home');
            }

            if(req.params.type === "primary"){
                user.verifyPrimaryToken = token;
                user.verifyPrimaryTokenExpires = Date.now() + 7200000; // 2 hours
            } else if (req.params.type === "uni"){
                user.verifyUniToken = token;
                user.verifyUniTokenExpires = Date.now() + 7200000; // 2 hours
            }

            user.save(function(err) {
                done(err, token, user);
            });
        });
    },
    function(token, user, done){
        var mailOptions = {
            to: user.email,
            from: 'autoreply@alex.com',
            subject: 'AlexWork Email Verification',
            text: 'Hello ' + user.first_name + ',\n\nYou are receiving this because you have requested to verify your email.\n\n' +
            'Please click on the following link, or paste this into your browser to do so:\n\n' +
            'http://' + req.headers.host + '/auth/verify/'+ req.params.type + '/' + token + '\n\n' +
            'Thanks,\nAlex'
        };
        smtpTransport.sendMail(mailOptions, function(err){
            done(err, 'done');
        });
    }], function(err){
        if(err)
            return next(err);

        req.flash('sucMsg', 'Confirmation email has been sent.');
        res.redirect('../../../home');
    });
});

app.get('/verify/:type/:token', function(req, res){
    async.waterfall([
        function(done){
            var emailObject;
            if(req.params.type === "primary"){
                emailObject = {
                    verifyPrimaryTokenExpires: { $gt: Date.now() },
                    primaryEmailToken: req.params.token
                }
            }
            else if(req.params.type === "uni"){
                emailObject = {
                    verifyUniTokenExpires: { $gt: Date.now() },
                    uniEmailToken: req.params.token
                }
            }
            User.findOne(emailObject, function(err, user){
                
                if(!user)
                {
                    req.flash('errMsg', 'Could not verify at this time. Please try again later.');
                    return res.redirect('../../home');
                }

                if(req.params.type === "primary"){
                    user.primaryVerified = true;
                    user.verifyPrimaryToken = undefined;
                    user.verifyPrimaryTokenExpires = undefined;
                } else if(req.params.type === "uni") {
                    user.uniVerified = true;
                    user.verifyUniToken = undefined;
                    user.verifyUniTokenExpires = undefined;
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
        res.redirect('auth/signIn');
    });
});

/* GET requests */
app.get('/signIn', function(req, res){
    res.render('auth/signIn', {
        errMsg: req.flash('errMsg'),
        sucMsg: req.flash('sucMsg')
    });
});

app.get('/signUp', function(req, res){
    res.render('auth/signUp', { errMsg: req.flash('errMsg') });
});

/* POST requests */
app.post('/signIn', passport.authenticate('signIn', {
    failureRedirect: 'signIn',
    failureFlash : true
}), function(req, res){
    if(req.body.remember)
        req.session.cookie.maxAge = 2592000000; // 1 Month 
    else
        req.session.cookie.expires = false; // Expires at end of session
    res.redirect('../profile/profilePage');
});

app.post('/signUp', passport.authenticate('signUp', {
    successRedirect: '../home',
    failureRedirect: 'signUp',
    failureFlash : true
}));

module.exports = app;