/*
 * RoundDown - v0.99.0
 *
 * A round countdown timer copied and adapted from Countdown 360.
 *
 * RoundDown is copyright 2017,2018 by Scottsdale Community College.
 * Sean Robinson <sean.robinson@scottsdalecc.edu>
 *
 * Countdown360 made by John Schult
 * https://github.com/johnschult/jquery.countdown360
 * Under MIT License
 */

'use strict';

// Locally relevant constants.
const startAngle = -0.5 * Math.PI;  // radial coordinates top, CCW
const fullCircle = 1.5 * Math.PI;  // radial coordinates top, CW

$.widget('scottsdalecc.rounddown', {
    options: {
        autostart: true,               // start the countdown automatically
        duration: 10000,               // the number of milliseconds to count down
        fillStyle: "#8ac575",          // the fill color
        fontColor: "#477050",          // the font color
        fontFamily: "sans-serif",      // the font family
        fontSize: undefined,           // the font size, dynamically calulated if omitted in options
        fontWeight: 700,               // the font weight
        label: ["second", "seconds"],  // the label to use or false if none
        onTime: [],                    // callbacks for each second
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
            this.options.strokeWidth = this.options.radius / 4;
        }
    },

    _init: function() {
        // Initialize non-public variables.
        this._interval = 0;  // currently running interval timer
        this._status = 'stopped';  // running status
        this._pausedTimeElapsed = null;  // elapsed time at pause
        this._timerInterval = 1000;  // course-grained ticks
        if (this.options.smooth) {
            this._timerInterval = 16;  // fine-grained ticks
        }
        // Initialize options.
        if (this.options.duration === null) {
            this.options.duration = Infinity;
        }
        this.options.width = (this.options.radius + this.options.strokeWidth) * 2;
        this.options.height = this.options.width;
        this.options.arcX = this.options.radius + this.options.strokeWidth;
        this.options.arcY = this.options.arcX;
        var canvas = this.getCanvas();
        this.options.pen = canvas[0].getContext("2d");
        this.options.pen.lineWidth = this.options.strokeWidth;
        this.options.pen.strokeStyle = this.options.strokeStyle;
        this.options.pen.fillStyle = this.options.fillStyle;
        this.options.pen.textAlign = "center";
        this.options.pen.textBaseline = "middle";
        this.options.ariaText = canvas.children('span');
        this.options.pen.clearRect(0, 0, this.options.width, this.options.height);
        this.draw();
        if (this.options.autostart) {
            this.start();
        }
    },

    /* draw - marshall drawing all the pieces
     */
    draw: function() {
        // Get a shorthand reference to the options object.
        var o = this.options;
        // Save a temporary copy of elapsed time, in milliseconds.
        var elapsed = this.elapsedTime();
        // Calculate endAngle as a relative angular distance from startAngle.
        var endAngle = 2 * Math.PI * (1 - elapsed / o.duration) + startAngle;
        var remainder = Math.ceil((o.duration - elapsed) / 1000);
        // Erase the canvas before beginning new drawing.
        o.pen.clearRect(0, 0, o.width, o.height);
        this.drawCountdownShape(fullCircle, false);
        this.drawCountdownLabel(remainder);
        // Run per-second callback, if one is assigned.
        o.onTime[remainder] && o.onTime[remainder](remainder);
        if (elapsed < o.duration) {
            this.drawCountdownShape(endAngle, true);
        } else if (this._status !== 'stopped') {
            this.stop();
            this._status = 'stopped';
        }
    },

    /* drawCountdownLabel - draw the inner, and optionally the outer, label
     *
     * @param {Number} secondsLeft - the time until completion
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
        // Overwrite previous number with bgcolor/fillStyle to erase it.
        o.pen.fillStyle = o.fillStyle;
        o.pen.fillText(secondsLeft + 1, x, y);
        // Draw the new inner label.
        o.pen.fillStyle = o.fontColor;
        o.pen.fillText(secondsLeft, x, y);
        if (label) {
            o.pen.font = `normal small-caps  ${o.fontSize / 3} px ${o.fontFamily}`;
            // Draw units (e.g. seconds) under circle.
            o.pen.fillText(label, o.width / 2, o.height / 2 + (o.fontSize / 2.2));
        }
    },

    /* drawCountdownShape - draw the arc
     *
     * All arcs drawn by this function start at 12 o'clock and proceed
     * clockwise to endAngle.
     *
     * @param {Number} endAngle - arc terminus in radians
     * @param {Boolean} drawStroke - if true, draw only the outer edge
     */
    drawCountdownShape: function(endAngle, drawStroke) {
        var o = this.options;
        o.pen.fillStyle = o.fillStyle;
        o.pen.beginPath();
        // arc(x, y, r, sAngle, eAngle, counterclockwise)
        o.pen.arc(o.arcX, o.arcY, o.radius, startAngle, endAngle, false);
        if (drawStroke) {
            o.pen.stroke();
        } else {
            o.pen.fill();
        }
    },

    /* Returns elapsed time in milliseconds.
     *
     * @returns {Number}
     */
    elapsedTime: function() {
        if (this._status === 'started') {
            return new Date() - this.startedAt;
        } else if (this._status === 'paused') {
            return this._pausedTimeElapsed;
        }
        // this._status === 'stopped' or anything else
        return 0;
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

    /* Pause the countdown timer.  Ignored if timer is not started.
     */
    pause: function() {
        if (this._status === 'started') {
            this.stopTick();
            this._pausedTimeElapsed = this.elapsedTime();
            this._status = 'paused';
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
            this.draw();
        }
    },

    /* Returns remaining time in milliseconds.
     *
     * If the countdown is stopped when this function is called, the returned
     * remaining time is the full duration.
     *
     * @returns {Number}
     */
    remainingTime: function() {
        return this.options.duration - this.elapsedTime();
    },

    /* Resumes the paused countdown timer.  Ignored if timer is not paused.
     */
    resume: function() {
        if (this._status === 'paused') {
            this.startTick();
            // Update startedAt after starting.  Use a time previous to now
            // by the amount of time elapsed before pause.
            this.startedAt = new Date(new Date() - this._pausedTimeElapsed);
            this._pausedTimeElapsed = null;
            this._status = 'started';
        }
    },

    /* Starts the countdown timer.  If the countdown is running when this
     * method is called, the countdown is stopped and restarted.
     */
    start: function() {
        if (this._status !== 'stopped') {
            this.stopTick();
        }
        this.drawCountdownShape(fullCircle, true);
        this.drawCountdownLabel(this.options.duration / 1000);
        this.startTick();
        this.startedAt = new Date();
        this._pausedTimeElapsed = null;
        this._status = 'started';
    },

    /* Starts the interval timer with callbacks to update the display.
     */
    startTick: function() {
        // Only process if there is not an existing interval.
        if (this._interval === 0) {
            this._interval = setInterval(this.draw.bind(this),
                                         this._timerInterval);
        }
    },

    /* Stops the countdown timer.
     */
    stop: function() {
        this.stopTick();
        this._status = 'stopped';
    },

    /* Stops the interval timer.
     */
    stopTick: function() {
        if (this._interval != 0) {
            clearInterval(this._interval);
        }
        this._interval = 0;
    }
});
