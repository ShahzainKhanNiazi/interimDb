const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  jobId: Number,
  name: String,
  number: String,
  customer_id: Number,
  description: String,
  created_by: Number,
  created_at: Date,
  updated_at: Date,
  current_stage: {
    name: String,
    color: String,
    code: String
  },
});

module.exports = mongoose.model('Job', jobSchema);
