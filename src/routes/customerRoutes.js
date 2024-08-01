const express = require('express');
const router = express.Router();
const { addCustomer } = require('../controllers/customerController');

// Route to get signle customer
router.get('/get', getCustomer);

// Route to get all customers
router.get('/getAll', getAllCustomers);

// Route to create a customer
router.post('/create', addCustomer);

// Route to update a customer
router.put('/update', updateCustomer);



module.exports = router;
