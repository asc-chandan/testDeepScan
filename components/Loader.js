import React from 'react';
import AnimatedIcon from '../images/icon-loading.svg';

const Loader = () => (
  <div className="showloading">
    <object type="image/svg+xml" data={AnimatedIcon}>svg-animation</object>
  </div>
)

export default Loader
