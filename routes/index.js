var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  var Canvas = require('canvas'),
  canvas = new Canvas(1900, 1000),
  ctx = canvas.getContext('2d');
  req.db.collection('canvas').find().toArray(function(err,data) {
    console.log('1');
    var prevx = 0
    var prevy = 0

    var first = true;
    var newLine = false;
    data.forEach(function(val) {

        if ( first ) {
            prevx = val.x;
            prevy = val.y;
            first = false;
        }
        else if ( val.draw && !newLine) {
            ctx.moveTo(prevx,prevy);
            ctx.lineTo(val.x,val.y);
    //        ctx.strokeStyle = '#ff000';
	    ctx.stroke();
            prevx = val.x;
            prevy = val.y;
        }
        else if ( newLine ) {
            newLine = false;
            prevx = val.x;
            prevy = val.y;
        }
        else if ( !val.draw ) {
            newLine = true;
        }

        // console.log(canvas.toDataURL());
    });
    console.log('1');
    // console.log(data);
    res.render('index', { title: 'Express',data:data,canvas: canvas });
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
    req.db.collection('canvas').remove({});
    res.render('ok');
});

module.exports = router;
