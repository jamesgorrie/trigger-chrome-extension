document.addEventListener('DOMContentLoaded', function() {
  var setUserNameElem = document.getElementById('set-user-name'),
      connectElem = document.getElementById('connect'),
      disconnectElem = document.getElementById('disconnect'),
      userNameElem = document.getElementById('user-name'),
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
});