require('dotenv').config();
const express = require('express');
const connectDB = require('../config/db');
const testRoutes = require('./routes/leapTestRoutes');
const migrationRoutes = require('./routes/migrationRoutes');
const { fetchAndStoreAllCustomers } = require('./services/migrateCustomers');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Connect to the Database
connectDB()
  .then(() => {
    // Start the migration process in the background
    console.log('Starting customer migration process...');
    fetchAndStoreAllCustomers()
      .then(() => {
        console.log('Customer migration process completed.');
      })
      .catch(error => {
        console.error('Error during customer migration process:', error);
      });
  })
  .catch(error => {
    console.error('Error connecting to the database:', error);
    process.exit(1);
  });

// Routes
app.get("/", (req, res) => {
  return res.status(200).send("Server is running");
});
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));

// Test routes
app.use('/api/test', testRoutes);
// Migration routes
app.use('/api/migrate', migrationRoutes);

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
