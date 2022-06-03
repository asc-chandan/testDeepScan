# DataGrid Component 

## Available Scripts
In the directory, we have:
#### DataGrid.js - To list all saved datagrid analysis with search and filters
#### DataGridHomeTable.js - To render home page saved datagrid as table 
#### AnalysisView.js - To show new and saved analysis with all the options

<br />

## AnalysisView.js Overview
### Main Elements under this component
1. Analysis Table
2. Console Panel - tabs + other options
- Analysis level settings - Data/Format tabs
- Insight - Add/Edit notes on chart
- Share - Share with Org and member
- Analysis Settings - popup
- FullScreen

### Libraries
1. Moment - for time formatting
2. React Quill - for notes WYSIWYG editor
3. SpeedSelect - our custom select component
4. ClickOutsideListener - to handle outside element click
5. CalendarPanelInDataGrid
6. ReactDivTable - to render table
7. AscDnD - custom DnD component to drag and drop of settings elements
8. ReorderableList - for reordering list
9. Few other usual components


### On load API flow
1. informServerForTabOpen - To save the current open tab id in database to retain it opened
2. getTerminalDataSources - To get all data sources and in API response, we call the following API:
- setAllItemsAndItemsOfRowsColsValuesFilters
- getAnalysisID - for getting analysis id, which we pass under getAnalysisData API call
    * getAnalysisData - for getting analysis data based on selected settings
- getDimensionsForViewType - To get all dimensions of selected view_type - getting called after 2sec of all above apis call