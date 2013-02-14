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
		'dojo/string',
		'Sage/UI/Controls/Lookup'
    ],
    function (dojo, _Widget, _Templated, declare, sDataServiceRegistry, utility, SlxPreviewGrid, EditableGrid, lang,dojoDate, locale, dString, Lookup) {
        //The code to add it is below the declaration.
        var agendaItemsTab = declare('Training.ActivityEditorProjectsTab', [_Widget, _Templated], {
            actEditor: null,
            widgetsInTemplate: true,
            lu_Contact: null,
            widgetTemplate: new Simplate([
                '<div>',
                    '<div id="{%= $.id %}_projectPlaceholder" dojoAttachPoint="_projectPlaceholder" class="tabContent" >',
						'<div dojoAttachPoint="lbl_ProjectDetails"></div>',
					'</div>',
					'<div id="{%= $.id %}_projectGridPlaceholder" dojoAttachPoint="_projectGridPlaceholder" style="width:100%;height:70%"></div>',
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
				
				//now let's make sure the lookup for contact is created and ready.
				this.createContactLookup();
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
                    {
                        id: 'associationLookupAddItem',
                        imageClass: 'icon_plus_16x16',
                        handler: this.lookupContact,
                        tooltip: 'Add SalesLogix Contact',
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
			},
			   //our handler for the "add" button
            addItem: function () {
                //If we are not in insert mode, we should save existing changes before creating new items.
                //This prevents loss of data.  After the data is saved, we can create the new item.
                if (this._grid.mode !== 'insert') {
                    this._grid.saveChanges(lang.hitch(this, this._doCreateItem));
                } else {
                    this._doCreateItem();
                }
            },
            _doCreateItem: function () {
                  this._grid.store.newItem({
                    onComplete: function (clientprojectcontactItem) {
                        //After the datastore has created the item for us, we can set the relationship property
                        clientprojectcontactItem.ClientProjectId = this.actEditor._activityData.ClientProjectId;
						//Add it to our list of new agenda items
                        this._newItems.push(clientprojectcontactItem);
                        if (this._grid.mode === 'insert') {
                            //if we are inserting the ClientProjectContact, just let the WritableStore cache it, we'll POST it later
                            this._grid.store.addToCache(this, clientprojectcontactItem, 1);
                        } else {
                            //if we are not in insert mode, the grid will have a WritableSDataStore, let it save the 
                            //new item now so the refresh below will get the item.
                            this._grid.store.saveNewEntity(clientprojectcontactItem);
                        }
                        //refresh the list so we see the new item.
                        this._grid.refresh();
                    },
                    scope: this
                });
            },
            //Handler for when activities are saved (new or changed)
            _activitySaved: function (clientprojectcontact) {
                if (this._grid.mode === 'insert') {
                    //If the grid is in insert mode, the activity was a new one so we need to set the 
                    // relationship to the new Activity Id and then POST them
                    for (var i = 0; i < this._newItems.length; i++) {
                        var itm = this._newItems[i];
                        var req = new Sage.SData.Client.SDataSingleResourceRequest(sDataServiceRegistry.getSDataService('dynamic'))
                            .setResourceKind('clientprojectcontacts')
                            .create(itm, {
                                success: function () {
                                    console.log('saved item');
                                },
                                failure: function () {
                                    console.log('item did not save');
                                }
                            });
                    }
                } else {
                    //Because the grid was not in insert mode, the items had the correct relationship
                    // we just need to PUT and data changes that happened.
                    this._grid.saveChanges();
                }
            },
			//Handler for when the activity dialog closes
            _dialogHide: function () {
                //just a little house cleaning.
                this._newItems = [];
                this._grid.store.clearCache();
            },
			createContactLookup: function () {
            //Create the contacat lookup control
            this.contactLookupConfig = {
                id: '_activityProjectGridContact',
                structure: [
                    { defaultCell: {
                        'sortable': true,
                        'width': '150px',
                        'editable': false,
                        'propertyType': 'System.String',
                        'excludeFromFilters': false,
                        'useAsResult': false,
                        'picklistName': null,
                        'defaultValue': ''
                    },
                        cells: [
                        {
                            name: 'FullName',
                            field: 'FullName'
                        }
                    ]
                    }],
                gridOptions: {
                    contextualCondition: '',
                    contextualShow: '',
                    selectionMode: 'single'
                },
                storeOptions: {
                    resourceKind: 'contacts',
                    sort: [{ attribute: 'FullName'}]
                },
                isModal: true,
                seedProperty: 'Account.Id',
                seedValue: this.actEditor._activityData.AccountId,
                overrideSeedValueOnSearch: true,
                initialLookup: true,
                preFilters: [],
                dialogTitle: 'Lookup Project',
                dialogButtonText: this.okText
            };
            this.lu_Contact = new Lookup({
                id: 'lu_Contact',
                allowClearingResult: true,
                readonly: true,
                showEntityInfoToolTip: false,
                config: this.contactLookupConfig
            });
            //add the change event handler
			dojo.connect(this.lu_Contact, 'onChange', this, '_lookupContactResult');
            
        },
		lookupContact: function () {
            this.lu_Contact.lookupButton.click();
        },
		_lookupContactResult: function (contact) {
                this._addContactAssociation(contact);
        },
		_addContactAssociation: function (contact) {
            this._grid.store.newItem({
                    onComplete: function (clientprojectcontact) {
                        //After the datastore has created the item for us, we can set the relationship property
                        clientprojectcontact.ClientProjectId = this.actEditor._activityData.ClientProjectId;
                        clientprojectcontact.ContactId = contact.$key;
                        this._addAssociationToStore(clientprojectcontact);
                       
                    },
                    scope: this
                });
            },
            _addAssociationToStore: function (clientprojectcontact) {

                this._newItems.push(clientprojectcontact);
                if (this._grid.mode === 'insert') {
                    //if we are inserting the activity, just let the WritableStore cache it, we'll POST it later
                    this._grid.store.addToCache(this, clientprojectcontact, 1);
                } else {
                    //if we are not in insert mode, the grid will have a WritableSDataStore, let it save the 
                    //new item now so the refresh below will get the item.
                    this._grid.store.saveNewEntity(clientprojectcontact);
                }
                //refresh the list so we see the new item.
                this._grid.refresh();
            },
        });
        return agendaItemsTab;
    });
