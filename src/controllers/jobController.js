const Job = require('../models/Job');

// Controller function to add a new job
const addJob = async (req, res) => {
  const { jobId, name, number, customer_id, description, created_by, current_stage } = req.body;

  try {
    const newJob = new Job({
      jobId,
      name,
      number,
      customer_id,
      description,
      created_by,
      created_at: new Date(),
      updated_at: new Date(),
      current_stage,
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
  const { id, name, number, description, current_stage } = req.body;

  try {
    let job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.name = name || job.name;
    job.number = number || job.number;
    job.description = description || job.description;
    job.current_stage = current_stage || job.current_stage;
    job.updated_at = new Date();

    await job.save();
    return res.status(200).json({ message: 'Job updated successfully', job });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addJob, getJob, getAllJobs, updateJob };
