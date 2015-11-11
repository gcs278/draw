var express = require('express');
var router = express.Router();
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('XXDxj0qcNGdrgZMAl2NlKg');

/* GET home page. */
router.get('/', function(req, res, next) {
  var Canvas = require('canvas'),
  canvas = new Canvas(1900, 1000),
  ctx = canvas.getContext('2d');
  req.db.collection('base64').findOne({path:'/'},function(err,data) {
    console.log('1');
    if(data){
        var img = new Canvas.Image;//
        img.src = data.base64;
        ctx.drawImage(img,0,0);
    }
    console.log('1');
    // console.log(data);
    res.render('index', { title: 'Express',canvas: canvas, picture:'grid'});
  });
});

router.get('/otter', function(req, res, next) {
  var Canvas = require('canvas'),
  canvas = new Canvas(1900, 1000),
  ctx = canvas.getContext('2d');
  req.db.collection('base64').findOne({path:'/otter'},function(err,data) {
    if(data){
        var img = new Canvas.Image;//
        img.src = data.base64;
        ctx.drawImage(img,0,0);
    }
    res.render('index', { title: 'Express',canvas: canvas, picture:'otter'});
  });
});

router.get('/turtle', function(req, res, next) {
  var Canvas = require('canvas'),
  canvas = new Canvas(1900, 1000),
  ctx = canvas.getContext('2d');
  req.db.collection('base64').findOne({path:'/otter'},function(err,data) {
    if(data){
        var img = new Canvas.Image;//
        img.src = data.base64;
        ctx.drawImage(img,0,0);
    }
    res.render('index', { title: 'Express',canvas: canvas, picture:'turtle'});
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

router.get('/send', function(req, res) {
  if ( !req.query.name ) {
    res.render('error',{title:"Internal Server Error",message:"You gotta include a name"});
  }
  else {
    req.db.collection('base64').findOne({},function(err,data) {
      if(data){
        var base64 = data.base64.substring(data.base64.indexOf(",") + 1);
        var message = {
          "html": "<h1>" + req.query.name + " drew something for you and wants you to see it!</h1>",
          "subject": "Draw Something Picture!",
          "from_email": "gcs278@vt.edu",
          "from_name": "Grant Spence",
          "to": [{
                  "email": "gcs278@vt.edu",
                  "name": "Grant Spence",
                  "type": "to"
              }],
          "headers": {
              "Reply-To": "gcs278@vt.edu"
          },
          images: [
            {type: "image/png", name: "draw_something.png", content: base64}
          ]
        };

        mandrill_client.messages.send(
          {"message": message}
        );
        res.render('ok');
      }
      else {
        res.render('error',{title:"Internal Server Error",message:"Database is empty!"});
      }
    });

  }
});

module.exports = router;
