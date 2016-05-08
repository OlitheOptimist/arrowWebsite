var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var passportMongoose = require('passport-local-mongoose');

var userSchema = new mongoose.Schema({
	email: {type: String, required: true},
	uni_email: {type:String, unique: true},
	first_name: {type: String, required: true},
	last_name: {type: String, required: true},
	password: {type: String, required: true},
	created_at: {type: Date, default: Date.now},
	updated_at: Date,
	reset_token: String,
	reset_token_expires: Date,
	verified_primary_email: {type: Boolean, default: false},
	verify_primary_token: String,
	verify_primary_token_expires: Date,
	verified_uni_email: {type: Boolean, default: false},
	verify_uni_token: String,
	verify_uni_token_expires: Date,
	steam_id: String,
	university: Number
});

userSchema.pre('save',function(next){
	var date = new Date();
	this.updated_at = date;
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