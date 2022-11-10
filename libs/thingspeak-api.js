const axios = require('axios');
const { default: axiosRetry } = require('axios-retry');
const { parseJSON, sub, format } = require('date-fns');
const _ = require('lodash');
const Papa = require('papaparse');

const instance = axios.create({
  baseURL: process.env.THINGSPEAK_API_URL,
});
axiosRetry(instance, { retries: 3 });

const tsDateFormat = "yyyy-MM-dd'T'HH:mm:ss.000xxx";

const prepareEntryData = (obj = {}) => {
  for (const key in obj) {
    if (key.substring(0, 5) === 'field') {
      obj[key] = _.toNumber(obj[key]);
    } else if (key === 'created_at') {
      obj[key] = parseJSON(obj[key]);
    }
  }
  return obj;
};

const fetchChannelData = async ({ channels, params }) => {
  const chs = _.uniqWith(channels, _.isEqual);
  const promises = chs
    .filter((channel) => channel.channelId)
    .map((channel) => {
      return instance.get(`/channels/${channel.channelId}/feeds.json`, {
        params: {
          api_key: channel.apiKey,
          results: 0,
          ...params,
        },
      });
    });
  const results = await Promise.allSettled(promises);
  const ret = results.reduce((acc, resp) => {
    if (resp.status === 'fulfilled') {
      return [...acc, resp.value.data?.channel];
    }
    return acc;
  }, []);
  return ret;
};

const fetchChannelLastEntry = async ({ channels, params }) => {
  const chs = _.uniqWith(channels, _.isEqual);
  const promises = chs
    .filter((channel) => channel.channelId)
    .map((channel) => {
      return instance.get(`/channels/${channel.channelId}/feeds/last.json`, {
        params: {
          api_key: channel.apiKey,
          results: 0,
          ...params,
        },
        extraParams: {
          id: channel.channelId,
        },
      });
    });
  const results = await Promise.allSettled(promises);
  const ret = results.reduce((acc, resp) => {
    if (resp.status === 'fulfilled') {
      const obj = {
        ...resp.value.config?.extraParams,
        ...prepareEntryData(resp.value.data),
      };
      return [...acc, obj];
    }
    return acc;
  }, []);
  return ret;
};

const fetchChannelDataAndLastEntry = async ({ channels }) => {
  const results = await Promise.all([
    fetchChannelData({ channels }),
    fetchChannelLastEntry({ channels }),
  ]);
  const ret = results[0].map((data) => {
    const lastEntry = results[1].find((r) => r.id === data.id);
    return {
      data,
      lastEntry,
    };
  });
  return ret;
};

const fetchChannelFeeds = async ({ channels, params, controller }) => {
  const chs = _.uniqWith(channels, _.isEqual);
  const promises = chs
    .filter((channel) => channel.channelId)
    .map((channel) => {
      return instance.get(`/channels/${channel.channelId}/feeds.csv`, {
        params: {
          api_key: channel.apiKey,
          start: channel.start,
          end: channel.end,
          ...params,
        },
        extraParams: {
          id: channel.channelId,
        },
        signal: controller?.signal,
      });
    });
  const results = await Promise.allSettled(promises);
  const ret = results.reduce((acc, resp) => {
    if (resp.status === 'fulfilled') {
      const csv = Papa.parse(resp.value.data, {
        dynamicTyping: true,
        skipEmptyLines: true,
        header: true,
        transform: (v, k) => (k === 'created_at' ? parseJSON(v) : v),
      });
      const obj = { ...resp.value.config?.extraParams, data: csv.data };
      return [...acc, obj];
    }
    return acc;
  }, []);
  return ret;
};

const iterateFetchChannelFeeds = async ({
  channels,
  options,
  onRead = async () => {},
}) => {
  const iterateCall = async (resolve, reject, channel, next) => {
    try {
      const reqCounter = (next.reqCounter || 0) + 1;
      const params = {
        results: _.min([next.recordsLimit, 8000]),
        start: format(next.start, tsDateFormat),
        end: format(next.end, tsDateFormat),
        timescale: options.timescale,
        round: options.round || 1,
      };
      const [{ data }] = await fetchChannelFeeds({
        channels: [channel],
        params,
      });
      await onRead({
        id: channel.channelId,
        data,
      });
      const minEntry = _.minBy(data, 'created_at');
      const lastEntry =
        reqCounter === 1 ? _.maxBy(data, 'created_at') : next.lastEntry;
      const ret = {
        ...next,
        reqCounter,
        recordsLimit: next.recordsLimit - data.length,
        end: sub(minEntry?.created_at || next.end, { seconds: 1 }),
        minEntry,
        lastEntry,
      };
      if (ret.start < ret.end && data.length > 0 && ret.recordsLimit > 0) {
        iterateCall(resolve, reject, channel, ret);
      } else {
        resolve({ channel, ret });
      }
    } catch (err) {
      reject(err);
    }
  };
  const chs = _.uniqWith(channels, _.isEqual);
  const promises = chs
    .filter((channel) => channel.channelId)
    .map((channel) => {
      return new Promise((resolve, reject) =>
        iterateCall(resolve, reject, channel, {
          id: channel.channelId,
          recordsLimit: options.recordsLimit || 1000,
          start: options.start,
          end: options.end,
        })
      );
    });
  const result = await Promise.allSettled(promises);
  const ret = result.reduce((acc, resp) => {
    if (resp.status === 'fulfilled') {
      return [...acc, resp.value];
    }
    return acc;
  }, []);
  return ret;
};

const retrieveChannelData = async (records) => {
  const results = await fetchChannelData({
    channels: records.map(({ channelId, readApiKey }) => ({
      channelId,
      apiKey: readApiKey,
    })),
  });
  return records.map((record) => {
    const data = results.find((r) => r.id === record.channelId);
    return {
      ...record,
      data,
    };
  });
};

const retrieveChannelDataAndLastEntry = async (records) => {
  const results = await fetchChannelDataAndLastEntry({
    channels: records.map(({ channelId, readApiKey }) => ({
      channelId,
      apiKey: readApiKey,
    })),
  });
  return records.map((record) => {
    const result = results.find((r) => r.data.id === record.channelId);
    return {
      ...record,
      ...result,
    };
  });
};

const retrieveChannelFeeds = async (records, params, controller) => {
  const results = await fetchChannelFeeds({
    channels: records.map(({ channelId, readApiKey }) => ({
      channelId,
      apiKey: readApiKey,
    })),
    params,
    controller,
  });
  return records.map((record) => {
    const feeds = results.find((r) => r.id === record.channelId);
    return {
      ...record,
      feeds: feeds?.data,
    };
  });
};

module.exports = {
  fetchChannelData,
  fetchChannelLastEntry,
  fetchChannelDataAndLastEntry,
  fetchChannelFeeds,
  iterateFetchChannelFeeds,
  retrieveChannelData,
  retrieveChannelDataAndLastEntry,
  retrieveChannelFeeds,
};
