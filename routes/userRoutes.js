const express = require('express');
const router = express.Router();
const {
    getUsers,
    registerUser,
    updateUser,
    deleteUser,
} = require('../controllers/userControllers');
const verifyRoles = require('../middleware/verifyRoles');

router
    .route('/')
    .get(getUsers)
    .post(registerUser)
    .patch(updateUser)
    .delete(verifyRoles('admin', 'super_admin'), deleteUser);

// params
router.route('/:id').get(getUsers);

module.exports = router;
