import mongoose, { Schema, Document, Model } from 'mongoose';
import timestamp from 'mongoose-timestamp';
import { IConfig } from './Config';

export interface ITag extends Document {
  name: string;
  overrideConfigs?: string[] | IConfig[];
}

export const TagSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  overrideConfigs: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Config',
    },
  ],
});

TagSchema.plugin(timestamp);

export default (mongoose.models.Tag ||
  mongoose.model<ITag>('Tag', TagSchema)) as Model<ITag>;
