"use strict";

var Controller = require('agency-pkg-base/Controller');
var DomModel = require('agency-pkg-base/DomModel');
var Vector = require('agency-pkg-base/Vector');
var Enum = require('enum');

var makeVideoPlayableInline = require('iphone-inline-video');

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

    events: {
        'click': function() {
            if (this.videoEl) {
                this.videoEl.play();
            }
        }
    },


    canvasList: [],
    contextList: [],
    initialize: function() {
        Controller.prototype.initialize.apply(this, arguments);
        this.imageEl = this.queryByHook('image');


        this.videoEl = this.queryByHook('video');

        makeVideoPlayableInline(this.videoEl);

        this.maskCanvasEl = this.queryByHook('maskCanvas');
        prepareCanvas(this, this.maskCanvasEl);
        this.maskCanvasCtx = this.maskCanvasEl.getContext('2d');
        this.blackMaskCanvasEl = this.queryByHook('blackMaskCanvas');
        this.blackMaskCanvasCtx = this.blackMaskCanvasEl.getContext('2d');


        generateLightSpot(this, [0.166666, 0.333333, 0.5, 0.666666, 0.833333, 1]).then(function() {
            generateAssets(this, this.imageEl).then(function() {
                Promise.all([setupCamera(this)]).then(function() {

                    global.animationFrame.add(function() {
                        render(this);

                        this.blackMaskCanvasCtx.globalCompositeOperation = 'source-over';
                        this.blackMaskCanvasCtx.drawImage(blackCanvasEl, 0, 0, this.imageEl.width, this.imageEl.height);
                        this.blackMaskCanvasCtx.globalCompositeOperation = 'destination-out';
                        this.blackMaskCanvasCtx.drawImage(this.maskCanvasEl, 0, 0, this.blackMaskCanvasEl.width, this.blackMaskCanvasEl.height);
                    }.bind(this));

                    this.model.complete = true;

                }.bind(this));
            }.bind(this));
        }.bind(this));


    }
});

function setupCamera(scope) {
    return new Promise(function(resolve) {
        // Get access to the camera!
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // Not adding `{ audio: true }` since we only want video now
            global.navigator.mediaDevices.getUserMedia({
                video: true
            }).then(function(stream) {
                scope.videoEl.src = window.URL.createObjectURL(stream);
                resolve();
            }, function() {
                scope.videoEl = null;
                resolve();
            });
        }
    });
}

var whiteCanvasEl, whiteCanvasCtx, blackCanvasEl, blackCanvasCtx;

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

        var width = this.blackMaskCanvasEl.width;
        var height = this.blackMaskCanvasEl.height;
        var position = new Vector((width / 2) - lightSpotEl.width / 16, (height / 2) - lightSpotEl.height / 16);

        if (this.videoEl) {
            this.maskCanvasCtx.drawImage(this.videoEl, 0, 0, this.maskCanvasEl.width, this.maskCanvasEl.height);
        } else {
            this.maskCanvasCtx.drawImage(this.imageEl, 0, 0, this.maskCanvasEl.width, this.maskCanvasEl.height);
            this.maskCanvasCtx.globalCompositeOperation = 'lighter';
            this.maskCanvasCtx.drawImage(lightSpotEl, position.x, position.y, lightSpotEl.width / 8, lightSpotEl.height / 8);
        }
        grayscale(this.maskCanvasCtx, this.maskCanvasEl);
        resize(this.maskCanvasCtx, this.maskCanvasEl);

        // this.contextList[3].drawImage(this.imageEl, 0, 0, width, height);
        // this.maskCanvasCtx.globalCompositeOperation = 'destination-in';
        // this.maskCanvasCtx.drawImage(this.maskCanvasEl, 0, 0, this.maskCanvasEl.width, this.maskCanvasEl.height);



        //         this.blackMaskCanvasCtx.globalCompositeOperation = 'destination-out';
        // this.blackMaskCanvasCtx.drawImage(this.maskCanvasEl, 0, 0, this.maskCanvasEl.blackMaskCanvasCtx, this.maskCanvasEl.blackMaskCanvasCtx);




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

function generateLightSpot(scope, values) {
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
        radialGradient.addColorStop(0.0, 'rgba(255,255,255,1)');
        radialGradient.addColorStop(0.2, 'rgba(255,255,255,1)');
        radialGradient.addColorStop(0.6, 'rgba(255,255,255,0.5');
        radialGradient.addColorStop(1, 'rgba(255,255,255,0');
        lightSpotCtx.fillStyle = radialGradient;
        lightSpotCtx.beginPath();
        lightSpotCtx.arc(x, y, radius, 0, 2 * Math.PI);
        lightSpotCtx.fill();



        resolve();
    }.bind(scope));
}


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
