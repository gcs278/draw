var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  var Canvas = require('canvas'),
  canvas = new Canvas(1900, 1000),
  ctx = canvas.getContext('2d');
  req.db.collection('base64').findOne({},function(err,data) {
    console.log('1');
    if(data){
        var img = new Canvas.Image;//
        img.src = data.base64;
        ctx.drawImage(img,0,0);
    }
    console.log('1');
    // console.log(data);
    res.render('index', { title: 'Express',canvas: canvas});
  });
});

router.get('/canvas', function(req, res) {
    var db = req.db;
    
    db.collection('canvas').find({},{},function(e,docs){
        res.render('canvas', {
            "canvas" : docs
        });
    });
});

router.get('/clear', function(req, res) {
    req.db.collection('base64').remove({});
    res.render('ok');
});

module.exports = router;
