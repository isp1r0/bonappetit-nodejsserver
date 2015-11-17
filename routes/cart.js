var cartRouter = require('express').Router(),
	mongoose = require('mongoose'),
	msg = require('../messages.js');

module.exports = function(database)
{
	/*
	API URL routes:
		GET /cart/					-> return cart
		PUT /cart/					-> modify cart (aka replace with new cart)
			Input parameter: JSONObject( {dish_id, amount} )
		GET /cart/checkout			-> checkout the cart
	*/
	var dataModels = require('../models/mongo_models.js')(database),
		UserModel = dataModels.user,
		CartModel = dataModels.cart,
		OrderModel = dataModels.order;

	function checkAuth(req, res, next) {
		if (req.session.u) next();
		res.status(401).json({ status: 401, message: msg.ERR_NOTAUTHED });
	}

	cartRouter.route('/')
		.get(checkAuth, (req, res) => {
			CartModel.populate(req.session.cart, 'content.items', (e, doc) => {
				if (e) {
					res.status(500).json({ status: 500, message: msg.ERR_SERERROR });
					return;
				}
				res.status(200).json(doc);
			});
		})
		.put(checkAuth, (req, res) => {
			CartModel.findByIdAndUpdate(req.session.cart._id, {content: req.body.content}, (e, c) => {
				if (e) {
					res.status(500).json({ status: 500, message: msg.ERR_SERERROR });
					return;
				}
				req.session.cart = c;
				req.session.save();
				res.status(200);
			});
		});
	
	cartRouter.get('/checkout', checkAuth, (req, res) => {
		var newOrder = new OrderModel({
			content: req.session.cart.content,
			owner: req.session.u._id,
			state: "Received"
		});
		newOrder.save((err, savedOrder) => {
			if (err) {
				res.status(500).json({ status: 500, message: msg.ERR_SERERROR });
				return;
			}
			//TODO: call order processing function
		});
		UserModel.findByIdAndUpdate(req.session.cart._id, { content: [] }, (e, c) => {
			if (e) {
				res.status(500).json({ status: 500, message: msg.ERR_SERERROR });
				return;
			}
			//TODO: payment logic - put dummy here
			req.session.cart = c;
			res.status(200).json(newOrder);
		});
	});

	return cartRouter;
};