$(document).ready(function() {
    $.cdr = $.cdr || {};

    $.cdr.wEvents = $('body').wEvents({
        //console: true, // show tracked values
        //scrollTracking: false // force scroll tracking/untracking
        //resizeTracking: false // force resize tracking/untracking
    }); //todo: init by data-script="wEvents" on <body>
});

!function ($, window, document, undefined) {
    'use strict';

    /**
     * Window and global event handling
     *
     * @param element
     * @param options
     */
    var wEvents = function(element, options)
    {
        this.options = $.extend({}, this.defaults, options);
        this.element = $(element);
        this.window = $(window);
        this.document = $(document);

        /** size object public property (width, height, screen type and orientation) */
        this.size = {
            width: 0,
            height: 0,
            screen: null,
            orientation: null
        };

        /** resize object public property (null, 'increase' or 'decrease' for 'width' and 'height') */
        this.resize = {
            width: null,
            height: null
        };

        /** scroll object public property */
        this.scroll = {
            top: 0,
            direction: null
        };

        /** user agent special device detection */
        this.agent = [];

        /** Public event suscriber */
        this.on = this._on;

        /**
         * Checks screen size or orientation (horizontal/vertical)
         * @param size
         * @returns {boolean}
         */
        this.is = function(size) {
            return size === this.size.screen || size === this.size.orientation;
        };

        /**
         * Detect mobile user agent
         * @param type
         * @returns {boolean}
         */
        this.mobile = function(type) {
            return type
                ? (-1 !== this.agent.indexOf(type))
                : (this.agent.length > 0);
        };

        /**
         * Returns main body or layer
         * @param layer
         */
        this.body = function(layer) {
            return layer
                ? this.element.find(layer)
                : this.element;
        };

        /**
         * Returns scroll position or checks scroll direction (up/down)
         * @returns {number|boolean}
         */
        this.scroll = function (direction) {
            return direction
                ? this.scroll.direction === direction
                : this.scroll.top;
        };

        /**
         * Animated scroll
         * @param $selector
         * @param time
         */
        this.scrollTo = function(time, $selector) {
            $('body, html').animate({
                scrollTop: $selector && $selector.length
                    ? $selector.offset().top
                    : this.element.offset().top
            }, time ? time : 0);
        };

        /**
         * Redirection timeout
         * @param url
         * @param time
         */
        this.redirect = function(time, url) {
            setTimeout(function() {
                if (url) {
                    window.location.href = url;
                } else {
                    window.location.reload();
                }
            }, time ? time : 0);
        };

        /**
         * Execute "$.cdr.wEvents.log();" on console profiler to track window events
         */
        this.log = function() {
            this._console();
        };

        this._init();
    };

    wEvents.prototype = {
        defaults: {
            console: false,
            scrollTracking: true,
            resizeTracking: true,
            breakpoints: [
                {
                    screen: 'small',
                    to: 767
                }, {
                    screen: 'medium',
                    from: 768,
                    to: 991
                }, {
                    screen: 'large',
                    from: 992
                }
            ],
            devices: {
                opera: /Opera M(ob|in)i/i,
                androidMobile: /Android.+mobile/i,
                android: /Android/i,
                iosMobile: /iPhone|iPod/i,
                ios: /iPhone|iPod|iPad/i,
                ieMobile: /IEMobile/i,
                blackberry: /BlackBerry/i,
                other: /kindle|meego.+mobile|symbian|maemo|palm|hiptop|netfront|fennec|psp|mobile|pocket/i
            }
        },

        callbacks: {
            scroll: [],
            resize: []
        },

        _init: function() {
            var self = this,
                resizer;

            this._mobile();

            if (this.options.resizeTracking) {
                this.window.on('resize orientationchange', function (we) {
                    clearTimeout(resizer);

                    resizer = setTimeout(function() {
                        self._resize();
                    }, 300);
                });
            }

            if (this.options.scrollTracking) {
                this.window.on('scroll', function(we) {
                    self._scroll();
                });
            }

            this.window.trigger('scroll').trigger('resize');

            if (this.options.console) {
                this._console();
            }

            this.links();
        },

        _mobile: function() {
            for (var i in this.options.devices) {
                if (i === 'other' && this.agent.length > 0) {
                    break;
                }

                if (!!navigator.userAgent.match(this.options.devices[i])) {
                    this.agent.push(i);
                }
            }
        },

        _on: function(callbackEvent, callbackFunction) {
            if (this.callbacks[callbackEvent] !== undefined && callbackFunction instanceof Function) {
                this.callbacks[callbackEvent].push(callbackFunction);
            }
        },

        _dispatch: function(callbackEvent) {
            if (this.callbacks && this.callbacks[callbackEvent].length) {
                $.each(this.callbacks[callbackEvent], function(i, callbackFunction) {
                    callbackFunction();
                });
            }
        },

        _scroll:  function() {
            var scrollUpdate = window.pageYOffset !== undefined
                ? window.pageYOffset
                : (document.documentElement || document.body.parentNode || document.body).top;

            if (this.scroll.top === undefined || this.scroll.top === scrollUpdate) {
                this.scroll.direction = null;
            } else {
                this.scroll.direction = this.scroll.top > scrollUpdate
                    ? 'up'
                    : 'down';
            }

            this.scroll.top = scrollUpdate;

            this.resize = {
                width: null,
                height: null
            };

            this._dispatch('scroll');
        },

        _resize: function() {
            var widthUpdate = window.innerWidth,
                heightUpdate = window.innerHeight;

            if (widthUpdate === this.size.width) {
                this.resize.width = null;
            } else {
                this.resize.width = this.size.width < widthUpdate
                    ? 'increase'
                    : 'decrease';
            }

            if (heightUpdate === this.size.height) {
                this.resize.height = null;
            } else {
                this.resize.height = this.size.height < heightUpdate
                    ? 'increase'
                    : 'decrease';
            }

            this.size.width = widthUpdate;
            this.size.height = heightUpdate;
            this.size.screen = this._size();
            this.size.orientation = widthUpdate >= heightUpdate
                ? 'horizontal'
                : 'vertical';

            this.scroll.direction = null;

            this._dispatch('resize');
        },

        _size: function() {
            for (var s in this.options.breakpoints) {
                var w = this.options.breakpoints[s];

                if (this._between(w.from, w.to)) {
                    return w.screen;
                }
            }
        },

        _between: function(from, to) {
            if (to) {
                return from
                    ? this.size.width >= from && this.size.width <= to
                    : this.size.width <= to;
            }

            return from && this.size.width >= from;
        },

        _console: function() {
            var self = this;

            this._on('resize', function() {
                self._log();
            });

            this._on('scroll', function() {
                self._log();
            });

            self._log();
        },

        _log: function() {
            console.info(
                (this.size.screen ? this.size.screen : '-')
                + (this.size.orientation ? ' (' + this.size.orientation + ')' : '')
                + ' | w: ' + this.size.width + (this.resize.width ? ' (' + this.resize.width + ')' : '')
                + ' | h: ' + this.size.height + (this.resize.height ? ' (' + this.resize.height + ')' : '')
                + ' | s: ' + this.scroll.top + (this.scroll.direction ? ' (' + this.scroll.direction + ')' : '')
                + (this.agent.length > 1 ? ' | u: ' + this.agent.join('/') : '')
            );
        },

        links: function() {
            this.document.on('click', '[href*="#"]', function (e) {
                if (
                    !this.href.includes('#')
                    || location.hostname !== this.hostname
                    || location.pathname.replace(/^\//, '') !== this.pathname.replace(/^\//, '')
                ) {
                    return true;
                }

                if (this.hash.length > 1) {
                    var $target = $(this.hash);

                    if ($target.length) {
                        this.scrollTo(1000, $target);
                    }
                } else {
                    return false;
                } // anchors management
            });

            this.document.on('click', '[data-focus]', function(e) {
                $($(this).data('focus')).trigger('focus');
            }); // Trigger focus on selector
        }
    };

    $.fn.wEvents = function(options) {
        return new wEvents(this, options);
    };

}(jQuery, window, document);