var mallRouter = require('express').Router(),
	msg = require('../messages.js');

var geoDistLimit = /*20*/10000;

module.exports = function (database) {
	var dataModels = require('../models/mongo_models.js')(database);
	var MallModel = dataModels.mall;

	function checkAuth(req, res, next) {
		if (req.session && req.session.u) {
			next();
			return;
		}
		res.status(401).json({status: 401, message: msg.ERR_NOTAUTHED});
	}

	mallRouter.get('/', checkAuth, (req, res) => {
		if (req.query.long && req.query.lat) {
			MallModel
			/*.geoNear(
			 { type: "Point", coordinates: [req.query.long, req.query.lat] },
			 { maxDistance: geoDistLimit, spherical: true }
			 ).then(*/
				.findOne().exec(
				(err, m, stats) => {
					if (!m) res.status(404).json({status: 404, message: msg.ERR_NOMALLNEARBY});
					res.status(200).json(m);
				}
			);
		} else {
			res.status(400).json({status: 400, message: msg.ERR_INVALIDLOC})
		}
	});

	mallRouter.get('/:id', checkAuth, (req, res) => {
		MallModel
		/*.geoNear(
		 { type: "Point", coordinates: [req.query.long, req.query.lat] },
		 { maxDistance: geoDistLimit, spherical: true }
		 ).then(*/
				.findById(req.params.id).exec(
				(err, m, stats) => {
					if (!m) res.status(404).json({status: 404, message: msg.ERR_NOMALLNEARBY});
					res.status(200).json(m);
				}
		);
	});


	return mallRouter;
};
