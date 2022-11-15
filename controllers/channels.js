const {
  retrieveChannelData,
  retrieveChannelFeeds,
  retrieveChannelDataAndLastEntry,
} = require('../libs/thingspeak-api');
const { Channel, WidgetType, Widget } = require('../models');
const _ = require('lodash');
const { addSeconds } = require('date-fns');
const { setIntervalAsync, clearIntervalAsync } = require('set-interval-async');
const channelHelpers = require('../utils/channel-helpers');
const dateTimeHelpers = require('../utils/datetime-helpers');

const sseResponseHeaders = {
  'Content-Type': 'text/event-stream',
  Connection: 'keep-alive',
  'Cache-Control': 'no-cache',
};
const subscribers = new Set();

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
    let channels = await Channel.find({ user }).sort('sortOrder');
    channels = await retrieveChannelData(
      channels.map((channel) => channel.toJSON())
    );
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
    let channel = await Channel.findOne({
      _id: newChannel.id,
      user,
    });
    const channelJson = channel.toJSON();
    [channel] = await retrieveChannelData([channelJson]);
    const type = await WidgetType.findBySlug('time-series');
    const widgets = channelHelpers
      .getArrayOfFields(channel.data)
      .map((field) => ({
        channel: channel._id,
        type: type,
        sortOrder: field.id,
        fields: [
          {
            id: field.id,
          },
        ],
      }));
    await Widget.insertMany(widgets);
    res.status(201).json(channel);
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
    });
    if (channel) {
      const channelJson = channel.toJSON();
      [channel] = await retrieveChannelFeeds([channelJson], {
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

  const subscriber = { res };
  subscribers.add(subscriber);

  res.write(
    `data: ${JSON.stringify({
      ts: dateTimeHelpers.getTimestampInSeconds(),
    })}\n\n`
  );

  const { user, params, query } = req;
  const controller = new AbortController();
  const timeoutMs = 5000;
  let lastEntryAt = query?.lastEntryAt;
  let channelJson;

  const publish = async () => {
    try {
      if (!channelJson) {
        const channel = await Channel.findOne({
          _id: params.id,
          user,
        });
        channelJson = channel.toJSON();
      }
      if (channelJson) {
        [channelJson] = await retrieveChannelFeeds(
          [channelJson],
          {
            start: lastEntryAt,
          },
          controller
        );
        if (channelJson?.feeds && channelJson.feeds.length > 0) {
          lastEntryAt = addSeconds(
            _.maxBy(channelJson.feeds, 'created_at').created_at,
            1
          );
          res.write('event: feed\n');
          res.write(`data: ${JSON.stringify(channelJson.feeds)}\n\n`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };
  const timer = setIntervalAsync(publish, timeoutMs);

  req.on('close', async () => {
    controller.abort();
    await clearIntervalAsync(timer);
    subscriber.res.end();
    subscribers.delete(subscriber);
    console.log('Connection closed');
  });
};

const showDashboard = async (req, res, next) => {
  try {
    const { user, params } = req;
    let channel = await Channel.findOne({
      _id: params.id,
      user,
    });
    if (channel) {
      const channelJson = channel.toJSON();
      const results = await Promise.all([
        retrieveChannelDataAndLastEntry([channelJson]),
        retrieveChannelFeeds([channelJson], {
          results: 4000,
          timescale: 10,
        }),
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
    });
    if (channel) {
      const channelJson = channel.toJSON();
      [channel] = await retrieveChannelData([channelJson]);
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
    await Channel.findOneAndUpdate(
      {
        _id: params.id,
        user,
      },
      {
        $set: {
          readApiKey: body.readApiKey,
          writeApiKey: body.writeApiKey,
        },
      }
    );
    next();
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
