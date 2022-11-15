#!/usr/bin/node

const { mongoose } = require('./config/mongo');
const { User, Channel, WidgetType, Widget } = require('./models');
const bcrypt = require('bcrypt');
const argv = require('minimist')(process.argv.slice(2));

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
    name: 'Display',
    slug: 'display',
    sortOrder: 2,
  },
];

(async () => {
  try {
    // npm run seed -- -d
    if (argv.d) {
      await Widget.deleteMany({});
      await WidgetType.deleteMany({});
      await Channel.deleteMany({});
      await User.deleteMany({});
    }

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
