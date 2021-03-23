const md5 = require('md5');
const path = require('path');
const mongoose = require('mongoose');
const marked = require('marked');

const models = require('../models/index');
const config = require('../config');
const tools = require('./tools');

// 收藏 或 取消收藏
const collect = async function (req, res, next) {
  let query = req.query;
  let session_user = req.session.user

  try {
    if (query.is_collect === 'true') {
      await new models.topicCollectSchema({
        topic_id: mongoose.Types.ObjectId(query.topic_id),
        user_id: session_user._id
      }).save();

      // 用户收藏数加1
      let user = await models.userSchema.findById(String(session_user._id));
      await models.userSchema.findByIdAndUpdate(String(session_user._id), {
        collect_topic_count: user.collect_topic_count + 1
      });
    } else {
      await models.topicCollectSchema.findOneAndDelete({
        topic_id: mongoose.Types.ObjectId(query.topic_id),
        user_id: session_user._id
      });

      // 用户收藏数减1
      let user = await models.userSchema.findById(String(session_user._id));
      await models.userSchema.findByIdAndUpdate(String(session_user._id), {
        collect_topic_count: user.collect_topic_count - 1
      });
    }

    res.status(200).json({
      code: 1,
      message: '成功'
    });

  } catch (err) {
    next(err);
  }
};

// 获取用户收藏列表
const getCollectList = async function (req, res, next) {
  const session_user = req.session.user;
  const user_name = req.params.user_name;
  const page = parseInt(req.query.page) || 1;
  let user; //最终要返回的用户信息
  let topics = []; //最终要返回的话题列表
  let page_count;
  try {
    let $user = await models.userSchema.findOne({
      nickname: user_name
    });
    user = {
      nickname: $user.nickname,
      avatar: path.join('/public/images/user_avatar/', $user.avatar),
      signature: $user.signature
    };

    let collects = await models.topicCollectSchema.find({
      user_id: $user._id
    });
    let $topics = [];
    for (let i = 0; i < collects.length; i++) {
      $topics[i] = await models.topicShcema.findOne({
        _id: collects[i].topic_id
      });
    }

    // 按收藏时间 距今 的时间间隔 大小，升序排列
    // 来个冒泡排序
    for (let i = 0; i < $topics.length; i++) {
      for (let j = i + 1; j < $topics.length; j++) {
        let collectI, collectJ, tempTop, timeI, timeJ;
        collectI = await models.topicCollectSchema.findOne({
          topic_id: $topics[i]._id,
          user_id: $user._id
        });
        collectJ = await models.topicCollectSchema.findOne({
          topic_id: $topics[j]._id,
          user_id: $user._id
        });

        console.log('a:', collectI.create_at);
        console.log('b:', collectJ.create_at);
        timeI = new Date(collectI.create_at).getTime();
        timeJ = new Date(collectJ.create_at).getTime();
        if (timeI < timeJ) {
          tempTop = $topics[i];
          $topics[i] = $topics[j];
          $topics[j] = tempTop;
        }
      }
    }

    // $topics = tools.sort($topics, async function (a, b) {
    //   let collectI, collectJ, timeI, timeJ;
    //   collectI = await models.topicCollectSchema.findOne({
    //     topic_id: a._id,
    //     user_id: $user._id
    //   });
    //   collectJ = await models.topicCollectSchema.findOne({
    //     topic_id: b._id,
    //     user_id: $user._id
    //   });
    //   console.log('a:', collectI.create_at);
    //   console.log('b:', collectJ.create_at);
    //   timeI = new Date(collectI.create_at).getTime();
    //   timeJ = new Date(collectJ.create_at).getTime();
    //   return timeI < timeJ;
    // });


    // $topics = tools.sort($topics, function (a, b) {
    //   let collectI, collectJ, timeI, timeJ;
    //   models.topicCollectSchema.findOne({
    //       topic_id: a._id,
    //       user_id: $user._id
    //     })
    //     .then((ret) => {
    //       collectI = ret;
    //       return models.topicCollectSchema.findOne({
    //         topic_id: b._id,
    //         user_id: $user._id
    //       });
    //     })
    //     .then((ret) => {
    //       collectJ = ret;
    //       console.log('a:', collectI.create_at);
    //       console.log('b:', collectJ.create_at);
    //       timeI = new Date(collectI.create_at).getTime();
    //       timeJ = new Date(collectJ.create_at).getTime();
    //       return timeI < timeJ;
    //     })
    //     .catch((err) => {
    //       next(err);
    //     });
    // });

    console.log($topics);
    console.log(123);

    for (let i = 0; i < $topics.length; i++) {
      let author = await models.userSchema.findOne({
        _id: $topics[i].author_id
      });
      let collect = await models.topicCollectSchema.findOne({
        topic_id: $topics[i]._id,
        user_id: $user._id
      });
      console.log(collect.create_at);
      topics[i] = {
        title: $topics[i].title,
        type: $topics[i].type,
        reply_count: $topics[i].reply_count,
        visit_count: $topics[i].visit_count,
        // 这里应该是 收藏时间
        time_interval: tools.getIntervalTime(new Date(collect.create_at)),
        author_avatar: path.join('/public/images/user_avatar/', author.avatar),
        author_nickname: author.nickname,
        topic_id: String($topics[i]._id)
      }
    }

    // 计算出总页数
    let max_topic_count = config.max_topic_count;
    page_count =
      topics.length % max_topic_count === 0 ?
      topics.length / max_topic_count :
      parseInt(topics.length / max_topic_count) + 1;

    topics = topics.slice(
      page === 1 ? 0 : (page - 1) * max_topic_count,
      (topics.length - (page - 1) * max_topic_count) < max_topic_count ? undefined : page * max_topic_count
    );

    res.render('collect/collect.html', {
      session_user,
      user,
      topics,
      page,
      page_count
    });
  } catch (err) {
    next(err);
  }
}

exports.collect = collect;
exports.getCollectList = getCollectList;