$(document).on('ready', function () {
	var serverBaseUrl = document.domain;

	// on client init, try to connect to chatroom_socket.io server, no need to specify port bc we already did that
	// var chatroom_socket = io.connect(serverBaseUrl);
	var chatroom_socket = io.connect(serverBaseUrl + '/chatroom');

	// save session ID in a var for later
	var sessionId = '';

	// when client connects successfully to the server, an event "connect" is emitted
	// get the sess ID & log it
	chatroom_socket.on('connect', function () {
		sessionId = chatroom_socket.socket.sessionid;
		console.log('Connected ' + sessionId);
		// let chatroom_socket.io know when there's a new user w/ their sessionid and name, emit "newUser" event
		chatroom_socket.emit('newUser', {id: sessionId, name: $('#name').val()});
	});

	// when server emits "newConnection" event, reset participants section, display connected users, and we are assigning sessionid as span id
	chatroom_socket.on('newConnection', function (data) {
		updateParticipants(data.participants);
	});

	// when server emits "userDisconnected" event, remove span element from participants element
	chatroom_socket.on('userDisconnected', function (data) {
		$('#' + data.id).remove();
	});

	// when server fires "nameChanged" event, we must update span w/ given id
	chatroom_socket.on('nameChanged', function (data) {
		$('#' + data.id).html(data.name + ' ' + (data.id === sessionId ? '(You)' : '') + '<br />');
	});

	// when receiving new chat message w/ "incomingMessage" event, prepend it to messages section
	chatroom_socket.on('incomingMessage', function (data) {
		var message = data.message;
		var name = data.name;
		$('#messages').prepend('<b class="sn">' + name + ':</b>  ' + message + '<br>'); // for some reason they mispelled it as hr here
	});

	// sendMessage will do an ajax post call to server w/ message in textarea
	function sendMessage() {
		var outgoingMessage = $('#outgoingMessage').val();
		var name = $('#name').val();
		$.post('/chatroom/message', {
			message: outgoingMessage,
			name: name
		})
	}

	// helper function to update participants' list
	function updateParticipants (participants) {
		$('#participants').html('');
		for (var i = 0; i < participants.length; i++) {
			$('#participants').append('<span id="' + participants[i].id + '">' + 
				participants[i].name + ' ' + (participants[i].id === sessionId ? '(You)' : '') + '<br /></span>');
		}
	}

	// if user presses Enter on textarea, call sendMessage if valid
	function outgoingMessageKeyDown(event) {
		if (event.which == 13) {
			event.preventDefault();
			if ($('#outgoingMessage').val().trim().length <= 0) {
				return;
			}
			sendMessage();
			$('#outgoingMessage').val('');
		}
	}

	// helper function to disable/engable send button
	function outgoingMessageKeyUp() {
		var outgoingMessageValue = $('#outgoingMessage').val();
		$('#send').attr('disabled', (outgoingMessageValue.trim()).length > 0 ? false : true);
	}

	// when user updates name, let server know but emitting "nameChange" event
	function nameFocusOut() {
		var name = $('#name').val();
		chatroom_socket.emit('nameChange', {id: sessionId, name: name});
	}

	// elements setup
	$('#outgoingMessage').on('keydown', outgoingMessageKeyDown);
	$('#outgoingMessage').on('keyup', outgoingMessageKeyUp);
	$('#name').on('focusout', nameFocusOut);
	$('#send').on('click', sendMessage);
});
