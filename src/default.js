"use strict";

var Controller = require('agency-pkg-base/Controller');
var DomModel = require('agency-pkg-base/DomModel');
var Vector = require('agency-pkg-base/Vector');
var Enum = require('enum');
var utils = require('./utils');

var history = require('agency-pkg-service-history');
var viewport = require('agency-pkg-service-viewport');


var makeVideoPlayableInline = require('iphone-inline-video');

var TYPES = new Enum(['TYPE_1', 'TYPE_2', 'TYPE_3']);

global.navigator.getUserMedia = global.navigator.getUserMedia ||
    global.navigator.mozGetUserMedia ||
    global.navigator.webkitGetUserMedia;

module.exports = Controller.extend({

    leftOffset: 0,

    modelConstructor: DomModel.extend({
        session: {
            debug: {
                type: 'boolean',
                required: true,
                default: function() {
                    return false;
                }
            },
            hasCamera: {
                type: 'boolean',
                required: true,
                default: function() {
                    return false;
                }
            },
            complete: {
                type: 'boolean',
                required: true,
                default: function() {
                    return false;
                }
            },
            index: {
                type: 'number',
                required: true,
                default: function() {
                    return -1;
                }
            },
            type: {
                type: 'enum',
                required: true,
                default: function() {
                    return TYPES.TYPE_1;
                }
            },
            sensibility: {
                type: 'number',
                required: true,
                default: function() {
                    return (245 / 255);
                }
            }
        },


        refresh: function() {
            this.trigger('refresh');
        }
    }),

    bindings: {
        'model.debug': {
            type: 'booleanClass',
            name: 'js-debug'
        },
        'model.complete': {
            type: 'booleanClass',
            name: 'js-complete'
        },
        'model.hasCamera': {
            type: 'booleanClass',
            name: 'js-has-camera'
        }
    },

    events: {},


    initialize: function() {
        Controller.prototype.initialize.apply(this, arguments);

        this.model.on('refresh', onRefresh, this);

        this.fallbackImageEl = this.queryByHook('fallbackImage');


        this.videoEl = this.queryByHook('video');

        makeVideoPlayableInline(this.videoEl);

        this.maskCanvasEl = this.queryByHook('maskCanvas');
        this.maskCanvasCtx = this.maskCanvasEl.getContext('2d');
        this.blackMaskCanvasEl = this.queryByHook('blackMaskCanvas');
        this.blackMaskCanvasCtx = this.blackMaskCanvasEl.getContext('2d');

        if (this.targetModel) {
            this.targetModel.spot = this.model;
            this.targetModel.on('change:value', function(model, value) {
                this.model.sensibility = value;
                global.animationFrame.addOnce(function() {
                    render(this);
                }.bind(this));
            }, this);
        }

        Promise.all([new Promise(function(resolve) {
            this.fallbackImageEl.addEventListener('load', function() {
                resolve();
            }.bind(this), false);
            this.fallbackImageEl.setAttribute('src', this.fallbackImageEl.getAttribute('data-src'));
        }.bind(this)), new Promise(function(resolve) {
            utils.generateLightSpot(this).then(function(lightSpotEl) {
                this.lightSpotEl = lightSpotEl;
                resolve();
            }.bind(this));
        }.bind(this))]).then(function() {
            Promise.all([setupCamera(this)]).then(function() {
                this.model.refresh();
                this.model.complete = true;
                (this.model.hasCamera ? global.animationFrame.add : global.animationFrame.addOnce)(function() {
                    render(this);
                }.bind(this));
            }.bind(this));

        }.bind(this));

        history.register('debug', function(value) {
            if (value && value.toLowerCase() !== 'false') {
                this.model.debug = true;
            }
        }.bind(this));
    }
});

function onRefresh() {
    generateAssets(this);
    prepareCanvas(this, this.maskCanvasEl);
    global.animationFrame.addOnce(function() {
        render(this);
    }.bind(this));
}

function render(scope) {
    preRender(scope);
    scope.blackMaskCanvasCtx.globalCompositeOperation = 'source-over';
    scope.blackMaskCanvasCtx.drawImage(blackCanvasEl, 0, 0, scope.fallbackImageEl.width, scope.fallbackImageEl.height);
    scope.blackMaskCanvasCtx.globalCompositeOperation = 'destination-out';

    scope.blackMaskCanvasCtx.save();
    scope.blackMaskCanvasCtx.translate(scope.blackMaskCanvasEl.width, 0);
    scope.blackMaskCanvasCtx.scale(-1, 1);

    scope.blackMaskCanvasCtx.drawImage(scope.maskCanvasEl, scope.leftOffset, 0, scope.blackMaskCanvasEl.width, scope.blackMaskCanvasEl.height);

    scope.blackMaskCanvasCtx.restore();
}

function setupCamera(scope) {
    return new Promise(function(resolve) {

        // Get access to the camera!
        if (global.navigator.getUserMedia) {
            // Not adding `{ audio: true }` since we only want video now
            global.navigator.getUserMedia({
                video: true
            }, function(stream) {
                scope.videoEl.src = window.URL.createObjectURL(stream);
                scope.model.hasCamera = true;
                resolve();
            }, function() {
                resolve();
            });
        } else {
            resolve();
        }
    });
}

