const { retrieveChannelData } = require('../libs/thingspeak-api');
const { Channel } = require('../models');

const list = async (req, res, next) => {
  try {
    const { user } = req;
    let channels = await Channel.find({ user }).sort('sortOrder').lean();
    channels = await retrieveChannelData(channels);
    res.json(channels);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { user, body } = req;
    const newChannel = await Channel.create({
      user: user.id,
      channelId: body.channelId,
      readApiKey: body.readApiKey,
      writeApiKey: body.writeApiKey,
    });
    res.status(201).json(newChannel);
  } catch (err) {
    next(err);
  }
};

const show = async (req, res, next) => {
  try {
    const { user, params } = req;
    let channel = await Channel.findOne({
      _id: params.id,
      user,
    }).lean();
    if (channel) {
      [channel] = await retrieveChannelData([channel]);
      return res.json(channel);
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    next(err);
  }
};

const bulkUpdate = async (req, res, next) => {
  try {
    const { user, body } = req;
    const statements = body.map(({ id, sortOrder }) => {
      return Channel.updateOne({ _id: id, user }, { sortOrder });
    });
    const results = await Promise.all(statements);
    res.json(results);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { user, params, body } = req;
    const channel = await Channel.findOneAndUpdate(
      {
        _id: params.id,
        user,
      },
      {
        readApiKey: body.readApiKey,
        writeApiKey: body.writeApiKey,
      },
      { new: true }
    );
    res.json(channel);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { user, params } = req;
    const result = await Channel.deleteOne({
      _id: params.id,
      user,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  create,
  show,
  bulkUpdate,
  update,
  remove,
};
