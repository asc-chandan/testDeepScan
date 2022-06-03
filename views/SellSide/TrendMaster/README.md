# TrendMaster Component 

## Available Scripts
In the directory, we have:
#### DashboardTabs.js - To Manage Tabs on home and report view
#### TrendMaster.js - To list all dashbaord with search and filters
#### TrendMasterHomeTable.js - Component used to render home page table
#### ReportView.js - to show dashboard chart with all options  

<br />

## ReportView.js Overview
### Main Elements under this component
1. Chart
2. Console Panel - tabs + other options
- Index - list of charts under a dashboard
-  Plotter - Add/Edit chart
-  Insight - Add/Edit notes on chart
- Share - Share with Org and member
- Dashboard Settings - popup
- FullScreen

### Libraries
1. D3 js - for chart
2. Moment - for time formatting
3. React Quill - for notes WYSIWYG editor
4. SpeedSelect - our custom select component
5. ClickOutsideListener - to handle outside element click
6. MultiPeriodPickerPanel - custom date picker component


### On load API flow
1. get_data_sources - On API response, we call the following API:
- If existing dashboard - open_dashboard_tab
- getAllDimensions - On API response, we call the following API:
    * getDashboardInsightNotes - note?type=dashboard 
    * getSharedUsersList - share api

- get_chart_data - On API response, we call the following API:
    * fetchChartBandData - get_bands api

### APIs used under this component
1. get_data_sources -  fetch list of all data sources with privileges to show data sources/dimensions/metrics list under plotter tab for add/edit chart. 
- URL Params - terminal type e.g. sellside
- Request method - GET

2. open_dashboard_tab - get list of charts under 
- URL Params - dashboard_id e.g. 318 
- Request method - PUT

3. note - get notes list for chart or dashboard specific
- Params - type e.g. chart
- Request method - GET

4. getAllDimensions - get all dimensions list, individual request for each dimension e.g. property, advertiser, ad_unit etc
- Params - client_id, view_type, dimension, dimension_filter
- Request method - POST

5. get_chart_list - used for copy chart functionality - need to discuss with Nitin
- Params - Terminal type e.g. sell side
- Request method - GET

6. get_analyze_metadata - to get band settings - need to discuss with Nitin
- Params - Terminal type e.g. sell side
- Request method - GET

7. get_chart_data - to get individual chart data to draw the chart
- Params - client_id, date_range, filters, method, metric, segmentation, terminal, view_type
- Request method - POST

8. get_bands - to get the chart’s band data
- Params - client_id, terminal, segmentation, view_type, daterange, metric, x_axis, band_params {band_type, periods }
- Request method - POST

9. edit_chart - to save the edited changes under chart
- URL Params - chart_id
- Payload -  new_chart_settings object (it contains name, description, x, y, chart_type, source, filters, segment etc)
- Request method - PUT

10. add_chart - to add new chart to dashboard 
- URL Params - dashboard_id
- Payload -  new_chart_settings object (it contains name, description, x, y, chart_type, source, filters, segment etc)
- Request method - POST

11. copy_chart - to copy chart from dashbaord
- Payload - chart_id, dashbaord_id
- Request method - PUT

12. delete_chart - to remove chart from dashboard
- URL params - dashboard_id/chart_id
- Request method - POST

13. save_dashboard - to save dashboard settings like name, description, data settings (period, filters), charts plotting parameters
- Payload: terminal, dashboard_name, dashboard_description, dynamic_time_period, filters, is_default, dashboard_config, dashboard_other_settings
- Request method - POST

14. edit_dashboard - to edit dashboard settings
- URL params - dashboard_id
- Payload - specific payload related to edit
- Request method - PUT

15. share  - to share dashboard with any org or user - three functionalities - add/edit/delete
- URL params - dashboard_id
- Request method - GET

16. getOrganizationsList - to get list of all organizations which user have access
- Request method - GET

17. getUsers - to get users list by organization id
- URL params - org_id
- Request method - GET
