/*!
 * Different Travel libraries 
 * http://centraldereservas.com/
 * 
 * Copyright(c) 2015, Different Travel S.L.U.
 *
 * Any and all total and/or partial representation, copy, use and/or reproduction
 * of this code or any of related stylesheets is strictly forbidden without
 * permission of Different Travel S.L.U/centraldereservas.com.
 *
 */

(function($, window, document, undefined) {

    $.cdr = $.cdr || {};

    var idCounter = 0;
    $.fn.getId = function(prefix) {
        var elementId = this.attr("id"); // obtenemos el id.

        if(!elementId) { // Si no tiene un id, lo generamos.
            do {
                elementId = (prefix ? prefix + '-' : 'gen-id-') + (idCounter++);
                // comprobamos que no hay un elemento ya con ese id.
            } while(document.getElementById(elementId));

            // Set del id.
            this.attr('id', elementId);
        }

        return elementId;
    };

    $("window").load(function(){
        $("html").addClass("js_loaded");//addClas
    });

    var uas = navigator.userAgent,
        // Otros dispositivos.
        tests = {
            opera: /Opera M(ob|in)i/i,
            androidMobile: /Android.+mobile/i,
            android: /Android/i,
            //debug : /chrome|firefox/i,
            iosMobile: /iPhone|iPod/i,
            ios: /iPhone|iPod|iPad/i,
            ieMobile: /IEMobile/i,
            blackberry: /BlackBerry/i,
            other: /kindle|meego.+mobile|symbian|maemo|palm|hiptop|netfront|fennec|psp|mobile|pocket/i
            // wap|vodafone
        };

    $.cdr.isSpecialDevice = false;
    $.cdr.specialDevices = {};
    var sd = $.cdr.specialDevices;

    for(var i in tests) {
        if(i == "other" && $.cdr.isSpecialDevice) {
            break; // Ya se determino.
        }
        sd[i] = !!uas.match(tests[i]);
        if(sd[i]) {
            $.cdr.isSpecialDevice = true;
        }
    }

    $.cdr.isTablet=function(){
        var ua= navigator.userAgent;
        if (ua.match(/iP(a|ro)d/i) || (ua.match(/tablet/i) && !ua.match(/RX-34/i)) || ua.match(/FOLIO/i)) {
            // if user agent is a Tablet
            return true;
        } else if (ua.match(/Linux/i) && ua.match(/Android/i) && !ua.match(/Fennec|mobi|HTC Magic|HTCX06HT|Nexus One|SC-02B|fone 945/i)) {
            // if user agent is an Android Tablet
            return true;
        } else if (ua.match(/Kindle/i) || (ua.match(/Mac OS/i) && ua.match(/Silk/i)) || (ua.match(/AppleWebKit/i) && ua.match(/Silk/i) && !ua.match(/Playstation Vita/i))) {
            // if user agent is a Kindle or Kindle Fire
            return true;
        } else if (ua.match(/GT-P10|SC-01C|SHW-M180S|SGH-T849|SCH-I800|SHW-M180L|SPH-P100|SGH-I987|zt180|HTC( Flyer|_Flyer)|Sprint ATP51|ViewPad7|pandigital(sprnova|nova)|Ideos S7|Dell Streak 7|Advent Vega|A101IT|A70BHT|MID7015|Next2|nook/i) || (ua.match(/MB511/i) && ua.match(/RUTEM/i))) {
            // if user agent is a pre Android 3.0 Tablet
            return true;
        }
        return false;
    };

    $.cdr.portrait = function() {
        return window.innerHeight / window.innerWidth > 1
    };

    $.cdr.landscape = function() {
        return window.innerHeight / window.innerWidth < 1
    };

    /*$.cdr.isMobile = Cdr.specialDevices.ieMobile ||
     Cdr.specialDevices.androidMobile ||  Cdr.specialDevices.iosMobile ||
     Cdr.specialDevices.blackberry ||
     (Cdr.specialDevices.opera && uas.match(/Mobi/i)) ||
     (Cdr.isSpecialDevice && !Cdr.specialDevices.ios && uas.match(/Mobile/i));*/
    $.cdr.isMobile = $.cdr.isSpecialDevice && document.documentElement &&
        document.documentElement.clientWidth < 769;//980;


    var navVersion = (function() {
            var v = uas.match(/(opera[\s\/]|opr[\s\/]|Version\/)(\d+(\.\d+)?)/i);
            if(v && v[2]) {
                return v[2];
            }
            return null;
        })(),
        majorVersion = parseInt(navVersion, 10);

    // No soportan fixed conforme al standar.
    $.cdr.badFixedPositions =(($.cdr.specialDevices.ios && majorVersion < 8)) ||
        ($.cdr.specialDevices.android && majorVersion < 3);


    // Soportan transiciones.
    $.cdr.browserTransforms = (function(){
        var div = document.createElement("div"),
            suffix = "Transform",
            testProperties = [
                suffix.toLowerCase(),
                "O" + suffix,
                "ms" + suffix,
                "Webkit" + suffix,
                "Moz" + suffix
            ];
        for(var i = 0 ; i < testProperties.length ; i++){
            if ( testProperties[i] in div.style ) {
                return true;
            }
        };
        return false;
    })();

    $.cdr.unCamelCase = function(str){
        return str.replace(/\W+/g, '-') .replace(/([a-z\d])([A-Z])/g, '$1-$2')
            .toLowerCase();
    };

    $.cdr.camelCase = function(str){
        return str.replace(/\W+(.)/g, function (x, chr) {
            return chr.toUpperCase();
        });
    };

    $.cdr.escapeRegex = function(str) {
        // ¿$.ui.autocomplete.escapeRegex?
        return (str+'').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]', 'g'), '\\$&');
    };

    $.cdr.nextFormField = function(input, avanzar){
        avanzar = avanzar*1 || 1;

        //$.cdr.nextPop(input);

        var inputs = $(input).closest('form').find('input:visible, select:visible, .cdr-focusable-element'),
            item = inputs.eq( inputs.index(input) + avanzar );

        try{
            item.focus();
            if (item.hasClass("cdr-focusable-element-click")){
                item.trigger("click");
            }
        }catch(e){}
    };

    $.cdr.isValidEmailAddress = function(emailAddress) {
        var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;

        return pattern.test(emailAddress);
    };

    $.cdr.queryParameter = function(parameter) {
        var queryString = null;

        if (URLSearchParams !== undefined) { // modern browsers
            queryString = function(name) {
                var getParameters = new URLSearchParams(window.location.search);

                return getParameters.get(name);
            }
        } else { // old browsers
            queryString = function(name) {
                name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
                var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
                    results = regex.exec(location.search);

                return results === null
                    ? ''
                    : decodeURIComponent(results[1].replace(/\+/g, ' '));
            };
        }

        return queryString ? queryString(parameter) : null;
    };

    $.fn.cssAnimationClass = function(cls, cb){
        $(this).removeClass(cls)
            .addClass(cls)
            .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
                $(this).removeClass(cls);
                cb();
            });
    };

    $.fn.frame = function(color){
        //console.log(color);

        // TODO: Color...
        var el = $(this),
            frame = $("<div>")
                .appendTo("body")
                .css({
                    borderColor : color || "#999",
                    position:"absolute",
                    zIndex:700,
                    left:el.offset().left + "px",
                    top:el.offset().top + "px",
                    pointerEvents: "none"
                })
                //.css("background", "brown")
                .width(el.outerWidth())
                .height(el.outerHeight())
                .cssAnimationClass("cdr-animate-frame", function(){
                    if (frame && frame.length){
                        frame.remove();
                    }
                });

        // evitamos problemas.
        //(function(){try{frame.remove();}catch(e){}}).defer(3000);
    };

    $.fn.removeTextNodes = function(){
        if (!this || !$(this).length || !$(this).first().length){
            return;
        }
        var nodo = $(this).first(),
            tmp = $("<"+nodo[0].nodeName+">"),
            childs = $(">*", nodo);
        childs.appendTo(tmp);
        nodo.empty();
        childs.appendTo(nodo);
    };

    $.fn.onScreenZone = function(zon){ // zon: .25, .5, 1...
        zon = Math.max(0, Math.min(1, (zon||1))); // default: 1, maximo 1, minimo 0.

        var win = $(window),
            top = win.scrollTop(),
            realTop = top + this.outerHeight(),
            bottom = top + (win.height() * zon),
            boundsTop = this.offset()["top"],
            boundsBottom = boundsTop + this.outerHeight();

        return (!(bottom < boundsTop || realTop > boundsBottom));
    };

    $.fn.scrollToElement = function(allowedArea, topMargin, duration){ // zon: .25, .5, 1...
        allowedArea = Math.max(0, Math.min(1, (allowedArea||1))); // default: 1, maximo 1, minimo 0.
        topMargin = (!topMargin || topMargin > allowedArea) ? allowedArea/2 : topMargin;

        if(!this.onScreenZone(allowedArea)){
            $('html, body').stop().animate({
                scrollTop: this.offset().top - ($(window).height() * topMargin)
            }, duration||500);
        }
    };

    // defer
    Function.prototype.defer = function(millis, scope, args) {
        var fn = this;
        args = args || [];
        return window.setTimeout(function() {
            fn.apply(scope, args);
        }, millis);
    };

})(jQuery, window, document);