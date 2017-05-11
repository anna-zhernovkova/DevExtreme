"use strict";

var $ = require("jquery"),
    rendererStrategy = require("./native_renderer_strategy"),
    typeUtils = require("./utils/type");

var isWindow = $.isWindow,
    isNumeric = $.isNumeric;

var useJQueryRenderer = false; //window.useJQueryRenderer !== false;
var dataMap = new window.WeakMap();

var methods = [
    "on", "off", "one", "trigger", "triggerHandler", "focusin", "focusout", "click", "focus", "blur", "submit",
    "val", "has", "scope",
    "hide", "show", "toggle", "slideUp", "slideDown", "slideToggle"];

var renderer = function(selector, context) {
    return new initRender(selector, context);
};

var initRender = function(selector, context) {
    if(selector instanceof initRender) {
        this.$element = selector.$element;
    } else {
        this.$element = new $.fn.init(selector, context);
    }

    this.length = 0;
    for(var i = 0; i < this.$element.length; i++) {
        [].push.call(this, this.$element[i]);
    }
    var $element = this.$element;

    Object.defineProperty(this, "length", { //dxDataGrid
        get: function() {
            return $element.length;
        },
        set: function(value) {
            $element.length = value;
        }
    });
};

renderer.fn = { jquery: $.fn.jquery };
initRender.prototype = renderer.fn;

