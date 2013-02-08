/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */

define([
        'Sage/Services/ActivityService',
        'Training/ActivityEditor',
        'dojo/_base/declare'
],

function (
    ActivityService,
    ActivityEditor,
    declare
) {
//so here we are loading our own service which just got a reference to our own editor above.
    var trainingActivityService = declare('Training.ActivityService', [ActivityService], {
        activityEditorType: ActivityEditor,
        constructor: function () {
            //Override the activityEditor Type to the custom Activity Editor
            this.activityEditorType = ActivityEditor;
        }
    }); // end dojo declare
    // Replace the existing Activity Service with the Training Activity Service.
    if (!Sage.Services.hasService('ActivityService')) {
        Sage.Services.addService('ActivityService', new trainingActivityService());

    } else {
        var actSvc = Sage.Services.getService('ActivityService');
        if (actSvc.declaredClass !== 'Training.ActivityService') {
            Sage.Services.removeService('ActivityService');
            Sage.Services.addService('ActivityService', new trainingActivityService());
        }
    }
    return trainingActivityService;
})
