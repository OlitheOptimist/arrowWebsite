var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var passportMongoose = require('passport-local-mongoose');

var userSchema = new mongoose.Schema({
	primaryEmail: {type: String, required: true},
	uniEmail: String,
	firstName: {type: String, required: true},
	lastName: {type: String, required: true},
	password: {type: String, required: true},
	createdAt: Date,
	updatedAt: Date,
	resetToken: String,
	resetTokenExpires: Date,
	verifiedPrimaryEmail: {type: Boolean, default: false},
	verifyPrimaryToken: String,
	verifyPrimaryTokenExpires: Date,
	verifiedUniEmail: {type: Boolean, default: false},
	verifyUniToken: String,
	verifyUniTokenExpires: Date
});

userSchema.pre('save',function(next){
	var date = new Date();

	this.updatedAt = date;
	if(!this.createdAt){
		this.createdAt = date;
	}
	next();
});

userSchema.methods.generateHash = function(password){
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

userSchema.methods.validatePassword = function(password){
	return bcrypt.compareSync(password, this.password);
}

userSchema.plugin(passportMongoose, {usernameField: 'email'});

module.exports = mongoose.model('users', userSchema);