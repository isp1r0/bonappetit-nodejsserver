var OrderRouter = require('express').Router(),
	gcmkey = require('../config').gcm.key,
	gcmSender = new require('node-gcm').Sender(gcmkey),
	mongoose = require('mongoose'),
	msg = require('../messages.js');

module.exports = function (database) {
	var dataModels = require('../models/mongo_models.js')(database),
		UserModel = dataModels.user,
		CartModel = dataModels.cart,
		OrderModel = dataModels.order;

	function checkAuth(req, res, next) {
		if (req.session && req.session.u) {
			next();
			return;
		}
		res.status(401).json({status: 401, message: msg.ERR_NOTAUTHED});
	}

	function vendorOnly(req, res, next) {
		if (req.session.u.isvendor) {
			next();
			return;
		}
		res.status(401).json({status: 401, message: msg.ERR_OFFLIMITS});
	}

	OrderRouter.route('/:id')
		.get('/', checkAuth, (req, res) => {
			OrderModel.findById(req.params.id, (e, o) => {
				if (e) {
					res.status(500).json({status: 500, message: msg.ERR_SERERROR});
					return;
				}
				res.status(200).json(o);
			});
		})
		.get('/cancel', checkAuth, (req, res) => {
			OrderModel.findByIdAndRemove(req.params.id, (e, o) => {
				if (e) {
					res.status(500).json({status: 500, message: msg.ERR_SERERROR});
					return;
				}
				var msg = gcm.Message();
				msg.addData({
					type: 'order-update',
					method: 'remove',
					oid: o.oid,
					state: o.state,
					notification_text: ''//TODO:fill me
				});
				gcmSender.send(msg, o.owner.gcmtoken);
				res.status(200).end();
			});
		})
		.get('/ack', checkAuth, vendorOnly, (req, res) => {
			OrderModel.findById(req.params.id, (err, o) => {
				if (e) {
					res.status(500).json({status: 500, message: msg.ERR_SERERROR});
					return;
				}
				o.state = 1;
				o.save();
				var msg = gcm.Message();
				msg.addData({
					type: 'order-update',
					method: 'update',
					oid: o.oid,
					state: 1,
					notification_text: ''//TODO:fill me
				});
				gcmSender.send(msg, o.owner.gcmtoken);
				res.status(200).end();
			});
		})
		.get('/ready', checkAuth, vendorOnly, (req, res) => {
			OrderModel.findById(req.params.id, (err, o) => {
				if (e) {
					res.status(500).json({status: 500, message: msg.ERR_SERERROR});
					return;
				}
				o.state = 2;
				o.save();
				var msg = gcm.Message();
				msg.addData({
					type: 'order-update',
					method: 'update',
					oid: o.oid,
					state: 2,
					notification_text: ''//TODO:fill me
				});
				gcmSender.send(msg, o.owner.gcmtoken);
				res.status(200).end();
			});
		})
		.get('/delivered', checkAuth, vendorOnly, (req, res) => {
			OrderModel.findById(req.params.id, (err, o) => {
				if (e) {
					res.status(500).json({status: 500, message: msg.ERR_SERERROR});
					return;
				}
				var msg = gcm.Message();
				msg.addData({
					type: 'order-update',
					method: 'update',
					oid: o.oid,
					state: 3,
					notification_text: ''//TODO:fill me
				});
				gcmSender.send(msg, o.owner.gcmtoken);
				res.status(200).end();
			});
		});

	OrderRouter.get('/', checkAuth, (req, res) => {
		//Find all order from a user
		//This route should be use only on startup of ReviewOrderActivity
		//  or VendorAdminActivity if somehow the app reboots
		//Returns at most 15 orders within 7 days should be a reasonable limit
		//Vendors should return any order which state < 3 (i.e. order in process)
	});

	return OrderRouter;
}
