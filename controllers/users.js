const { User } = require('../models');
const { messages } = require('../utils/messages');
const { ac } = require('../config/grants');

const checkEmailExists = async (value) => {
  const doc = await User.findByEmail(value);
  if (doc) {
    return Promise.reject(messages.alreadyInUse);
  }
};

const checkUsernameExists = async (value) => {
  const doc = await User.findByUsername(value);
  if (doc) {
    return Promise.reject(messages.alreadyInUse);
  }
};

const canReadAll = ({ user }) => {
  const permission = ac.can(user.role).readAny('users');
  return permission.granted;
};

const canRead = ({ user, params }) => {
  const permission =
    user.id == params.id
      ? ac.can(user.role).readOwn('users')
      : ac.can(user.role).readAny('users');
  return permission.granted;
};

const canUpdate = ({ user, params }) => {
  const permission =
    user.id == params.id
      ? ac.can(user.role).updateOwn('users')
      : ac.can(user.role).updateAny('users');
  return permission.granted;
};

const canDelete = ({ user, params }) => {
  const permission =
    user.id == params.id
      ? ac.can(user.role).deleteOwn('users')
      : ac.can(user.role).deleteAny('users');
  return permission.granted;
};

const list = async (req, res, next) => {
  try {
    const users = await User.find().lean();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { body } = req;
    const newUser = await User.create({
      fullName: body.fullName,
      email: body.email,
      username: body.username,
      password: body.password,
    });
    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
};

const show = async (req, res, next) => {
  try {
    const { params } = req;
    const user = await User.findById(params.id);
    if (user) {
      return res.json(user);
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { params, body } = req;
    const result = await User.updateOne(
      { _id: params.id },
      {
        fullName: body.fullName,
      },
      { new: true }
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { params } = req;
    const result = await User.deleteOne({ _id: params.id });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkEmailExists,
  checkUsernameExists,
  canReadAll,
  canRead,
  canUpdate,
  canDelete,
  list,
  create,
  show,
  update,
  remove,
};
