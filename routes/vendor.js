var vendorRouter = require('express').Router(),
    mongoose = require('mongoose'),
    dataModels = require('../models/mongo_models.js');

module.exports = function(database) {

    var UserModel = dataModels.userModel(database),
        VendorModel = dataModels.vendorModel(database),
        DishModel = dataModels.dishModel(database),
        OrderModel = dataModels.orderModel(database);

    function checkAuth(req, res, next) {
        if (req.session.u) next();
        res.status(401).json({ status: 401, message: "You are not authorized." });
    }
    function vendorOnly(req, res, next) {
        if (req.session.u.isvendor) next();
        res.status(401).json({ status: 401, message: "You are not authorized." });
    };

    vendorRouter.route('/');

    return vendorRouter;
};