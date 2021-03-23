const mongoose = require('mongoose');
const config = require('../config');

const { Schema } = mongoose;

let ObjectId  = Schema.ObjectId;

mongoose.connect(config.db, {
     useCreateIndex: true,
     useNewUrlParser: true
}, function (err) {
     if (err) {
          console.error('connect to %s error:', config.db, err.message);
     }
});

require('./message');
require('./reply');
require('./topic_collect');
require('./topic');
require('./user');
require('./praise');

exports.messageSchema = mongoose.model('Message');
exports.replySchema = mongoose.model('Reply');
exports.topicCollectSchema = mongoose.model('TopicCollect');
exports.topicShcema = mongoose.model('Topic');
exports.userSchema = mongoose.model('User');
exports.PraiseSchema = mongoose.model('Praise');


// let reply = new exports.replySchema({
//      content: 'veryasdfasdfsadfa减少亮度废旧塑料',
//      topic_id: mongoose.Types.ObjectId('6033a19deb2de353c4ec5023'),
//      replier_id: mongoose.Types.ObjectId('603263b19275930b1c4becc1')
// });

// reply.save(function(err){
//      if (err){
//           return console.log('Saving is wrong');
//      }
//      console.log('Saving is successful');
// })
     





// let abc = mongoose.Types.ObjectId('603263b19275930b1c4becc1');
// let cba = mongoose.Types.ObjectId('603263b19275930b1c4becc1');

// console.log(String(abc) === String(abc));

// console.log(cba);

// async function wayy(req, res, next) {
//      let user_name = 'abc17';
//      try {
//           let docs = await exports.replySchema.aggregate([
//                {
//                     $match: {
//                          replier_id: mongoose.Types.ObjectId('603263b19275930b1c4becc1')
//                     }
//                },
//                {
//                     $lookup: {
//                          from: 'topics',
//                          localField: 'topic_id',
//                          foreignField: '_id',
//                          as: 'items'
//                     }
//                }
//           ]);

//           console.log(docs[0].items, 1);
//           console.log(docs[1].items, 2);
//           console.log(docs[2].items, 3);


      

//      } catch (err) {
//           console.log('error');
//      }
// }
// wayy();



//    {
//        $lookup: {
//            from: 'topics',
//            localField: 'topic_id',
//            foreignField: '_id',
//            as: 'topics'
//        }
//    }