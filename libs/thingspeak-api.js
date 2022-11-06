const axios = require('axios');
const { default: axiosRetry } = require('axios-retry');
const { parseJSON } = require('date-fns');
const _ = require('lodash');
const Papa = require('papaparse');

const instance = axios.create({
  baseURL: process.env.THINGSPEAK_API_URL,
});
axiosRetry(instance, { retries: 3 });

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

const fetchChannelFeeds = async ({ channels, params }) => {
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

module.exports = {
  fetchChannelData,
  fetchChannelLastEntry,
  fetchChannelDataAndLastEntry,
  fetchChannelFeeds,
  retrieveChannelData,
};
