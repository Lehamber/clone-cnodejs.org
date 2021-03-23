const mongoose = require('mongoose');

const { Schema } = mongoose;

let ObjectId  = Schema.ObjectId;

let ReplySchema = new Schema({
    content: { type: String, required: true },
    topic_id: { type: ObjectId, required: true },
    replier_id: { type: ObjectId, required: true },
    reply_to_id: { type: ObjectId, default: null }, // 被回复的 评论 ( 回复id )
    support_count: { type: Number, default: 0 },
    create_at: { type: Date, default: Date.now },
    update_at: { type: Date, default: Date.now }
});


mongoose.model('Reply', ReplySchema);