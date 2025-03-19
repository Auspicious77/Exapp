const getDb = require('../util/database').getDb;
const { ObjectId } = require('mongodb'); // ✅ Use "bson" if you're on MongoDB v5+
const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User', //refer to User model
    required: true, 

  }
})


module.exports = mongoose.model('Product', productSchema);
