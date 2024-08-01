const express = require('express');
const router = express.Router();

// Route to get signle job
router.get('/get', getJob);

// Route to get all jobs
router.get('/getAll', getAllJobs);

// Route to create a job
router.post('/create', addJob);

// Route to update a job
router.put('/update', updateJob);

module.exports = router;