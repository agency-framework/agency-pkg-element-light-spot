"use strict";

var Controller = require('agency-pkg-base/Controller');
var DomModel = require('agency-pkg-base/DomModel');


global.navigator.getUserMedia = global.navigator.getUserMedia ||
    global.navigator.mozGetUserMedia ||
    global.navigator.webkitGetUserMedia;

module.exports = Controller.extend({

    modelConstructor: DomModel.extend({
        session: {
            value: {
                type: 'number',
                required: true,
                default: function() {
                    return 0;
                }
            }
        }
    }),

    bindings: {
        'model.value': {
            type: function(el, value) {
                el.innerHTML = parseInt(value * 100) + '%';
            },
            hook: 'debugValue'
        }
    },

    events: {},


    initialize: function() {
        Controller.prototype.initialize.apply(this, arguments);
    }
});

/*
 * Events
 */
