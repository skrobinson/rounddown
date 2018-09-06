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
        var canvas = this.getCanvas()
        if (this.options.seconds === null) {
            this.options.seconds = Infinity;
        }
        this.options.width = (this.options.radius + this.options.strokeWidth) * 2;
        this.options.height = this.options.width;
        this.options.arcX = this.options.radius + this.options.strokeWidth;
        this.options.arcY = this.options.arcX;
        this.options.interval = 0;
        this.options.pen = canvas[0].getContext("2d");
        this.options.pen.lineWidth = this.options.strokeWidth;
        this.options.pen.strokeStyle = this.options.strokeStyle;
        this.options.pen.fillStyle = this.options.fillStyle;
        this.options.pen.textAlign = "center";
        this.options.pen.textBaseline = "middle";
        this.options.ariaText = canvas.children('span');
        this.options.pen.clearRect(0, 0, this.options.width, this.options.height);
        if (this.options.autostart) {
            this.start();
        }
    },

    addSeconds: function(value) {
        var secondsElapsed = Math.round((new Date().getTime() -
                                            this.startedAt.getTime())/1000);
        if (this.options.startOverAfterAdding) {
            this.options.seconds = this.secondsLeft(secondsElapsed) +
                                        parseInt(value);
            this.start();
        } else {
            this.options.seconds += parseInt(value);
        }
    },

    /* drawCountdownLabel - draw the inner, and optionally the outer, label
     *
     * @param {Number} secondsLeft - the time until completion, in seconds
     */
    drawCountdownLabel: function(secondsLeft) {
        // Get a shorthand reference to the options object.
        var o = this.options;
        // Choose the units label based on quantity.  Default: plural.
        var label = o.label && o.label[1];
        if (secondsLeft === 1) {
            label = o.label && o.label[0];
        } else if (secondsLeft === Infinity) {
            secondsLeft = "∞";
        }
        // Find center of canvas.
        var x = o.width / 2;
        var y = o.height / 2;
        // Tell Aria the important part of the label.
        o.ariaText.text(secondsLeft);
        // Set the context's font.
        o.pen.font = `${o.fontWeight} ${o.fontSize} px ${o.fontFamily}`;
        if (label) {
            // Shift up 5/31 of font size, in pixels.  Why this amount?
            y = y - (o.fontSize / 6.2);
        }
        // Draw the inner label with a drop shadow.
        o.pen.fillStyle = o.fillStyle;
        o.pen.fillText(secondsLeft + 1, x, y);
        o.pen.fillStyle = o.fontColor;
        o.pen.fillText(secondsLeft, x, y);
        if (label) {
            o.pen.font = `normal small-caps  ${o.fontSize / 3} px ${o.fontFamily}`;
            // Draw units (e.g. seconds) under circle.
            o.pen.fillText(label, o.width / 2, o.height / 2 + (o.fontSize / 2.2));
        }
    },

    /* Returns a canvas object with a unique id.
     *
     * The raw canvas is accessible as the first element of the returned
     * object.
     *
     * @returns {jQuery object}
     */
    getCanvas: function() {
        var uniqueId = 'rounddown_' + Date.now().toString(36);
        var text = $('<span></span>')
                        .attr({
                            id: uniqueId + '_text',
                            role: 'status',
                            ariaLive: 'assertive'
                        });
        var canvas = $('<canvas>')
                        .attr({
                            id: uniqueId,
                            height: this.options.height,
                            width: this.options.width
                        })
                        .append(text);
        this.element.prepend(canvas);
        return canvas;
    },

    /* Returns elapsed time in seconds.
     */
    getElapsedTime: function() {
        return Math.round((new Date().getTime() -
                            this.startedAt.getTime()) / 1000);
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
        } else if (this.options.interval != 0) {
            status = 'started';
        }
        return status;
    },

    /* Returns remaining time in seconds.
     */
    getTimeRemaining: function() {
        return this.secondsLeft(this.getElapsedTime());
    },

    extendTimer: function(value) {
        var seconds = parseInt(value),
            secondsElapsed = Math.round((new Date().getTime() -
                                            this.startedAt.getTime())/1000);
        if ((this.secondsLeft(secondsElapsed) + seconds) <= this.options.seconds) {
            this.startedAt.setSeconds(this.startedAt.getSeconds() + parseInt(value));
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
            this.options.pen.canvas.width = this.options.width;
            this.options.pen.canvas.height = this.options.height;
            this.options.pen.lineWidth = this.options.strokeWidth;
            this.options.pen.strokeStyle = this.options.strokeStyle;
            this.options.pen.fillStyle = this.options.fillStyle;
            this.options.pen.textAlign = "center";
            this.options.pen.textBaseline = "middle";
            // Redraw everything.
            this._draw();
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
        if (this.options.interval != 0) {
            clearInterval(this.options.interval);
        }
        this.startedAt = new Date();
        this._drawCountdownShape(Math.PI * 3.5, true);
        this.drawCountdownLabel(this.options.seconds);
        var timerInterval = 1000;
        if (this.options.smooth) {
            timerInterval = 16;
        }
        this.options.interval = setInterval(jQuery.proxy(this._draw, this), timerInterval);
    },

    /* Stop the countdown timer.  If given, call 'cb' after stopping.
     */
    stop: function(cb) {
        if (this.options.interval != 0) {
            clearInterval(this.options.interval);
            this.options.interval = 0;
            if (cb) {
                cb();
            }
        }
    },

    secondsLeft: function(secondsElapsed) {
        return this.options.seconds - secondsElapsed;
    },

    _drawCountdownShape: function(endAngle, drawStroke) {
        this.options.pen.fillStyle = this.options.fillStyle;
        this.options.pen.beginPath();
        this.options.pen.arc(this.options.arcX, this.options.arcY,
                             this.options.radius, Math.PI*1.5, endAngle, false);
        this.options.pen.fill();
        if (drawStroke) {
            this.options.pen.stroke();
        }
    },

    _draw: function() {
        var millisElapsed, secondsElapsed;
        millisElapsed = new Date().getTime() - this.startedAt.getTime();
        secondsElapsed = Math.floor((millisElapsed) / 1000);
        endAngle = (Math.PI * 3.5) - (((Math.PI * 2) /
                        (this.options.seconds * 1000)) * millisElapsed);
        this.options.pen.clearRect(0, 0, this.options.width, this.options.height);
        this._drawCountdownShape(Math.PI * 3.5, false);
        if (secondsElapsed < this.options.seconds) {
            this._drawCountdownShape(endAngle, true);
            this.drawCountdownLabel(this.secondsLeft(secondsElapsed));
        } else if (this.getStatus() !== 'stopped') {
            this.drawCountdownLabel(this.secondsLeft(this.options.seconds));
            this.stop(this.options.onComplete);
        }
    }
});
