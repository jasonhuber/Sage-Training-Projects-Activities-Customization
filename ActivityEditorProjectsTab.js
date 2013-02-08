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
                    '<div id="{%= $.id %}_projectPlaceholder" dojoAttachPoint="_projectPlaceholder" class="tabContent" ><div dojoAttachPoint="lbl_ProjectDetails"></div></div>',
                '</div>'
            ]),
			
			startup: function () {
               
            //anything we need to do to get the tab going. There is no data yet, so you can set defaults on a grid for instance.
              
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
			}
        });
		
        return agendaItemsTab;
    });
