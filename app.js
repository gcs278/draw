var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var assert = require('assert');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
var server = require('http').Server(app);
server.listen(3000);
var io = require('socket.io').listen(server);

var db = require('mongoskin').db('mongodb://localhost:27017/draw');

db.collection('canvas').find().toArray(function(err, result) {
  if (err) throw err;
  //console.log(result);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// Make our db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    next();
});

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;


// If the URL of the socket server is opened in a browser
function handler (request, response) {

	request.addListener('end', function () {
        fileServer.serve(request, response); // this will return the correct file
    });
}

users = [];

// Delete this row if you want to see debug messages
io.set('log level', 1);

var draw = false;
// Listen for incoming connections from clients
io.sockets.on('connection', function (socket) {

  socket.on('clear_clicked', function(data) {
    socket.broadcast.emit('clear', data);
  });

  socket.on('user_ping', function(data) {
    console.log("user ping");
    console.log(contains(users, data.name));
    if ( !contains(users, data.name) ) {
      console.log("New user: "+data.name);
      console.dir(users);
      users.push(data.name);
      socket.broadcast.emit('user',{users:users});
    }
  });

	// Start listening for mouse move events
	socket.on('mousemove', function (data) {
    // var clients = findClientsSocket();
    // console.dir(clients);
		// This line sends the event (broadcasts it)
		// to everyone except the originating client.
		socket.broadcast.emit('moving', data);
    if ( data.drawing ) {
      draw = true;
      var color;
      if ( data.color )
        color = getCookie("color",data.color);
      else
        color = "black";

      console.log(color);
      db.collection('canvas').save( {id:data.id, draw: true, x: data.x,y: data.y, color: color});      
    }
    else if ( !data.drawing && draw ) {
      // console.log("2");
      draw = false;
      db.collection('canvas').save( {draw: false});
      var color = data.color;
      var id = data.id;

      db.collection('base64').findOne({},function(err,data) {
        // console.log("Data: " + data.base64);

        var Canvas = require('canvas'),
        canvas = new Canvas(1900, 1000),
        ctx = canvas.getContext('2d');

        // If there is an canvas image, load it
        if( data ){
          var img = new Canvas.Image;
          img.src = data.base64;
          ctx.drawImage(img,0,0);
        }

        db.collection('canvas').find().toArray(function(err,data) {
          var first = true;
          var prevx = 0;
          var prevy = 0;

          // Draw the line on the canvas
          data.forEach(function(val) {
            if ( id == val.id ) {
              if ( first && val.x && val.y ) {
                  prevx = val.x;
                  prevy = val.y;
                  first = false;
              }
              else if ( val.draw) {
                  ctx.strokeStyle = color;
                  console.log(prevx);
                  ctx.moveTo(prevx,prevy);
                  ctx.lineTo(val.x,val.y);
                  ctx.stroke();
                  prevx = val.x;
                  prevy = val.y;
              }
              else if ( !val.draw ) {
                // We're done drawing
              }
            }

          });

          // Delete the last line contents
          db.collection('canvas').remove({id:id});
          db.collection('base64').remove({});
          db.collection('base64').insert({base64:canvas.toDataURL()});
        });
        console.log("2");


        // db.colletion('base64').save({});

      });

      
    }
	});
});

function getCookie(cname,cookie) {
    var name = cname + "=";
    var ca = cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}

function findClientsSocket(roomId, namespace) {
    var res = []
    , ns = io.of(namespace ||"/");    // the default namespace is "/"

    if (ns) {
        for (var id in ns.connected) {
            if(roomId) {
                var index = ns.connected[id].rooms.indexOf(roomId) ;
                if(index !== -1) {
                    res.push(ns.connected[id]);
                }
            } else {
                res.push(ns.connected[id]);
            }
        }
    }
    return res;
}

function contains(a, obj) {
    var i = a.length;
    while (i--) {
       if (a[i] === obj) {
           return true;
       }
    }
    return false;
}