const getDb = require('../util/database').getDb;
const mongodb = require('mongodb');

class Product {
  constructor(title, imageUrl, description, price, id) {
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
    this._id = id ? new mongodb.ObjectId(id) : null; //  mongodb.ObjectId(id)
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
        .then((prod) => {
          console.log('Product Created')
          console.log('new product', this)

        })
        .catch(err => console.log(err));
    }
  }

  static fetchAll() {
    const db = getDb();
    return db.collection('products')
      .find()
      .toArray()
      .then(products => {
        console.log('all Products', products);
        return products
      })
      .catch(err => console.log(err));
  }

  static findById(id) {
    const db = getDb();
    return db.collection('products')
      .findOne({ _id: mongodb.ObjectId(id) }) // ✅ No warning
      .then(product => product)
      .catch(err => console.log(err));
  }

  static deleteById(id) {
    const db = getDb();
    return db.collection('products')
      .deleteOne({ _id: mongodb.ObjectId(id) }) // ✅ No warning
      .then(() => console.log('Product Deleted'))
      .catch(err => console.log(err));
  }
}

module.exports = Product;
