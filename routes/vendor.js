var vendorRouter = require('express').Router(),
	mongoose = require('mongoose'),
	msg = require('../messages.js');

module.exports = function (database) {

	var dataModels = require('../models/mongo_models.js')(database);
	var UserModel = dataModels.user,
		VendorModel = dataModels.vendor,
		DishModel = dataModels.dish,
		OrderModel = dataModels.order;

	function checkAuth(req, res, next) {
		if (req.session.u) {
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

	vendorRouter.route('/');

	return vendorRouter;
};