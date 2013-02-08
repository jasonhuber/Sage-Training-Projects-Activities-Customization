/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define('Training/ActivityManager', [
    'dojo/_base/declare',
    'Sage/MainView/ActivityManager'
],
function (
    declare,
    SageActivityManager
    ) {

    //Declare the new main view provider type, derive from the existing Activity Main view...
    var mainView = declare('Training.ActivityManager', [SageActivityManager], {

        constructor: function () {
           
         
        }      

    });

    return mainView;

});