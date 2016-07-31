var mongoose = require('mongoose');

var uniSchema = new mongoose.Schema({
	name: {type: String, required: true},
	code: String,
	// teams: {type: mongoose.Schema.Types.ObjectId, ref: 'Team'},
	// users: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	created_at: {type: Date, default: Date.now},
	updated_at: Date
});

uniSchema.pre('save',function(next){
	var date = new Date();
	this.updated_at = date;
	next();
});

module.exports = mongoose.model('universities', uniSchema);