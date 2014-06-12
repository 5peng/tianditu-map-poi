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

/**
 * 远程请求数据，并写入mongoDB
 */
router.get('/', function(req, res) {

  console.log('interests');
  // 获得数据
  request({
    url: 'http://www.tianditu.com/query.shtml?type=query&postStr={%22keyWord%22:%22%E5%8C%97%E4%BA%AC%22,%22level%22:%2211%22,%22mapBound%22:%22116.10773,39.77369,116.69481,40.03705%22,%22queryType%22:%2210%22,%22count%22:%2250%22,%22start%22:%220%22}',
    method: 'GET'
  }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var pois = JSON.parse(body);
      pois.pois.forEach(function(item) {
        var PoisEntity = new PoisModel(item);
        // PoisEntity.save();
      });
    }
  });
  // var PersonModel = db.model('Person', PersonSchema);

  // var personEntity = new PersonModel({name:'Krouky'});

  // personEntity.save();

  // PersonModel.findOne({'name': 'Krouky'}, function(err, persons) {
  //   console.log(persons);
  // });

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
