const session = require('express-session');
const md5 = require('md5');
const marked = require('marked');
const path = require('path');
const mongoose = require('mongoose');

const models = require('../models/index');
const tools = require('./tools');
const {
  cssNumber,
  data
} = require('jquery');


// 获取话题发布页面
const getTopicCreate = function(req, res, next) {
  let session_user = req.session.user;
  res.render('topic/create_topic.html', {
    session_user
  });
};

// 提交新话题信息
const postTopicCreate = async function(req, res, next) {
  let body = req.body;
  try {
    let topic = new models.topicShcema( {
      title: body.title,
      content: body.t_content,
      type: body.type,
      author_id: req.session.user._id
    });

    await topic.save();
    res.status(200).json( {
      code: 1,
      message: '发布成功'
    });
  } catch (err) {
    next(err);
  }
}

// 获取谋篇文章的内容页
const getContentPage = async function(req, res, next) {
  let session_user = req.session.user;
  let topic_id = req.params.topic_id;
  try {
    let $topic = await models.topicShcema.findById(String(topic_id));
    // 浏览数加 1
    await models.topicShcema.findByIdAndUpdate(String(topic_id), {
      visit_count: $topic.visit_count + 1
    });

    // 查看此文章是否被 当前登录的用户收藏
    let collected = null;
    let collect = await models.topicCollectSchema.findOne( {
      topic_id: mongoose.Types.ObjectId(topic_id),
      user_id: session_user._id
    });

    if (collect === null) {
      collected = false;
    } else {
      collected = true;
    }

    let topic = {
      topic_id: String($topic._id),
      title: $topic.title,
      content: marked($topic.content),
      type: $topic.type,
      visit_count: $topic.visit_count + 1,
      reply_count: $topic.reply_count,
      create_time_interval: tools.getIntervalTime(new Date($topic.create_at)),
      update_time_interval: tools.getIntervalTime(new Date($topic.update_at)),
      collected: collected
    }

    let $user = await models.userSchema.findById(String($topic.author_id));
    let user = {
      nickname: $user.nickname,
      avatar: path.join(`/public/images/user_avatar/${ $user.avatar }`),
      signature: $user.signature
    }

    let $replies = await models.replySchema.find( {
      topic_id: mongoose.Types.ObjectId(topic_id)
    });

    // 按评论时间 距今的时间间隔  降序
    $replies.sort(function(a, b) {
      a = new Date(a.create_at).getTime();
      b = new Date(b.create_at).getTime();
      return a - b;
    });

    let replies = [];
    for (var i = 0; i < $replies.length; i++) {
      let replier = await models.userSchema.findById(String($replies[i].replier_id));
      let rep_reply = null; // 被回复的 回复（评论）
      let rep_replier = null; // 被回复的 回复（评论）的作者
      if ($replies[i].reply_to_id !== null) {
        rep_reply = await models.replySchema.findById(String($replies[i].reply_to_id));
        rep_replier = await models.userSchema.findById(String(rep_reply.replier_id));
      }

      // 查看登录页面的用户 是否可以给此 评论点赞
      let can_support = true;
      let pra_reply = await models.PraiseSchema.findOne( {
        reply_id: $replies[i]._id,
        user_id: mongoose.Types.ObjectId(session_user._id)
      });

      if (pra_reply) {
        can_support = false
      }

      replies[i] = {
        reply_id: String($replies[i]._id),
        reply_to_id: rep_reply && String(rep_reply._id),
        nickname: replier.nickname,
        replied_author_name: rep_replier && rep_replier.nickname,
        content: marked($replies[i].content),
        time_interval: tools.getIntervalTime(new Date($replies[i].create_at)),
        avatar: path.join(`/public/images/user_avatar/${ replier.avatar }`),
        support_count: $replies[i].support_count,
        can_support: can_support
      }
    }

    replies = replies.length === 0 ? null : replies;
    res.render('topic/content_page.html', {
      session_user,
      user,
      topic,
      replies
    });
  } catch (err) {
    next(err);
  }
}

