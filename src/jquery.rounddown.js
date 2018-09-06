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
        onComplete: function() {},
        pausedTimeElapsed: null,
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
        if (this.options.duration === null) {
            this.options.duration = Infinity;
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

    /* draw - marshall drawing all the pieces
     */
    draw: function() {
        // Get a shorthand reference to the options object.
        var o = this.options;
        // Find elapsed time in milliseconds and remaining time in seconds.
        var elapsed = new Date() - this.startedAt;
        var remainingSeconds = Math.floor((o.duration - elapsed) / 1000);
        // Calculate endAngle as a relative angular distance from startAngle.
        var endAngle = 2 * Math.Pi * (1 - elapsed / o.duration) + startAngle;
        // Erase the canvas before beginning new drawing.
        o.pen.clearRect(0, 0, o.width, o.height);
        this.drawCountdownShape(fullCircle, false);
        this.drawCountdownLabel(remainingSeconds);
        if (elapsed < o.duration) {
            this.drawCountdownShape(endAngle, true);
        } else if (this.getStatus() !== 'stopped') {
            this.stop(o.onComplete);
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

    /* drawCountdownShape - draw the arc
     *
     * All arcs drawn by this function start at 12 o'clock and proceed
     * clockwise to endAngle.
     *
     * @param {Number} endAngle - arc terminus
     * @param {Boolean} drawStroke - if true, draw the outline
     */
    drawCountdownShape: function(endAngle, drawStroke) {
        var o = this.options;
        o.pen.fillStyle = o.fillStyle;
        o.pen.beginPath();
        // arc(x, y, r, sAngle, eAngle, counterclockwise)
        o.pen.arc(o.arcX, o.arcY, o.radius, startAngle, endAngle, false);
        o.pen.fill();
        if (drawStroke) {
            o.pen.stroke();
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

    /* Returns elapsed time in milliseconds.
     */
    elapsedTime: function() {
        return (new Date() - this.startedAt);
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

    /* Returns remaining time in milliseconds.
     */
    remainingTime: function() {
        return this.options.duration - this.elapsedTime();
    },

    /* Pause the countdown timer.  Ignored if timer is not started.
     */
    pause: function() {
        if (this.getStatus() === 'started') {
            this.stop();
            this.options.pausedTimeElapsed = this.elapsedTime();
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

    /* Resume the paused countdown timer.  Ignored if timer is not paused.
     */
    resume: function() {
        if (this.getStatus() === 'paused') {
            this.start();
            // Update startedAt after starting.  Use a time previous to now
            // by the amount of time elapsed before pause.
            this.startedAt = new Date(new Date() - this.options.pausedTimeElapsed);
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
        this.drawCountdownShape(fullCircle, true);
        this.drawCountdownLabel(this.options.duration);
        var timerInterval = 1000;
        if (this.options.smooth) {
            timerInterval = 16;
        }
        this.options.interval = setInterval(jQuery.proxy(this.draw, this), timerInterval);
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
    }
});
