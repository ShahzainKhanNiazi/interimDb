const { fetchJobById, fetchCustomerById, fetchAllJobs, fetchAllCustomers } = require('../services/leapService.js');
const { handleError, ApiError } = require('../utils/errorHandler');

const getJobById = async (req, res) => {
  try {
    const job = await fetchJobById(req.params.id);
    res.json(job);
  } catch (error) {
    handleError(res, error);
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await fetchCustomerById(req.params.id);
    res.json(customer);
  } catch (error) {
    handleError(res, error);
  }
};

const getAllJobs = async (req, res) => {
  try {
    const jobs = await fetchAllJobs(req.query.limit || 5);
    res.json(jobs);
  } catch (error) {
    handleError(res, error);
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const customers = await fetchAllCustomers(req.query.limit || 5);
    res.json(customers);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getJobById,
  getCustomerById,
  getAllJobs,
  getAllCustomers
};
