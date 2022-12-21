const bcrypt = require('bcrypt');
const User = require('../models/User');

// @desc    get all users
// @route   GET /users
// @access  Private
exports.getUsers = async (req, res, next) => {
    const users = await User.find({}, '-password').lean().exec();
    if (!users.length) {
        return res.status(404).json({ message: 'No users found' });
    }
    res.status(200).json(users);
};

// @desc    Register a user
// @route   POST /users
// @access  Private

exports.registerUser = async (req, res, next) => {
    const { username, password, roles } = req.body;
    if (!username || !password) {
        return res
            .status(400)
            .json({ message: 'Please provide a username and password' });
    }

    const duplicate = await User.findOne({
        username: { $regex: username, $options: 'i' },
    })
        .lean()
        .exec();

    if (duplicate) {
        return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser =
        !Array.isArray(roles) && !roles.length
            ? { username, password: hashedPassword }
            : { username, password: hashedPassword, roles };

    const user = await User.create(newUser);
    res.status(201).json({ message: `User ${user.username} created` });
};

// @desc    Update a user
// @route   PATCH /users
// @access  Private

exports.updateUser = async (req, res, next) => {
    const { id, username, password, roles, active } = req.body;
    if (
        !id ||
        !Array.isArray(roles) ||
        !roles.length ||
        typeof active !== 'boolean'
    ) {
        return res
            .status(400)
            .json({ message: 'Please provide a required data' });
    }

    const user = await User.findById(id).exec();

    const duplicate = await User.findOne({
        username: { $regex: username, $options: 'i' },
    })
        .lean()
        .exec();

    if (duplicate && duplicate._id.toString() !== id) {
        return res.status(400).json({ message: 'Username already exists' });
    }

    // update data
    user.username = username;
    user.roles = roles;
    user.active = active;

    if (password) {
        user.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await user.save();
    res.status(200).json({ message: `User ${updatedUser.username} updated` });
};

// @desc    Delete a user
// @route   DELETE /users
// @access  Private

exports.deleteUser = async (req, res, next) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ message: 'Please provide a user id' });
    }

    const user = await User.findById(id).exec();

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const deletedUser = await user.remove();
    res.status(200).json({ message: `User ${deletedUser.username} deleted` });
};
