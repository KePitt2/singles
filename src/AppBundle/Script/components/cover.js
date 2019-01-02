!function ($, document) {
    'use strict';

    /**
     * Cover render
     * @param element
     * @param options
     * @constructor
     */
    var Cover = function(element, options)
    {
        this.options = $.extend({}, this.defaults, options);
        this.element = $(element);

        this._init();
    };

    Cover.prototype = {
        defaults: {
            activeClass: 'in',
            imagesSeparator: '|',
            breakpoint: 768,
            overlay: null,
            brightnessBreakpoint: 165,
            urlApi: '/api/api?api=entidad.getCover&apikey=3d6473111cb3f131f00c2c07230f9b6d&format=json'
        },

        _init: function() {
            //this.options.coverClass = this.element.attr('class').split(' ')[0];

            var self = this;

            if (this.options.image && this.options.image.length) {
                var images = this.options.image.split(this.options.imagesSeparator);

                this.build(images);
            } else if (this.options.eloc) {
                this.api( function(result) { //console.log(result);
                    var images = [];

                    if (result.img_mobile) {
                        images.push(result.img_mobile);
                    }

                    if (result.img_desktop) {
                        images.push(result.img_desktop);
                    }

                    if (images.length) {
                        self.build(images);
                    }
                });
            }
        },

        api: function(callback){
            $.ajax({
                url: this.options.urlApi+ '&eloc=' + this.options.eloc,
                success: function(result){
                    return callback(result);
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.log(xhr.status);
                    console.log(thrownError);
                }
            });

        },

        build: function(images) {
            var self = this;

            this.brightness(images[0], function(brightness) { //console.log('cover-brightness: ' + brightness);
                self.style(brightness, images);
            });
        },

        style: function(brightness, images) {
            if (this.options.overlay) {
                this.overlay(brightness);
            }

            var style = images.length > 1
                ? this.background(images[0]) + this.background(images[1], true)
                : this.background(images[0], true);

            $('<style>' + style + '</style>').appendTo('head');

            this.activate();
        },

        overlay: function(brightness) {
            var brightnessBase = 255 - this.options.brightnessBreakpoint,
                brightnessOffset = brightness - this.options.brightnessBreakpoint,
                overlayClass = brightnessOffset <= 0
                    ? Math.ceil(brightnessOffset * 5 / brightnessBase)
                    : 0; //console.log(opacityClass);

            this.element
                .addClass('cover-overlay')
                .addClass('cover-overlay-' + overlayClass);
        },

        background: function(route, responsive) {
            var rule = '#' + this.element.getId() + '{background-image:url("' + route + '");}';

            return responsive
                ? '@media(min-width:' + this.options.breakpoint + 'px){' + rule + '}'
                : rule;
        },

        brightness: function(imageSrc, callback) {
            return callback(this.options.brightnessBreakpoint); // todo: remove when available crossdomain

            var colorSum = 0,
                img = document.createElement('img');

            img.onload = function () {
                var canvas = document.createElement('canvas');
                canvas.width = this.width;
                canvas.height = this.height;

                var ctx = canvas.getContext('2d');
                ctx.drawImage(this, 0, 0);

                var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height),
                    data = imageData.data,
                    r, g, b, avg;

                for (var x = 0, len = data.length; x < len; x += 4) {
                    r = data[x];
                    g = data[x + 1];
                    b = data[x + 2];

                    avg = Math.floor((r + g + b) / 3);
                    colorSum += avg;
                }

                callback(Math.floor(colorSum / (this.width * this.height)));
                document.body.removeChild(img);
            };

            img.src = imageSrc;
            img.crossDomain = '';
            img.style.display = 'none';

            document.body.appendChild(img);
        },

        activate: function() {
            this.element.addClass(this.options.activeClass);
            // this.element.removeAttr('data-image');
            // this.element.removeAttr('data-eloc');
        }
    };

    $.fn.cover = function(options) {
        return this.each(function() {
            if (!$.data(this, 'cover')) {
                $.data(
                    this,
                    'cover',
                    new Cover(this, options)
                );
            }
        });
    };
}(jQuery, document);