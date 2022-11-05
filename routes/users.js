const express = require('express');
const {
  checkEmailExists,
  checkUsernameExists,
  canReadAll,
  list,
  create,
  canRead,
  show,
  canUpdate,
  update,
  canDelete,
  remove,
} = require('../controllers/users');
const router = express.Router();
const { validateAsync } = require('../config/validator');
const { body, param } = require('express-validator');
const { isAuthenticated } = require('../config/passport');
const { checkPerm } = require('../config/grants');

router.get('/', isAuthenticated, checkPerm(canReadAll), list);

router.post(
  '/',
  validateAsync([
    body('email').isEmail().custom(checkEmailExists),
    body('username').isLength({ min: 6 }).custom(checkUsernameExists),
    body('password').isLength({ min: 6 }),
  ]),
  create
);

router.get(
  '/:id',
  isAuthenticated,
  validateAsync(param('id').isMongoId()),
  checkPerm(canRead),
  show
);

router.patch(
  '/:id',
  isAuthenticated,
  validateAsync(param('id').isMongoId()),
  checkPerm(canUpdate),
  update
);

router.delete(
  '/:id',
  isAuthenticated,
  validateAsync(param('id').isMongoId()),
  checkPerm(canDelete),
  remove
);

module.exports = router;
