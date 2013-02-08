/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define('Training/ActivityEditor', [
    'dojo/_base/declare',
    'Sage/UI/Controls/Lookup',
    'dijit/form/TextBox',
    'dijit/layout/ContentPane',
    'Sage/MainView/ActivityMgr/ActivityEditor',
	 'Training/ActivityEditorProjectsTab',
	 'dojo/on',
	'Sage/Data/SDataServiceRegistry'
],
function (declare, Lookup, TextBox, ContentPane, SageActivityEditor, ActivityEditorProjectsTab,on, sDataServiceRegistry) {
    //This customization shows the following customizations to the activity editor:
    //  -Adding a new related entity, in this case Project

    //Declare the new activity editor type, derive from the existing Activity Editor...
    var editor = declare('Training.ActivityEditor', [SageActivityEditor], {

        lup_Project: false, //new Project Lookup attach point
        container_ProjectLup: null, //new Project lookup container attach point
        constructor: function () {
            //In the chained constructor (see dojo documentation for widgets and widget lifecycle methods)
            // add the new controls to the list of controls that get enabled or disabled in certain circumstances.
            this.confirmationDisableList.push('lup_Project');
            this.noEditDisableList.push('lup_Project');
			//debugger;
			//this does not work since it is using the activities system endpoint.
			this._activityStore.include.push('ClientProject');
        },
        postCreate: function () {
            this.inherited(arguments);

            //Create new content pane control that will contian the new project luookup.
            this.container_ProjectLup = ContentPane({
                label: "Project",
                class: "remove-padding lookup-container"
            });

            //Add project lookup container to the contact container that is already defined in the activity editor
            this.contactContainer.addChild(this.container_ProjectLup);             
			/*
			Now let's work on the new tab...
			*/
			 //Create new project tab
            var projectTab = new ActivityEditorProjectsTab();
            // Create a new ContentPane with the project tab as the contents
            var cp = new ContentPane({
                id: 'projectTabPane',
                title: 'Project Details',
                'class': 'tabContent remove-padding'
            }, projectTab.domNode);

            //Add Project ContentPane to table container that is already defined in the activity editor
            this.tc_EditActivity.addChild(cp);
            projectTab.actEditor = this;
            projectTab.startup();
            on(cp, 'show', function () {
                projectTab._tabShow();
            });
			
			/*end new tab*/

        },
        destroy: function () {
            //clean up the project lookup control in the destroy method
            this.lup_Project.destroy();
            //make sure to call inherited so everything else gets destroyed.
            this.inherited(arguments);
        },
        _ensureLookupsCreated: function () {
            //Override this method to create the project lookup control when appropriate.
            // Since it is an override, be sure to call this.inherited(arguments);
            this.inherited(arguments);
            this.createProjectLookup();
        },
       
        _manualBind: function () {
            //Another override.  Follow the same pattern of binding the lookup controls from the original editor
            this.inherited(arguments);
            if (this._activityData) {
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
        }
    });
    return editor;
});