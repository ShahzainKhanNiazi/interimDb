const Customer = require('../models/Customer');

// Controller function to add a new customer
const addCustomer = async (req, res) => {
  const { customerId, company_name, first_name, last_name, email, additional_emails, referred_by_type, referred_by_note, call_required, appointment_required, note, is_commercial, management_company, property_name, canvasser_type, canvasser, call_center_rep_type, call_center_rep } = req.body;

  try {
    const newCustomer = new Customer({
      customerId,
      company_name,
      first_name,
      last_name,
      email,
      additional_emails,
      referred_by_type,
      referred_by_note,
      call_required,
      appointment_required,
      note,
      is_commercial,
      management_company,
      property_name,
      canvasser_type,
      canvasser,
      call_center_rep_type,
      call_center_rep,
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
  const { id, company_name, first_name, last_name, email, additional_emails, referred_by_type, referred_by_note, call_required, appointment_required, note, is_commercial, management_company, property_name, canvasser_type, canvasser, call_center_rep_type, call_center_rep } = req.body;

  try {
    let customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.company_name = company_name || customer.company_name;
    customer.first_name = first_name || customer.first_name;
    customer.last_name = last_name || customer.last_name;
    customer.email = email || customer.email;
    customer.additional_emails = additional_emails || customer.additional_emails;
    customer.referred_by_type = referred_by_type || customer.referred_by_type;
    customer.referred_by_note = referred_by_note || customer.referred_by_note;
    customer.call_required = call_required || customer.call_required;
    customer.appointment_required = appointment_required || customer.appointment_required;
    customer.note = note || customer.note;
    customer.is_commercial = is_commercial || customer.is_commercial;
    customer.management_company = management_company || customer.management_company;
    customer.property_name = property_name || customer.property_name;
    customer.canvasser_type = canvasser_type || customer.canvasser_type;
    customer.canvasser = canvasser || customer.canvasser;
    customer.call_center_rep_type = call_center_rep_type || customer.call_center_rep_type;
    customer.call_center_rep = call_center_rep || customer.call_center_rep;
    customer.updated_at = new Date();

    await customer.save();
    return res.status(200).json({ message: 'Customer updated successfully', customer });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addCustomer, getCustomer, getAllCustomers, updateCustomer };
