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


///// parsers /////


function handlePing(ping) {
    console.log('Ping received; sent at %s', ping.date);
    sendPong();
}

function handlePong(pong) {
    var n = notify('pong', 'Pong!', 'Response received from server');
    if (n) setTimeout(function() { n.close() }, 2000);
}


function handleDirectReply(reply) {
    notify('discussion:reply:' + reply.comment.id,
        'Reply to your comment from '+ reply.comment.userProfile.displayName,
        reply.comment.body,
        function () {
            window.open(reply.comment.webUrl);
            this.close();
        });
}

function handleMessage(message) {
    notify('message:' + message.id, message.subject, message.text);
}

function handleSoulmatesDM(message) {
    notify('soulmates:dm:' + message.id, 'Soulmates: New message from ' + message.sender, message.text, function() {
        window.open('https://soulmates.theguardian.com/');
    });
}

function handleBreaking(breaking) {
    notify('breaking:' + breaking.id, 'BREAKING: ' + breaking.headline, breaking.trail, function() {
        window.open(breaking.url);
    });
}

function handleNewContent(content) {
    notify('content:' + content.id, content.headline, content.trail, function() {
        window.open(content.url);
    });
}

var handlers = {
    'newcontent': handleNewContent,
    'ping': handlePing,
    'pong': handlePong,
    'directreply': handleDirectReply,
    'message': handleMessage,
    'soulmatesDM': handleSoulmatesDM,
    'breaking': handleBreaking
};

//////////
function strip(html) {
   var tmp = document.createElement('div');
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || '';
}

function handle(message) {
    var notification = JSON.parse(message);

    var handler = handlers[notification.type];
    console.log(notification);
    if (handler) {
        handler(notification);
    } else {
        console.log('Unknown type: %s', notification.type);
    }
}

function notify(id, title, body, onclick) {
    console.log(chrome.extension.getURL('logo.png'))
    if (havePermission()) {
        var n = new Notification(title, {
            body: strip(body),
            iconUrl: chrome.extension.getURL('logo.png'),
            icon: chrome.extension.getURL('logo.png'),
            tag: 'gu:notify:' + id
        });

        if (onclick) n.onclick = onclick;
        return n;
    } else {
        console.log('No permission to notify - ignoring notification');
        return null;
    }
}


function fetchProfileById(id, callback) {
	var script = document.createElement('script');
	script.src = discussionAPI + 'profile/'
		+ id
		+ '?callback='
		+ callback;
	document.body.appendChild(script);
}

function fetchProfileByName(username, callback) {
	var script = document.createElement('script');
	script.src = discussionAPI + 'profile/vanityUrl/'
		+ username
		+ '?callback='
		+ callback;
	document.body.appendChild(script);
}
