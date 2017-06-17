export interface State {
	name:string;
	version:number;
	edited:string;
}

import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;
export const StateSchema = new Schema({
  id: Schema.ObjectId,
  name: String,
  version: Number,
  edited: { type: Date, default: Date.now }
});