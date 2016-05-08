function Common(){}

Common.prototype.isLogged = function(){
	return function(req, res, next){
		if(!req.isAuthenticated || !req.isAuthenticated()){
			res.redirect('/auth/login');
		} else {
			next();
		}
	}
}

Common.prototype.isNotLogged = function(){
	return function(req, res, next){
		if(!req.isAuthenticated || !req.isAuthenticated()){
			next();
		} else {
			res.redirect('/');			
		}
	}
} 
module.exports = new Common();