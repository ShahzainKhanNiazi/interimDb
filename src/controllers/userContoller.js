const User = require('../models/User');

// Assign a role to a user
const assignRole = async (req, res) => {
  const { email, role } = req.body;
  try {
    const user = await User.findOneAndUpdate({ email }, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'Role updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user details (optional)
const updateUser = async (req, res) => {
  const { email, name, role } = req.body;
  try {
    const updates = {};
    if (name) updates.name = name;
    if (role) updates.role = role;
    
    const user = await User.findOneAndUpdate({ email }, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { assignRole, updateUser };
