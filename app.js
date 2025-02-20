const express = require('express');
const path = require('path');

const app = express();
const expressHbs = require('express-handlebars')


// Use Express's built-in body parser middleware
app.use(express.urlencoded({ extended: true }));

// app.engine('handlebars', expressHbs());
// app.set('view engine', 'pug');
// app.set('views', 'handlebars');
// app.set('views', 'views');

app.set('view engine', 'ejs');
app.set('views', 'views');

const errorController = require('./controllers/error')



app.use(express.static(path.join(__dirname, 'public')));





const adminRoute = require('./routes/admin')
const shopRoute = require('./routes/shop')


app.use('/admin', adminRoute);
app.use(shopRoute);


// app.use((req, res) => {
//   res.sendFile(path.join(__dirname, 'views', '404.html'))
// })

// app.use(errorController.error);
app.use(errorController.get404);




// Start server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
