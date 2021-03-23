const mongoose = require('mongoose');

const { Schema } = mongoose;

let ObjectId  = Schema.ObjectId;

/**
 * type:
 *  reply: xx 恢复了你的话题
 *  collect: xx 收藏了你的话题
 */

let MessageSchema = new Schema({
    type: { type: String, required: true },
    topic_id: { type: ObjectId, required: true },
    sender_id: { type: ObjectId, required: true },
    has_read: { type: Boolean, default: false },
    create_at: { type: Date, default: Date.now }
});
 
mongoose.model('Message', MessageSchema);   