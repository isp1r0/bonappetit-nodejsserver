var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
	name: { type: String, required: true, unique: true },
	pwhash: { type: String, required: true, select: false },
	email: { type: String, required: true },
	createdate: { type: Date, required: true },
	isvendor: { type: Boolean },
	ownedshop: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendors' },
	favorites: {
		shops: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Vendors' } ],
		dishes: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Dishes' } ]
	},
	cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Carts' }
});

var CartSchema = new mongoose.Schema({
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
	content: [
		{
			item: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Dishes' },
			amount: { type: Number, required: true }
		}
	]
});

var VendorSchema = new mongoose.Schema({
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
	category: { type: mongoose.Schema.Types.ObjectId, ref: 'Categories' },
	description: { type: String },
	pictures: [
		{ type: String /* store base64'd pictures, prefer png */ }
	],
	dishes: [
		{ type: mongoose.Schema.Types.ObjectId, ref: 'Dishes' }
	],
	location: {
		text: { type: String },
		pointatmall: {
			map: { type: mongoose.Schema.Types.ObjectId, ref: 'Malls' },
			x: { type: Number },
			y: { type: Number }
		}
	}
});

var DishSchema = new mongoose.Schema({
	owner: { type: mongoose.Schema.Types.ObjectId, ref:'Vendors' },
	name: { type: String },
	description: { type: String },
	picture: [
		{ type: String }
	],
	price: { type: Number }
});

var OrderSchema = new mongoose.Schema({
	content: [
		{
			item: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Dishes' },
			amount: { type: Number, required: true }
		}
	],
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
	state: { type: String }
});

var CategorySchema = new mongoose.Schema({
	name: { type: String },
	flagpic: { type: String }
});

var MallSchema = new mongoose.Schema({
	name: { type: String },
	location: {
		lat: { type: Number },
		long: { type: Number }
	},
	maptile: {
		image: { type: String },
		northangle: { type: Number },
		scale: { type: Number }
	},
	beacondat: { type: String }
});

module.exports.userModel = function(database) { return database.model('Users', UserSchema, 'Users'); };
module.exports.cartModel = function(database) { return database.model('Carts', CartSchema, 'Carts'); };
module.exports.vendorModel = function(database) { return database.model('Vendors', VendorSchema, 'Vendors'); };
module.exports.dishModel = function(database) { return database.model('Dishes', DishSchema, 'Dishes'); };
module.exports.orderModel = function(database) { return database.model('Orders', OrderSchema, 'Orders'); };
module.exports.categoryModel = function(database) { return database.model('Categories', CategorySchema, 'Categories'); };
module.exports.mallModel = function(database) { return database.model('Malls', MallSchema, 'Malls'); };