if(!useJQueryRenderer) {
    var repeatMethod = function(methodName, args) {
        for(var i = 0; i < this.length; i++) {
            var item = renderer(this[i]);
            item[methodName].apply(item, args);
        }
        return this;
    };

    methods.forEach(function(method) {
        var methodName = method;
        initRender.prototype[method] = function() {
            var result = this.$element[methodName].apply(this.$element, arguments);
            if(result === this.$element) {
                return this;
            }
            return result;
        };
    });

    var propFix = {};
    [
        "tabIndex",
        "readOnly",
        "maxLength",
        "cellSpacing",
        "cellPadding",
        "rowSpan",
        "colSpan",
        "useMap",
        "frameBorder",
        "contentEditable"
    ].forEach(function(name) {
        propFix[name.toLowerCase()] = name;
    });

    initRender.prototype.attr = function(attrName, value) {
        if(this.length > 1 && arguments.length > 1) return repeatMethod.call(this, "attr", arguments);
        if(!this[0]) {
            if(typeUtils.isPlainObject(attrName)) {
                return this;
            } else {
                return value === undefined ? undefined : this;
            }
        }
        if(!this[0].getAttribute) {
            return this.prop(attrName, value);
        }
        if(typeof attrName === "string" && arguments.length === 1) {
            var result = this[0].getAttribute(attrName);
            return result == null ? undefined : result;
        } else if(typeUtils.isPlainObject(attrName)) {
            for(var key in attrName) {
                this.attr(key, attrName[key]);
            }
        } else {
            rendererStrategy.setAttribute(this[0], attrName, value);
        }
        return this;
    };
    initRender.prototype.removeAttr = function(attrName) {
        this[0] && rendererStrategy.setAttribute(this[0], attrName, null);
        return this;
    };
    initRender.prototype.prop = function(propName, value) {
        if(!this[0]) return this;
        if(typeof propName === "string" && arguments.length === 1) {
            return this[0][propName];
        } else if(typeUtils.isPlainObject(propName)) {
            for(var key in propName) {
                this.prop(key, propName[key]);
            }
        } else {
            rendererStrategy.setProperty(this[0], propFix[propName] || propName, value);
        }

        return this;
    };
    initRender.prototype.removeProp = function(propName) {
        this[0] && rendererStrategy.setProperty(this[0], propName, null);
        return this;
    };
    initRender.prototype.addClass = function(className) {
        return this.toggleClass(className, true);
    };
    initRender.prototype.removeClass = function(className) {
        return this.toggleClass(className, false);
    };
    initRender.prototype.hasClass = function(className) {
        if(!this[0] || this[0].className === undefined) return false;

        var classNames = className.split(" ");
        for(var i = 0; i < classNames.length; i++) {
            if(this[0].classList) {
                if(this[0].classList.contains(classNames[i])) return true;
            } else { //IE9
                if(this[0].className.split(" ").indexOf(classNames[i]) >= 0) return true;
            }
        }
        return false;
    };
    initRender.prototype.toggleClass = function(className, value) {
        if(this.length > 1) {
            return repeatMethod.call(this, "toggleClass", arguments);
        }

        if(!this[0] || !className) return this;
        value = value === undefined ? !this.hasClass(className) : value;

        var classNames = className.split(" ");
        for(var i = 0; i < classNames.length; i++) {
            rendererStrategy.setClass(this[0], classNames[i], value);
        }
        return this;
    };

    var prepareTextElement = function(text) {
        var element;
        text = text.trimLeft(); //jsrender
        if(text.indexOf("<") >= 0 || text.indexOf("&") >= 0) {
            if(text[0] === "<" && text[text.length - 1] === ">") {
                element = renderer(text);
            } else {
                var container = rendererStrategy.createElement("div");
                container.innerHTML = text;
                element = renderer(container.childNodes);
            }
        } else {
            element = renderer(rendererStrategy.createElement("#text", text));
        }
        return element;
    };
    initRender.prototype.prepend = function(element) {
        var i;
        //dxDataGrid rtlEnabled
        if(arguments.length > 1) {
            for(i = 0; i < arguments.length; i++) {
                this.prepend(arguments[i]);
            }
            return this;
        }
        if(typeof element === "string") {
            element = prepareTextElement(element); //dxDataGrid rtlEnabled
        }
        //dxList
        if(Array.isArray(element) || (element && element.jquery && element.length > 1)) {
            for(i = 0; i < element.length; i++) {
                this.prepend(element[i]);
            }
            return this;
        }
        if(element && this[0]) {
            if(!element.$element) {
                element = renderer(element);
            }
            if(this[0].tagName === "TABLE" && element && element[0] && element[0].tagName === "TR") {
                var tbody = this.children("tbody");
                if(!tbody.length) {
                    tbody = renderer("<tbody>");
                    tbody.appendTo(this);
                }
                return renderer(tbody.eq(0)).prepend(element);
            }
            rendererStrategy.insertElement(this[0], element[0], this[0].firstChild);
        }
        return this;
    };
    initRender.prototype.append = function(element) {
        var i;
        if(arguments.length > 1) {
            for(i = 0; i < arguments.length; i++) {
                this.append(arguments[i]);
            }
            return this;
        }
        if(typeof element === "number") {
            element = element.toString();
        }
        if(typeof element === "string") {
            element = prepareTextElement(element);
        }
        if(Array.isArray(element) || (element && element.jquery && element.length > 1)) {
            for(i = 0; i < element.length; i++) {
                this.append(element[i]);
            }
            return this;
        }
        if(element) {
            if(!element.$element) {
                element = renderer(element);
            }
            if(this[0] && this[0].tagName === "TABLE" && element && element[0] && element[0].tagName === "TR") {
                var tbody = this.children("tbody");
                if(!tbody.length) {
                    tbody = renderer("<tbody>");
                    tbody.appendTo(this);
                }
                return renderer(tbody.eq(0)).append(element);
            }
            if(element[0] && element[0].nodeType) { //for html method
                rendererStrategy.insertElement(this[0], element[0]);
            }
        }
        return this;
    };
    initRender.prototype.prependTo = function(element) {
        if(!element.$element) {
            element = renderer(element);
        }

        if(element[0] && element[0].tagName === "TABLE" && this[0] && this[0].tagName === "TR") {
            element = element.children("tbody");
        }

        if(element[0]) {
            rendererStrategy.insertElement(element[0], this[0], element[0].firstChild);
        }

        return this;
    };
    initRender.prototype.appendTo = function(element) {
        if(this.length > 1) return repeatMethod.call(this, "appendTo", arguments);

        if(!element.$element) {
            element = renderer(element);
        }

        rendererStrategy.insertElement(element[0], this[0]);
        return this;
    };

    initRender.prototype.insertBefore = function(element) {
        if(element && element[0]) {
            rendererStrategy.insertElement(element[0].parentNode, this[0], element[0]);
        }
        return this;
    };

    initRender.prototype.insertAfter = function(element) {
        if(element && element[0]) {
            rendererStrategy.insertElement(element[0].parentNode, this[0], element[0].nextSibling);
        }
        return this;
    };

    initRender.prototype.before = function(element) {
        if(this[0]) {
            rendererStrategy.insertElement(this[0].parentNode, element[0], this[0]);
        }
        return this;
    };

    initRender.prototype.after = function(element) {
        if(this[0]) {
            rendererStrategy.insertElement(this[0].parentNode, element[0], this[0].nextSibling);
        }
        return this;
    };

    initRender.prototype.wrap = function(wrapper) {
        if(this[0]) {
            var wrap = renderer(wrapper, this[0].ownerDocument).eq(0).clone();

            if(this[0].parentNode) {
                wrap.insertBefore(renderer(this[0]));
            }

            wrap.append(this);
        }

        return this;
    };

    initRender.prototype.wrapInner = function(wrapper) {
        var contents = this.contents();

        if(contents.length) {
            contents.wrap(wrapper);
        } else {
            this.append(wrapper);
        }

        return this;
    };

    initRender.prototype.replaceWith = function(element) {
        element.insertBefore(this);
        this.remove();
        return element;
    };

    var cleanData = function(node, cleanSelf) {
        if(!node) return;

        var allChildNodes = [];

        if(typeof node.getElementsByTagName !== "undefined") {
            allChildNodes = node.getElementsByTagName("*");
        } else if(typeof node.querySelectorAll !== "undefined") {
            allChildNodes = node.querySelectorAll("*");
        }

        renderer.cleanData(allChildNodes);
        if(cleanSelf) {
            renderer.cleanData(node);
        }
    };

    initRender.prototype.remove = function() {
        if(this.length > 1) return repeatMethod.call(this, "remove", arguments);

        cleanData(this[0], true);
        rendererStrategy.removeElement(this[0]);
        return this;
    };

    initRender.prototype.detach = function() {
        if(this.length > 1) return repeatMethod.call(this, "detach", arguments);
        rendererStrategy.removeElement(this[0]);
        return this;
    };

    initRender.prototype.empty = function() {
        if(this.length > 1) return repeatMethod.call(this, "empty", arguments);
        cleanData(this[0], false);
        rendererStrategy.setText(this[0], "");
        return this;
    };

    initRender.prototype.text = function(text) {
        if(!arguments.length) {
            var result = "";
            for(var i = 0; i < this.length; i++) {
                result += this[i] && this[i].textContent || "";
            }
            return result;
        }
        cleanData(this[0], false);
        rendererStrategy.setText(this[0], text);
        return this;
    };

    initRender.prototype.has = function(target) {
        var targets = this.find(target);

        return this.filter(function() {
            for(var i = 0; i < targets.length; i++) {
                if(this.contains(targets[i])) {
                    return true;
                }
            }
        });
    };

    initRender.prototype.html = function(value) {
        if(value === undefined) {
            if(arguments.length) {
                return this;
            }
            return this[0].innerHTML;
        }

        this.empty();

        if(typeof value === "string" || typeof value === "number") {
            this[0].innerHTML = value;
        } else {
            this.append(value);
        }

        return this;
    };

    initRender.prototype.clone = function() {
        var result = [];
        for(var i = 0; i < this.length; i++) {
            result.push(this[i].cloneNode(true));
        }
        return renderer(result);
    };
    initRender.prototype.contents = function() {
        return renderer(this.$element[0] ? this.$element[0].childNodes : []);
    };

    initRender.prototype.find = function(selector) {
        var result = renderer();
        if(!selector) {
            return result;
        }

        var nodes = [],
            i;

        if(typeof selector === "string") {
            selector = selector.trim();

            for(i = 0; i < this.length; i++) {
                var element = this[i];
                if(element.nodeType === Node.ELEMENT_NODE) {
                    var elementId = element.getAttribute("id"),
                        queryId = elementId || "dx-query-children";

                    if(!elementId) {
                        rendererStrategy.setAttribute(element, "id", queryId);
                    }
                    queryId = "#" + queryId + " ";

                    var querySelector = queryId + selector.replace(",", ", " + queryId);
                    nodes.push.apply(nodes, element.querySelectorAll(querySelector));
                    rendererStrategy.setAttribute(element, "id", elementId);
                } else if(element.nodeType === Node.DOCUMENT_NODE) {
                    nodes.push.apply(nodes, element.querySelectorAll(selector));
                }
            }
        } else {
            for(i = 0; i < this.length; i++) {
                selector = selector.nodeType ? selector : selector[0];
                if(renderer.contains(this[i], selector)) {
                    nodes.push(selector);
                }
            }
        }

        return result.add(nodes);
    };

    var isVisible = function(_, element) {
        if(!element.nodeType) return true;
        return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    };

    var PSEUDOS = {
        "visible": function() {
            return isVisible;
        },
        "hidden": function() {
            return function(index, element) { return !isVisible(index, element); };
        },
        "last": function(length) {
            return function(index) {
                return index === length - 1;
            };
        }
    };
    initRender.prototype.filter = function(selector) {
        var isString = typeof selector === "string";
        var i;
        var result = [];
        if(!selector) {
            return renderer();
        }

        if(isString && selector.indexOf(",") > -1) {
            selector = selector.split(",");
            for(i = 0; i < selector.length; i++) {
                [].push.apply(result, this.filter(selector[i]).toArray());
            }
            return renderer(result);
        }

        for(var key in PSEUDOS) {
            var pseudoIndex = isString ? selector.indexOf(":" + key) : -1;
            if(pseudoIndex > -1) {
                var text = "";
                var endIndex;
                if(key === "last") {
                    text = this.length;
                } else if(selector[pseudoIndex + key.length + 1] === "(") {
                    endIndex = selector.indexOf(")", pseudoIndex);
                    text = selector.substr(pseudoIndex + key.length + 2, endIndex - pseudoIndex - key.length - 2);
                } else {
                    endIndex = pseudoIndex + key.length;
                }
                var prevSelector = selector.substr(0, pseudoIndex);
                result = prevSelector ? this.filter(prevSelector) : this;
                result = result.filter(PSEUDOS[key](text));
                if(selector.length > endIndex + 1) {
                    result = result.filter(selector.substr(endIndex + 1));
                }

                return result;
            }
        }

        for(i = 0; i < this.length; i++) {
            if(selector.jquery) {
                for(var j = 0; j < selector.length; j++) {
                    selector[j] === this[i] && result.push(this[i]);
                }
            } else if(selector.nodeType || isWindow(selector)) {
                selector === this[i] && result.push(this[i]);
            } else if((typeof selector === "function" ? selector.apply(this[i], [i, this[i]]) : this[i].nodeType === 1 && this[i].matches(selector))) {
                result.push(this[i]);
            }
        }
        result = renderer(result);

        return result;
    };

    initRender.prototype.not = function(selector) {
        var result = [],
            exceptElements;

        if(typeof selector === "string" || typeof selector === "function") {
            exceptElements = this.filter(selector).toArray();
        } else { //dxDataGrid
            exceptElements = renderer(selector).toArray();
        }

        for(var i = 0; i < this.length; i++) {
            if(exceptElements.indexOf(this[i]) < 0) {
                result.push(this[i]);
            }
        }
        return renderer(result);
    };

    initRender.prototype.is = function(selector) {
        return !!this.filter(selector).length;
    };

    initRender.prototype.children = function(selector) {
        var result = [],
            childNodes;

        for(var index = 0; index < this.length; index++) {
            childNodes = this[index] ? this[index].childNodes : [];
            for(var childIndex = 0; childIndex < childNodes.length; childIndex++) {
                if(childNodes[childIndex].nodeType === 1) {
                    result.push(childNodes[childIndex]);
                }
            }
        }

        result = renderer(result);
        if(selector) {
            result = result.filter(selector);
        }

        return result;
    };

    initRender.prototype.siblings = function() {
        var element = this[0];
        if(!element || !element.parentNode) {
            return renderer();
        }

        var result = [],
            parentChildNodes = element.parentNode.childNodes || [];

        for(var i = 0; i < parentChildNodes.length; i++) {
            var node = parentChildNodes[i];
            if(node.nodeType === Node.ELEMENT_NODE && node !== element) {
                result.push(node);
            }
        }

        return renderer(result);
    };

    initRender.prototype.get = function(index) {
        return this[index < 0 ? this.length + index : index];
    };
    initRender.prototype.index = function(element) {
        if(!element) {
            return this.parent().children().index(this);
        }
        if(element && element.nodeType) element = renderer(element);
        return this.toArray().indexOf(element[0]);
    };

    initRender.prototype.eq = function(index) {
        index = index < 0 ? this.length + index : index;
        return renderer(index < this.length ? this[index] : []);
    };

    initRender.prototype.first = function() {
        return this.eq(0);
    };

    initRender.prototype.last = function() {
        return this.eq(-1);
    };
    initRender.prototype.each = function(callback) {
        return renderer.each(this, callback);
    };

    initRender.prototype.parent = function(selector) {
        if(!this[0]) return renderer();
        var result = renderer(this[0].parentNode);
        return !selector || result.is(selector) ? result : renderer();
    };

    initRender.prototype.parents = function(selector) {
        var result = [],
            parent = this.parent();

        while(parent && parent[0] && parent[0].nodeType !== Node.DOCUMENT_NODE) {
            if(parent[0].nodeType === Node.ELEMENT_NODE) {
                if(!selector || (selector && parent.is(selector))) {
                    result.push(parent.get(0));
                }
            }
            parent = parent.parent();
        }
        return renderer(result);
    };

    initRender.prototype.closest = function(selector) {
        if(this.is(selector)) {
            return this;
        }

        var parent = this.parent();
        while(parent && parent.length) {
            if(parent.is(selector)) {
                return parent;
            }
            parent = parent.parent();
        }

        return renderer();
    };

    initRender.prototype.next = function(selector) {
        if(!this[0]) return renderer();
        var next = renderer(this[0].nextSibling);
        if(!arguments.length) {
            return next;
        }
        while(next && next.length) {
            if(next.is(selector)) return next;
            next = next.next();
        }
        return renderer();
    };

    initRender.prototype.prev = function() {
        if(!this[0]) return renderer();
        return renderer(this[0].previousSibling);
    };

    initRender.prototype.add = function(selector) {
        var targets = renderer(selector),
            result = this.toArray();

        for(var i = 0; i < targets.length; i++) {
            var target = targets[i];
            if(result.indexOf(target) === -1) {
                result.push(target);
            }
        }

        return renderer(result);
    };

    var emptyArray = [];
    initRender.prototype.splice = function() {
        return renderer(emptyArray.splice.apply(this, arguments));
    };
    initRender.prototype.slice = function() {
        return renderer(emptyArray.slice.apply(this, arguments));
    };
    initRender.prototype.toArray = function() {
        return emptyArray.slice.call(this);
    };

    var getWindow = function(element) {
        return isWindow(element) ? element : element.nodeType === 9 && element.defaultView;
    };

    initRender.prototype.offset = function(options) {
        if(!this[0]) return;

        if(arguments.length) {
            if(options === undefined) {
                return this;
            }

            var position = this.css("position");
            if(position === "static") {
                this[0].style.position = "relative";
            }

            var offset = this.offset(),
                cssTop = this.css("top"),
                cssLeft = this.css("left");

            var calculatePosition = (position === "absolute" || position === "fixed") &&
                (cssTop === "auto" || cssLeft === "auto");

            var left, top;
            if(calculatePosition) {
                var pos = this.position();
                top = pos.top;
                left = pos.left;
            } else {
                top = parseFloat(cssTop) || 0;
                left = parseFloat(cssLeft) || 0;
            }

            var props = {};
            if(options.top != null) {
                props.top = (options.top - offset.top) + top;
            }
            if(options.left != null) {
                props.left = (options.left - offset.left) + left;
            }

            return this.css(props);
        }

        var rect = this[0].getBoundingClientRect();
        if(rect.width || rect.height) {
            var win = getWindow(this[0].ownerDocument),
                docElem = this[0].ownerDocument.documentElement;

            return {
                top: rect.top + win.pageYOffset - docElem.clientTop,
                left: rect.left + win.pageXOffset - docElem.clientLeft
            };
        }

        return rect;
    };

    initRender.prototype.offsetParent = function() {
        if(!this[0]) return renderer();
        return renderer(this[0].offsetParent || document.documentElement);
    };

    initRender.prototype.position = function() {
        if(!this[0]) return;

        var offsetParent, offset,
            parentOffset = { top: 0, left: 0 };

        if(this.css("position") === "fixed") {
            offset = this[0].getBoundingClientRect();
        } else {
            offsetParent = this.offsetParent();
            offset = this.offset();
            if(offsetParent[0].nodeName !== "HTML") {
                parentOffset = offsetParent.offset();
            }

            parentOffset = {
                top: parentOffset.top + parseFloat(offsetParent.css("borderTopWidth")),
                left: parentOffset.left + parseFloat(offsetParent.css("borderLeftWidth"))
            };
        }

        return {
            top: offset.top - parentOffset.top - parseFloat(this.css("marginTop")),
            left: offset.left - parentOffset.left - parseFloat(this.css("marginLeft"))
        };
    };

    var getWidthOrHeight = function(element, funcName, includePaddings, includeBorders, includeMargins) {
        var beforeName = funcName === "width" ? "Left" : "Top";
        var afterName = funcName === "width" ? "Right" : "Bottom";

        var styles = window.getComputedStyle(element);
        var padding = (parseFloat(styles["padding" + beforeName]) || 0) + (parseFloat(styles["padding" + afterName]) || 0);
        var border = (parseFloat(styles["border" + beforeName + "Width"]) || 0) + (parseFloat(styles["border" + afterName + "Width"]) || 0);
        var isBorderBox = styles.boxSizing === "border-box";
        var needSwap = styles.display === "none" && (!element.getClientRects().length || !element.getBoundingClientRect().width);

        var oldDisplay = element.style.display;
        var oldPosition = element.style.position;

        if(needSwap) {
            element.style.display = "block";
            element.style.position = "absolute";
        }

        var result = element.getClientRects().length ? element.getBoundingClientRect()[funcName] : 0;
        if(result <= 0) {
            result = parseFloat(styles[funcName] || element.style[funcName]) || 0;
            if(isBorderBox && styles[funcName].length && styles[funcName][styles[funcName].length - 1] !== "%") {
                result -= padding + border;
            }
        } else {
            result -= padding + border;
        }

        if(needSwap) {
            element.style.display = oldDisplay;
            element.style.position = oldPosition;
        }

        if(includePaddings) {
            result += padding;
        }

        if(includeBorders) {
            result += border;
        }

        if(includeBorders && includeMargins) {
            result += (parseFloat(styles["margin" + beforeName]) || 0) + (parseFloat(styles["margin" + afterName]) || 0);
        }

        return result;
    };

    ["width", "height", "outerWidth", "outerHeight", "innerWidth", "innerHeight"].forEach(function(funcName) {
        var name = funcName.toLowerCase().indexOf("width") >= 0 ? "Width" : "Height";
        var type = name.toLowerCase();
        var isOuter = funcName.indexOf("outer") === 0;
        var isInner = funcName.indexOf("inner") === 0;
        var originalFunc = $.fn[funcName];

        initRender.prototype[funcName] = function(value) {
            if(originalFunc !== $.fn[funcName]) {
                return $.fn[funcName].apply(this, arguments);
            }
            var element = this[0];

            if(!element) return;

            if(isWindow(element)) {
                return isOuter ? element["inner" + name] : element.document.documentElement["client" + name];
            }
            if(element.nodeType === 9) {
                var documentElement = element.documentElement;

                return Math.max(
                    element.body["scroll" + name],
                    element.body["offset" + name],
                    documentElement["scroll" + name],
                    documentElement["offset" + name],
                    documentElement["client" + name]
                );
            }

            if(arguments.length === 0 || typeof value === "boolean") {
                return getWidthOrHeight(element, type, isInner || isOuter, isOuter, value);
            }

            if(value === undefined || value === null) {
                return this;
            }

            if(funcName.indexOf("outer") === 0) {
                return this.$element[funcName](value);
            }

            for(var i = 0; i < this.length; i++) {
                rendererStrategy.setStyle(this[i], funcName, value + (isNumeric(value) ? "px" : ""));
            }

            return this;
        };
    });

    ["scrollLeft", "scrollTop"].forEach(function(funcName) {
        var isScrollTop = funcName === "scrollTop",
            windowFuncName = isScrollTop ? "pageYOffset" : "pageXOffset",
            originalFunc = $.fn[funcName];

        initRender.prototype[funcName] = function(value) {
            if(originalFunc !== $.fn[funcName]) {
                return $.fn[funcName].apply(this, arguments);
            }

            var element = this[0];

            if(!element) return;

            var window = getWindow(element);

            if(value === undefined) {
                return window ? window[windowFuncName] : element[funcName];
            }

            if(window) {
                window.scrollTo(!isScrollTop ? value : window.pageXOffset, isScrollTop ? value : window.pageYOffset);
            } else {
                element[funcName] = value;
            }
            return this;
        };
    });

    var cssNamesMap = {
        "pointer-events": "pointerEvents",
        "margin-top": "marginTop",
        "margin-bottom": "marginBottom",
        "padding-top": "paddingTop",
        "min-width": "minWidth",
        "max-width": "maxWidth",
        "min-height": "minHeight",
        "max-height": "maxHeight"
    };

    var cssHooks = {};
    ["height", "minHeight", "maxHeight", "width", "maxWidth", "minWidth", "flexBasis"].forEach(function(funcName) {
        cssHooks[funcName] = function(element, value) {
            if(typeof value === "function") value = value();
            if(value < 0) value = 0;
            element.style[funcName] = value + (isNumeric(value) ? "px" : "");
        };
    });

    ["marginLeft", "marginTop", "marginRight", "marginBottom", "top", "left", "right", "bottom", "paddingTop", "paddingRight", "paddingLeft", "paddingBottom"].forEach(function(funcName) {
        cssHooks[funcName] = function(element, value) {
            element.style[funcName] = value + (isNumeric(value) ? "px" : "");
        };
    });

    var originalCssFunc;
    initRender.prototype.css = originalCssFunc = function(name, value) {
        if(this.css !== originalCssFunc) {
            return this.$element.css.apply(this, arguments);
        }

        if(typeof name === "string" && arguments.length === 1) {
            name = cssNamesMap[name] || name;
            return this[0] ? (window.getComputedStyle(this[0])[name] || this[0].style[name]) : undefined;
        } else if(typeof name === "string" && arguments.length === 2) {
            if(!this[0] || !this[0].style) return this;
            name = cssNamesMap[name] || name;

            for(var i = 0; i < this.length; i++) {
                if(cssHooks[name]) {
                    cssHooks[name](this[i], value);
                } else {
                    this[i].style[name] = value;
                }
            }
        } else if(typeUtils.isPlainObject(name)) {
            for(var key in name) {
                this.css(key, name[key]);
            }
        }

        return this;
    };

    initRender.prototype.data = function(key, value) {
        var element = this[0],
            result = renderer.data.apply(renderer, [element].concat(Array.prototype.slice.call(arguments)));

        return arguments.length < 2 ? result : this;
    };

    initRender.prototype.removeData = function(key) {
        renderer.removeData(this[0], key);

        return this;
    };


    var originalJQueryCleanData = $.cleanData;

    $.cleanData = function(element) {
        var result = originalJQueryCleanData.apply(this, arguments);

        for(var i = 0; i < $(element).length; i++) {
            renderer.removeData($(element)[i]);
        }

        return result;
    };
}

