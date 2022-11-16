const mongoose = require('mongoose');
const Widget = require('./Widget');
const mongooseFieldEncryption =
  require('mongoose-field-encryption').fieldEncryption;
const SchemaTypes = mongoose.Schema.Types;

const channelSchema = new mongoose.Schema(
  {
    channelId: { type: Number, required: true },
    readApiKey: String,
    writeApiKey: String,
    sortOrder: Number,
    displayName: String,
    user: { type: SchemaTypes.ObjectId, ref: 'User', required: true },
    widgets: { type: SchemaTypes.ObjectId, ref: 'Widget' },
  },
  { timestamps: true }
);

channelSchema.plugin(mongooseFieldEncryption, {
  fields: ['readApiKey', 'writeApiKey'],
  secret: process.env.SESSION_SECRET,
});

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

channelSchema.pre('deleteOne', async function (next) {
  const deletedData = await Channel.find(this._conditions).lean();
  await Widget.deleteMany({ channel: { $in: deletedData } });
  next();
});

const Channel = mongoose.model('Channel', channelSchema);
module.exports = Channel;
