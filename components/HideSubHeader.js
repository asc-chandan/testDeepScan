import React from 'react';

export default function HideSubHeader() {
  //Hide Sub Header
  const handleHideSubHeader = () => {
    document.body.classList.add('hide-control_bar_2');
    document.querySelector('.layout-select .control-bar-2').classList.add('active');
  }
  return (
    <button className="btn-hide-subheader" onClick={handleHideSubHeader}></button>
  );
}
