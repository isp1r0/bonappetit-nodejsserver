var vendorRouter = require('express').Router(),
	mongoose = require('mongoose'),
	msg = require('../messages.js');
    dataModels = require('../models/mongo_models.js');

module.exports = function(database) {

    var UserModel = dataModels.userModel(database),
        VendorModel = dataModels.vendorModel(database),
        DishModel = dataModels.dishModel(database),
        OrderModel = dataModels.orderModel(database);

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
	};
    vendorRouter.route('/');

    return vendorRouter;
};