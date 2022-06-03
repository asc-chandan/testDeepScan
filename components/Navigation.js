/**************************
 * COMMON NAVIGATION
 */
export const IAMPages = [
  {
    'id': 101,
    'title': 'Profile',
    'url': '/IAM/profile',
    'show_in_menu': true,
    'privilege': 'UPDATE_PROFILE',
    'sub_pages': [
      {
        'id': 102,
        'parent_id': 101,
        'title': 'Profile',
        'url': '/IAM/profile',
        'show_in_menu': true,
        'privilege': 'UPDATE_PROFILE', //privilege_ids
      },
      {
        'id': 103,
        'parent_id': 101,
        'title': 'Create Organization',
        'url': '/IAM/create_organization',
        'show_in_menu': true,
        'privilege': 'APEX', //privilege_ids
      },
      {
        'id': 104,
        'parent_id': 101,
        'title': 'Create User',
        'url': '/IAM/create_user',
        'show_in_menu': true,
        'privilege': 'APEX', //privilege_ids
      },
      {
        'id': 105,
        'parent_id': 101,
        'title': 'Update User',
        'url': '/IAM/update_user',
        'show_in_menu': true,
        'privilege': 'APEX', //privilege_ids
      },
      {
        'id': 106,
        'parent_id': 101,
        'title': 'Master',
        'url': '/IAM/master',
        'show_in_menu': true,
        'privilege': 'APEX', //privilege_ids
      }
    ]
  }
];



export const adminPages = [
  {
    'id': 2101,
    'title': 'Data Stream',
    'url': '/sellside/datastream',
    'show_in_menu': true,
    'privilege': 'DATA_STREAM', //privilege_ids (which privileges has authrization to access this page)
    'class': 'data-stream',
    'sub_pages': ''
  },
  {
    'id': 1101,
    'title': 'Settings',
    'url': '/IAM/login_as',
    'show_in_menu': true,
    'privilege': 'APEX', //privilege_ids (which privileges has authrization to access this page)
    'sub_pages': [
      // {
      //   'id': 1102,
      //   'parent_id': 1101,
      //   'title': 'Data Connections',
      //   'url': '/console/data_connections',
      //   'show_in_menu': true,
      //   'privilege': 'DATA_CONNECTIONS'
      // },
      {
        'id': 1102,
        'parent_id': 1101,
        'title': 'IAM',
        'url': '/IAM/login_as',
        'show_in_menu': true,
        'privilege': 'APEX' //privilege_ids
      }
    ],
    'class': 'data-settings'
  }
];

/*************************************
 * TERMINAL  NAVIGATION - SITE PAGES
 */
export const sitePages = {
  'sellside': [
    // {
    //   'id': 1001,
    //   'title': 'Terminal',
    //   'url': '/sellside',
    //   'show_in_menu': true,
    //   'privilege': 'SIGHT_HOME',
    //   'sub_pages': '',
    //   'class': 'home'
    // },
    {
      'id': 201,
      'title': 'Trend Master',
      'url': '/sellside/datatrend/', // Trend Master has child - home, reportview
      'show_in_menu': true,
      'privilege': ['VIEW_ADVERTISER', 'VIEW_ADSERVER', 'VIEW_WEBANALYTICS', 'VIEW_PERFORMANCE'], //privilege_ids (which privileges has authrization to access this page)
      'class': "data-trend",
      "sub_pages": ''
    },
    {
      'id': 301,
      'title': 'Data Grid',
      'url': '/sellside/datagrid',
      'show_in_menu': true,
      'privilege': 'ANALYSIS_HOME', //privilege_ids (which privileges has authrization to access this page)
      'class': 'data-grid',
      'sub_pages': "",
    },
    {
      'id': 2001,
      'title': 'Custom Reports',
      'url': '/sellside/custom_reports',
      'show_in_menu': true,
      'privilege': 'CUSTOM_REPORTS', //privilege_ids (which privileges has authrization to access this page)
      'class': 'custom_reports',
      'sub_pages': ''
    },
    {
      'id': 401,
      'title': 'Accounting',
      'url': '/sellside/',
      'show_in_menu': true,
      'privilege': ['ACCOUNTS_RECEIVABLE', 'REVENUE_SHARE'], //privilege_ids (which privileges has authrization to access this page)
      'class': 'adseller_receivable',
      'sub_pages': [
        {
          'id': 402,
          'parent_id': 401,
          'title': 'Ad-Seller Receivable',
          'url': '/sellside/adseller_receivable',
          'show_in_menu': true,
          'privilege': 'ACCOUNTS_RECEIVABLE'
        },
        {
          'id': 403,
          'parent_id': 401,
          'title': 'Ad-Buyer Payable',
          'url': '/sellside/adbuyer_payable',
          'show_in_menu': true,
          'privilege': 'ACCOUNTS_RECEIVABLE' //privilege_ids
        },
        {
          'id': 404,
          'parent_id': 401,
          'title': 'Rev-Share Settings',
          'url': '/sellside/rev_share_settings',
          'show_in_menu': true,
          'privilege': 'REVENUE_SHARE', //privilege_ids 
        }
      ]
    },
    {
      'id': 2101,
      'title': 'Data Stream',
      'url': '/sellside/datastream',
      'show_in_menu': true,
      'privilege': 'DATA_STREAM', //privilege_ids (which privileges has authrization to access this page)
      'class': 'data-stream',
      'sub_pages': ''
    }
  ],
  'buyside': [
    {
      'id': 1001,
      'title': 'Home',
      'url': '/buyside',
      'show_in_menu': true,
      'privilege': 'SIGHT_HOME',
      'sub_pages': '',
      'class': 'home'
    },
    {
      'id': 1002,
      'title': 'Trend Master',
      'url': '/sellside/datatrend/', // Trend Master has child - home, reportview
      'show_in_menu': true,
      'privilege': ['VIEW_ADVERTISER', 'VIEW_ADSERVER', 'VIEW_WEBANALYTICS', 'VIEW_PERFORMANCE'], //privilege_ids (which privileges has authrization to access this page)
      'class': "data-trend",
      "sub_pages": ''
    },
    {
      'id': 1003,
      'title': 'Data Grid',
      'url': '/sellside/datagrid',
      'show_in_menu': true,
      'privilege': 'ANALYSIS_HOME', //privilege_ids (which privileges has authrization to access this page)
      'class': 'data-grid',
      'sub_pages': "",
    },
  ],
  'klay_media': [
    {
      'id': 1001,
      'title': 'Home',
      'url': '/klay_media',
      'show_in_menu': true,
      'privilege': 'SIGHT_HOME',
      'sub_pages': '',
      'class': 'home'
    },
    {
      'id': 1002,
      'title': 'Trend Master',
      'url': '/klay_media/datatrend/everflow', // Trend Master has child - home, reportview
      'show_in_menu': true,
      'privilege': 'TREND_MASTER', //privilege_ids (which privileges has authrization to access this page)
      'class': "data-trend",
      "sub_pages": ''
    },
    {
      'id': 1003,
      'title': 'Data Grid',
      'url': '/klay_media/datagrid',
      'show_in_menu': true,
      'privilege': 'KLAY_MEDIA', //privilege_ids (which privileges has authrization to access this page)
      'class': 'data-grid',
      'sub_pages': "",
    }
  ]
};
