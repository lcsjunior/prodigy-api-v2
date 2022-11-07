const express = require('express');
const { query, param, body } = require('express-validator');
const router = express.Router();
const { isAuthenticated } = require('../config/passport');
const { validateAsync } = require('../config/validator');
const { isOwnerChannel } = require('../controllers/channels');
const {
  listTypes,
  list,
  create,
  show,
  bulkUpdate,
  update,
  remove,
} = require('../controllers/widgets');

router.get('/types', isAuthenticated, listTypes);

router.get(
  '/',
  isAuthenticated,
  validateAsync(query('chId').isMongoId()),
  isOwnerChannel,
  list
);

router.post(
  '/',
  isAuthenticated,
  validateAsync([query('chId').isMongoId(), body('type').not().isEmpty()]),
  isOwnerChannel,
  create
);

router.get(
  '/:id',
  isAuthenticated,
  validateAsync([param('id').isMongoId(), query('chId').isMongoId()]),
  isOwnerChannel,
  show
);

router.patch(
  '/bulk',
  isAuthenticated,
  validateAsync(query('chId').isMongoId()),
  bulkUpdate
);

router.patch(
  '/:id',
  isAuthenticated,
  validateAsync([param('id').isMongoId(), query('chId').isMongoId()]),
  isOwnerChannel,
  update
);

router.delete(
  '/:id',
  isAuthenticated,
  validateAsync([param('id').isMongoId(), query('chId').isMongoId()]),
  isOwnerChannel,
  remove
);

module.exports = router;
