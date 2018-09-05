/*
 * RoundDown - v0.1.9.3
 *
 * A round countdown timer copied and adapted from Countdown 360.
 *
 * Countdown 360 is a simple attractive circular countdown timer that counts
 * down a number of seconds. The style is configurable and callbacks are
 * supported on completion.
 * https://github.com/johnschult/jquery.countdown360
 *
 * Made by John Schult
 * Under MIT License
 *
 * Edits and additions are copyright 2017,2018 by Scottsdale Community College.
 * Edited by Sean Robinson <sean.robinson@scottsdalecc.edu>
 */
$.widget('scottsdalecc.rounddown', {
    options: {
        autostart: true,               // start the countdown automatically
        fillStyle: "#8ac575",          // the fill color
        fontColor: "#477050",          // the font color
        fontFamily: "sans-serif",      // the font family
        fontSize: undefined,           // the font size, dynamically calulated if omitted in options
        fontWeight: 700,               // the font weight
        label: ["second", "seconds"],  // the label to use or false if none
        onComplete: function() {},
        pausedTimeElapsed: null,
        seconds: 10,                   // the number of seconds to count down
        smooth: false,                 // should the timer be smooth or stepping
        startOverAfterAdding: true,    // Start the timer over after time is added with addSeconds
        strokeStyle: "#477050",        // the color of the stroke
        strokeWidth: undefined,        // the stroke width, dynamically calulated if omitted in options
        radius: 15.5                   // radius of arc
    },

    _create: function() {
        if (this.options.fontSize === undefined) {
            this.options.fontSize = this.options.radius / 1.2;
        }
        if (!this.options.strokeWidth) {
            this.options.strokeWidth = this.options.radius/4;
        }
    },

    _init: function() {
        if (this.options.seconds === null) {
            this.options.seconds = Infinity;
        }
        this.options.width = (this.options.radius + this.options.strokeWidth) * 2;
        this.options.height = this.options.width;
        this.options.arcX = this.options.radius + this.options.strokeWidth;
        this.options.arcY = this.options.arcX;
        this.interval = 0;
        this._initPen(this._getCanvas());
        if (this.options.autostart) {
            this.start();
        }
    },

    /* Returns the current status of the countdown timer as 'started',
     * 'stopped', or 'paused'.
     *
     * @returns {String}
     */
    getStatus: function() {
        var status = 'stopped';
        if (this.options.pausedTimeElapsed !== null) {
            status = 'paused';
        } else if (this.interval != 0) {
            status = 'started';
        }
        return status;
    },

    /* Returns remaining time in seconds.
     */
    getTimeRemaining: function() {
        return this._secondsLeft(this.getElapsedTime());
    },

    /* Returns elapsed time in seconds.
     */
    getElapsedTime: function() {
        return Math.round((new Date().getTime() -
                            this.startedAt.getTime()) / 1000);
    },

    extendTimer: function(value) {
        var seconds = parseInt(value),
            secondsElapsed = Math.round((new Date().getTime() -
                                            this.startedAt.getTime())/1000);
        if ((this._secondsLeft(secondsElapsed) + seconds) <= this.options.seconds) {
            this.startedAt.setSeconds(this.startedAt.getSeconds() + parseInt(value));
        }
    },

    addSeconds: function(value) {
        var secondsElapsed = Math.round((new Date().getTime() -
                                            this.startedAt.getTime())/1000);
        if (this.options.startOverAfterAdding) {
            this.options.seconds = this._secondsLeft(secondsElapsed) +
                                        parseInt(value);
            this.start();
        } else {
            this.options.seconds += parseInt(value);
        }
    },

    /* Pause the countdown timer.  Ignored if timer is not started.
     */
    pause: function() {
        if (this.getStatus() === 'started') {
            this.stop();
            this.options.pausedTimeElapsed = this.getElapsedTime() * 1000;
        }
    },

    /* Resume the paused countdown timer.  Ignored if timer is not paused.
     */
    resume: function() {
        if (this.getStatus() === 'paused') {
            this.start();
            // Update startedAt after starting.  Use a time previous to now
            // by the amount of time elapsed before pause.
            this.startedAt = new Date(new Date().getTime() -
                                        this.options.pausedTimeElapsed);
            this.options.pausedTimeElapsed = null;
        }
    },

    /* Start the countdown timer.  If the countdown is running when this
     * method is called, the countdown is stopped and restarted.
     */
    start: function() {
        if (this.interval != 0) {
            clearInterval(this.interval);
        }
        this.startedAt = new Date();
        this._drawCountdownShape(Math.PI * 3.5, true);
        this._drawCountdownLabel(0);
        var timerInterval = 1000;
        if (this.options.smooth) {
            timerInterval = 16;
        }
        this.interval = setInterval(jQuery.proxy(this._draw, this), timerInterval);
    },

    /* Stop the countdown timer.  If given, call 'cb' after stopping.
     */
    stop: function(cb) {
        if (this.interval != 0) {
            clearInterval(this.interval);
            this.interval = 0;
            if (cb) {
                cb();
            }
        }
    },

    /* Get or set the radius value.
     *
     * If set, redraws the countdown timer using the new value.
     *
     * @param {Number} radius - If not given, returns the current radius.
     * A passed value will override the current radius and redraw the timer.
     */
    radius: function(radius) {
        if (radius === undefined) {
            return this.options.radius;
        } else {
            // Calculate the direction and magnitude of the radius change.
            var ratio = radius / this.options.radius;
            // Update values.
            this.options.radius = radius;
            this.options.fontSize = this.options.fontSize * ratio;
            this.options.arcX = radius + this.options.strokeWidth;
            this.options.arcY = this.options.arcX;
            this.options.width = (radius + this.options.strokeWidth) * 2;
            this.options.height = this.options.width;
            // Reset pen values after each radius change.
            this.pen.canvas.width = this.options.width;
            this.pen.canvas.height = this.options.height;
            this.pen.lineWidth = this.options.strokeWidth;
            this.pen.strokeStyle = this.options.strokeStyle;
            this.pen.fillStyle = this.options.fillStyle;
            this.pen.textAlign = "center";
            this.pen.textBaseline = "middle";
            // Redraw everything.
            this._draw();
        }
    },

    _getCanvas: function() {
        var $canvas = $("<canvas id=\"rounddown_" +
                        $(this.element).attr("id") + "\" width=\"" +
                        this.options.width + "\" height=\"" +
                        this.options.height + "\">" +
                        "<span id=\"rounddown-text\" role=\"status\" " +
                        "aria-live=\"assertive\"></span></canvas>");
        $(this.element).prepend($canvas[0]);
        return $canvas[0];
    },

    _initPen: function(canvas) {
        this.pen = canvas.getContext("2d");
        this.pen.lineWidth = this.options.strokeWidth;
        this.pen.strokeStyle = this.options.strokeStyle;
        this.pen.fillStyle = this.options.fillStyle;
        this.pen.textAlign = "center";
        this.pen.textBaseline = "middle";
        this.ariaText = $(canvas).children("#rounddown-text");
        this._clearRect();
    },

    _clearRect: function() {
        this.pen.clearRect(0, 0, this.options.width, this.options.height);
    },

    _secondsLeft: function(secondsElapsed) {
        return this.options.seconds - secondsElapsed;
    },

    _drawCountdownLabel: function(secondsElapsed) {
        this.ariaText.text(secondsLeft);
        this.pen.font = this.options.fontWeight + " " +
                            this.options.fontSize + "px " +
                            this.options.fontFamily;
        var secondsLeft = this._secondsLeft(secondsElapsed),
        label = secondsLeft === 1 ? this.options.label[0] :
                    this.options.label[1],
                    drawLabel = this.options.label &&
                        this.options.label.length === 2,
                    x = this.options.width/2;
        if (secondsLeft === Infinity) {
            secondsLeft = "∞";
        }
        if (drawLabel) {
            y = this.options.height/2 - (this.options.fontSize/6.2);
        } else {
            y = this.options.height/2;
        }
        this.pen.fillStyle = this.options.fillStyle;
        this.pen.fillText(secondsLeft + 1, x, y);
        this.pen.fillStyle = this.options.fontColor;
        this.pen.fillText(secondsLeft, x, y);
        if (drawLabel) {
            this.pen.font = "normal small-caps " +
                                (this.options.fontSize/3) + "px " +
                                this.options.fontFamily;
            this.pen.fillText(label, this.options.width/2,
                                this.options.height/2 +
                                (this.options.fontSize/2.2));
        }
    },

    _drawCountdownShape: function(endAngle, drawStroke) {
        this.pen.fillStyle = this.options.fillStyle;
        this.pen.beginPath();
        this.pen.arc(this.options.arcX, this.options.arcY,
                        this.options.radius, Math.PI*1.5, endAngle, false);
        this.pen.fill();
        if (drawStroke) {
            this.pen.stroke();
        }
    },

    _draw: function() {
        var millisElapsed, secondsElapsed;
        millisElapsed = new Date().getTime() - this.startedAt.getTime();
        secondsElapsed = Math.floor((millisElapsed) / 1000);
        endAngle = (Math.PI * 3.5) - (((Math.PI * 2) /
                        (this.options.seconds * 1000)) * millisElapsed);
        this._clearRect();
        this._drawCountdownShape(Math.PI * 3.5, false);
        if (secondsElapsed < this.options.seconds) {
            this._drawCountdownShape(endAngle, true);
            this._drawCountdownLabel(secondsElapsed);
        } else if (this.getStatus() !== 'stopped') {
            this._drawCountdownLabel(this.options.seconds);
            this.stop(this.options.onComplete);
        }
    }
}
