const { AccessControl } = require('accesscontrol');

let grantsObject = {
  sa: {
    $extend: ['admin'],
    users: {
      'read:any': ['*'],
      'update:any': ['*'],
      'delete:any': ['*'],
    },
  },
  admin: {
    $extend: ['user'],
  },
  user: {
    users: {
      'read:own': ['*'],
      'update:own': ['*'],
      'delete:own': ['*'],
    },
  },
};

const ac = new AccessControl(grantsObject);

const checkPerm = (permission) => {
  return (req, res, next) => {
    const granted = permission(req);
    if (granted) {
      next();
    } else {
      res.sendStatus(403);
    }
  };
};

module.exports = {
  ac,
  checkPerm,
};
