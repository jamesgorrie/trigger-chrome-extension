document.addEventListener('DOMContentLoaded', function() {
  var setUserNameElem = document.getElementById('set-user-name'),
      connectElem = document.getElementById('connect'),
      disconnectElem = document.getElementById('disconnect'),
      userNameElem = document.getElementById('user-name'),
      connectionStatusElem = document.getElementById('connection-status'),
      bg = chrome.extension.getBackgroundPage();

  connectElem.addEventListener('click', function() {
    bg.connect();
  });

  disconnectElem.addEventListener('click', function() {
    bg.disconnect();
  });
  
  setUserNameElem.addEventListener('click', function() {
    bg.setUserName(userNameElem.value);
  });

  userNameElem.value = bg.user.displayName;

  bg.connected(function(connected) {
    if (connected) {
      connectionStatusElem.classList.remove('status--disconnected');
      connectionStatusElem.classList.add('status--connected');
    } else {
      connectionStatusElem.classList.add('status--disconnected');
      connectionStatusElem.classList.remove('status--connected');
    }
  });
});