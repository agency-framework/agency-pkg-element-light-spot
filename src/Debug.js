"use strict";

var Controller = require('agency-pkg-base/Controller');
var DomModel = require('agency-pkg-base/DomModel');
var Vector = require('agency-pkg-base/Vector');
var Enum = require('enum');
var utils = require('./utils');


var TYPES = new Enum(['TYPE_1', 'TYPE_2', 'TYPE_3']);

module.exports = Controller.extend({

    modelConstructor: DomModel.extend({
        session: {
            debug: {
                type: 'boolean',
                required: true,
                default: function() {
                    return true;
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
        }
    },

    events: {},

    lightSpotEl: null,
    canvasList: null,
    contextList: null,
    initialize: function() {
        Controller.prototype.initialize.apply(this, arguments);
        this.imageEl = this.queryByHook('image');


        this.maskCanvasEl = this.queryByHook('maskCanvas');
        this.blackMaskCanvasEl = this.queryByHook('blackMaskCanvas');
        this.blackMaskCanvasCtx = this.blackMaskCanvasEl.getContext('2d');

        this.canvasList = [];
        this.contextList = [];

        this.canvasList = this.queryAllByHook('debugCanvas');

        if (this.targetModel) {
            this.targetModel.on('change:value', function(model, value) {
            this.model.sensibility = value;
                global.animationFrame.addOnce(function(){
                    render(this).then(function () {
                    });
                }.bind(this));
            }, this);
        }

        Promise.all([new Promise(function(resolve) {
            this.imageEl.addEventListener('load', function() {
                resolve();
            }.bind(this), false);
            this.imageEl.setAttribute('src', this.imageEl.getAttribute('data-src'));
        }.bind(this)), new Promise(function(resolve) {
            utils.generateLightSpot(this).then(function(lightSpotEl) {
                this.lightSpotEl = lightSpotEl;
                resolve();
            }.bind(this));
        }.bind(this))]).then(function() {

            generateAssets(this, this.imageEl).then(function() {
                this.maskCanvasCtx = prepareCanvas(this, this.maskCanvasEl);
                this.canvasList.forEach(function(canvas) {
                    this.contextList.push(prepareCanvas(this, canvas));
                }.bind(this));
                Promise.all([render(this)]).then(function() {
                    this.model.complete = true;
                }.bind(this));
            }.bind(this));
        }.bind(this));


    }
});

function prepareCanvas(scope, canvas) {
    canvas.width = 128;
    canvas.height = (canvas.width / scope.imageEl.width) * scope.imageEl.height;
    return canvas.getContext('2d');
    // ctx.imageSmoothingEnabled = true;
    // ctx.mozImageSmoothingEnabled = true;
    // ctx.webkitImageSmoothingEnabled = true;
    // ctx.msImageSmoothingEnabled = true;
}

function render(scope) {
    return new Promise(function(resolve) {

        var position = new Vector((this.canvasList[0].width / 2) - this.lightSpotEl.width / 16, (this.canvasList[0].height / 2) - this.lightSpotEl.height / 16);



        switch (this.model.type) {
            case TYPES.TYPE_1:

                // START CREATE MASK
                this.maskCanvasCtx.globalCompositeOperation = 'source-over';
                this.maskCanvasCtx.drawImage(this.imageEl, 0, 0, this.maskCanvasEl.width, this.maskCanvasEl.height);
                this.maskCanvasCtx.globalCompositeOperation = 'lighter';
                this.maskCanvasCtx.drawImage(this.lightSpotEl, position.x, position.y, this.lightSpotEl.width / 8, this.lightSpotEl.height / 8);
                utils.grayscale(this.maskCanvasEl, this.maskCanvasCtx, this.model.sensibility);
                utils.resize(this.maskCanvasEl, this.maskCanvasCtx);
                // END CREATE MASK

                // Examples

                var width = this.canvasList[0].width;
                var height = this.canvasList[0].height;

                this.contextList[0].globalCompositeOperation = 'source-over';
                this.contextList[0].drawImage(this.imageEl, 0, 0, width, height);
                this.contextList[0].globalCompositeOperation = 'lighter';
                this.contextList[0].drawImage(this.lightSpotEl, position.x, position.y, this.lightSpotEl.width / 8, this.lightSpotEl.height / 8);

                this.contextList[1].drawImage(this.canvasList[0], 0, 0, width, height);
                utils.grayscale(this.canvasList[1], this.contextList[1], this.model.sensibility);

                this.contextList[2].drawImage(this.canvasList[1], 0, 0, this.canvasList[0].width, this.canvasList[0].height);
                utils.resize(this.canvasList[2], this.contextList[2]);
                this.contextList[3].drawImage(this.imageEl, 0, 0, width, height);
                this.contextList[3].globalCompositeOperation = 'destination-in';
                this.contextList[3].drawImage(this.canvasList[2], 0, 0, this.canvasList[0].width, this.canvasList[0].height);

                this.blackMaskCanvasCtx.globalCompositeOperation = 'source-over';
                this.blackMaskCanvasCtx.drawImage(blackCanvasEl, 0, 0, this.imageEl.width, this.imageEl.height);
                this.blackMaskCanvasCtx.globalCompositeOperation = 'destination-out';
                this.blackMaskCanvasCtx.drawImage(this.maskCanvasEl, 0, 0, this.blackMaskCanvasEl.width, this.blackMaskCanvasEl.height);

                break;
        }

        resolve();
    }.bind(scope));
}


var whiteCanvasEl, whiteCanvasCtx, blackCanvasEl, blackCanvasCtx;

function generateAssets(scope, image) {
    return new Promise(function(resolve) {
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

        scope.blackMaskCanvasEl.width = image.width;
        scope.blackMaskCanvasEl.height = image.height;

        scope.blackMaskCanvasCtx.rect(0, 0, scope.blackMaskCanvasEl.width, scope.blackMaskCanvasEl.height);
        scope.blackMaskCanvasCtx.fillStyle = '#000';
        scope.blackMaskCanvasCtx.fill();


        resolve();
    }.bind(scope));
}
