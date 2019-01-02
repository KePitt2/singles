!function ($) {
    'use strict';

    /**
     * Top link
     * @param element
     * @param options
     * @constructor
     */
    var Top = function(element, options)
    {
        this.options = $.extend({}, this.defaults, options);

        this.element = $(element);

        this.renderNode = this.element.data('top');

        if (this.renderNode) {
            this._create();
        }

        this.countEvent = null;

        this._init();
    };

    Top.prototype = {
        defaults: {
            linkClass: 'top-link',
            linkContent: '<span class="sr-only">&uarr;</span>',
            activeClass: 'in',
            timeout: 2000,
            height: 300,
            callback: function(e) {
                $.cdr.wEvents.scrollTo(1000);
            }
        },

        _init: function() {
            var self = this;

            this.element.on('click', function(e) {
                e.preventDefault();
                if (typeof self.options.callback === 'function') {
                    self.options.callback();
                }
            });

            if ($.cdr.wEvents) {
                $.cdr.wEvents.on('scroll', function(e) {
                    self._clear();

                    if ($.cdr.wEvents.scroll() > self.options.height) {
                        self._show();
                        self._start(function() {
                            self._hide();
                        });
                    } else {
                        self._hide();
                    }
                });
            }
        },

        _start: function(action) {
            this.countEvent = setTimeout(function() {
                action();
            }, this.options.timeout);
        },

        _clear: function () {
            if (this.countEvent) {
                clearTimeout(this.countEvent);
                this.countEvent = null;
            }
        },

        _show: function() {
            this.element.addClass(this.options.activeClass);
        },

        _hide: function() {
            this.element.removeClass(this.options.activeClass);
        },

        _create: function() {
            this.element = $('<a href="#">')
                .addClass(this.options.linkClass)
                .html(this.options.linkContent);

            $.cdr.wEvents.body(this.renderNode).append(this.element);
        }
    };

    $.fn.top = function(options) {
        return this.each(function() {
            if (!$.data(this, 'top')) {
                $.data(
                    this,
                    'top',
                    new Top(this, options)
                );
            }
        });
    };
}(jQuery);