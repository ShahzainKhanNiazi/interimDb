require('dotenv').config();
const express = require('express');
const connectDB = require('../config/db');
const testRoutes = require('./routes/leapTestRoutes');
const migrationRoutes = require('./routes/migrationRoutes');


const app = express();
const port = process.env.PORT || 3000;


app.use(express.json());

// Connect Database
connectDB();

// Routes
app.get("/", (req, res)=>{
    return res.status(200).send("Server is running")
})
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));

// Test routes
app.use('/api/test', testRoutes);
// Migration routes
app.use('/api/migrate', migrationRoutes);



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
