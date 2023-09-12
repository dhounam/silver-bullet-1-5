import React from 'react';

const ExpandMoreIcon = ({ flip }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="10"
    height="6"
    viewBox="0 0 10 6"
    style={{ transform: flip ? 'rotate(180deg)' : '' }}
  >
    <polygon
      fill="#FFF"
      fillRule="evenodd"
      points="8.825 0 5 3.709 1.175 0 0 1.142 5 6 10 1.142"
    />
  </svg>
);

export default ExpandMoreIcon;
