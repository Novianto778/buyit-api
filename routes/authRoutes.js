const express = require('express');
const { login, logout, refresh } = require('../controllers/authControllers');
const router = express.Router();

router.route('/').post(login);
router.route('/logout').post(logout);
router.route('/refresh').get(refresh);

module.exports = router;
