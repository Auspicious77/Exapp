const express = require('express'); // Import Express framework
const path = require('path'); // Import the path module to work with file paths

const app = express(); // Create an Express application instance
const expressHbs = require('express-handlebars'); // Import Handlebars templating engine (not currently used)


//import models here...


// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Setting up the template engine (Handlebars and Pug are commented out, EJS is used)
app.set('view engine', 'ejs'); // Set EJS as the template engine
app.set('views', 'views'); // Set the directory where views (EJS templates) are stored

const errorController = require('./controllers/error'); // Import the error controller

// Serve static files (CSS, images, JS) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

const mongoConnect = require('./util/database').mongoConnect;

// Import route handlers
const adminRoute = require('./routes/admin'); // Routes for admin-related pages
const shopRoute = require('./routes/shop'); // Routes for shop-related pages
const User = require('./models/user');


app.use((req, res, next) => {
  User.findById("67cacaa7e1552e1c5ac316a4").then(user => {
  req.user = new User(user.name, user.email, user.cart, user._id);
  next();
  }).catch(err => console.log(err))

})
// Use imported route handlers
app.use('/admin', adminRoute); // All routes in adminRoute are prefixed with "/admin"
app.use(shopRoute); // Shop routes are used without a prefix

// Handle 404 errors using the error controller
app.use(errorController.get404);

// Start the Express server on port 3000
// app.listen(3000, () => {
//   console.log('Server is running on http://localhost:3000');
// });

mongoConnect(() => {
  app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
});
