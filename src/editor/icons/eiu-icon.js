import React from 'react';

const EiuIcon = ({ size }) => (
  <svg
    width={size || 16}
    height={size || 16}
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <path
        d="M1.31,11.71V3.95h4.28v1.26H2.63v1.88h2.76v1.23H2.63v2.13h3.14v1.25H1.31z"
        fill="black"
        fillRule="nonzero"
      />
      <path
        d="M6.61,11.71V3.95h1.32v7.76H6.61z"
        fill="black"
        fillRule="nonzero"
      />
      <path
        d="M10.32,3.95v4.46c0,0.54,0.04,0.91,0.15,1.26c0.2,0.63,0.77,0.92,1.48,0.92c0.81,0,1.33-0.33,1.52-1.02c0.09-0.33,0.13-0.75,0.13-1.21V3.95h1.29v4.46c0,0.76-0.08,1.38-0.25,1.85c-0.36,1.01-1.33,1.58-2.73,1.58c-1.24,0-2.23-0.48-2.63-1.52C9.1,9.84,9.02,9.22,9.02,8.48V3.95H10.32z"
        fill="black"
        fillRule="nonzero"
      />
    </g>
  </svg>
);

export default EiuIcon;
