const express = require('express');
const router = express.Router();
const { assignRole, updateUser } = require('../controllers/userController');

router.post('/assign-role', assignRole);
router.put('/update', updateUser);

module.exports = router;
