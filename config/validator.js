const { validationResult } = require('express-validator');
const arrayHelper = require('../utils/array-helper');

const validateAsync = (chain) => {
  return async (req, res, next) => {
    await Promise.all(
      arrayHelper.wrap(chain).map((validation) => validation.run(req))
    );
    const result = validationResult(req);
    const hasErrors = !result.isEmpty();
    if (hasErrors) {
      res.status(400).json({ errors: result.array() });
    } else {
      next();
    }
  };
};

module.exports = {
  validateAsync,
};
