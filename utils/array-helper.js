const wrap = (obj) => (Array.isArray(obj) ? obj : [obj]);

const arrayHelper = {
  wrap,
};

module.exports = arrayHelper;
