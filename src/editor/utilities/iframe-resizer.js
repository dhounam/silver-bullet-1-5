import throttle from 'lodash/throttle';

function econOnResize(className, margin) {
  // console.log('resizing thingy');
  let height;
  if (typeof window.getComputedStyle !== 'undefined') {
    const contentElement = document.querySelector(className);
    if (!contentElement) {
      setTimeout(econOnResize, 0);
      return;
    }
    height = parseInt(
      window
        .getComputedStyle(contentElement, null)
        .getPropertyValue('height')
        .split('.')[0],
      10,
    );
  } else {
    const contentElement = document.querySelector(className);

    // const html = document.documentElement;
    if (!contentElement) {
      setTimeout(econOnResize, 0);
      return;
    }
    height = contentElement.getBoundingClientRect().height;
  }

  // const targetOrigin =
  //   window.location !== window.parent.location
  //     ? document.referrer
  //     : document.location;

  window.parent.postMessage(
    {
      type: 'RESIZE',
      payload: {
        height: height + margin + 5,
        origin: document.location.href,
      },
    },
    '*',
  );
}

const iframeResizer = ({ className, margin = 0 }) => {
  econOnResize(className, margin);

  window.addEventListener(
    'resize',
    throttle(() => econOnResize(className, margin), 200),
  );

  // safeguard
  setTimeout(() => econOnResize(className, margin), 500);
};

export { iframeResizer, econOnResize };
