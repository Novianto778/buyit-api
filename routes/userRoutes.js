const express = require('express');
const router = express.Router();
const {
    getUsers,
    registerUser,
    updateUser,
    deleteUser,
} = require('../controllers/userControllers');

router
    .route('/')
    .get(getUsers)
    .post(registerUser)
    .patch(updateUser)
    .delete(deleteUser);

module.exports = router;
