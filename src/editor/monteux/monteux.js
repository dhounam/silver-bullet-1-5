// Rob's Monteux component. Kill all linting.
/* eslint-disable */
// UMD monteux lib
// put in dist folder and use from there then update docs
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.monteux = factory();
  }
})(this, function() {
  const postMessage = function(message) {
    parent.postMessage(
      {
        from: 'monteux-renderer',
        payload: message,
      },
      '*',
    );
  };

  const listenForMessages = function(cb, keyword) {
    const eventMethod = window.addEventListener
      ? 'addEventListener'
      : 'attachEvent';
    const eventer = window[eventMethod];
    const messageEvent = eventMethod == 'attachEvent' ? 'onmessage' : 'message';

    eventer(
      messageEvent,
      function(e) {
        var key = e.message ? 'message' : 'data';
        var data = e[key];
        if (data.from === keyword) {
          cb(data.payload);
        }
      },
      false,
    );
  };

  return {
    postMessage,
    listenForMessages,
  };
});
