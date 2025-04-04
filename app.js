const express = require('express'); // Import Express framework
const path = require('path'); // Import the path module to work with file paths

const app = express(); // Create an Express application instance
const expressHbs = require('express-handlebars'); // Import Handlebars templating engine (not currently used)
const mongoose = require('mongoose')
const session = require('express-session');
const mongoDbStore = require('connect-mongodb-session')(session)


//import models here...
const MONGODB_URL = 'mongodb+srv://elishaibukun:ExpProject1234@cluster0.qxzkg.mongodb.net/shop?retryWrites=true&w=majority&appName=Cluster0';


// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

const store = new mongoDbStore({
  uri: MONGODB_URL,
  collection: 'sessions',
  // expires: '1'
})

// Setting up the template engine (Handlebars and Pug are commented out, EJS is used)
app.set('view engine', 'ejs'); // Set EJS as the template engine
app.set('views', 'views'); // Set the directory where views (EJS templates) are stored

const errorController = require('./controllers/error'); // Import the error controller

// Import route handlers
const adminRoute = require('./routes/admin'); // Routes for admin-related pages
const shopRoute = require('./routes/shop'); // Routes for shop-related pages
const User = require('./models/user');
const authRoutes = require('./routes/auth');



// Serve static files (CSS, images, JS) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'my secrette', 
  resave: false, 
  saveUninitialized:false,
  store: store
}))


app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});
// Use imported route handlers
app.use('/admin', adminRoute); // All routes in adminRoute are prefixed with "/admin"
app.use(shopRoute); // Shop routes are used without a prefix
app.use(authRoutes);

// Handle 404 errors using the error controller
app.use(errorController.get404);

// Start the Express server on port 3000
// app.listen(3000, () => {
//   console.log('Server is running on http://localhost:3000');
// });

// mongoConnect(() => {
//   app.listen(3000, () => {
//   console.log('Server is running on http://localhost:3000');
// });
// });

mongoose.connect(MONGODB_URL)
  .then(result => {
    User.findOne().then(user => {
      if (!user) {
        const user = new User({
          name: 'Helix',
          email: "helix@gmail.com",
          cart: {
            items: []
          }
        })
        user.save();
      }
    });
 
    app.listen(3000);
    console.log('connected to monogo yeah!!!!')
    console.log('Server is running on http://localhost:3000');

  }).catch(err => {
    console.log(err)
  })
