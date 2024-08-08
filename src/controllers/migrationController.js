const { fetchAllJobs, fetchAllCustomers } = require('../services/leapService.js');
const { handleError } = require('../utils/errorHandler');
const Job = require('../models/Job'); 
const Customer = require('../models/Customer');


const migrateCustomers = async (req, res) => {
    const { limit, page } = req.query;
  try {
    const customers = await fetchAllCustomers(parseInt(limit) || 5, parseInt(page) || 1);
    await Customer.insertMany(customers, { ordered: false }); // Batch insert with unordered to skip duplicates
    res.status(200).json({ message: 'Customers migrated successfully', count: customers.length });
  } catch (error) {
    handleError(res, error);
  }
};

const migrateJobs = async (req, res) => {
    const { limit, page } = req.query;
    try {
      const jobs = await fetchAllJobs(parseInt(limit) || 5, parseInt(page) || 1);
    await Job.insertMany(jobs, { ordered: false }); // Batch insert with unordered to skip duplicates
    res.status(200).json({ message: 'Jobs migrated successfully', count: jobs.length });
  } catch (error) {
    handleError(res, error);
  }
};


module.exports = {
    migrateCustomers,
    migrateJobs
};
