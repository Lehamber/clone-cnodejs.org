const mongoose = require('mongoose');

const { Schema } = mongoose;

let ObjectId  = Schema.ObjectId;

/**
 * type:
 *  reply: xx 恢复了你的话题
 *  collect: xx 收藏了你的话题
 */

let PraiseSchema = new Schema({
    reply_id: { type: ObjectId, required: true },
    user_id: { type: ObjectId, required: true }
});
 
mongoose.model('Praise', PraiseSchema);   