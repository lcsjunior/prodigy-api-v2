const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const { isAuthenticated } = require('../config/passport');
const { validateAsync } = require('../config/validator');
const {
  list,
  create,
  show,
  update,
  remove,
  bulkUpdate,
  showDashboard,
} = require('../controllers/channels');

router.get('/', isAuthenticated, list);

router.post(
  '/',
  isAuthenticated,
  validateAsync(body('channelId').isInt().toInt()),
  create
);

router.get(
  '/:id/dashboard',
  isAuthenticated,
  validateAsync(param('id').isMongoId()),
  showDashboard
);

router.get(
  '/:id',
  isAuthenticated,
  validateAsync(param('id').isMongoId()),
  show
);

router.patch('/bulk', isAuthenticated, bulkUpdate);

router.patch(
  '/:id',
  isAuthenticated,
  validateAsync(param('id').isMongoId()),
  update
);

router.delete(
  '/:id',
  isAuthenticated,
  validateAsync(param('id').isMongoId()),
  remove
);

module.exports = router;
