const express = require('express');
const path = require('path');
const rootDir = require('../util/path');  

const router = express.Router();    //router for usingmultiple router


router.get('/add-product', (req, res) => {
    res.sendFile(path.join(rootDir, 'views', 'add-product.html'));
  });


  router.post('/product', (req, res) => {
    console.log(req.body); // Log form data
    res.redirect('/');
  });


  module.exports = router;