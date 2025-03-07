const getDb = require('../util/database').getDb;
const { ObjectId } = require('mongodb'); // ✅ Use "bson" if you're on MongoDB v5+

class Product {
  constructor(title, imageUrl, price, description,  id) {
    this.title = title;
    this.imageUrl = imageUrl;
    this.price = price;
    this.description = description;
    this._id = id ? new ObjectId(id) : null; 
  }

  save() {
    const db = getDb();
    if (this._id) {
      return db.collection('products')
        .updateOne({ _id: this._id }, { $set: this })
        .then(() => console.log('Product Updated'))
        .catch(err => console.log(err));
    } else {
      return db.collection('products')
        .insertOne(this)
        .then(() => console.log('Product Created'))
        .catch(err => console.log(err));
    }
  }

  static fetchAll() {
    const db = getDb();
    return db.collection('products')
      .find()
      .toArray()
      .then(products => {
        console.log('All Products', products);
        return products;
      })
      .catch(err => console.log(err));
  }

  static findById(prodId) {
    const db = getDb();
    return db.collection('products')
      .findOne({ _id: new ObjectId(prodId) })
      .then(product => {
        console.log(product);
        return product;
      })
      .catch(err => console.log(err));
  }

  static deleteById(id) {
    const db = getDb();
    return db.collection('products')
      .deleteOne({ _id: new ObjectId(id) })
      .then(() => console.log('Product Deleted'))
      .catch(err => console.log(err));
  }
}

module.exports = Product;
