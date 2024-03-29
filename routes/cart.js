var cartRouter = require('express').Router(),
	mongoose = require('mongoose'),
	gcmkey = require('../config').gcm.key,
	gcmSender = new require('node-gcm').Sender(gcmkey),
	msg = require('../messages.js');

module.exports = function (database) {
	/*
	 API URL routes:
	 GET /cart/					-> return cart
	 PUT /cart/					-> modify cart (aka replace with new cart)
	 Input parameter: JSONObject( {dish_id, amount} )
	 GET /cart/checkout			-> checkout the cart
	 */
	var dataModels = require('../models/mongo_models.js')(database),
		UserModel = dataModels.user,
		VendorModel = dataModels.vendor,
		CartModel = dataModels.cart,
		OrderModel = dataModels.order;

	function checkAuth(req, res, next) {
		if (req.session.u) next();
		res.status(401).json({status: 401, message: msg.ERR_NOTAUTHED});
	}

	cartRouter.route('/')
		.get(checkAuth, (req, res) => {
			CartModel.populate(req.session.cart, 'content.items', (e, doc) => {
				if (e) {
					res.status(500).json({status: 500, message: msg.ERR_SERERROR});
					return;
				}
				res.status(200).json(doc);
			});
		})
		.put(checkAuth, (req, res) => {
			//content being PUT here is only ids of dishes, need to translate back to object ref first
			var newcontent = req.body.content;
			newcontent.forEach((e, i, a) => e.item = new mongoose.Schema.Types.ObjectId(e.item));
			CartModel.findByIdAndUpdate(req.session.cart._id, {content: newcontent}, (e, c) => {
				if (e) {
					res.status(500).json({status: 500, message: msg.ERR_SERERROR});
					return;
				}
				req.session.cart = c;
				req.session.save();
				res.status(200);
			});
		});

	cartRouter.get('/checkout', checkAuth, (req, res) => {
		CartModel.findById(req.session.u.cart).populate('content.item').exec((e, c) => {
			VendorModel.populate(c, 'cart.content.item.owner', function (err, nc) {
				var newOrdersContents = [];
				nc.forEach((e, i, a) => {
					if (typeof newOrdersContents[e.owner._id] == 'undefined')
						newOrdersContents[e.owner._id] = [];
					newOrdersContents[e.owner._id].push(e);
				});
				newOrdersContents.forEach((e, i, a) => {
					var newOrder = new OrderModel({
						oid: new Date().getTime(),
						content: e,
						owner: req.session.u._id,
						state: 0
					});
					newOrder.save((err, savedOrder) => {
						if (err) {
							res.status(500).json({status: 500, message: msg.ERR_SERERROR});
							return;
						}
						res.status(200).json(newOrder);
						UserModel.findById(e[0].owner.owner, (err, u) => {
							var msg = new gcm.Message();
							msg.addData({
								type: 'order-update',
								method: 'add',
								oid: savedOrder._id,
								state: 0,
								notification_text: ''//TODO:fill me
							});
							gcmSender.send(msg, u.gcmtoken);
						});
					});
				});
				UserModel.findByIdAndUpdate(req.session.cart._id, {content: []}, (e, c) => {
					if (e) {
						res.status(500).json({status: 500, message: msg.ERR_SERERROR});
						return;
					}
					//TODO: payment logic - put dummy here
					req.session.cart = c;
				});
			});
		});
	});

	return cartRouter;
};
