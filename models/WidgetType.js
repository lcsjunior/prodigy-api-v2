const mongoose = require('mongoose');

const widgetTypeSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    sortOrder: Number,
  },
  { timestamps: true }
);

const WidgetType = mongoose.model('WidgetType', widgetTypeSchema);
module.exports = WidgetType;
