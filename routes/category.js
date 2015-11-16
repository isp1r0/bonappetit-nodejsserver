var categoryRouter = require('express').Router(),
	ObjectId = require('mongoose').Schema.Types.ObjectId,
	msg = require('../messages.js');

module.exports = function (database) {
	var datamodels = require('../models/mongo_models.js')(database);

	var CategoryModel = datamodels.category,
		VendorModel = datamodels.vendor,
		DishModel = datamodels.dish;

	function checkAuth(req, res, next) {
		if (req.session && req.session.u) {
			next();
			return;
		}
		res.status(401).json({status: 401, message: msg.ERR_NOTAUTHED});
	}

	categoryRouter.get('/list', checkAuth, (req, res) => {
		CategoryModel.find({}, (err, cats) => {
			if (err) {
				res.status(500).json({status: 500, message: msg.ERR_SERERROR});
				return;
			}
			res.status(200).json(cats);
		});
	});

	categoryRouter.get('/:id/vendors', checkAuth, (req, res) => {
		VendorModel
			.find({category: new ObjectId(req.params.id)})
			.populate('dishes location.pointatmall.map')
			.lean().exec(
			(err, vs) => {
				if (err) {
					res.status(500).json({status: 500, message: msg.ERR_SERERROR});
					return;
				}
				res.status(200).json(vs);
			}
		);
	});

	return categoryRouter;
};