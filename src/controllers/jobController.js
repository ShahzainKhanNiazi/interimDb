const Job = require('../models/Job');

// Controller function to add a new job
const addJob = async (req, res) => {
  const { jobId, name, number, customer_id, description, same_as_customer_address, other_trade_type_description, created_by, call_required, appointment_required, tax_rate, alt_id, lead_number, duration, completion_date, contract_signed_date, current_stage, contact_same_as_customer, insurance, archived, hover_job_id, awarded_date, stage_last_modified, multi_job } = req.body;

  try {
    const newJob = new Job({
      jobId,
      name,
      number,
      customer_id,
      description,
      same_as_customer_address,
      other_trade_type_description,
      created_by,
      created_at: new Date(),
      updated_at: new Date(),
      call_required,
      appointment_required,
      tax_rate,
      alt_id,
      lead_number,
      duration,
      completion_date,
      contract_signed_date,
      current_stage,
      contact_same_as_customer,
      insurance,
      archived,
      hover_job_id,
      awarded_date,
      stage_last_modified,
      multi_job,
      is_deleted: false,
    });

    await newJob.save();
    return res.status(201).json({ message: 'Job added successfully', job: newJob });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Controller function to get a single job by ID
const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.query.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    return res.status(200).json(job);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Controller function to get all jobs
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find();
    return res.status(200).json(jobs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Controller function to update a job
const updateJob = async (req, res) => {
  const { id, name, number, description, same_as_customer_address, other_trade_type_description, call_required, appointment_required, tax_rate, alt_id, lead_number, duration, completion_date, contract_signed_date, current_stage, contact_same_as_customer, insurance, archived, hover_job_id, awarded_date, stage_last_modified, multi_job, is_deleted } = req.body;

  try {
    let job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.name = name || job.name;
    job.number = number || job.number;
    job.description = description || job.description;
    job.same_as_customer_address = same_as_customer_address || job.same_as_customer_address;
    job.other_trade_type_description = other_trade_type_description || job.other_trade_type_description;
    job.call_required = call_required || job.call_required;
    job.appointment_required = appointment_required || job.appointment_required;
    job.tax_rate = tax_rate || job.tax_rate;
    job.alt_id = alt_id || job.alt_id;
    job.lead_number = lead_number || job.lead_number;
    job.duration = duration || job.duration;
    job.completion_date = completion_date || job.completion_date;
    job.contract_signed_date = contract_signed_date || job.contract_signed_date;
    job.current_stage = current_stage || job.current_stage;
    job.contact_same_as_customer = contact_same_as_customer || job.contact_same_as_customer;
    job.insurance = insurance || job.insurance;
    job.archived = archived || job.archived;
    job.hover_job_id = hover_job_id || job.hover_job_id;
    job.awarded_date = awarded_date || job.awarded_date;
    job.stage_last_modified = stage_last_modified || job.stage_last_modified;
    job.multi_job = multi_job || job.multi_job;
    job.is_deleted = is_deleted || job.is_deleted;
    job.updated_at = new Date();

    await job.save();
    return res.status(200).json({ message: 'Job updated successfully', job });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addJob, getJob, getAllJobs, updateJob };
