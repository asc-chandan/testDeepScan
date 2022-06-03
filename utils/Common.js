// return the user data from the session storage
import SHA512 from 'crypto-js/sha512';
import Base64 from 'crypto-js/enc-base64';
import moment from 'moment';
import * as Constants from '../components/Constants.js';
import { givePrevNthDate } from '../components/MultiPeriodPicker/components/utils.js';

/************************************************
 * Get Chart Colors
 */
export const getChartColors = () => {
  return Constants.chartColors;
}

/**Cell minimumn width allowed. Used in data grid */
export const CELL_MIN_WIDTH = 80;

/**Used in Calendar tab of Data grid filter panel */
export const PERIOD_COMPARISON_PRESELECT_OPTIONS = [{ id: 'CUSTOM', name: 'Custom' }, { id: 'DOD', name: 'Day over Day' }, { id: 'WOW', name: 'Week over Week' }, { id: 'MOM', name: 'Month over Month' }, { id: 'QOQ', name: 'Quarter over Quarter' }, { id: 'YOY', name: 'Year over Year' }];



/************************************************
 * Get User Auth Token
 */
// return the token from the session storage
export const getToken = () => {
  return localStorage.getItem(Constants.SITE_PREFIX + 'token') || null;
  
  // New method - get token from sso site
  // window.SSO.getToken((token) => {
  //   return token;
  // });
}

/************************************************
 * Get Any Local Storegae Variable Val
 */
// return the token from the session storage
export const getLocalStorageVal = (key) => {
  return localStorage.getItem(Constants.SITE_PREFIX + key) || null;
}


/************************************************
 * Get Hashed Password
 */
export const generateHashedPassword = (password) => {
  const hashPassword = SHA512(password);
  const hasedPassword = hashPassword.toString(Base64);
  return hasedPassword;
}


/************************************************
 * Set and Get User Token
 */
//Get User Details
export const getUser = () => {
  const userStr = localStorage.getItem(Constants.SITE_PREFIX + 'user');
  if (userStr) return JSON.parse(userStr);
  else return null;
  
  // window.SSO.getUserInfo((userData) => {
  //   if (userData) return JSON.parse(userData);
  //   else return null;
  // });
}

export const getUserDetailsFromToken = (token) => {
  if (token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      // ignore
    }
  }
  return null;
}

// Set the token and user from the session storage
export const setUserSession = (token, user, uniqueid = null) => {
  localStorage.setItem(Constants.SITE_PREFIX + 'token', token);
  localStorage.setItem(Constants.SITE_PREFIX + 'user', JSON.stringify(user));
  if (uniqueid) {
    localStorage.setItem(Constants.SITE_PREFIX + 'sessionid', uniqueid);
  }
}

// Set the token and user from the session storage
export const setLoginAsUserSession = (original_token, token, user) => {
  //Take backup of orginal user token 
  // const originalUserToken = localStorage.getItem(Constants.SITE_PREFIX+'token');
  localStorage.setItem(Constants.SITE_PREFIX + 'init_token', original_token);

  //Update exsiting token and user details to local storage
  setTimeout(() => {
    localStorage.setItem(Constants.SITE_PREFIX + 'token', token);
    localStorage.setItem(Constants.SITE_PREFIX + 'user', JSON.stringify(user));
  }, 10);
}

// Remove the token and user from the session storage
export const removeUserSession = () => {
  var arr = []; // Array to hold the keys
  // Iterate over localStorage and insert the keys that meet the condition into arr
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i).substring(0, 6) === Constants.SITE_PREFIX) {
      arr.push(localStorage.key(i));
    }
  }

  // Iterate over arr and remove the items by key
  for (let i = 0; i < arr.length; i++) {
    localStorage.removeItem(arr[i]);
  }

  // New method - sso
  // window.SSO.clearData(() => {
  // });
}

export const debounce = (fn, delay) => {
  let inDebounceTimer;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(inDebounceTimer)
    inDebounceTimer = setTimeout(() => fn.apply(context, args), delay)
  }
}

export const giveDateInMMDDYYY = (dateObj) => {
  if (dateObj === null) { return ''; }
  const y = dateObj.getFullYear().toString();
  const yyyy = (y.length < 4) ? Array(4 - y.length).fill('0').join('') + y : y;
  return (dateObj.getMonth() + 1 < 10 ? '0' + (dateObj.getMonth() + 1) : dateObj.getMonth() + 1) + '/' + (dateObj.getDate() < 10 ? '0' + dateObj.getDate() : dateObj.getDate()) + '/' + yyyy;
};

