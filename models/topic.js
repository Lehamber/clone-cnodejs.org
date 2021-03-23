const mongoose = require('mongoose');

const { Schema } = mongoose;

let ObjectId  = Schema.ObjectId;

/**
 * type: 
 *  share: 类型为分享
 *  ask: 类型为问答
 */

let TopicSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author_id: { type: ObjectId, required: true },
    // is_share: { type: Boolean, default: false },
    // is_ask_question: { type: Boolean, default: false }
    type: { type: String, required: true },
    reply_count: { type: Number, default: 0 },
    visit_count: { type: Number, default: 0 },
    collected_count: { type: Number, default: 0 },
    create_at: { type: Date, default: Date.now },
    update_at: { type: Date, default: Date.now }
});

mongoose.model('Topic', TopicSchema);
