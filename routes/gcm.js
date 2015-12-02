var gcmRouter = require('express').Router(),
	gcm = require('node-gcm'),
	msg = require('../messages.js');

module.exports = function (database) {
	var dataModels = require('../models/mongo_models.js')(database),
		UserModel = dataModels.user;

	function checkAuth(req, res, next) {
		if (req.session && req.session.u) {
			next();
			return;
		}
		res.status(401).json({status: 401, message: msg.ERR_NOTAUTHED});
	}

	gcmRouter.post('/subscribe', checkAuth, (req, res) => {
		req.session.u.gcmtoken = req.body.gcmtoken;
		req.session.u.save().exec((req, res) => {
			res.status(200).json({status:200, message:msg.GCM_SUBSCRIBE_SUCCESS});
		});
	});

	gcmRouter.get('/unsubscribe', checkAuth, (req, res) => {
		req.session.u.gcmtoken = null;
		req.session.u.save().exec((req, res) => {
			res.status(200).json({status:200, message:"GCM Token deauth success"});
		})
	});
};
