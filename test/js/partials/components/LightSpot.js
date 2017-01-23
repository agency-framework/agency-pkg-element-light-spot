"use strict";

var Controller = require('agency-pkg-base/Controller');
var DomModel = require('agency-pkg-base/DomModel');

var viewport = require('agency-pkg-service-viewport');
var history = require('agency-pkg-service-history');

var screenfull = require('screenfull');

global.navigator.getUserMedia = global.navigator.getUserMedia ||
    global.navigator.mozGetUserMedia ||
    global.navigator.webkitGetUserMedia;

module.exports = Controller.extend({

    modelConstructor: DomModel.extend({
        session: {

            spot: {
                type: 'DomModel',
                required: false
            },

            value: {
                type: 'number',
                required: true,
                default: function() {
                    return 0;
                }
            },
            controls: {
                type: 'boolean',
                required: true,
                default: function() {
                    return false;
                }
            },
            hideWarning: {
                type: 'boolean',
                required: true,
                default: function() {
                    return false;
                }
            },
            hideUnsuitableDevice: {
                type: 'boolean',
                required: true,
                default: function() {
                    return true;
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
        },
        'model.controls': {
            type: 'booleanClass',
            name: 'js-controls'
        },
        'model.hideWarning': {
            type: 'booleanClass',
            name: 'js-hide-warning'
        },
        'model.hideUnsuitableDevice': {
            type: 'booleanClass',
            name: 'js-hide-unsuitable-device',
            invert: true
        }
    },
    events: {
        'click [data-hook="applyButton"]': onClickApply
    },


    initialize: function() {
        Controller.prototype.initialize.apply(this, arguments);

        viewport.on(viewport.EVENT_TYPES.RESIZE, function() {
            this.model.spot.refresh();
        }.bind(this));

        document.addEventListener(screenfull.raw.fullscreenchange, function() {
            global.animationFrame.addOnce(function() {
                this.model.spot.refresh();
                if (screenfull.isFullscreen) {
                    this.model.hideWarning = true;
                }
            }.bind(this));
        }.bind(this), false);

        history.register('controls', function(value) {
            if (value && value.toLowerCase() !== 'false') {
                this.model.controls = true;
            }
        }.bind(this));
        
        if (/iphone/.test(navigator.userAgent.toLowerCase())) {
            this.model.hideUnsuitableDevice = false;
        }

    }
});

/*
 * Events
 */

function onClickApply() {

    // force video play
    this.el.querySelector('video').play();
    if (screenfull.enabled) {
        screenfull.request(document.body);
    } else {
        this.model.hideWarning = true;

    }
}
