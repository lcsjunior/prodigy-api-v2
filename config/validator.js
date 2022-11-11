const { validationResult } = require('express-validator');
const _ = require('lodash');

const validateAsync = (chain) => {
  return async (req, res, next) => {
    await Promise.all(
      _.castArray(chain).map((validation) => validation.run(req))
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
