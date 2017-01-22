"use strict";

var Controller = require('agency-pkg-base/Controller');
var DomModel = require('agency-pkg-base/DomModel');
var Vector = require('agency-pkg-base/Vector');

require('pepjs');

global.navigator.getUserMedia = global.navigator.getUserMedia ||
    global.navigator.mozGetUserMedia ||
    global.navigator.webkitGetUserMedia;

module.exports = Controller.extend({

    modelConstructor: DomModel.extend({
        session: {

            direction: {
                type: 'string',
                required: true,
                values: ['horizontal', 'vertical'],
                default: function() {
                    return 'horizontal';
                }
            },

            invert: {
                type: 'boolean',
                required: true,
                default: function() {
                    return true;
                }
            },

            debug: {
                type: 'boolean',
                required: true,
                default: function() {
                    return false;
                }
            },
            isMove: {
                type: 'boolean',
                required: true,
                default: function() {
                    return false;
                }
            },
            value: {
                type: 'number',
                required: true,
                default: function() {
                    return 0;
                }
            },
            decimalPlaces: {
                type: 'number',
                required: true,
                default: function() {
                    return 3;
                }
            },
            targetProperty: {
                type: 'string',
                required: true,
                default: function() {
                    return 'value';
                }
            }
        }
    }),

    bindings: {
        'model.debug': {
            type: 'booleanClass',
            name: 'js-debug'
        },
        'model.isMove': {
            type: 'booleanClass',
            name: 'js-is-move'
        },
        'model.direction': {
            type: function(el, value, prevValue) {
                el.classList.remove('js-direction-' + prevValue);
                el.classList.add('js-direction-' + value);
            }
        }
    },

    events: {
        'click': function() {
            if (this.videoEl) {
                this.videoEl.play();
            }
        }
    },

    startPoint: null,
    movePoint: null,

    initialize: function() {
        Controller.prototype.initialize.apply(this, arguments);

        this.startPoint = new Vector();
        this.movePoint = new Vector();

        this.valueEl = this.queryByHook('value');
        this.model.value = decimalPlaces(this, parseFloat(this.valueEl.value));
        this.rangeEl = this.queryByHook('range');
        this.handlerEl = this.queryByHook('handler');
        $(this.handlerEl).on('pointerdown.' + this.cid, onPointerDown.bind(this));
        refresh(this);
        this.model.on('change:value', onChangeValue, this);
        onChangeValue.bind(this)(this.model, this.model.value);
    }
});

function refresh(scope) {
    scope.rangeWidth = scope.rangeEl.offsetWidth;
    scope.rangeHeight = scope.rangeEl.offsetHeight;
    scope.handlerRangeFactorX = scope.rangeWidth / scope.handlerEl.offsetWidth;
    scope.handlerRangeFactorY = scope.rangeHeight / scope.handlerEl.offsetHeight;
}

/*
 * Events
 */

function onChangeValue(model, value) {
    if (this.targetModel) {
        this.targetModel.set(this.model.targetProperty, value);
    }
    this.valueEl.value = value;
    value = invert(this, value);
    global.animationFrame.addOnce(function() {
        if (this.model.direction === 'horizontal') {
            this.handlerEl.style.cssText = 'transform: translateX(' + (value * 100 * this.handlerRangeFactorX) + '%);';
        } else {
            this.handlerEl.style.cssText = 'transform: translateY(' + (value * 100 * this.handlerRangeFactorY) + '%);';
        }
    }.bind(this));
}

function onPointerDown(e) {

    // var rect = this.handlerEl.getBoundingClientRect();
    this.handlerLeftOffsetX = e.clientX - this.handlerEl.offsetLeft;
    this.handlerLeftOffsetY = e.clientY - this.handlerEl.offsetTop;
    var rect = this.rangeEl.getBoundingClientRect();

    $(document).on('pointermove.' + this.cid, onPointerMove.bind(this));
    $(document).on('pointerup.' + this.cid, onPointerUp.bind(this));
    this.startPoint.setX(rect.left).setY(rect.top);

}

function invert(scope, value) {
    return scope.model.invert ? 1 - value : value;
}

function decimalPlaces(scope, value) {
    if (scope.model.decimalPlaces) {
        return parseFloat(value.toFixed(scope.model.decimalPlaces));
    }
    return value;
}

function onPointerMove(e) {
    e.preventDefault();
    this.movePoint.setX(e.clientX).setY(e.clientY);
    var value;
    if (this.model.direction === 'horizontal') {
        value = Math.min(Math.max(this.movePoint.subtractLocal(this.startPoint).x / this.rangeWidth, 0), 1);
    } else {
        value = Math.min(Math.max(this.movePoint.subtractLocal(this.startPoint).y / this.rangeHeight, 0), 1);

    }
    value = decimalPlaces(this, value);
    this.model.isMove = true;
    this.model.value = invert(this, value);
}

function onPointerUp() {
    $(document).off('pointermove.' + this.cid);
    $(document).off('pointerup.' + this.cid);
    this.model.isMove = false;
}
