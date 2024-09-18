const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // CRM-specific job IDs for tracking
  leapJobId: { type: String },  // Leap job ID
  ghlJobId: { type: String },   // GHL opportunity ID

  
  // Job/Opportunity Name
  name: { type: String, required: false },

  // Reference to the internal customer ID from our customer schema
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },

  // Description of the job/opportunity
  description: { type: String, required: true },

  // Information about the pipeline or stage
  pipeline: { type: String, required: false },  // GHL pipelineId or Leap division
  currentStage: { type: String, required: false },  // Stage name or ID from both CRMs

  // Job creation and update timestamps from both CRMs
  createdAt: { type: Date, required: true },  // Created at timestamp
  updatedAt: { type: Date, required: true },  // Updated at timestamp

  // Assigned user (created_by for Leap, assignedTo for GHL)
  assignedTo: { type: String, required: false },

  // "trades" field to hold the values for the trades in Leap
  trades: [{
    id: { type: Number, required: true },
    name: { type: String, required: true }
  }],

  // Status (e.g., open, closed, or based on Leap current_stage.code)
  status: { type: String, required: false },

  // Monetary value from GHL (if applicable)
  monetaryValue: { type: Number, required: false },

  // Source of the job data (either 'Leap' or 'GHL')
  source: { type: String, enum: ['Leap', 'GHL'], required: true },

  // Synced flag to know if the job is synced across CRMs
  synced: { type: Boolean, default: false }
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
