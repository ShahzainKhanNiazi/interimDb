const express = require('express');
const router = express.Router();
const leapController = require('../controllers/leapController');

// Route to get signle job
router.get('/job/:id', leapController.getJobById);

// Route to get signle customer
router.get('/customer/:id', leapController.getCustomerById);

// Route to get all jobs
router.get('/jobs', leapController.getAllJobs);

// Route to get all customers
router.get('/customers', leapController.getAllCustomers);


module.exports = router;