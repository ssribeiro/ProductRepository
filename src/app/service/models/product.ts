export interface Product {
	id:string;
	name?:string;
	created?:string;
}

import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;
export const ProductSchema = new Schema({
  id: Schema.ObjectId,
  name: String,
  created: { type: Date, default: Date.now }
});