var whiteCanvasEl, whiteCanvasCtx, blackCanvasEl, blackCanvasCtx;

function prepareCanvas(scope, canvas) {
    canvas.width = 128;
    canvas.height = (canvas.width / scope.fallbackImageEl.width) * scope.fallbackImageEl.height;
    // ctx.imageSmoothingEnabled = true;
    // ctx.mozImageSmoothingEnabled = true;
    // ctx.webkitImageSmoothingEnabled = true;
    // ctx.msImageSmoothingEnabled = true;
}

function preRender(scope) {

    var position = new Vector((scope.maskCanvasEl.width / 2) - scope.lightSpotEl.width / 16 + 25, (scope.maskCanvasEl.height / 2) - scope.lightSpotEl.height / 16);

    switch (scope.model.type) {
        case TYPES.TYPE_1:

            if (scope.model.hasCamera) {
                scope.maskCanvasCtx.drawImage(scope.videoEl, 0, 0, scope.maskCanvasEl.width, scope.maskCanvasEl.height);
                utils.grayscale(scope.maskCanvasEl, scope.maskCanvasCtx, scope.model.sensibility);
                utils.resize(scope.maskCanvasEl, scope.maskCanvasCtx);

            } else {


                // START CREATE MASK
                scope.maskCanvasCtx.globalCompositeOperation = 'source-over';

                scope.maskCanvasCtx.drawImage(scope.fallbackImageEl, scope.leftOffset, 0, scope.fallbackImageEl.width, scope.fallbackImageEl.height);


                scope.maskCanvasCtx.globalCompositeOperation = 'lighter';

                scope.maskCanvasCtx.drawImage(scope.lightSpotEl, position.x, position.y, scope.lightSpotEl.width / 8, scope.lightSpotEl.height / 8);



                // scope.reflectCanvasCtx.scale(1,1);
                //                 scope.reflectCanvasCtx.drawImage(scope.maskCanvasEl,0,0,scope.maskCanvasEl.width, scope.maskCanvasEl.height);
                // scope.maskCanvasCtx.drawImage(scope.reflectCanvasEl,0,0,scope.reflectCanvasEl.width, scope.reflectCanvasEl.height);




                utils.grayscale(scope.maskCanvasEl, scope.maskCanvasCtx, scope.model.sensibility);
                utils.resize(scope.maskCanvasEl, scope.maskCanvasCtx);

                // END CREATE MASK
                //
            }


            break;



    }
}



function generateAssets(scope) {
    console.log('generateAssets');

    var image = scope.fallbackImageEl;

    whiteCanvasEl = document.createElement('canvas');
    whiteCanvasCtx = whiteCanvasEl.getContext('2d');
    whiteCanvasEl.width = image.width;
    whiteCanvasEl.height = image.height;

    whiteCanvasCtx.rect(0, 0, image.width, image.height);
    whiteCanvasCtx.fillStyle = 'rgba(255,255,255,' + 1 + ')';
    whiteCanvasCtx.fill();

    blackCanvasEl = document.createElement('canvas');
    blackCanvasCtx = blackCanvasEl.getContext('2d');
    blackCanvasEl.width = image.width;
    blackCanvasEl.height = image.height;

    blackCanvasCtx.rect(0, 0, image.width, image.height);
    blackCanvasCtx.fillStyle = 'rgba(0,0,0,' + 1 + ')';
    blackCanvasCtx.fill();

    scope.leftOffset = (scope.fallbackImageEl.naturalWidth * scope.fallbackImageEl.height / scope.fallbackImageEl.naturalHeight);
    console.log('left 1', scope.leftOffset);
    scope.leftOffset = (viewport.dimension.x - scope.leftOffset) / 2;
    console.log('left 2', scope.leftOffset);

    scope.blackMaskCanvasEl.style.cssText = 'left: ' + scope.leftOffset + 'px;';
    image.style.cssText = 'left: ' + scope.leftOffset + 'px;';
    scope.blackMaskCanvasEl.width = (scope.fallbackImageEl.naturalWidth * scope.fallbackImageEl.height / scope.fallbackImageEl.naturalHeight);
    scope.blackMaskCanvasEl.height = (scope.fallbackImageEl.naturalHeight * scope.fallbackImageEl.height / scope.fallbackImageEl.naturalHeight);
    // scope.blackMaskCanvasEl.width = viewport.dimension.x;
    // scope.blackMaskCanvasEl.height = viewport.dimension.y;

    scope.blackMaskCanvasCtx.rect(0, 0, scope.blackMaskCanvasEl.width, scope.blackMaskCanvasEl.height);
    scope.blackMaskCanvasCtx.fillStyle = '#000';
    scope.blackMaskCanvasCtx.fill();


    scope.reflectCanvasEl = document.createElement('canvas');
    scope.reflectCanvasCtx = scope.reflectCanvasEl.getContext('2d');

    scope.reflectCanvasEl.width = scope.maskCanvasEl.width;
    scope.reflectCanvasEl.height = scope.maskCanvasEl.height;

}
