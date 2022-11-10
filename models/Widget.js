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
  {
    timestamps: false,
    _id: false,
    toJSON: {
      virtuals: true,
    },
  }
);

fieldSchema.virtual('key').get(function () {
  return `field${this.id}`;
});

const widgetSchema = new mongoose.Schema(
  {
    channel: { type: SchemaTypes.ObjectId, ref: 'Channel', required: true },
    type: { type: SchemaTypes.ObjectId, ref: 'WidgetType', required: true },
    fields: [fieldSchema],
    sortOrder: Number,
  },
  { timestamps: true }
);

widgetSchema.pre('save', async function (next) {
  const widget = this;
  if (widget.isNew) {
    const lastWidget = await Widget.findOne(
      { user: widget.user },
      'sortOrder'
    ).sort('-sortOrder');
    widget.sortOrder = (lastWidget?.sortOrder || 0) + 1;
  }
  next();
});

const Widget = mongoose.model('Widget', widgetSchema);
module.exports = Widget;