/**Give date range in string format for a preselect */
export const convertDatePeriodPreselectsToRange = (preselect, customSettings = null) => {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  switch (preselect) {
    case 'Yesterday': return giveDateInMMDDYYY(yesterday) + ' - ' + giveDateInMMDDYYY(yesterday);
    case 'Today': return giveDateInMMDDYYY(today) + ' - ' + giveDateInMMDDYYY(today);
    case 'Last 7 Days': return giveDateInMMDDYYY(givePrevNthDate(yesterday, 6)) + ' - ' + giveDateInMMDDYYY(yesterday);
    case 'Last 15 Days': return giveDateInMMDDYYY(givePrevNthDate(yesterday, 14)) + ' - ' + giveDateInMMDDYYY(yesterday);
    case 'Last 30 Days': return giveDateInMMDDYYY(givePrevNthDate(yesterday, 29)) + ' - ' + giveDateInMMDDYYY(yesterday);
    case 'Last Month': return giveDateInMMDDYYY(new Date(today.getFullYear(), today.getMonth() - 1, 1)) + ' - ' + giveDateInMMDDYYY(new Date(today.getFullYear(), today.getMonth(), 0));
    case 'This Month': return giveDateInMMDDYYY(new Date(today.getFullYear(), today.getMonth(), 1)) + ' - ' + giveDateInMMDDYYY(today);
    case 'Last Year': return giveDateInMMDDYYY(new Date(today.getFullYear() - 1, 0, 1)) + ' - ' + giveDateInMMDDYYY(new Date(today.getFullYear() - 1, 11, 31));
    case 'This Year': return giveDateInMMDDYYY(new Date(today.getFullYear(), 0, 1)) + ' - ' + giveDateInMMDDYYY(today);
    case 'Custom':
      const daysInputStart = customSettings.start_date;
      const daysInputStartPreselect = customSettings.start_date_preselect;
      const daysInputEnd = customSettings.end_date;
      const daysInputEndPreselect = customSettings.end_date_preselect;
      let sd, ed;
      // range's start date calculation
      if (daysInputStartPreselect === 'days before yesterday') {
        sd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() - daysInputStart);
      } else if (daysInputStartPreselect === 'weeks before yesterday') {
        sd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() - daysInputStart * 7);
      } else if (daysInputStartPreselect === 'months before yesterday') {
        sd = new Date(yesterday.getFullYear(), yesterday.getMonth() - daysInputStart, yesterday.getDate());
      } else if (daysInputStartPreselect === 'quarters before yesterday') {
        sd = new Date(yesterday.getFullYear(), yesterday.getMonth() - 3 * daysInputStart, yesterday.getDate());
      } else if (daysInputStartPreselect === 'years before yesterday') {
        sd = new Date(yesterday.getFullYear() - daysInputStart, yesterday.getMonth(), yesterday.getDate());
      } else {
        sd = yesterday;
      }
      // range's end date calculation
      if (daysInputEndPreselect === 'days before today') {
        ed = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysInputEnd);
      } else if (daysInputEndPreselect === 'weeks before today') {
        ed = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysInputEnd * 7);
      } else if (daysInputEndPreselect === 'months before today') {
        ed = new Date(today.getFullYear(), today.getMonth() - daysInputEnd, today.getDate());
      } else if (daysInputEndPreselect === 'quarters before today') {
        ed = new Date(today.getFullYear(), today.getMonth() - 3 * daysInputEnd, today.getDate());
      } else if (daysInputEndPreselect === 'years before today') {
        ed = new Date(today.getFullYear() - daysInputEnd, today.getMonth(), today.getDate());
      } else {
        ed = today;
      }
      return giveDateInMMDDYYY(sd) + ' - ' + giveDateInMMDDYYY(ed);
    default: return preselect;
  }
}


