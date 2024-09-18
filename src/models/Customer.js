const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  // CRM-specific IDs for tracking
  leapCustomerId: { type: String },  // Leap customer ID
  ghlCustomerId: { type: String },   // GHL contact ID
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: {
    addressLine: { type: String, required: false },  
    city: { type: String, required: false },
    state: { type: String, required: false },  
    postalCode: { type: String, required: false },  
  },
  companyName: { type: String, required: false },
  customerRep: { type: String },
  notes: { type: String, required: false },
  source: { type: String, enum: ['Leap', 'GHL'], required: true },
  synced: { type: Boolean, default: false }
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
