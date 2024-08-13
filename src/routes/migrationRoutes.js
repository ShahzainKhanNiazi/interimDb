const express = require('express');
const router = express.Router();
const migrationController = require('../controllers/migrationController');

router.post('/jobs', migrationController.migrateJobs);
router.post('/customers', migrationController.migrateCustomers);
// Route to trigger customer migration
router.post('/allCustomers', migrationController.migrateAllCustomers);

module.exports = router;
