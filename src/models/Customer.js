const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: Number,
  first_name: String,
  last_name: String,
  email: String,
  created_at: Date,
  updated_at: Date,
});

module.exports = mongoose.model('Customer', customerSchema);
