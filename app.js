var url = 'https://gu-trigger.herokuapp.com',
    discussionAPI = 'https://discussion-secure.guardianapis.com/discussion-api/',
    socket,
    n,
    userId = localStorage.getItem('gu:trigger:userId'),
    user = {},
    store = {};

// Loading up
(function load() {
    user.userId = localStorage.getItem('gu:trigger:userId');
    user.displayName = localStorage.getItem('gu:trigger:displayName');

    if (user.userId) {
        connect();
    }
})();

function storeUser(user) {
	localStorage.setItem('gu:trigger:userId', user.userId);
    localStorage.setItem('gu:trigger:displayName', user.displayName);
	console.log('User set to '+ user.userId +':'+ user.displayName);
	updateUserDetails();
}

function setUserId(id) {
	fetchProfileById(newId, 'setUserNameFromProfile');
}

function setUserName(name) {
	fetchProfileByName(name, 'setUserNameFromProfile');
}

function setUserNameFromProfile(response) {
	if (response.status == 'ok') {
		user.userId = response.userProfile.userId;
		user.displayName = response.userProfile.displayName;

		storeUser(user);

		if(socket && socket.socket.connected) {
			sendUserId();
        } else {
            connect();
        }
	} else {
		alert('Error. Does that user exist?');
    }
}

function showDebuggingLinks() {
	document.getElementById('debugging').style.display="block";
}

function connect() {
    if (socket && socket.socket.connecting) {
        disconnect();
    }
    
    if (!havePermission())
        return requestPermission(function() { connect(); });

	if (! socket) {
        socket = io.connect(url);
        
		socket.on('connect', function() {
			console.log('Connected to %s', url);
			updateStatus('Connected');
		
			sendUserId();
		});
		
		socket.on('message', function(message) {
			handle(message); 
		});

		socket.on('disconnect', function() {
			console.log('Conection was closed');
			if (socket.socket.reconnecting) // TODO: this doesn't seem to be true at this point
				updateStatus('Connection lost. Reconnecting...');
			else
				updateStatus('Disconnected');
		});
	
		socket.on('reconnect_failed', function() {
			console.log('Auto-reconnect failed... giving up.');
			updateStatus('Disconnected');
			notify('reconnect-failed', 'Trigger connection lost', 'Click to try reconnecting', function() {connect()});
		});
	}
   
    if (! socket.socket.connectiong) {
		// On disconnect/reconnect, this doesn't seem to auto connect
		//  (I think it's re-using the socket)
		socket.socket.connect()    	
    }
    updateStatus('Connecting...');
}

function disconnect() {
    if (socket)
    	socket.disconnect();
}

function updateStatus(status) {
	console.log(status);
	store.status = status;
}

function updateUserDetails() {
	fetchProfileById(userId, 'updateUserDetailsWithProfile');
}

function updateUserDetailsWithProfile(response) {
	if (response.status == 'ok') {
		var link = document.getElementById('profile-link');
		if (link) {
			link.style.backgroundImage = 'url(' + response.userProfile.avatar + ')';
			link.href = response.userProfile.webUrl;
			link.title = response.userProfile.displayName + ' (click for profile)';
		}
	} else {
		alert('non');
	}
}


function sendUserId() {
	socket.emit('set-user-id', userId);
}

function sendPing() {
    if (socket) {
        socket.send(JSON.stringify({
            type: 'ping',
            date: new Date()
        }));
    }
}

function sendPong() {
    if (socket) {
        socket.send(JSON.stringify({
            type: 'pong',
            date: new Date()
        }));
    }
}


function requestPermission(callback) {
    if (supportNotifications()) {
        console.log('Requesting permission from user to display notifications');
        Notification.requestPermission(function (status) {
            // This allows to use Notification.permission with Chrome/Safari
            if (Notification.permission !== status) {
                Notification.permission = status;
            }
            console.log('New permission state: %s', status);
            
            if (callback)
                callback(status);
        });
    }
}

function havePermission() {
    return supportNotifications() && Notification.permission == 'granted';
}

function supportNotifications() {
    if (!'Notification' in window) {
        // If the browser version is unsupported, remain silent.
        console.log('Notifications not supported in this browser');
        return false;
    } else {
        return true;
    }
}

function connected(c) {
    return c(socket && socket.socket.connected);
}
