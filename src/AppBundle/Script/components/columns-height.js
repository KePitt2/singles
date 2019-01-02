!function ($) {
    'use strict';

    /**
     * ColumnsHeight fix
     * @param element
     * @param options
     * @constructor
     */
    var ColumnsHeight = function(element, options)
    {
        this.options = $.extend({}, this.defaults, options);
        this.element = $(element);

        this._init();
    };

    ColumnsHeight.prototype = {
        defaults: {
            column: '> *'
        },

        _init: function() {
            this.element.find(this.options.column).responsiveEqualHeightGrid();
        }
    };

    $.fn.columnsHeight = function(options) {
        return this.each(function() {
            if (!$.data(this, 'columnsHeight')) {
                $.data(
                    this,
                    'columnsHeight',
                    new ColumnsHeight(this, options)
                );
            }
        });
    };
}(jQuery);