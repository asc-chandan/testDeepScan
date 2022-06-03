require('dotenv').config();
// console.log(process.env);

export const SITE_TITLE = 'Sight byData';
export const SITE_PREFIX = 'sight_';
export const API_BASE_URL = process.env.REACT_APP_API_URL; //Prod
export const LIVE_SIGHT_URL = process.env.REACT_APP_LIVE_SIGHT_URL;
export const OLD_SIGHT_URL = process.env.REACT_APP_OLD_SIGHT_URL;
export const LOADING_ICON = 'images/icon-loading.gif';

// CHANGE THE VALUES FOR 'FACEBOOK_APP_ID', current value if of BITSAT 
export const FACEBOOK_SDK_VERSION = 'v8.0';
export const FACEBOOK_APP_ID = '951971661939082';
export const GOOGLE_CLIENT_ID = '760593868570-qrrv368enelg9qt44rn5dki9vk0dbl69.apps.googleusercontent.com';
// bitsat client id
// export const GOOGLE_CLIENT_ID = '522090135838-hom0bcthkhe96f7r24ak31g86k3k0afp.apps.googleusercontent.com';



//HandPicked Colors
export const chartColors = [
  "#00FF00", //Green
  "#0000FF", //Blue
  "#FF0000", //Red
  "#F9FD00", //Yellow
  "#FF00FF", //Pink
  "#FF4500", //Orange red
  "#00FFFF", //Aqua
  "#FFA500", //Orange
  "#00FF7F", //Spring Green

  "#f07a39", //carrot
  "#ed3a4b", //peony
  "#388a91", //aqua
  "#942f85", //berry
  "#3480c4", //pool
  "#fae176", //mustard
  "#9f4b24", //plum
  "#4dab5c", //rain forest
  // "#c38031", //golden yellow
  "#bea38c", //pumpkin
  "#328ac2", //sapphire
  "#868d37", //olive
  "#2f2386" //wild blueberry
];


/**************************
 * COMMON Devices Sizes
 */

 export const DevicesSizes = {
  'mobile': [
    {id: 1, name: 'iPhone 5/SE', size: '320*568', brand: 'apple'},
    {id: 2, name: 'iPhone 6/7/8', size: '375*667', brand: 'apple'},
    {id: 3, name: 'iPhone 6/7/8 Plus', size: '414*736', brand: 'apple'},
    {id: 4, name: 'iPhone X', size: '375*812', brand: 'apple'},
    {id: 4, name: 'iPhone 11/11 Pro Max', size: '414*896', brand: 'apple'},
    {id: 4, name: 'iPhone 11 Pro', size: '375*812', brand: 'apple'},
    {id: 4, name: 'iPhone 12/Pro', size: '390*844', brand: 'apple'},
    {id: 4, name: 'iPhone 12 Pro Max', size: '428*926', brand: 'apple'},
    {id: 4, name: 'iPhone 12/13 mini', size: '375*812', brand: 'apple'},
    {id: 4, name: 'iPhone 13/Pro', size: '390*844', brand: 'apple'},
    {id: 5, name: 'Samsung Galaxy S8+', size: '340*740', brand: 'samsung'},
    {id: 6, name: 'Samsung Galaxy S20 Ultra', size: '412*915', brand: 'samsung'},
  ],
  'tablet': [
    {id: 1, name: 'iPad Air', size: '820*1180', brand: 'apple'},
    {id: 2, name: 'iPad Mini', size: '768*1024', brand: 'apple'},
    {id: 3, name: 'iPad', size: '768*1024', brand: 'apple'},
    {id: 4, name: 'iPad Pro', size: '1024*1366', brand: 'apple'}
  ],
  'monitor':  [
    {id: 1, name: 'Super-eXtended Graphics Array (SXGA)', size: '1280*1024'},
    {id: 2, name: 'High Definition (HD)', size: '1366*768'},
    {id: 3, name: 'High Definition Plus (HD+)', size: '1600*900'},
    {id: 4, name: 'Full High Definition (FHD)', size: '1920*1080'},
    {id: 5, name: 'Wide Ultra Extended Graphics Array (WUXGA)', size: '1920*1200'},
    {id: 6, name: 'Quad High Definition (QHD)', size: '2560*1440'},
    {id: 7, name: 'Wide Quad High Definition (WQHD)', size: '3440*1440'},
    {id: 8, name: '4K or Ultra High Definition (UHD)', size: '3840*2160'},
  ],
  'laptop':  [
    {id: 1, name: 'MacBook Air 13-inch (2017)', size: '1440*900', brand: 'apple'},
    {id: 2, name: 'MacBook Air/Pro 13-inch (M1 chip, 2018/19/20)', size: '1440*900', resolution: '2560*1600', brand: 'apple'},
    {id: 3, name: 'MacBook Pro 14-inch (M1 Pro chip)', size: '1512*982', resolution: '3024*1964', brand: 'apple'},
    {id: 4, name: 'MacBook Pro 16-inch (M1 Pro chip)', size: '1728*1117', resolution: '3456*2234',  brand: 'apple'},
    {id: 5, name: 'Apple iMac 24-inch (M1 chip)', size: '2240*1260', resolution: '4480*2520', brand: 'apple'}
  ],
  'paper': [
    {id: 1, name: 'letter (4:3) - portrait', size: '900*1200' },
    {id: 2, name: 'letter (4:3) - landscape', size: '1200*900' },
    {id: 3, name: 'letter (16:9) - portrait', size: '768*1366' },
    {id: 4, name: 'letter (16:9) - landscape', size: '1366*768' },
  ]
}