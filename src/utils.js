"use strict";


module.exports = {



    resize: function(canvas, context) {


        var directions = [
            [-2, 0],
            // [-1, 0],
            [0, 0],
            // [1, 0],
            [2, 0],
            [0, -2],
            // [0, -1],
            [0, 0],
            // [0, 1],
            [0, 2]
        ];

        // context.globalCompositeOperation = 'source-out';
            context.drawImage(context.canvas, -2,0, canvas.width, canvas.height);
        for (var i = 0; i < directions.length; i++) {
        // // context.globalCompositeOperation = 'source-out';
            context.drawImage(context.canvas, directions[i][0], directions[i][1], canvas.width, canvas.height);
        }

        var scale = 1.2;
        var offset = ((scale - 1) / 2);
        for (var i = 0; i < 4; i++) {
            context.drawImage(context.canvas, -context.canvas.width * offset, -context.canvas.height * offset, canvas.width * scale, context.canvas.height * scale);
        }
    },

    grayscale: function(canvas, context, sensibility) {
        sensibility = 255 * sensibility;
        var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;

        for (var i = 0; i < data.length; i += 4) {
            // var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
            var brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;

            if (brightness > sensibility) {
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

        context.putImageData(imageData, 0, 0);

    },

    generateLightSpot: function(scope, radius) {
        return new Promise(function(resolve) {
            var lightSpotCtx;
            var lightSpotEl = document.createElement('canvas');
            lightSpotCtx = lightSpotEl.getContext('2d');
            radius = radius || 300;
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
            lightSpotCtx.beginPath();
            lightSpotCtx.arc(x, y, radius, 0, 2 * Math.PI);
            lightSpotCtx.fillStyle = radialGradient;
            lightSpotCtx.fill();

            resolve(lightSpotEl);
        }.bind(scope));
    },



    // var Vector = require('agency-pkg-base/Vector');
    // var Buffer = require('agency-pkg-base/Buffer');
    // var positionXBuffer = new Buffer(10);
    // var positionYBuffer = new Buffer(10);
    // findSpot: function(scope, canvas, context) {
    //
    //     return new Promise(function(resolve) {
    //
    //         var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    //         var data = imageData.data;
    //         var maxXCount = {
    //             x: -1,
    //             value: 0
    //         };
    //         var maxYCount = {
    //             y: -1,
    //             value: 0
    //         };
    //         var i = 0;
    //
    //         var xRowCount = {};
    //         var yRowCount = {};
    //
    //                     var x, y;
    //         for ( y = 0; y < canvas.height; y++) {
    //
    //                                 if (!xRowCount[y]) {
    //                                     yRowCount[y] = 0;
    //                                 }
    //             for ( x = 0; x < canvas.width;x++) {
    //
    //                     if (!yRowCount[x]) {
    //                         xRowCount[x] = 0;
    //                     }
    //
    //                 var brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    //                 if (brightness > 240) {
    //                     brightness = 0;
    //                     // alpha
    //                     data[i + 3] = 255 * 1;
    //                     xRowCount[x]++;
    //                     yRowCount[y]++;
    //                 } else {
    //                     brightness = 255;
    //                     // alpha
    //                     data[i + 3] = 255 * 0;
    //                 }
    //                 // red
    //                 data[i] = brightness;
    //                 // green
    //                 data[i + 1] = brightness;
    //                 // blue
    //                 data[i + 2] = brightness;
    //
    //                 i += 4;
    //
    //
    //
    //
    //             }
    //
    //         }
    //
    //         for (x = 0; x < canvas.width; x++) {
    //             if (xRowCount[x] > 0 && xRowCount[x] >= maxXCount.value) {
    //                 maxXCount.value = xRowCount[x];
    //                 maxXCount.x = (x || 0);
    //             }
    //         }
    //         for (y = 0; y < canvas.height; y++) {
    //
    //             if (yRowCount[y]> 0&& yRowCount[y] >= maxYCount.value) {
    //                 maxYCount.value = yRowCount[y];
    //                 maxYCount.y = (y || 0);
    //             }
    //
    //         }
    //
    //         context.putImageData(imageData, 0, 0);
    //         var radius = maxXCount.value > maxYCount.value ? maxXCount.value : maxYCount.value;
    //         radius = radius / 2;
    //         positionXBuffer.add((maxXCount.x));
    //         positionYBuffer.add((maxYCount.y));
    //
    //         // var position = new Vector(
    //         //     positionXBuffer.getAverage(),
    //         // canvas.height - positionYBuffer.getAverage()
    //         //
    //         // );
    //         var position = new Vector(
    //             ((positionXBuffer.getAverage() || 0)),
    //             (positionYBuffer.getAverage() || 0)
    //             //  (canvas.height - (positionYBuffer.getAverage() || 0) - radius / 2)
    //         );
    //         // console.log(maxXCount, maxYCount);
    //         // position.x = maxXCount.x;
    //         // position.y = maxYCount.y;
    //
    //         // context.beginPath();
    //         // context.arc(position.x, position.y, radius, 0, 2 * Math.PI);
    //         // context.fillStyle = '#000';
    //         // context.fill();
    //
    //         context.beginPath();
    //         context.moveTo(0, position.y);
    //         context.lineTo(canvas.width, position.y);
    //         context.strokeStyle = 'green';
    //         context.stroke();
    //
    //         context.beginPath();
    //         context.moveTo(position.x, 0);
    //         context.lineTo(position.x, canvas.height);
    //
    //         context.strokeStyle = 'green';
    //         context.stroke();
    //
    //         resolve();
    //
    //
    //     });
    //
    // }

};
