import React from 'react';

const RefinitivIcon = ({ size }) => (
  <svg
    width={size || 16}
    height={size || 16}
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <path d="M1,15V1H15" stroke="blue" strokeWidth="2" fill="none" />
      <path d="M15,7.5h-7.5L15,15" stroke="blue" strokeWidth="2" fill="none" />
    </g>
  </svg>
);

export default RefinitivIcon;
