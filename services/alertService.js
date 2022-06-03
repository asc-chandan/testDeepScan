import { Subject } from "rxjs";

const toastShowSubject = new Subject();
const toastHideSubject = new Subject();

let alertId = 0;

// enable subscribing to toast observables
function onToastShow() {
  return toastShowSubject.asObservable();
}
function onToastHide() {
  return toastHideSubject.asObservable();
}

/**
 * 
 * @param {'success' | 'error' | 'warn' | 'info' | 'alert' | 'process'} type 
 * @param {string} message 
 * @param {{autoClose : true}} options 
 */
function showToast(type, message, options={autoClose:true}) {
  alertId = alertId + 1;
  toastShowSubject.next({ id: alertId, type, message, ...options });
  return alertId;
}


/**
 * 
 * @param {number} toastId 
 */
function hideToast(toastId) {
  toastHideSubject.next({ id: toastId });
}

const alertService = {
  onToastShow,
  onToastHide,
  showToast,
  hideToast
};

export default alertService;