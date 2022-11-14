const getTimestampInSeconds = () => Math.floor(Date.now() / 1000);

const dateTimeHelpers = {
  getTimestampInSeconds,
};

module.exports = dateTimeHelpers;