// Check and decide home page url based on side bar pages navigation availability (as per privileges)
export const getDefaultHomePageURL = (sitePages, terminal_type, user_info) => {
  // check available navigations and redirect there
  let sidePages = sitePages[terminal_type.id];
  let availablePages = [];
  let default_home_url = '/' + terminal_type.id;

  if (user_info.privileges[terminal_type.id] !== undefined) {
    sidePages.forEach((item) => {
      let parent_nav_url = item.url;
      let hasNavAccess = false;
      if (typeof item.privilege === 'object') {
        hasNavAccess = (item.privilege.some(r => user_info.privileges[terminal_type.id].indexOf(r) >= 0) || (user_info.privileges['sellside'] && user_info.privileges['sellside'].indexOf('APEX') > -1));

        //Set first element url under parent nav
        let subPages = [];
        (item.sub_pages && item.sub_pages.forEach((subitem) => {
          if (user_info.privileges[terminal_type.id].indexOf(subitem.privilege) > -1 || (user_info.privileges['sellside'] && user_info.privileges['sellside'].indexOf('APEX') > -1)) {
            subPages.push(subitem);
          }
        }));
        if (subPages.length > 0) {
          parent_nav_url = subPages[0]['url']; //set first child element url as parent nav url
        }
      } else {
        hasNavAccess = (user_info.privileges[terminal_type.id].indexOf(item.privilege) > -1 || (user_info.privileges['sellside'] && user_info.privileges['sellside'].indexOf('APEX') > -1));
      }

      if (hasNavAccess) {
        availablePages.push(parent_nav_url);
      }
    });
  }

  if (availablePages.length > 0) {
    default_home_url = availablePages[0];
  }
  return default_home_url;
}

/************************************************
 * Set and Get Clients - whiche user has access
 */
// set the clients from the local storage
// export const setClients = (clients) => {
//   localStorage.setItem(Constants.SITE_PREFIX+'user_clients', clients);
// }

// set the clients from the local storage
export const getClients = () => {
  const userStr = localStorage.getItem(Constants.SITE_PREFIX + 'user');
  if (userStr) {
    const userObj = JSON.parse(userStr);
    const clients = userObj.clients;
    return clients;
  } else {
    return null;
  }
}

export const getLastFetchedClient = (user_info) => {
  //Redirect User to Last Select Client
  let last_fetched_client;
  if (user_info.parent_organization_id > 0) {
    last_fetched_client = user_info.clients[0];
  } else {
    if (user_info.last_fetched_client !== undefined && user_info.last_fetched_client.client_id !== '') {
      let clientIndex = user_info.clients.findIndex(x => x.id === user_info.last_fetched_client);
      last_fetched_client = user_info.clients[clientIndex];
    } else {
      last_fetched_client = user_info.clients[0];
    };
  }
  return last_fetched_client;
}


/************************************************
 * Download File on Frontend
 */
