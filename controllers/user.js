const md5 = require('md5');
const path = require('path');

const models = require('../models/index');
const config = require('../config');
const tools = require('./tools');
const {
  model
} = require('mongoose');

// 获取用户信息页面
let getUser = async function (req, res, next) {
  let session_user = req.session.user;
  let user_name = req.params.name;
  try {
    let $user = await models.userSchema.findOne({
      nickname: user_name
    })
    if ($user === null) {
      throw {
        message: `没有找到到用户${user_name}`
      }
    }

    // 查找创建的话题
    let $recent_topics = (await models.userSchema.aggregate([{
        $match: {
          nickname: user_name
        }
      },
      {
        $lookup: {
          from: 'topics',
          localField: '_id',
          foreignField: 'author_id',
          as: 'topics'
        }
      }
    ]))[0].topics;

    // 查出参与的话题
    let docs = (await models.replySchema.aggregate([{
        $match: {
          replier_id: $user._id
        }
      },
      {
        $lookup: {
          from: 'topics',
          localField: 'topic_id',
          foreignField: '_id',
          as: 'topics'
        }
      }
    ]));

    let $recent_replies = [];

    for (x of docs) {
      // 注意：不同表中的 相同值的 mongoose.Types.ObjectId 类型，是不可比较的。
      // 解决方案就是把它 转变成 string类型进行比较即可；
      if (!$recent_replies.find(item => String(item._id) === String(x.topics[0]._id))) {
        $recent_replies.push(x.topics[0]);
      }
    }

    // 按发布时间 距今 的时间间隔 大小，升序排列
    $recent_topics.sort(function (a, b) {
      a = new Date(a.create_at).getTime();
      b = new Date(b.create_at).getTime();
      return -(a - b);
    });

    $recent_replies.sort(function (a, b) {
      a = new Date(a.create_at).getTime();
      b = new Date(b.create_at).getTime();
      return -(a - b);
    });

    // 取前5个 
    $recent_topics = $recent_topics.slice(0, 5);
    $recent_replies = $recent_replies.slice(0, 5);
    // 把最近回复话题的 作者信息给查询出来
    for (var i = 0; i < $recent_replies.length; i++) {
      let $user = await models.userSchema.findOne({
        _id: $recent_replies[i].author_id
      });
      $recent_replies[i].author_nickname = $user.nickname;
      $recent_replies[i].author_avatar = $user.avatar;
    }

    // 按路由需求，筛选出需要的数据
    let user = {
      nickname: $user.nickname,
      avatar: path.join('/public/images/user_avatar/', $user.avatar),
      weibo: $user.weibo,
      personal_web: $user.personal_web,
      signature: $user.signature,
      time_interval: tools.getIntervalTime(new Date($user.create_at)),
      collect_topic_count: $user.collect_topic_count
    }

    let recent_topics = [];
    for (let i = 0; i < $recent_topics.length; i++) {
      recent_topics[i] = {
        title: $recent_topics[i].title,
        type: $recent_topics[i].type,
        reply_count: $recent_topics[i].reply_count,
        visit_count: $recent_topics[i].visit_count,
        time_interval: tools.getIntervalTime(new Date($recent_topics[i].create_at)),
        topic_id: String($recent_topics[i]._id) // 转成字符串保险一点
      }
    }

    let recent_replies = [];
    for (let i = 0; i < $recent_replies.length; i++) {
      recent_replies[i] = {
        title: $recent_replies[i].title,
        type: $recent_replies[i].type,
        reply_count: $recent_replies[i].reply_count,
        visit_count: $recent_replies[i].visit_count,
        time_interval: tools.getIntervalTime(new Date($recent_replies[i].create_at)),
        author_avatar: path.join('/public/images/user_avatar/', $recent_replies[i].author_avatar),
        author_nickname: $recent_replies[i].author_nickname,
        topic_id: String($recent_replies[i]._id) // 转成字符串保险一点
      }
    }

    res.render('user/user.html', {
      session_user,
      user,
      recent_topics,
      recent_replies
    });

  } catch (err) {
    next(err);
  }
}

