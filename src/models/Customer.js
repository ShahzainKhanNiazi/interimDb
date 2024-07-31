const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: Number,
  company_name: String,
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true },
  additional_emails: [String],
  referred_by_type: String,
  referred_by_note: String,
  call_required: { type: Boolean, default: false },
  appointment_required: { type: Boolean, default: false },
  note: String,
  is_commercial: { type: Boolean, default: false },
  created_at: Date,
  updated_at: Date,
  deleted_at: Date,
  management_company: String,
  property_name: String,
  canvasser_type: String,
  canvasser: String,
  call_center_rep_type: String,
  call_center_rep: String
});
module.exports = mongoose.model('Customer', customerSchema);

const mongoose = require('mongoose');