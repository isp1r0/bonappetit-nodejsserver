var userRouter = require('express').Router(),
	dataModels = require('../models/mongo_models.js'),
	salt = require('../config').security.pwhashingsalt,
	sha2hash = function(){ return new require('crypto').createHash('sha256'); };
	
module.exports = function(database)
{
	/*API URL routes:
		POST /user/authenticate		-> login
			Input parameters: JSONObject( {username, password} )
		GET /user/logout			-> logout

		GET /user/	 				-> return user data
		POST /user/ 				-> create new user
			Input parameters: JSONObject( {username, password, email} )
		PUT /user/				-> update user data
			Input parameters: JSONObject( {currentpw, newpw, newemail} )
		DELETE /user/				-> remove user

		/user/favs
	*/

	var UserModel = dataModels.userModel(database);
	var CartModel = dataModels.cartModel(database);

	function checkAuth(req, res, next) {
		if (req.session && req.session.u) next();
		res.status(401).json({ status: 401, message: "You are not authorized." });
	};

	function prepareCompleteUserJson(...rest) {
		//TODO: combine user (and any related) document so that it is ready for transfer.
		var [userdoc, cartdoc] = rest;
		//TODO: userdoc populate path
		var completedUserJson = userdoc.toObject();
		delete completedUserJson.pwhash;
		if (typeof cartdoc == "undefined") CartModel.findById(userdoc.cart, (err, doc) => { cartdoc = doc; });
		completedUserJson.cart = cartdoc.toObject();
		return completedUserJson;
	};

	userRouter.post('/authenticate', function(req, res) {
		if (req.session && req.session.u) {
			res.status(304);//json({ status: 304, message: "You are already authenticated!" });
			return;
		}
		if (req.body.username == null || req.body.password == null) {
			res.json({ message:"Invaild query"});
			return;
		}
		UserModel.findOne({ name: req.body.username }, '+pwhash', function(err, au) {
			if (err) {
				res.status(500).json({ status: 401, message: "Server side error" });
				return;
			}
			if (sha2hash().update(req.body.password + salt).digest('hex') == au.pwhash) {
				CartModel.findById(au.cart, function(err, c) {
					req.session.u = au;
					var oau = au.toObject();
					req.session.cart = oau.cart = c.toObject();
					delete oau.pwhash;
					//TODO: use prepareCompleteUserJson()
					//TODO: determine user's location and give out positioning assets
					res.status(200).json(oau);
				});
			} else res.status(401).json({ status: 401, message: "Credential invalid." });
		});
	});

	userRouter.get('/logout', checkAuth, function(req, res) {
		CartModel.findByIdAndUpdate(req.session.u.cart, req.session.cart.content).exec();
		req.session.destroy();
		res.status(200).end();
	});

	userRouter.route('/')
		.get(checkAuth, function(req, res) {
			//TODO: use prepareCompleteUserJson()
			UserModel.findById(req.session.u._id, function(err, ru) {
				if (err) res.status(500).json({ status: 401, message: "Server side error" });
				CartModel.findById(ru.cart, function(err, c) {
					var oru = ru.toObject();
					req.session.cart = oru.cart = c.toObject();
					req.session.u = ru;
					req.session.save();
					res.status(200).json(ru);
				});
			});
		})
		.post(function(req, res) {
			if (req.session && req.session.u) {
				res.status(304).json({ status: 304, message: "You are already our user!" });
				return;
			}

			UserModel.findOne({
					$or : [
						{ name: req.body.username },
						{ email: req.body.email }
					]
			}, function (err, doc) {
				if (doc) {
					res.status(400).json({ status: 400, message: "User with specified username or email is exist." });
					return;
				}
				var newUser = new UserModel({
					name: req.body.username,
					pwhash: sha2hash().update(req.body.password + salt).digest('hex'),
					email: req.body.email,
					createdate: Date.now(),
					isvendor: false,
					ownedshop: null,
					favorites: { shop: [], dishes:[] },
					cart: null
				});
				var newCart = new CartModel({
					owner: newUser._id,
					content: []
				});
				newUser.cart = newCart._id;
				newCart.save(function(err, c) { req.session.cart = c.toObject(); });
				newUser.save(function(err, nu) {
					req.session.u = nu;
					req.session.save();
					var retUserData = nu.toObject();
					delete retUserData.pwhash;
					res.status(201).json(retUserData);
				});
			});
		})
		.put(checkAuth, function(req, res) {
			var update = {};
			if (req.body.newemail != "") update.email = req.body.newmail;
			if (req.body.newpw != "") {
				if (req.session.u.pwhash != sha2hash().update(req.body.currentpw + salt).digest('hex')) {
					res.status(403).json({ status: 403, message: "You entered the wrong password" });
					return;
				}
				update.pwhash = sha2hash().update(req.body.newpw + salt).digest('hex');
			}

			UserModel.findByIdAndUpdate(req.session.u._id, update, function(err, u) {
				if (err) res.status(500).json({ status: 500, message: "Server side error" });
				req.session.u = u;
				req.session.save();
				res.status(200).end();
			});
		})
		.delete(checkAuth, function(req, res) {
			UserModel.findByIdAndRemove(req.session.u._id, function(err, rmu) {
				CartModel.findByIdAndRemove(rmu.cart).exec();
			});
			res.redirect('/logout');
		});

	userRouter.route('/fav');

	return userRouter;
};