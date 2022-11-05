const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

mongoose.connect(process.env.MONGODB_CONNSTRING);
const connection = mongoose.connection;
connection.once(
  'open',
  console.log.bind(console, 'MongoDB connection established successfully')
);
connection.on(
  'error',
  console.error.bind(console, 'MongoDB connection error:')
);

const mongoStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_CONNSTRING,
});

module.exports = {
  mongoose,
  mongoStore,
};
