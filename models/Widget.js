const mongoose = require('mongoose');
const SchemaTypes = mongoose.Schema.Types;

const fieldSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      min: 1,
      max: 8,
    },
  },
  { timestamps: true }
);

const widgetSchema = new mongoose.Schema(
  {
    channel: { type: SchemaTypes.ObjectId, ref: 'Channel', required: true },
    type: { type: SchemaTypes.ObjectId, ref: 'WidgetType', required: true },
    fields: [fieldSchema],
    sortOrder: Number,
  },
  { timestamps: true }
);

const Widget = mongoose.model('Widget', widgetSchema);
module.exports = Widget;