export const exportCSVFile = (formattedRows, file_name) => {
  // Convert Object to JSON
  var jsonObject = JSON.stringify(formattedRows);
  var csv = convertJSONToCSV(jsonObject);
  var exportedFilenmae = file_name + '.csv' || 'export.csv';
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  if (navigator.msSaveBlob) { // IE 10+
    navigator.msSaveBlob(blob, exportedFilenmae);
  } else {
    var link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", exportedFilenmae);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
  return false;
}

export const convertJSONToCSV = (objArray) => {
  var results = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
  var str = '';

  //generate row as string to generate csv
  for (var i = 0; i < results.length; i++) {
    var line = '';
    for (var index in results[i]) {
      if (line != '') line += ','
      if (typeof results[i][index] === 'object') {
        line += (results[i][index].data.includes(',')) ? '"' + results[i][index].data + '"' : results[i][index].data; //wrap string to double quotes if values contians comma

      } else {
        if (typeof results[i][index] === 'string' && results[i][index].includes(',')) {
          line += '"' + results[i][index] + '"';
        } else {
          line += results[i][index];
        }
      }
    }
    str += line + '\r\n';
  }

  return str;
}

/************************************************
 * Find Key by value  - Under object
 */

//Get Key by Value from array of objects
export const getKeyByValue = (array, value, key = 'name') => {
  for (var i = 0; i < array.length; i++) {
    if (array[i][key] === value) {
      return array[i];
    }
  }
}

export const findKeyValueRecursively = (arr, value, valueToFind) => {
  arr.filter(function (item) { return item.id === value })
    .map(function (item) { return item.valueToFind })
}


//Check if an object is empty
export const isEmptyObject = (obj) => {
  if (obj) {
    return Object.keys(obj).length === 0;
  }
}

//Deep compare array of objects
export const compareObjects = (o, p) => {
  var i,
    keysO = Object.keys(o).sort(),
    keysP = Object.keys(p).sort();
  if (keysO.length !== keysP.length)
    return false;//not the same nr of keys
  if (keysO.join('') !== keysP.join(''))
    return false;//different keys
  for (i = 0; i < keysO.length; ++i) {
    if (o[keysO[i]] instanceof Array) {
      if (!(p[keysO[i]] instanceof Array))
        return false;
      //if (compareObjects(o[keysO[i]], p[keysO[i]] === false) return false
      //would work, too, and perhaps is a better fit, still, this is easy, too
      if (p[keysO[i]].sort().join('') !== o[keysO[i]].sort().join(''))
        return false;
    }
    else if (o[keysO[i]] instanceof Date) {
      if (!(p[keysO[i]] instanceof Date))
        return false;
      if (('' + o[keysO[i]]) !== ('' + p[keysO[i]]))
        return false;
    }
    else if (o[keysO[i]] instanceof Function) {
      if (!(p[keysO[i]] instanceof Function))
        return false;
      //ignore functions, or check them regardless?
    }
    else if (o[keysO[i]] instanceof Object) {
      if (!(p[keysO[i]] instanceof Object))
        return false;
      if (o[keysO[i]] === o) {//self reference?
        if (p[keysO[i]] !== p)
          return false;
      }
      else if (compareObjects(o[keysO[i]], p[keysO[i]]) === false)
        return false;//WARNING: does not deal with circular refs other than ^^
    }
    if (o[keysO[i]] !== p[keysO[i]])//change !== to != for loose comparison
      return false;//not the same value
  }
  return true;
}

//Format Date
export const formatDate = (date, date_format) => {
  return moment(date).format(date_format);
}

export const convertMMDDYYYYToDateObject = (dateStr) => {
  if (!dateStr) { return ''; }
  const [mm, dd, yyyy] = dateStr.split('/');
  return new Date(yyyy, mm - 1, dd);
}

export const giveDotSeparatedDateRange = (dateRangeSlashSeparated) => {
  if (!dateRangeSlashSeparated) { return ''; }
  const ranges = dateRangeSlashSeparated.split(' - ');
  return formatDate(convertMMDDYYYYToDateObject(ranges[0]),'MM.DD.YYYY') + ' - ' + formatDate(convertMMDDYYYYToDateObject(ranges[1]),'MM.DD.YYYY') ;
}


/************************************************
 * Order Object with expected keys order
 */
export const orderObjectKey = (obj, keyOrder) => {
  keyOrder.forEach((k) => {
    const v = obj[k]
    delete obj[k]
    obj[k] = v
  })
  return obj;
}


/************************************************
 * Format numbers with commas
 */
export const numberWithCommas = (x) => {
  const [integer, decimal] = x.toString().split('.');
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (decimal ? '.' + decimal : '');

}

/************************************************
 * Converts a underscore separated string to space separated string
 * @example converts 'view_type' to 'View Type'
 *************************************************/
export const covertUnderscoreToSpaceInString = (str) => {
  if (typeof str !== 'string') {
    throw Error('Parameter must be of type string');
  }
  if (str === '') { return ''; }
  return str.split('_').map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
}


/************************************************
 * Order Array of objects by key val
 */
export const orderArrayObjects = (arr, key, order) => {
  arr.sort(function (a, b) {
    if (order === 'asc') {
      return new Date(a[key]).getTime() - new Date(b[key]).getTime();
    } else {
      return new Date(b[key]).getTime() - new Date(a[key]).getTime();
    }
  });
}

export const displayTextWidth = (text, font) => {
  let canvas = displayTextWidth.canvas || (displayTextWidth.canvas = document.createElement("canvas"));
  let context = canvas.getContext("2d");
  context.font = font;
  let metrics = context.measureText(text);
  return Math.ceil(metrics.width);
};


// Helper function to get an element's exact position
function getPosition(el) {
  var xPos = 0;
  var yPos = 0;

  while (el) {
    if (el.tagName == "BODY") {
      // deal with browser quirks with body/window/document and page scroll
      var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
      var yScroll = el.scrollTop || document.documentElement.scrollTop;

      xPos += (el.offsetLeft - xScroll + el.clientLeft);
      yPos += (el.offsetTop - yScroll + el.clientTop);
    } else {
      // for all other non-BODY elements
      xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
      yPos += (el.offsetTop - el.scrollTop + el.clientTop);
    }

    el = el.offsetParent;
  }
  return {
    x: xPos,
    y: yPos
  };
}


function scrollTo(element, to, duration) {
  var start = element.scrollTop,
    change = to - start,
    currentTime = 0,
    increment = 20;

  var animateScroll = function () {
    currentTime += increment;
    var val = Math.easeInOutQuad(currentTime, start, change, duration);
    element.scrollTop = val;
    if (currentTime < duration) {
      setTimeout(animateScroll, increment);
    }
  };
  animateScroll();
}

//t = current time
//b = start value
//c = change in value
//d = duration
Math.easeInOutQuad = function (t, b, c, d) {
  t /= d / 2;
  if (t < 1) return c / 2 * t * t + b;
  t--;
  return -c / 2 * (t * (t - 2) - 1) + b;
};