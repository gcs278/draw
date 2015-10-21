$(document).ready(function(){
	var name = Cookies.get("name");
	var socket = io.connect(url);

	if ( !name ) {
		$('#my_popup').popup({
			autoopen: true,
			pagecontainer: '.container',
			transition: 'all 0.3s',
			blur: false,
			escape: false
		});
		// $('#my_popup').popup('show');
		$('#name_submit').click(function() {
			$('#name_form').submit();
			$('#my_popup').popup('hide');
		});

		$('#name_input').bind('keypress',function(e){
			console.log('key press');
			if (e.keyCode == 13) {
				e.preventDefault();
				$('#name_form').submit();
			}
		});

		$('#name_form').submit(function(e) {
			e.preventDefault();
			name = $('#name_input').val();
			Cookies.set("name",name);
		});

		socket.emit('new_user', {
			name: name
		});
	}

	socket.on('user', function (data) {
		console.log("user change!");
		console.dir(data);
		data.users.each(function(i,val) {
			console.log(val);
			$('#user_list').append(val);
		});
	});

	var color = Cookies.get("color");

	$('select[name="colorpicker"]').simplecolorpicker(
		{picker:true,theme: 'fontawesome'}).on('change', function() {
		color = $('select[name="colorpicker"]').val();
		Cookies.set("color",color);
	});
	if ( color ) {
		console.log(color);
		$('select[name="colorpicker"]').simplecolorpicker('selectColor',color);
	}

	// This demo depends on the canvas element
	if(!('getContext' in document.createElement('canvas'))){
		alert('Sorry, it looks like your browser does not support canvas!');
		return false;
	}

	// The URL of your web server (the port is set in app.js)
	var url = 'http://draw.grantspence.com';

	var doc = $(document),
		win = $(window),
		canvas = $('#paper'),
		ctx = canvas[0].getContext('2d'),
		instructions = $('#instructions');

	if (typeof jQuery == 'undefined') {
		alert("jquery not loaded");
}
	// Generate an unique ID
	var id = Math.round($.now()*Math.random());
	// if ( !color ) {
		// 16777215 = ffffff
		// color = '#'+Math.floor(Math.random()*14540253).toString(16);
		// Cookies.set("color",color);
	// }

	// A flag for drawing activity
	var drawing = false;

	var clients = {};
	var cursors = {};
	

	socket.on('clear', function(data) {
		ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
	});

	socket.on('moving', function (data) {
		console.log('in socket moving');
		if(! (data.id in clients)){
			// a new user has come online. create a cursor for them
			cursors[data.id] = $('<div class="cursor">').html('<div class="cursor_name">'+data.name+'</div>').appendTo('#cursors');
		}

		// Move the mouse pointer
		cursors[data.id].css({
			'left' : data.x,
			'top' : data.y
		});

		// Is the user drawing?
		if(data.drawing && clients[data.id]){

			// Draw a line on the canvas. clients[data.id] holds
			// the previous position of this user's mouse pointer

			drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y, data.color);
		}

		// Saving the current client state
		clients[data.id] = data;
		clients[data.id].updated = $.now();
	});

	var prev = {};

	canvas.on('mousedown',function(e){
		e.preventDefault();
		drawing = true;
		prev.x = e.pageX;
		prev.y = e.pageY;

		// Hide the instructions
		instructions.fadeOut();
	});

	doc.bind('mouseup mouseleave',function(){
		drawing = false;
	});

	var lastEmit = $.now();

	doc.on('mousemove',function(e){
		if($.now() - lastEmit > 30){
			socket.emit('mousemove',{
				'x': e.pageX,
				'y': e.pageY,
				'drawing': drawing,
				'id': id,
				'name': name,
				'color': color
			});
			lastEmit = $.now();
		}

		// Draw a line for the current user's movement, as it is
		// not received in the socket.on('moving') event above

		if(drawing){

			drawLine(prev.x, prev.y, e.pageX, e.pageY, color);

			prev.x = e.pageX;
			prev.y = e.pageY;
		}
	});

	// Remove inactive clients after 10 seconds of inactivity
	setInterval(function(){

		for(ident in clients){
			if($.now() - clients[ident].updated > 10000){

				// Last update was more than 10 seconds ago.
				// This user has probably closed the page

				cursors[ident].remove();
				delete clients[ident];
				delete cursors[ident];
			}
		}

	},10000);

	function drawLine(fromx, fromy, tox, toy, clr){
		ctx.strokeStyle = clr;
		ctx.beginPath();
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.stroke();
	}

	$('.btn').click(function(e) {
		e.preventDefault();
		$.get("/clear");
		socket.emit('clear_clicked');
		ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
	});

	window.setInterval(function() {
		socket.emit('user_ping',{
			name:name
		});
	}, 3000);

});