// 获取编辑话题页面
const getEditPage = async function(req, res, next) {
  let topic_id = req.params.topic_id;
  let session_user = req.session.user;
  let user = {
    nickname: session_user.nickname,
    avatar: path.join('/public/images/user_avatar/' + session_user.avatar),
    signature: session_user.signature
  }

  try {
    // 验证话题编辑权限
    let $topic = await models.topicShcema.findById(topic_id);
    if (String($topic.author_id) !== String(session_user._id)) {
      let message = '对不起，你没有对该文章的编辑权限！';
      res.render('notice.html', {
        session_user,
        user,
        meassge
      });

      return;
    }

    let topic = {
      topic_id: String($topic._id),
      title: $topic.title,
      content: $topic.content,
      type: $topic.type
    }

    // 查出所需信息
    res.render('topic/edit_topic.html', {
      session_user,
      topic
    });

    return;
  } catch (err) {
    next(err);
  }
}

// 提交编辑好的话题信息
const postEditPage = async function(req, res, next) {
  let body = req.body;
  let session_user = req.session.user;
  try {
    let code, message;
    let topic = await models.topicShcema.findById(body.topic_id);
    // 验证修改权限
    if (String(topic.author_id) 
        !== String(session_user._id)
    ) {
      code = 2;
      message = '对不起，你没有对该文章的修改权限！';
    }

    // 判断话题信息是否被修改
    if (
      topic.title === body.title &&
      topic.content === body.content &&
      topic.type === body.type
    ) {
      code = 2;
      message = '你还没有做任何修改';
    }

    // 更新话题信息
    if (code != 2) {
      await models.topicShcema.findByIdAndUpdate(body.topic_id, {
        title: body.title,
        content: body.content,
        type: body.type,
        update_at: Date.now()
      });

      code = 1;
      message = '更新成功！';
    }

    res.status(200).json({
      code,
      message
    });

  } catch (err) {
    next(err);
  }

}

// 删除话题
const delTopic = async function(req, res, next) {
  let topic_id = req.params.topic_id;
  let session_user = req.session.user;
  let user = {
    nickname: session_user.nickname,
    avatar: path.join('/public/images/user_avatar/' + session_user.avatar),
    signature: session_user.signature
  }

  try {
    // 验证删除权限
    let topic = await models.topicShcema.findById(topic_id);
    if (String(topic.author_id) 
      !== String(session_user._id)
    ) {
      let message = '对不起，你没有对该文章的删除权限！';
      res.render('notice.html', {
        session_user,
        user,
        message
      });
    }

    // 删除话题
    await models.topicShcema.findByIdAndDelete(topic_id);

    // 删除相关点赞信息
    let replies = await models.replySchema.find({
      topic_id: mongoose.Types.ObjectId(topic_id)
    });

    for (x of replies) {
      await models.PraiseSchema.deleteMany({
        reply_id: x._id
      });  
    }
    // end 删除相关点赞信息

    // 删除该话题的所有回复
    await models.replySchema.deleteMany({
      topic_id: mongoose.Types.ObjectId(topic_id)
    });

    // 收藏该话题用户的 收藏数减 一
    let collect = await models.topicCollectSchema.find({
      topic_id: mongoose.Types.ObjectId(topic_id)
    });

    for (x of collect) {
      let user = await models.userSchema.findById(String(x.user_id))
      await models.userSchema.findByIdAndUpdate(String(user._id), {
        collect_topic_count: user.collect_topic_count - 1
      })
    }
    // end 收藏该话题用户的 收藏数减 一

    // 删除相关收藏
    await models.topicCollectSchema.deleteMany({
      topic_id: mongoose.Types.ObjectId(topic_id)
    });

    // 4、通知该用户 
    // 重定向到 用户的 个人页面
    console.log(session_user.nickname);
    res.redirect('/user/' + session_user.nickname);
  } catch (err) {
    next(err);
  }

};

exports.getTopicCreate = getTopicCreate;
exports.postTopicCreate = postTopicCreate;
exports.getContentPage = getContentPage;
exports.getEditPage = getEditPage;
exports.postEditPage = postEditPage;
exports.delTopic = delTopic;