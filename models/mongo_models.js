var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
	username: { type: String },
	name: { type: String, unique: true },
	pwhash: { type: String, select: false },
	email: { type: String },
	createdate: { type: Number },
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
	name: { type: String },
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
	icon: { type: String }
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

module.exports = function (database) {
	return {
		user: database.model('Users', UserSchema, 'Users'),
		cart: database.model('Carts', CartSchema, 'Carts'),
		vendor: database.model('Vendors', VendorSchema, 'Vendors'),
		dish: database.model('Dishes', DishSchema, 'Dishes'),
		order: database.model('Orders', OrderSchema, 'Orders'),
		category: database.model('Categories', CategorySchema, 'Categories'),
		mall: database.model('Malls', MallSchema, 'Malls')
	};
};