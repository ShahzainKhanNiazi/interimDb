const express = require('express');
const router = express.Router();
const { assignRole, updateUser, getAllUsers, getSingleUser } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get a single user by ID
router.get('/:id', authenticateToken, getSingleUser);
// Get all users
router.get('/', authenticateToken, getAllUsers);
// Assign a role to a user
router.post('/assign-role', authenticateToken, assignRole);
// Update user details
router.put('/update', authenticateToken, updateUser);

module.exports = router;
