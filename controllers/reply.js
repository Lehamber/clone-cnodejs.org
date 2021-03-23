const md5 = require('md5');
const path = require('path');
const mongoose = require('mongoose');
const marked = require('marked');

const models = require('../models/index');
const config = require('../config');
const tools = require('./tools');
const session = require('express-session');

// 提交回复信息
let postReply = async function(req, res, next) {
    let body = req.body;
    try {
        let reply = new models.replySchema({
            content: body.content,
            topic_id: mongoose.Types.ObjectId(body.topic_id),
            replier_id: mongoose.Types.ObjectId(body.replier_id),
            reply_to_id: body.reply_id ? mongoose.Types.ObjectId(body.reply_id) : null // 被回复的 回复 id
        });
        await reply.save();

        // 文章回复数 加 1
        let topic = await models.topicShcema.findById(String(body.topic_id));

        await models.topicShcema.findByIdAndUpdate(String(body.topic_id), {
            reply_count: topic.reply_count + 1
        });

        res.status(200).json({
            code: 1,
            message: '回复成功'
        });

    } catch (err) {
        next(err);
    }
};

// 获取回复历史交谈窗口信息
let getReplyDetail = async function(req, res, next) {
    let reply_id = req.query.reply_id;
    try {
        let replies_history = [];
        let i = 0;
        let reply = null;
        let reply_to = null;
        let reply_to_user = null;

        reply = await models.replySchema.findById(reply_id);
        if (reply.reply_to_id === null){
            res.status(200).json({
                code: 2,
                message: '该用户的回复已经被删除',
            });
        }

        do {
            reply = await models.replySchema.findById(reply_id);
            reply_to = await models.replySchema.findById(String(reply.reply_to_id));
            reply_to_user = await models.userSchema.findById(String(reply_to.replier_id));

            replies_history[i] = {
                reply_id: String(reply_to._id),
                avatar: path.join(`/public/images/user_avatar/${ reply_to_user.avatar }`),
                content: reply_to.content,
                reply_to_name: reply_to_user.nickname
            }

            reply_id = String(reply_to._id);
            if (reply_to.reply_to_id !== null) {
                let reply2 = await models.replySchema.findById(reply_id);
                let reply_to2 = await models.replySchema.findById(String(reply2.reply_to_id));
                let reply_to_user2 = await models.userSchema.findById(String(reply_to2.replier_id));
                replies_history[i].content = `@ ${ reply_to_user2.nickname }: ${ replies_history[i].content }`;
            }
            i++;
        } while (reply_to.reply_to_id !== null)

        res.status(200).json({
            code: 1,
            message: '成功',
            replies_history: replies_history.reverse()
        });

    } catch (err) {
        next(err);
    }
}

// 获取回复修改页面
let getEditPage = async function(req, res, next) {
    let reply_id = req.params.reply_id;
    let session_user = req.session.user;
    let user = {
        nickname: session_user.nickname,
        avatar: path.join('/public/images/user_avatar/' + session_user.avatar),
        signature: session_user.signature
    }
 
    try {
        let reply = await models.replySchema.findById(reply_id);
        // 验证修改者的身份
        if ( String(reply.replier_id) !== String(session_user._id) ){
            let message = '对不起，你没有对该回复的修改权限！'
            res.render('notice.html', { message, session_user, user})
        }

        reply_id = String(reply._id);
        let content = reply.content;
        let topic_id = String(reply.topic_id);

        res.render('reply/edit_reply.html', {
            session_user,
            reply_id,
            topic_id,
            content
        });
    } catch (err) {
        next(err);
    }
}

// 提交修改后的回复内容；
// 这不也滴验证 修改权限哪；
let postEditPage = async function(req, res, next) {
    let body = req.body;
    try {
        await models.replySchema.findByIdAndUpdate(body.reply_id, {
            content: body.content
        });

        res.status(200).json({
            code: 1,
            message: '编辑成功'
        })
    } catch (err) {
        next(err);
    }
}

// 删除回复信息 
let del = async function(req, res, next) {
    let reply_id = req.query.reply_id;
    let topic_id = req.query.topic_id;
    let session_user = req.session.user;
    let user = {
        nickname: session_user.nickname,
        avatar: path.join('/public/images/user_avatar/' + session_user.avatar),
        signature: session_user.signature
    }
    try {
        // 验证此用户是否有删除权限
        let reply = await models.replySchema.findById(reply_id);
        if ( String(reply.replier_id) !== String(session_user._id) ){
            let message = '对不去，你没有对该回复的删除权限！';
            res.render('notic.html', { session_user, user, message });
        }

        // 删除回复
        await models.replySchema.findByIdAndDelete(reply_id);
        //文章回复数减 1
        let topic = await models.topicShcema.findById(topic_id);
        await models.topicShcema.findByIdAndUpdate(topic_id, {
            reply_count: topic.reply_count - 1
        });
        // 这个回复的所有回复 reply_to_id 属性置 为null
        let replies = await models.replySchema.find({
            reply_to_id: mongoose.Types.ObjectId(reply_id)
        });
        
        let reply_ids = [];
        for (let i = 0; i < replies.length; i++) {
            await models.replySchema.findByIdAndUpdate(String(replies[i]._id), {
                reply_to_id: null
            });
            reply_ids[i] = String(replies[i]._id);
        }

        res.status(200).json({
            code: 1,
            message: '删除成功',
            reply_count: topic.reply_count - 1,
            reply_ids: reply_ids
        });

    } catch (err) {
        next(err);
    }
}

// 给回复点赞
let praise = async function(req, res, next) {
    let reply_id = req.query.reply_id;
    let session_user = req.session.user;
    try {
        let prise = await models.PraiseSchema.findOne({
            reply_id: mongoose.Types.ObjectId(reply_id),
            user_id: session_user._id
        });

        let reply = await models.replySchema.findById(reply_id);
        if (!prise) {
            // 1、保存一条点赞记录
            await new models.PraiseSchema({
                reply_id: mongoose.Types.ObjectId(reply_id),
                user_id: session_user._id
            }).save();
            // 2、给此回复的 点赞数+1
            await models.replySchema.findByIdAndUpdate(reply_id, {
                support_count: reply.support_count + 1
            });
        } else {
            // 1、删除这个条点赞记录
            // let praise = await models.PraiseSchema.findOne({
            //     reply_id: mongoose.Types.ObjectId(reply_id),
            //     user_id: session_user._id
            // });
            // await models.PraiseSchema.findByIdAndDelete(String(praise._id));

            await models.PraiseSchema.remove({
                reply_id: mongoose.Types.ObjectId(reply_id),
                user_id: session_user._id
            })
            // 2、给此条回复的 点赞数-1
            await models.replySchema.findByIdAndUpdate(reply_id, {
                support_count: reply.support_count - 1
            });
        }

        reply = await models.replySchema.findById(reply_id);
        res.status(200).json({
            code: 1,
            message: '成功',
            support_count: reply.support_count
        });
    } catch (err) {
        next(err);
    }
}

exports.postReply = postReply;
exports.getReplyDetail = getReplyDetail;
exports.getEditPage = getEditPage;
exports.postEditPage = postEditPage;
exports.del = del;
exports.praise = praise;