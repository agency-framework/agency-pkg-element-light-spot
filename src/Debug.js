"use strict";

var Controller = require('agency-pkg-base/Controller');
var DomModel = require('agency-pkg-base/DomModel');
var Vector = require('agency-pkg-base/Vector');
var Enum = require('enum');


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


    canvasList: [],
    contextList: [],
    initialize: function() {
        Controller.prototype.initialize.apply(this, arguments);
        this.imageEl = this.queryByHook('image');


        this.maskCanvasEl = this.queryByHook('maskCanvas');
        prepareCanvas(this, this.maskCanvasEl);
        this.maskCanvasCtx = this.maskCanvasEl.getContext('2d');
        this.blackMaskCanvasEl = this.queryByHook('blackMaskCanvas');
        this.blackMaskCanvasCtx = this.blackMaskCanvasEl.getContext('2d');

        this.canvasList = [];
        this.contextList = [];

        this.canvasList = this.queryAllByHook('canvas');

        this.canvasList.forEach(function(canvas) {
            prepareCanvas(this, canvas);
        }.bind(this));

        generateLightSpot(this).then(function() {
            generateAssets(this, this.imageEl).then(function() {
                Promise.all([render(this)]).then(function() {
                    this.blackMaskCanvasCtx.globalCompositeOperation = 'destination-out';
                    this.blackMaskCanvasCtx.drawImage(this.maskCanvasEl, 0, 0, this.blackMaskCanvasEl.width, this.blackMaskCanvasEl.height);


                    this.model.complete = true;
                }.bind(this));
            }.bind(this));
        }.bind(this));


    }
});

function prepareCanvas(scope, canvas) {
    canvas.width = 128;
    canvas.height = (canvas.width / scope.imageEl.width) * scope.imageEl.height;
    var context = canvas.getContext('2d');
    scope.contextList.push(context);
    // ctx.imageSmoothingEnabled = true;
    // ctx.mozImageSmoothingEnabled = true;
    // ctx.webkitImageSmoothingEnabled = true;
    // ctx.msImageSmoothingEnabled = true;
}

