const express = require('express'),
      md5     = require('md5');
 
const models  = require('./models/index'),
      config  = require('./config'),
      auth    = require('./middlewares/auth');

// 引入 controller
const sign    = require('./controllers/sign'),
      index   = require('./controllers/index'),
      topic   = require('./controllers/topic'),
      user    = require('./controllers/user'),
      setting = require('./controllers/setting'),
      message = require('./controllers/message'),
      reply   = require('./controllers/reply'),
      topic_collect = require('./controllers/topic_collect');
const { Mongoose } = require('mongoose');

const router = express.Router();

// home page
router.get('/', index.getIndex); //获取主页

// sign controller
router.get('/signup', sign.getSignup); //获取注册页面
router.post('/signup', sign.postSignupInfo); //提交注册信息
router.get('/signin', sign.getSignin); //获取登录页面
router.post('/signin', sign.postSigninInfo); //提交验证登录信息
router.get('/signout', sign.signout); //退出登录

// setting controller
router.get('/setting', auth.userRequired, setting.getSetting); //获取设置页面
router.post('/setting/avatar', auth.userRequired, setting.updateAvatar); //修改头像
router.post('/setting/userInfo', auth.userRequired, setting.updateUserInfo); //修改基本信息
router.post('/setting/password', auth.userRequired, setting.updatePassword); //修改密码

// message controller
router.get('/my/messages',auth.userRequired, message.getMessage); //获取消息通知页面

// topic controller
router.get('/topic/create', auth.userRequired, topic.getTopicCreate); //获取话题创建页面
router.post('/topic/create', auth.userRequired, topic.postTopicCreate); //提交编辑好的话题
router.get('/topic/:topic_id', auth.userRequired, topic.getContentPage); //获取某篇话题的内容页
router.get('/topic/:topic_id/edit', auth.userRequired, topic.getEditPage); //获取某篇话题的 编辑修改 页
router.post('/topic/edit', auth.userRequired, topic.postEditPage); //提交 编辑修改 好的话题
router.get('/topic/:topic_id/del', auth.userRequired, topic.delTopic); //删除某一篇话题

// user controller
router.get('/user/:name', user.getUser); //获取某用户的 个人页面
router.get('/user/:name/topics', user.getUserTopics); //获取某用户创建的话题列表 页面
router.get('/user/:name/replies', user.getUserReplies); //获取某用户参与过的话题列表 页面
 
// reply controller
router.post('/reply', auth.userRequired, reply.postReply); //提交新回复
router.get('/reply/detail', auth.userRequired, reply.getReplyDetail); // 获取历史回复交谈框
router.get('/reply/:reply_id/edit', auth.userRequired, reply.getEditPage); //获取编辑修改某条回复的页面
router.post('/reply/edit', auth.userRequired, reply.postEditPage); //提交编辑修改好的回复
router.get('/reply/del', auth.userRequired, reply.del); //删除某条回复
router.get('/reply/praise', auth.userRequired, reply.praise); //给某条回复点赞

// topic_collect controller
router.get('/collect', auth.userRequired, topic_collect.collect); //收藏某话题
router.get('/collect/:user_name', auth.userRequired, topic_collect.getCollectList);
 
module.exports = router;
