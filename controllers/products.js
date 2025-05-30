
const Product = require('../models/product')

exports.getAddProducts = (req, res, next) => {
    res.render('add-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        formsCSS: true,
        productCSS: true,
        activeAddProduct: true,
         isAuthenticated: req.session.isLoggedIn
      });
}

exports.postAddProducts = (req, res, next) => {
    //new local constant
    const product = new Product(req.body.title);
    product.save();
    // products.push({ title: req.body.title });

    res.redirect('/');
}

exports.getProducts = (req, res, next) => {
    Product.fetchAll(products => {
        res.render('shop', {
          prods: products,
          pageTitle: 'Shop',
          path: '/',
          hasProducts: products.length > 0,
          activeShop: true,
          productCSS: true,
           isAuthenticated: req.session.isLoggedIn
        });
      });
  }