require('dotenv').config();
const express = require('express');
const connectDB = require('../config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/leapTestRoutes');
const migrationRoutes = require('./routes/migrationRoutes');


const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // for parsing application/json

// Connect to the Database
connectDB()

// Routes
app.get("/", (req, res) => {
  return res.status(200).send("Server is running");
});
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);


// Test routes
app.use('/api/test', testRoutes);
// Migration routes
app.use('/api/migrate', migrationRoutes);

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
