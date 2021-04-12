# RoundDown jQuery UI Widget


### A countdown timer

This jQuery UI Widget provides a circular countdown timer with customizable
settings.


## Basic Usage

1. Include jQuery and jQuery UI:

    ```html
    <script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
    <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js"></script>
    <link type="text/css" rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
    ```

1. Include plugin:

    ```html
    <script src="dist/jquery.rounddown.min.js"></script>
    ```

1. Include the plugin container in your HTML:

    ```html
    <div id="rounddown"></div>
    ```

1. Call the plugin:

    ```javascript
    $("rounddown").rounddown({
        radius: 60.5,
        seconds: 5,
        strokeWidth: 15,
        fillStyle: '#0276FD',
        strokeStyle: '#003F87',
        fontSize: 50,
        fontColor: '#FFFFFF',
        autostart: false,
        onTime: [ function () { console.log('completed') } ]
    }).start();
    ```


## Default Options

```javascript
{
    autostart: true,                 // start the countdown automatically
    duration: 10000,                 // the number of milliseconds to count
                                     //   down; Infinity seconds, if null.
    fillStyle: "#8ac575",            // the fill color
    fontColor: "#477050",            // the font color
    fontFamily: "sans-serif",        // the font family
    fontSize: undefined,             // the font size, dynamically
                                     //   calulated if omitted in options
    fontWeight: 700,                 // the font weight
    label: ["second", "seconds"],    // the label to use or false if none,
                                     //   first is singular form, second
                                     //   is plural
    onTime: []                       // callbacks for each remaining second
    radius: 15.5,                    // radius of arc
    smooth: false,                   // update the ticks every 16ms when true
    strokeStyle: "#477050",          // the color of the stroke
    strokeWidth: undefined,          // the stroke width, dynamically
                                     //   calulated if omitted in options
}
```


## Functions

```
.draw                // draws all elements
.drawCountdownLabel  // draws labels
.drawCountdownShape  // draws arc around label
.elapsedTime         // returns elapsed time
.getCanvas           // returns existing or new canvas object
.pause               // pauses the count down
.radius              // get or set the arc radius
.remainingTime       // returns remaining time
.resume              // resumes a paused timer
.start               // starts (or restarts) the timer
.startTick           // starts the internal timer
.stop                // stops the timer
.stopTick            // stops the internal timer
```

## Callbacks

The `onTime` property is an array of functions to be called when the remaining
time equals the array index.  Because of sparse arrays, the following example
`onTime` array has only two entries.

```javascript
let rd = $("rounddown").rounddown({
        seconds: 60,
        autostart: true,
    });

rd.onTime[30] = function () { console.log('half done') };
rd.onTime[0] = function () { console.log('completed') };

rd.start();
```


## License

RoundDown

Copyright 2017-2021 Scottsdale Community College (published under the MIT License)

Original Countdown 360

[MIT License](http://johnschult.mit-license.org/) © John Schult
