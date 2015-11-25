var OrderRouter = require('express').Router(),
	gcm = require('node-gcm'),
	gcmkey = require('../config').gcm.key,
	mongoose = require('mongoose'),
	msg = require('../message.js');

var gcmSender = new gcm.Sender(gcmkey);

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
				msg.addData('method', 'remove');
				msg.addData('oid', req.params.id);
				msg.addData('state', '');
				gcmSender.send(msg, { registationTokens: [o.owner.]})
			});
		})
		.get('/ack', checkAuth, vendorOnly, (req, res) => {
			OrderModel.findById(req.params.id, (err, o) => {
				if (e) {
					res.status(500).json({status: 500, message: msg.ERR_SERERROR});
					return;
				}

			});
		})
		.get('/ready', checkAuth, vendorOnly, (req, res) => {
			OrderModel.findById(req.params.id, (err, o) => {
				if (e) {
					res.status(500).json({status: 500, message: msg.ERR_SERERROR});
					return;
				}

			});

		})
		.get('/delivered', checkAuth, vendorOnly, (req, res) => {
			OrderModel.findById(req.params.id, (err, o) => {
				if (e) {
					res.status(500).json({status: 500, message: msg.ERR_SERERROR});
					return;
				}

			});

		});

	OrderRouter.get('/', checkAuth, (req, res) => {

	});

	return OrderRouter;
}