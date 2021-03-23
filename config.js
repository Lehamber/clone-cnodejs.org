
/**
 * 全局配置信息
 *   单独拿出来，好方便维护
 */

const config = {
  db:'mongodb://localhost/copy_cnodejs',
  session_secret: 'copynodejs',  // 参与密码的加密
  // eg md5(md5(body.password) + config.session_secret);

  max_topic_count: 2 // 话题展示列表 每页的最大话题数
}

module.exports = config;