function render(scope) {
    return new Promise(function(resolve) {


        var position = new Vector((this.canvasList[0].width / 2) - lightSpotEl.width / 16, (this.canvasList[0].height / 2) - lightSpotEl.height / 16);


        var type = this.model.type;
        switch (type) {
            case TYPES.TYPE_1:

                var width = this.canvasList[0].width;
                var height = this.canvasList[0].height;

                this.contextList[0].drawImage(this.imageEl, 0, 0, width, height);
                this.contextList[0].globalCompositeOperation = 'lighter';
                this.contextList[0].drawImage(lightSpotEl, position.x, position.y, lightSpotEl.width / 8, lightSpotEl.height / 8);
                // this.contextList[0].drawImage(whiteCanvasEl, 0, 0, width, height);

                this.contextList[1].drawImage(this.canvasList[0], 0, 0, width, height);
                grayscale(this.contextList[1], this.canvasList[1]);

                this.contextList[2].drawImage(this.canvasList[1], 0, 0, this.canvasList[0].width, this.canvasList[0].height);
                resize(this.contextList[2], this.canvasList[2]);
                this.contextList[3].drawImage(this.imageEl, 0, 0, width, height);
                this.contextList[3].globalCompositeOperation = 'destination-in';
                this.contextList[3].drawImage(this.canvasList[2], 0, 0, this.canvasList[0].width, this.canvasList[0].height);


                this.maskCanvasCtx.drawImage(this.imageEl, 0, 0, width, height);
                this.maskCanvasCtx.globalCompositeOperation = 'lighter';
                this.maskCanvasCtx.drawImage(lightSpotEl, position.x, position.y, lightSpotEl.width / 8, lightSpotEl.height / 8);
                grayscale(this.maskCanvasCtx, this.maskCanvasEl);
                resize(this.maskCanvasCtx, this.maskCanvasEl);
                // this.contextList[3].drawImage(this.imageEl, 0, 0, width, height);
                // this.contextList[3].globalCompositeOperation = 'destination-in';
                // this.contextList[3].drawImage(this.canvasList[2], 0, 0, this.canvasList[0].width, this.canvasList[0].height);





                break;
            case TYPES.TYPE_2:

                this.contextList[0].drawImage(this.imageEl, 0, 0, this.imageEl.width, this.imageEl.height);
                this.contextList[0].drawImage(lightSpotEl, position.x, position.y, lightSpotEl.width / 8, lightSpotEl.height / 8);
                this.contextList[0].drawImage(whiteCanvasEl, 0, 0, lightSpotEl.width, lightSpotEl.height);

                grayscale(this.contextList[0], this.canvasList[0]);
                resize(this.contextList[0], this.canvasList[0]);
                this.contextList[3].drawImage(this.imageEl, 0, 0, this.imageEl.width, this.imageEl.height);
                this.contextList[3].globalCompositeOperation = 'destination-in';
                this.contextList[3].drawImage(this.canvasList[0], 0, 0, this.imageEl.width, this.imageEl.height);

                break;
            case TYPES.TYPE_3:

                console.log(this.contextList[0]);
                this.contextList[0].drawImage(this.imageEl, 0, 0, this.imageEl.width, this.imageEl.height);
                this.contextList[0].globalCompositeOperation = 'lighter';
                this.contextList[0].drawImage(lightSpotEl, position.x, position.y, lightSpotEl.width / 8, lightSpotEl.height / 8);

                this.contextList[1].drawImage(this.canvasList[0], 0, 0, this.imageEl.width, this.imageEl.height);

                this.contextList[1].globalCompositeOperation = 'destination-out';
                this.contextList[1].drawImage(blackCanvasEl, 0, 0, whiteCanvasEl.width, whiteCanvasEl.height);
                // this.contextList[1].globalCompositeOperation = 'destination-out';
                // this.contextList[1].drawImage(blackCanvasEl, 0, 0, whiteCanvasEl.width, whiteCanvasEl.height);

                this.contextList[2].drawImage(this.canvasList[1], 0, 0, this.canvasList[1].width, this.canvasList[1].height);
                this.contextList[2].globalCompositeOperation = 'destination-out';
                this.contextList[2].drawImage(whiteCanvasEl, 0, 0, blackCanvasEl.width, blackCanvasEl.height);


                // grayscale(this.contextList[0], this.canvasList[0]);
                // resize(this.contextList[0], this.canvasList[0]);
                // this.contextList[3].drawImage(this.imageEl, 0, 0, this.imageEl.width, this.imageEl.height);
                // this.contextList[3].globalCompositeOperation = 'destination-in';
                // this.contextList[3].drawImage(this.canvasList[0], 0, 0, this.imageEl.width, this.imageEl.height);

                break;
        }

        resolve();
    }.bind(scope));
}

function grayscale(ctx, canvas) {
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;

    for (var i = 0; i < data.length; i += 4) {
        // var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
        var brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;

        if (brightness > 240) {
            brightness = 0;
            // alpha
            data[i + 3] = 255 * 1;
        } else {
            brightness = 255;
            // alpha
            data[i + 3] = 255 * 0;
        }
        // red
        data[i] = brightness;
        // green
        data[i + 1] = brightness;
        // blue
        data[i + 2] = brightness;
    }

    ctx.putImageData(imageData, 0, 0);

}

function resize(ctx, canvas) {


    var directions = [
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2]
    ];

    for (var i = 0; i < 4; i++) {

        ctx.drawImage(ctx.canvas, -ctx.canvas.width * 0.1, -ctx.canvas.height * 0.1, canvas.width * 1.2, ctx.canvas.height * 1.2);

    }




}

var lightSpotEl;

function generateLightSpot(scope) {
    return new Promise(function(resolve) {
        var lightSpotCtx;
        lightSpotEl = document.createElement('canvas');
        lightSpotCtx = lightSpotEl.getContext('2d');
        var radius = 300;
        lightSpotEl.width = radius * 2;
        lightSpotEl.height = radius * 2;
        var x = radius,
            y = radius;
        var radialGradient = lightSpotCtx.createRadialGradient(x, y, 0, x, y, radius);
        radialGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        if (!(/Safari/.test(navigator.userAgent))) {
// @TODO Hier muss noch was gemacht werden!
            radialGradient.addColorStop(0.2, 'rgba(255, 255, 255, 1)');
            radialGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.5');
        }
        radialGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        console.log('generateLightSpot');
        lightSpotCtx.beginPath();
        lightSpotCtx.arc(x, y, radius, 0, 2 * Math.PI);
        lightSpotCtx.fillStyle = radialGradient;
        lightSpotCtx.fill();

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

// function generateGrayGradation(){
//
// }
