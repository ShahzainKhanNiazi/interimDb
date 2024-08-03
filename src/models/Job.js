const mongoose = require('mongoose');



const currentStageSchema = new mongoose.Schema({
  name: String,
  color: String,
  code: String
}, { _id: false });

const jobSchema = new mongoose.Schema({
  jobId: { type: Number, required: true, unique: true },
  name: String,
  number: String,
  customer_id: { type: Number, required: true },
  description: String,
  same_as_customer_address: Boolean,
  other_trade_type_description: String,
  created_by: Number,
  created_at: Date,
  created_date: Date,
  updated_at: Date,
  deleted_at: Date,
  call_required: Boolean,
  appointment_required: Boolean,
  tax_rate: Number,
  alt_id: String,
  lead_number: String,
  duration: String,
  completion_date: Date,
  contract_signed_date: Date,
  current_stage: currentStageSchema,
  contact_same_as_customer: Boolean,
  insurance: Boolean,
  archived: Boolean,
  hover_job_id: Number,
  awarded_date: Date,
  stage_last_modified: Date,
  multi_job: Boolean,
  is_deleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('Job', jobSchema);