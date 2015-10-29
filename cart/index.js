var cartRouter = require('express').Router(),
	mongoose = require('mongoose'),
	dataModels = require('../models/mongo_models.js');

module.exports = function(database)
{
	/*API URL routes:
		GET /cart/					-> return cart
		POST /cart/					-> add items to cart
			Input parameter: JSONObject( {dish_id, amount} )
		PUT /cart/					-> modify items amount
			Input parameter: JSONObject( {dish_id, amount} )
		DELETE /cart/				-> remove items from cart
			Input parameter: JSONObject( {dish_id} )
		GET /cart/checkout			-> checkout the cart
	*/
	var UserModel = dataModels.userModel(database),
		CartModel = dataModels.cartModel(database),
		DishModel = dataModels.dishModel(database),
		OrderModel = dataModels.orderModel(database);

	function checkAuth(req, res, next) {
		if (req.session.u) next();
		res.status(401).json({ status: 401, message: "You are not authorized." });
	};

	cartRouter.route('/')
		.get(checkAuth, function(req, res) {
			CartModel.populate(req.session.cart, 'content.items', function (err,doc) {
				res.status(200).json(doc);
			});
		})
		.post(checkAuth, function(req, res) {
			var newContent = req.session.cart.content;
			for (dish in req.body.items) {
				DishModel.count({_id: dish._id}, function(err, cnt) {
					if (cnt) newContent.push({ item: new mongoose.Types.ObjectId(dish._id), amount: dish.amount });
				});
			}
			req.session.cart.content = newContent;
			res.status(200).json(req.session.cart);
		})
		.put(checkAuth, function(req, res) {
			var newContent = req.session.cart.content;
			for (dish in req.body.items) {
				dish._id = new mongoose.Types.ObjectId(dish._id);
				newContent = newContent.map(
					function(e) {
						if (e.item == dish._id) e.amount = dish.amount;
						return e;
					}
				);
			}
			req.session.cart.content = newContent;
			res.status(200).json(req.session.cart);
		})
		.delete(checkAuth, function(req, res) {
			var newContent = req.session.u.cart.content;
			for (dish in req.body.items) {
				dish._id = new mongoose.Types.ObjectId(dish._id);
				newContent = newContent.filter(function(e) { return !(e._id == dish._id); });
			}
			req.session.u.cart = newContent;
			res.status(200).json(req.session.cart);
		});
	
	cartRouter.get('/checkout', checkAuth, function(req, res) {
		var newOrder = new OrderModel({
			content: req.session.cart.content,
			owner: req.session.u._id,
			state: "Received"
		});
		newOrder.save(function(err, savedOrder) {
			//TODO: call order processing function
		});
		UserModel.findByIdAndUpdate(req.session.cart._id, { content: [] }, function(err, doc) {
			if (err) res.status(500).json({ status: 500, message: "Server side error"});
			//TODO: payment logic - put dummy here
			req.session.cart = doc;
			res.status(200).end();
		});
	});

	return cartRouter;
};