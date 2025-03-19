const { ObjectId } = require('mongodb');
const getDb = require('../util/database').getDb;

class User {
    constructor(username, email, cart, id) {
        this.name = username;
        this.email = email;
        this.cart = cart || { items: [] };
        this._id = id ? new ObjectId(id) : null; // Ensure _id is always an ObjectId
    }

    save() {
        const db = getDb();
        return db.collection('users').insertOne(this);
    }

    addToCart(product) {
        const cartProductIndex = this.cart.items.findIndex(prod => {
            return prod.productId.toString() === product._id.toString();
        })
        let newQuantity = 1;
        const updatedCartItems = [...this.cart.items];

        if (cartProductIndex >= 0) {
            newQuantity = this.cart.items[cartProductIndex].quantity + 1;
            updatedCartItems[cartProductIndex].quantity = newQuantity;
        }
        else {
            updatedCartItems.push({ productId: new ObjectId(product._id), quantity: newQuantity });
        }


        const updatedCart = {
            items: updatedCartItems
        };
        const db = getDb();
        return db.collection('users').updateOne(
            { _id: new ObjectId(this._id) },  // Ensure ObjectId is created properly
            { $set: { cart: updatedCart } }
        );
    }

    getCart() {
        const db = getDb();

        // map the array of products to return just the ids
        const productIds = this.cart.items.map(id => {
            return id.productId
        });
        return db
            .collection('products')
            .find({ _id: { $in: productIds } })
            .toArray()
            .then(products => {
                return products.map(p => {
                    return ({
                        ...p,
                        quantity: this.cart.items.find(i => {
                            return i.productId.toString() === p._id.toString();
                        }).quantity
                    })
                })
            })
    }

    deleteItemFromCart(productId) {
        //remove
        const updatedCartItem = this.cart.items.filter(item => {
            return item.productId.toString() !== productId.toString()
        });

        const db = getDb();
        return db.collection('users')
            .updateOne(
                { _id: new ObjectId(this._id) },  // Ensure ObjectId is created properly
                { $set: { cart: { items: updatedCartItem } } }
            );
    }

    addOrder() {
        const db = getDb();
        return this.getCart()
            .then(products => {
                const order = {
                    items: products,
                    user: {
                        _id: new ObjectId(this._id),
                        name: this.name,
                    }
                };
                return db.collection('orders').insertOne(order)
            })
            .then(result => {
                this.cart = { items: [] };
                console.log(result);
                return db.collection('users')
                    .updateOne(
                        { _id: new ObjectId(this._id) },  // Ensure ObjectId is created properly
                        { $set: { cart: { items: [] } } });
            })

    }

    getOrders(){
        const db = getDb();
        //get orders for a particular user
        return db
        .collection('orders')
        .find({'user._id': new ObjectId(this._id)})
        .toArray();
    }

    static findById(userId) {
        const db = getDb();
        return db.collection('users')
            .findOne({ _id: new ObjectId(userId) }) // Ensure userId is converted properly
            .then(user => {
                console.log(user);
                return user;
            })
            .catch(err => console.log(err));
    }
}

module.exports = User;
