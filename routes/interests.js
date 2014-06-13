var express = require('express');
var router = express.Router();

var request = require('request');

var mongoose = require('mongoose');    //引用mongoose模块
var db = mongoose.createConnection('localhost', 'tianditu-poi'); //创建一个数据库连接

// 数据库链接
db.on('error',console.error.bind(console,'连接错误:'));
db.once('open',function(){
  console.log('一次打开');
});

// 创建 Schema
var PoisSchema = new mongoose.Schema({
  phone:String,
  lonlat:String,
  address:String,
  name:String,
  url:String
});

var PoisModel = db.model('Pois', PoisSchema);

function getPoisAndSave(postStr, start, res) {
  postStr.start = start;
  var url = 'http://www.tianditu.com/query.shtml?' +
            'type=query&' +  
            'postStr=' + JSON.stringify(postStr);

  request({
    url: url,
    method: 'GET'
  }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var pois = JSON.parse(body);
      // 遍历 pois
      pois.pois.forEach(function(item) {
        // 检查数据库是否存在
        PoisModel.findOne({ name: item.name, lonlat: item.lonlat}, function(err, result) {
          if (result) {
            console.log('× "%s" 该poi已经存在', item.name);
          }
          // 不存在该 poi
          else {
            var PoisEntity = new PoisModel(item);
            PoisEntity.save();
            console.log('√ "%s" 新加入的存储', item.name);
          }
        });
      });

      // 继续循环
      var already = parseInt(postStr.count) + parseInt(start);
      var surplus = pois.count - already;
      if (surplus > 0) {
        getPoisAndSave(postStr, already, res);
      }
      else {
        res.send({ success: 1, count: pois.count, keyWord: pois.keyWord });
      }
    }
  });
}

/**
 * 远程请求数据，并写入mongoDB
 */
router.get('/', function(req, res) {

  if (!req.query.mapBound || !req.query.keyWord) {
    res.status(401);
    res.send({ error: 'Bad Request'});
    return;
  }

  var postStr = {
    keyWord: req.query.keyWord,
    level: req.query.level || "15",
    mapBound: req.query.mapBound,
    queryType: "10",
    count: parseInt(req.query.count) || 50
  };

  getPoisAndSave(postStr, 0, res);
});

/**
 * 获得 mongoDB 数据
 */
router.get('/query', function(req, res) {
  PoisModel.find(function(error, pois) {
    res.render('pois', { title: 'Pois 查询', pois: pois });
  });
});

module.exports = router;
