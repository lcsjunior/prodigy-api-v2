#!/usr/bin/node

const { mongoose } = require('./config/mongo');
const { User, Channel } = require('./models');
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

(async () => {
  try {
    await User.deleteMany({
      username: { $in: seedUsers.map(({ username }) => username) },
    });

    const aSeedUsers = await Promise.all(
      seedUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, saltRounds),
      }))
    );
    await User.insertMany(aSeedUsers);

    const saUser = await User.findByUsername('sa');
    await Channel.insertMany(
      seedChannels.map((channel) => ({
        ...channel,
        user: saUser.id,
      }))
    );

    mongoose.connection.close();
    console.log('Seeder successfully executed');
  } catch (err) {
    console.error(err);
  }
  process.exit();
})();
