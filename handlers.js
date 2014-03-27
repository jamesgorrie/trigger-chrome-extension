

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
