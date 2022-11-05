const passport = require('passport');
const { BasicStrategy } = require('passport-http');
const { Strategy: LocalStrategy } = require('passport-local');
const { User } = require('../models');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

const verify = async (username, password, done) => {
  const user = await User.findOne({
    $or: [{ username }, { email: username }],
  });
  if (user) {
    const match = await user.comparePassword(password);
    if (match) {
      return done(null, user);
    }
  }
  return done(null, false);
};

passport.use(new LocalStrategy(verify));

passport.use(new BasicStrategy(verify));

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.sendStatus(401);
};

module.exports = {
  passport,
  isAuthenticated,
};
