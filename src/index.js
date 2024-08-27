require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/leapTestRoutes');
const migrationRoutes = require('./routes/migrationRoutes');
const leapWebhookRoutes = require('./routes/leapWebhookRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from this origin (your frontend)
  credentials: true, // Allow cookies or authorization headers to be sent
}));

// Connect to the Database
connectDB();

// Routes
app.get("/", (req, res) => {
  return res.status(200).send("Server is running");
});
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/webhooks/leap', leapWebhookRoutes);
app.use('/api/test', testRoutes);
app.use('/api/migrate', migrationRoutes);



// Start the Express server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Export the Express app as a function
module.exports = app;
