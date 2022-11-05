const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, saltRounds);
  }
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
  transform: (doc, ret, opt) => {
    delete ret['password'];
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
