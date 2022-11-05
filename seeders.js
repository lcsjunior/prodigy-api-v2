#!/usr/bin/node

const { mongoose } = require('./config/mongo');
const { User } = require('./models');
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

(async () => {
  try {
    await User.deleteMany({
      username: { $in: seedUsers.map(({ username }) => username) },
    });
    const asSeedUsers = await Promise.all(
      seedUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, saltRounds),
      }))
    );
    await User.insertMany(asSeedUsers);
    mongoose.connection.close();
    console.log('Seeder successfully executed');
  } catch (err) {
    console.error(err);
  }
  process.exit();
})();
