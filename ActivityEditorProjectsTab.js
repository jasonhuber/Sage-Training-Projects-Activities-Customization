/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define('Training/ActivityEditorProjectsTab', [
        'dojo',
        'dijit/_Widget',
        'Sage/_Templated',
        'dojo/_base/declare',
        'Sage/Data/SDataServiceRegistry',
        'Sage/Utility',
        'Sage/UI/SLXPreviewGrid',
        'Sage/UI/EditableGrid',
        'dojo/_base/lang',
		'dojo/date',
		'dojo/date/locale',
		'dojo/string'
    ],
    function (dojo, _Widget, _Templated, declare, sDataServiceRegistry, utility, SlxPreviewGrid, EditableGrid, lang,dojoDate, locale, dString) {
        //The code to add it is below the declaration.
        var agendaItemsTab = declare('Training.ActivityEditorProjectsTab', [_Widget, _Templated], {
            actEditor: null,
            widgetsInTemplate: true,
            
            widgetTemplate: new Simplate([
                '<div>',
                    '<div id="{%= $.id %}_projectPlaceholder" dojoAttachPoint="_projectPlaceholder" class="tabContent" >',
						'<div dojoAttachPoint="lbl_ProjectDetails"></div>',
					'</div>',
					'<div id="{%= $.id %}_projectGridPlaceholder" dojoAttachPoint="_projectGridPlaceholder" style="width:100%;height:100%"></div>',
                '</div>'
            ]),
			
			startup: function () {
               
            //anything we need to do to get the tab going. There is no data yet, so you can set defaults on a grid for instance.
               //newitems is where we place items we want to add. We then watch for the save event of the activity and send these up via SData.
			   //in _activitySaved
			   this._newItems = [];
                //this.actEditor = //dijit.byId('activityEditor');
                //if we cannot find the editor, we really cannot do much, don't create the grid
                if (!this.actEditor) {
                    return;
                }
				//just a method to build the grid and its parameters
                this._buildGrid();
                //when the dialog is hidden, we should clean up the data store and list of new items
                dojo.connect(this.actEditor, 'hide', this, this._dialogHide);
				
                //listen for when activities are saved so we can ensure the correct relationships and save the project's contacts.
                dojo.subscribe('/entity/activity/create', this, this._activitySaved);
                dojo.subscribe('/entity/activity/change', this, this._activitySaved);
            },
			//buildGrid actually sets up the SlxPreviewGrid and places it into our placeholder dive defined above: _ProjectGridPlaceholder
			  _buildGrid: function () {
                //define the tools: an "add" button that calls our custom addItem and use the default "delete" functionality.
                var tools = [
                    {
						//this just makes an add button. The edit should be inline.
                        id: 'addProjectItm',
                        imageClass: 'icon_plus_16x16',
                        handler: this.addItem,
                        tooltip: 'Add Project Contact',
                        scope: this
                    },
                    'delete'
                ];
                //define the columns:
                var columns = [
                    {
                        field: 'Contact.FullName',
                        name: 'FullName',
						label: 'Full Name',
                        width: '60px',
                        editable: false //we cannot make this editable since it is really a field in another table
                    }, {
                        field: 'Role',
                        name: 'Role',
                        width: '60px',
                        editable: true //this is editable.
                    }
                ];
                //set up the rest of the grid options:
                var options = {
                    columns: columns,
                    tools: tools,
                    storeOptions: {
                        service: sDataServiceRegistry.getSDataService('dynamic'),
                        resourceKind: 'clientprojectcontacts',
                        select: ['Contact.FullName', 'Role'], //what fields do we need from our table and relationship?
						include: ['ClientProject.Activities'],
                        sort: [{ attribute: 'ClientProject.StartDate'}] //Can we sort by a related table?
                    },
                    slxContext: { 'workspace': '', tabId: '' },
                    contextualCondition: function () {
						//not sure if I can get to the activities properties here or how.
                        return 'ClientProject.Activities.Id eq \'' + utility.getCurrentEntityId() + '\'';
                    },
                    id: this.id + '_projectItems',
                    rowsPerPage: 40,
                    singleClickEdit: true
                };
                //setting it to insert mode will have it use the writableStore.  This prevents the new
                // items from being posted to the server without the relationship to Activity.  When the
                // activity is saved, we will add the relationship and save the items at that point.
                var actid = utility.getCurrentEntityId();
                if (!actid) {
                    options.storeOptions['isInsertMode'] = true;
                }
                //create the grid
                var grid = new SlxPreviewGrid.Grid(options, this._projectGridPlaceholder);

                grid.setSortColumn('Role');
                this._grid = grid._grid;

                //...and start it up
                grid.startup();

            },
			_tabShow : function()
			{
				//in here we have this.actEditor
				//That means we also have this.actEditor._activityData !
				var req = new Sage.SData.Client.SDataSingleResourceRequest(sDataServiceRegistry.getSDataService('dynamic'));
                var text = "";
				req.setResourceKind('clientprojects');
                req.setResourceSelector('"' + this.actEditor._activityData.ClientProjectId + '"');
                //req.setQueryArgs("select","Title, Description, StartDate, EndDate, Account/AccountName");
				
				req.read({
                    success: function (project) {
                        //debugger;
						text = "Project Title: " + project.Title + "<br />Description: " + project.Description + "<br />Start: " + project.StartDate + "<br />End: " + project.EndDate;
						
						dojo.html.set(this.lbl_ProjectDetails,text);
                    },
                    scope: this
                });
			
				if (this._grid) {

                    //check to see if the activity is a new one or not so we can set the grid
                    // to be in the correct "mode".
                    var gridmode = this._grid.get('mode');
                    var actid = utility.getCurrentEntityId();
                    if ((!actid && gridmode !== 'insert') || (actid && gridmode === 'insert')) {
                        this._grid.set('mode', (!actid) ? 'insert' : '');
                    }
					
                    this._grid.refresh();
                }			
			}
        });
		
        return agendaItemsTab;
    });
