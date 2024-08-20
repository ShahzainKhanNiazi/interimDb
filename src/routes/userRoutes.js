const express = require('express');
const router = express.Router();
const { assignRole, updateUser } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get a single user by ID
router.get('/:id', getUserById);
// Get all users
router.get('/', getAllUsers);
// Assign a role to a user
router.post('/assign-role', assignRole);
// Update user details
router.put('/update', updateUser);

module.exports = router;
