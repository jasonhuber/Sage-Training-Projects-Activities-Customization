﻿/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define('Training/ActivityEditor', [
    'dojo/_base/declare',
    'Sage/UI/Controls/Lookup',
    'dijit/form/TextBox',
    'dijit/layout/ContentPane',
    'Sage/MainView/ActivityMgr/ActivityEditor',
    'Training/ActivityEditorProjectsTab',
    'dojo/on',
    'Sage/Data/SDataServiceRegistry',
    'dijit/form/CheckBox'
],
    function (declare, Lookup, TextBox, ContentPane, SageActivityEditor, ActivityEditorProjectsTab, on, sDataServiceRegistry, CheckBox) {
    //This customization shows the following customizations to the activity editor:
    //  -Adding a new related entity, in this case Project

    //Declare the new activity editor type, derive from the existing Activity Editor...
    var editor = declare('Training.ActivityEditor', [SageActivityEditor], {

        lup_Project: false, //new Project Lookup attach point
        container_ProjectLup: null, //new Project lookup container attach point
        
        cb_Project: false, //new Project Checkbox attach point
        container_ProjectCb: null, // new Poject checkbox attach point
        
		projectTab : null, //project tab global
		tab_cp: null, //the new tab contentpane global. 
		projectTabAdded: false, //keep track if we have the project tab added or not.
		
        constructor: function () {
            //In the chained constructor (see dojo documentation for widgets and widget lifecycle methods)
            // add the new controls to the list of controls that get enabled or disabled in certain circumstances.
            this.confirmationDisableList.push('lup_Project');
            this.confirmationDisableList.push('cb_Project');
            
            this.noEditDisableList.push('lup_Project');
            this.noEditDisableList.push('cb_Project');
            //debugger;
            //vvvvthis does not work since it is using the activities system endpoint.
            this._activityStore.include.push('ClientProject');
        },
        postCreate: function () {
            this.inherited(arguments);

            //Create new content pane control that will contain the new project lookup.
            this.container_ProjectLup = ContentPane({
                label: "Project",
                class: "remove-padding lookup-container"
            });

            this.container_ProjectCb = ContentPane({
                label: "", //no label for checkboxes. The label is added afterwards in the checkbox create.
                class: "remove-padding checkbox-container"
            })
            //debugger;
            //Add project lookup container to the contact container that is already defined in the activity editor
            //this.contactContainer.addChild(this.container_ProjectLup);      
            this.dateSection_AddEdit.addChild(this.container_ProjectLup);      
			this.dateSection_AddEdit.addChild(this.container_ProjectCb);
			
			/*perhaps here we can see if the checkbox should be enabled or not...
			
			
			*/
			
            /*
            Now let's work on the new tab...
            */
             //Create new project tab
            projectTab = new ActivityEditorProjectsTab();
            // Create a new ContentPane with the project tab as the contents
            tab_cp = new ContentPane({
                id: 'projectTabPane',
                title: 'Project Details',
                'class': 'tabContent remove-padding'
            }, projectTab.domNode);

            //Add Project ContentPane to table container that is already defined in the activity editor
            this.tc_EditActivity.addChild(tab_cp);
			projectTabAdded = true;
            projectTab.actEditor = this;
            projectTab.startup();
            on(tab_cp, 'show', function () {
                projectTab._tabShow();
            });
            
            /*end new tab*/

        },
        destroy: function () {
            //clean up the project lookup control in the destroy method
            this.lup_Project.destroy();
            this.cb_Project.destroy();
            //make sure to call inherited so everything else gets destroyed.
            this.inherited(arguments);
        },
        _ensureLookupsCreated: function () {
            //Override this method to create the project lookup control when appropriate.
            // Since it is an override, be sure to call this.inherited(arguments);
            this.inherited(arguments);
            this.createProjectLookup();
            this.createProjectCheckbox();
        },
       
        _manualBind: function () {
            //Another override.  Follow the same pattern of binding the lookup controls from the original editor
            this.inherited(arguments);
            if (this._activityData.ClientProjectId) {
                var act = this._activityData;
                //debugger;
                var req = new Sage.SData.Client.SDataSingleResourceRequest(sDataServiceRegistry.getSDataService('dynamic'));
                var text = "";
                req.setResourceKind('clientprojects');
                req.setResourceSelector('"' + act.ClientProjectId + '"');
                req.read({
                    success: function (project) {
                    //debugger;
                        var mockProject = {
                            '$key': project.$key,
                            '$descriptor': project.Title 
                        };
                        this.lup_Project.set('selectedObject', mockProject);
                    },
                    scope: this
                });
				this.cb_Project.set('checked', true);
			}
			else
			{
				var mockProject = {
					'$key': '',
					'$descriptor': '' 
				};
				this.lup_Project.set('selectedObject', mockProject);
				this.tc_EditActivity.removeChild(tab_cp);
				projectTabAdded = false;
				this.cb_Project.set('checked', false);
				
		
			}				
        },
        _projectChanged: function (newProject) {
            //This is not an override - it is the handler for the change event of the project lookup control.
            //This is necessary because we are manually binding that control because of the psuedo relationships
            // the activity entity has with other entities.
            this._activityData.ClientProjectId = (newProject) ? newProject['$key'] : '';
        },
        _updateLookupSeedValues: function (accountId) {
            this.inherited(arguments);
            this.projectLookupConfig.seedValue = accountId;
        },
        createProjectLookup: function () {
            //Create the poject lookup control
            this.projectLookupConfig = {
                id: '_activityProject',
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
                            name: 'Title',
                            field: 'Title'
                        }, {
                            name: 'Start Date',
                            field: 'StartDate',
                            propertyType: 'System.DateTime'
                        }, {
                            name: 'End Date',
                            field: 'EndDate',
                            propertyType: 'System.DateTime'
                        }
                    ]
                    }],
                gridOptions: {
                    contextualCondition: '',
                    contextualShow: '',
                    selectionMode: 'single'
                },
                storeOptions: {
                    resourceKind: 'clientprojects',
                    sort: [{ attribute: 'Title'}]
                },
                isModal: true,
                seedProperty: 'Account.Id',
                seedValue: '',
                overrideSeedValueOnSearch: true,
                initialLookup: true,
                preFilters: [],
                dialogTitle: 'Lookup Project',
                dialogButtonText: this.okText
            };
            this.lup_Project = new Lookup({
                id: 'lu_Project',
                allowClearingResult: true,
                readonly: true,
                showEntityInfoToolTip: false,
                config: this.projectLookupConfig
            });
            //add the change event handler
            this.eventConnections.push(dojo.connect(this.lup_Project, 'onChange', this, '_projectChanged'));
            //place this lookup control in the spot reserved for it in the new template.
            dojo.place(this.lup_Project.domNode, this.container_ProjectLup.domNode, 'only');

            //this would be a good place to add event listeners for when other lookups change to add/change
            // prefilters, etc like what is done for the opportunity, ticket and contact lookups.
        },
        createProjectCheckbox: function()
        {
			var label = null;
				
            this.cb_Project = new CheckBox({
                        id: this.id + '_checkBox',
                        name: 'cb_Project',
                        value: 'Uses Projects: '//,
                        //checked: true
                    }),
                    label;
                
				
                this.cb_Project.startup();
             dojo.place(this.cb_Project.domNode, this.container_ProjectCb.domNode, 'only');
			 
				
           label = dojo.create(
                    'label',
                    {
                      'for': this.cb_Project.id
                    },
                    this.cb_Project.domNode,
                    'after');

                label.innerHTML = "Uses Projects";
				

            dojo.create('br', {}, label, 'after');    
			
			//let's make a fucntion to call when the checkbox is changed. We might be able to hide and show the tab.
            this.eventConnections.push(dojo.connect(this.cb_Project, 'onChange', this, '_cb_ProjectChecked'));

        },
		//this is the event that fires when the checkbox is checked or unchecked. It hids the projects tab.
		//this will be diabled IF there is a clientprojectid on the activity (because then the activity definitely uses projects)
		_cb_ProjectChecked: function()
		{
			//debugger;
			//dijit.byId("projectTabPane").hide();
			if(!this.cb_Project.checked && projectTabAdded)
			{
				this.tc_EditActivity.removeChild(tab_cp);
				projectTabAdded = false;
				//this.contactContainer.removeChild(this.container_ProjectLup);
			}
			else if (!projectTabAdded)
			{
				//I think this actually throws an error if the tab is there already, but it is hanled ok bu dojo.
				projectTabAdded = true;
				this.tc_EditActivity.addChild(tab_cp);
				
				//this.contactContainer.addChild(this.container_ProjectLup);
			}
			
        
		},
		destroy: function () {
			lup_Project.destroy();
			cb_Project.destroy();
            this.inherited(arguments);
        },
    });
    return editor;
});