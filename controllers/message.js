const md5 = require('md5');

const models = require('../models/index');

// 获取消息页面
let getMessage = function(req, res, next){
    res.render('message/message.html');
};

exports.getMessage = getMessage;