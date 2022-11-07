#!/usr/bin/node

const { mongoose } = require('./config/mongo');
const { User, Channel, WidgetType } = require('./models');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const seedUsers = [
  {
    email: 'sa@prodigyio.com',
    username: 'sa',
    password: process.env.SA_PASS,
    firstName: 'Super',
    lastName: 'Admin',
    role: 'sa',
  },
];

const seedChannels = [
  {
    channelId: 1802103,
  },
  {
    channelId: 1854957,
  },
];

const seedWidgetTypes = [
  {
    name: 'Time series',
    slug: 'time-series',
    sortOrder: 1,
  },
  {
    name: 'Gauge',
    slug: 'gauge',
    sortOrder: 2,
  },
];

(async () => {
  try {
    const asSeedUsers = await Promise.all(
      seedUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, saltRounds),
      }))
    );
    await Promise.all(
      asSeedUsers.map((user) =>
        User.findOneAndUpdate({ email: user.email }, user, {
          upsert: true,
        })
      )
    );

    const saUser = await User.findByUsername('sa');
    await Promise.all(
      seedChannels.map((channel) =>
        Channel.findOneAndUpdate(
          { user: saUser.id, channelId: channel.channelId },
          { ...channel, user: saUser.id },
          {
            upsert: true,
          }
        )
      )
    );

    await Promise.all(
      seedWidgetTypes.map((widgetTypes) =>
        WidgetType.findOneAndUpdate({ name: widgetTypes.name }, widgetTypes, {
          upsert: true,
        })
      )
    );
  } catch (err) {
    console.error(err);
  }
  mongoose.connection.close();
  console.log('Seeder successfully executed');
  process.exit();
})();
