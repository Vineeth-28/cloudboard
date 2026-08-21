const User = require('../models/user.model');

async function listUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ count: users.length, users });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email } = req.body;
    const user = await User.create({ name, email });
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, createUser };
