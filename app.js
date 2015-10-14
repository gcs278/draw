var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


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

// Delete this row if you want to see debug messages
io.set('log level', 1);

var draw = false;
// Listen for incoming connections from clients
io.sockets.on('connection', function (socket) {

	// Start listening for mouse move events
	socket.on('mousemove', function (data) {
		// This line sends the event (broadcasts it)
		// to everyone except the originating client.
		socket.broadcast.emit('moving', data);
    if ( data.drawing ) {
      draw = true;
      db.collection('canvas').save( {id:data.id, draw: true, x: data.x,y: data.y});      
    }
    else if ( !data.drawing && draw ) {
      draw = false;
      db.collection('canvas').save( {draw: false});      
    }
	});
});
