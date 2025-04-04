const Product = require('../models/product');
const Order = require('../models/order');
const order = require('../models/order');

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        isAuthenticated: req.isLoggedIn
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
        isAuthenticated: req.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        isAuthenticated: req.isLoggedIn
      });
    })
    .catch(err => {
      console.log(err);
    });
};

// exports.getCart = (req, res, next) => {
//   req.user
//    .populate('cart.items.productId')
//    .execPopulate()  //to get a promise
//     .then(user => {
//       console.log('productssss,', user)
//         const products = user.cart.items
//           res.render('shop/cart', {
//             path: '/cart',
//             pageTitle: 'Your Cart',
//             products: products
//           });
//     })
//     .catch(err => console.log(err));
// };

exports.getCart = async (req, res, next) => {
  try {
    const user = await req.user.populate('cart.items.productId')
    console.log('Products:', user.cart.items);
    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products: user.cart.items, // Access populated products
      isAuthenticated: req.isLoggedIn
    });
  } catch (err) {
    console.log(err);
  }
};


exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;

  Product.findById(prodId)
  .then(prod => {
   return req.user.addToCart(prod);
   
  })
  .then(result => {
    console.log('cart resultsshhssh',result)
    res.redirect('./cart');
  
  })
  .catch(err => console.log(err));
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

// exports.postOrder = async(req, res, next) => {
//   const userProducts = await req.user.populate('cart.items.productId');
//   const products = userProducts.map(i => {
//     return {quantity: i.quantity, product: i.productId}
//   });
//    const order = new Order({
//      user:{
//       name: req.user.name,
//       userId: req.user
//      },
//      products: products
//    })
//    return order.save();
//   req.user
//     .addOrder()
//     .then(result => {
//       res.redirect('/orders');
//     })
//     .catch(err => console.log(err));
// };

exports.postOrder = async (req, res, next) => {
  try {
    // Populate user cart items with product details
    await req.user.populate('cart.items.productId');

    // Extract products from populated cart
    const products = req.user.cart.items.map(i => ({
      quantity: i.quantity,
      product: {...i.productId._doc} //access all product object
    }));

    // Create new order
    const order = new Order({
      user: {
        name: req.user.name,
        userId: req.user._id
      },
      products: products
    });

    // Save order to the database
    await order.save();

    await req.user.clearCart();

    // Redirect to orders page
    res.redirect('/orders');

  } catch (err) {
    console.error("Error creating order:", err);
    next(err); // Pass error to middleware for proper handling
  }
};


exports.getOrders = (req, res, next) => {
  Order.find({"user.userId": req.user._id})
  .then(orders =>  {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        isAuthenticated: req.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};
