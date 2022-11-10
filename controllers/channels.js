const {
  retrieveChannelData,
  retrieveChannelFeeds,
  retrieveChannelDataAndLastEntry,
} = require('../libs/thingspeak-api');
const { Channel } = require('../models');
const _ = require('lodash');
const { addSeconds } = require('date-fns');
const { setIntervalAsync, clearIntervalAsync } = require('set-interval-async');

const sseResponseHeaders = {
  'Content-Type': 'text/event-stream',
  Connection: 'keep-alive',
  'Cache-Control': 'no-cache',
};
const clients = new Set();

const isOwnerChannel = async (req, res, next) => {
  const { user, query } = req;
  const channel = await Channel.findOne({
    user,
    _id: query.chId,
  });
  if (channel) {
    next();
  } else {
    res.sendStatus(403);
  }
};

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
    req.params['id'] = newChannel.id;
    res.status(201).json(newChannel);
  } catch (err) {
    next(err);
  }
};

const pollHandler = async (req, res, next) => {
  try {
    const { user, query, params } = req;
    let channel = await Channel.findOne({
      _id: params.id,
      user,
    }).lean();
    if (channel) {
      [channel] = await retrieveChannelFeeds([channel], {
        start: query?.lastEntryAt,
      });
      return res.json(channel.feeds);
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    next(err);
  }
};

const eventsHandler = (req, res, next) => {
  res.writeHead(200, sseResponseHeaders);

  const client = { res };
  clients.add(client);

  const { user, params, query } = req;
  const controller = new AbortController();
  const timeoutMs = 5000;
  let lastEntryAt = query?.lastEntryAt;
  let channel;

  const feedData = async () => {
    try {
      if (!channel) {
        channel = await Channel.findOne({
          _id: params.id,
          user,
        }).lean();
      }
      if (channel) {
        [channel] = await retrieveChannelFeeds(
          [channel],
          {
            start: lastEntryAt,
          },
          controller
        );
        if (channel?.feeds && channel.feeds.length > 0) {
          lastEntryAt = addSeconds(
            _.maxBy(channel.feeds, 'created_at').created_at,
            1
          );
          const strJson = JSON.stringify(channel.feeds);
          const data = `data: ${strJson}\n\n`;
          res.write(data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };
  const timer = setIntervalAsync(feedData, timeoutMs);

  req.on('close', async () => {
    controller.abort();
    await clearIntervalAsync(timer);
    client.res.end();
    clients.delete(client);
    console.log('Connection closed');
  });
};

const showDashboard = async (req, res, next) => {
  try {
    const { user, params } = req;
    let channel = await Channel.findOne({
      _id: params.id,
      user,
    }).lean();
    if (channel) {
      const results = await Promise.all([
        retrieveChannelDataAndLastEntry([channel]),
        retrieveChannelFeeds([channel]),
      ]);
      [channel] = results[0];
      channel = { ...channel, feeds: results[1][0].feeds };
      return res.json(channel);
    } else {
      res.sendStatus(204);
    }
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
    const result = await Channel.updateOne(
      {
        _id: params.id,
        user,
      },
      {
        readApiKey: body.readApiKey,
        writeApiKey: body.writeApiKey,
      }
    );
    res.json(result);
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
  isOwnerChannel,
  list,
  create,
  pollHandler,
  eventsHandler,
  showDashboard,
  show,
  bulkUpdate,
  update,
  remove,
};
