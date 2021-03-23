const mongoose = require('mongoose');

const { Schema } = mongoose;

let ObjectId  = Schema.ObjectId;


let UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    nickname: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: 'avatar-default.png' },
    signature: { type: String, default: '这个家伙很懒，什么签名都没有留下' },
    weibo: { type: String },
    personal_web: { type: String },

    topic_count: { type: Number, default: 0},
    reply_count: { type: Number, default: 0},
    collect_topic_count: { type: Number, default: 0 },
    create_at: { type: Date, default: Date.now }
});


mongoose.model('User', UserSchema);