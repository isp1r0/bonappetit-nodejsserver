var userRouter = require('express').Router(),
	salt = require('../config').security.pwhashingsalt,
	sha2hash = function () {
		return new require('crypto').createHash('sha256');
	},
	msg = require('../messages.js');
	
module.exports = function(database)
{
	/*API URL routes:
		POST /user/authenticate		-> login
			Input parameters: JSONObject( {username, password} )
		GET /user/logout			-> logout

		GET /user/	 				-> return currently logged in user data
		POST /user/ 				-> create new user
			Input parameters: JSONObject( {username, password, email} )
		PUT /user/				-> update user data
			Input parameters: JSONObject( {currentpw, newpw, newemail} )
		DELETE /user/				-> remove user

		/user/favs
	*/

	var	dataModels = require('../models/mongo_models.js')(database),
		UserModel = dataModels.user,
		CartModel = dataModels.cart;

	function checkAuth(req, res, next) {
		if (req.session && req.session.u) {
			next();
			return;
		}
		res.status(401).json({status: 401, message: msg.ERR_NOTAUTHED});
	}

	userRouter.post('/authenticate', (req, res) => {
		if (req.session && typeof req.session.u != "undefined") {
			res.status(304).end();
			return;
		}
		if (req.body.username == null || req.body.password == null) {
			res.status(401).json({status: 401, message: msg.ERR_CREDINVALID});
			return;
		}
		UserModel.findOne({username: req.body.username}, '+pwhash').populate('cart').exec((e, au) => {
			if (e) {
				res.status(500).json({status: 500, message: msg.ERR_SERERROR});
				return;
			}
			if (sha2hash().update(req.body.password + salt).digest('hex') == au.pwhash) {
				DishModel.populate(au, 'cart.content.item', function (err, u) {
					VendorModel.populate(u, 'cart.content.item.owner', function (err, u) {
						DishModel.populate(u, 'cart.content.item.owner.dishes', function (err, u) {
							delete u.pwhash;
							req.session.u = u;
							req.session.cart = u.cart;
							res.status(200).json(u);
						});
					});
				});
			} else res.status(401).json({status: 401, message: msg.ERR_CREDINVALID});
		});
	});

	userRouter.get('/logout', checkAuth, (req, res) => {
		req.session.destroy();
		res.status(200).end();
	});

	userRouter.route('/')
		.get(checkAuth, (req, res) => {
			UserModel.findById(req.session.u._id).populate('cart').exec((e, ru) => {
				if (e) {
					res.status(500).json({status: 500, message: msg.ERR_SERERROR});
					return;
				}
				DishModel.populate(ru, 'cart.content.item', function (err, u) {
					VendorModel.populate(u, 'cart.content.item.owner', function (err, u) {
						DishModel.populate(u, 'cart.content.item.owner.dishes', function (err, u) {
							req.session.u = u;
							req.session.cart = u.cart;
							req.session.save();
							res.status(200).json(u);
						});
					});
				});
			});
		})
		.post((req, res) => {
			if (req.session && req.session.u) {
				res.status(304);
				return;
			}

			UserModel.findOne(
				{$or : [
						{ name: req.body.username },
						{ email: req.body.email }
				]},
				(err, doc) => {
					if (doc) {
						res.status(409).json({status: 409, message: msg.ERR_USERALREADYEXIST});
						return;
					}
					var newUser = new UserModel({
						username: req.body.username,
						name: req.body.name,
						pwhash: sha2hash().update(req.body.password + salt).digest('hex'),
						email: req.body.email,
						createdate: new Date().getTime(),
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
					newCart.save((e, c) => {
						newUser.save((e, u) => {
							req.session.cart = c.toObject();
							req.session.u = u;
							req.session.save();
							var onu = u.toObject();
							onu.cart = c.toObject();
							res.status(201).json(onu);
						});
					});
				}
			);
		})
		.put(checkAuth, (req, res) => {
			var update = {};
			if (req.body.newemail != "") update.email = req.body.newmail;
			if (req.body.newpw != "") {
				if (req.session.u.pwhash != sha2hash().update(req.body.currentpw + salt).digest('hex')) {
					res.status(403).json({status: 403, message: msg.ERR_CREDINVALID});
					return;
				}
				update.pwhash = sha2hash().update(req.body.newpw + salt).digest('hex');
			}

			UserModel.findByIdAndUpdate(req.session.u._id, update, (e, u) => {
				if (e) {
					res.status(500).json({status: 500, message: msg.ERR_SERERROR});
					return;
				}
				req.session.u = u;
				req.session.save();
				res.status(200).end();
			});
		})
		.delete(checkAuth, (req, res) => {
			UserModel.findByIdAndRemove(req.session.u._id, (err, rmu) => {
				CartModel.findByIdAndRemove(rmu.cart).exec();
			});
			res.redirect('/logout');
		});

	userRouter.route('/fav');

	return userRouter;
};