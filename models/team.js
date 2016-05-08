var mongoose = require('mongoose');

var teamSchema = new mongoose.Schema({
	name: {type: String, required: true},
	logo: String,
	users: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	university: {type: mongoose.Schema.Types.ObjectId, ref: 'University'},
	created_at: {type: Date, default: Date.now},
	updated_at: Date
});

teamSchema.pre('save',function(next){
	var date = new Date();
	this.updated_at = date;
	next();
});

module.exports = mongoose.model('universities', teamSchema);