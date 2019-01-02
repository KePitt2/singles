(function($, window, document, undefined) {

    $.cdr = $.cdr || {};

    $.cdr.Parser = (function() {

        var funciones = {},
            //    attsNamespace = "parser",
            attName = "data-script",
            attNameExecuted = "data-script-executed",
            attNameNotExecuted = "data-script-not-executed",
            attDepsName = "data-script-dependency";

        var init = function() {
            parse(document);
        };

        var parse = function(element) {
            var nodos/*, nodosOrdenados, previo = null*/;

            //if (element !== document){
            if($(element) !== $(document)) {
                if(!$(element)) {
                    return;
                }
                element = $(element).get();
                if(element.length > 1) {
                    // Varios matches, los recorremos.
                    for(var i = 0; i < element.length; i++) {
                        parse(element);
                    }
                    return;
                }
                // Solo hay un elemento.
                element = element[0];
            }

            if(element.querySelectorAll) {
                // queryselectorall
                nodos = element.querySelectorAll("[" + attName + "]");
            } else if((!$.cdr.isIEunder7 || window.opera) && element.all) {
                nodos = [];
                // IE7: document.all
                for(var i = 0, dal = element.all.length; i < dal; i++) {
                    if(element.all[i] && element.all[i][attName]) {
                        nodos.push(element.all[i]);
                    }
                }
            }

            execNodes(nodos);
        };

        var execNodes = function(nodos) {

            var ejecuciones = [], depends, fn, tmpEl, depth;

            // Recorrer las opciones.
            // Crear array con los datos de ejecuciones
            if(!nodos)
                return;

            for(var j = 0; j < nodos.length; j++) {
                // Obtener la profundidad
                tmpEl = nodos[j];
                depth = 0;
                while(tmpEl && tmpEl.parentNode) {
                    tmpEl = tmpEl.parentNode;
                    depth++;
                }

                // Obtener fn ejecucion
                fn = nodos[j].getAttribute(attName);
                if(fn.indexOf(",")) {
                    fn = fn.split(/\,/);
                }

                // Obtener dependencias
                depends = nodos[j].getAttribute(attDepsName);
                if(depends) {
                    depends = depends.split(",");
                } else {
                    depends = false;
                }

                // Eliminar atributos: evitamos problemas si se ejecuta el
                // algoritmo dos veces sobre un mismo pedazo de DOM.
                nodos[j].removeAttribute(attName);
                nodos[j].removeAttribute(attDepsName);

                //console.log("add-to-ejecuciones", nodos[j]);

                // push
                ejecuciones.push({
                    elem: nodos[j],
                    fn: fn,
                    depth: depth,
                    depends: depends
                });
            }

            // quicksort profundidad
            ejecuciones = ordenarLlamadas(ejecuciones);

            // Recorrer las ejecuciones
            var dependencias = [],
                fnEnDeps = {},
                //numEjecuciones = 0,
                ejec, ejecFn;
            for(var k = 0; k < ejecuciones.length; k++) {
                ejec = ejecuciones[k];
                ejecFn = ejec.fn;

                // Ejecutar, en orden, las funciones de los que no tienen deps
                if(ejec.depends) {
                    dependencias.push(ejec);
                    if(!fnEnDeps[ejecFn]) {
                        fnEnDeps[ejecFn] = 0;
                    }
                    fnEnDeps[ejecFn]++;
                } else {
                    ejecutaFn(ejecFn, ejec.elem);
                }
            }

            // Quedan pocas. Ejecutar los que tengan dependencias.
            var hasDependency,
                numEjecuciones = 0,
                doBrk = !!dependencias.length, tmpInd, dep, n, m;

            while(doBrk) {
                tmpInd = numEjecuciones;
                for(n = dependencias.length - 1; n >= 0; n++) {
                    dep = dependencias[n];

                    hasDependency = false;
                    for(m = 0; m < dep.depends.length; m++) {
                        if(fnEnDeps[dep.depends[m]] &&
                            fnEnDeps[dep.depends[m]] > 0) {
                            hasDependency = true;
                        }
                    }

                    if(!hasDependency) {
                        ejecutaFn(dep.fn, dep.elem);
                        numEjecuciones++;

                        // Eliminamos la dependencia.
                        fnEnDeps[dep.depends[m]]--;
                        dependencias.slice(m, 1);
                    }
                }

                // No se pueden resolver mas dependencias
                if(tmpInd === numEjecuciones) {
                    throw "Deps error";
                }

                if(!dependencias.length) {
                    doBrk = true;
                }
            }

        };

        var ordenarLlamadas = function(ejecs) { // quicksort
            if(ejecs.length <= 1) {
                return ejecs;
            }
            var pivotIndex = Math.floor(Math.random() * ejecs.length);
            var pivot = ejecs.splice(pivotIndex, 1);
            var less = [], greater = [];

            for(var i = 0, l = ejecs.length; i < l; i++) {
                if(ejecs[i].depth <= pivot[0].depth) {
                    less.push(ejecs[i]);
                } else {
                    greater.push(ejecs[i]);
                }
            }
            return ordenarLlamadas(less).concat(pivot,ordenarLlamadas(greater));
        };

        var numEjecs = 0;
        var ejecutaFn = function(name, dom) {
            if($.isArray(name)) {
                for(var t = 0; t < name.length; t++) {
                    //try{
                    ejecutaFn(name[t], dom);
                    /*}catch(e){
                        console.log("error", name[t], dom)
                        console.log(e)
                        console.log(e["get stack"]())
                    }*/
                }
                return;
            }

            // evitar problemas.
            try{
                _doFnExec(name, dom)
            }catch(e){
                if (console && console.error){
                    console.error(e, e.stack);
                }
            }
        }

        var _doFnExec = function(name, dom) {
            var elem = $(dom),
                id = elem.getId(),
                atts = elem.data(),
                result, ccName,
                executed = false;

            //name = name.trim();
            // string.trim() no soportado por IE8
            name = $.trim(name);
            ccName = $.cdr.camelCase(name);

            numEjecs++;
            // Tenemos una funcion registrada para ese name?
            if(funciones[name]) {
                result = funciones[name](dom, atts);
                executed = true;
            } else if($.fn[ccName]) {
                // Hay en el objeto jQuery una funcion registrada para ese name?
                result = elem[ccName](atts);
                executed = true;
            } else {
                // Hay un objeto en window o $ con ese name?
                var objects = [$, window],
                    element,
                    split = name.split(/\./),
                    splitEl;

                for(var o = 0; o < objects.length; o++) {
                    element = objects[o];
                    for(var j = 0; j < split.length; j++) {
                        splitEl = $.cdr.camelCase(split[j]);
                        if(element[splitEl]) {
                            element = element[splitEl];
                        } else {
                            element = null;
                            break;
                        }
                    }

                    if(element && element !== window) {
                        // Si widget de jquery expresado de manera larga.
                        if (objects[o] === $ && element.prototype &&
                            element.prototype.widgetFullName){
                            //elem[split.pop()](atts);
                            elem[splitEl](atts);
                            result = elem.data(name.replace(/-/, "."));
                            executed = true;
                        }else{
                            // En otro caso, objeto.
                            try {
                                result = new element(dom, atts);
                                executed = true;
                            } catch(e) {
                            }
                        }
                        break;
                    }
                }
            }

            var nameAtt = executed ? attNameExecuted : attNameNotExecuted,
                nameVal = [name],
                oldVal = dom.getAttribute(nameAtt);

            if(oldVal){
                nameVal.unshift(oldVal);
            }
            dom.setAttribute(nameAtt, nameVal.join(","));

            addToRegistry(id, name, executed, result || null);
        };

        // Registrar funciones en un nombre concreto.
        var registrar = function(name, fn) {
            funciones[name] = fn;
        };







        var objectRegistry = [],
            evs = [];

        var addEvent = function(type, value, fn, max){
            type = type.toLowerCase();
            value = (type==="element" ? $(value).getId() : value);

            evs.push({type:type, value:value, fn:fn, count:0, max:max || false});
            var num = evs.length-1;

            for (var i = 0 ; i < objectRegistry.length ; i++){
                testFn(num, i);
            }
        };

        var addToRegistry = function(id, script, executed, result){
            objectRegistry.push([id, script, executed, result]);
            var num = objectRegistry.length-1;

            for (var i = 0 ; i < evs.length ; i++){
                testFn(i, num);
            }
        };

        var testFn = function(numEv, numRegistry){
            var ev = evs[numEv],
                reg = objectRegistry[numRegistry];

            if ((ev.type !== "element" && ev.type !== "script") ||
                (ev.type === "element" && reg[0] !== ev.value)){
                return false;
            }
            if (ev.type === "script"){
                var val = ev.value,
                    enc = false;
                if (!$.isArray(val)){
                    val = val.split(/\s+/);
                }
                for (var j = 0 ; j < val.length ; j++) {
                    if (reg[1] === val[j]){
                        enc = true;
                    }
                }
                if (!enc){
                    return false;
                }
            }

            if (!ev.max || ev.count < ev.max){
                ev.fn.apply(window, reg);
                ev.count++;
            }
        };

        var changeAttr = function(attr, value){

            if (!value){
                if ($.isPlainObject(attr)){
                    // si es un objeto
                    for(var i in attr){
                        if (typeof attr[i] == 'string'){
                            changeAttr(i, attr[i]);
                        }
                    }
                }else{
                    // Si no es un objeto y no se especifica tipo, es el valor de att
                    changeAttr("att", attr);
                }
                return;
            }

            switch(attr){
                case "att":
                    attName = value;
                    break;
                case "executed":
                    attNameExecuted = value;
                    break;
                case "notExecuted":
                    attNameNotExecuted = value;
                    break;
                case "deps":
                    attDepsName = value;
                    break;
            }
        };

        var getExecuted = function(execName/*, returnNode*/){
            var retorno = [];
            for(var i = 0 ; i < objectRegistry.length; i++){
                if ((!execName || execName == "*" || objectRegistry[i][1] == execName) && objectRegistry[i][2]){
                    //if (returnNode){
                    retorno.push($("#"+objectRegistry[i][0]));
                    /*}else{
                        retorno.push(objectRegistry[i][3]);
                    }*/
                }
            }

            return retorno;
        };



        // Ejecutar en la carga del DOM.
        $(init);

        return {
            //    getElemObject : getElemObject,
            register: registrar,
            parse: parse,

            on: addEvent,
            one: function(type, value, fn){
                addEvent(type, value, fn, 1);
            },
            chngAttr: changeAttr,
            getExecuted: getExecuted
        };

    })();

})(jQuery, window, document);