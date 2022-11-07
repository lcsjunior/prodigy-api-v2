const { WidgetType } = require('../models');

const listTypes = async (req, res, next) => {
  try {
    const types = await WidgetType.find().sort('sortOrder').lean();
    res.json(types);
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {};

const create = async (req, res, next) => {};

const show = async (req, res, next) => {};

const bulkUpdate = async (req, res, next) => {};

const update = async (req, res, next) => {};

const remove = async (req, res, next) => {};

module.exports = {
  listTypes,
  list,
  create,
  show,
  bulkUpdate,
  update,
  remove,
};
