const express = require('express');
const router = express.Router();
const migrationController = require('../controllers/migrationController');

router.post('/migrate/jobs', migrationController.migrateJobs);
router.post('/migrate/customers', migrationController.migrateCustomers);

module.exports = router;
