const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoute');
const prodRoutes = require('./routes/prodRoutes');


const app = express();
app.use(express.json());
const bodyParser = require('body-parser');


// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Parse application/json
app.use(bodyParser.json());
app.use(cors()); // Enable CORS

const PORT = 5000;

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB is connected...");
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error while connecting to MongoDB:", error);
  });

app.use('/api/users', userRoutes);
app.use('/api/products', prodRoutes);


module.exports = app;
