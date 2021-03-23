const md5 = require('md5');
 
const models = require('../models/index');
const config = require('../config');

const userSchema = models.userSchema;

// 获取注册页面
let getSignup = function(req, res, next){
    res.render('sign/signup.html');
}

// 提交注册信息
let postSignup = async function(req, res, next) {
    let body = req.body;
    try{
        if (await userSchema.findOne({ email: body.email })){
            return res.status(200).json({
                code: 2,
                message: "此邮箱已被使用!"
            });
        }
        
        if (await userSchema.findOne({nickname: body.nickname})){
            return res.status(200).json({
                code: 2,
                message: "此昵称已被使用"
            })
        }
        
        // 进行双层加参数 加密，这样更安全
        body.password = md5(md5(body.password) + config.session_secret);

        let newUser = new userSchema(body);
        await newUser.save();

        // 保存 session 信息
        req.session.user = await userSchema.findOne({ email: body.email });

        // res.redirect('/'); // 异步请求不能 这样重定位

        res.status(200).json({
            code: 1,
            message: '注册成功'
        })
    } catch (err){
        next(err);
    }
}

// 获取登录页面
let getSignin = function(req, res, next){
    res.render('sign/signin.html');
}

// 验证登录信息
let postSignin = async function(req, res, next) {
    let body = req.body;
    // 加密的时候怎么操作的，这个时候要验证，要就要怎么操作
    body.password = md5(md5(body.password) + config.session_secret);
    try {
        let user = await userSchema.findOne({ email: body.email });
        if (user === null){
            return res.status(200).json({
                code: 2,
                message: '此邮箱未注册'
            });
        }

        if (user.password !== body.password){
            return res.status(200).json({
                code: 2,
                message: '密码错误'
            });
        }

        req.session.user = await userSchema.findOne({ email: body.email });
        res.status(200).json({
            code: 1,
            message: '登录成功'
        })
    } catch(err){
        next(err);
    }
}

// 退出登录
let signout = function(req, res, next){
    req.session.user = null;
    res.redirect('/');
}


exports.getSignup = getSignup;
exports.postSignupInfo = postSignup;
exports.getSignin = getSignin;
exports.postSigninInfo = postSignin;
exports.signout = signout;
