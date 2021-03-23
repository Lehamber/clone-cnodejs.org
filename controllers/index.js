const md5  = require('md5');
const path = require('path'); 

const tools  = require('./tools');
const models = require('../models/index');
const config = require('../config');

// 获取主页
let getIndex =  async function(req, res, next){

    let session_user = req.session.user;
    let user = undefined;

    if (session_user){
        let $user = await models.userSchema.findById(String(session_user._id));
        user = { 
            nickname: $user.nickname,
            avatar: path.join('/public/images/user_avatar/', $user.avatar),
            signature: $user.signature
        }
    }

    try {
        let page = parseInt(req.query.page) || 1;
        let tab = req.query.tab || 'all';
      
        let $topics = null;
        if (tab === 'all'){
            $topics = await models.topicShcema.find();
        } else {
            $topics = await models.topicShcema.find({ type: tab });
        }

        // 按发布时间 距今 的时间间隔 大小，升序排列
        $topics.sort(function(a, b) {
            a = new Date(a.create_at).getTime();
            b = new Date(b.create_at).getTime();
            return -(a - b);
        });

        // 筛选出符合路由接口的 topics 的属性
        let topics = [];
        for (var i = 0; i < $topics.length; i++){
            let author = await models.userSchema.findOne({ _id: $topics[i].author_id });
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
      
        res.render('index.html',{ session_user, user, tab, page, page_count, topics });
    } catch(err){
        next(err);
    }
};

exports.getIndex = getIndex;
