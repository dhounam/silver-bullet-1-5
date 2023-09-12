import React from 'react';

const Alerts = props => {
  const config = props.config;
  let alertString = config.alertString;
  if (typeof alertString === 'undefined') {
    alertString = 'Undefined error in data';
  }
  let classString = 'silver-label alert-div';
  if (config.showAlert) {
    classString = `${classString} silver-label-alert`;
  }
  return <div className={classString}>{alertString}</div>;
};

export default Alerts;
