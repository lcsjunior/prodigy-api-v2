const { WidgetType, Widget } = require('../models');

const listTypes = async (req, res, next) => {
  try {
    const types = await WidgetType.find().sort('sortOrder').lean();
    res.json(types);
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const { query } = req;
    const widgets = await Widget.find({ channel: query.chId })
      .sort('sortOrder')
      .populate('type');
    res.json(widgets);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { query, body } = req;
    const newWidget = await Widget.create({
      channel: query.chId,
      type: body.type,
      fields: body.fields.map((field) => ({
        id: field.id,
        color: field.color,
        decimalPlaces: field.decimalPlaces,
      })),
      displayName: body.displayName,
      unit: body.unit,
      boolValue0: body.boolValue0,
      boolValue1: body.boolValue1,
      rangeMin: body.rangeMin,
      rangeMax: body.rangeMax,
    });
    req.params['id'] = newWidget.id;
    res.status(201);
    next();
  } catch (err) {
    next(err);
  }
};

const show = async (req, res, next) => {
  try {
    const { query, params } = req;
    const widget = await Widget.findOne({
      _id: params.id,
      channel: query.chId,
    })
      .populate('type')
      .lean();
    if (widget) {
      return res.json(widget);
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    next(err);
  }
};

const bulkUpdate = async (req, res, next) => {
  try {
    const { query, body } = req;
    const statements = body.map(({ id, sortOrder }) => {
      return Widget.updateOne({ _id: id, channel: query.chId }, { sortOrder });
    });
    const results = await Promise.all(statements);
    res.json(results);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { query, params, body } = req;
    await Widget.updateOne(
      {
        _id: params.id,
        channel: query.chId,
      },
      {
        fields: body.fields.map((field) => ({
          id: field.id,
          color: field.color,
          decimalPlaces: field.decimalPlaces,
        })),
        displayName: body.displayName,
        unit: body.unit,
        boolValue0: body.boolValue0,
        boolValue1: body.boolValue1,
        rangeMin: body.rangeMin,
        rangeMax: body.rangeMax,
      }
    );
    next();
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { query, params } = req;
    const result = await Widget.deleteOne({
      _id: params.id,
      channel: query.chId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listTypes,
  list,
  create,
  show,
  bulkUpdate,
  update,
  remove,
};
