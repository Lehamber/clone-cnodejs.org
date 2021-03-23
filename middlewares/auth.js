exports.userRequired = function (req, res, next){
    if ( !req.session || !req.session.user || !req.session.user._id){
        // return res.status(200).json({
        //     code: 0,
        //     message: '请登录'
        // });
        const message = '请登录！';
        res.render('notice.html', { message });
        return;
    }
    next();
}

