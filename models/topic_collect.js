const mongoose = require('mongoose');

const { Schema } = mongoose;

let ObjectId  = Schema.ObjectId;


let TopicCollectSchema = Schema({
    topic_id: { type: ObjectId, required: true },
    user_id: { type: ObjectId, required: true },
    create_at: { type: Date, default: Date.now }
});

mongoose.model('TopicCollect', TopicCollectSchema);