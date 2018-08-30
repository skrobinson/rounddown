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
;(function ($, window, document, undefined) {
  var pluginName = "rounddown",
    defaults = {
      radius: 15.5,                    // radius of arc
      strokeStyle: "#477050",          // the color of the stroke
      strokeWidth: undefined,          // the stroke width, dynamically calulated if omitted in options
      fillStyle: "#8ac575",            // the fill color
      fontColor: "#477050",            // the font color
      fontFamily: "sans-serif",        // the font family
      fontSize: undefined,             // the font size, dynamically calulated if omitted in options
      fontWeight: 700,                 // the font weight
      autostart: true,                 // start the countdown automatically
      seconds: 10,                     // the number of seconds to count down
      label: ["second", "seconds"],    // the label to use or false if none
      startOverAfterAdding: true,      // Start the timer over after time is added with addSeconds
      smooth: false,                   // should the timer be smooth or stepping
      onComplete: function () {}
    };

  function Plugin(element, options) {
    this.element = element;
    this.settings = $.extend({}, defaults, options);
    if (!this.settings.fontSize) { this.settings.fontSize = this.settings.radius/1.2; }
    if (!this.settings.strokeWidth) { this.settings.strokeWidth = this.settings.radius/4; }
    this._defaults = defaults;
    this._name = pluginName;
    this._pausedTimeElapsed = null;
    this._init();
  }

  Plugin.prototype = {

    /* Returns the current status of the countdown timer as 'started'
     * or 'stopped'.
     *
     * @returns {String}
     */
    getStatus: function() {
      var status = 'stopped';
      if (this._pausedTimeElapsed !== null) {
        status = 'paused';
      } else if (this.interval != 0) {
        status = 'started';
      }
      return status;
    },

    /* Returns remaining time in seconds.
     */
    getTimeRemaining: function() {
      var timeRemaining = this._secondsLeft(this.getElapsedTime());
      return timeRemaining;
    },

    /* Returns elapsed time in seconds.
     */
    getElapsedTime: function() {
      return  Math.round((new Date().getTime() - this.startedAt.getTime())/1000);
    },

    extendTimer: function (value) {
      var seconds = parseInt(value),
          secondsElapsed = Math.round((new Date().getTime() - this.startedAt.getTime())/1000);
      if ((this._secondsLeft(secondsElapsed) + seconds) <= this.settings.seconds) {
        this.startedAt.setSeconds(this.startedAt.getSeconds() + parseInt(value));
      }
    },

    addSeconds: function (value) {
      var secondsElapsed = Math.round((new Date().getTime() - this.startedAt.getTime())/1000);
      if (this.settings.startOverAfterAdding) {
          this.settings.seconds = this._secondsLeft(secondsElapsed) + parseInt(value);
          this.start();
        } else {
          this.settings.seconds += parseInt(value);
        }
    },

    /* Pause the countdown timer.  Ignored if timer is not started.
     */
    pause: function () {
        if (this.getStatus() === 'started') {
            this.stop();
            this._pausedTimeElapsed = this.getElapsedTime() * 1000;
        }
    },

    /* Resume the paused countdown timer.  Ignored if timer is not paused.
     */
    resume: function () {
        if (this.getStatus() === 'paused') {
            this.start();
            // Update startedAt after starting.  Use a time previous to now
            // by the amount of time elapsed before pause.
            this.startedAt = new Date(new Date().getTime() - this._pausedTimeElapsed);
            this._pausedTimeElapsed = null;
        }
    },

    /* Start the countdown timer.  If the countdown is running when this
     * method is called, the countdown is stopped and restarted.
     */
    start: function () {
      if (this.interval != 0) {
        clearInterval(this.interval);
      }
      this.startedAt = new Date();
      this._drawCountdownShape(Math.PI*3.5, true);
      this._drawCountdownLabel(0);
      var timerInterval = 1000;
      if (this.settings.smooth) {
        timerInterval = 16;
      }
      this.interval = setInterval(jQuery.proxy(this._draw, this), timerInterval);
    },

    /* Stop the countdown timer.  If given, call 'cb' after stopping.
     */
    stop: function (cb) {
      if (this.interval != 0) {
        clearInterval(this.interval);
        this.interval = 0;
        if (cb) { cb(); }
      }
    },

    /* Get or set the radius value.
    *
    * If set, redraws the countdown timer using the new value.
    *
    * @param {Number} radius - If not given, returns the current radius.
    * A passed value will override the current radius and redraw the timer.
    */
    radius: function (radius) {
      if (radius === undefined) {
        return this.settings.radius;
      } else {
        // Calculate the direction and magnitude of the radius change.
        var ratio = radius / this.settings.radius;
        // Update values.
        this.settings.radius = radius;
        this.settings.fontSize = this.settings.fontSize * ratio;
        this.settings.arcX = radius + this.settings.strokeWidth;
        this.settings.arcY = this.settings.arcX;
        this.settings.width = (radius + this.settings.strokeWidth) * 2;
        this.settings.height = this.settings.width;
        // Reset pen values after each radius change.
        this.pen.canvas.width = this.settings.width;
        this.pen.canvas.height = this.settings.height;
        this.pen.lineWidth = this.settings.strokeWidth;
        this.pen.strokeStyle = this.settings.strokeStyle;
        this.pen.fillStyle = this.settings.fillStyle;
        this.pen.textAlign = "center";
        this.pen.textBaseline = "middle";
        // Redraw everything.
        this._draw();
      }
    },

    _init: function () {
      if (this.settings.seconds === null) {
        this.settings.seconds = Infinity;
      }
      this.settings.width = (this.settings.radius * 2) + (this.settings.strokeWidth * 2);
      this.settings.height = this.settings.width;
      this.settings.arcX = this.settings.radius + this.settings.strokeWidth;
      this.settings.arcY = this.settings.arcX;
      this.interval = 0;
      this._initPen(this._getCanvas());
      if (this.settings.autostart) { this.start(); }
    },

    _getCanvas: function () {
      var $canvas = $("<canvas id=\"rounddown_" + $(this.element).attr("id") + "\" width=\"" +
                      this.settings.width + "\" height=\"" +
                      this.settings.height + "\">" +
                      "<span id=\"rounddown-text\" role=\"status\" aria-live=\"assertive\"></span></canvas>");
      $(this.element).prepend($canvas[0]);
      return $canvas[0];
    },

    _initPen: function (canvas) {
      this.pen              = canvas.getContext("2d");
      this.pen.lineWidth    = this.settings.strokeWidth;
      this.pen.strokeStyle  = this.settings.strokeStyle;
      this.pen.fillStyle    = this.settings.fillStyle;
      this.pen.textAlign    = "center";
      this.pen.textBaseline = "middle";
      this.ariaText = $(canvas).children("#rounddown-text");
      this._clearRect();
    },

    _clearRect: function () {
      this.pen.clearRect(0, 0, this.settings.width, this.settings.height);
    },

    _secondsLeft: function(secondsElapsed) {
      return this.settings.seconds - secondsElapsed;
    },

    _drawCountdownLabel: function (secondsElapsed) {
      this.ariaText.text(secondsLeft);
      this.pen.font         = this.settings.fontWeight + " " + this.settings.fontSize + "px " + this.settings.fontFamily;
      var secondsLeft = this._secondsLeft(secondsElapsed),
          label = secondsLeft === 1 ? this.settings.label[0] : this.settings.label[1],
          drawLabel = this.settings.label && this.settings.label.length === 2,
          x = this.settings.width/2;
      if (secondsLeft === Infinity) {
        secondsLeft = "∞";
      }
      if (drawLabel) {
        y = this.settings.height/2 - (this.settings.fontSize/6.2);
      } else {
        y = this.settings.height/2;
      }
      this.pen.fillStyle = this.settings.fillStyle;
      this.pen.fillText(secondsLeft + 1, x, y);
      this.pen.fillStyle  = this.settings.fontColor;
      this.pen.fillText(secondsLeft, x, y);
      if (drawLabel) {
        this.pen.font = "normal small-caps " + (this.settings.fontSize/3) + "px " + this.settings.fontFamily;
        this.pen.fillText(label, this.settings.width/2, this.settings.height/2 + (this.settings.fontSize/2.2));
      }
    },

    _drawCountdownShape: function (endAngle, drawStroke) {
      this.pen.fillStyle = this.settings.fillStyle;
      this.pen.beginPath();
      this.pen.arc(this.settings.arcX, this.settings.arcY, this.settings.radius, Math.PI*1.5, endAngle, false);
      this.pen.fill();
      if (drawStroke) { this.pen.stroke(); }
    },

    _draw: function () {
      var millisElapsed, secondsElapsed;
      millisElapsed = new Date().getTime() - this.startedAt.getTime();
      secondsElapsed = Math.floor((millisElapsed)/1000);
      endAngle = (Math.PI*3.5) - (((Math.PI*2)/(this.settings.seconds * 1000)) * millisElapsed);
      this._clearRect();
      this._drawCountdownShape(Math.PI*3.5, false);
      if (secondsElapsed < this.settings.seconds) {
        this._drawCountdownShape(endAngle, true);
        this._drawCountdownLabel(secondsElapsed);
      } else if (this.getStatus() !== 'stopped') {
        this._drawCountdownLabel(this.settings.seconds);
        this.stop(this.settings.onComplete);
      }
    }

  };

  $.fn[pluginName] = function (options) {
    var plugin;
    this.each(function() {
      plugin = $.data(this, "plugin_" + pluginName);
      if (!plugin) {
        plugin = new Plugin(this, options);
        $.data(this, "plugin_" + pluginName, plugin);
      }
    });
    return plugin;
  };

})(jQuery, window, document);
