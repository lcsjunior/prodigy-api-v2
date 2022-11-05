const env = process.env.NODE_ENV || 'development';
const isDev = env === 'development';

module.exports = {
  isDev,
};
