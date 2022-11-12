const mongoose = require('mongoose');

const widgetTypeSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    sortOrder: Number,
  },
  { timestamps: false }
);

widgetTypeSchema.statics.findBySlug = async function (slug) {
  return this.findOne({ slug });
};

const WidgetType = mongoose.model('WidgetType', widgetTypeSchema);
module.exports = WidgetType;
