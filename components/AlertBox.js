import React, { useState, useEffect } from 'react'; 

function AlertBox(props){
  const hideTimeMS = ((props.autoHideTime!==undefined) ? props.autoHideTime : 3000);
  const hideTime = (hideTimeMS/1000);
  const [counter, setCounter] = useState(hideTime);
  
  /**Effect for Countdown */
  useEffect((props) => {
    if(counter===0){
      props.onAlertClose();
      return;
    }

    let timer = setTimeout(() => {
      setCounter(counter - 1);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [counter]);

  return (
    <div className={'view-alert-box active '+(props.error!=='' ? 'error' : 'success')}>
      <div className="msg">
        <div className="title">{(props.error!=='' ? 'Error!' : 'Success!')}</div>
        <div className="details">{props.message}</div>
      </div>
      <div className="btn-wrapper"><div className="btn-close" onClick={props.onAlertClose}></div></div>
      
      {props.autoHide && 
        <div className="countdown-wrap">
          <div className="countdown">
            <div className="mask full"><div className="fill"></div></div>
            <div className="mask half"><div className="fill"></div></div>
            <div className="inside-count">{counter}</div>
          </div>
        </div>
      }
    </div>
  );
}

export default AlertBox;
