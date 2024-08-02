const { fetchJobById, fetchCustomerById, fetchAllJobs, fetchAllCustomers } = require('../services/leapService.js');


// Fetch a single job by ID
const getJobById = async (req, res) => {
    try {
        const job = await fetchJobById(req.params.id);
        res.json(job);
    } catch (error) {
        res.status(500).send('Error fetching job');
    }
};

// Fetch a single customer by ID
const getCustomerById = async (req, res) => {
    try {
        const customer = await fetchCustomerById(req.params.id);
        res.json(customer);
    } catch (error) {
        res.status(500).send('Error fetching customer');
    }
};

// Fetch all jobs with limit
const getAllJobs = async (req, res) => {
    try {
        const jobs = await fetchAllJobs(req.query.limit || 5);
        res.json(jobs);
    } catch (error) {
        res.status(500).send('Error fetching jobs');
    }
};

// Fetch all customers with limit
const getAllCustomers = async (req, res) => {
    try {
        const customers = await fetchAllCustomers(req.query.limit || 5);
        res.json(customers);
    } catch (error) {
        res.status(500).send('Error fetching customers');
    }
};

module.exports = {
    getJobById,
    getCustomerById,
    getAllJobs,
    getAllCustomers
};
