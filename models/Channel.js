const mongoose = require('mongoose');
const SchemaTypes = mongoose.Schema.Types;

const channelSchema = new mongoose.Schema(
  {
    channelId: { type: Number, required: true },
    readApiKey: { type: String },
    writeApiKey: { type: String },
    sortOrder: { type: Number },
    user: { type: SchemaTypes.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

channelSchema.pre('save', async function (next) {
  const channel = this;
  if (channel.isNew) {
    const lastChannel = await Channel.findOne(
      { user: channel.user },
      'sortOrder'
    ).sort('-sortOrder');
    channel.sortOrder = (lastChannel?.sortOrder || 0) + 1;
  }
  next();
});

channelSchema.set('toJSON', {
  transform: (doc, ret, opt) => {
    delete ret['readApiKey'];
    delete ret['writeApiKey'];
  },
});

const Channel = mongoose.model('Channel', channelSchema);
module.exports = Channel;
