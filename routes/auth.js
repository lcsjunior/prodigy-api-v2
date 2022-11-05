const express = require('express');
const router = express.Router();
const { login, logout, show } = require('../controllers/auth');
const { passport, isAuthenticated } = require('../config/passport');

router.get('/user', isAuthenticated, show);

router.post('/login', passport.authenticate('local'), login);

router.all('/logout', logout);

module.exports = router;