// 获取用户创建的话题列表页面
let getUserTopics = async function (req, res, next) {
  let session_user = req.session.user;
  let user_name = req.params.name; // 获取url中 name参数
  let page = parseInt(req.query.page) || 1;
  try {
    let $user = await models.userSchema.findOne({
      nickname: user_name
    });
    let user = {
      nickname: $user.nickname,
      avatar: path.join('/public/images/user_avatar/', $user.avatar),
      signature: $user.signature
    };

    let $topics = (await models.userSchema.aggregate([{
        $match: {
          nickname: user_name
        }
      },
      {
        $lookup: {
          from: 'topics',
          localField: '_id',
          foreignField: 'author_id',
          as: 'topics'
        }
      }
    ]))[0].topics;

    // 按发布时间 距今 的时间间隔 大小，升序排列
    $topics.sort(function (a, b) {
      a = new Date(a.create_at).getTime();
      b = new Date(b.create_at).getTime();
      return -(a - b);
    });

    let topics = [];
    for (var i = 0; i < $topics.length; i++) {
      let author = await models.userSchema.findOne({
        _id: $topics[i].author_id
      });
      topics[i] = {
        title: $topics[i].title,
        type: $topics[i].type,
        reply_count: $topics[i].reply_count,
        visit_count: $topics[i].visit_count,
        time_interval: tools.getIntervalTime(new Date($topics[i].create_at)),
        author_avatar: path.join('/public/images/user_avatar/', author.avatar),
        author_nickname: author.nickname,
        topic_id: String($topics[i]._id)
      }
    }
    // 计算出总页数
    let max_topic_count = config.max_topic_count;
    let page_count =
      topics.length % max_topic_count === 0 ?
      topics.length / max_topic_count :
      parseInt(topics.length / max_topic_count) + 1;

    topics = topics.slice(
      page === 1 ? 0 : (page - 1) * max_topic_count,
      (topics.length - (page - 1) * max_topic_count) < max_topic_count ? undefined : page * max_topic_count
    );

    res.render('user/view_more_topics.html', {
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

// 获取用户参与的话题列表页面
let getUserReplies = async function (req, res, next) {
  let session_user = req.session.user;
  let user_name = req.params.name; // 获取url中 name参数
  let page = parseInt(req.query.page) || 1;
  try {
    let $user = await models.userSchema.findOne({
      nickname: user_name
    });
    // 按照路由对user属性进行筛选进行筛选
    let user = {
      nickname: $user.nickname,
      avatar: path.join('/public/images/user_avatar/', $user.avatar),
      signature: $user.signature
    };

    let docs = (await models.replySchema.aggregate([{
        $match: {
          replier_id: $user._id
        }
      },
      {
        $lookup: {
          from: 'topics',
          localField: 'topic_id',
          foreignField: '_id',
          as: 'topics'
        }
      }
    ]));
    // 拿出所有的话题
    let temp_topics = [];
    for (x of docs) {
      temp_topics.push(...x.topics);
    }

    // 话题去重
    let $topics = [];
    for (x of temp_topics) {
      if (!$topics.find(item => String(item._id) === String(x._id))) {
        $topics.push(x);
      }
    }



    // 按发布时间 距今 的时间间隔 大小，升序排列
    $topics.sort(function (a, b) {
      a = new Date(a.create_at).getTime();
      b = new Date(b.create_at).getTime();
      return -(a - b);
    });

    // 按路由要求对话题信息进行筛选
    let topics = [];
    for (var i = 0; i < $topics.length; i++) {
      let author = await models.userSchema.findOne({
        _id: $topics[i].author_id
      });

      topics[i] = {
        title: $topics[i].title,
        type: $topics[i].type,
        reply_count: $topics[i].reply_count,
        visit_count: $topics[i].visit_count,
        time_interval: tools.getIntervalTime(new Date($topics[i].create_at)),
        author_avatar: path.join('/public/images/user_avatar/', author.avatar),
        author_nickname: author.nickname,
        topic_id: String($topics[i]._id)
      }
    }
    // 计算出总页数
    let max_topic_count = config.max_topic_count;
    let page_count =
      topics.length % max_topic_count === 0 ?
      topics.length / max_topic_count :
      parseInt(topics.length / max_topic_count) + 1;

    topics = topics.slice(
      page === 1 ? 0 : (page - 1) * max_topic_count,
      (topics.length - (page - 1) * max_topic_count) < max_topic_count ? undefined : page * max_topic_count
    );

    res.render('user/view_more_replies.html', {
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

exports.getUser = getUser;
exports.getUserTopics = getUserTopics;
exports.getUserReplies = getUserReplies;