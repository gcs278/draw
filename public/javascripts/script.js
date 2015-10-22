$(document).ready(function(){
	var name = Cookies.get("name");
	var socket = io.connect(url);
	var lineWidth = 3;

	socket.on('user_change', function (data) {
		console.log("user change!");
		$('#user_list').html("");
		console.dir(data.usernames);
		for (var val in data.usernames ) {

			if ( data.usernames[val] != name )
				$('#user_list').append('<li>' + data.usernames[val] + '</li>');
		}
	});

	if ( !name ) {
		$('#my_popup').popup({
			autoopen: true,
			pagecontainer: '.container',
			transition: 'all 0.3s',
			blur: false,
			escape: false
		});

		$('#name_form').validator().on('submit',function(e) {
			if (!e.isDefaultPrevented()) {
				name = $('#name_input').val();
				Cookies.set("name",name);

				socket.emit('new_user', {name});
				$('#my_popup').popup('hide');
			}
		});
	}
	else {
		socket.emit('new_user', {name});
	}


	var color = Cookies.get("color");

	$('select[name="colorpicker"]').simplecolorpicker(
		{picker:true,theme: 'fontawesome'}).on('change', function() {
		color = $('select[name="colorpicker"]').val();
		$('.size_wrapper div').css("background",color);
		Cookies.set("color",color);
	});

	if ( color ) {
		console.log(color);
		$('select[name="colorpicker"]').simplecolorpicker('selectColor',color);
		$('.size_wrapper div').css("background",color);
	}
	else {
		color = $('select[name="colorpicker"]').val();
		$('.size_wrapper div').css("background-color",color);
		Cookies.set("color",color);
	}

	// This demo depends on the canvas element
	if(!('getContext' in document.createElement('canvas'))){
		alert('Sorry, it looks like your browser does not support canvas!');
		return false;
	}

	// The URL of your web server (the port is set in app.js)
	var url = document.location.host;

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

	// A flag for drawing activity
	var drawing = false;

	var clients = {};
	var cursors = {};
	

	socket.on('clear', function(data) {
		ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
	});

	socket.on('moving', function (data) {
		console.log('in socket moving');
		if ( data.name ) {
			if(! (data.id in clients) ){
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
		}
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

		socket.emit('mousemove',{
			'x': 0,
			'y': 0,
			'drawing': drawing,
			'id': id,
			'name': name,
			'color': color
		});
	});

	var lastEmit = $.now();

	doc.on('mousemove',function(e){
		if($.now() - lastEmit > 30){
			socket.emit('mousemove',{
				'x': e.pageX,
				'y': e.pageY,
				'drawing': drawing,
				'width': lineWidth,
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
		ctx.lineCap = 'round';
		ctx.lineWidth = lineWidth;
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.stroke();
	}

	$('#clear').click(function(e) {
		e.preventDefault();
		$('#confirm_clear').popup({
			autoopen: true,
			pagecontainer: '.container',
			transition: 'all 0.3s',
			blur: false,
		});
		$('#confirm_clear #yes').click(function() {
			$.get("/clear");
			$('#confirm_clear').popup('hide');
			socket.emit('clear_clicked');
			ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
		});
		$('#confirm_clear #no').click(function() {
			$('#confirm_clear').popup('hide');
		});
	});

	$('#email_button').click( function(e) {
		$('#confirm_send').popup({
			autoopen: true,
			pagecontainer: '.container',
			transition: 'all 0.3s',
			blur: true,
		});
		$('#confirm_send #yes').click(function() {
			$.ajax( {
				url: '/send',
				data: {name:name}
			}).done(function() {
				$("#send").hide();
				$("#sent").show();
			});
		});
		$('#confirm_send #no').click(function() {
			$('#confirm_send').popup('hide');
		});

	});

	$('#large').click(function() {
		lineWidth = 10;
	});

	$('#medium').click(function() {
		lineWidth = 6;
	});

	$('#small').click(function() {
		lineWidth = 3;
	});

	window.setInterval(function() {
		socket.emit('user_ping',{
			name:name
		});
	}, 3000);

});
