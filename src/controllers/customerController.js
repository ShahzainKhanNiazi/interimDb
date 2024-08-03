const Customer = require('../models/Customer');

// Controller function to add a new customer
const addCustomer = async (req, res) => {
  const { customerId, first_name, last_name, email } = req.body;

  try {
    const newCustomer = new Customer({
      customerId,
      first_name,
      last_name,
      email,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await newCustomer.save();
    return res.status(201).json({ message: 'Customer added successfully', customer: newCustomer });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Controller function to get a single customer by ID
const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.query.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    return res.status(200).json(customer);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Controller function to get all customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    return res.status(200).json(customers);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Controller function to update a customer
const updateCustomer = async (req, res) => {
  const { id, first_name, last_name, email } = req.body;

  try {
    let customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.first_name = first_name || customer.first_name;
    customer.last_name = last_name || customer.last_name;
    customer.email = email || customer.email;
    customer.updated_at = new Date();

    await customer.save();
    return res.status(200).json({ message: 'Customer updated successfully', customer });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addCustomer, getCustomer, getAllCustomers, updateCustomer };
