function Common(){}

Common.prototype.isLogged = function(){
	return function(req, res, next){
		if(!req.isAuthenticated || !req.isAuthenticated()){
			res.redirect('auth/signIn');
		} else {
			next();
		}
	}
}

module.exports = new Common();