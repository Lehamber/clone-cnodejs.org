const formidable = require('formidable');
const mongoose   = require('mongoose');
const session    = require('express-session');
const path       = require('path');
const md5        = require('md5');
const fs         = require('fs');

const models = require('../models/index');
const config = require('../config');
 
// 获取y用户设置页面
let getSetting = async function(req, res, next){
    let session_user = req.session.user;
    let user = null;
    try {
        let $user = await models.userSchema.findOne({ nickname: session_user.nickname });
        user = {
            nickname: $user.nickname,
            email: $user.email,
            avatar: path.join('/public/images/user_avatar',  $user.avatar),
            weibo: $user.weibo,
            personal_web: $user.personal_web,
            signature: $user.signature
        }

        res.render('setting/setting.html', { session_user, user });
    } catch (err){
        next(err);
    }
};

// 修改用户头像
let updateAvatar = async function(req, res, next){
    let session_user = req.session.user;
    try {
        let form = formidable({
            uploadDir: path.join(__dirname, '../public/images/user_avatar'),
            keepExtensions: true // 保留图片原来的 扩展名
        });

        let files = await new Promise(function (resolve, reject){
            form.parse(req, function(err, fields, files){
                if (err){
                    reject(err);
                }
                resolve(files);
            });
        });
         
        let oldPath = files.avatarFile.path;
        let newName = new mongoose.Types.ObjectId();
        // let newPath = path.join(__dirname, `../public/images/user_avatar/${String(newName)}.jpg`);
        await new Promise(function(resolve, reject){
            fs.rename(
                oldPath, 
                path.join(__dirname, `../public/images/user_avatar/${String(newName)}.jpg`),
                function(err){
                    if (err){
                        reject(err);
                    }
                    resolve(undefined);
                }
            );
        });
         
        // 把图片存入数据库
        await models.userSchema.findByIdAndUpdate(String(session_user._id), {
            avatar: String(newName) + '.jpg'
        });

         //删除之前旧的用户头像 注意 默认的头像就别删了
        if (session_user.avatar !== 'avatar-default.png'){
            await new Promise(function(resolve, reject){
                fs.unlink(
                    path.join(__dirname, `../public/images/user_avatar/${session_user.avatar}`),
                    function(err){
                        if (err){
                            reject(err);
                        }
                        resolve(undefined);
                    }
                );
            });
        }

        // 更新session.use
        req.session.user = await models.userSchema.findById(String(session_user._id));
        res.status(200).json({
            code: 1,
            message: '修改成功'
        });
    } catch(err){
        next(err);
    }
};

// 修改个人基本信息
let updateUserInfo = async function(req, res, next){
    let body = req.body;
    let session_user = req.session.user;    
    try {
        await models.userSchema.findByIdAndUpdate(String(session_user._id), {
            weibo: body.weibo,
            personal_web: body.personal_web,
            signature: body.signature
        }).then(async () =>{
            //更新session_user
            req.session.user = await models.userSchema.findById(String(session_user._id));
            res.status(200).json({
                code: 1,
                message: '修改成功',
                data: {
                    weibo: body.weibo,
                    personal_web: body.personal_web,
                    signature: body.signature
                }
            });
        }, async (err) =>{
            let user = await models.userSchema.findOne({ nickname: session_user.nickname });
            res.status(200).json({
                code: 2,
                message: err.message,
                data: {
                    weibo: user.weibo,
                    personal_web: user.personal_web,
                    signature: user.signature
                }
            });
        })
    } catch (err){
        next(err);
    }
}

// 修改密码
let updatePassword = async function(req, res, next) {
    let session_user = req.session.user;
    let body = req.body;
    try {
        // 验证
        body.oldPwd = md5(md5(body.oldPwd) + config.session_secret);
        let tempUser = await models.userSchema.findOne( { nickname: session_user.nickname });
        if ( tempUser.password !== body.oldPwd ) {
            res.status(200).json( {
                code: 2,
                message: '旧密码不正确'
            })
        }

        await models.userSchema.findByIdAndUpdate(String(session_user._id), {
            password: md5(md5(body.newPwd) + config.session_secret)
        });

        //更新session_user
        req.session.user = await models.userSchema.findById(String(session_user._id));
        res.status(200).json( {
            code: 1,
            message: '修改成功'
        });
    } catch(err){
        next(err);
    }
}

exports.getSetting = getSetting;
exports.updateAvatar = updateAvatar;
exports.updateUserInfo = updateUserInfo;
exports.updatePassword = updatePassword;
 