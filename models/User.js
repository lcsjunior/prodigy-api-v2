const mongoose = require('mongoose');
const Channel = require('./Channel');
const bcrypt = require('bcrypt');
const initials = require('initials');

const saltRounds = 10;

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    username: { type: String, unique: true, required: true, minLength: 2 },
    password: { type: String, required: true, minLength: 6 },
    firstName: String,
    lastName: String,
    role: {
      type: String,
      enum: ['sa', 'admin', 'user'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

const getFullName = (firstName, lastName) =>
  `${firstName || ''} ${lastName || ''}`.trim();

userSchema
  .virtual('fullName')
  .get(function () {
    return getFullName(this.firstName, this.lastName);
  })
  .set(function (v) {
    const firstName = v.substring(0, v.indexOf(' '));
    const lastName = v.substring(v.indexOf(' ') + 1);
    this.set({ firstName, lastName });
  });

userSchema.virtual('initials').get(function () {
  const fullName = getFullName(this.firstName, this.lastName);
  return initials(fullName || this.username);
});

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, saltRounds);
  }
  next();
});

userSchema.pre('deleteOne', async function (next) {
  const deletedData = await User.find(this._conditions).lean();
  await Channel.deleteMany({ user: { $in: deletedData } });
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.statics.findByEmail = async function (email) {
  return this.findOne({ email });
};

userSchema.statics.findByUsername = async function (username) {
  return this.findOne({ username });
};

userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret, opt) => {
    delete ret['password'];
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
