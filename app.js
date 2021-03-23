const express    = require('express'),
      path       = require('path'),
      bodyParser = require('body-parser'),
      session    = require('express-session');

const config     = require('./config'),
      router     = require('./router');

const app        = express();
 
// 配置模板引擎
app.engine('html', require('express-art-template'));
app.set('views', path.join(__dirname, './views'));

// 开发静态资源
// console.log(path.join(__dirname, 'public'));
app.use('/public/', express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// 配置解析 post请求的 插件，注意：一定要在 app.use(router) 之前
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use(session({
    secret: 'items',
    resave: false,
    saveUninitialized: true
}));

app.use(router);

// 404 中间件
app.use(function (req, res, next) {
    res.render('404.html');
});

// 全局错误处理中间件
app.use(function (err, req, res, next) {
    console.log(err);
    res.status(200).json({
        code: 0,
        message: '服务端出问题啦，快去看看报错信息吧！derder'
    });    
    // ;res.status(500).send(err.message);
});

app.listen(80, function () {
    console.log('Server is running!');
});