renderer.ajax = function() {
    return $.ajax.apply(this, arguments);
};
renderer.getJSON = $.getJSON;
renderer.getScript = $.getScript;
renderer.parseXML = $.parseXML;
renderer.attr = $.attr;
renderer.tmpl = function() {
    return $.tmpl.apply(this, arguments);
};
renderer.templates = function() {
    return $.templates.apply(this, arguments);
};
renderer.merge = $.merge;
renderer.param = $.param;
renderer.now = $.now;
renderer._data = $._data;
renderer.data = function(element, key, value) {
    if(!renderer(element).length) return;

    var elementData = dataMap.get(element);

    if(!elementData) {
        // TODO: Get rid of jQuery in native strategy and replace this line with `elementData = {};`
        elementData = $.data(element);
        dataMap.set(element, elementData);
    }

    if(key === undefined) {
        return elementData;
    }

    if(arguments.length === 2) {
        return elementData[key];
    }

    elementData[key] = value;
    // TODO: replace all kebab-case data keys in DevExtreme with camelCase and remove this line
    $(element).data(key, value);

    return value;
};
renderer.removeData = function(element, key) {
    if(!renderer(element).length) return;

    // TODO: Get rid of jQuery in native strategy and remove this line
    $(element).removeData(key);

    if(key === undefined) {
        dataMap.delete(element);
    } else {
        var elementData = dataMap.get(element);
        if(elementData) {
            delete elementData[key];
        }
    }
};

renderer.cleanData = function(element) {
    return $.cleanData($(element));
};
renderer.when = $.when;
renderer.trim = $.trim;
renderer.event = $.event;
renderer.Event = $.Event;
renderer.easing = $.easing;
renderer.holdReady = $.holdReady || $.fn.holdReady;
renderer.makeArray = $.makeArray;
renderer.contains = $.contains;
renderer.Callbacks = $.Callbacks;
renderer.Deferred = $.Deferred;
renderer.map = $.map;
renderer.each = $.each;

module.exports = useJQueryRenderer ? $ : renderer;
