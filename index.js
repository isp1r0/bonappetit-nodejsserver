var config = require('./config.js'),
	sprintf = require('sprintf-js').sprintf,
	express = require('express'),
	bodyParser = require('body-parser'),
	errorHandler = require('api-error-handler'),
	slash = require('express-slash'),
	session = require('express-session'),
	uncapitalizer = require('express-uncapitalize'),
	app = express();

app.set('config', config);

var api_paths = {
	user: require('./user/'),
	vendor: require('./vendor/'),
	dishes: require('./dish/'),
	cart: require('./cart/')
};
/**
 * @returns {Mongoose.connection}
 */
var database = function() {
	var dbconnstring =
	sprintf(
		'mongodb://%s:%s@%s:%d/%s',
		config.db.credential.user,
		config.db.credential.password,
		config.db.server,
		config.db.port == 0 ? config.db.port : 27017,
		config.db.dbname
	);
	var dboption = {
		server: { socketOptions: { keepAlive: 1 } }
	};
	var mongoose = require('mongoose');
	return mongoose.connect(dbconnstring, dboption);
}();

var sessionopt = config.session;
sessionopt.cookie.secure = config.http.tlsenabled;
sessionopt.store = (function() {
		if (database && config.session.usedb) {
				var MongoStore = require('connect-mongo')(session);
				return new MongoStore({
					mongooseConnection: database.connection,
					touchAfter: 7*24*3600
				});
		} else return new session.MemoryStore();
	})();
app.use(session(sessionopt));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(slash());
app.use(errorHandler());
app.use(uncapitalizer());
app.use('/user', api_paths.user(database));
app.use('/cart', api_paths.cart(database));
/*app.use('/vendor', api_paths.vendor(database));
app.use('/dish', api_paths.dish(database));
app.use('/mall', ...);
app.use('/ro/vendor', ...);
app.use('/ro/dish', ...);
app.use('/ro/mall', ...);
*/

if (config.http.tlsenabled) {
	var https = require('https'),
		fs = require('fs'),
		tlsopts = {
			key: fs.readFileSync(config.security.tlscert.key),
			cert: fs.readFileSync(config.security.tlscert.cert),
			passphrase: config.security.tlscert.passphrase,
			ciphers: "ECDHE-RSA-AES-128-GCM-SHA256:ECDHE-RSA-AES128-SHA256",
			honorCipherOrder: true
		},
		server = https.createServer(tlsopts, app);

	server.listen(config.http.port);
} else {
	app.listen(config.http.port);
}