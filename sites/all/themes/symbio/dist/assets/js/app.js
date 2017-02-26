'use strict';

window.whatInput = function () {

  'use strict';

  /*
    ---------------
    variables
    ---------------
  */

  // array of actively pressed keys

  var activeKeys = [];

  // cache document.body
  var body;

  // boolean: true if touch buffer timer is running
  var buffer = false;

  // the last used input type
  var currentInput = null;

  // `input` types that don't accept text
  var nonTypingInputs = ['button', 'checkbox', 'file', 'image', 'radio', 'reset', 'submit'];

  // detect version of mouse wheel event to use
  // via https://developer.mozilla.org/en-US/docs/Web/Events/wheel
  var mouseWheel = detectWheel();

  // list of modifier keys commonly used with the mouse and
  // can be safely ignored to prevent false keyboard detection
  var ignoreMap = [16, // shift
  17, // control
  18, // alt
  91, // Windows key / left Apple cmd
  93 // Windows menu / right Apple cmd
  ];

  // mapping of events to input types
  var inputMap = {
    'keydown': 'keyboard',
    'keyup': 'keyboard',
    'mousedown': 'mouse',
    'mousemove': 'mouse',
    'MSPointerDown': 'pointer',
    'MSPointerMove': 'pointer',
    'pointerdown': 'pointer',
    'pointermove': 'pointer',
    'touchstart': 'touch'
  };

  // add correct mouse wheel event mapping to `inputMap`
  inputMap[detectWheel()] = 'mouse';

  // array of all used input types
  var inputTypes = [];

  // mapping of key codes to a common name
  var keyMap = {
    9: 'tab',
    13: 'enter',
    16: 'shift',
    27: 'esc',
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  // map of IE 10 pointer events
  var pointerMap = {
    2: 'touch',
    3: 'touch', // treat pen like touch
    4: 'mouse'
  };

  // touch buffer timer
  var timer;

  /*
    ---------------
    functions
    ---------------
  */

  // allows events that are also triggered to be filtered out for `touchstart`
  function eventBuffer() {
    clearTimer();
    setInput(event);

    buffer = true;
    timer = window.setTimeout(function () {
      buffer = false;
    }, 650);
  }

  function bufferedEvent(event) {
    if (!buffer) setInput(event);
  }

  function unBufferedEvent(event) {
    clearTimer();
    setInput(event);
  }

  function clearTimer() {
    window.clearTimeout(timer);
  }

  function setInput(event) {
    var eventKey = key(event);
    var value = inputMap[event.type];
    if (value === 'pointer') value = pointerType(event);

    // don't do anything if the value matches the input type already set
    if (currentInput !== value) {
      var eventTarget = target(event);
      var eventTargetNode = eventTarget.nodeName.toLowerCase();
      var eventTargetType = eventTargetNode === 'input' ? eventTarget.getAttribute('type') : null;

      if ( // only if the user flag to allow typing in form fields isn't set
      !body.hasAttribute('data-whatinput-formtyping') &&

      // only if currentInput has a value
      currentInput &&

      // only if the input is `keyboard`
      value === 'keyboard' &&

      // not if the key is `TAB`
      keyMap[eventKey] !== 'tab' && (

      // only if the target is a form input that accepts text
      eventTargetNode === 'textarea' || eventTargetNode === 'select' || eventTargetNode === 'input' && nonTypingInputs.indexOf(eventTargetType) < 0) ||
      // ignore modifier keys
      ignoreMap.indexOf(eventKey) > -1) {
        // ignore keyboard typing
      } else {
        switchInput(value);
      }
    }

    if (value === 'keyboard') logKeys(eventKey);
  }

  function switchInput(string) {
    currentInput = string;
    body.setAttribute('data-whatinput', currentInput);

    if (inputTypes.indexOf(currentInput) === -1) inputTypes.push(currentInput);
  }

  function key(event) {
    return event.keyCode ? event.keyCode : event.which;
  }

  function target(event) {
    return event.target || event.srcElement;
  }

  function pointerType(event) {
    if (typeof event.pointerType === 'number') {
      return pointerMap[event.pointerType];
    } else {
      return event.pointerType === 'pen' ? 'touch' : event.pointerType; // treat pen like touch
    }
  }

  // keyboard logging
  function logKeys(eventKey) {
    if (activeKeys.indexOf(keyMap[eventKey]) === -1 && keyMap[eventKey]) activeKeys.push(keyMap[eventKey]);
  }

  function unLogKeys(event) {
    var eventKey = key(event);
    var arrayPos = activeKeys.indexOf(keyMap[eventKey]);

    if (arrayPos !== -1) activeKeys.splice(arrayPos, 1);
  }

  function bindEvents() {
    body = document.body;

    // pointer events (mouse, pen, touch)
    if (window.PointerEvent) {
      body.addEventListener('pointerdown', bufferedEvent);
      body.addEventListener('pointermove', bufferedEvent);
    } else if (window.MSPointerEvent) {
      body.addEventListener('MSPointerDown', bufferedEvent);
      body.addEventListener('MSPointerMove', bufferedEvent);
    } else {

      // mouse events
      body.addEventListener('mousedown', bufferedEvent);
      body.addEventListener('mousemove', bufferedEvent);

      // touch events
      if ('ontouchstart' in window) {
        body.addEventListener('touchstart', eventBuffer);
      }
    }

    // mouse wheel
    body.addEventListener(mouseWheel, bufferedEvent);

    // keyboard events
    body.addEventListener('keydown', unBufferedEvent);
    body.addEventListener('keyup', unBufferedEvent);
    document.addEventListener('keyup', unLogKeys);
  }

  /*
    ---------------
    utilities
    ---------------
  */

  // detect version of mouse wheel event to use
  // via https://developer.mozilla.org/en-US/docs/Web/Events/wheel
  function detectWheel() {
    return mouseWheel = 'onwheel' in document.createElement('div') ? 'wheel' : // Modern browsers support "wheel"

    document.onmousewheel !== undefined ? 'mousewheel' : // Webkit and IE support at least "mousewheel"
    'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox
  }

  /*
    ---------------
    init
     don't start script unless browser cuts the mustard,
    also passes if polyfills are used
    ---------------
  */

  if ('addEventListener' in window && Array.prototype.indexOf) {

    // if the dom is already ready already (script was placed at bottom of <body>)
    if (document.body) {
      bindEvents();

      // otherwise wait for the dom to load (script was placed in the <head>)
    } else {
      document.addEventListener('DOMContentLoaded', bindEvents);
    }
  }

  /*
    ---------------
    api
    ---------------
  */

  return {

    // returns string: the current input type
    ask: function ask() {
      return currentInput;
    },

    // returns array: currently pressed keys
    keys: function keys() {
      return activeKeys;
    },

    // returns array: all the detected input types
    types: function types() {
      return inputTypes;
    },

    // accepts string: manually set the input type
    set: switchInput
  };
}();
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

!function ($) {

  "use strict";

  var FOUNDATION_VERSION = '6.2.4';

  // Global Foundation object
  // This is attached to the window, or used as a module for AMD/Browserify
  var Foundation = {
    version: FOUNDATION_VERSION,

    /**
     * Stores initialized plugins.
     */
    _plugins: {},

    /**
     * Stores generated unique ids for plugin instances
     */
    _uuids: [],

    /**
     * Returns a boolean for RTL support
     */
    rtl: function rtl() {
      return $('html').attr('dir') === 'rtl';
    },
    /**
     * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
     * @param {Object} plugin - The constructor of the plugin.
     */
    plugin: function plugin(_plugin, name) {
      // Object key to use when adding to global Foundation object
      // Examples: Foundation.Reveal, Foundation.OffCanvas
      var className = name || functionName(_plugin);
      // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
      // Examples: data-reveal, data-off-canvas
      var attrName = hyphenate(className);

      // Add to the Foundation object and the plugins list (for reflowing)
      this._plugins[attrName] = this[className] = _plugin;
    },
    /**
     * @function
     * Populates the _uuids array with pointers to each individual plugin instance.
     * Adds the `zfPlugin` data-attribute to programmatically created plugins to allow use of $(selector).foundation(method) calls.
     * Also fires the initialization event for each plugin, consolidating repetitive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @param {String} name - the name of the plugin, passed as a camelCased string.
     * @fires Plugin#init
     */
    registerPlugin: function registerPlugin(plugin, name) {
      var pluginName = name ? hyphenate(name) : functionName(plugin.constructor).toLowerCase();
      plugin.uuid = this.GetYoDigits(6, pluginName);

      if (!plugin.$element.attr('data-' + pluginName)) {
        plugin.$element.attr('data-' + pluginName, plugin.uuid);
      }
      if (!plugin.$element.data('zfPlugin')) {
        plugin.$element.data('zfPlugin', plugin);
      }
      /**
       * Fires when the plugin has initialized.
       * @event Plugin#init
       */
      plugin.$element.trigger('init.zf.' + pluginName);

      this._uuids.push(plugin.uuid);

      return;
    },
    /**
     * @function
     * Removes the plugins uuid from the _uuids array.
     * Removes the zfPlugin data attribute, as well as the data-plugin-name attribute.
     * Also fires the destroyed event for the plugin, consolidating repetitive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @fires Plugin#destroyed
     */
    unregisterPlugin: function unregisterPlugin(plugin) {
      var pluginName = hyphenate(functionName(plugin.$element.data('zfPlugin').constructor));

      this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
      plugin.$element.removeAttr('data-' + pluginName).removeData('zfPlugin')
      /**
       * Fires when the plugin has been destroyed.
       * @event Plugin#destroyed
       */
      .trigger('destroyed.zf.' + pluginName);
      for (var prop in plugin) {
        plugin[prop] = null; //clean up script to prep for garbage collection.
      }
      return;
    },

    /**
     * @function
     * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
     * @param {String} plugins - optional string of an individual plugin key, attained by calling `$(element).data('pluginName')`, or string of a plugin class i.e. `'dropdown'`
     * @default If no argument is passed, reflow all currently active plugins.
     */
    reInit: function reInit(plugins) {
      var isJQ = plugins instanceof $;
      try {
        if (isJQ) {
          plugins.each(function () {
            $(this).data('zfPlugin')._init();
          });
        } else {
          var type = typeof plugins === 'undefined' ? 'undefined' : _typeof(plugins),
              _this = this,
              fns = {
            'object': function object(plgs) {
              plgs.forEach(function (p) {
                p = hyphenate(p);
                $('[data-' + p + ']').foundation('_init');
              });
            },
            'string': function string() {
              plugins = hyphenate(plugins);
              $('[data-' + plugins + ']').foundation('_init');
            },
            'undefined': function undefined() {
              this['object'](Object.keys(_this._plugins));
            }
          };
          fns[type](plugins);
        }
      } catch (err) {
        console.error(err);
      } finally {
        return plugins;
      }
    },

    /**
     * returns a random base-36 uid with namespacing
     * @function
     * @param {Number} length - number of random base-36 digits desired. Increase for more random strings.
     * @param {String} namespace - name of plugin to be incorporated in uid, optional.
     * @default {String} '' - if no plugin name is provided, nothing is appended to the uid.
     * @returns {String} - unique id
     */
    GetYoDigits: function GetYoDigits(length, namespace) {
      length = length || 6;
      return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1) + (namespace ? '-' + namespace : '');
    },
    /**
     * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
     * @param {Object} elem - jQuery object containing the element to check inside. Also checks the element itself, unless it's the `document` object.
     * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
     */
    reflow: function reflow(elem, plugins) {

      // If plugins is undefined, just grab everything
      if (typeof plugins === 'undefined') {
        plugins = Object.keys(this._plugins);
      }
      // If plugins is a string, convert it to an array with one item
      else if (typeof plugins === 'string') {
          plugins = [plugins];
        }

      var _this = this;

      // Iterate through each plugin
      $.each(plugins, function (i, name) {
        // Get the current plugin
        var plugin = _this._plugins[name];

        // Localize the search to all elements inside elem, as well as elem itself, unless elem === document
        var $elem = $(elem).find('[data-' + name + ']').addBack('[data-' + name + ']');

        // For each plugin found, initialize it
        $elem.each(function () {
          var $el = $(this),
              opts = {};
          // Don't double-dip on plugins
          if ($el.data('zfPlugin')) {
            console.warn("Tried to initialize " + name + " on an element that already has a Foundation plugin.");
            return;
          }

          if ($el.attr('data-options')) {
            var thing = $el.attr('data-options').split(';').forEach(function (e, i) {
              var opt = e.split(':').map(function (el) {
                return el.trim();
              });
              if (opt[0]) opts[opt[0]] = parseValue(opt[1]);
            });
          }
          try {
            $el.data('zfPlugin', new plugin($(this), opts));
          } catch (er) {
            console.error(er);
          } finally {
            return;
          }
        });
      });
    },
    getFnName: functionName,
    transitionend: function transitionend($elem) {
      var transitions = {
        'transition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'otransitionend'
      };
      var elem = document.createElement('div'),
          end;

      for (var t in transitions) {
        if (typeof elem.style[t] !== 'undefined') {
          end = transitions[t];
        }
      }
      if (end) {
        return end;
      } else {
        end = setTimeout(function () {
          $elem.triggerHandler('transitionend', [$elem]);
        }, 1);
        return 'transitionend';
      }
    }
  };

  Foundation.util = {
    /**
     * Function for applying a debounce effect to a function call.
     * @function
     * @param {Function} func - Function to be called at end of timeout.
     * @param {Number} delay - Time in ms to delay the call of `func`.
     * @returns function
     */
    throttle: function throttle(func, delay) {
      var timer = null;

      return function () {
        var context = this,
            args = arguments;

        if (timer === null) {
          timer = setTimeout(function () {
            func.apply(context, args);
            timer = null;
          }, delay);
        }
      };
    }
  };

  // TODO: consider not making this a jQuery function
  // TODO: need way to reflow vs. re-initialize
  /**
   * The Foundation jQuery method.
   * @param {String|Array} method - An action to perform on the current jQuery object.
   */
  var foundation = function foundation(method) {
    var type = typeof method === 'undefined' ? 'undefined' : _typeof(method),
        $meta = $('meta.foundation-mq'),
        $noJS = $('.no-js');

    if (!$meta.length) {
      $('<meta class="foundation-mq">').appendTo(document.head);
    }
    if ($noJS.length) {
      $noJS.removeClass('no-js');
    }

    if (type === 'undefined') {
      //needs to initialize the Foundation object, or an individual plugin.
      Foundation.MediaQuery._init();
      Foundation.reflow(this);
    } else if (type === 'string') {
      //an individual method to invoke on a plugin or group of plugins
      var args = Array.prototype.slice.call(arguments, 1); //collect all the arguments, if necessary
      var plugClass = this.data('zfPlugin'); //determine the class of plugin

      if (plugClass !== undefined && plugClass[method] !== undefined) {
        //make sure both the class and method exist
        if (this.length === 1) {
          //if there's only one, call it directly.
          plugClass[method].apply(plugClass, args);
        } else {
          this.each(function (i, el) {
            //otherwise loop through the jQuery collection and invoke the method on each
            plugClass[method].apply($(el).data('zfPlugin'), args);
          });
        }
      } else {
        //error for no class or no method
        throw new ReferenceError("We're sorry, '" + method + "' is not an available method for " + (plugClass ? functionName(plugClass) : 'this element') + '.');
      }
    } else {
      //error for invalid argument type
      throw new TypeError('We\'re sorry, ' + type + ' is not a valid parameter. You must use a string representing the method you wish to invoke.');
    }
    return this;
  };

  window.Foundation = Foundation;
  $.fn.foundation = foundation;

  // Polyfill for requestAnimationFrame
  (function () {
    if (!Date.now || !window.Date.now) window.Date.now = Date.now = function () {
      return new Date().getTime();
    };

    var vendors = ['webkit', 'moz'];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
      var vp = vendors[i];
      window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
    }
    if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
      var lastTime = 0;
      window.requestAnimationFrame = function (callback) {
        var now = Date.now();
        var nextTime = Math.max(lastTime + 16, now);
        return setTimeout(function () {
          callback(lastTime = nextTime);
        }, nextTime - now);
      };
      window.cancelAnimationFrame = clearTimeout;
    }
    /**
     * Polyfill for performance.now, required by rAF
     */
    if (!window.performance || !window.performance.now) {
      window.performance = {
        start: Date.now(),
        now: function now() {
          return Date.now() - this.start;
        }
      };
    }
  })();
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP = function fNOP() {},
          fBound = function fBound() {
        return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
      };

      if (this.prototype) {
        // native functions don't have a prototype
        fNOP.prototype = this.prototype;
      }
      fBound.prototype = new fNOP();

      return fBound;
    };
  }
  // Polyfill to get the name of a function in IE9
  function functionName(fn) {
    if (Function.prototype.name === undefined) {
      var funcNameRegex = /function\s([^(]{1,})\(/;
      var results = funcNameRegex.exec(fn.toString());
      return results && results.length > 1 ? results[1].trim() : "";
    } else if (fn.prototype === undefined) {
      return fn.constructor.name;
    } else {
      return fn.prototype.constructor.name;
    }
  }
  function parseValue(str) {
    if (/true/.test(str)) return true;else if (/false/.test(str)) return false;else if (!isNaN(str * 1)) return parseFloat(str);
    return str;
  }
  // Convert PascalCase to kebab-case
  // Thank you: http://stackoverflow.com/a/8955580
  function hyphenate(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}(jQuery);
'use strict';

!function ($) {

  Foundation.Box = {
    ImNotTouchingYou: ImNotTouchingYou,
    GetDimensions: GetDimensions,
    GetOffsets: GetOffsets
  };

  /**
   * Compares the dimensions of an element to a container and determines collision events with container.
   * @function
   * @param {jQuery} element - jQuery object to test for collisions.
   * @param {jQuery} parent - jQuery object to use as bounding container.
   * @param {Boolean} lrOnly - set to true to check left and right values only.
   * @param {Boolean} tbOnly - set to true to check top and bottom values only.
   * @default if no parent object passed, detects collisions with `window`.
   * @returns {Boolean} - true if collision free, false if a collision in any direction.
   */
  function ImNotTouchingYou(element, parent, lrOnly, tbOnly) {
    var eleDims = GetDimensions(element),
        top,
        bottom,
        left,
        right;

    if (parent) {
      var parDims = GetDimensions(parent);

      bottom = eleDims.offset.top + eleDims.height <= parDims.height + parDims.offset.top;
      top = eleDims.offset.top >= parDims.offset.top;
      left = eleDims.offset.left >= parDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= parDims.width + parDims.offset.left;
    } else {
      bottom = eleDims.offset.top + eleDims.height <= eleDims.windowDims.height + eleDims.windowDims.offset.top;
      top = eleDims.offset.top >= eleDims.windowDims.offset.top;
      left = eleDims.offset.left >= eleDims.windowDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= eleDims.windowDims.width;
    }

    var allDirs = [bottom, top, left, right];

    if (lrOnly) {
      return left === right === true;
    }

    if (tbOnly) {
      return top === bottom === true;
    }

    return allDirs.indexOf(false) === -1;
  };

  /**
   * Uses native methods to return an object of dimension values.
   * @function
   * @param {jQuery || HTML} element - jQuery object or DOM element for which to get the dimensions. Can be any element other that document or window.
   * @returns {Object} - nested object of integer pixel values
   * TODO - if element is window, return only those values.
   */
  function GetDimensions(elem, test) {
    elem = elem.length ? elem[0] : elem;

    if (elem === window || elem === document) {
      throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
    }

    var rect = elem.getBoundingClientRect(),
        parRect = elem.parentNode.getBoundingClientRect(),
        winRect = document.body.getBoundingClientRect(),
        winY = window.pageYOffset,
        winX = window.pageXOffset;

    return {
      width: rect.width,
      height: rect.height,
      offset: {
        top: rect.top + winY,
        left: rect.left + winX
      },
      parentDims: {
        width: parRect.width,
        height: parRect.height,
        offset: {
          top: parRect.top + winY,
          left: parRect.left + winX
        }
      },
      windowDims: {
        width: winRect.width,
        height: winRect.height,
        offset: {
          top: winY,
          left: winX
        }
      }
    };
  }

  /**
   * Returns an object of top and left integer pixel values for dynamically rendered elements,
   * such as: Tooltip, Reveal, and Dropdown
   * @function
   * @param {jQuery} element - jQuery object for the element being positioned.
   * @param {jQuery} anchor - jQuery object for the element's anchor point.
   * @param {String} position - a string relating to the desired position of the element, relative to it's anchor
   * @param {Number} vOffset - integer pixel value of desired vertical separation between anchor and element.
   * @param {Number} hOffset - integer pixel value of desired horizontal separation between anchor and element.
   * @param {Boolean} isOverflow - if a collision event is detected, sets to true to default the element to full width - any desired offset.
   * TODO alter/rewrite to work with `em` values as well/instead of pixels
   */
  function GetOffsets(element, anchor, position, vOffset, hOffset, isOverflow) {
    var $eleDims = GetDimensions(element),
        $anchorDims = anchor ? GetDimensions(anchor) : null;

    switch (position) {
      case 'top':
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top
        };
        break;
      case 'right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset,
          top: $anchorDims.offset.top
        };
        break;
      case 'center top':
        return {
          left: $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'center bottom':
        return {
          left: isOverflow ? hOffset : $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
        break;
      case 'center left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset + 1,
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center':
        return {
          left: $eleDims.windowDims.offset.left + $eleDims.windowDims.width / 2 - $eleDims.width / 2,
          top: $eleDims.windowDims.offset.top + $eleDims.windowDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'reveal':
        return {
          left: ($eleDims.windowDims.width - $eleDims.width) / 2,
          top: $eleDims.windowDims.offset.top + vOffset
        };
      case 'reveal full':
        return {
          left: $eleDims.windowDims.offset.left,
          top: $eleDims.windowDims.offset.top
        };
        break;
      case 'left bottom':
        return {
          left: $anchorDims.offset.left,
          top: $anchorDims.offset.top + $anchorDims.height
        };
        break;
      case 'right bottom':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset - $eleDims.width,
          top: $anchorDims.offset.top + $anchorDims.height
        };
        break;
      default:
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left + hOffset,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
    }
  }
}(jQuery);
/*******************************************
 *                                         *
 * This util was created by Marius Olbertz *
 * Please thank Marius on GitHub /owlbertz *
 * or the web http://www.mariusolbertz.de/ *
 *                                         *
 ******************************************/

'use strict';

!function ($) {

  var keyCodes = {
    9: 'TAB',
    13: 'ENTER',
    27: 'ESCAPE',
    32: 'SPACE',
    37: 'ARROW_LEFT',
    38: 'ARROW_UP',
    39: 'ARROW_RIGHT',
    40: 'ARROW_DOWN'
  };

  var commands = {};

  var Keyboard = {
    keys: getKeyCodes(keyCodes),

    /**
     * Parses the (keyboard) event and returns a String that represents its key
     * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
     * @param {Event} event - the event generated by the event handler
     * @return String key - String that represents the key pressed
     */
    parseKey: function parseKey(event) {
      var key = keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase();
      if (event.shiftKey) key = 'SHIFT_' + key;
      if (event.ctrlKey) key = 'CTRL_' + key;
      if (event.altKey) key = 'ALT_' + key;
      return key;
    },


    /**
     * Handles the given (keyboard) event
     * @param {Event} event - the event generated by the event handler
     * @param {String} component - Foundation component's name, e.g. Slider or Reveal
     * @param {Objects} functions - collection of functions that are to be executed
     */
    handleKey: function handleKey(event, component, functions) {
      var commandList = commands[component],
          keyCode = this.parseKey(event),
          cmds,
          command,
          fn;

      if (!commandList) return console.warn('Component not defined!');

      if (typeof commandList.ltr === 'undefined') {
        // this component does not differentiate between ltr and rtl
        cmds = commandList; // use plain list
      } else {
        // merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
        if (Foundation.rtl()) cmds = $.extend({}, commandList.ltr, commandList.rtl);else cmds = $.extend({}, commandList.rtl, commandList.ltr);
      }
      command = cmds[keyCode];

      fn = functions[command];
      if (fn && typeof fn === 'function') {
        // execute function  if exists
        var returnValue = fn.apply();
        if (functions.handled || typeof functions.handled === 'function') {
          // execute function when event was handled
          functions.handled(returnValue);
        }
      } else {
        if (functions.unhandled || typeof functions.unhandled === 'function') {
          // execute function when event was not handled
          functions.unhandled();
        }
      }
    },


    /**
     * Finds all focusable elements within the given `$element`
     * @param {jQuery} $element - jQuery object to search within
     * @return {jQuery} $focusable - all focusable elements within `$element`
     */
    findFocusable: function findFocusable($element) {
      return $element.find('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]').filter(function () {
        if (!$(this).is(':visible') || $(this).attr('tabindex') < 0) {
          return false;
        } //only have visible elements and those that have a tabindex greater or equal 0
        return true;
      });
    },


    /**
     * Returns the component name name
     * @param {Object} component - Foundation component, e.g. Slider or Reveal
     * @return String componentName
     */

    register: function register(componentName, cmds) {
      commands[componentName] = cmds;
    }
  };

  /*
   * Constants for easier comparing.
   * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
   */
  function getKeyCodes(kcs) {
    var k = {};
    for (var kc in kcs) {
      k[kcs[kc]] = kcs[kc];
    }return k;
  }

  Foundation.Keyboard = Keyboard;
}(jQuery);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

!function ($) {

  // Default set of media queries
  var defaultQueries = {
    'default': 'only screen',
    landscape: 'only screen and (orientation: landscape)',
    portrait: 'only screen and (orientation: portrait)',
    retina: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)'
  };

  var MediaQuery = {
    queries: [],

    current: '',

    /**
     * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
     * @function
     * @private
     */
    _init: function _init() {
      var self = this;
      var extractedStyles = $('.foundation-mq').css('font-family');
      var namedQueries;

      namedQueries = parseStyleToObject(extractedStyles);

      for (var key in namedQueries) {
        if (namedQueries.hasOwnProperty(key)) {
          self.queries.push({
            name: key,
            value: 'only screen and (min-width: ' + namedQueries[key] + ')'
          });
        }
      }

      this.current = this._getCurrentSize();

      this._watcher();
    },


    /**
     * Checks if the screen is at least as wide as a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to check.
     * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
     */
    atLeast: function atLeast(size) {
      var query = this.get(size);

      if (query) {
        return window.matchMedia(query).matches;
      }

      return false;
    },


    /**
     * Gets the media query of a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to get.
     * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
     */
    get: function get(size) {
      for (var i in this.queries) {
        if (this.queries.hasOwnProperty(i)) {
          var query = this.queries[i];
          if (size === query.name) return query.value;
        }
      }

      return null;
    },


    /**
     * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
     * @function
     * @private
     * @returns {String} Name of the current breakpoint.
     */
    _getCurrentSize: function _getCurrentSize() {
      var matched;

      for (var i = 0; i < this.queries.length; i++) {
        var query = this.queries[i];

        if (window.matchMedia(query.value).matches) {
          matched = query;
        }
      }

      if ((typeof matched === 'undefined' ? 'undefined' : _typeof(matched)) === 'object') {
        return matched.name;
      } else {
        return matched;
      }
    },


    /**
     * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
     * @function
     * @private
     */
    _watcher: function _watcher() {
      var _this = this;

      $(window).on('resize.zf.mediaquery', function () {
        var newSize = _this._getCurrentSize(),
            currentSize = _this.current;

        if (newSize !== currentSize) {
          // Change the current media query
          _this.current = newSize;

          // Broadcast the media query change on the window
          $(window).trigger('changed.zf.mediaquery', [newSize, currentSize]);
        }
      });
    }
  };

  Foundation.MediaQuery = MediaQuery;

  // matchMedia() polyfill - Test a CSS media type/query in JS.
  // Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license
  window.matchMedia || (window.matchMedia = function () {
    'use strict';

    // For browsers that support matchMedium api such as IE 9 and webkit

    var styleMedia = window.styleMedia || window.media;

    // For those that don't support matchMedium
    if (!styleMedia) {
      var style = document.createElement('style'),
          script = document.getElementsByTagName('script')[0],
          info = null;

      style.type = 'text/css';
      style.id = 'matchmediajs-test';

      script && script.parentNode && script.parentNode.insertBefore(style, script);

      // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
      info = 'getComputedStyle' in window && window.getComputedStyle(style, null) || style.currentStyle;

      styleMedia = {
        matchMedium: function matchMedium(media) {
          var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

          // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
          if (style.styleSheet) {
            style.styleSheet.cssText = text;
          } else {
            style.textContent = text;
          }

          // Test if media query is true or false
          return info.width === '1px';
        }
      };
    }

    return function (media) {
      return {
        matches: styleMedia.matchMedium(media || 'all'),
        media: media || 'all'
      };
    };
  }());

  // Thank you: https://github.com/sindresorhus/query-string
  function parseStyleToObject(str) {
    var styleObject = {};

    if (typeof str !== 'string') {
      return styleObject;
    }

    str = str.trim().slice(1, -1); // browsers re-quote string style values

    if (!str) {
      return styleObject;
    }

    styleObject = str.split('&').reduce(function (ret, param) {
      var parts = param.replace(/\+/g, ' ').split('=');
      var key = parts[0];
      var val = parts[1];
      key = decodeURIComponent(key);

      // missing `=` should be `null`:
      // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
      val = val === undefined ? null : decodeURIComponent(val);

      if (!ret.hasOwnProperty(key)) {
        ret[key] = val;
      } else if (Array.isArray(ret[key])) {
        ret[key].push(val);
      } else {
        ret[key] = [ret[key], val];
      }
      return ret;
    }, {});

    return styleObject;
  }

  Foundation.MediaQuery = MediaQuery;
}(jQuery);
'use strict';

!function ($) {

  /**
   * Motion module.
   * @module foundation.motion
   */

  var initClasses = ['mui-enter', 'mui-leave'];
  var activeClasses = ['mui-enter-active', 'mui-leave-active'];

  var Motion = {
    animateIn: function animateIn(element, animation, cb) {
      animate(true, element, animation, cb);
    },

    animateOut: function animateOut(element, animation, cb) {
      animate(false, element, animation, cb);
    }
  };

  function Move(duration, elem, fn) {
    var anim,
        prog,
        start = null;
    // console.log('called');

    function move(ts) {
      if (!start) start = window.performance.now();
      // console.log(start, ts);
      prog = ts - start;
      fn.apply(elem);

      if (prog < duration) {
        anim = window.requestAnimationFrame(move, elem);
      } else {
        window.cancelAnimationFrame(anim);
        elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
      }
    }
    anim = window.requestAnimationFrame(move);
  }

  /**
   * Animates an element in or out using a CSS transition class.
   * @function
   * @private
   * @param {Boolean} isIn - Defines if the animation is in or out.
   * @param {Object} element - jQuery or HTML object to animate.
   * @param {String} animation - CSS class to use.
   * @param {Function} cb - Callback to run when animation is finished.
   */
  function animate(isIn, element, animation, cb) {
    element = $(element).eq(0);

    if (!element.length) return;

    var initClass = isIn ? initClasses[0] : initClasses[1];
    var activeClass = isIn ? activeClasses[0] : activeClasses[1];

    // Set up the animation
    reset();

    element.addClass(animation).css('transition', 'none');

    requestAnimationFrame(function () {
      element.addClass(initClass);
      if (isIn) element.show();
    });

    // Start the animation
    requestAnimationFrame(function () {
      element[0].offsetWidth;
      element.css('transition', '').addClass(activeClass);
    });

    // Clean up the animation when it finishes
    element.one(Foundation.transitionend(element), finish);

    // Hides the element (for out animations), resets the element, and runs a callback
    function finish() {
      if (!isIn) element.hide();
      reset();
      if (cb) cb.apply(element);
    }

    // Resets transitions and removes motion-specific classes
    function reset() {
      element[0].style.transitionDuration = 0;
      element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
    }
  }

  Foundation.Move = Move;
  Foundation.Motion = Motion;
}(jQuery);
'use strict';

!function ($) {

  var Nest = {
    Feather: function Feather(menu) {
      var type = arguments.length <= 1 || arguments[1] === undefined ? 'zf' : arguments[1];

      menu.attr('role', 'menubar');

      var items = menu.find('li').attr({ 'role': 'menuitem' }),
          subMenuClass = 'is-' + type + '-submenu',
          subItemClass = subMenuClass + '-item',
          hasSubClass = 'is-' + type + '-submenu-parent';

      menu.find('a:first').attr('tabindex', 0);

      items.each(function () {
        var $item = $(this),
            $sub = $item.children('ul');

        if ($sub.length) {
          $item.addClass(hasSubClass).attr({
            'aria-haspopup': true,
            'aria-expanded': false,
            'aria-label': $item.children('a:first').text()
          });

          $sub.addClass('submenu ' + subMenuClass).attr({
            'data-submenu': '',
            'aria-hidden': true,
            'role': 'menu'
          });
        }

        if ($item.parent('[data-submenu]').length) {
          $item.addClass('is-submenu-item ' + subItemClass);
        }
      });

      return;
    },
    Burn: function Burn(menu, type) {
      var items = menu.find('li').removeAttr('tabindex'),
          subMenuClass = 'is-' + type + '-submenu',
          subItemClass = subMenuClass + '-item',
          hasSubClass = 'is-' + type + '-submenu-parent';

      menu.find('>li, .menu, .menu > li').removeClass(subMenuClass + ' ' + subItemClass + ' ' + hasSubClass + ' is-submenu-item submenu is-active').removeAttr('data-submenu').css('display', '');

      // console.log(      menu.find('.' + subMenuClass + ', .' + subItemClass + ', .has-submenu, .is-submenu-item, .submenu, [data-submenu]')
      //           .removeClass(subMenuClass + ' ' + subItemClass + ' has-submenu is-submenu-item submenu')
      //           .removeAttr('data-submenu'));
      // items.each(function(){
      //   var $item = $(this),
      //       $sub = $item.children('ul');
      //   if($item.parent('[data-submenu]').length){
      //     $item.removeClass('is-submenu-item ' + subItemClass);
      //   }
      //   if($sub.length){
      //     $item.removeClass('has-submenu');
      //     $sub.removeClass('submenu ' + subMenuClass).removeAttr('data-submenu');
      //   }
      // });
    }
  };

  Foundation.Nest = Nest;
}(jQuery);
'use strict';

!function ($) {

  function Timer(elem, options, cb) {
    var _this = this,
        duration = options.duration,
        //options is an object for easily adding features later.
    nameSpace = Object.keys(elem.data())[0] || 'timer',
        remain = -1,
        start,
        timer;

    this.isPaused = false;

    this.restart = function () {
      remain = -1;
      clearTimeout(timer);
      this.start();
    };

    this.start = function () {
      this.isPaused = false;
      // if(!elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      remain = remain <= 0 ? duration : remain;
      elem.data('paused', false);
      start = Date.now();
      timer = setTimeout(function () {
        if (options.infinite) {
          _this.restart(); //rerun the timer.
        }
        if (cb && typeof cb === 'function') {
          cb();
        }
      }, remain);
      elem.trigger('timerstart.zf.' + nameSpace);
    };

    this.pause = function () {
      this.isPaused = true;
      //if(elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      elem.data('paused', true);
      var end = Date.now();
      remain = remain - (end - start);
      elem.trigger('timerpaused.zf.' + nameSpace);
    };
  }

  /**
   * Runs a callback function when images are fully loaded.
   * @param {Object} images - Image(s) to check if loaded.
   * @param {Func} callback - Function to execute when image is fully loaded.
   */
  function onImagesLoaded(images, callback) {
    var self = this,
        unloaded = images.length;

    if (unloaded === 0) {
      callback();
    }

    images.each(function () {
      if (this.complete) {
        singleImageLoaded();
      } else if (typeof this.naturalWidth !== 'undefined' && this.naturalWidth > 0) {
        singleImageLoaded();
      } else {
        $(this).one('load', function () {
          singleImageLoaded();
        });
      }
    });

    function singleImageLoaded() {
      unloaded--;
      if (unloaded === 0) {
        callback();
      }
    }
  }

  Foundation.Timer = Timer;
  Foundation.onImagesLoaded = onImagesLoaded;
}(jQuery);
'use strict';

//**************************************************
//**Work inspired by multiple jquery swipe plugins**
//**Done by Yohai Ararat ***************************
//**************************************************
(function ($) {

	$.spotSwipe = {
		version: '1.0.0',
		enabled: 'ontouchstart' in document.documentElement,
		preventDefault: false,
		moveThreshold: 75,
		timeThreshold: 200
	};

	var startPosX,
	    startPosY,
	    startTime,
	    elapsedTime,
	    isMoving = false;

	function onTouchEnd() {
		//  alert(this);
		this.removeEventListener('touchmove', onTouchMove);
		this.removeEventListener('touchend', onTouchEnd);
		isMoving = false;
	}

	function onTouchMove(e) {
		if ($.spotSwipe.preventDefault) {
			e.preventDefault();
		}
		if (isMoving) {
			var x = e.touches[0].pageX;
			var y = e.touches[0].pageY;
			var dx = startPosX - x;
			var dy = startPosY - y;
			var dir;
			elapsedTime = new Date().getTime() - startTime;
			if (Math.abs(dx) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
				dir = dx > 0 ? 'left' : 'right';
			}
			// else if(Math.abs(dy) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
			//   dir = dy > 0 ? 'down' : 'up';
			// }
			if (dir) {
				e.preventDefault();
				onTouchEnd.call(this);
				$(this).trigger('swipe', dir).trigger('swipe' + dir);
			}
		}
	}

	function onTouchStart(e) {
		if (e.touches.length == 1) {
			startPosX = e.touches[0].pageX;
			startPosY = e.touches[0].pageY;
			isMoving = true;
			startTime = new Date().getTime();
			this.addEventListener('touchmove', onTouchMove, false);
			this.addEventListener('touchend', onTouchEnd, false);
		}
	}

	function init() {
		this.addEventListener && this.addEventListener('touchstart', onTouchStart, false);
	}

	function teardown() {
		this.removeEventListener('touchstart', onTouchStart);
	}

	$.event.special.swipe = { setup: init };

	$.each(['left', 'up', 'down', 'right'], function () {
		$.event.special['swipe' + this] = { setup: function setup() {
				$(this).on('swipe', $.noop);
			} };
	});
})(jQuery);
/****************************************************
 * Method for adding psuedo drag events to elements *
 ***************************************************/
!function ($) {
	$.fn.addTouch = function () {
		this.each(function (i, el) {
			$(el).bind('touchstart touchmove touchend touchcancel', function () {
				//we pass the original event object because the jQuery event
				//object is normalized to w3c specs and does not provide the TouchList
				handleTouch(event);
			});
		});

		var handleTouch = function handleTouch(event) {
			var touches = event.changedTouches,
			    first = touches[0],
			    eventTypes = {
				touchstart: 'mousedown',
				touchmove: 'mousemove',
				touchend: 'mouseup'
			},
			    type = eventTypes[event.type],
			    simulatedEvent;

			if ('MouseEvent' in window && typeof window.MouseEvent === 'function') {
				simulatedEvent = new window.MouseEvent(type, {
					'bubbles': true,
					'cancelable': true,
					'screenX': first.screenX,
					'screenY': first.screenY,
					'clientX': first.clientX,
					'clientY': first.clientY
				});
			} else {
				simulatedEvent = document.createEvent('MouseEvent');
				simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0 /*left*/, null);
			}
			first.target.dispatchEvent(simulatedEvent);
		};
	};
}(jQuery);

//**********************************
//**From the jQuery Mobile Library**
//**need to recreate functionality**
//**and try to improve if possible**
//**********************************

/* Removing the jQuery function ****
************************************

(function( $, window, undefined ) {

	var $document = $( document ),
		// supportTouch = $.mobile.support.touch,
		touchStartEvent = 'touchstart'//supportTouch ? "touchstart" : "mousedown",
		touchStopEvent = 'touchend'//supportTouch ? "touchend" : "mouseup",
		touchMoveEvent = 'touchmove'//supportTouch ? "touchmove" : "mousemove";

	// setup new event shortcuts
	$.each( ( "touchstart touchmove touchend " +
		"swipe swipeleft swiperight" ).split( " " ), function( i, name ) {

		$.fn[ name ] = function( fn ) {
			return fn ? this.bind( name, fn ) : this.trigger( name );
		};

		// jQuery < 1.8
		if ( $.attrFn ) {
			$.attrFn[ name ] = true;
		}
	});

	function triggerCustomEvent( obj, eventType, event, bubble ) {
		var originalType = event.type;
		event.type = eventType;
		if ( bubble ) {
			$.event.trigger( event, undefined, obj );
		} else {
			$.event.dispatch.call( obj, event );
		}
		event.type = originalType;
	}

	// also handles taphold

	// Also handles swipeleft, swiperight
	$.event.special.swipe = {

		// More than this horizontal displacement, and we will suppress scrolling.
		scrollSupressionThreshold: 30,

		// More time than this, and it isn't a swipe.
		durationThreshold: 1000,

		// Swipe horizontal displacement must be more than this.
		horizontalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		// Swipe vertical displacement must be less than this.
		verticalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		getLocation: function ( event ) {
			var winPageX = window.pageXOffset,
				winPageY = window.pageYOffset,
				x = event.clientX,
				y = event.clientY;

			if ( event.pageY === 0 && Math.floor( y ) > Math.floor( event.pageY ) ||
				event.pageX === 0 && Math.floor( x ) > Math.floor( event.pageX ) ) {

				// iOS4 clientX/clientY have the value that should have been
				// in pageX/pageY. While pageX/page/ have the value 0
				x = x - winPageX;
				y = y - winPageY;
			} else if ( y < ( event.pageY - winPageY) || x < ( event.pageX - winPageX ) ) {

				// Some Android browsers have totally bogus values for clientX/Y
				// when scrolling/zooming a page. Detectable since clientX/clientY
				// should never be smaller than pageX/pageY minus page scroll
				x = event.pageX - winPageX;
				y = event.pageY - winPageY;
			}

			return {
				x: x,
				y: y
			};
		},

		start: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ],
						origin: $( event.target )
					};
		},

		stop: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ]
					};
		},

		handleSwipe: function( start, stop, thisObject, origTarget ) {
			if ( stop.time - start.time < $.event.special.swipe.durationThreshold &&
				Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.horizontalDistanceThreshold &&
				Math.abs( start.coords[ 1 ] - stop.coords[ 1 ] ) < $.event.special.swipe.verticalDistanceThreshold ) {
				var direction = start.coords[0] > stop.coords[ 0 ] ? "swipeleft" : "swiperight";

				triggerCustomEvent( thisObject, "swipe", $.Event( "swipe", { target: origTarget, swipestart: start, swipestop: stop }), true );
				triggerCustomEvent( thisObject, direction,$.Event( direction, { target: origTarget, swipestart: start, swipestop: stop } ), true );
				return true;
			}
			return false;

		},

		// This serves as a flag to ensure that at most one swipe event event is
		// in work at any given time
		eventInProgress: false,

		setup: function() {
			var events,
				thisObject = this,
				$this = $( thisObject ),
				context = {};

			// Retrieve the events data for this element and add the swipe context
			events = $.data( this, "mobile-events" );
			if ( !events ) {
				events = { length: 0 };
				$.data( this, "mobile-events", events );
			}
			events.length++;
			events.swipe = context;

			context.start = function( event ) {

				// Bail if we're already working on a swipe event
				if ( $.event.special.swipe.eventInProgress ) {
					return;
				}
				$.event.special.swipe.eventInProgress = true;

				var stop,
					start = $.event.special.swipe.start( event ),
					origTarget = event.target,
					emitted = false;

				context.move = function( event ) {
					if ( !start || event.isDefaultPrevented() ) {
						return;
					}

					stop = $.event.special.swipe.stop( event );
					if ( !emitted ) {
						emitted = $.event.special.swipe.handleSwipe( start, stop, thisObject, origTarget );
						if ( emitted ) {

							// Reset the context to make way for the next swipe event
							$.event.special.swipe.eventInProgress = false;
						}
					}
					// prevent scrolling
					if ( Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.scrollSupressionThreshold ) {
						event.preventDefault();
					}
				};

				context.stop = function() {
						emitted = true;

						// Reset the context to make way for the next swipe event
						$.event.special.swipe.eventInProgress = false;
						$document.off( touchMoveEvent, context.move );
						context.move = null;
				};

				$document.on( touchMoveEvent, context.move )
					.one( touchStopEvent, context.stop );
			};
			$this.on( touchStartEvent, context.start );
		},

		teardown: function() {
			var events, context;

			events = $.data( this, "mobile-events" );
			if ( events ) {
				context = events.swipe;
				delete events.swipe;
				events.length--;
				if ( events.length === 0 ) {
					$.removeData( this, "mobile-events" );
				}
			}

			if ( context ) {
				if ( context.start ) {
					$( this ).off( touchStartEvent, context.start );
				}
				if ( context.move ) {
					$document.off( touchMoveEvent, context.move );
				}
				if ( context.stop ) {
					$document.off( touchStopEvent, context.stop );
				}
			}
		}
	};
	$.each({
		swipeleft: "swipe.left",
		swiperight: "swipe.right"
	}, function( event, sourceEvent ) {

		$.event.special[ event ] = {
			setup: function() {
				$( this ).bind( sourceEvent, $.noop );
			},
			teardown: function() {
				$( this ).unbind( sourceEvent );
			}
		};
	});
})( jQuery, this );
*/
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

!function ($) {

  var MutationObserver = function () {
    var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
    for (var i = 0; i < prefixes.length; i++) {
      if (prefixes[i] + 'MutationObserver' in window) {
        return window[prefixes[i] + 'MutationObserver'];
      }
    }
    return false;
  }();

  var triggers = function triggers(el, type) {
    el.data(type).split(' ').forEach(function (id) {
      $('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
    });
  };
  // Elements with [data-open] will reveal a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-open]', function () {
    triggers($(this), 'open');
  });

  // Elements with [data-close] will close a plugin that supports it when clicked.
  // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
  $(document).on('click.zf.trigger', '[data-close]', function () {
    var id = $(this).data('close');
    if (id) {
      triggers($(this), 'close');
    } else {
      $(this).trigger('close.zf.trigger');
    }
  });

  // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-toggle]', function () {
    triggers($(this), 'toggle');
  });

  // Elements with [data-closable] will respond to close.zf.trigger events.
  $(document).on('close.zf.trigger', '[data-closable]', function (e) {
    e.stopPropagation();
    var animation = $(this).data('closable');

    if (animation !== '') {
      Foundation.Motion.animateOut($(this), animation, function () {
        $(this).trigger('closed.zf');
      });
    } else {
      $(this).fadeOut().trigger('closed.zf');
    }
  });

  $(document).on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', function () {
    var id = $(this).data('toggle-focus');
    $('#' + id).triggerHandler('toggle.zf.trigger', [$(this)]);
  });

  /**
  * Fires once after all other scripts have loaded
  * @function
  * @private
  */
  $(window).on('load', function () {
    checkListeners();
  });

  function checkListeners() {
    eventsListener();
    resizeListener();
    scrollListener();
    closemeListener();
  }

  //******** only fires this function once on load, if there's something to watch ********
  function closemeListener(pluginName) {
    var yetiBoxes = $('[data-yeti-box]'),
        plugNames = ['dropdown', 'tooltip', 'reveal'];

    if (pluginName) {
      if (typeof pluginName === 'string') {
        plugNames.push(pluginName);
      } else if ((typeof pluginName === 'undefined' ? 'undefined' : _typeof(pluginName)) === 'object' && typeof pluginName[0] === 'string') {
        plugNames.concat(pluginName);
      } else {
        console.error('Plugin names must be strings');
      }
    }
    if (yetiBoxes.length) {
      var listeners = plugNames.map(function (name) {
        return 'closeme.zf.' + name;
      }).join(' ');

      $(window).off(listeners).on(listeners, function (e, pluginId) {
        var plugin = e.namespace.split('.')[0];
        var plugins = $('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');

        plugins.each(function () {
          var _this = $(this);

          _this.triggerHandler('close.zf.trigger', [_this]);
        });
      });
    }
  }

  function resizeListener(debounce) {
    var timer = void 0,
        $nodes = $('[data-resize]');
    if ($nodes.length) {
      $(window).off('resize.zf.trigger').on('resize.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('resizeme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a resize event
          $nodes.attr('data-events', "resize");
        }, debounce || 10); //default time to emit resize event
      });
    }
  }

  function scrollListener(debounce) {
    var timer = void 0,
        $nodes = $('[data-scroll]');
    if ($nodes.length) {
      $(window).off('scroll.zf.trigger').on('scroll.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('scrollme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a scroll event
          $nodes.attr('data-events', "scroll");
        }, debounce || 10); //default time to emit scroll event
      });
    }
  }

  function eventsListener() {
    if (!MutationObserver) {
      return false;
    }
    var nodes = document.querySelectorAll('[data-resize], [data-scroll], [data-mutate]');

    //element callback
    var listeningElementsMutation = function listeningElementsMutation(mutationRecordsList) {
      var $target = $(mutationRecordsList[0].target);
      //trigger the event handler for the element depending on type
      switch ($target.attr("data-events")) {

        case "resize":
          $target.triggerHandler('resizeme.zf.trigger', [$target]);
          break;

        case "scroll":
          $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
          break;

        // case "mutate" :
        // console.log('mutate', $target);
        // $target.triggerHandler('mutate.zf.trigger');
        //
        // //make sure we don't get stuck in an infinite loop from sloppy codeing
        // if ($target.index('[data-mutate]') == $("[data-mutate]").length-1) {
        //   domMutationObserver();
        // }
        // break;

        default:
          return false;
        //nothing
      }
    };

    if (nodes.length) {
      //for each element that needs to listen for resizing, scrolling, (or coming soon mutation) add a single observer
      for (var i = 0; i <= nodes.length - 1; i++) {
        var elementObserver = new MutationObserver(listeningElementsMutation);
        elementObserver.observe(nodes[i], { attributes: true, childList: false, characterData: false, subtree: false, attributeFilter: ["data-events"] });
      }
    }
  }

  // ------------------------------------

  // [PH]
  // Foundation.CheckWatchers = checkWatchers;
  Foundation.IHearYou = checkListeners;
  // Foundation.ISeeYou = scrollListener;
  // Foundation.IFeelYou = closemeListener;
}(jQuery);

// function domMutationObserver(debounce) {
//   // !!! This is coming soon and needs more work; not active  !!! //
//   var timer,
//   nodes = document.querySelectorAll('[data-mutate]');
//   //
//   if (nodes.length) {
//     // var MutationObserver = (function () {
//     //   var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
//     //   for (var i=0; i < prefixes.length; i++) {
//     //     if (prefixes[i] + 'MutationObserver' in window) {
//     //       return window[prefixes[i] + 'MutationObserver'];
//     //     }
//     //   }
//     //   return false;
//     // }());
//
//
//     //for the body, we need to listen for all changes effecting the style and class attributes
//     var bodyObserver = new MutationObserver(bodyMutation);
//     bodyObserver.observe(document.body, { attributes: true, childList: true, characterData: false, subtree:true, attributeFilter:["style", "class"]});
//
//
//     //body callback
//     function bodyMutation(mutate) {
//       //trigger all listening elements and signal a mutation event
//       if (timer) { clearTimeout(timer); }
//
//       timer = setTimeout(function() {
//         bodyObserver.disconnect();
//         $('[data-mutate]').attr('data-events',"mutate");
//       }, debounce || 150);
//     }
//   }
// }
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * DropdownMenu module.
   * @module foundation.dropdown-menu
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.nest
   */

  var DropdownMenu = function () {
    /**
     * Creates a new instance of DropdownMenu.
     * @class
     * @fires DropdownMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function DropdownMenu(element, options) {
      _classCallCheck(this, DropdownMenu);

      this.$element = element;
      this.options = $.extend({}, DropdownMenu.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'dropdown');
      this._init();

      Foundation.registerPlugin(this, 'DropdownMenu');
      Foundation.Keyboard.register('DropdownMenu', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'previous',
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the plugin, and calls _prepareMenu
     * @private
     * @function
     */


    _createClass(DropdownMenu, [{
      key: '_init',
      value: function _init() {
        var subs = this.$element.find('li.is-dropdown-submenu-parent');
        this.$element.children('.is-dropdown-submenu-parent').children('.is-dropdown-submenu').addClass('first-sub');

        this.$menuItems = this.$element.find('[role="menuitem"]');
        this.$tabs = this.$element.children('[role="menuitem"]');
        this.$tabs.find('ul.is-dropdown-submenu').addClass(this.options.verticalClass);

        if (this.$element.hasClass(this.options.rightClass) || this.options.alignment === 'right' || Foundation.rtl() || this.$element.parents('.top-bar-right').is('*')) {
          this.options.alignment = 'right';
          subs.addClass('opens-left');
        } else {
          subs.addClass('opens-right');
        }
        this.changed = false;
        this._events();
      }
    }, {
      key: '_isVertical',
      value: function _isVertical() {
        return this.$tabs.css('display') === 'block';
      }

      /**
       * Adds event listeners to elements within the menu
       * @private
       * @function
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this,
            hasTouch = 'ontouchstart' in window || typeof window.ontouchstart !== 'undefined',
            parClass = 'is-dropdown-submenu-parent';

        // used for onClick and in the keyboard handlers
        var handleClickFn = function handleClickFn(e) {
          var $elem = $(e.target).parentsUntil('ul', '.' + parClass),
              hasSub = $elem.hasClass(parClass),
              hasClicked = $elem.attr('data-is-click') === 'true',
              $sub = $elem.children('.is-dropdown-submenu');

          if (hasSub) {
            if (hasClicked) {
              if (!_this.options.closeOnClick || !_this.options.clickOpen && !hasTouch || _this.options.forceFollow && hasTouch) {
                return;
              } else {
                e.stopImmediatePropagation();
                e.preventDefault();
                _this._hide($elem);
              }
            } else {
              e.preventDefault();
              e.stopImmediatePropagation();
              _this._show($sub);
              $elem.add($elem.parentsUntil(_this.$element, '.' + parClass)).attr('data-is-click', true);
            }
          } else {
            if (_this.options.closeOnClickInside) {
              _this._hide($elem);
            }
            return;
          }
        };

        if (this.options.clickOpen || hasTouch) {
          this.$menuItems.on('click.zf.dropdownmenu touchstart.zf.dropdownmenu', handleClickFn);
        }

        if (!this.options.disableHover) {
          this.$menuItems.on('mouseenter.zf.dropdownmenu', function (e) {
            var $elem = $(this),
                hasSub = $elem.hasClass(parClass);

            if (hasSub) {
              clearTimeout(_this.delay);
              _this.delay = setTimeout(function () {
                _this._show($elem.children('.is-dropdown-submenu'));
              }, _this.options.hoverDelay);
            }
          }).on('mouseleave.zf.dropdownmenu', function (e) {
            var $elem = $(this),
                hasSub = $elem.hasClass(parClass);
            if (hasSub && _this.options.autoclose) {
              if ($elem.attr('data-is-click') === 'true' && _this.options.clickOpen) {
                return false;
              }

              clearTimeout(_this.delay);
              _this.delay = setTimeout(function () {
                _this._hide($elem);
              }, _this.options.closingTime);
            }
          });
        }
        this.$menuItems.on('keydown.zf.dropdownmenu', function (e) {
          var $element = $(e.target).parentsUntil('ul', '[role="menuitem"]'),
              isTab = _this.$tabs.index($element) > -1,
              $elements = isTab ? _this.$tabs : $element.siblings('li').add($element),
              $prevElement,
              $nextElement;

          $elements.each(function (i) {
            if ($(this).is($element)) {
              $prevElement = $elements.eq(i - 1);
              $nextElement = $elements.eq(i + 1);
              return;
            }
          });

          var nextSibling = function nextSibling() {
            if (!$element.is(':last-child')) {
              $nextElement.children('a:first').focus();
              e.preventDefault();
            }
          },
              prevSibling = function prevSibling() {
            $prevElement.children('a:first').focus();
            e.preventDefault();
          },
              openSub = function openSub() {
            var $sub = $element.children('ul.is-dropdown-submenu');
            if ($sub.length) {
              _this._show($sub);
              $element.find('li > a:first').focus();
              e.preventDefault();
            } else {
              return;
            }
          },
              closeSub = function closeSub() {
            //if ($element.is(':first-child')) {
            var close = $element.parent('ul').parent('li');
            close.children('a:first').focus();
            _this._hide(close);
            e.preventDefault();
            //}
          };
          var functions = {
            open: openSub,
            close: function close() {
              _this._hide(_this.$element);
              _this.$menuItems.find('a:first').focus(); // focus to first element
              e.preventDefault();
            },
            handled: function handled() {
              e.stopImmediatePropagation();
            }
          };

          if (isTab) {
            if (_this._isVertical()) {
              // vertical menu
              if (Foundation.rtl()) {
                // right aligned
                $.extend(functions, {
                  down: nextSibling,
                  up: prevSibling,
                  next: closeSub,
                  previous: openSub
                });
              } else {
                // left aligned
                $.extend(functions, {
                  down: nextSibling,
                  up: prevSibling,
                  next: openSub,
                  previous: closeSub
                });
              }
            } else {
              // horizontal menu
              if (Foundation.rtl()) {
                // right aligned
                $.extend(functions, {
                  next: prevSibling,
                  previous: nextSibling,
                  down: openSub,
                  up: closeSub
                });
              } else {
                // left aligned
                $.extend(functions, {
                  next: nextSibling,
                  previous: prevSibling,
                  down: openSub,
                  up: closeSub
                });
              }
            }
          } else {
            // not tabs -> one sub
            if (Foundation.rtl()) {
              // right aligned
              $.extend(functions, {
                next: closeSub,
                previous: openSub,
                down: nextSibling,
                up: prevSibling
              });
            } else {
              // left aligned
              $.extend(functions, {
                next: openSub,
                previous: closeSub,
                down: nextSibling,
                up: prevSibling
              });
            }
          }
          Foundation.Keyboard.handleKey(e, 'DropdownMenu', functions);
        });
      }

      /**
       * Adds an event handler to the body to close any dropdowns on a click.
       * @function
       * @private
       */

    }, {
      key: '_addBodyHandler',
      value: function _addBodyHandler() {
        var $body = $(document.body),
            _this = this;
        $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu').on('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu', function (e) {
          var $link = _this.$element.find(e.target);
          if ($link.length) {
            return;
          }

          _this._hide();
          $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu');
        });
      }

      /**
       * Opens a dropdown pane, and checks for collisions first.
       * @param {jQuery} $sub - ul element that is a submenu to show
       * @function
       * @private
       * @fires DropdownMenu#show
       */

    }, {
      key: '_show',
      value: function _show($sub) {
        var idx = this.$tabs.index(this.$tabs.filter(function (i, el) {
          return $(el).find($sub).length > 0;
        }));
        var $sibs = $sub.parent('li.is-dropdown-submenu-parent').siblings('li.is-dropdown-submenu-parent');
        this._hide($sibs, idx);
        $sub.css('visibility', 'hidden').addClass('js-dropdown-active').attr({ 'aria-hidden': false }).parent('li.is-dropdown-submenu-parent').addClass('is-active').attr({ 'aria-expanded': true });
        var clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
        if (!clear) {
          var oldClass = this.options.alignment === 'left' ? '-right' : '-left',
              $parentLi = $sub.parent('.is-dropdown-submenu-parent');
          $parentLi.removeClass('opens' + oldClass).addClass('opens-' + this.options.alignment);
          clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
          if (!clear) {
            $parentLi.removeClass('opens-' + this.options.alignment).addClass('opens-inner');
          }
          this.changed = true;
        }
        $sub.css('visibility', '');
        if (this.options.closeOnClick) {
          this._addBodyHandler();
        }
        /**
         * Fires when the new dropdown pane is visible.
         * @event DropdownMenu#show
         */
        this.$element.trigger('show.zf.dropdownmenu', [$sub]);
      }

      /**
       * Hides a single, currently open dropdown pane, if passed a parameter, otherwise, hides everything.
       * @function
       * @param {jQuery} $elem - element with a submenu to hide
       * @param {Number} idx - index of the $tabs collection to hide
       * @private
       */

    }, {
      key: '_hide',
      value: function _hide($elem, idx) {
        var $toClose;
        if ($elem && $elem.length) {
          $toClose = $elem;
        } else if (idx !== undefined) {
          $toClose = this.$tabs.not(function (i, el) {
            return i === idx;
          });
        } else {
          $toClose = this.$element;
        }
        var somethingToClose = $toClose.hasClass('is-active') || $toClose.find('.is-active').length > 0;

        if (somethingToClose) {
          $toClose.find('li.is-active').add($toClose).attr({
            'aria-expanded': false,
            'data-is-click': false
          }).removeClass('is-active');

          $toClose.find('ul.js-dropdown-active').attr({
            'aria-hidden': true
          }).removeClass('js-dropdown-active');

          if (this.changed || $toClose.find('opens-inner').length) {
            var oldClass = this.options.alignment === 'left' ? 'right' : 'left';
            $toClose.find('li.is-dropdown-submenu-parent').add($toClose).removeClass('opens-inner opens-' + this.options.alignment).addClass('opens-' + oldClass);
            this.changed = false;
          }
          /**
           * Fires when the open menus are closed.
           * @event DropdownMenu#hide
           */
          this.$element.trigger('hide.zf.dropdownmenu', [$toClose]);
        }
      }

      /**
       * Destroys the plugin.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$menuItems.off('.zf.dropdownmenu').removeAttr('data-is-click').removeClass('is-right-arrow is-left-arrow is-down-arrow opens-right opens-left opens-inner');
        $(document.body).off('.zf.dropdownmenu');
        Foundation.Nest.Burn(this.$element, 'dropdown');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return DropdownMenu;
  }();

  /**
   * Default settings for plugin
   */


  DropdownMenu.defaults = {
    /**
     * Disallows hover events from opening submenus
     * @option
     * @example false
     */
    disableHover: false,
    /**
     * Allow a submenu to automatically close on a mouseleave event, if not clicked open.
     * @option
     * @example true
     */
    autoclose: true,
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 50
     */
    hoverDelay: 50,
    /**
     * Allow a submenu to open/remain open on parent click event. Allows cursor to move away from menu.
     * @option
     * @example true
     */
    clickOpen: false,
    /**
     * Amount of time to delay closing a submenu on a mouseleave event.
     * @option
     * @example 500
     */

    closingTime: 500,
    /**
     * Position of the menu relative to what direction the submenus should open. Handled by JS.
     * @option
     * @example 'left'
     */
    alignment: 'left',
    /**
     * Allow clicks on the body to close any open submenus.
     * @option
     * @example true
     */
    closeOnClick: true,
    /**
     * Allow clicks on leaf anchor links to close any open submenus.
     * @option
     * @example true
     */
    closeOnClickInside: true,
    /**
     * Class applied to vertical oriented menus, Foundation default is `vertical`. Update this if using your own class.
     * @option
     * @example 'vertical'
     */
    verticalClass: 'vertical',
    /**
     * Class applied to right-side oriented menus, Foundation default is `align-right`. Update this if using your own class.
     * @option
     * @example 'align-right'
     */
    rightClass: 'align-right',
    /**
     * Boolean to force overide the clicking of links to perform default action, on second touch event for mobile.
     * @option
     * @example false
     */
    forceFollow: true
  };

  // Window exports
  Foundation.plugin(DropdownMenu, 'DropdownMenu');
}(jQuery);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Equalizer module.
   * @module foundation.equalizer
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.timerAndImageLoader if equalizer contains images
   */

  var Equalizer = function () {
    /**
     * Creates a new instance of Equalizer.
     * @class
     * @fires Equalizer#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function Equalizer(element, options) {
      _classCallCheck(this, Equalizer);

      this.$element = element;
      this.options = $.extend({}, Equalizer.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Equalizer');
    }

    /**
     * Initializes the Equalizer plugin and calls functions to get equalizer functioning on load.
     * @private
     */


    _createClass(Equalizer, [{
      key: '_init',
      value: function _init() {
        var eqId = this.$element.attr('data-equalizer') || '';
        var $watched = this.$element.find('[data-equalizer-watch="' + eqId + '"]');

        this.$watched = $watched.length ? $watched : this.$element.find('[data-equalizer-watch]');
        this.$element.attr('data-resize', eqId || Foundation.GetYoDigits(6, 'eq'));

        this.hasNested = this.$element.find('[data-equalizer]').length > 0;
        this.isNested = this.$element.parentsUntil(document.body, '[data-equalizer]').length > 0;
        this.isOn = false;
        this._bindHandler = {
          onResizeMeBound: this._onResizeMe.bind(this),
          onPostEqualizedBound: this._onPostEqualized.bind(this)
        };

        var imgs = this.$element.find('img');
        var tooSmall;
        if (this.options.equalizeOn) {
          tooSmall = this._checkMQ();
          $(window).on('changed.zf.mediaquery', this._checkMQ.bind(this));
        } else {
          this._events();
        }
        if (tooSmall !== undefined && tooSmall === false || tooSmall === undefined) {
          if (imgs.length) {
            Foundation.onImagesLoaded(imgs, this._reflow.bind(this));
          } else {
            this._reflow();
          }
        }
      }

      /**
       * Removes event listeners if the breakpoint is too small.
       * @private
       */

    }, {
      key: '_pauseEvents',
      value: function _pauseEvents() {
        this.isOn = false;
        this.$element.off({
          '.zf.equalizer': this._bindHandler.onPostEqualizedBound,
          'resizeme.zf.trigger': this._bindHandler.onResizeMeBound
        });
      }

      /**
       * function to handle $elements resizeme.zf.trigger, with bound this on _bindHandler.onResizeMeBound
       * @private
       */

    }, {
      key: '_onResizeMe',
      value: function _onResizeMe(e) {
        this._reflow();
      }

      /**
       * function to handle $elements postequalized.zf.equalizer, with bound this on _bindHandler.onPostEqualizedBound
       * @private
       */

    }, {
      key: '_onPostEqualized',
      value: function _onPostEqualized(e) {
        if (e.target !== this.$element[0]) {
          this._reflow();
        }
      }

      /**
       * Initializes events for Equalizer.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;
        this._pauseEvents();
        if (this.hasNested) {
          this.$element.on('postequalized.zf.equalizer', this._bindHandler.onPostEqualizedBound);
        } else {
          this.$element.on('resizeme.zf.trigger', this._bindHandler.onResizeMeBound);
        }
        this.isOn = true;
      }

      /**
       * Checks the current breakpoint to the minimum required size.
       * @private
       */

    }, {
      key: '_checkMQ',
      value: function _checkMQ() {
        var tooSmall = !Foundation.MediaQuery.atLeast(this.options.equalizeOn);
        if (tooSmall) {
          if (this.isOn) {
            this._pauseEvents();
            this.$watched.css('height', 'auto');
          }
        } else {
          if (!this.isOn) {
            this._events();
          }
        }
        return tooSmall;
      }

      /**
       * A noop version for the plugin
       * @private
       */

    }, {
      key: '_killswitch',
      value: function _killswitch() {
        return;
      }

      /**
       * Calls necessary functions to update Equalizer upon DOM change
       * @private
       */

    }, {
      key: '_reflow',
      value: function _reflow() {
        if (!this.options.equalizeOnStack) {
          if (this._isStacked()) {
            this.$watched.css('height', 'auto');
            return false;
          }
        }
        if (this.options.equalizeByRow) {
          this.getHeightsByRow(this.applyHeightByRow.bind(this));
        } else {
          this.getHeights(this.applyHeight.bind(this));
        }
      }

      /**
       * Manually determines if the first 2 elements are *NOT* stacked.
       * @private
       */

    }, {
      key: '_isStacked',
      value: function _isStacked() {
        return this.$watched[0].getBoundingClientRect().top !== this.$watched[1].getBoundingClientRect().top;
      }

      /**
       * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
       * @param {Function} cb - A non-optional callback to return the heights array to.
       * @returns {Array} heights - An array of heights of children within Equalizer container
       */

    }, {
      key: 'getHeights',
      value: function getHeights(cb) {
        var heights = [];
        for (var i = 0, len = this.$watched.length; i < len; i++) {
          this.$watched[i].style.height = 'auto';
          heights.push(this.$watched[i].offsetHeight);
        }
        cb(heights);
      }

      /**
       * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
       * @param {Function} cb - A non-optional callback to return the heights array to.
       * @returns {Array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
       */

    }, {
      key: 'getHeightsByRow',
      value: function getHeightsByRow(cb) {
        var lastElTopOffset = this.$watched.length ? this.$watched.first().offset().top : 0,
            groups = [],
            group = 0;
        //group by Row
        groups[group] = [];
        for (var i = 0, len = this.$watched.length; i < len; i++) {
          this.$watched[i].style.height = 'auto';
          //maybe could use this.$watched[i].offsetTop
          var elOffsetTop = $(this.$watched[i]).offset().top;
          if (elOffsetTop != lastElTopOffset) {
            group++;
            groups[group] = [];
            lastElTopOffset = elOffsetTop;
          }
          groups[group].push([this.$watched[i], this.$watched[i].offsetHeight]);
        }

        for (var j = 0, ln = groups.length; j < ln; j++) {
          var heights = $(groups[j]).map(function () {
            return this[1];
          }).get();
          var max = Math.max.apply(null, heights);
          groups[j].push(max);
        }
        cb(groups);
      }

      /**
       * Changes the CSS height property of each child in an Equalizer parent to match the tallest
       * @param {array} heights - An array of heights of children within Equalizer container
       * @fires Equalizer#preequalized
       * @fires Equalizer#postequalized
       */

    }, {
      key: 'applyHeight',
      value: function applyHeight(heights) {
        var max = Math.max.apply(null, heights);
        /**
         * Fires before the heights are applied
         * @event Equalizer#preequalized
         */
        this.$element.trigger('preequalized.zf.equalizer');

        this.$watched.css('height', max);

        /**
         * Fires when the heights have been applied
         * @event Equalizer#postequalized
         */
        this.$element.trigger('postequalized.zf.equalizer');
      }

      /**
       * Changes the CSS height property of each child in an Equalizer parent to match the tallest by row
       * @param {array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
       * @fires Equalizer#preequalized
       * @fires Equalizer#preequalizedRow
       * @fires Equalizer#postequalizedRow
       * @fires Equalizer#postequalized
       */

    }, {
      key: 'applyHeightByRow',
      value: function applyHeightByRow(groups) {
        /**
         * Fires before the heights are applied
         */
        this.$element.trigger('preequalized.zf.equalizer');
        for (var i = 0, len = groups.length; i < len; i++) {
          var groupsILength = groups[i].length,
              max = groups[i][groupsILength - 1];
          if (groupsILength <= 2) {
            $(groups[i][0][0]).css({ 'height': 'auto' });
            continue;
          }
          /**
            * Fires before the heights per row are applied
            * @event Equalizer#preequalizedRow
            */
          this.$element.trigger('preequalizedrow.zf.equalizer');
          for (var j = 0, lenJ = groupsILength - 1; j < lenJ; j++) {
            $(groups[i][j][0]).css({ 'height': max });
          }
          /**
            * Fires when the heights per row have been applied
            * @event Equalizer#postequalizedRow
            */
          this.$element.trigger('postequalizedrow.zf.equalizer');
        }
        /**
         * Fires when the heights have been applied
         */
        this.$element.trigger('postequalized.zf.equalizer');
      }

      /**
       * Destroys an instance of Equalizer.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this._pauseEvents();
        this.$watched.css('height', 'auto');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Equalizer;
  }();

  /**
   * Default settings for plugin
   */


  Equalizer.defaults = {
    /**
     * Enable height equalization when stacked on smaller screens.
     * @option
     * @example true
     */
    equalizeOnStack: false,
    /**
     * Enable height equalization row by row.
     * @option
     * @example false
     */
    equalizeByRow: false,
    /**
     * String representing the minimum breakpoint size the plugin should equalize heights on.
     * @option
     * @example 'medium'
     */
    equalizeOn: ''
  };

  // Window exports
  Foundation.plugin(Equalizer, 'Equalizer');
}(jQuery);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * OffCanvas module.
   * @module foundation.offcanvas
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.triggers
   * @requires foundation.util.motion
   */

  var OffCanvas = function () {
    /**
     * Creates a new instance of an off-canvas wrapper.
     * @class
     * @fires OffCanvas#init
     * @param {Object} element - jQuery object to initialize.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function OffCanvas(element, options) {
      _classCallCheck(this, OffCanvas);

      this.$element = element;
      this.options = $.extend({}, OffCanvas.defaults, this.$element.data(), options);
      this.$lastTrigger = $();
      this.$triggers = $();

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'OffCanvas');
      Foundation.Keyboard.register('OffCanvas', {
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the off-canvas wrapper by adding the exit overlay (if needed).
     * @function
     * @private
     */


    _createClass(OffCanvas, [{
      key: '_init',
      value: function _init() {
        var id = this.$element.attr('id');

        this.$element.attr('aria-hidden', 'true');

        // Find triggers that affect this element and add aria-expanded to them
        this.$triggers = $(document).find('[data-open="' + id + '"], [data-close="' + id + '"], [data-toggle="' + id + '"]').attr('aria-expanded', 'false').attr('aria-controls', id);

        // Add a close trigger over the body if necessary
        if (this.options.closeOnClick) {
          if ($('.js-off-canvas-exit').length) {
            this.$exiter = $('.js-off-canvas-exit');
          } else {
            var exiter = document.createElement('div');
            exiter.setAttribute('class', 'js-off-canvas-exit');
            $('[data-off-canvas-content]').append(exiter);

            this.$exiter = $(exiter);
          }
        }

        this.options.isRevealed = this.options.isRevealed || new RegExp(this.options.revealClass, 'g').test(this.$element[0].className);

        if (this.options.isRevealed) {
          this.options.revealOn = this.options.revealOn || this.$element[0].className.match(/(reveal-for-medium|reveal-for-large)/g)[0].split('-')[2];
          this._setMQChecker();
        }
        if (!this.options.transitionTime) {
          this.options.transitionTime = parseFloat(window.getComputedStyle($('[data-off-canvas-wrapper]')[0]).transitionDuration) * 1000;
        }
      }

      /**
       * Adds event handlers to the off-canvas wrapper and the exit overlay.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        this.$element.off('.zf.trigger .zf.offcanvas').on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': this.close.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this),
          'keydown.zf.offcanvas': this._handleKeyboard.bind(this)
        });

        if (this.options.closeOnClick && this.$exiter.length) {
          this.$exiter.on({ 'click.zf.offcanvas': this.close.bind(this) });
        }
      }

      /**
       * Applies event listener for elements that will reveal at certain breakpoints.
       * @private
       */

    }, {
      key: '_setMQChecker',
      value: function _setMQChecker() {
        var _this = this;

        $(window).on('changed.zf.mediaquery', function () {
          if (Foundation.MediaQuery.atLeast(_this.options.revealOn)) {
            _this.reveal(true);
          } else {
            _this.reveal(false);
          }
        }).one('load.zf.offcanvas', function () {
          if (Foundation.MediaQuery.atLeast(_this.options.revealOn)) {
            _this.reveal(true);
          }
        });
      }

      /**
       * Handles the revealing/hiding the off-canvas at breakpoints, not the same as open.
       * @param {Boolean} isRevealed - true if element should be revealed.
       * @function
       */

    }, {
      key: 'reveal',
      value: function reveal(isRevealed) {
        var $closer = this.$element.find('[data-close]');
        if (isRevealed) {
          this.close();
          this.isRevealed = true;
          // if (!this.options.forceTop) {
          //   var scrollPos = parseInt(window.pageYOffset);
          //   this.$element[0].style.transform = 'translate(0,' + scrollPos + 'px)';
          // }
          // if (this.options.isSticky) { this._stick(); }
          this.$element.off('open.zf.trigger toggle.zf.trigger');
          if ($closer.length) {
            $closer.hide();
          }
        } else {
          this.isRevealed = false;
          // if (this.options.isSticky || !this.options.forceTop) {
          //   this.$element[0].style.transform = '';
          //   $(window).off('scroll.zf.offcanvas');
          // }
          this.$element.on({
            'open.zf.trigger': this.open.bind(this),
            'toggle.zf.trigger': this.toggle.bind(this)
          });
          if ($closer.length) {
            $closer.show();
          }
        }
      }

      /**
       * Opens the off-canvas menu.
       * @function
       * @param {Object} event - Event object passed from listener.
       * @param {jQuery} trigger - element that triggered the off-canvas to open.
       * @fires OffCanvas#opened
       */

    }, {
      key: 'open',
      value: function open(event, trigger) {
        if (this.$element.hasClass('is-open') || this.isRevealed) {
          return;
        }
        var _this = this,
            $body = $(document.body);

        if (this.options.forceTop) {
          $('body').scrollTop(0);
        }
        // window.pageYOffset = 0;

        // if (!this.options.forceTop) {
        //   var scrollPos = parseInt(window.pageYOffset);
        //   this.$element[0].style.transform = 'translate(0,' + scrollPos + 'px)';
        //   if (this.$exiter.length) {
        //     this.$exiter[0].style.transform = 'translate(0,' + scrollPos + 'px)';
        //   }
        // }
        /**
         * Fires when the off-canvas menu opens.
         * @event OffCanvas#opened
         */

        var $wrapper = $('[data-off-canvas-wrapper]');
        $wrapper.addClass('is-off-canvas-open is-open-' + _this.options.position);

        _this.$element.addClass('is-open');

        // if (_this.options.isSticky) {
        //   _this._stick();
        // }

        this.$triggers.attr('aria-expanded', 'true');
        this.$element.attr('aria-hidden', 'false').trigger('opened.zf.offcanvas');

        if (this.options.closeOnClick) {
          this.$exiter.addClass('is-visible');
        }

        if (trigger) {
          this.$lastTrigger = trigger;
        }

        if (this.options.autoFocus) {
          $wrapper.one(Foundation.transitionend($wrapper), function () {
            if (_this.$element.hasClass('is-open')) {
              // handle double clicks
              _this.$element.attr('tabindex', '-1');
              _this.$element.focus();
            }
          });
        }

        if (this.options.trapFocus) {
          $wrapper.one(Foundation.transitionend($wrapper), function () {
            if (_this.$element.hasClass('is-open')) {
              // handle double clicks
              _this.$element.attr('tabindex', '-1');
              _this.trapFocus();
            }
          });
        }
      }

      /**
       * Traps focus within the offcanvas on open.
       * @private
       */

    }, {
      key: '_trapFocus',
      value: function _trapFocus() {
        var focusable = Foundation.Keyboard.findFocusable(this.$element),
            first = focusable.eq(0),
            last = focusable.eq(-1);

        focusable.off('.zf.offcanvas').on('keydown.zf.offcanvas', function (e) {
          var key = Foundation.Keyboard.parseKey(e);
          if (key === 'TAB' && e.target === last[0]) {
            e.preventDefault();
            first.focus();
          }
          if (key === 'SHIFT_TAB' && e.target === first[0]) {
            e.preventDefault();
            last.focus();
          }
        });
      }

      /**
       * Allows the offcanvas to appear sticky utilizing translate properties.
       * @private
       */
      // OffCanvas.prototype._stick = function() {
      //   var elStyle = this.$element[0].style;
      //
      //   if (this.options.closeOnClick) {
      //     var exitStyle = this.$exiter[0].style;
      //   }
      //
      //   $(window).on('scroll.zf.offcanvas', function(e) {
      //     console.log(e);
      //     var pageY = window.pageYOffset;
      //     elStyle.transform = 'translate(0,' + pageY + 'px)';
      //     if (exitStyle !== undefined) { exitStyle.transform = 'translate(0,' + pageY + 'px)'; }
      //   });
      //   // this.$element.trigger('stuck.zf.offcanvas');
      // };
      /**
       * Closes the off-canvas menu.
       * @function
       * @param {Function} cb - optional cb to fire after closure.
       * @fires OffCanvas#closed
       */

    }, {
      key: 'close',
      value: function close(cb) {
        if (!this.$element.hasClass('is-open') || this.isRevealed) {
          return;
        }

        var _this = this;

        //  Foundation.Move(this.options.transitionTime, this.$element, function() {
        $('[data-off-canvas-wrapper]').removeClass('is-off-canvas-open is-open-' + _this.options.position);
        _this.$element.removeClass('is-open');
        // Foundation._reflow();
        // });
        this.$element.attr('aria-hidden', 'true')
        /**
         * Fires when the off-canvas menu opens.
         * @event OffCanvas#closed
         */
        .trigger('closed.zf.offcanvas');
        // if (_this.options.isSticky || !_this.options.forceTop) {
        //   setTimeout(function() {
        //     _this.$element[0].style.transform = '';
        //     $(window).off('scroll.zf.offcanvas');
        //   }, this.options.transitionTime);
        // }
        if (this.options.closeOnClick) {
          this.$exiter.removeClass('is-visible');
        }

        this.$triggers.attr('aria-expanded', 'false');
        if (this.options.trapFocus) {
          $('[data-off-canvas-content]').removeAttr('tabindex');
        }
      }

      /**
       * Toggles the off-canvas menu open or closed.
       * @function
       * @param {Object} event - Event object passed from listener.
       * @param {jQuery} trigger - element that triggered the off-canvas to open.
       */

    }, {
      key: 'toggle',
      value: function toggle(event, trigger) {
        if (this.$element.hasClass('is-open')) {
          this.close(event, trigger);
        } else {
          this.open(event, trigger);
        }
      }

      /**
       * Handles keyboard input when detected. When the escape key is pressed, the off-canvas menu closes, and focus is restored to the element that opened the menu.
       * @function
       * @private
       */

    }, {
      key: '_handleKeyboard',
      value: function _handleKeyboard(e) {
        var _this2 = this;

        Foundation.Keyboard.handleKey(e, 'OffCanvas', {
          close: function close() {
            _this2.close();
            _this2.$lastTrigger.focus();
            return true;
          },
          handled: function handled() {
            e.stopPropagation();
            e.preventDefault();
          }
        });
      }

      /**
       * Destroys the offcanvas plugin.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.close();
        this.$element.off('.zf.trigger .zf.offcanvas');
        this.$exiter.off('.zf.offcanvas');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return OffCanvas;
  }();

  OffCanvas.defaults = {
    /**
     * Allow the user to click outside of the menu to close it.
     * @option
     * @example true
     */
    closeOnClick: true,

    /**
     * Amount of time in ms the open and close transition requires. If none selected, pulls from body style.
     * @option
     * @example 500
     */
    transitionTime: 0,

    /**
     * Direction the offcanvas opens from. Determines class applied to body.
     * @option
     * @example left
     */
    position: 'left',

    /**
     * Force the page to scroll to top on open.
     * @option
     * @example true
     */
    forceTop: true,

    /**
     * Allow the offcanvas to remain open for certain breakpoints.
     * @option
     * @example false
     */
    isRevealed: false,

    /**
     * Breakpoint at which to reveal. JS will use a RegExp to target standard classes, if changing classnames, pass your class with the `revealClass` option.
     * @option
     * @example reveal-for-large
     */
    revealOn: null,

    /**
     * Force focus to the offcanvas on open. If true, will focus the opening trigger on close. Sets tabindex of [data-off-canvas-content] to -1 for accessibility purposes.
     * @option
     * @example true
     */
    autoFocus: true,

    /**
     * Class used to force an offcanvas to remain open. Foundation defaults for this are `reveal-for-large` & `reveal-for-medium`.
     * @option
     * TODO improve the regex testing for this.
     * @example reveal-for-large
     */
    revealClass: 'reveal-for-',

    /**
     * Triggers optional focus trapping when opening an offcanvas. Sets tabindex of [data-off-canvas-content] to -1 for accessibility purposes.
     * @option
     * @example true
     */
    trapFocus: false
  };

  // Window exports
  Foundation.plugin(OffCanvas, 'OffCanvas');
}(jQuery);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * ResponsiveMenu module.
   * @module foundation.responsiveMenu
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.accordionMenu
   * @requires foundation.util.drilldown
   * @requires foundation.util.dropdown-menu
   */

  var ResponsiveMenu = function () {
    /**
     * Creates a new instance of a responsive menu.
     * @class
     * @fires ResponsiveMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function ResponsiveMenu(element, options) {
      _classCallCheck(this, ResponsiveMenu);

      this.$element = $(element);
      this.rules = this.$element.data('responsive-menu');
      this.currentMq = null;
      this.currentPlugin = null;

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveMenu');
    }

    /**
     * Initializes the Menu by parsing the classes from the 'data-ResponsiveMenu' attribute on the element.
     * @function
     * @private
     */


    _createClass(ResponsiveMenu, [{
      key: '_init',
      value: function _init() {
        // The first time an Interchange plugin is initialized, this.rules is converted from a string of "classes" to an object of rules
        if (typeof this.rules === 'string') {
          var rulesTree = {};

          // Parse rules from "classes" pulled from data attribute
          var rules = this.rules.split(' ');

          // Iterate through every rule found
          for (var i = 0; i < rules.length; i++) {
            var rule = rules[i].split('-');
            var ruleSize = rule.length > 1 ? rule[0] : 'small';
            var rulePlugin = rule.length > 1 ? rule[1] : rule[0];

            if (MenuPlugins[rulePlugin] !== null) {
              rulesTree[ruleSize] = MenuPlugins[rulePlugin];
            }
          }

          this.rules = rulesTree;
        }

        if (!$.isEmptyObject(this.rules)) {
          this._checkMediaQueries();
        }
      }

      /**
       * Initializes events for the Menu.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        $(window).on('changed.zf.mediaquery', function () {
          _this._checkMediaQueries();
        });
        // $(window).on('resize.zf.ResponsiveMenu', function() {
        //   _this._checkMediaQueries();
        // });
      }

      /**
       * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
       * @function
       * @private
       */

    }, {
      key: '_checkMediaQueries',
      value: function _checkMediaQueries() {
        var matchedMq,
            _this = this;
        // Iterate through each rule and find the last matching rule
        $.each(this.rules, function (key) {
          if (Foundation.MediaQuery.atLeast(key)) {
            matchedMq = key;
          }
        });

        // No match? No dice
        if (!matchedMq) return;

        // Plugin already initialized? We good
        if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return;

        // Remove existing plugin-specific CSS classes
        $.each(MenuPlugins, function (key, value) {
          _this.$element.removeClass(value.cssClass);
        });

        // Add the CSS class for the new plugin
        this.$element.addClass(this.rules[matchedMq].cssClass);

        // Create an instance of the new plugin
        if (this.currentPlugin) this.currentPlugin.destroy();
        this.currentPlugin = new this.rules[matchedMq].plugin(this.$element, {});
      }

      /**
       * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.currentPlugin.destroy();
        $(window).off('.zf.ResponsiveMenu');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return ResponsiveMenu;
  }();

  ResponsiveMenu.defaults = {};

  // The plugin matches the plugin classes with these plugin instances.
  var MenuPlugins = {
    dropdown: {
      cssClass: 'dropdown',
      plugin: Foundation._plugins['dropdown-menu'] || null
    },
    drilldown: {
      cssClass: 'drilldown',
      plugin: Foundation._plugins['drilldown'] || null
    },
    accordion: {
      cssClass: 'accordion-menu',
      plugin: Foundation._plugins['accordion-menu'] || null
    }
  };

  // Window exports
  Foundation.plugin(ResponsiveMenu, 'ResponsiveMenu');
}(jQuery);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * ResponsiveToggle module.
   * @module foundation.responsiveToggle
   * @requires foundation.util.mediaQuery
   */

  var ResponsiveToggle = function () {
    /**
     * Creates a new instance of Tab Bar.
     * @class
     * @fires ResponsiveToggle#init
     * @param {jQuery} element - jQuery object to attach tab bar functionality to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    function ResponsiveToggle(element, options) {
      _classCallCheck(this, ResponsiveToggle);

      this.$element = $(element);
      this.options = $.extend({}, ResponsiveToggle.defaults, this.$element.data(), options);

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveToggle');
    }

    /**
     * Initializes the tab bar by finding the target element, toggling element, and running update().
     * @function
     * @private
     */


    _createClass(ResponsiveToggle, [{
      key: '_init',
      value: function _init() {
        var targetID = this.$element.data('responsive-toggle');
        if (!targetID) {
          console.error('Your tab bar needs an ID of a Menu as the value of data-tab-bar.');
        }

        this.$targetMenu = $('#' + targetID);
        this.$toggler = this.$element.find('[data-toggle]');

        this._update();
      }

      /**
       * Adds necessary event handlers for the tab bar to work.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        this._updateMqHandler = this._update.bind(this);

        $(window).on('changed.zf.mediaquery', this._updateMqHandler);

        this.$toggler.on('click.zf.responsiveToggle', this.toggleMenu.bind(this));
      }

      /**
       * Checks the current media query to determine if the tab bar should be visible or hidden.
       * @function
       * @private
       */

    }, {
      key: '_update',
      value: function _update() {
        // Mobile
        if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
          this.$element.show();
          this.$targetMenu.hide();
        }

        // Desktop
        else {
            this.$element.hide();
            this.$targetMenu.show();
          }
      }

      /**
       * Toggles the element attached to the tab bar. The toggle only happens if the screen is small enough to allow it.
       * @function
       * @fires ResponsiveToggle#toggled
       */

    }, {
      key: 'toggleMenu',
      value: function toggleMenu() {
        if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
          this.$targetMenu.toggle(0);

          /**
           * Fires when the element attached to the tab bar toggles.
           * @event ResponsiveToggle#toggled
           */
          this.$element.trigger('toggled.zf.responsiveToggle');
        }
      }
    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.responsiveToggle');
        this.$toggler.off('.zf.responsiveToggle');

        $(window).off('changed.zf.mediaquery', this._updateMqHandler);

        Foundation.unregisterPlugin(this);
      }
    }]);

    return ResponsiveToggle;
  }();

  ResponsiveToggle.defaults = {
    /**
     * The breakpoint after which the menu is always shown, and the tab bar is hidden.
     * @option
     * @example 'medium'
     */
    hideFor: 'medium'
  };

  // Window exports
  Foundation.plugin(ResponsiveToggle, 'ResponsiveToggle');
}(jQuery);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/////    /////    /////    /////
/////    /////    /////    /////
/////    /////    /////    /////
/////    /////    /////    /////
/////             /////    /////
/////             /////    /////
/////    /////    /////    /////
/////    /////    /////    /////
/////    /////
/////    /////
/////    /////    /////    /////
/////    /////    /////    /////
/////    /////    /////    /////
/////    /////    /////    /////

/**
 * ScrollReveal
 * ------------
 * Version : 3.3.2
 * Website : scrollrevealjs.org
 * Repo    : github.com/jlmakes/scrollreveal.js
 * Author  : Julian Lloyd (@jlmakes)
 */

;(function () {
  'use strict';

  var sr;
  var _requestAnimationFrame;

  function ScrollReveal(config) {
    // Support instantiation without the `new` keyword.
    if (typeof this === 'undefined' || Object.getPrototypeOf(this) !== ScrollReveal.prototype) {
      return new ScrollReveal(config);
    }

    sr = this; // Save reference to instance.
    sr.version = '3.3.2';
    sr.tools = new Tools(); // *required utilities

    if (sr.isSupported()) {
      sr.tools.extend(sr.defaults, config || {});

      sr.defaults.container = _resolveContainer(sr.defaults);

      sr.store = {
        elements: {},
        containers: []
      };

      sr.sequences = {};
      sr.history = [];
      sr.uid = 0;
      sr.initialized = false;
    } else if (typeof console !== 'undefined' && console !== null) {
      // Note: IE9 only supports console if devtools are open.
      console.log('ScrollReveal is not supported in this browser.');
    }

    return sr;
  }

  /**
   * Configuration
   * -------------
   * This object signature can be passed directly to the ScrollReveal constructor,
   * or as the second argument of the `reveal()` method.
   */

  ScrollReveal.prototype.defaults = {
    // 'bottom', 'left', 'top', 'right'
    origin: 'bottom',

    // Can be any valid CSS distance, e.g. '5rem', '10%', '20vw', etc.
    distance: '20px',

    // Time in milliseconds.
    duration: 500,
    delay: 0,

    // Starting angles in degrees, will transition from these values to 0 in all axes.
    rotate: { x: 0, y: 0, z: 0 },

    // Starting opacity value, before transitioning to the computed opacity.
    opacity: 0,

    // Starting scale value, will transition from this value to 1
    scale: 0.9,

    // Accepts any valid CSS easing, e.g. 'ease', 'ease-in-out', 'linear', etc.
    easing: 'cubic-bezier(0.6, 0.2, 0.1, 1)',

    // `<html>` is the default reveal container. You can pass either:
    // DOM Node, e.g. document.querySelector('.fooContainer')
    // Selector, e.g. '.fooContainer'
    container: window.document.documentElement,

    // true/false to control reveal animations on mobile.
    mobile: true,

    // true:  reveals occur every time elements become visible
    // false: reveals occur once as elements become visible
    reset: false,

    // 'always' — delay for all reveal animations
    // 'once'   — delay only the first time reveals occur
    // 'onload' - delay only for animations triggered by first load
    useDelay: 'always',

    // Change when an element is considered in the viewport. The default value
    // of 0.20 means 20% of an element must be visible for its reveal to occur.
    viewFactor: 0.2,

    // Pixel values that alter the container boundaries.
    // e.g. Set `{ top: 48 }`, if you have a 48px tall fixed toolbar.
    // --
    // Visual Aid: https://scrollrevealjs.org/assets/viewoffset.png
    viewOffset: { top: 0, right: 0, bottom: 0, left: 0 },

    // Callbacks that fire for each triggered element reveal, and reset.
    beforeReveal: function beforeReveal(domEl) {},
    beforeReset: function beforeReset(domEl) {},

    // Callbacks that fire for each completed element reveal, and reset.
    afterReveal: function afterReveal(domEl) {},
    afterReset: function afterReset(domEl) {}
  };

  /**
   * Check if client supports CSS Transform and CSS Transition.
   * @return {boolean}
   */
  ScrollReveal.prototype.isSupported = function () {
    var style = document.documentElement.style;
    return 'WebkitTransition' in style && 'WebkitTransform' in style || 'transition' in style && 'transform' in style;
  };

  /**
   * Creates a reveal set, a group of elements that will animate when they
   * become visible. If [interval] is provided, a new sequence is created
   * that will ensure elements reveal in the order they appear in the DOM.
   *
   * @param {Node|NodeList|string} [target]   The node, node list or selector to use for animation.
   * @param {Object}               [config]   Override the defaults for this reveal set.
   * @param {number}               [interval] Time between sequenced element animations (milliseconds).
   * @param {boolean}              [sync]     Used internally when updating reveals for async content.
   *
   * @return {Object} The current ScrollReveal instance.
   */
  ScrollReveal.prototype.reveal = function (target, config, interval, sync) {
    var container;
    var elements;
    var elem;
    var elemId;
    var sequence;
    var sequenceId;

    // No custom configuration was passed, but a sequence interval instead.
    // let’s shuffle things around to make sure everything works.
    if (config !== undefined && typeof config === 'number') {
      interval = config;
      config = {};
    } else if (config === undefined || config === null) {
      config = {};
    }

    container = _resolveContainer(config);
    elements = _getRevealElements(target, container);

    if (!elements.length) {
      console.log('ScrollReveal: reveal on "' + target + '" failed, no elements found.');
      return sr;
    }

    // Prepare a new sequence if an interval is passed.
    if (interval && typeof interval === 'number') {
      sequenceId = _nextUid();

      sequence = sr.sequences[sequenceId] = {
        id: sequenceId,
        interval: interval,
        elemIds: [],
        active: false
      };
    }

    // Begin main loop to configure ScrollReveal elements.
    for (var i = 0; i < elements.length; i++) {
      // Check if the element has already been configured and grab it from the store.
      elemId = elements[i].getAttribute('data-sr-id');
      if (elemId) {
        elem = sr.store.elements[elemId];
      } else {
        // Otherwise, let’s do some basic setup.
        elem = {
          id: _nextUid(),
          domEl: elements[i],
          seen: false,
          revealing: false
        };
        elem.domEl.setAttribute('data-sr-id', elem.id);
      }

      // Sequence only setup
      if (sequence) {
        elem.sequence = {
          id: sequence.id,
          index: sequence.elemIds.length
        };

        sequence.elemIds.push(elem.id);
      }

      // New or existing element, it’s time to update its configuration, styles,
      // and send the updates to our store.
      _configure(elem, config, container);
      _style(elem);
      _updateStore(elem);

      // We need to make sure elements are set to visibility: visible, even when
      // on mobile and `config.mobile === false`, or if unsupported.
      if (sr.tools.isMobile() && !elem.config.mobile || !sr.isSupported()) {
        elem.domEl.setAttribute('style', elem.styles.inline);
        elem.disabled = true;
      } else if (!elem.revealing) {
        // Otherwise, proceed normally.
        elem.domEl.setAttribute('style', elem.styles.inline + elem.styles.transform.initial);
      }
    }

    // Each `reveal()` is recorded so that when calling `sync()` while working
    // with asynchronously loaded content, it can re-trace your steps but with
    // all your new elements now in the DOM.

    // Since `reveal()` is called internally by `sync()`, we don’t want to
    // record or intiialize each reveal during syncing.
    if (!sync && sr.isSupported()) {
      _record(target, config, interval);

      // We push initialization to the event queue using setTimeout, so that we can
      // give ScrollReveal room to process all reveal calls before putting things into motion.
      // --
      // Philip Roberts - What the heck is the event loop anyway? (JSConf EU 2014)
      // https://www.youtube.com/watch?v=8aGhZQkoFbQ
      if (sr.initTimeout) {
        window.clearTimeout(sr.initTimeout);
      }
      sr.initTimeout = window.setTimeout(_init, 0);
    }

    return sr;
  };

  /**
   * Re-runs `reveal()` for each record stored in history, effectively capturing
   * any content loaded asynchronously that matches existing reveal set targets.
   * @return {Object} The current ScrollReveal instance.
   */
  ScrollReveal.prototype.sync = function () {
    if (sr.history.length && sr.isSupported()) {
      for (var i = 0; i < sr.history.length; i++) {
        var record = sr.history[i];
        sr.reveal(record.target, record.config, record.interval, true);
      }
      _init();
    } else {
      console.log('ScrollReveal: sync failed, no reveals found.');
    }
    return sr;
  };

  /**
   * Private Methods
   * ---------------
   */

  function _resolveContainer(config) {
    if (config && config.container) {
      if (typeof config.container === 'string') {
        return window.document.documentElement.querySelector(config.container);
      } else if (sr.tools.isNode(config.container)) {
        return config.container;
      } else {
        console.log('ScrollReveal: invalid container "' + config.container + '" provided.');
        console.log('ScrollReveal: falling back to default container.');
      }
    }
    return sr.defaults.container;
  }

  /**
   * check to see if a node or node list was passed in as the target,
   * otherwise query the container using target as a selector.
   *
   * @param {Node|NodeList|string} [target]    client input for reveal target.
   * @param {Node}                 [container] parent element for selector queries.
   *
   * @return {array} elements to be revealed.
   */
  function _getRevealElements(target, container) {
    if (typeof target === 'string') {
      return Array.prototype.slice.call(container.querySelectorAll(target));
    } else if (sr.tools.isNode(target)) {
      return [target];
    } else if (sr.tools.isNodeList(target)) {
      return Array.prototype.slice.call(target);
    }
    return [];
  }

  /**
   * A consistent way of creating unique IDs.
   * @returns {number}
   */
  function _nextUid() {
    return ++sr.uid;
  }

  function _configure(elem, config, container) {
    // If a container was passed as a part of the config object,
    // let’s overwrite it with the resolved container passed in.
    if (config.container) config.container = container;
    // If the element hasn’t already been configured, let’s use a clone of the
    // defaults extended by the configuration passed as the second argument.
    if (!elem.config) {
      elem.config = sr.tools.extendClone(sr.defaults, config);
    } else {
      // Otherwise, let’s use a clone of the existing element configuration extended
      // by the configuration passed as the second argument.
      elem.config = sr.tools.extendClone(elem.config, config);
    }

    // Infer CSS Transform axis from origin string.
    if (elem.config.origin === 'top' || elem.config.origin === 'bottom') {
      elem.config.axis = 'Y';
    } else {
      elem.config.axis = 'X';
    }
  }

  function _style(elem) {
    var computed = window.getComputedStyle(elem.domEl);

    if (!elem.styles) {
      elem.styles = {
        transition: {},
        transform: {},
        computed: {}
      };

      // Capture any existing inline styles, and add our visibility override.
      // --
      // See section 4.2. in the Documentation:
      // https://github.com/jlmakes/scrollreveal.js#42-improve-user-experience
      elem.styles.inline = elem.domEl.getAttribute('style') || '';
      elem.styles.inline += '; visibility: visible; ';

      // grab the elements existing opacity.
      elem.styles.computed.opacity = computed.opacity;

      // grab the elements existing transitions.
      if (!computed.transition || computed.transition === 'all 0s ease 0s') {
        elem.styles.computed.transition = '';
      } else {
        elem.styles.computed.transition = computed.transition + ', ';
      }
    }

    // Create transition styles
    elem.styles.transition.instant = _generateTransition(elem, 0);
    elem.styles.transition.delayed = _generateTransition(elem, elem.config.delay);

    // Generate transform styles, first with the webkit prefix.
    elem.styles.transform.initial = ' -webkit-transform:';
    elem.styles.transform.target = ' -webkit-transform:';
    _generateTransform(elem);

    // And again without any prefix.
    elem.styles.transform.initial += 'transform:';
    elem.styles.transform.target += 'transform:';
    _generateTransform(elem);
  }

  function _generateTransition(elem, delay) {
    var config = elem.config;

    return '-webkit-transition: ' + elem.styles.computed.transition + '-webkit-transform ' + config.duration / 1000 + 's ' + config.easing + ' ' + delay / 1000 + 's, opacity ' + config.duration / 1000 + 's ' + config.easing + ' ' + delay / 1000 + 's; ' + 'transition: ' + elem.styles.computed.transition + 'transform ' + config.duration / 1000 + 's ' + config.easing + ' ' + delay / 1000 + 's, opacity ' + config.duration / 1000 + 's ' + config.easing + ' ' + delay / 1000 + 's; ';
  }

  function _generateTransform(elem) {
    var config = elem.config;
    var cssDistance;
    var transform = elem.styles.transform;

    // Let’s make sure our our pixel distances are negative for top and left.
    // e.g. origin = 'top' and distance = '25px' starts at `top: -25px` in CSS.
    if (config.origin === 'top' || config.origin === 'left') {
      cssDistance = /^-/.test(config.distance) ? config.distance.substr(1) : '-' + config.distance;
    } else {
      cssDistance = config.distance;
    }

    if (parseInt(config.distance)) {
      transform.initial += ' translate' + config.axis + '(' + cssDistance + ')';
      transform.target += ' translate' + config.axis + '(0)';
    }
    if (config.scale) {
      transform.initial += ' scale(' + config.scale + ')';
      transform.target += ' scale(1)';
    }
    if (config.rotate.x) {
      transform.initial += ' rotateX(' + config.rotate.x + 'deg)';
      transform.target += ' rotateX(0)';
    }
    if (config.rotate.y) {
      transform.initial += ' rotateY(' + config.rotate.y + 'deg)';
      transform.target += ' rotateY(0)';
    }
    if (config.rotate.z) {
      transform.initial += ' rotateZ(' + config.rotate.z + 'deg)';
      transform.target += ' rotateZ(0)';
    }
    transform.initial += '; opacity: ' + config.opacity + ';';
    transform.target += '; opacity: ' + elem.styles.computed.opacity + ';';
  }

  function _updateStore(elem) {
    var container = elem.config.container;

    // If this element’s container isn’t already in the store, let’s add it.
    if (container && sr.store.containers.indexOf(container) === -1) {
      sr.store.containers.push(elem.config.container);
    }

    // Update the element stored with our new element.
    sr.store.elements[elem.id] = elem;
  }

  function _record(target, config, interval) {
    // Save the `reveal()` arguments that triggered this `_record()` call, so we
    // can re-trace our steps when calling the `sync()` method.
    var record = {
      target: target,
      config: config,
      interval: interval
    };
    sr.history.push(record);
  }

  function _init() {
    if (sr.isSupported()) {
      // Initial animate call triggers valid reveal animations on first load.
      // Subsequent animate calls are made inside the event handler.
      _animate();

      // Then we loop through all container nodes in the store and bind event
      // listeners to each.
      for (var i = 0; i < sr.store.containers.length; i++) {
        sr.store.containers[i].addEventListener('scroll', _handler);
        sr.store.containers[i].addEventListener('resize', _handler);
      }

      // Let’s also do a one-time binding of window event listeners.
      if (!sr.initialized) {
        window.addEventListener('scroll', _handler);
        window.addEventListener('resize', _handler);
        sr.initialized = true;
      }
    }
    return sr;
  }

  function _handler() {
    _requestAnimationFrame(_animate);
  }

  function _setActiveSequences() {
    var active;
    var elem;
    var elemId;
    var sequence;

    // Loop through all sequences
    sr.tools.forOwn(sr.sequences, function (sequenceId) {
      sequence = sr.sequences[sequenceId];
      active = false;

      // For each sequenced elemenet, let’s check visibility and if
      // any are visible, set it’s sequence to active.
      for (var i = 0; i < sequence.elemIds.length; i++) {
        elemId = sequence.elemIds[i];
        elem = sr.store.elements[elemId];
        if (_isElemVisible(elem) && !active) {
          active = true;
        }
      }

      sequence.active = active;
    });
  }

  function _animate() {
    var delayed;
    var elem;

    _setActiveSequences();

    // Loop through all elements in the store
    sr.tools.forOwn(sr.store.elements, function (elemId) {
      elem = sr.store.elements[elemId];
      delayed = _shouldUseDelay(elem);

      // Let’s see if we should revealand if so,
      // trigger the `beforeReveal` callback and
      // determine whether or not to use delay.
      if (_shouldReveal(elem)) {
        elem.config.beforeReveal(elem.domEl);
        if (delayed) {
          elem.domEl.setAttribute('style', elem.styles.inline + elem.styles.transform.target + elem.styles.transition.delayed);
        } else {
          elem.domEl.setAttribute('style', elem.styles.inline + elem.styles.transform.target + elem.styles.transition.instant);
        }

        // Let’s queue the `afterReveal` callback
        // and mark the element as seen and revealing.
        _queueCallback('reveal', elem, delayed);
        elem.revealing = true;
        elem.seen = true;

        if (elem.sequence) {
          _queueNextInSequence(elem, delayed);
        }
      } else if (_shouldReset(elem)) {
        //Otherwise reset our element and
        // trigger the `beforeReset` callback.
        elem.config.beforeReset(elem.domEl);
        elem.domEl.setAttribute('style', elem.styles.inline + elem.styles.transform.initial + elem.styles.transition.instant);
        // And queue the `afterReset` callback.
        _queueCallback('reset', elem);
        elem.revealing = false;
      }
    });
  }

  function _queueNextInSequence(elem, delayed) {
    var elapsed = 0;
    var delay = 0;
    var sequence = sr.sequences[elem.sequence.id];

    // We’re processing a sequenced element, so let's block other elements in this sequence.
    sequence.blocked = true;

    // Since we’re triggering animations a part of a sequence after animations on first load,
    // we need to check for that condition and explicitly add the delay to our timer.
    if (delayed && elem.config.useDelay === 'onload') {
      delay = elem.config.delay;
    }

    // If a sequence timer is already running, capture the elapsed time and clear it.
    if (elem.sequence.timer) {
      elapsed = Math.abs(elem.sequence.timer.started - new Date());
      window.clearTimeout(elem.sequence.timer);
    }

    // Start a new timer.
    elem.sequence.timer = { started: new Date() };
    elem.sequence.timer.clock = window.setTimeout(function () {
      // Sequence interval has passed, so unblock the sequence and re-run the handler.
      sequence.blocked = false;
      elem.sequence.timer = null;
      _handler();
    }, Math.abs(sequence.interval) + delay - elapsed);
  }

  function _queueCallback(type, elem, delayed) {
    var elapsed = 0;
    var duration = 0;
    var callback = 'after';

    // Check which callback we’re working with.
    switch (type) {
      case 'reveal':
        duration = elem.config.duration;
        if (delayed) {
          duration += elem.config.delay;
        }
        callback += 'Reveal';
        break;

      case 'reset':
        duration = elem.config.duration;
        callback += 'Reset';
        break;
    }

    // If a timer is already running, capture the elapsed time and clear it.
    if (elem.timer) {
      elapsed = Math.abs(elem.timer.started - new Date());
      window.clearTimeout(elem.timer.clock);
    }

    // Start a new timer.
    elem.timer = { started: new Date() };
    elem.timer.clock = window.setTimeout(function () {
      // The timer completed, so let’s fire the callback and null the timer.
      elem.config[callback](elem.domEl);
      elem.timer = null;
    }, duration - elapsed);
  }

  function _shouldReveal(elem) {
    if (elem.sequence) {
      var sequence = sr.sequences[elem.sequence.id];
      return sequence.active && !sequence.blocked && !elem.revealing && !elem.disabled;
    }
    return _isElemVisible(elem) && !elem.revealing && !elem.disabled;
  }

  function _shouldUseDelay(elem) {
    var config = elem.config.useDelay;
    return config === 'always' || config === 'onload' && !sr.initialized || config === 'once' && !elem.seen;
  }

  function _shouldReset(elem) {
    if (elem.sequence) {
      var sequence = sr.sequences[elem.sequence.id];
      return !sequence.active && elem.config.reset && elem.revealing && !elem.disabled;
    }
    return !_isElemVisible(elem) && elem.config.reset && elem.revealing && !elem.disabled;
  }

  function _getContainer(container) {
    return {
      width: container.clientWidth,
      height: container.clientHeight
    };
  }

  function _getScrolled(container) {
    // Return the container scroll values, plus the its offset.
    if (container && container !== window.document.documentElement) {
      var offset = _getOffset(container);
      return {
        x: container.scrollLeft + offset.left,
        y: container.scrollTop + offset.top
      };
    } else {
      // Otherwise, default to the window object’s scroll values.
      return {
        x: window.pageXOffset,
        y: window.pageYOffset
      };
    }
  }

  function _getOffset(domEl) {
    var offsetTop = 0;
    var offsetLeft = 0;

    // Grab the element’s dimensions.
    var offsetHeight = domEl.offsetHeight;
    var offsetWidth = domEl.offsetWidth;

    // Now calculate the distance between the element and its parent, then
    // again for the parent to its parent, and again etc... until we have the
    // total distance of the element to the document’s top and left origin.
    do {
      if (!isNaN(domEl.offsetTop)) {
        offsetTop += domEl.offsetTop;
      }
      if (!isNaN(domEl.offsetLeft)) {
        offsetLeft += domEl.offsetLeft;
      }
      domEl = domEl.offsetParent;
    } while (domEl);

    return {
      top: offsetTop,
      left: offsetLeft,
      height: offsetHeight,
      width: offsetWidth
    };
  }

  function _isElemVisible(elem) {
    var offset = _getOffset(elem.domEl);
    var container = _getContainer(elem.config.container);
    var scrolled = _getScrolled(elem.config.container);
    var vF = elem.config.viewFactor;

    // Define the element geometry.
    var elemHeight = offset.height;
    var elemWidth = offset.width;
    var elemTop = offset.top;
    var elemLeft = offset.left;
    var elemBottom = elemTop + elemHeight;
    var elemRight = elemLeft + elemWidth;

    return confirmBounds() || isPositionFixed();

    function confirmBounds() {
      // Define the element’s functional boundaries using its view factor.
      var top = elemTop + elemHeight * vF;
      var left = elemLeft + elemWidth * vF;
      var bottom = elemBottom - elemHeight * vF;
      var right = elemRight - elemWidth * vF;

      // Define the container functional boundaries using its view offset.
      var viewTop = scrolled.y + elem.config.viewOffset.top;
      var viewLeft = scrolled.x + elem.config.viewOffset.left;
      var viewBottom = scrolled.y - elem.config.viewOffset.bottom + container.height;
      var viewRight = scrolled.x - elem.config.viewOffset.right + container.width;

      return top < viewBottom && bottom > viewTop && left > viewLeft && right < viewRight;
    }

    function isPositionFixed() {
      return window.getComputedStyle(elem.domEl).position === 'fixed';
    }
  }

  /**
   * Utilities
   * ---------
   */

  function Tools() {}

  Tools.prototype.isObject = function (object) {
    return object !== null && (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' && object.constructor === Object;
  };

  Tools.prototype.isNode = function (object) {
    return _typeof(window.Node) === 'object' ? object instanceof window.Node : object && (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' && typeof object.nodeType === 'number' && typeof object.nodeName === 'string';
  };

  Tools.prototype.isNodeList = function (object) {
    var prototypeToString = Object.prototype.toString.call(object);
    var regex = /^\[object (HTMLCollection|NodeList|Object)\]$/;

    return _typeof(window.NodeList) === 'object' ? object instanceof window.NodeList : object && (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' && regex.test(prototypeToString) && typeof object.length === 'number' && (object.length === 0 || this.isNode(object[0]));
  };

  Tools.prototype.forOwn = function (object, callback) {
    if (!this.isObject(object)) {
      throw new TypeError('Expected "object", but received "' + (typeof object === 'undefined' ? 'undefined' : _typeof(object)) + '".');
    } else {
      for (var property in object) {
        if (object.hasOwnProperty(property)) {
          callback(property);
        }
      }
    }
  };

  Tools.prototype.extend = function (target, source) {
    this.forOwn(source, function (property) {
      if (this.isObject(source[property])) {
        if (!target[property] || !this.isObject(target[property])) {
          target[property] = {};
        }
        this.extend(target[property], source[property]);
      } else {
        target[property] = source[property];
      }
    }.bind(this));
    return target;
  };

  Tools.prototype.extendClone = function (target, source) {
    return this.extend(this.extend({}, target), source);
  };

  Tools.prototype.isMobile = function () {
    return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  };

  /**
   * Polyfills
   * --------
   */

  _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };

  /**
   * Module Wrapper
   * --------------
   */
  if (typeof define === 'function' && _typeof(define.amd) === 'object' && define.amd) {
    define(function () {
      return ScrollReveal;
    });
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollReveal;
  } else {
    window.ScrollReveal = ScrollReveal;
  }
})();
"use strict";

/*!
 * jQuery clip-path-polygon Plugin v0.1.11 (2016-12-20)
 * jQuery plugin that makes easy to use clip-path on whatever tag under different browsers
 * https://github.com/andrusieczko/clip-path-polygon
 * 
 * Copyright 2016 Karol Andrusieczko
 * Released under MIT license
 */
var globalVariable = window || root,
    jQuery = jQuery || globalVariable.jQuery || require && require("jquery");(function (a) {
  var b = 0,
      c = function c(a, _c, d, e) {
    this.$ = a, this.$el = _c, this.points = d, this.svgDefId = "clipPathPolygonGenId" + b++, this.processOptions(e);
  };"undefined" != typeof exports ? ("undefined" != typeof module && module.exports && (exports = module.exports = c), exports.ClipPath = c) : globalVariable.ClipPath = c, c.prototype = { $: null, $el: null, points: null, isForWebkit: !0, isForSvg: !0, svgDefId: null, isPercentage: !1, create: function create() {
      this._createClipPath(this.points);
    }, _createClipPath: function _createClipPath(a) {
      this._createSvgDefs(), this.isForSvg && this._createSvgBasedClipPath(a), this.isForWebkit && this._createWebkitClipPath(a);
    }, _createWebkitClipPath: function _createWebkitClipPath(a) {
      var b = "polygon(" + this._translatePoints(a, !0, this.isPercentage) + ")";this.$el.css("-webkit-clip-path", b);
    }, _createSvgBasedClipPath: function _createSvgBasedClipPath(a) {
      this.$("#" + this.svgDefId).find("polygon").attr("points", this._translatePoints(a, !1, this.isPercentage)), this.$el.css("clip-path", "url(#" + this.svgDefId + ")");
    }, _translatePoints: function _translatePoints(a, b, c) {
      var d = [];for (var e in a) {
        var f = this._handlePxs(a[e][0], b, c),
            g = this._handlePxs(a[e][1], b, c);d.push(f + " " + g);
      }return d.join(", ");
    }, _handlePxs: function _handlePxs(a, b, c) {
      return 0 === a ? a : b ? a + (c ? "%" : "px") : c ? a / 100 : a;
    }, _createSvgElement: function _createSvgElement(a) {
      return this.$(document.createElementNS("http://www.w3.org/2000/svg", a));
    }, _createSvgDefs: function _createSvgDefs() {
      if (0 === this.$("#" + this.svgDefId).length) {
        var a = this._createSvgElement("svg").attr("width", 0).attr("height", 0).css({ position: "absolute", visibility: "hidden", width: 0, height: 0 }),
            b = this._createSvgElement("defs");a.append(b);var c = this._createSvgElement("clipPath").attr("id", this.svgDefId);this.isPercentage && c.get(0).setAttribute("clipPathUnits", "objectBoundingBox"), b.append(c);var d = this._createSvgElement("polygon");c.append(d), this.$("body").append(a);
      }
    }, processOptions: function processOptions(a) {
      this.isForWebkit = a && "undefined" != typeof a.isForWebkit ? a.isForWebkit : this.isForWebkit, this.isForSvg = a && "undefined" != typeof a.isForSvg ? a.isForSvg : this.isForSvg, this.isPercentage = a && a.isPercentage || this.isPercentage, this.svgDefId = a && a.svgDefId || this.svgDefId;
    } }, a.fn.clipPath = function (b, d) {
    return this.each(function () {
      var e = a(this),
          f = new c(a, e, b, d);f.create();
    });
  };
}).call(undefined, jQuery);
'use strict';

(function ($) {

  'use strict';

  $(window).bind('load', function () {

    // initiate foundation

    $(document).foundation();

    // hamburger icon animation

    $('#offCanvas').bind('opened.zf.offcanvas closed.zf.offcanvas', function () {
      $('.menu-icon').toggleClass('rotate');
    });
  });

  // clip-path polyfill for 'brands' page

  function clippathPolyfill() {
    var evenPoints = [[5, 100], [5, 60], [0, 50], [5, 40], [5, 0], [100, 0], [100, 100]];
    var oddPoints = [[95, 60], [95, 100], [0, 100], [0, 0], [95, 0], [95, 40], [100, 50]];
    var smallPoints = [[100, 95], [60, 95], [50, 100], [40, 95], [0, 95], [0, 0], [100, 0]];
    var current_width = $(window).width();
    if (current_width < 640) {
      $('.views-row-odd .text').clipPath(smallPoints, {
        isPercentage: true,
        svgDefId: 'smalloddSvg'
      });
      $('.views-row-even .text').clipPath(smallPoints, {
        isPercentage: true,
        svgDefId: 'smallevenSvg'
      });
    } else {
      $('.views-row-odd .text').clipPath(oddPoints, {
        isPercentage: true,
        svgDefId: 'oddSvg'
      });
      $('.views-row-even .text').clipPath(evenPoints, {
        isPercentage: true,
        svgDefId: 'evenSvg'
      });
    }
  }

  $(document).ready(clippathPolyfill);

  $(window).resize(clippathPolyfill);

  $(document).ready(function () {

    // add classes to split columns on product ranges page

    $('.views-row-even .text').addClass('medium-push-4 large-push-6');
    $('.views-row-even .logo').addClass('medium-pull-8 large-pull-6');

    // wrap li's around links in mobile navigation

    $('.off-canvas-list>a').wrap('<li />');

    // wrap a's around current pagination numbers

    $('li.pager-current, li.pager-ellipsis').wrapInner('<a />');

    // unwrap ul from mobile navigation

    $('.off-canvas-list ul#main-menu-links>li').unwrap();

    // add block grid class to site map list

    $('.site-map-box-menu>.content>ul.site-map-menu').addClass('row small-up-2 medium-up-3');

    // add column to li on block grid on site map page

    $('.site-map-box-menu>.content>ul.site-map-menu>li').addClass('column');

    // add h4 tags to page titles on site map page

    $('.site-map-box-menu>.content>ul.site-map-menu>li>a').wrap('<h4 />');

    // add svg icon to download link

    $('<svg class="icon icon-download"><use xlink:href="#icon-download"></use></svg>').prependTo('.major-header>.catalogue-link>li>a');

    // wrap tables with overflow auto

    $('table').wrap('<div class="overflow-auto" />');
  });

  // hide maps overlay when clicked

  $('.google-maps-overlay').on('click', function () {
    $(this).toggleClass('hide');
    return false;
  });

  // change to 4 item block grid when logged in for product data sheets

  $('.logged-in .view-product-data-sheets-main ul.medium-up-3').addClass('medium-up-4').removeClass('medium-up-3');

  // collapsing fieldset

  $('.fieldset-title').on('click', function () {
    $('.search-advanced').toggleClass('collapsing');
    $('.fieldset-wrapper').toggle(function () {
      $(this).animate({ height: '16px' }, 1000);
    }, function () {
      $(this).animate({ height: 'auto' }, 1000);
    });
    $('.fieldset-wrapper>.criterion, .fieldset-wrapper>.action').fadeToggle(500);
    $('.fieldset-legend-arrow').toggleClass('rotated');
    return false;
  });

  // scroll to sections

  $('a[href*=\\#]:not([href=\\#])').click(function () {
    if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        $('html, body').animate({
          scrollTop: target.offset().top
        }, 1000);
        return false;
      }
    }
  });

  // Drupal ajax (useful for captcha on forms)

  Drupal.behaviors.recapcha_ajax_behaviour = {
    attach: function attach(context, settings) {
      if (typeof grecaptcha != "undefined") {
        var captchas = document.getElementsByClassName('g-recaptcha');
        for (var i = 0; i < captchas.length; i++) {
          var site_key = captchas[i].getAttribute('data-sitekey');
          if (!$(captchas[i]).html()) {
            grecaptcha.render(captchas[i], { 'sitekey': site_key });
          }
        }
      }
    }
  };
})(jQuery);

// animation settings

var enterLeft = {
  origin: 'left',
  distance: '50px'
};

var enterRight = {
  origin: 'right',
  distance: '50px'
};

var enterLeft1 = {
  delay: 1000,
  origin: 'left',
  distance: '50px'
};

var enterRight1 = {
  delay: 1000,
  origin: 'right',
  distance: '50px'
};

window.sr = ScrollReveal().reveal('.enter-bottom').reveal('.enter-bottom-1', { delay: 500 }).reveal('.enter-bottom-2', { delay: 1000 }).reveal('.enter-bottom-3', { delay: 1500 }).reveal('.enter-bottom-4', { delay: 2000 }).reveal('.enter-left', enterLeft).reveal('.enter-right', enterRight).reveal('.enter-left-1', enterLeft1).reveal('.enter-right-1', enterRight1);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/*!
 * jQuery Form Plugin
 * version: 3.46.0-2013.11.21
 * Requires jQuery v1.5 or later
 * Copyright (c) 2013 M. Alsup
 * Examples and documentation at: http://malsup.com/jquery/form/
 * Project repository: https://github.com/malsup/form
 * Dual licensed under the MIT and GPL licenses.
 * https://github.com/malsup/form#copyright-and-license
 */
/*global ActiveXObject */

// AMD support
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // using AMD; register as anon module
        define(['jquery'], factory);
    } else {
        // no AMD; invoke directly
        factory(typeof jQuery != 'undefined' ? jQuery : window.Zepto);
    }
})(function ($) {
    "use strict";

    /*
        Usage Note:
        -----------
        Do not use both ajaxSubmit and ajaxForm on the same form.  These
        functions are mutually exclusive.  Use ajaxSubmit if you want
        to bind your own submit handler to the form.  For example,
    
        $(document).ready(function() {
            $('#myForm').on('submit', function(e) {
                e.preventDefault(); // <-- important
                $(this).ajaxSubmit({
                    target: '#output'
                });
            });
        });
    
        Use ajaxForm when you want the plugin to manage all the event binding
        for you.  For example,
    
        $(document).ready(function() {
            $('#myForm').ajaxForm({
                target: '#output'
            });
        });
    
        You can also use ajaxForm with delegation (requires jQuery v1.7+), so the
        form does not have to exist when you invoke ajaxForm:
    
        $('#myForm').ajaxForm({
            delegation: true,
            target: '#output'
        });
    
        When using ajaxForm, the ajaxSubmit function will be invoked for you
        at the appropriate time.
    */

    /**
     * Feature detection
     */

    var feature = {};
    feature.fileapi = $("<input type='file'/>").get(0).files !== undefined;
    feature.formdata = window.FormData !== undefined;

    var hasProp = !!$.fn.prop;

    // attr2 uses prop when it can but checks the return type for
    // an expected string.  this accounts for the case where a form 
    // contains inputs with names like "action" or "method"; in those
    // cases "prop" returns the element
    $.fn.attr2 = function () {
        if (!hasProp) return this.attr.apply(this, arguments);
        var val = this.prop.apply(this, arguments);
        if (val && val.jquery || typeof val === 'string') return val;
        return this.attr.apply(this, arguments);
    };

    /**
     * ajaxSubmit() provides a mechanism for immediately submitting
     * an HTML form using AJAX.
     */
    $.fn.ajaxSubmit = function (options) {
        /*jshint scripturl:true */

        // fast fail if nothing selected (http://dev.jquery.com/ticket/2752)
        if (!this.length) {
            log('ajaxSubmit: skipping submit process - no element selected');
            return this;
        }

        var method,
            action,
            url,
            $form = this;

        if (typeof options == 'function') {
            options = { success: options };
        } else if (options === undefined) {
            options = {};
        }

        method = options.type || this.attr2('method');
        action = options.url || this.attr2('action');

        url = typeof action === 'string' ? $.trim(action) : '';
        url = url || window.location.href || '';
        if (url) {
            // clean url (don't include hash vaue)
            url = (url.match(/^([^#]+)/) || [])[1];
        }

        options = $.extend(true, {
            url: url,
            success: $.ajaxSettings.success,
            type: method || $.ajaxSettings.type,
            iframeSrc: /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank'
        }, options);

        // hook for manipulating the form data before it is extracted;
        // convenient for use with rich editors like tinyMCE or FCKEditor
        var veto = {};
        this.trigger('form-pre-serialize', [this, options, veto]);
        if (veto.veto) {
            log('ajaxSubmit: submit vetoed via form-pre-serialize trigger');
            return this;
        }

        // provide opportunity to alter form data before it is serialized
        if (options.beforeSerialize && options.beforeSerialize(this, options) === false) {
            log('ajaxSubmit: submit aborted via beforeSerialize callback');
            return this;
        }

        var traditional = options.traditional;
        if (traditional === undefined) {
            traditional = $.ajaxSettings.traditional;
        }

        var elements = [];
        var qx,
            a = this.formToArray(options.semantic, elements);
        if (options.data) {
            options.extraData = options.data;
            qx = $.param(options.data, traditional);
        }

        // give pre-submit callback an opportunity to abort the submit
        if (options.beforeSubmit && options.beforeSubmit(a, this, options) === false) {
            log('ajaxSubmit: submit aborted via beforeSubmit callback');
            return this;
        }

        // fire vetoable 'validate' event
        this.trigger('form-submit-validate', [a, this, options, veto]);
        if (veto.veto) {
            log('ajaxSubmit: submit vetoed via form-submit-validate trigger');
            return this;
        }

        var q = $.param(a, traditional);
        if (qx) {
            q = q ? q + '&' + qx : qx;
        }
        if (options.type.toUpperCase() == 'GET') {
            options.url += (options.url.indexOf('?') >= 0 ? '&' : '?') + q;
            options.data = null; // data is null for 'get'
        } else {
            options.data = q; // data is the query string for 'post'
        }

        var callbacks = [];
        if (options.resetForm) {
            callbacks.push(function () {
                $form.resetForm();
            });
        }
        if (options.clearForm) {
            callbacks.push(function () {
                $form.clearForm(options.includeHidden);
            });
        }

        // perform a load on the target only if dataType is not provided
        if (!options.dataType && options.target) {
            var oldSuccess = options.success || function () {};
            callbacks.push(function (data) {
                var fn = options.replaceTarget ? 'replaceWith' : 'html';
                $(options.target)[fn](data).each(oldSuccess, arguments);
            });
        } else if (options.success) {
            callbacks.push(options.success);
        }

        options.success = function (data, status, xhr) {
            // jQuery 1.4+ passes xhr as 3rd arg
            var context = options.context || this; // jQuery 1.4+ supports scope context
            for (var i = 0, max = callbacks.length; i < max; i++) {
                callbacks[i].apply(context, [data, status, xhr || $form, $form]);
            }
        };

        if (options.error) {
            var oldError = options.error;
            options.error = function (xhr, status, error) {
                var context = options.context || this;
                oldError.apply(context, [xhr, status, error, $form]);
            };
        }

        if (options.complete) {
            var oldComplete = options.complete;
            options.complete = function (xhr, status) {
                var context = options.context || this;
                oldComplete.apply(context, [xhr, status, $form]);
            };
        }

        // are there files to upload?

        // [value] (issue #113), also see comment:
        // https://github.com/malsup/form/commit/588306aedba1de01388032d5f42a60159eea9228#commitcomment-2180219
        var fileInputs = $('input[type=file]:enabled', this).filter(function () {
            return $(this).val() !== '';
        });

        var hasFileInputs = fileInputs.length > 0;
        var mp = 'multipart/form-data';
        var multipart = $form.attr('enctype') == mp || $form.attr('encoding') == mp;

        var fileAPI = feature.fileapi && feature.formdata;
        log("fileAPI :" + fileAPI);
        var shouldUseFrame = (hasFileInputs || multipart) && !fileAPI;

        var jqxhr;

        // options.iframe allows user to force iframe mode
        // 06-NOV-09: now defaulting to iframe mode if file input is detected
        if (options.iframe !== false && (options.iframe || shouldUseFrame)) {
            // hack to fix Safari hang (thanks to Tim Molendijk for this)
            // see:  http://groups.google.com/group/jquery-dev/browse_thread/thread/36395b7ab510dd5d
            if (options.closeKeepAlive) {
                $.get(options.closeKeepAlive, function () {
                    jqxhr = fileUploadIframe(a);
                });
            } else {
                jqxhr = fileUploadIframe(a);
            }
        } else if ((hasFileInputs || multipart) && fileAPI) {
            jqxhr = fileUploadXhr(a);
        } else {
            jqxhr = $.ajax(options);
        }

        $form.removeData('jqxhr').data('jqxhr', jqxhr);

        // clear element array
        for (var k = 0; k < elements.length; k++) {
            elements[k] = null;
        } // fire 'notify' event
        this.trigger('form-submit-notify', [this, options]);
        return this;

        // utility fn for deep serialization
        function deepSerialize(extraData) {
            var serialized = $.param(extraData, options.traditional).split('&');
            var len = serialized.length;
            var result = [];
            var i, part;
            for (i = 0; i < len; i++) {
                // #252; undo param space replacement
                serialized[i] = serialized[i].replace(/\+/g, ' ');
                part = serialized[i].split('=');
                // #278; use array instead of object storage, favoring array serializations
                result.push([decodeURIComponent(part[0]), decodeURIComponent(part[1])]);
            }
            return result;
        }

        // XMLHttpRequest Level 2 file uploads (big hat tip to francois2metz)
        function fileUploadXhr(a) {
            var formdata = new FormData();

            for (var i = 0; i < a.length; i++) {
                formdata.append(a[i].name, a[i].value);
            }

            if (options.extraData) {
                var serializedData = deepSerialize(options.extraData);
                for (i = 0; i < serializedData.length; i++) {
                    if (serializedData[i]) formdata.append(serializedData[i][0], serializedData[i][1]);
                }
            }

            options.data = null;

            var s = $.extend(true, {}, $.ajaxSettings, options, {
                contentType: false,
                processData: false,
                cache: false,
                type: method || 'POST'
            });

            if (options.uploadProgress) {
                // workaround because jqXHR does not expose upload property
                s.xhr = function () {
                    var xhr = $.ajaxSettings.xhr();
                    if (xhr.upload) {
                        xhr.upload.addEventListener('progress', function (event) {
                            var percent = 0;
                            var position = event.loaded || event.position; /*event.position is deprecated*/
                            var total = event.total;
                            if (event.lengthComputable) {
                                percent = Math.ceil(position / total * 100);
                            }
                            options.uploadProgress(event, position, total, percent);
                        }, false);
                    }
                    return xhr;
                };
            }

            s.data = null;
            var beforeSend = s.beforeSend;
            s.beforeSend = function (xhr, o) {
                //Send FormData() provided by user
                if (options.formData) o.data = options.formData;else o.data = formdata;
                if (beforeSend) beforeSend.call(this, xhr, o);
            };
            return $.ajax(s);
        }

        // private function for handling file uploads (hat tip to YAHOO!)
        function fileUploadIframe(a) {
            var form = $form[0],
                el,
                i,
                s,
                g,
                id,
                $io,
                io,
                xhr,
                sub,
                n,
                timedOut,
                timeoutHandle;
            var deferred = $.Deferred();

            // #341
            deferred.abort = function (status) {
                xhr.abort(status);
            };

            if (a) {
                // ensure that every serialized input is still enabled
                for (i = 0; i < elements.length; i++) {
                    el = $(elements[i]);
                    if (hasProp) el.prop('disabled', false);else el.removeAttr('disabled');
                }
            }

            s = $.extend(true, {}, $.ajaxSettings, options);
            s.context = s.context || s;
            id = 'jqFormIO' + new Date().getTime();
            if (s.iframeTarget) {
                $io = $(s.iframeTarget);
                n = $io.attr2('name');
                if (!n) $io.attr2('name', id);else id = n;
            } else {
                $io = $('<iframe name="' + id + '" src="' + s.iframeSrc + '" />');
                $io.css({ position: 'absolute', top: '-1000px', left: '-1000px' });
            }
            io = $io[0];

            xhr = { // mock object
                aborted: 0,
                responseText: null,
                responseXML: null,
                status: 0,
                statusText: 'n/a',
                getAllResponseHeaders: function getAllResponseHeaders() {},
                getResponseHeader: function getResponseHeader() {},
                setRequestHeader: function setRequestHeader() {},
                abort: function abort(status) {
                    var e = status === 'timeout' ? 'timeout' : 'aborted';
                    log('aborting upload... ' + e);
                    this.aborted = 1;

                    try {
                        // #214, #257
                        if (io.contentWindow.document.execCommand) {
                            io.contentWindow.document.execCommand('Stop');
                        }
                    } catch (ignore) {}

                    $io.attr('src', s.iframeSrc); // abort op in progress
                    xhr.error = e;
                    if (s.error) s.error.call(s.context, xhr, e, status);
                    if (g) $.event.trigger("ajaxError", [xhr, s, e]);
                    if (s.complete) s.complete.call(s.context, xhr, e);
                }
            };

            g = s.global;
            // trigger ajax global events so that activity/block indicators work like normal
            if (g && 0 === $.active++) {
                $.event.trigger("ajaxStart");
            }
            if (g) {
                $.event.trigger("ajaxSend", [xhr, s]);
            }

            if (s.beforeSend && s.beforeSend.call(s.context, xhr, s) === false) {
                if (s.global) {
                    $.active--;
                }
                deferred.reject();
                return deferred;
            }
            if (xhr.aborted) {
                deferred.reject();
                return deferred;
            }

            // add submitting element to data if we know it
            sub = form.clk;
            if (sub) {
                n = sub.name;
                if (n && !sub.disabled) {
                    s.extraData = s.extraData || {};
                    s.extraData[n] = sub.value;
                    if (sub.type == "image") {
                        s.extraData[n + '.x'] = form.clk_x;
                        s.extraData[n + '.y'] = form.clk_y;
                    }
                }
            }

            var CLIENT_TIMEOUT_ABORT = 1;
            var SERVER_ABORT = 2;

            function getDoc(frame) {
                /* it looks like contentWindow or contentDocument do not
                 * carry the protocol property in ie8, when running under ssl
                 * frame.document is the only valid response document, since
                 * the protocol is know but not on the other two objects. strange?
                 * "Same origin policy" http://en.wikipedia.org/wiki/Same_origin_policy
                 */

                var doc = null;

                // IE8 cascading access check
                try {
                    if (frame.contentWindow) {
                        doc = frame.contentWindow.document;
                    }
                } catch (err) {
                    // IE8 access denied under ssl & missing protocol
                    log('cannot get iframe.contentWindow document: ' + err);
                }

                if (doc) {
                    // successful getting content
                    return doc;
                }

                try {
                    // simply checking may throw in ie8 under ssl or mismatched protocol
                    doc = frame.contentDocument ? frame.contentDocument : frame.document;
                } catch (err) {
                    // last attempt
                    log('cannot get iframe.contentDocument: ' + err);
                    doc = frame.document;
                }
                return doc;
            }

            // Rails CSRF hack (thanks to Yvan Barthelemy)
            var csrf_token = $('meta[name=csrf-token]').attr('content');
            var csrf_param = $('meta[name=csrf-param]').attr('content');
            if (csrf_param && csrf_token) {
                s.extraData = s.extraData || {};
                s.extraData[csrf_param] = csrf_token;
            }

            // take a breath so that pending repaints get some cpu time before the upload starts
            function doSubmit() {
                // make sure form attrs are set
                var t = $form.attr2('target'),
                    a = $form.attr2('action');

                // update form attrs in IE friendly way
                form.setAttribute('target', id);
                if (!method || /post/i.test(method)) {
                    form.setAttribute('method', 'POST');
                }
                if (a != s.url) {
                    form.setAttribute('action', s.url);
                }

                // ie borks in some cases when setting encoding
                if (!s.skipEncodingOverride && (!method || /post/i.test(method))) {
                    $form.attr({
                        encoding: 'multipart/form-data',
                        enctype: 'multipart/form-data'
                    });
                }

                // support timout
                if (s.timeout) {
                    timeoutHandle = setTimeout(function () {
                        timedOut = true;cb(CLIENT_TIMEOUT_ABORT);
                    }, s.timeout);
                }

                // look for server aborts
                function checkState() {
                    try {
                        var state = getDoc(io).readyState;
                        log('state = ' + state);
                        if (state && state.toLowerCase() == 'uninitialized') setTimeout(checkState, 50);
                    } catch (e) {
                        log('Server abort: ', e, ' (', e.name, ')');
                        cb(SERVER_ABORT);
                        if (timeoutHandle) clearTimeout(timeoutHandle);
                        timeoutHandle = undefined;
                    }
                }

                // add "extra" data to form if provided in options
                var extraInputs = [];
                try {
                    if (s.extraData) {
                        for (var n in s.extraData) {
                            if (s.extraData.hasOwnProperty(n)) {
                                // if using the $.param format that allows for multiple values with the same name
                                if ($.isPlainObject(s.extraData[n]) && s.extraData[n].hasOwnProperty('name') && s.extraData[n].hasOwnProperty('value')) {
                                    extraInputs.push($('<input type="hidden" name="' + s.extraData[n].name + '">').val(s.extraData[n].value).appendTo(form)[0]);
                                } else {
                                    extraInputs.push($('<input type="hidden" name="' + n + '">').val(s.extraData[n]).appendTo(form)[0]);
                                }
                            }
                        }
                    }

                    if (!s.iframeTarget) {
                        // add iframe to doc and submit the form
                        $io.appendTo('body');
                    }
                    if (io.attachEvent) io.attachEvent('onload', cb);else io.addEventListener('load', cb, false);
                    setTimeout(checkState, 15);

                    try {
                        form.submit();
                    } catch (err) {
                        // just in case form has element with name/id of 'submit'
                        var submitFn = document.createElement('form').submit;
                        submitFn.apply(form);
                    }
                } finally {
                    // reset attrs and remove "extra" input elements
                    form.setAttribute('action', a);
                    if (t) {
                        form.setAttribute('target', t);
                    } else {
                        $form.removeAttr('target');
                    }
                    $(extraInputs).remove();
                }
            }

            if (s.forceSync) {
                doSubmit();
            } else {
                setTimeout(doSubmit, 10); // this lets dom updates render
            }

            var data,
                doc,
                domCheckCount = 50,
                callbackProcessed;

            function cb(e) {
                if (xhr.aborted || callbackProcessed) {
                    return;
                }

                doc = getDoc(io);
                if (!doc) {
                    log('cannot access response document');
                    e = SERVER_ABORT;
                }
                if (e === CLIENT_TIMEOUT_ABORT && xhr) {
                    xhr.abort('timeout');
                    deferred.reject(xhr, 'timeout');
                    return;
                } else if (e == SERVER_ABORT && xhr) {
                    xhr.abort('server abort');
                    deferred.reject(xhr, 'error', 'server abort');
                    return;
                }

                if (!doc || doc.location.href == s.iframeSrc) {
                    // response not received yet
                    if (!timedOut) return;
                }
                if (io.detachEvent) io.detachEvent('onload', cb);else io.removeEventListener('load', cb, false);

                var status = 'success',
                    errMsg;
                try {
                    if (timedOut) {
                        throw 'timeout';
                    }

                    var isXml = s.dataType == 'xml' || doc.XMLDocument || $.isXMLDoc(doc);
                    log('isXml=' + isXml);
                    if (!isXml && window.opera && (doc.body === null || !doc.body.innerHTML)) {
                        if (--domCheckCount) {
                            // in some browsers (Opera) the iframe DOM is not always traversable when
                            // the onload callback fires, so we loop a bit to accommodate
                            log('requeing onLoad callback, DOM not available');
                            setTimeout(cb, 250);
                            return;
                        }
                        // let this fall through because server response could be an empty document
                        //log('Could not access iframe DOM after mutiple tries.');
                        //throw 'DOMException: not available';
                    }

                    //log('response detected');
                    var docRoot = doc.body ? doc.body : doc.documentElement;
                    xhr.responseText = docRoot ? docRoot.innerHTML : null;
                    xhr.responseXML = doc.XMLDocument ? doc.XMLDocument : doc;
                    if (isXml) s.dataType = 'xml';
                    xhr.getResponseHeader = function (header) {
                        var headers = { 'content-type': s.dataType };
                        return headers[header.toLowerCase()];
                    };
                    // support for XHR 'status' & 'statusText' emulation :
                    if (docRoot) {
                        xhr.status = Number(docRoot.getAttribute('status')) || xhr.status;
                        xhr.statusText = docRoot.getAttribute('statusText') || xhr.statusText;
                    }

                    var dt = (s.dataType || '').toLowerCase();
                    var scr = /(json|script|text)/.test(dt);
                    if (scr || s.textarea) {
                        // see if user embedded response in textarea
                        var ta = doc.getElementsByTagName('textarea')[0];
                        if (ta) {
                            xhr.responseText = ta.value;
                            // support for XHR 'status' & 'statusText' emulation :
                            xhr.status = Number(ta.getAttribute('status')) || xhr.status;
                            xhr.statusText = ta.getAttribute('statusText') || xhr.statusText;
                        } else if (scr) {
                            // account for browsers injecting pre around json response
                            var pre = doc.getElementsByTagName('pre')[0];
                            var b = doc.getElementsByTagName('body')[0];
                            if (pre) {
                                xhr.responseText = pre.textContent ? pre.textContent : pre.innerText;
                            } else if (b) {
                                xhr.responseText = b.textContent ? b.textContent : b.innerText;
                            }
                        }
                    } else if (dt == 'xml' && !xhr.responseXML && xhr.responseText) {
                        xhr.responseXML = toXml(xhr.responseText);
                    }

                    try {
                        data = httpData(xhr, dt, s);
                    } catch (err) {
                        status = 'parsererror';
                        xhr.error = errMsg = err || status;
                    }
                } catch (err) {
                    log('error caught: ', err);
                    status = 'error';
                    xhr.error = errMsg = err || status;
                }

                if (xhr.aborted) {
                    log('upload aborted');
                    status = null;
                }

                if (xhr.status) {
                    // we've set xhr.status
                    status = xhr.status >= 200 && xhr.status < 300 || xhr.status === 304 ? 'success' : 'error';
                }

                // ordering of these callbacks/triggers is odd, but that's how $.ajax does it
                if (status === 'success') {
                    if (s.success) s.success.call(s.context, data, 'success', xhr);
                    deferred.resolve(xhr.responseText, 'success', xhr);
                    if (g) $.event.trigger("ajaxSuccess", [xhr, s]);
                } else if (status) {
                    if (errMsg === undefined) errMsg = xhr.statusText;
                    if (s.error) s.error.call(s.context, xhr, status, errMsg);
                    deferred.reject(xhr, 'error', errMsg);
                    if (g) $.event.trigger("ajaxError", [xhr, s, errMsg]);
                }

                if (g) $.event.trigger("ajaxComplete", [xhr, s]);

                if (g && ! --$.active) {
                    $.event.trigger("ajaxStop");
                }

                if (s.complete) s.complete.call(s.context, xhr, status);

                callbackProcessed = true;
                if (s.timeout) clearTimeout(timeoutHandle);

                // clean up
                setTimeout(function () {
                    if (!s.iframeTarget) $io.remove();else //adding else to clean up existing iframe response.
                        $io.attr('src', s.iframeSrc);
                    xhr.responseXML = null;
                }, 100);
            }

            var toXml = $.parseXML || function (s, doc) {
                // use parseXML if available (jQuery 1.5+)
                if (window.ActiveXObject) {
                    doc = new ActiveXObject('Microsoft.XMLDOM');
                    doc.async = 'false';
                    doc.loadXML(s);
                } else {
                    doc = new DOMParser().parseFromString(s, 'text/xml');
                }
                return doc && doc.documentElement && doc.documentElement.nodeName != 'parsererror' ? doc : null;
            };
            var parseJSON = $.parseJSON || function (s) {
                /*jslint evil:true */
                return window['eval']('(' + s + ')');
            };

            var httpData = function httpData(xhr, type, s) {
                // mostly lifted from jq1.4.4

                var ct = xhr.getResponseHeader('content-type') || '',
                    xml = type === 'xml' || !type && ct.indexOf('xml') >= 0,
                    data = xml ? xhr.responseXML : xhr.responseText;

                if (xml && data.documentElement.nodeName === 'parsererror') {
                    if ($.error) $.error('parsererror');
                }
                if (s && s.dataFilter) {
                    data = s.dataFilter(data, type);
                }
                if (typeof data === 'string') {
                    if (type === 'json' || !type && ct.indexOf('json') >= 0) {
                        data = parseJSON(data);
                    } else if (type === "script" || !type && ct.indexOf("javascript") >= 0) {
                        $.globalEval(data);
                    }
                }
                return data;
            };

            return deferred;
        }
    };

    /**
     * ajaxForm() provides a mechanism for fully automating form submission.
     *
     * The advantages of using this method instead of ajaxSubmit() are:
     *
     * 1: This method will include coordinates for <input type="image" /> elements (if the element
     *    is used to submit the form).
     * 2. This method will include the submit element's name/value data (for the element that was
     *    used to submit the form).
     * 3. This method binds the submit() method to the form for you.
     *
     * The options argument for ajaxForm works exactly as it does for ajaxSubmit.  ajaxForm merely
     * passes the options argument along after properly binding events for submit elements and
     * the form itself.
     */
    $.fn.ajaxForm = function (options) {
        options = options || {};
        options.delegation = options.delegation && $.isFunction($.fn.on);

        // in jQuery 1.3+ we can fix mistakes with the ready state
        if (!options.delegation && this.length === 0) {
            var o = { s: this.selector, c: this.context };
            if (!$.isReady && o.s) {
                log('DOM not ready, queuing ajaxForm');
                $(function () {
                    $(o.s, o.c).ajaxForm(options);
                });
                return this;
            }
            // is your DOM ready?  http://docs.jquery.com/Tutorials:Introducing_$(document).ready()
            log('terminating; zero elements found by selector' + ($.isReady ? '' : ' (DOM not ready)'));
            return this;
        }

        if (options.delegation) {
            $(document).off('submit.form-plugin', this.selector, doAjaxSubmit).off('click.form-plugin', this.selector, captureSubmittingElement).on('submit.form-plugin', this.selector, options, doAjaxSubmit).on('click.form-plugin', this.selector, options, captureSubmittingElement);
            return this;
        }

        return this.ajaxFormUnbind().bind('submit.form-plugin', options, doAjaxSubmit).bind('click.form-plugin', options, captureSubmittingElement);
    };

    // private event handlers
    function doAjaxSubmit(e) {
        /*jshint validthis:true */
        var options = e.data;
        if (!e.isDefaultPrevented()) {
            // if event has been canceled, don't proceed
            e.preventDefault();
            $(e.target).ajaxSubmit(options); // #365
        }
    }

    function captureSubmittingElement(e) {
        /*jshint validthis:true */
        var target = e.target;
        var $el = $(target);
        if (!$el.is("[type=submit],[type=image]")) {
            // is this a child element of the submit el?  (ex: a span within a button)
            var t = $el.closest('[type=submit]');
            if (t.length === 0) {
                return;
            }
            target = t[0];
        }
        var form = this;
        form.clk = target;
        if (target.type == 'image') {
            if (e.offsetX !== undefined) {
                form.clk_x = e.offsetX;
                form.clk_y = e.offsetY;
            } else if (typeof $.fn.offset == 'function') {
                var offset = $el.offset();
                form.clk_x = e.pageX - offset.left;
                form.clk_y = e.pageY - offset.top;
            } else {
                form.clk_x = e.pageX - target.offsetLeft;
                form.clk_y = e.pageY - target.offsetTop;
            }
        }
        // clear form vars
        setTimeout(function () {
            form.clk = form.clk_x = form.clk_y = null;
        }, 100);
    }

    // ajaxFormUnbind unbinds the event handlers that were bound by ajaxForm
    $.fn.ajaxFormUnbind = function () {
        return this.unbind('submit.form-plugin click.form-plugin');
    };

    /**
     * formToArray() gathers form element data into an array of objects that can
     * be passed to any of the following ajax functions: $.get, $.post, or load.
     * Each object in the array has both a 'name' and 'value' property.  An example of
     * an array for a simple login form might be:
     *
     * [ { name: 'username', value: 'jresig' }, { name: 'password', value: 'secret' } ]
     *
     * It is this array that is passed to pre-submit callback functions provided to the
     * ajaxSubmit() and ajaxForm() methods.
     */
    $.fn.formToArray = function (semantic, elements) {
        var a = [];
        if (this.length === 0) {
            return a;
        }

        var form = this[0];
        var els = semantic ? form.getElementsByTagName('*') : form.elements;
        if (!els) {
            return a;
        }

        var i, j, n, v, el, max, jmax;
        for (i = 0, max = els.length; i < max; i++) {
            el = els[i];
            n = el.name;
            if (!n || el.disabled) {
                continue;
            }

            if (semantic && form.clk && el.type == "image") {
                // handle image inputs on the fly when semantic == true
                if (form.clk == el) {
                    a.push({ name: n, value: $(el).val(), type: el.type });
                    a.push({ name: n + '.x', value: form.clk_x }, { name: n + '.y', value: form.clk_y });
                }
                continue;
            }

            v = $.fieldValue(el, true);
            if (v && v.constructor == Array) {
                if (elements) elements.push(el);
                for (j = 0, jmax = v.length; j < jmax; j++) {
                    a.push({ name: n, value: v[j] });
                }
            } else if (feature.fileapi && el.type == 'file') {
                if (elements) elements.push(el);
                var files = el.files;
                if (files.length) {
                    for (j = 0; j < files.length; j++) {
                        a.push({ name: n, value: files[j], type: el.type });
                    }
                } else {
                    // #180
                    a.push({ name: n, value: '', type: el.type });
                }
            } else if (v !== null && typeof v != 'undefined') {
                if (elements) elements.push(el);
                a.push({ name: n, value: v, type: el.type, required: el.required });
            }
        }

        if (!semantic && form.clk) {
            // input type=='image' are not found in elements array! handle it here
            var $input = $(form.clk),
                input = $input[0];
            n = input.name;
            if (n && !input.disabled && input.type == 'image') {
                a.push({ name: n, value: $input.val() });
                a.push({ name: n + '.x', value: form.clk_x }, { name: n + '.y', value: form.clk_y });
            }
        }
        return a;
    };

    /**
     * Serializes form data into a 'submittable' string. This method will return a string
     * in the format: name1=value1&amp;name2=value2
     */
    $.fn.formSerialize = function (semantic) {
        //hand off to jQuery.param for proper encoding
        return $.param(this.formToArray(semantic));
    };

    /**
     * Serializes all field elements in the jQuery object into a query string.
     * This method will return a string in the format: name1=value1&amp;name2=value2
     */
    $.fn.fieldSerialize = function (successful) {
        var a = [];
        this.each(function () {
            var n = this.name;
            if (!n) {
                return;
            }
            var v = $.fieldValue(this, successful);
            if (v && v.constructor == Array) {
                for (var i = 0, max = v.length; i < max; i++) {
                    a.push({ name: n, value: v[i] });
                }
            } else if (v !== null && typeof v != 'undefined') {
                a.push({ name: this.name, value: v });
            }
        });
        //hand off to jQuery.param for proper encoding
        return $.param(a);
    };

    /**
     * Returns the value(s) of the element in the matched set.  For example, consider the following form:
     *
     *  <form><fieldset>
     *      <input name="A" type="text" />
     *      <input name="A" type="text" />
     *      <input name="B" type="checkbox" value="B1" />
     *      <input name="B" type="checkbox" value="B2"/>
     *      <input name="C" type="radio" value="C1" />
     *      <input name="C" type="radio" value="C2" />
     *  </fieldset></form>
     *
     *  var v = $('input[type=text]').fieldValue();
     *  // if no values are entered into the text inputs
     *  v == ['','']
     *  // if values entered into the text inputs are 'foo' and 'bar'
     *  v == ['foo','bar']
     *
     *  var v = $('input[type=checkbox]').fieldValue();
     *  // if neither checkbox is checked
     *  v === undefined
     *  // if both checkboxes are checked
     *  v == ['B1', 'B2']
     *
     *  var v = $('input[type=radio]').fieldValue();
     *  // if neither radio is checked
     *  v === undefined
     *  // if first radio is checked
     *  v == ['C1']
     *
     * The successful argument controls whether or not the field element must be 'successful'
     * (per http://www.w3.org/TR/html4/interact/forms.html#successful-controls).
     * The default value of the successful argument is true.  If this value is false the value(s)
     * for each element is returned.
     *
     * Note: This method *always* returns an array.  If no valid value can be determined the
     *    array will be empty, otherwise it will contain one or more values.
     */
    $.fn.fieldValue = function (successful) {
        for (var val = [], i = 0, max = this.length; i < max; i++) {
            var el = this[i];
            var v = $.fieldValue(el, successful);
            if (v === null || typeof v == 'undefined' || v.constructor == Array && !v.length) {
                continue;
            }
            if (v.constructor == Array) $.merge(val, v);else val.push(v);
        }
        return val;
    };

    /**
     * Returns the value of the field element.
     */
    $.fieldValue = function (el, successful) {
        var n = el.name,
            t = el.type,
            tag = el.tagName.toLowerCase();
        if (successful === undefined) {
            successful = true;
        }

        if (successful && (!n || el.disabled || t == 'reset' || t == 'button' || (t == 'checkbox' || t == 'radio') && !el.checked || (t == 'submit' || t == 'image') && el.form && el.form.clk != el || tag == 'select' && el.selectedIndex == -1)) {
            return null;
        }

        if (tag == 'select') {
            var index = el.selectedIndex;
            if (index < 0) {
                return null;
            }
            var a = [],
                ops = el.options;
            var one = t == 'select-one';
            var max = one ? index + 1 : ops.length;
            for (var i = one ? index : 0; i < max; i++) {
                var op = ops[i];
                if (op.selected) {
                    var v = op.value;
                    if (!v) {
                        // extra pain for IE...
                        v = op.attributes && op.attributes['value'] && !op.attributes['value'].specified ? op.text : op.value;
                    }
                    if (one) {
                        return v;
                    }
                    a.push(v);
                }
            }
            return a;
        }
        return $(el).val();
    };

    /**
     * Clears the form data.  Takes the following actions on the form's input fields:
     *  - input text fields will have their 'value' property set to the empty string
     *  - select elements will have their 'selectedIndex' property set to -1
     *  - checkbox and radio inputs will have their 'checked' property set to false
     *  - inputs of type submit, button, reset, and hidden will *not* be effected
     *  - button elements will *not* be effected
     */
    $.fn.clearForm = function (includeHidden) {
        return this.each(function () {
            $('input,select,textarea', this).clearFields(includeHidden);
        });
    };

    /**
     * Clears the selected form elements.
     */
    $.fn.clearFields = $.fn.clearInputs = function (includeHidden) {
        var re = /^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i; // 'hidden' is not in this list
        return this.each(function () {
            var t = this.type,
                tag = this.tagName.toLowerCase();
            if (re.test(t) || tag == 'textarea') {
                this.value = '';
            } else if (t == 'checkbox' || t == 'radio') {
                this.checked = false;
            } else if (tag == 'select') {
                this.selectedIndex = -1;
            } else if (t == "file") {
                if (/MSIE/.test(navigator.userAgent)) {
                    $(this).replaceWith($(this).clone(true));
                } else {
                    $(this).val('');
                }
            } else if (includeHidden) {
                // includeHidden can be the value true, or it can be a selector string
                // indicating a special test; for example:
                //  $('#myForm').clearForm('.special:hidden')
                // the above would clean hidden inputs that have the class of 'special'
                if (includeHidden === true && /hidden/.test(t) || typeof includeHidden == 'string' && $(this).is(includeHidden)) this.value = '';
            }
        });
    };

    /**
     * Resets the form data.  Causes all form elements to be reset to their original value.
     */
    $.fn.resetForm = function () {
        return this.each(function () {
            // guard against an input with the name of 'reset'
            // note that IE reports the reset function as an 'object'
            if (typeof this.reset == 'function' || _typeof(this.reset) == 'object' && !this.reset.nodeType) {
                this.reset();
            }
        });
    };

    /**
     * Enables or disables any matching elements.
     */
    $.fn.enable = function (b) {
        if (b === undefined) {
            b = true;
        }
        return this.each(function () {
            this.disabled = !b;
        });
    };

    /**
     * Checks/unchecks any matching checkboxes or radio buttons and
     * selects/deselects and matching option elements.
     */
    $.fn.selected = function (select) {
        if (select === undefined) {
            select = true;
        }
        return this.each(function () {
            var t = this.type;
            if (t == 'checkbox' || t == 'radio') {
                this.checked = select;
            } else if (this.tagName.toLowerCase() == 'option') {
                var $sel = $(this).parent('select');
                if (select && $sel[0] && $sel[0].type == 'select-one') {
                    // deselect all other options
                    $sel.find('option').selected(false);
                }
                this.selected = select;
            }
        });
    };

    // expose debug var
    $.fn.ajaxSubmit.debug = false;

    // helper fn for console logging
    function log() {
        if (!$.fn.ajaxSubmit.debug) return;
        var msg = '[jquery.form] ' + Array.prototype.join.call(arguments, '');
        if (window.console && window.console.log) {
            window.console.log(msg);
        } else if (window.opera && window.opera.postError) {
            window.opera.postError(msg);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndoYXQtaW5wdXQuanMiLCJmb3VuZGF0aW9uLmNvcmUuanMiLCJmb3VuZGF0aW9uLnV0aWwuYm94LmpzIiwiZm91bmRhdGlvbi51dGlsLmtleWJvYXJkLmpzIiwiZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnkuanMiLCJmb3VuZGF0aW9uLnV0aWwubW90aW9uLmpzIiwiZm91bmRhdGlvbi51dGlsLm5lc3QuanMiLCJmb3VuZGF0aW9uLnV0aWwudGltZXJBbmRJbWFnZUxvYWRlci5qcyIsImZvdW5kYXRpb24udXRpbC50b3VjaC5qcyIsImZvdW5kYXRpb24udXRpbC50cmlnZ2Vycy5qcyIsImZvdW5kYXRpb24uZHJvcGRvd25NZW51LmpzIiwiZm91bmRhdGlvbi5lcXVhbGl6ZXIuanMiLCJmb3VuZGF0aW9uLm9mZmNhbnZhcy5qcyIsImZvdW5kYXRpb24ucmVzcG9uc2l2ZU1lbnUuanMiLCJmb3VuZGF0aW9uLnJlc3BvbnNpdmVUb2dnbGUuanMiLCJzY3JvbGxyZXZlYWwuanMiLCJjbGlwLXBhdGgtcG9seWdvbi5taW4uanMiLCJhcHAuanMiLCJqcXVlcnkuZm9ybS5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJ3aGF0SW5wdXQiLCJhY3RpdmVLZXlzIiwiYm9keSIsImJ1ZmZlciIsImN1cnJlbnRJbnB1dCIsIm5vblR5cGluZ0lucHV0cyIsIm1vdXNlV2hlZWwiLCJkZXRlY3RXaGVlbCIsImlnbm9yZU1hcCIsImlucHV0TWFwIiwiaW5wdXRUeXBlcyIsImtleU1hcCIsInBvaW50ZXJNYXAiLCJ0aW1lciIsImV2ZW50QnVmZmVyIiwiY2xlYXJUaW1lciIsInNldElucHV0IiwiZXZlbnQiLCJzZXRUaW1lb3V0IiwiYnVmZmVyZWRFdmVudCIsInVuQnVmZmVyZWRFdmVudCIsImNsZWFyVGltZW91dCIsImV2ZW50S2V5Iiwia2V5IiwidmFsdWUiLCJ0eXBlIiwicG9pbnRlclR5cGUiLCJldmVudFRhcmdldCIsInRhcmdldCIsImV2ZW50VGFyZ2V0Tm9kZSIsIm5vZGVOYW1lIiwidG9Mb3dlckNhc2UiLCJldmVudFRhcmdldFR5cGUiLCJnZXRBdHRyaWJ1dGUiLCJoYXNBdHRyaWJ1dGUiLCJpbmRleE9mIiwic3dpdGNoSW5wdXQiLCJsb2dLZXlzIiwic3RyaW5nIiwic2V0QXR0cmlidXRlIiwicHVzaCIsImtleUNvZGUiLCJ3aGljaCIsInNyY0VsZW1lbnQiLCJ1bkxvZ0tleXMiLCJhcnJheVBvcyIsInNwbGljZSIsImJpbmRFdmVudHMiLCJkb2N1bWVudCIsIlBvaW50ZXJFdmVudCIsImFkZEV2ZW50TGlzdGVuZXIiLCJNU1BvaW50ZXJFdmVudCIsImNyZWF0ZUVsZW1lbnQiLCJvbm1vdXNld2hlZWwiLCJ1bmRlZmluZWQiLCJBcnJheSIsInByb3RvdHlwZSIsImFzayIsImtleXMiLCJ0eXBlcyIsInNldCIsIiQiLCJGT1VOREFUSU9OX1ZFUlNJT04iLCJGb3VuZGF0aW9uIiwidmVyc2lvbiIsIl9wbHVnaW5zIiwiX3V1aWRzIiwicnRsIiwiYXR0ciIsInBsdWdpbiIsIm5hbWUiLCJjbGFzc05hbWUiLCJmdW5jdGlvbk5hbWUiLCJhdHRyTmFtZSIsImh5cGhlbmF0ZSIsInJlZ2lzdGVyUGx1Z2luIiwicGx1Z2luTmFtZSIsImNvbnN0cnVjdG9yIiwidXVpZCIsIkdldFlvRGlnaXRzIiwiJGVsZW1lbnQiLCJkYXRhIiwidHJpZ2dlciIsInVucmVnaXN0ZXJQbHVnaW4iLCJyZW1vdmVBdHRyIiwicmVtb3ZlRGF0YSIsInByb3AiLCJyZUluaXQiLCJwbHVnaW5zIiwiaXNKUSIsImVhY2giLCJfaW5pdCIsIl90aGlzIiwiZm5zIiwicGxncyIsImZvckVhY2giLCJwIiwiZm91bmRhdGlvbiIsIk9iamVjdCIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsImxlbmd0aCIsIm5hbWVzcGFjZSIsIk1hdGgiLCJyb3VuZCIsInBvdyIsInJhbmRvbSIsInRvU3RyaW5nIiwic2xpY2UiLCJyZWZsb3ciLCJlbGVtIiwiaSIsIiRlbGVtIiwiZmluZCIsImFkZEJhY2siLCIkZWwiLCJvcHRzIiwid2FybiIsInRoaW5nIiwic3BsaXQiLCJlIiwib3B0IiwibWFwIiwiZWwiLCJ0cmltIiwicGFyc2VWYWx1ZSIsImVyIiwiZ2V0Rm5OYW1lIiwidHJhbnNpdGlvbmVuZCIsInRyYW5zaXRpb25zIiwiZW5kIiwidCIsInN0eWxlIiwidHJpZ2dlckhhbmRsZXIiLCJ1dGlsIiwidGhyb3R0bGUiLCJmdW5jIiwiZGVsYXkiLCJjb250ZXh0IiwiYXJncyIsImFyZ3VtZW50cyIsImFwcGx5IiwibWV0aG9kIiwiJG1ldGEiLCIkbm9KUyIsImFwcGVuZFRvIiwiaGVhZCIsInJlbW92ZUNsYXNzIiwiTWVkaWFRdWVyeSIsImNhbGwiLCJwbHVnQ2xhc3MiLCJSZWZlcmVuY2VFcnJvciIsIlR5cGVFcnJvciIsImZuIiwiRGF0ZSIsIm5vdyIsImdldFRpbWUiLCJ2ZW5kb3JzIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwidnAiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsInRlc3QiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJsYXN0VGltZSIsImNhbGxiYWNrIiwibmV4dFRpbWUiLCJtYXgiLCJwZXJmb3JtYW5jZSIsInN0YXJ0IiwiRnVuY3Rpb24iLCJiaW5kIiwib1RoaXMiLCJhQXJncyIsImZUb0JpbmQiLCJmTk9QIiwiZkJvdW5kIiwiY29uY2F0IiwiZnVuY05hbWVSZWdleCIsInJlc3VsdHMiLCJleGVjIiwic3RyIiwiaXNOYU4iLCJwYXJzZUZsb2F0IiwicmVwbGFjZSIsImpRdWVyeSIsIkJveCIsIkltTm90VG91Y2hpbmdZb3UiLCJHZXREaW1lbnNpb25zIiwiR2V0T2Zmc2V0cyIsImVsZW1lbnQiLCJwYXJlbnQiLCJsck9ubHkiLCJ0Yk9ubHkiLCJlbGVEaW1zIiwidG9wIiwiYm90dG9tIiwibGVmdCIsInJpZ2h0IiwicGFyRGltcyIsIm9mZnNldCIsImhlaWdodCIsIndpZHRoIiwid2luZG93RGltcyIsImFsbERpcnMiLCJFcnJvciIsInJlY3QiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJwYXJSZWN0IiwicGFyZW50Tm9kZSIsIndpblJlY3QiLCJ3aW5ZIiwicGFnZVlPZmZzZXQiLCJ3aW5YIiwicGFnZVhPZmZzZXQiLCJwYXJlbnREaW1zIiwiYW5jaG9yIiwicG9zaXRpb24iLCJ2T2Zmc2V0IiwiaE9mZnNldCIsImlzT3ZlcmZsb3ciLCIkZWxlRGltcyIsIiRhbmNob3JEaW1zIiwia2V5Q29kZXMiLCJjb21tYW5kcyIsIktleWJvYXJkIiwiZ2V0S2V5Q29kZXMiLCJwYXJzZUtleSIsIlN0cmluZyIsImZyb21DaGFyQ29kZSIsInRvVXBwZXJDYXNlIiwic2hpZnRLZXkiLCJjdHJsS2V5IiwiYWx0S2V5IiwiaGFuZGxlS2V5IiwiY29tcG9uZW50IiwiZnVuY3Rpb25zIiwiY29tbWFuZExpc3QiLCJjbWRzIiwiY29tbWFuZCIsImx0ciIsImV4dGVuZCIsInJldHVyblZhbHVlIiwiaGFuZGxlZCIsInVuaGFuZGxlZCIsImZpbmRGb2N1c2FibGUiLCJmaWx0ZXIiLCJpcyIsInJlZ2lzdGVyIiwiY29tcG9uZW50TmFtZSIsImtjcyIsImsiLCJrYyIsImRlZmF1bHRRdWVyaWVzIiwibGFuZHNjYXBlIiwicG9ydHJhaXQiLCJyZXRpbmEiLCJxdWVyaWVzIiwiY3VycmVudCIsInNlbGYiLCJleHRyYWN0ZWRTdHlsZXMiLCJjc3MiLCJuYW1lZFF1ZXJpZXMiLCJwYXJzZVN0eWxlVG9PYmplY3QiLCJoYXNPd25Qcm9wZXJ0eSIsIl9nZXRDdXJyZW50U2l6ZSIsIl93YXRjaGVyIiwiYXRMZWFzdCIsInNpemUiLCJxdWVyeSIsImdldCIsIm1hdGNoTWVkaWEiLCJtYXRjaGVzIiwibWF0Y2hlZCIsIm9uIiwibmV3U2l6ZSIsImN1cnJlbnRTaXplIiwic3R5bGVNZWRpYSIsIm1lZGlhIiwic2NyaXB0IiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJpbmZvIiwiaWQiLCJpbnNlcnRCZWZvcmUiLCJnZXRDb21wdXRlZFN0eWxlIiwiY3VycmVudFN0eWxlIiwibWF0Y2hNZWRpdW0iLCJ0ZXh0Iiwic3R5bGVTaGVldCIsImNzc1RleHQiLCJ0ZXh0Q29udGVudCIsInN0eWxlT2JqZWN0IiwicmVkdWNlIiwicmV0IiwicGFyYW0iLCJwYXJ0cyIsInZhbCIsImRlY29kZVVSSUNvbXBvbmVudCIsImlzQXJyYXkiLCJpbml0Q2xhc3NlcyIsImFjdGl2ZUNsYXNzZXMiLCJNb3Rpb24iLCJhbmltYXRlSW4iLCJhbmltYXRpb24iLCJjYiIsImFuaW1hdGUiLCJhbmltYXRlT3V0IiwiTW92ZSIsImR1cmF0aW9uIiwiYW5pbSIsInByb2ciLCJtb3ZlIiwidHMiLCJpc0luIiwiZXEiLCJpbml0Q2xhc3MiLCJhY3RpdmVDbGFzcyIsInJlc2V0IiwiYWRkQ2xhc3MiLCJzaG93Iiwib2Zmc2V0V2lkdGgiLCJvbmUiLCJmaW5pc2giLCJoaWRlIiwidHJhbnNpdGlvbkR1cmF0aW9uIiwiTmVzdCIsIkZlYXRoZXIiLCJtZW51IiwiaXRlbXMiLCJzdWJNZW51Q2xhc3MiLCJzdWJJdGVtQ2xhc3MiLCJoYXNTdWJDbGFzcyIsIiRpdGVtIiwiJHN1YiIsImNoaWxkcmVuIiwiQnVybiIsIlRpbWVyIiwib3B0aW9ucyIsIm5hbWVTcGFjZSIsInJlbWFpbiIsImlzUGF1c2VkIiwicmVzdGFydCIsImluZmluaXRlIiwicGF1c2UiLCJvbkltYWdlc0xvYWRlZCIsImltYWdlcyIsInVubG9hZGVkIiwiY29tcGxldGUiLCJzaW5nbGVJbWFnZUxvYWRlZCIsIm5hdHVyYWxXaWR0aCIsInNwb3RTd2lwZSIsImVuYWJsZWQiLCJkb2N1bWVudEVsZW1lbnQiLCJwcmV2ZW50RGVmYXVsdCIsIm1vdmVUaHJlc2hvbGQiLCJ0aW1lVGhyZXNob2xkIiwic3RhcnRQb3NYIiwic3RhcnRQb3NZIiwic3RhcnRUaW1lIiwiZWxhcHNlZFRpbWUiLCJpc01vdmluZyIsIm9uVG91Y2hFbmQiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwib25Ub3VjaE1vdmUiLCJ4IiwidG91Y2hlcyIsInBhZ2VYIiwieSIsInBhZ2VZIiwiZHgiLCJkeSIsImRpciIsImFicyIsIm9uVG91Y2hTdGFydCIsImluaXQiLCJ0ZWFyZG93biIsInNwZWNpYWwiLCJzd2lwZSIsInNldHVwIiwibm9vcCIsImFkZFRvdWNoIiwiaGFuZGxlVG91Y2giLCJjaGFuZ2VkVG91Y2hlcyIsImZpcnN0IiwiZXZlbnRUeXBlcyIsInRvdWNoc3RhcnQiLCJ0b3VjaG1vdmUiLCJ0b3VjaGVuZCIsInNpbXVsYXRlZEV2ZW50IiwiTW91c2VFdmVudCIsInNjcmVlblgiLCJzY3JlZW5ZIiwiY2xpZW50WCIsImNsaWVudFkiLCJjcmVhdGVFdmVudCIsImluaXRNb3VzZUV2ZW50IiwiZGlzcGF0Y2hFdmVudCIsIk11dGF0aW9uT2JzZXJ2ZXIiLCJwcmVmaXhlcyIsInRyaWdnZXJzIiwic3RvcFByb3BhZ2F0aW9uIiwiZmFkZU91dCIsImNoZWNrTGlzdGVuZXJzIiwiZXZlbnRzTGlzdGVuZXIiLCJyZXNpemVMaXN0ZW5lciIsInNjcm9sbExpc3RlbmVyIiwiY2xvc2VtZUxpc3RlbmVyIiwieWV0aUJveGVzIiwicGx1Z05hbWVzIiwibGlzdGVuZXJzIiwiam9pbiIsIm9mZiIsInBsdWdpbklkIiwibm90IiwiZGVib3VuY2UiLCIkbm9kZXMiLCJub2RlcyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJsaXN0ZW5pbmdFbGVtZW50c011dGF0aW9uIiwibXV0YXRpb25SZWNvcmRzTGlzdCIsIiR0YXJnZXQiLCJlbGVtZW50T2JzZXJ2ZXIiLCJvYnNlcnZlIiwiYXR0cmlidXRlcyIsImNoaWxkTGlzdCIsImNoYXJhY3RlckRhdGEiLCJzdWJ0cmVlIiwiYXR0cmlidXRlRmlsdGVyIiwiSUhlYXJZb3UiLCJEcm9wZG93bk1lbnUiLCJkZWZhdWx0cyIsInN1YnMiLCIkbWVudUl0ZW1zIiwiJHRhYnMiLCJ2ZXJ0aWNhbENsYXNzIiwiaGFzQ2xhc3MiLCJyaWdodENsYXNzIiwiYWxpZ25tZW50IiwicGFyZW50cyIsImNoYW5nZWQiLCJfZXZlbnRzIiwiaGFzVG91Y2giLCJvbnRvdWNoc3RhcnQiLCJwYXJDbGFzcyIsImhhbmRsZUNsaWNrRm4iLCJwYXJlbnRzVW50aWwiLCJoYXNTdWIiLCJoYXNDbGlja2VkIiwiY2xvc2VPbkNsaWNrIiwiY2xpY2tPcGVuIiwiZm9yY2VGb2xsb3ciLCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24iLCJfaGlkZSIsIl9zaG93IiwiYWRkIiwiY2xvc2VPbkNsaWNrSW5zaWRlIiwiZGlzYWJsZUhvdmVyIiwiaG92ZXJEZWxheSIsImF1dG9jbG9zZSIsImNsb3NpbmdUaW1lIiwiaXNUYWIiLCJpbmRleCIsIiRlbGVtZW50cyIsInNpYmxpbmdzIiwiJHByZXZFbGVtZW50IiwiJG5leHRFbGVtZW50IiwibmV4dFNpYmxpbmciLCJmb2N1cyIsInByZXZTaWJsaW5nIiwib3BlblN1YiIsImNsb3NlU3ViIiwiY2xvc2UiLCJvcGVuIiwiX2lzVmVydGljYWwiLCJkb3duIiwidXAiLCJuZXh0IiwicHJldmlvdXMiLCIkYm9keSIsIiRsaW5rIiwiaWR4IiwiJHNpYnMiLCJjbGVhciIsIm9sZENsYXNzIiwiJHBhcmVudExpIiwiX2FkZEJvZHlIYW5kbGVyIiwiJHRvQ2xvc2UiLCJzb21ldGhpbmdUb0Nsb3NlIiwiRXF1YWxpemVyIiwiZXFJZCIsIiR3YXRjaGVkIiwiaGFzTmVzdGVkIiwiaXNOZXN0ZWQiLCJpc09uIiwiX2JpbmRIYW5kbGVyIiwib25SZXNpemVNZUJvdW5kIiwiX29uUmVzaXplTWUiLCJvblBvc3RFcXVhbGl6ZWRCb3VuZCIsIl9vblBvc3RFcXVhbGl6ZWQiLCJpbWdzIiwidG9vU21hbGwiLCJlcXVhbGl6ZU9uIiwiX2NoZWNrTVEiLCJfcmVmbG93IiwiX3BhdXNlRXZlbnRzIiwiZXF1YWxpemVPblN0YWNrIiwiX2lzU3RhY2tlZCIsImVxdWFsaXplQnlSb3ciLCJnZXRIZWlnaHRzQnlSb3ciLCJhcHBseUhlaWdodEJ5Um93IiwiZ2V0SGVpZ2h0cyIsImFwcGx5SGVpZ2h0IiwiaGVpZ2h0cyIsImxlbiIsIm9mZnNldEhlaWdodCIsImxhc3RFbFRvcE9mZnNldCIsImdyb3VwcyIsImdyb3VwIiwiZWxPZmZzZXRUb3AiLCJqIiwibG4iLCJncm91cHNJTGVuZ3RoIiwibGVuSiIsIk9mZkNhbnZhcyIsIiRsYXN0VHJpZ2dlciIsIiR0cmlnZ2VycyIsIiRleGl0ZXIiLCJleGl0ZXIiLCJhcHBlbmQiLCJpc1JldmVhbGVkIiwiUmVnRXhwIiwicmV2ZWFsQ2xhc3MiLCJyZXZlYWxPbiIsIm1hdGNoIiwiX3NldE1RQ2hlY2tlciIsInRyYW5zaXRpb25UaW1lIiwidG9nZ2xlIiwiX2hhbmRsZUtleWJvYXJkIiwicmV2ZWFsIiwiJGNsb3NlciIsImZvcmNlVG9wIiwic2Nyb2xsVG9wIiwiJHdyYXBwZXIiLCJhdXRvRm9jdXMiLCJ0cmFwRm9jdXMiLCJmb2N1c2FibGUiLCJsYXN0IiwiUmVzcG9uc2l2ZU1lbnUiLCJydWxlcyIsImN1cnJlbnRNcSIsImN1cnJlbnRQbHVnaW4iLCJydWxlc1RyZWUiLCJydWxlIiwicnVsZVNpemUiLCJydWxlUGx1Z2luIiwiTWVudVBsdWdpbnMiLCJpc0VtcHR5T2JqZWN0IiwiX2NoZWNrTWVkaWFRdWVyaWVzIiwibWF0Y2hlZE1xIiwiY3NzQ2xhc3MiLCJkZXN0cm95IiwiZHJvcGRvd24iLCJkcmlsbGRvd24iLCJhY2NvcmRpb24iLCJSZXNwb25zaXZlVG9nZ2xlIiwidGFyZ2V0SUQiLCIkdGFyZ2V0TWVudSIsIiR0b2dnbGVyIiwiX3VwZGF0ZSIsIl91cGRhdGVNcUhhbmRsZXIiLCJ0b2dnbGVNZW51IiwiaGlkZUZvciIsInNyIiwiX3JlcXVlc3RBbmltYXRpb25GcmFtZSIsIlNjcm9sbFJldmVhbCIsImNvbmZpZyIsImdldFByb3RvdHlwZU9mIiwidG9vbHMiLCJUb29scyIsImlzU3VwcG9ydGVkIiwiY29udGFpbmVyIiwiX3Jlc29sdmVDb250YWluZXIiLCJzdG9yZSIsImVsZW1lbnRzIiwiY29udGFpbmVycyIsInNlcXVlbmNlcyIsImhpc3RvcnkiLCJ1aWQiLCJpbml0aWFsaXplZCIsImxvZyIsIm9yaWdpbiIsImRpc3RhbmNlIiwicm90YXRlIiwieiIsIm9wYWNpdHkiLCJzY2FsZSIsImVhc2luZyIsIm1vYmlsZSIsInVzZURlbGF5Iiwidmlld0ZhY3RvciIsInZpZXdPZmZzZXQiLCJiZWZvcmVSZXZlYWwiLCJkb21FbCIsImJlZm9yZVJlc2V0IiwiYWZ0ZXJSZXZlYWwiLCJhZnRlclJlc2V0IiwiaW50ZXJ2YWwiLCJzeW5jIiwiZWxlbUlkIiwic2VxdWVuY2UiLCJzZXF1ZW5jZUlkIiwiX2dldFJldmVhbEVsZW1lbnRzIiwiX25leHRVaWQiLCJlbGVtSWRzIiwiYWN0aXZlIiwic2VlbiIsInJldmVhbGluZyIsIl9jb25maWd1cmUiLCJfc3R5bGUiLCJfdXBkYXRlU3RvcmUiLCJpc01vYmlsZSIsInN0eWxlcyIsImlubGluZSIsImRpc2FibGVkIiwidHJhbnNmb3JtIiwiaW5pdGlhbCIsIl9yZWNvcmQiLCJpbml0VGltZW91dCIsInJlY29yZCIsInF1ZXJ5U2VsZWN0b3IiLCJpc05vZGUiLCJpc05vZGVMaXN0IiwiZXh0ZW5kQ2xvbmUiLCJheGlzIiwiY29tcHV0ZWQiLCJ0cmFuc2l0aW9uIiwiaW5zdGFudCIsIl9nZW5lcmF0ZVRyYW5zaXRpb24iLCJkZWxheWVkIiwiX2dlbmVyYXRlVHJhbnNmb3JtIiwiY3NzRGlzdGFuY2UiLCJzdWJzdHIiLCJwYXJzZUludCIsIl9hbmltYXRlIiwiX2hhbmRsZXIiLCJfc2V0QWN0aXZlU2VxdWVuY2VzIiwiZm9yT3duIiwiX2lzRWxlbVZpc2libGUiLCJfc2hvdWxkVXNlRGVsYXkiLCJfc2hvdWxkUmV2ZWFsIiwiX3F1ZXVlQ2FsbGJhY2siLCJfcXVldWVOZXh0SW5TZXF1ZW5jZSIsIl9zaG91bGRSZXNldCIsImVsYXBzZWQiLCJibG9ja2VkIiwic3RhcnRlZCIsImNsb2NrIiwiX2dldENvbnRhaW5lciIsImNsaWVudFdpZHRoIiwiY2xpZW50SGVpZ2h0IiwiX2dldFNjcm9sbGVkIiwiX2dldE9mZnNldCIsInNjcm9sbExlZnQiLCJvZmZzZXRUb3AiLCJvZmZzZXRMZWZ0Iiwib2Zmc2V0UGFyZW50Iiwic2Nyb2xsZWQiLCJ2RiIsImVsZW1IZWlnaHQiLCJlbGVtV2lkdGgiLCJlbGVtVG9wIiwiZWxlbUxlZnQiLCJlbGVtQm90dG9tIiwiZWxlbVJpZ2h0IiwiY29uZmlybUJvdW5kcyIsImlzUG9zaXRpb25GaXhlZCIsInZpZXdUb3AiLCJ2aWV3TGVmdCIsInZpZXdCb3R0b20iLCJ2aWV3UmlnaHQiLCJpc09iamVjdCIsIm9iamVjdCIsIk5vZGUiLCJub2RlVHlwZSIsInByb3RvdHlwZVRvU3RyaW5nIiwicmVnZXgiLCJOb2RlTGlzdCIsInByb3BlcnR5Iiwic291cmNlIiwid2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwibW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwiZGVmaW5lIiwiYW1kIiwibW9kdWxlIiwiZXhwb3J0cyIsImdsb2JhbFZhcmlhYmxlIiwicm9vdCIsInJlcXVpcmUiLCJhIiwiYiIsImMiLCJkIiwicG9pbnRzIiwic3ZnRGVmSWQiLCJwcm9jZXNzT3B0aW9ucyIsIkNsaXBQYXRoIiwiaXNGb3JXZWJraXQiLCJpc0ZvclN2ZyIsImlzUGVyY2VudGFnZSIsImNyZWF0ZSIsIl9jcmVhdGVDbGlwUGF0aCIsIl9jcmVhdGVTdmdEZWZzIiwiX2NyZWF0ZVN2Z0Jhc2VkQ2xpcFBhdGgiLCJfY3JlYXRlV2Via2l0Q2xpcFBhdGgiLCJfdHJhbnNsYXRlUG9pbnRzIiwiZiIsIl9oYW5kbGVQeHMiLCJnIiwiX2NyZWF0ZVN2Z0VsZW1lbnQiLCJjcmVhdGVFbGVtZW50TlMiLCJ2aXNpYmlsaXR5IiwiY2xpcFBhdGgiLCJ0b2dnbGVDbGFzcyIsImNsaXBwYXRoUG9seWZpbGwiLCJldmVuUG9pbnRzIiwib2RkUG9pbnRzIiwic21hbGxQb2ludHMiLCJjdXJyZW50X3dpZHRoIiwicmVhZHkiLCJyZXNpemUiLCJ3cmFwIiwid3JhcElubmVyIiwidW53cmFwIiwicHJlcGVuZFRvIiwiZmFkZVRvZ2dsZSIsImNsaWNrIiwibG9jYXRpb24iLCJwYXRobmFtZSIsImhvc3RuYW1lIiwiaGFzaCIsIkRydXBhbCIsImJlaGF2aW9ycyIsInJlY2FwY2hhX2FqYXhfYmVoYXZpb3VyIiwiYXR0YWNoIiwic2V0dGluZ3MiLCJncmVjYXB0Y2hhIiwiY2FwdGNoYXMiLCJnZXRFbGVtZW50c0J5Q2xhc3NOYW1lIiwic2l0ZV9rZXkiLCJodG1sIiwicmVuZGVyIiwiZW50ZXJMZWZ0IiwiZW50ZXJSaWdodCIsImVudGVyTGVmdDEiLCJlbnRlclJpZ2h0MSIsImZhY3RvcnkiLCJaZXB0byIsImZlYXR1cmUiLCJmaWxlYXBpIiwiZmlsZXMiLCJmb3JtZGF0YSIsIkZvcm1EYXRhIiwiaGFzUHJvcCIsImF0dHIyIiwianF1ZXJ5IiwiYWpheFN1Ym1pdCIsImFjdGlvbiIsInVybCIsIiRmb3JtIiwic3VjY2VzcyIsImhyZWYiLCJhamF4U2V0dGluZ3MiLCJpZnJhbWVTcmMiLCJ2ZXRvIiwiYmVmb3JlU2VyaWFsaXplIiwidHJhZGl0aW9uYWwiLCJxeCIsImZvcm1Ub0FycmF5Iiwic2VtYW50aWMiLCJleHRyYURhdGEiLCJiZWZvcmVTdWJtaXQiLCJxIiwiY2FsbGJhY2tzIiwicmVzZXRGb3JtIiwiY2xlYXJGb3JtIiwiaW5jbHVkZUhpZGRlbiIsImRhdGFUeXBlIiwib2xkU3VjY2VzcyIsInJlcGxhY2VUYXJnZXQiLCJzdGF0dXMiLCJ4aHIiLCJvbGRFcnJvciIsIm9sZENvbXBsZXRlIiwiZmlsZUlucHV0cyIsImhhc0ZpbGVJbnB1dHMiLCJtcCIsIm11bHRpcGFydCIsImZpbGVBUEkiLCJzaG91bGRVc2VGcmFtZSIsImpxeGhyIiwiaWZyYW1lIiwiY2xvc2VLZWVwQWxpdmUiLCJmaWxlVXBsb2FkSWZyYW1lIiwiZmlsZVVwbG9hZFhociIsImFqYXgiLCJkZWVwU2VyaWFsaXplIiwic2VyaWFsaXplZCIsInJlc3VsdCIsInBhcnQiLCJzZXJpYWxpemVkRGF0YSIsInMiLCJjb250ZW50VHlwZSIsInByb2Nlc3NEYXRhIiwiY2FjaGUiLCJ1cGxvYWRQcm9ncmVzcyIsInVwbG9hZCIsInBlcmNlbnQiLCJsb2FkZWQiLCJ0b3RhbCIsImxlbmd0aENvbXB1dGFibGUiLCJjZWlsIiwiYmVmb3JlU2VuZCIsIm8iLCJmb3JtRGF0YSIsImZvcm0iLCIkaW8iLCJpbyIsInN1YiIsIm4iLCJ0aW1lZE91dCIsInRpbWVvdXRIYW5kbGUiLCJkZWZlcnJlZCIsIkRlZmVycmVkIiwiYWJvcnQiLCJpZnJhbWVUYXJnZXQiLCJhYm9ydGVkIiwicmVzcG9uc2VUZXh0IiwicmVzcG9uc2VYTUwiLCJzdGF0dXNUZXh0IiwiZ2V0QWxsUmVzcG9uc2VIZWFkZXJzIiwiZ2V0UmVzcG9uc2VIZWFkZXIiLCJzZXRSZXF1ZXN0SGVhZGVyIiwiY29udGVudFdpbmRvdyIsImV4ZWNDb21tYW5kIiwiaWdub3JlIiwiZ2xvYmFsIiwicmVqZWN0IiwiY2xrIiwiY2xrX3giLCJjbGtfeSIsIkNMSUVOVF9USU1FT1VUX0FCT1JUIiwiU0VSVkVSX0FCT1JUIiwiZ2V0RG9jIiwiZnJhbWUiLCJkb2MiLCJjb250ZW50RG9jdW1lbnQiLCJjc3JmX3Rva2VuIiwiY3NyZl9wYXJhbSIsImRvU3VibWl0Iiwic2tpcEVuY29kaW5nT3ZlcnJpZGUiLCJlbmNvZGluZyIsImVuY3R5cGUiLCJ0aW1lb3V0IiwiY2hlY2tTdGF0ZSIsInN0YXRlIiwicmVhZHlTdGF0ZSIsImV4dHJhSW5wdXRzIiwiaXNQbGFpbk9iamVjdCIsImF0dGFjaEV2ZW50Iiwic3VibWl0Iiwic3VibWl0Rm4iLCJyZW1vdmUiLCJmb3JjZVN5bmMiLCJkb21DaGVja0NvdW50IiwiY2FsbGJhY2tQcm9jZXNzZWQiLCJkZXRhY2hFdmVudCIsImVyck1zZyIsImlzWG1sIiwiWE1MRG9jdW1lbnQiLCJpc1hNTERvYyIsIm9wZXJhIiwiaW5uZXJIVE1MIiwiZG9jUm9vdCIsImhlYWRlciIsImhlYWRlcnMiLCJOdW1iZXIiLCJkdCIsInNjciIsInRleHRhcmVhIiwidGEiLCJwcmUiLCJpbm5lclRleHQiLCJ0b1htbCIsImh0dHBEYXRhIiwicmVzb2x2ZSIsInBhcnNlWE1MIiwiQWN0aXZlWE9iamVjdCIsImFzeW5jIiwibG9hZFhNTCIsIkRPTVBhcnNlciIsInBhcnNlRnJvbVN0cmluZyIsInBhcnNlSlNPTiIsImN0IiwieG1sIiwiZGF0YUZpbHRlciIsImdsb2JhbEV2YWwiLCJhamF4Rm9ybSIsImRlbGVnYXRpb24iLCJpc0Z1bmN0aW9uIiwic2VsZWN0b3IiLCJpc1JlYWR5IiwiZG9BamF4U3VibWl0IiwiY2FwdHVyZVN1Ym1pdHRpbmdFbGVtZW50IiwiYWpheEZvcm1VbmJpbmQiLCJpc0RlZmF1bHRQcmV2ZW50ZWQiLCJjbG9zZXN0Iiwib2Zmc2V0WCIsIm9mZnNldFkiLCJ1bmJpbmQiLCJlbHMiLCJ2Iiwiam1heCIsImZpZWxkVmFsdWUiLCJyZXF1aXJlZCIsIiRpbnB1dCIsImlucHV0IiwiZm9ybVNlcmlhbGl6ZSIsImZpZWxkU2VyaWFsaXplIiwic3VjY2Vzc2Z1bCIsIm1lcmdlIiwidGFnIiwidGFnTmFtZSIsImNoZWNrZWQiLCJzZWxlY3RlZEluZGV4Iiwib3BzIiwib3AiLCJzZWxlY3RlZCIsInNwZWNpZmllZCIsImNsZWFyRmllbGRzIiwiY2xlYXJJbnB1dHMiLCJyZSIsInJlcGxhY2VXaXRoIiwiY2xvbmUiLCJlbmFibGUiLCJzZWxlY3QiLCIkc2VsIiwiZGVidWciLCJtc2ciLCJwb3N0RXJyb3IiXSwibWFwcGluZ3MiOiI7O0FBQUFBLE9BQU9DLFNBQVAsR0FBb0IsWUFBVzs7QUFFN0I7O0FBRUE7Ozs7OztBQU1BOztBQUNBLE1BQUlDLGFBQWEsRUFBakI7O0FBRUE7QUFDQSxNQUFJQyxJQUFKOztBQUVBO0FBQ0EsTUFBSUMsU0FBUyxLQUFiOztBQUVBO0FBQ0EsTUFBSUMsZUFBZSxJQUFuQjs7QUFFQTtBQUNBLE1BQUlDLGtCQUFrQixDQUNwQixRQURvQixFQUVwQixVQUZvQixFQUdwQixNQUhvQixFQUlwQixPQUpvQixFQUtwQixPQUxvQixFQU1wQixPQU5vQixFQU9wQixRQVBvQixDQUF0Qjs7QUFVQTtBQUNBO0FBQ0EsTUFBSUMsYUFBYUMsYUFBakI7O0FBRUE7QUFDQTtBQUNBLE1BQUlDLFlBQVksQ0FDZCxFQURjLEVBQ1Y7QUFDSixJQUZjLEVBRVY7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QU9rM0IsS0FBUCxDQUFhb0UsU0FBYixDQUF1QkQsR0FBdkI7QUFDSDtBQUNKO0FBRUEsQ0FsckNBLENBQUQiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsid2luZG93LndoYXRJbnB1dCA9IChmdW5jdGlvbigpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgLypcbiAgICAtLS0tLS0tLS0tLS0tLS1cbiAgICB2YXJpYWJsZXNcbiAgICAtLS0tLS0tLS0tLS0tLS1cbiAgKi9cblxuICAvLyBhcnJheSBvZiBhY3RpdmVseSBwcmVzc2VkIGtleXNcbiAgdmFyIGFjdGl2ZUtleXMgPSBbXTtcblxuICAvLyBjYWNoZSBkb2N1bWVudC5ib2R5XG4gIHZhciBib2R5O1xuXG4gIC8vIGJvb2xlYW46IHRydWUgaWYgdG91Y2ggYnVmZmVyIHRpbWVyIGlzIHJ1bm5pbmdcbiAgdmFyIGJ1ZmZlciA9IGZhbHNlO1xuXG4gIC8vIHRoZSBsYXN0IHVzZWQgaW5wdXQgdHlwZVxuICB2YXIgY3VycmVudElucHV0ID0gbnVsbDtcblxuICAvLyBgaW5wdXRgIHR5cGVzIHRoYXQgZG9uJ3QgYWNjZXB0IHRleHRcbiAgdmFyIG5vblR5cGluZ0lucHV0cyA9IFtcbiAgICAnYnV0dG9uJyxcbiAgICAnY2hlY2tib3gnLFxuICAgICdmaWxlJyxcbiAgICAnaW1hZ2UnLFxuICAgICdyYWRpbycsXG4gICAgJ3Jlc2V0JyxcbiAgICAnc3VibWl0J1xuICBdO1xuXG4gIC8vIGRldGVjdCB2ZXJzaW9uIG9mIG1vdXNlIHdoZWVsIGV2ZW50IHRvIHVzZVxuICAvLyB2aWEgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvRXZlbnRzL3doZWVsXG4gIHZhciBtb3VzZVdoZWVsID0gZGV0ZWN0V2hlZWwoKTtcblxuICAvLyBsaXN0IG9mIG1vZGlmaWVyIGtleXMgY29tbW9ubHkgdXNlZCB3aXRoIHRoZSBtb3VzZSBhbmRcbiAgLy8gY2FuIGJlIHNhZmVseSBpZ25vcmVkIHRvIHByZXZlbnQgZmFsc2Uga2V5Ym9hcmQgZGV0ZWN0aW9uXG4gIHZhciBpZ25vcmVNYXAgPSBbXG4gICAgMTYsIC8vIHNoaWZ0XG4gICAgMTcsIC8vIGNvbnRyb2xcbiAgICAxOCwgLy8gYWx0XG4gICAgOTEsIC8vIFdpbmRvd3Mga2V5IC8gbGVmdCBBcHBsZSBjbWRcbiAgICA5MyAgLy8gV2luZG93cyBtZW51IC8gcmlnaHQgQXBwbGUgY21kXG4gIF07XG5cbiAgLy8gbWFwcGluZyBvZiBldmVudHMgdG8gaW5wdXQgdHlwZXNcbiAgdmFyIGlucHV0TWFwID0ge1xuICAgICdrZXlkb3duJzogJ2tleWJvYXJkJyxcbiAgICAna2V5dXAnOiAna2V5Ym9hcmQnLFxuICAgICdtb3VzZWRvd24nOiAnbW91c2UnLFxuICAgICdtb3VzZW1vdmUnOiAnbW91c2UnLFxuICAgICdNU1BvaW50ZXJEb3duJzogJ3BvaW50ZXInLFxuICAgICdNU1BvaW50ZXJNb3ZlJzogJ3BvaW50ZXInLFxuICAgICdwb2ludGVyZG93bic6ICdwb2ludGVyJyxcbiAgICAncG9pbnRlcm1vdmUnOiAncG9pbnRlcicsXG4gICAgJ3RvdWNoc3RhcnQnOiAndG91Y2gnXG4gIH07XG5cbiAgLy8gYWRkIGNvcnJlY3QgbW91c2Ugd2hlZWwgZXZlbnQgbWFwcGluZyB0byBgaW5wdXRNYXBgXG4gIGlucHV0TWFwW2RldGVjdFdoZWVsKCldID0gJ21vdXNlJztcblxuICAvLyBhcnJheSBvZiBhbGwgdXNlZCBpbnB1dCB0eXBlc1xuICB2YXIgaW5wdXRUeXBlcyA9IFtdO1xuXG4gIC8vIG1hcHBpbmcgb2Yga2V5IGNvZGVzIHRvIGEgY29tbW9uIG5hbWVcbiAgdmFyIGtleU1hcCA9IHtcbiAgICA5OiAndGFiJyxcbiAgICAxMzogJ2VudGVyJyxcbiAgICAxNjogJ3NoaWZ0JyxcbiAgICAyNzogJ2VzYycsXG4gICAgMzI6ICdzcGFjZScsXG4gICAgMzc6ICdsZWZ0JyxcbiAgICAzODogJ3VwJyxcbiAgICAzOTogJ3JpZ2h0JyxcbiAgICA0MDogJ2Rvd24nXG4gIH07XG5cbiAgLy8gbWFwIG9mIElFIDEwIHBvaW50ZXIgZXZlbnRzXG4gIHZhciBwb2ludGVyTWFwID0ge1xuICAgIDI6ICd0b3VjaCcsXG4gICAgMzogJ3RvdWNoJywgLy8gdHJlYXQgcGVuIGxpa2UgdG91Y2hcbiAgICA0OiAnbW91c2UnXG4gIH07XG5cbiAgLy8gdG91Y2ggYnVmZmVyIHRpbWVyXG4gIHZhciB0aW1lcjtcblxuXG4gIC8qXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICAgZnVuY3Rpb25zXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICovXG5cbiAgLy8gYWxsb3dzIGV2ZW50cyB0aGF0IGFyZSBhbHNvIHRyaWdnZXJlZCB0byBiZSBmaWx0ZXJlZCBvdXQgZm9yIGB0b3VjaHN0YXJ0YFxuICBmdW5jdGlvbiBldmVudEJ1ZmZlcigpIHtcbiAgICBjbGVhclRpbWVyKCk7XG4gICAgc2V0SW5wdXQoZXZlbnQpO1xuXG4gICAgYnVmZmVyID0gdHJ1ZTtcbiAgICB0aW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgYnVmZmVyID0gZmFsc2U7XG4gICAgfSwgNjUwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJ1ZmZlcmVkRXZlbnQoZXZlbnQpIHtcbiAgICBpZiAoIWJ1ZmZlcikgc2V0SW5wdXQoZXZlbnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gdW5CdWZmZXJlZEV2ZW50KGV2ZW50KSB7XG4gICAgY2xlYXJUaW1lcigpO1xuICAgIHNldElucHV0KGV2ZW50KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyVGltZXIoKSB7XG4gICAgd2luZG93LmNsZWFyVGltZW91dCh0aW1lcik7XG4gIH1cblxuICBmdW5jdGlvbiBzZXRJbnB1dChldmVudCkge1xuICAgIHZhciBldmVudEtleSA9IGtleShldmVudCk7XG4gICAgdmFyIHZhbHVlID0gaW5wdXRNYXBbZXZlbnQudHlwZV07XG4gICAgaWYgKHZhbHVlID09PSAncG9pbnRlcicpIHZhbHVlID0gcG9pbnRlclR5cGUoZXZlbnQpO1xuXG4gICAgLy8gZG9uJ3QgZG8gYW55dGhpbmcgaWYgdGhlIHZhbHVlIG1hdGNoZXMgdGhlIGlucHV0IHR5cGUgYWxyZWFkeSBzZXRcbiAgICBpZiAoY3VycmVudElucHV0ICE9PSB2YWx1ZSkge1xuICAgICAgdmFyIGV2ZW50VGFyZ2V0ID0gdGFyZ2V0KGV2ZW50KTtcbiAgICAgIHZhciBldmVudFRhcmdldE5vZGUgPSBldmVudFRhcmdldC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgdmFyIGV2ZW50VGFyZ2V0VHlwZSA9IChldmVudFRhcmdldE5vZGUgPT09ICdpbnB1dCcpID8gZXZlbnRUYXJnZXQuZ2V0QXR0cmlidXRlKCd0eXBlJykgOiBudWxsO1xuXG4gICAgICBpZiAoXG4gICAgICAgICgvLyBvbmx5IGlmIHRoZSB1c2VyIGZsYWcgdG8gYWxsb3cgdHlwaW5nIGluIGZvcm0gZmllbGRzIGlzbid0IHNldFxuICAgICAgICAhYm9keS5oYXNBdHRyaWJ1dGUoJ2RhdGEtd2hhdGlucHV0LWZvcm10eXBpbmcnKSAmJlxuXG4gICAgICAgIC8vIG9ubHkgaWYgY3VycmVudElucHV0IGhhcyBhIHZhbHVlXG4gICAgICAgIGN1cnJlbnRJbnB1dCAmJlxuXG4gICAgICAgIC8vIG9ubHkgaWYgdGhlIGlucHV0IGlzIGBrZXlib2FyZGBcbiAgICAgICAgdmFsdWUgPT09ICdrZXlib2FyZCcgJiZcblxuICAgICAgICAvLyBub3QgaWYgdGhlIGtleSBpcyBgVEFCYFxuICAgICAgICBrZXlNYXBbZXZlbnRLZXldICE9PSAndGFiJyAmJlxuXG4gICAgICAgIC8vIG9ubHkgaWYgdGhlIHRhcmdldCBpcyBhIGZvcm0gaW5wdXQgdGhhdCBhY2NlcHRzIHRleHRcbiAgICAgICAgKFxuICAgICAgICAgICBldmVudFRhcmdldE5vZGUgPT09ICd0ZXh0YXJlYScgfHxcbiAgICAgICAgICAgZXZlbnRUYXJnZXROb2RlID09PSAnc2VsZWN0JyB8fFxuICAgICAgICAgICAoZXZlbnRUYXJnZXROb2RlID09PSAnaW5wdXQnICYmIG5vblR5cGluZ0lucHV0cy5pbmRleE9mKGV2ZW50VGFyZ2V0VHlwZSkgPCAwKVxuICAgICAgICApKSB8fCAoXG4gICAgICAgICAgLy8gaWdub3JlIG1vZGlmaWVyIGtleXNcbiAgICAgICAgICBpZ25vcmVNYXAuaW5kZXhPZihldmVudEtleSkgPiAtMVxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgLy8gaWdub3JlIGtleWJvYXJkIHR5cGluZ1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3dpdGNoSW5wdXQodmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh2YWx1ZSA9PT0gJ2tleWJvYXJkJykgbG9nS2V5cyhldmVudEtleSk7XG4gIH1cblxuICBmdW5jdGlvbiBzd2l0Y2hJbnB1dChzdHJpbmcpIHtcbiAgICBjdXJyZW50SW5wdXQgPSBzdHJpbmc7XG4gICAgYm9keS5zZXRBdHRyaWJ1dGUoJ2RhdGEtd2hhdGlucHV0JywgY3VycmVudElucHV0KTtcblxuICAgIGlmIChpbnB1dFR5cGVzLmluZGV4T2YoY3VycmVudElucHV0KSA9PT0gLTEpIGlucHV0VHlwZXMucHVzaChjdXJyZW50SW5wdXQpO1xuICB9XG5cbiAgZnVuY3Rpb24ga2V5KGV2ZW50KSB7XG4gICAgcmV0dXJuIChldmVudC5rZXlDb2RlKSA/IGV2ZW50LmtleUNvZGUgOiBldmVudC53aGljaDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRhcmdldChldmVudCkge1xuICAgIHJldHVybiBldmVudC50YXJnZXQgfHwgZXZlbnQuc3JjRWxlbWVudDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvaW50ZXJUeXBlKGV2ZW50KSB7XG4gICAgaWYgKHR5cGVvZiBldmVudC5wb2ludGVyVHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIHJldHVybiBwb2ludGVyTWFwW2V2ZW50LnBvaW50ZXJUeXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIChldmVudC5wb2ludGVyVHlwZSA9PT0gJ3BlbicpID8gJ3RvdWNoJyA6IGV2ZW50LnBvaW50ZXJUeXBlOyAvLyB0cmVhdCBwZW4gbGlrZSB0b3VjaFxuICAgIH1cbiAgfVxuXG4gIC8vIGtleWJvYXJkIGxvZ2dpbmdcbiAgZnVuY3Rpb24gbG9nS2V5cyhldmVudEtleSkge1xuICAgIGlmIChhY3RpdmVLZXlzLmluZGV4T2Yoa2V5TWFwW2V2ZW50S2V5XSkgPT09IC0xICYmIGtleU1hcFtldmVudEtleV0pIGFjdGl2ZUtleXMucHVzaChrZXlNYXBbZXZlbnRLZXldKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVuTG9nS2V5cyhldmVudCkge1xuICAgIHZhciBldmVudEtleSA9IGtleShldmVudCk7XG4gICAgdmFyIGFycmF5UG9zID0gYWN0aXZlS2V5cy5pbmRleE9mKGtleU1hcFtldmVudEtleV0pO1xuXG4gICAgaWYgKGFycmF5UG9zICE9PSAtMSkgYWN0aXZlS2V5cy5zcGxpY2UoYXJyYXlQb3MsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gYmluZEV2ZW50cygpIHtcbiAgICBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuICAgIC8vIHBvaW50ZXIgZXZlbnRzIChtb3VzZSwgcGVuLCB0b3VjaClcbiAgICBpZiAod2luZG93LlBvaW50ZXJFdmVudCkge1xuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIGJ1ZmZlcmVkRXZlbnQpO1xuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIGJ1ZmZlcmVkRXZlbnQpO1xuICAgIH0gZWxzZSBpZiAod2luZG93Lk1TUG9pbnRlckV2ZW50KSB7XG4gICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckRvd24nLCBidWZmZXJlZEV2ZW50KTtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyTW92ZScsIGJ1ZmZlcmVkRXZlbnQpO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgIC8vIG1vdXNlIGV2ZW50c1xuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBidWZmZXJlZEV2ZW50KTtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgYnVmZmVyZWRFdmVudCk7XG5cbiAgICAgIC8vIHRvdWNoIGV2ZW50c1xuICAgICAgaWYgKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykge1xuICAgICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBldmVudEJ1ZmZlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gbW91c2Ugd2hlZWxcbiAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIobW91c2VXaGVlbCwgYnVmZmVyZWRFdmVudCk7XG5cbiAgICAvLyBrZXlib2FyZCBldmVudHNcbiAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB1bkJ1ZmZlcmVkRXZlbnQpO1xuICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB1bkJ1ZmZlcmVkRXZlbnQpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdW5Mb2dLZXlzKTtcbiAgfVxuXG5cbiAgLypcbiAgICAtLS0tLS0tLS0tLS0tLS1cbiAgICB1dGlsaXRpZXNcbiAgICAtLS0tLS0tLS0tLS0tLS1cbiAgKi9cblxuICAvLyBkZXRlY3QgdmVyc2lvbiBvZiBtb3VzZSB3aGVlbCBldmVudCB0byB1c2VcbiAgLy8gdmlhIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0V2ZW50cy93aGVlbFxuICBmdW5jdGlvbiBkZXRlY3RXaGVlbCgpIHtcbiAgICByZXR1cm4gbW91c2VXaGVlbCA9ICdvbndoZWVsJyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSA/XG4gICAgICAnd2hlZWwnIDogLy8gTW9kZXJuIGJyb3dzZXJzIHN1cHBvcnQgXCJ3aGVlbFwiXG5cbiAgICAgIGRvY3VtZW50Lm9ubW91c2V3aGVlbCAhPT0gdW5kZWZpbmVkID9cbiAgICAgICAgJ21vdXNld2hlZWwnIDogLy8gV2Via2l0IGFuZCBJRSBzdXBwb3J0IGF0IGxlYXN0IFwibW91c2V3aGVlbFwiXG4gICAgICAgICdET01Nb3VzZVNjcm9sbCc7IC8vIGxldCdzIGFzc3VtZSB0aGF0IHJlbWFpbmluZyBicm93c2VycyBhcmUgb2xkZXIgRmlyZWZveFxuICB9XG5cblxuICAvKlxuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAgIGluaXRcblxuICAgIGRvbid0IHN0YXJ0IHNjcmlwdCB1bmxlc3MgYnJvd3NlciBjdXRzIHRoZSBtdXN0YXJkLFxuICAgIGFsc28gcGFzc2VzIGlmIHBvbHlmaWxscyBhcmUgdXNlZFxuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAqL1xuXG4gIGlmIChcbiAgICAnYWRkRXZlbnRMaXN0ZW5lcicgaW4gd2luZG93ICYmXG4gICAgQXJyYXkucHJvdG90eXBlLmluZGV4T2ZcbiAgKSB7XG5cbiAgICAvLyBpZiB0aGUgZG9tIGlzIGFscmVhZHkgcmVhZHkgYWxyZWFkeSAoc2NyaXB0IHdhcyBwbGFjZWQgYXQgYm90dG9tIG9mIDxib2R5PilcbiAgICBpZiAoZG9jdW1lbnQuYm9keSkge1xuICAgICAgYmluZEV2ZW50cygpO1xuXG4gICAgLy8gb3RoZXJ3aXNlIHdhaXQgZm9yIHRoZSBkb20gdG8gbG9hZCAoc2NyaXB0IHdhcyBwbGFjZWQgaW4gdGhlIDxoZWFkPilcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGJpbmRFdmVudHMpO1xuICAgIH1cbiAgfVxuXG5cbiAgLypcbiAgICAtLS0tLS0tLS0tLS0tLS1cbiAgICBhcGlcbiAgICAtLS0tLS0tLS0tLS0tLS1cbiAgKi9cblxuICByZXR1cm4ge1xuXG4gICAgLy8gcmV0dXJucyBzdHJpbmc6IHRoZSBjdXJyZW50IGlucHV0IHR5cGVcbiAgICBhc2s6IGZ1bmN0aW9uKCkgeyByZXR1cm4gY3VycmVudElucHV0OyB9LFxuXG4gICAgLy8gcmV0dXJucyBhcnJheTogY3VycmVudGx5IHByZXNzZWQga2V5c1xuICAgIGtleXM6IGZ1bmN0aW9uKCkgeyByZXR1cm4gYWN0aXZlS2V5czsgfSxcblxuICAgIC8vIHJldHVybnMgYXJyYXk6IGFsbCB0aGUgZGV0ZWN0ZWQgaW5wdXQgdHlwZXNcbiAgICB0eXBlczogZnVuY3Rpb24oKSB7IHJldHVybiBpbnB1dFR5cGVzOyB9LFxuXG4gICAgLy8gYWNjZXB0cyBzdHJpbmc6IG1hbnVhbGx5IHNldCB0aGUgaW5wdXQgdHlwZVxuICAgIHNldDogc3dpdGNoSW5wdXRcbiAgfTtcblxufSgpKTtcbiIsIiFmdW5jdGlvbigkKSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgRk9VTkRBVElPTl9WRVJTSU9OID0gJzYuMi40JztcblxuLy8gR2xvYmFsIEZvdW5kYXRpb24gb2JqZWN0XG4vLyBUaGlzIGlzIGF0dGFjaGVkIHRvIHRoZSB3aW5kb3csIG9yIHVzZWQgYXMgYSBtb2R1bGUgZm9yIEFNRC9Ccm93c2VyaWZ5XG52YXIgRm91bmRhdGlvbiA9IHtcbiAgdmVyc2lvbjogRk9VTkRBVElPTl9WRVJTSU9OLFxuXG4gIC8qKlxuICAgKiBTdG9yZXMgaW5pdGlhbGl6ZWQgcGx1Z2lucy5cbiAgICovXG4gIF9wbHVnaW5zOiB7fSxcblxuICAvKipcbiAgICogU3RvcmVzIGdlbmVyYXRlZCB1bmlxdWUgaWRzIGZvciBwbHVnaW4gaW5zdGFuY2VzXG4gICAqL1xuICBfdXVpZHM6IFtdLFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgYm9vbGVhbiBmb3IgUlRMIHN1cHBvcnRcbiAgICovXG4gIHJ0bDogZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gJCgnaHRtbCcpLmF0dHIoJ2RpcicpID09PSAncnRsJztcbiAgfSxcbiAgLyoqXG4gICAqIERlZmluZXMgYSBGb3VuZGF0aW9uIHBsdWdpbiwgYWRkaW5nIGl0IHRvIHRoZSBgRm91bmRhdGlvbmAgbmFtZXNwYWNlIGFuZCB0aGUgbGlzdCBvZiBwbHVnaW5zIHRvIGluaXRpYWxpemUgd2hlbiByZWZsb3dpbmcuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwbHVnaW4gLSBUaGUgY29uc3RydWN0b3Igb2YgdGhlIHBsdWdpbi5cbiAgICovXG4gIHBsdWdpbjogZnVuY3Rpb24ocGx1Z2luLCBuYW1lKSB7XG4gICAgLy8gT2JqZWN0IGtleSB0byB1c2Ugd2hlbiBhZGRpbmcgdG8gZ2xvYmFsIEZvdW5kYXRpb24gb2JqZWN0XG4gICAgLy8gRXhhbXBsZXM6IEZvdW5kYXRpb24uUmV2ZWFsLCBGb3VuZGF0aW9uLk9mZkNhbnZhc1xuICAgIHZhciBjbGFzc05hbWUgPSAobmFtZSB8fCBmdW5jdGlvbk5hbWUocGx1Z2luKSk7XG4gICAgLy8gT2JqZWN0IGtleSB0byB1c2Ugd2hlbiBzdG9yaW5nIHRoZSBwbHVnaW4sIGFsc28gdXNlZCB0byBjcmVhdGUgdGhlIGlkZW50aWZ5aW5nIGRhdGEgYXR0cmlidXRlIGZvciB0aGUgcGx1Z2luXG4gICAgLy8gRXhhbXBsZXM6IGRhdGEtcmV2ZWFsLCBkYXRhLW9mZi1jYW52YXNcbiAgICB2YXIgYXR0ck5hbWUgID0gaHlwaGVuYXRlKGNsYXNzTmFtZSk7XG5cbiAgICAvLyBBZGQgdG8gdGhlIEZvdW5kYXRpb24gb2JqZWN0IGFuZCB0aGUgcGx1Z2lucyBsaXN0IChmb3IgcmVmbG93aW5nKVxuICAgIHRoaXMuX3BsdWdpbnNbYXR0ck5hbWVdID0gdGhpc1tjbGFzc05hbWVdID0gcGx1Z2luO1xuICB9LFxuICAvKipcbiAgICogQGZ1bmN0aW9uXG4gICAqIFBvcHVsYXRlcyB0aGUgX3V1aWRzIGFycmF5IHdpdGggcG9pbnRlcnMgdG8gZWFjaCBpbmRpdmlkdWFsIHBsdWdpbiBpbnN0YW5jZS5cbiAgICogQWRkcyB0aGUgYHpmUGx1Z2luYCBkYXRhLWF0dHJpYnV0ZSB0byBwcm9ncmFtbWF0aWNhbGx5IGNyZWF0ZWQgcGx1Z2lucyB0byBhbGxvdyB1c2Ugb2YgJChzZWxlY3RvcikuZm91bmRhdGlvbihtZXRob2QpIGNhbGxzLlxuICAgKiBBbHNvIGZpcmVzIHRoZSBpbml0aWFsaXphdGlvbiBldmVudCBmb3IgZWFjaCBwbHVnaW4sIGNvbnNvbGlkYXRpbmcgcmVwZXRpdGl2ZSBjb2RlLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gYW4gaW5zdGFuY2Ugb2YgYSBwbHVnaW4sIHVzdWFsbHkgYHRoaXNgIGluIGNvbnRleHQuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gdGhlIG5hbWUgb2YgdGhlIHBsdWdpbiwgcGFzc2VkIGFzIGEgY2FtZWxDYXNlZCBzdHJpbmcuXG4gICAqIEBmaXJlcyBQbHVnaW4jaW5pdFxuICAgKi9cbiAgcmVnaXN0ZXJQbHVnaW46IGZ1bmN0aW9uKHBsdWdpbiwgbmFtZSl7XG4gICAgdmFyIHBsdWdpbk5hbWUgPSBuYW1lID8gaHlwaGVuYXRlKG5hbWUpIDogZnVuY3Rpb25OYW1lKHBsdWdpbi5jb25zdHJ1Y3RvcikudG9Mb3dlckNhc2UoKTtcbiAgICBwbHVnaW4udXVpZCA9IHRoaXMuR2V0WW9EaWdpdHMoNiwgcGx1Z2luTmFtZSk7XG5cbiAgICBpZighcGx1Z2luLiRlbGVtZW50LmF0dHIoYGRhdGEtJHtwbHVnaW5OYW1lfWApKXsgcGx1Z2luLiRlbGVtZW50LmF0dHIoYGRhdGEtJHtwbHVnaW5OYW1lfWAsIHBsdWdpbi51dWlkKTsgfVxuICAgIGlmKCFwbHVnaW4uJGVsZW1lbnQuZGF0YSgnemZQbHVnaW4nKSl7IHBsdWdpbi4kZWxlbWVudC5kYXRhKCd6ZlBsdWdpbicsIHBsdWdpbik7IH1cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBwbHVnaW4gaGFzIGluaXRpYWxpemVkLlxuICAgICAgICAgICAqIEBldmVudCBQbHVnaW4jaW5pdFxuICAgICAgICAgICAqL1xuICAgIHBsdWdpbi4kZWxlbWVudC50cmlnZ2VyKGBpbml0LnpmLiR7cGx1Z2luTmFtZX1gKTtcblxuICAgIHRoaXMuX3V1aWRzLnB1c2gocGx1Z2luLnV1aWQpO1xuXG4gICAgcmV0dXJuO1xuICB9LFxuICAvKipcbiAgICogQGZ1bmN0aW9uXG4gICAqIFJlbW92ZXMgdGhlIHBsdWdpbnMgdXVpZCBmcm9tIHRoZSBfdXVpZHMgYXJyYXkuXG4gICAqIFJlbW92ZXMgdGhlIHpmUGx1Z2luIGRhdGEgYXR0cmlidXRlLCBhcyB3ZWxsIGFzIHRoZSBkYXRhLXBsdWdpbi1uYW1lIGF0dHJpYnV0ZS5cbiAgICogQWxzbyBmaXJlcyB0aGUgZGVzdHJveWVkIGV2ZW50IGZvciB0aGUgcGx1Z2luLCBjb25zb2xpZGF0aW5nIHJlcGV0aXRpdmUgY29kZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIGFuIGluc3RhbmNlIG9mIGEgcGx1Z2luLCB1c3VhbGx5IGB0aGlzYCBpbiBjb250ZXh0LlxuICAgKiBAZmlyZXMgUGx1Z2luI2Rlc3Ryb3llZFxuICAgKi9cbiAgdW5yZWdpc3RlclBsdWdpbjogZnVuY3Rpb24ocGx1Z2luKXtcbiAgICB2YXIgcGx1Z2luTmFtZSA9IGh5cGhlbmF0ZShmdW5jdGlvbk5hbWUocGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJykuY29uc3RydWN0b3IpKTtcblxuICAgIHRoaXMuX3V1aWRzLnNwbGljZSh0aGlzLl91dWlkcy5pbmRleE9mKHBsdWdpbi51dWlkKSwgMSk7XG4gICAgcGx1Z2luLiRlbGVtZW50LnJlbW92ZUF0dHIoYGRhdGEtJHtwbHVnaW5OYW1lfWApLnJlbW92ZURhdGEoJ3pmUGx1Z2luJylcbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBwbHVnaW4gaGFzIGJlZW4gZGVzdHJveWVkLlxuICAgICAgICAgICAqIEBldmVudCBQbHVnaW4jZGVzdHJveWVkXG4gICAgICAgICAgICovXG4gICAgICAgICAgLnRyaWdnZXIoYGRlc3Ryb3llZC56Zi4ke3BsdWdpbk5hbWV9YCk7XG4gICAgZm9yKHZhciBwcm9wIGluIHBsdWdpbil7XG4gICAgICBwbHVnaW5bcHJvcF0gPSBudWxsOy8vY2xlYW4gdXAgc2NyaXB0IHRvIHByZXAgZm9yIGdhcmJhZ2UgY29sbGVjdGlvbi5cbiAgICB9XG4gICAgcmV0dXJuO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAZnVuY3Rpb25cbiAgICogQ2F1c2VzIG9uZSBvciBtb3JlIGFjdGl2ZSBwbHVnaW5zIHRvIHJlLWluaXRpYWxpemUsIHJlc2V0dGluZyBldmVudCBsaXN0ZW5lcnMsIHJlY2FsY3VsYXRpbmcgcG9zaXRpb25zLCBldGMuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwbHVnaW5zIC0gb3B0aW9uYWwgc3RyaW5nIG9mIGFuIGluZGl2aWR1YWwgcGx1Z2luIGtleSwgYXR0YWluZWQgYnkgY2FsbGluZyBgJChlbGVtZW50KS5kYXRhKCdwbHVnaW5OYW1lJylgLCBvciBzdHJpbmcgb2YgYSBwbHVnaW4gY2xhc3MgaS5lLiBgJ2Ryb3Bkb3duJ2BcbiAgICogQGRlZmF1bHQgSWYgbm8gYXJndW1lbnQgaXMgcGFzc2VkLCByZWZsb3cgYWxsIGN1cnJlbnRseSBhY3RpdmUgcGx1Z2lucy5cbiAgICovXG4gICByZUluaXQ6IGZ1bmN0aW9uKHBsdWdpbnMpe1xuICAgICB2YXIgaXNKUSA9IHBsdWdpbnMgaW5zdGFuY2VvZiAkO1xuICAgICB0cnl7XG4gICAgICAgaWYoaXNKUSl7XG4gICAgICAgICBwbHVnaW5zLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgJCh0aGlzKS5kYXRhKCd6ZlBsdWdpbicpLl9pbml0KCk7XG4gICAgICAgICB9KTtcbiAgICAgICB9ZWxzZXtcbiAgICAgICAgIHZhciB0eXBlID0gdHlwZW9mIHBsdWdpbnMsXG4gICAgICAgICBfdGhpcyA9IHRoaXMsXG4gICAgICAgICBmbnMgPSB7XG4gICAgICAgICAgICdvYmplY3QnOiBmdW5jdGlvbihwbGdzKXtcbiAgICAgICAgICAgICBwbGdzLmZvckVhY2goZnVuY3Rpb24ocCl7XG4gICAgICAgICAgICAgICBwID0gaHlwaGVuYXRlKHApO1xuICAgICAgICAgICAgICAgJCgnW2RhdGEtJysgcCArJ10nKS5mb3VuZGF0aW9uKCdfaW5pdCcpO1xuICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICB9LFxuICAgICAgICAgICAnc3RyaW5nJzogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICBwbHVnaW5zID0gaHlwaGVuYXRlKHBsdWdpbnMpO1xuICAgICAgICAgICAgICQoJ1tkYXRhLScrIHBsdWdpbnMgKyddJykuZm91bmRhdGlvbignX2luaXQnKTtcbiAgICAgICAgICAgfSxcbiAgICAgICAgICAgJ3VuZGVmaW5lZCc6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgdGhpc1snb2JqZWN0J10oT2JqZWN0LmtleXMoX3RoaXMuX3BsdWdpbnMpKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgfTtcbiAgICAgICAgIGZuc1t0eXBlXShwbHVnaW5zKTtcbiAgICAgICB9XG4gICAgIH1jYXRjaChlcnIpe1xuICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgfWZpbmFsbHl7XG4gICAgICAgcmV0dXJuIHBsdWdpbnM7XG4gICAgIH1cbiAgIH0sXG5cbiAgLyoqXG4gICAqIHJldHVybnMgYSByYW5kb20gYmFzZS0zNiB1aWQgd2l0aCBuYW1lc3BhY2luZ1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGxlbmd0aCAtIG51bWJlciBvZiByYW5kb20gYmFzZS0zNiBkaWdpdHMgZGVzaXJlZC4gSW5jcmVhc2UgZm9yIG1vcmUgcmFuZG9tIHN0cmluZ3MuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2UgLSBuYW1lIG9mIHBsdWdpbiB0byBiZSBpbmNvcnBvcmF0ZWQgaW4gdWlkLCBvcHRpb25hbC5cbiAgICogQGRlZmF1bHQge1N0cmluZ30gJycgLSBpZiBubyBwbHVnaW4gbmFtZSBpcyBwcm92aWRlZCwgbm90aGluZyBpcyBhcHBlbmRlZCB0byB0aGUgdWlkLlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSAtIHVuaXF1ZSBpZFxuICAgKi9cbiAgR2V0WW9EaWdpdHM6IGZ1bmN0aW9uKGxlbmd0aCwgbmFtZXNwYWNlKXtcbiAgICBsZW5ndGggPSBsZW5ndGggfHwgNjtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCgoTWF0aC5wb3coMzYsIGxlbmd0aCArIDEpIC0gTWF0aC5yYW5kb20oKSAqIE1hdGgucG93KDM2LCBsZW5ndGgpKSkudG9TdHJpbmcoMzYpLnNsaWNlKDEpICsgKG5hbWVzcGFjZSA/IGAtJHtuYW1lc3BhY2V9YCA6ICcnKTtcbiAgfSxcbiAgLyoqXG4gICAqIEluaXRpYWxpemUgcGx1Z2lucyBvbiBhbnkgZWxlbWVudHMgd2l0aGluIGBlbGVtYCAoYW5kIGBlbGVtYCBpdHNlbGYpIHRoYXQgYXJlbid0IGFscmVhZHkgaW5pdGlhbGl6ZWQuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtIC0galF1ZXJ5IG9iamVjdCBjb250YWluaW5nIHRoZSBlbGVtZW50IHRvIGNoZWNrIGluc2lkZS4gQWxzbyBjaGVja3MgdGhlIGVsZW1lbnQgaXRzZWxmLCB1bmxlc3MgaXQncyB0aGUgYGRvY3VtZW50YCBvYmplY3QuXG4gICAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBwbHVnaW5zIC0gQSBsaXN0IG9mIHBsdWdpbnMgdG8gaW5pdGlhbGl6ZS4gTGVhdmUgdGhpcyBvdXQgdG8gaW5pdGlhbGl6ZSBldmVyeXRoaW5nLlxuICAgKi9cbiAgcmVmbG93OiBmdW5jdGlvbihlbGVtLCBwbHVnaW5zKSB7XG5cbiAgICAvLyBJZiBwbHVnaW5zIGlzIHVuZGVmaW5lZCwganVzdCBncmFiIGV2ZXJ5dGhpbmdcbiAgICBpZiAodHlwZW9mIHBsdWdpbnMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBwbHVnaW5zID0gT2JqZWN0LmtleXModGhpcy5fcGx1Z2lucyk7XG4gICAgfVxuICAgIC8vIElmIHBsdWdpbnMgaXMgYSBzdHJpbmcsIGNvbnZlcnQgaXQgdG8gYW4gYXJyYXkgd2l0aCBvbmUgaXRlbVxuICAgIGVsc2UgaWYgKHR5cGVvZiBwbHVnaW5zID09PSAnc3RyaW5nJykge1xuICAgICAgcGx1Z2lucyA9IFtwbHVnaW5zXTtcbiAgICB9XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGVhY2ggcGx1Z2luXG4gICAgJC5lYWNoKHBsdWdpbnMsIGZ1bmN0aW9uKGksIG5hbWUpIHtcbiAgICAgIC8vIEdldCB0aGUgY3VycmVudCBwbHVnaW5cbiAgICAgIHZhciBwbHVnaW4gPSBfdGhpcy5fcGx1Z2luc1tuYW1lXTtcblxuICAgICAgLy8gTG9jYWxpemUgdGhlIHNlYXJjaCB0byBhbGwgZWxlbWVudHMgaW5zaWRlIGVsZW0sIGFzIHdlbGwgYXMgZWxlbSBpdHNlbGYsIHVubGVzcyBlbGVtID09PSBkb2N1bWVudFxuICAgICAgdmFyICRlbGVtID0gJChlbGVtKS5maW5kKCdbZGF0YS0nK25hbWUrJ10nKS5hZGRCYWNrKCdbZGF0YS0nK25hbWUrJ10nKTtcblxuICAgICAgLy8gRm9yIGVhY2ggcGx1Z2luIGZvdW5kLCBpbml0aWFsaXplIGl0XG4gICAgICAkZWxlbS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGVsID0gJCh0aGlzKSxcbiAgICAgICAgICAgIG9wdHMgPSB7fTtcbiAgICAgICAgLy8gRG9uJ3QgZG91YmxlLWRpcCBvbiBwbHVnaW5zXG4gICAgICAgIGlmICgkZWwuZGF0YSgnemZQbHVnaW4nKSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybihcIlRyaWVkIHRvIGluaXRpYWxpemUgXCIrbmFtZStcIiBvbiBhbiBlbGVtZW50IHRoYXQgYWxyZWFkeSBoYXMgYSBGb3VuZGF0aW9uIHBsdWdpbi5cIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoJGVsLmF0dHIoJ2RhdGEtb3B0aW9ucycpKXtcbiAgICAgICAgICB2YXIgdGhpbmcgPSAkZWwuYXR0cignZGF0YS1vcHRpb25zJykuc3BsaXQoJzsnKS5mb3JFYWNoKGZ1bmN0aW9uKGUsIGkpe1xuICAgICAgICAgICAgdmFyIG9wdCA9IGUuc3BsaXQoJzonKS5tYXAoZnVuY3Rpb24oZWwpeyByZXR1cm4gZWwudHJpbSgpOyB9KTtcbiAgICAgICAgICAgIGlmKG9wdFswXSkgb3B0c1tvcHRbMF1dID0gcGFyc2VWYWx1ZShvcHRbMV0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRyeXtcbiAgICAgICAgICAkZWwuZGF0YSgnemZQbHVnaW4nLCBuZXcgcGx1Z2luKCQodGhpcyksIG9wdHMpKTtcbiAgICAgICAgfWNhdGNoKGVyKXtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVyKTtcbiAgICAgICAgfWZpbmFsbHl7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcbiAgZ2V0Rm5OYW1lOiBmdW5jdGlvbk5hbWUsXG4gIHRyYW5zaXRpb25lbmQ6IGZ1bmN0aW9uKCRlbGVtKXtcbiAgICB2YXIgdHJhbnNpdGlvbnMgPSB7XG4gICAgICAndHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAgICdXZWJraXRUcmFuc2l0aW9uJzogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxuICAgICAgJ01velRyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgICAnT1RyYW5zaXRpb24nOiAnb3RyYW5zaXRpb25lbmQnXG4gICAgfTtcbiAgICB2YXIgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgICBlbmQ7XG5cbiAgICBmb3IgKHZhciB0IGluIHRyYW5zaXRpb25zKXtcbiAgICAgIGlmICh0eXBlb2YgZWxlbS5zdHlsZVt0XSAhPT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgICBlbmQgPSB0cmFuc2l0aW9uc1t0XTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYoZW5kKXtcbiAgICAgIHJldHVybiBlbmQ7XG4gICAgfWVsc2V7XG4gICAgICBlbmQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICRlbGVtLnRyaWdnZXJIYW5kbGVyKCd0cmFuc2l0aW9uZW5kJywgWyRlbGVtXSk7XG4gICAgICB9LCAxKTtcbiAgICAgIHJldHVybiAndHJhbnNpdGlvbmVuZCc7XG4gICAgfVxuICB9XG59O1xuXG5Gb3VuZGF0aW9uLnV0aWwgPSB7XG4gIC8qKlxuICAgKiBGdW5jdGlvbiBmb3IgYXBwbHlpbmcgYSBkZWJvdW5jZSBlZmZlY3QgdG8gYSBmdW5jdGlvbiBjYWxsLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyAtIEZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBhdCBlbmQgb2YgdGltZW91dC5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGRlbGF5IC0gVGltZSBpbiBtcyB0byBkZWxheSB0aGUgY2FsbCBvZiBgZnVuY2AuXG4gICAqIEByZXR1cm5zIGZ1bmN0aW9uXG4gICAqL1xuICB0aHJvdHRsZTogZnVuY3Rpb24gKGZ1bmMsIGRlbGF5KSB7XG4gICAgdmFyIHRpbWVyID0gbnVsbDtcblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cbiAgICAgIGlmICh0aW1lciA9PT0gbnVsbCkge1xuICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgICB9LCBkZWxheSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufTtcblxuLy8gVE9ETzogY29uc2lkZXIgbm90IG1ha2luZyB0aGlzIGEgalF1ZXJ5IGZ1bmN0aW9uXG4vLyBUT0RPOiBuZWVkIHdheSB0byByZWZsb3cgdnMuIHJlLWluaXRpYWxpemVcbi8qKlxuICogVGhlIEZvdW5kYXRpb24galF1ZXJ5IG1ldGhvZC5cbiAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBtZXRob2QgLSBBbiBhY3Rpb24gdG8gcGVyZm9ybSBvbiB0aGUgY3VycmVudCBqUXVlcnkgb2JqZWN0LlxuICovXG52YXIgZm91bmRhdGlvbiA9IGZ1bmN0aW9uKG1ldGhvZCkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiBtZXRob2QsXG4gICAgICAkbWV0YSA9ICQoJ21ldGEuZm91bmRhdGlvbi1tcScpLFxuICAgICAgJG5vSlMgPSAkKCcubm8tanMnKTtcblxuICBpZighJG1ldGEubGVuZ3RoKXtcbiAgICAkKCc8bWV0YSBjbGFzcz1cImZvdW5kYXRpb24tbXFcIj4nKS5hcHBlbmRUbyhkb2N1bWVudC5oZWFkKTtcbiAgfVxuICBpZigkbm9KUy5sZW5ndGgpe1xuICAgICRub0pTLnJlbW92ZUNsYXNzKCduby1qcycpO1xuICB9XG5cbiAgaWYodHlwZSA9PT0gJ3VuZGVmaW5lZCcpey8vbmVlZHMgdG8gaW5pdGlhbGl6ZSB0aGUgRm91bmRhdGlvbiBvYmplY3QsIG9yIGFuIGluZGl2aWR1YWwgcGx1Z2luLlxuICAgIEZvdW5kYXRpb24uTWVkaWFRdWVyeS5faW5pdCgpO1xuICAgIEZvdW5kYXRpb24ucmVmbG93KHRoaXMpO1xuICB9ZWxzZSBpZih0eXBlID09PSAnc3RyaW5nJyl7Ly9hbiBpbmRpdmlkdWFsIG1ldGhvZCB0byBpbnZva2Ugb24gYSBwbHVnaW4gb3IgZ3JvdXAgb2YgcGx1Z2luc1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTsvL2NvbGxlY3QgYWxsIHRoZSBhcmd1bWVudHMsIGlmIG5lY2Vzc2FyeVxuICAgIHZhciBwbHVnQ2xhc3MgPSB0aGlzLmRhdGEoJ3pmUGx1Z2luJyk7Ly9kZXRlcm1pbmUgdGhlIGNsYXNzIG9mIHBsdWdpblxuXG4gICAgaWYocGx1Z0NsYXNzICE9PSB1bmRlZmluZWQgJiYgcGx1Z0NsYXNzW21ldGhvZF0gIT09IHVuZGVmaW5lZCl7Ly9tYWtlIHN1cmUgYm90aCB0aGUgY2xhc3MgYW5kIG1ldGhvZCBleGlzdFxuICAgICAgaWYodGhpcy5sZW5ndGggPT09IDEpey8vaWYgdGhlcmUncyBvbmx5IG9uZSwgY2FsbCBpdCBkaXJlY3RseS5cbiAgICAgICAgICBwbHVnQ2xhc3NbbWV0aG9kXS5hcHBseShwbHVnQ2xhc3MsIGFyZ3MpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMuZWFjaChmdW5jdGlvbihpLCBlbCl7Ly9vdGhlcndpc2UgbG9vcCB0aHJvdWdoIHRoZSBqUXVlcnkgY29sbGVjdGlvbiBhbmQgaW52b2tlIHRoZSBtZXRob2Qgb24gZWFjaFxuICAgICAgICAgIHBsdWdDbGFzc1ttZXRob2RdLmFwcGx5KCQoZWwpLmRhdGEoJ3pmUGx1Z2luJyksIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9ZWxzZXsvL2Vycm9yIGZvciBubyBjbGFzcyBvciBubyBtZXRob2RcbiAgICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcIldlJ3JlIHNvcnJ5LCAnXCIgKyBtZXRob2QgKyBcIicgaXMgbm90IGFuIGF2YWlsYWJsZSBtZXRob2QgZm9yIFwiICsgKHBsdWdDbGFzcyA/IGZ1bmN0aW9uTmFtZShwbHVnQ2xhc3MpIDogJ3RoaXMgZWxlbWVudCcpICsgJy4nKTtcbiAgICB9XG4gIH1lbHNley8vZXJyb3IgZm9yIGludmFsaWQgYXJndW1lbnQgdHlwZVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFdlJ3JlIHNvcnJ5LCAke3R5cGV9IGlzIG5vdCBhIHZhbGlkIHBhcmFtZXRlci4gWW91IG11c3QgdXNlIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgbWV0aG9kIHlvdSB3aXNoIHRvIGludm9rZS5gKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbndpbmRvdy5Gb3VuZGF0aW9uID0gRm91bmRhdGlvbjtcbiQuZm4uZm91bmRhdGlvbiA9IGZvdW5kYXRpb247XG5cbi8vIFBvbHlmaWxsIGZvciByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbihmdW5jdGlvbigpIHtcbiAgaWYgKCFEYXRlLm5vdyB8fCAhd2luZG93LkRhdGUubm93KVxuICAgIHdpbmRvdy5EYXRlLm5vdyA9IERhdGUubm93ID0gZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgfTtcblxuICB2YXIgdmVuZG9ycyA9IFsnd2Via2l0JywgJ21veiddO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHZlbmRvcnMubGVuZ3RoICYmICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lOyArK2kpIHtcbiAgICAgIHZhciB2cCA9IHZlbmRvcnNbaV07XG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZwKydSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9ICh3aW5kb3dbdnArJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHdpbmRvd1t2cCsnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ10pO1xuICB9XG4gIGlmICgvaVAoYWR8aG9uZXxvZCkuKk9TIDYvLnRlc3Qod2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpXG4gICAgfHwgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSkge1xuICAgIHZhciBsYXN0VGltZSA9IDA7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICB2YXIgbmV4dFRpbWUgPSBNYXRoLm1heChsYXN0VGltZSArIDE2LCBub3cpO1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2sobGFzdFRpbWUgPSBuZXh0VGltZSk7IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRUaW1lIC0gbm93KTtcbiAgICB9O1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGNsZWFyVGltZW91dDtcbiAgfVxuICAvKipcbiAgICogUG9seWZpbGwgZm9yIHBlcmZvcm1hbmNlLm5vdywgcmVxdWlyZWQgYnkgckFGXG4gICAqL1xuICBpZighd2luZG93LnBlcmZvcm1hbmNlIHx8ICF3aW5kb3cucGVyZm9ybWFuY2Uubm93KXtcbiAgICB3aW5kb3cucGVyZm9ybWFuY2UgPSB7XG4gICAgICBzdGFydDogRGF0ZS5ub3coKSxcbiAgICAgIG5vdzogZnVuY3Rpb24oKXsgcmV0dXJuIERhdGUubm93KCkgLSB0aGlzLnN0YXJ0OyB9XG4gICAgfTtcbiAgfVxufSkoKTtcbmlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbihvVGhpcykge1xuICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gY2xvc2VzdCB0aGluZyBwb3NzaWJsZSB0byB0aGUgRUNNQVNjcmlwdCA1XG4gICAgICAvLyBpbnRlcm5hbCBJc0NhbGxhYmxlIGZ1bmN0aW9uXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZScpO1xuICAgIH1cblxuICAgIHZhciBhQXJncyAgID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSxcbiAgICAgICAgZlRvQmluZCA9IHRoaXMsXG4gICAgICAgIGZOT1AgICAgPSBmdW5jdGlvbigpIHt9LFxuICAgICAgICBmQm91bmQgID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGZUb0JpbmQuYXBwbHkodGhpcyBpbnN0YW5jZW9mIGZOT1BcbiAgICAgICAgICAgICAgICAgPyB0aGlzXG4gICAgICAgICAgICAgICAgIDogb1RoaXMsXG4gICAgICAgICAgICAgICAgIGFBcmdzLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH07XG5cbiAgICBpZiAodGhpcy5wcm90b3R5cGUpIHtcbiAgICAgIC8vIG5hdGl2ZSBmdW5jdGlvbnMgZG9uJ3QgaGF2ZSBhIHByb3RvdHlwZVxuICAgICAgZk5PUC5wcm90b3R5cGUgPSB0aGlzLnByb3RvdHlwZTtcbiAgICB9XG4gICAgZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7XG5cbiAgICByZXR1cm4gZkJvdW5kO1xuICB9O1xufVxuLy8gUG9seWZpbGwgdG8gZ2V0IHRoZSBuYW1lIG9mIGEgZnVuY3Rpb24gaW4gSUU5XG5mdW5jdGlvbiBmdW5jdGlvbk5hbWUoZm4pIHtcbiAgaWYgKEZ1bmN0aW9uLnByb3RvdHlwZS5uYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICB2YXIgZnVuY05hbWVSZWdleCA9IC9mdW5jdGlvblxccyhbXihdezEsfSlcXCgvO1xuICAgIHZhciByZXN1bHRzID0gKGZ1bmNOYW1lUmVnZXgpLmV4ZWMoKGZuKS50b1N0cmluZygpKTtcbiAgICByZXR1cm4gKHJlc3VsdHMgJiYgcmVzdWx0cy5sZW5ndGggPiAxKSA/IHJlc3VsdHNbMV0udHJpbSgpIDogXCJcIjtcbiAgfVxuICBlbHNlIGlmIChmbi5wcm90b3R5cGUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBmbi5jb25zdHJ1Y3Rvci5uYW1lO1xuICB9XG4gIGVsc2Uge1xuICAgIHJldHVybiBmbi5wcm90b3R5cGUuY29uc3RydWN0b3IubmFtZTtcbiAgfVxufVxuZnVuY3Rpb24gcGFyc2VWYWx1ZShzdHIpe1xuICBpZigvdHJ1ZS8udGVzdChzdHIpKSByZXR1cm4gdHJ1ZTtcbiAgZWxzZSBpZigvZmFsc2UvLnRlc3Qoc3RyKSkgcmV0dXJuIGZhbHNlO1xuICBlbHNlIGlmKCFpc05hTihzdHIgKiAxKSkgcmV0dXJuIHBhcnNlRmxvYXQoc3RyKTtcbiAgcmV0dXJuIHN0cjtcbn1cbi8vIENvbnZlcnQgUGFzY2FsQ2FzZSB0byBrZWJhYi1jYXNlXG4vLyBUaGFuayB5b3U6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzg5NTU1ODBcbmZ1bmN0aW9uIGh5cGhlbmF0ZShzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpO1xufVxuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbkZvdW5kYXRpb24uQm94ID0ge1xuICBJbU5vdFRvdWNoaW5nWW91OiBJbU5vdFRvdWNoaW5nWW91LFxuICBHZXREaW1lbnNpb25zOiBHZXREaW1lbnNpb25zLFxuICBHZXRPZmZzZXRzOiBHZXRPZmZzZXRzXG59XG5cbi8qKlxuICogQ29tcGFyZXMgdGhlIGRpbWVuc2lvbnMgb2YgYW4gZWxlbWVudCB0byBhIGNvbnRhaW5lciBhbmQgZGV0ZXJtaW5lcyBjb2xsaXNpb24gZXZlbnRzIHdpdGggY29udGFpbmVyLlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gdGVzdCBmb3IgY29sbGlzaW9ucy5cbiAqIEBwYXJhbSB7alF1ZXJ5fSBwYXJlbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHVzZSBhcyBib3VuZGluZyBjb250YWluZXIuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGxyT25seSAtIHNldCB0byB0cnVlIHRvIGNoZWNrIGxlZnQgYW5kIHJpZ2h0IHZhbHVlcyBvbmx5LlxuICogQHBhcmFtIHtCb29sZWFufSB0Yk9ubHkgLSBzZXQgdG8gdHJ1ZSB0byBjaGVjayB0b3AgYW5kIGJvdHRvbSB2YWx1ZXMgb25seS5cbiAqIEBkZWZhdWx0IGlmIG5vIHBhcmVudCBvYmplY3QgcGFzc2VkLCBkZXRlY3RzIGNvbGxpc2lvbnMgd2l0aCBgd2luZG93YC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSAtIHRydWUgaWYgY29sbGlzaW9uIGZyZWUsIGZhbHNlIGlmIGEgY29sbGlzaW9uIGluIGFueSBkaXJlY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIEltTm90VG91Y2hpbmdZb3UoZWxlbWVudCwgcGFyZW50LCBsck9ubHksIHRiT25seSkge1xuICB2YXIgZWxlRGltcyA9IEdldERpbWVuc2lvbnMoZWxlbWVudCksXG4gICAgICB0b3AsIGJvdHRvbSwgbGVmdCwgcmlnaHQ7XG5cbiAgaWYgKHBhcmVudCkge1xuICAgIHZhciBwYXJEaW1zID0gR2V0RGltZW5zaW9ucyhwYXJlbnQpO1xuXG4gICAgYm90dG9tID0gKGVsZURpbXMub2Zmc2V0LnRvcCArIGVsZURpbXMuaGVpZ2h0IDw9IHBhckRpbXMuaGVpZ2h0ICsgcGFyRGltcy5vZmZzZXQudG9wKTtcbiAgICB0b3AgICAgPSAoZWxlRGltcy5vZmZzZXQudG9wID49IHBhckRpbXMub2Zmc2V0LnRvcCk7XG4gICAgbGVmdCAgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgPj0gcGFyRGltcy5vZmZzZXQubGVmdCk7XG4gICAgcmlnaHQgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgKyBlbGVEaW1zLndpZHRoIDw9IHBhckRpbXMud2lkdGggKyBwYXJEaW1zLm9mZnNldC5sZWZ0KTtcbiAgfVxuICBlbHNlIHtcbiAgICBib3R0b20gPSAoZWxlRGltcy5vZmZzZXQudG9wICsgZWxlRGltcy5oZWlnaHQgPD0gZWxlRGltcy53aW5kb3dEaW1zLmhlaWdodCArIGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcbiAgICB0b3AgICAgPSAoZWxlRGltcy5vZmZzZXQudG9wID49IGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcbiAgICBsZWZ0ICAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCA+PSBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQpO1xuICAgIHJpZ2h0ICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCA8PSBlbGVEaW1zLndpbmRvd0RpbXMud2lkdGgpO1xuICB9XG5cbiAgdmFyIGFsbERpcnMgPSBbYm90dG9tLCB0b3AsIGxlZnQsIHJpZ2h0XTtcblxuICBpZiAobHJPbmx5KSB7XG4gICAgcmV0dXJuIGxlZnQgPT09IHJpZ2h0ID09PSB0cnVlO1xuICB9XG5cbiAgaWYgKHRiT25seSkge1xuICAgIHJldHVybiB0b3AgPT09IGJvdHRvbSA9PT0gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBhbGxEaXJzLmluZGV4T2YoZmFsc2UpID09PSAtMTtcbn07XG5cbi8qKlxuICogVXNlcyBuYXRpdmUgbWV0aG9kcyB0byByZXR1cm4gYW4gb2JqZWN0IG9mIGRpbWVuc2lvbiB2YWx1ZXMuXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5IHx8IEhUTUx9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IG9yIERPTSBlbGVtZW50IGZvciB3aGljaCB0byBnZXQgdGhlIGRpbWVuc2lvbnMuIENhbiBiZSBhbnkgZWxlbWVudCBvdGhlciB0aGF0IGRvY3VtZW50IG9yIHdpbmRvdy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gbmVzdGVkIG9iamVjdCBvZiBpbnRlZ2VyIHBpeGVsIHZhbHVlc1xuICogVE9ETyAtIGlmIGVsZW1lbnQgaXMgd2luZG93LCByZXR1cm4gb25seSB0aG9zZSB2YWx1ZXMuXG4gKi9cbmZ1bmN0aW9uIEdldERpbWVuc2lvbnMoZWxlbSwgdGVzdCl7XG4gIGVsZW0gPSBlbGVtLmxlbmd0aCA/IGVsZW1bMF0gOiBlbGVtO1xuXG4gIGlmIChlbGVtID09PSB3aW5kb3cgfHwgZWxlbSA9PT0gZG9jdW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJJ20gc29ycnksIERhdmUuIEknbSBhZnJhaWQgSSBjYW4ndCBkbyB0aGF0LlwiKTtcbiAgfVxuXG4gIHZhciByZWN0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHBhclJlY3QgPSBlbGVtLnBhcmVudE5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICB3aW5SZWN0ID0gZG9jdW1lbnQuYm9keS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHdpblkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXG4gICAgICB3aW5YID0gd2luZG93LnBhZ2VYT2Zmc2V0O1xuXG4gIHJldHVybiB7XG4gICAgd2lkdGg6IHJlY3Qud2lkdGgsXG4gICAgaGVpZ2h0OiByZWN0LmhlaWdodCxcbiAgICBvZmZzZXQ6IHtcbiAgICAgIHRvcDogcmVjdC50b3AgKyB3aW5ZLFxuICAgICAgbGVmdDogcmVjdC5sZWZ0ICsgd2luWFxuICAgIH0sXG4gICAgcGFyZW50RGltczoge1xuICAgICAgd2lkdGg6IHBhclJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQ6IHBhclJlY3QuaGVpZ2h0LFxuICAgICAgb2Zmc2V0OiB7XG4gICAgICAgIHRvcDogcGFyUmVjdC50b3AgKyB3aW5ZLFxuICAgICAgICBsZWZ0OiBwYXJSZWN0LmxlZnQgKyB3aW5YXG4gICAgICB9XG4gICAgfSxcbiAgICB3aW5kb3dEaW1zOiB7XG4gICAgICB3aWR0aDogd2luUmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogd2luUmVjdC5oZWlnaHQsXG4gICAgICBvZmZzZXQ6IHtcbiAgICAgICAgdG9wOiB3aW5ZLFxuICAgICAgICBsZWZ0OiB3aW5YXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBvYmplY3Qgb2YgdG9wIGFuZCBsZWZ0IGludGVnZXIgcGl4ZWwgdmFsdWVzIGZvciBkeW5hbWljYWxseSByZW5kZXJlZCBlbGVtZW50cyxcbiAqIHN1Y2ggYXM6IFRvb2x0aXAsIFJldmVhbCwgYW5kIERyb3Bkb3duXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCBmb3IgdGhlIGVsZW1lbnQgYmVpbmcgcG9zaXRpb25lZC5cbiAqIEBwYXJhbSB7alF1ZXJ5fSBhbmNob3IgLSBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZWxlbWVudCdzIGFuY2hvciBwb2ludC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBwb3NpdGlvbiAtIGEgc3RyaW5nIHJlbGF0aW5nIHRvIHRoZSBkZXNpcmVkIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50LCByZWxhdGl2ZSB0byBpdCdzIGFuY2hvclxuICogQHBhcmFtIHtOdW1iZXJ9IHZPZmZzZXQgLSBpbnRlZ2VyIHBpeGVsIHZhbHVlIG9mIGRlc2lyZWQgdmVydGljYWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBoT2Zmc2V0IC0gaW50ZWdlciBwaXhlbCB2YWx1ZSBvZiBkZXNpcmVkIGhvcml6b250YWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNPdmVyZmxvdyAtIGlmIGEgY29sbGlzaW9uIGV2ZW50IGlzIGRldGVjdGVkLCBzZXRzIHRvIHRydWUgdG8gZGVmYXVsdCB0aGUgZWxlbWVudCB0byBmdWxsIHdpZHRoIC0gYW55IGRlc2lyZWQgb2Zmc2V0LlxuICogVE9ETyBhbHRlci9yZXdyaXRlIHRvIHdvcmsgd2l0aCBgZW1gIHZhbHVlcyBhcyB3ZWxsL2luc3RlYWQgb2YgcGl4ZWxzXG4gKi9cbmZ1bmN0aW9uIEdldE9mZnNldHMoZWxlbWVudCwgYW5jaG9yLCBwb3NpdGlvbiwgdk9mZnNldCwgaE9mZnNldCwgaXNPdmVyZmxvdykge1xuICB2YXIgJGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxuICAgICAgJGFuY2hvckRpbXMgPSBhbmNob3IgPyBHZXREaW1lbnNpb25zKGFuY2hvcikgOiBudWxsO1xuXG4gIHN3aXRjaCAocG9zaXRpb24pIHtcbiAgICBjYXNlICd0b3AnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKEZvdW5kYXRpb24ucnRsKCkgPyAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICRlbGVEaW1zLndpZHRoICsgJGFuY2hvckRpbXMud2lkdGggOiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbGVmdCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICgkZWxlRGltcy53aWR0aCArIGhPZmZzZXQpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgJGFuY2hvckRpbXMud2lkdGggKyBoT2Zmc2V0LFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciB0b3AnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgKCRhbmNob3JEaW1zLndpZHRoIC8gMikpIC0gKCRlbGVEaW1zLndpZHRoIC8gMiksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyIGJvdHRvbSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiBpc092ZXJmbG93ID8gaE9mZnNldCA6ICgoJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAoJGFuY2hvckRpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciBsZWZ0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gKCRlbGVEaW1zLndpZHRoICsgaE9mZnNldCksXG4gICAgICAgIHRvcDogKCRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAoJGFuY2hvckRpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXIgcmlnaHQnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQgKyAxLFxuICAgICAgICB0b3A6ICgkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgKCRhbmNob3JEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICgkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0ICsgKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSxcbiAgICAgICAgdG9wOiAoJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wICsgKCRlbGVEaW1zLndpbmRvd0RpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyZXZlYWwnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLSAkZWxlRGltcy53aWR0aCkgLyAyLFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICBjYXNlICdyZXZlYWwgZnVsbCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0LFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcFxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbGVmdCBib3R0b20nOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQsXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodFxuICAgICAgfTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3JpZ2h0IGJvdHRvbSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICRhbmNob3JEaW1zLndpZHRoICsgaE9mZnNldCAtICRlbGVEaW1zLndpZHRoLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHRcbiAgICAgIH07XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKEZvdW5kYXRpb24ucnRsKCkgPyAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICRlbGVEaW1zLndpZHRoICsgJGFuY2hvckRpbXMud2lkdGggOiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArIGhPZmZzZXQpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHQgKyB2T2Zmc2V0XG4gICAgICB9XG4gIH1cbn1cblxufShqUXVlcnkpO1xuIiwiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBUaGlzIHV0aWwgd2FzIGNyZWF0ZWQgYnkgTWFyaXVzIE9sYmVydHogKlxuICogUGxlYXNlIHRoYW5rIE1hcml1cyBvbiBHaXRIdWIgL293bGJlcnR6ICpcbiAqIG9yIHRoZSB3ZWIgaHR0cDovL3d3dy5tYXJpdXNvbGJlcnR6LmRlLyAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5jb25zdCBrZXlDb2RlcyA9IHtcbiAgOTogJ1RBQicsXG4gIDEzOiAnRU5URVInLFxuICAyNzogJ0VTQ0FQRScsXG4gIDMyOiAnU1BBQ0UnLFxuICAzNzogJ0FSUk9XX0xFRlQnLFxuICAzODogJ0FSUk9XX1VQJyxcbiAgMzk6ICdBUlJPV19SSUdIVCcsXG4gIDQwOiAnQVJST1dfRE9XTidcbn1cblxudmFyIGNvbW1hbmRzID0ge31cblxudmFyIEtleWJvYXJkID0ge1xuICBrZXlzOiBnZXRLZXlDb2RlcyhrZXlDb2RlcyksXG5cbiAgLyoqXG4gICAqIFBhcnNlcyB0aGUgKGtleWJvYXJkKSBldmVudCBhbmQgcmV0dXJucyBhIFN0cmluZyB0aGF0IHJlcHJlc2VudHMgaXRzIGtleVxuICAgKiBDYW4gYmUgdXNlZCBsaWtlIEZvdW5kYXRpb24ucGFyc2VLZXkoZXZlbnQpID09PSBGb3VuZGF0aW9uLmtleXMuU1BBQ0VcbiAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSB0aGUgZXZlbnQgZ2VuZXJhdGVkIGJ5IHRoZSBldmVudCBoYW5kbGVyXG4gICAqIEByZXR1cm4gU3RyaW5nIGtleSAtIFN0cmluZyB0aGF0IHJlcHJlc2VudHMgdGhlIGtleSBwcmVzc2VkXG4gICAqL1xuICBwYXJzZUtleShldmVudCkge1xuICAgIHZhciBrZXkgPSBrZXlDb2Rlc1tldmVudC53aGljaCB8fCBldmVudC5rZXlDb2RlXSB8fCBTdHJpbmcuZnJvbUNoYXJDb2RlKGV2ZW50LndoaWNoKS50b1VwcGVyQ2FzZSgpO1xuICAgIGlmIChldmVudC5zaGlmdEtleSkga2V5ID0gYFNISUZUXyR7a2V5fWA7XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIGtleSA9IGBDVFJMXyR7a2V5fWA7XG4gICAgaWYgKGV2ZW50LmFsdEtleSkga2V5ID0gYEFMVF8ke2tleX1gO1xuICAgIHJldHVybiBrZXk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgdGhlIGdpdmVuIChrZXlib2FyZCkgZXZlbnRcbiAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSB0aGUgZXZlbnQgZ2VuZXJhdGVkIGJ5IHRoZSBldmVudCBoYW5kbGVyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnQgLSBGb3VuZGF0aW9uIGNvbXBvbmVudCdzIG5hbWUsIGUuZy4gU2xpZGVyIG9yIFJldmVhbFxuICAgKiBAcGFyYW0ge09iamVjdHN9IGZ1bmN0aW9ucyAtIGNvbGxlY3Rpb24gb2YgZnVuY3Rpb25zIHRoYXQgYXJlIHRvIGJlIGV4ZWN1dGVkXG4gICAqL1xuICBoYW5kbGVLZXkoZXZlbnQsIGNvbXBvbmVudCwgZnVuY3Rpb25zKSB7XG4gICAgdmFyIGNvbW1hbmRMaXN0ID0gY29tbWFuZHNbY29tcG9uZW50XSxcbiAgICAgIGtleUNvZGUgPSB0aGlzLnBhcnNlS2V5KGV2ZW50KSxcbiAgICAgIGNtZHMsXG4gICAgICBjb21tYW5kLFxuICAgICAgZm47XG5cbiAgICBpZiAoIWNvbW1hbmRMaXN0KSByZXR1cm4gY29uc29sZS53YXJuKCdDb21wb25lbnQgbm90IGRlZmluZWQhJyk7XG5cbiAgICBpZiAodHlwZW9mIGNvbW1hbmRMaXN0Lmx0ciA9PT0gJ3VuZGVmaW5lZCcpIHsgLy8gdGhpcyBjb21wb25lbnQgZG9lcyBub3QgZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIGx0ciBhbmQgcnRsXG4gICAgICAgIGNtZHMgPSBjb21tYW5kTGlzdDsgLy8gdXNlIHBsYWluIGxpc3RcbiAgICB9IGVsc2UgeyAvLyBtZXJnZSBsdHIgYW5kIHJ0bDogaWYgZG9jdW1lbnQgaXMgcnRsLCBydGwgb3ZlcndyaXRlcyBsdHIgYW5kIHZpY2UgdmVyc2FcbiAgICAgICAgaWYgKEZvdW5kYXRpb24ucnRsKCkpIGNtZHMgPSAkLmV4dGVuZCh7fSwgY29tbWFuZExpc3QubHRyLCBjb21tYW5kTGlzdC5ydGwpO1xuXG4gICAgICAgIGVsc2UgY21kcyA9ICQuZXh0ZW5kKHt9LCBjb21tYW5kTGlzdC5ydGwsIGNvbW1hbmRMaXN0Lmx0cik7XG4gICAgfVxuICAgIGNvbW1hbmQgPSBjbWRzW2tleUNvZGVdO1xuXG4gICAgZm4gPSBmdW5jdGlvbnNbY29tbWFuZF07XG4gICAgaWYgKGZuICYmIHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uICBpZiBleGlzdHNcbiAgICAgIHZhciByZXR1cm5WYWx1ZSA9IGZuLmFwcGx5KCk7XG4gICAgICBpZiAoZnVuY3Rpb25zLmhhbmRsZWQgfHwgdHlwZW9mIGZ1bmN0aW9ucy5oYW5kbGVkID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gd2hlbiBldmVudCB3YXMgaGFuZGxlZFxuICAgICAgICAgIGZ1bmN0aW9ucy5oYW5kbGVkKHJldHVyblZhbHVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGZ1bmN0aW9ucy51bmhhbmRsZWQgfHwgdHlwZW9mIGZ1bmN0aW9ucy51bmhhbmRsZWQgPT09ICdmdW5jdGlvbicpIHsgLy8gZXhlY3V0ZSBmdW5jdGlvbiB3aGVuIGV2ZW50IHdhcyBub3QgaGFuZGxlZFxuICAgICAgICAgIGZ1bmN0aW9ucy51bmhhbmRsZWQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEZpbmRzIGFsbCBmb2N1c2FibGUgZWxlbWVudHMgd2l0aGluIHRoZSBnaXZlbiBgJGVsZW1lbnRgXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gc2VhcmNoIHdpdGhpblxuICAgKiBAcmV0dXJuIHtqUXVlcnl9ICRmb2N1c2FibGUgLSBhbGwgZm9jdXNhYmxlIGVsZW1lbnRzIHdpdGhpbiBgJGVsZW1lbnRgXG4gICAqL1xuICBmaW5kRm9jdXNhYmxlKCRlbGVtZW50KSB7XG4gICAgcmV0dXJuICRlbGVtZW50LmZpbmQoJ2FbaHJlZl0sIGFyZWFbaHJlZl0sIGlucHV0Om5vdChbZGlzYWJsZWRdKSwgc2VsZWN0Om5vdChbZGlzYWJsZWRdKSwgdGV4dGFyZWE6bm90KFtkaXNhYmxlZF0pLCBidXR0b246bm90KFtkaXNhYmxlZF0pLCBpZnJhbWUsIG9iamVjdCwgZW1iZWQsICpbdGFiaW5kZXhdLCAqW2NvbnRlbnRlZGl0YWJsZV0nKS5maWx0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoISQodGhpcykuaXMoJzp2aXNpYmxlJykgfHwgJCh0aGlzKS5hdHRyKCd0YWJpbmRleCcpIDwgMCkgeyByZXR1cm4gZmFsc2U7IH0gLy9vbmx5IGhhdmUgdmlzaWJsZSBlbGVtZW50cyBhbmQgdGhvc2UgdGhhdCBoYXZlIGEgdGFiaW5kZXggZ3JlYXRlciBvciBlcXVhbCAwXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY29tcG9uZW50IG5hbWUgbmFtZVxuICAgKiBAcGFyYW0ge09iamVjdH0gY29tcG9uZW50IC0gRm91bmRhdGlvbiBjb21wb25lbnQsIGUuZy4gU2xpZGVyIG9yIFJldmVhbFxuICAgKiBAcmV0dXJuIFN0cmluZyBjb21wb25lbnROYW1lXG4gICAqL1xuXG4gIHJlZ2lzdGVyKGNvbXBvbmVudE5hbWUsIGNtZHMpIHtcbiAgICBjb21tYW5kc1tjb21wb25lbnROYW1lXSA9IGNtZHM7XG4gIH1cbn1cblxuLypcbiAqIENvbnN0YW50cyBmb3IgZWFzaWVyIGNvbXBhcmluZy5cbiAqIENhbiBiZSB1c2VkIGxpa2UgRm91bmRhdGlvbi5wYXJzZUtleShldmVudCkgPT09IEZvdW5kYXRpb24ua2V5cy5TUEFDRVxuICovXG5mdW5jdGlvbiBnZXRLZXlDb2RlcyhrY3MpIHtcbiAgdmFyIGsgPSB7fTtcbiAgZm9yICh2YXIga2MgaW4ga2NzKSBrW2tjc1trY11dID0ga2NzW2tjXTtcbiAgcmV0dXJuIGs7XG59XG5cbkZvdW5kYXRpb24uS2V5Ym9hcmQgPSBLZXlib2FyZDtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vLyBEZWZhdWx0IHNldCBvZiBtZWRpYSBxdWVyaWVzXG5jb25zdCBkZWZhdWx0UXVlcmllcyA9IHtcbiAgJ2RlZmF1bHQnIDogJ29ubHkgc2NyZWVuJyxcbiAgbGFuZHNjYXBlIDogJ29ubHkgc2NyZWVuIGFuZCAob3JpZW50YXRpb246IGxhbmRzY2FwZSknLFxuICBwb3J0cmFpdCA6ICdvbmx5IHNjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBwb3J0cmFpdCknLFxuICByZXRpbmEgOiAnb25seSBzY3JlZW4gYW5kICgtd2Via2l0LW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi0tbW96LWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAoLW8tbWluLWRldmljZS1waXhlbC1yYXRpbzogMi8xKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMTkyZHBpKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMmRwcHgpJ1xufTtcblxudmFyIE1lZGlhUXVlcnkgPSB7XG4gIHF1ZXJpZXM6IFtdLFxuXG4gIGN1cnJlbnQ6ICcnLFxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgbWVkaWEgcXVlcnkgaGVscGVyLCBieSBleHRyYWN0aW5nIHRoZSBicmVha3BvaW50IGxpc3QgZnJvbSB0aGUgQ1NTIGFuZCBhY3RpdmF0aW5nIHRoZSBicmVha3BvaW50IHdhdGNoZXIuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBleHRyYWN0ZWRTdHlsZXMgPSAkKCcuZm91bmRhdGlvbi1tcScpLmNzcygnZm9udC1mYW1pbHknKTtcbiAgICB2YXIgbmFtZWRRdWVyaWVzO1xuXG4gICAgbmFtZWRRdWVyaWVzID0gcGFyc2VTdHlsZVRvT2JqZWN0KGV4dHJhY3RlZFN0eWxlcyk7XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gbmFtZWRRdWVyaWVzKSB7XG4gICAgICBpZihuYW1lZFF1ZXJpZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBzZWxmLnF1ZXJpZXMucHVzaCh7XG4gICAgICAgICAgbmFtZToga2V5LFxuICAgICAgICAgIHZhbHVlOiBgb25seSBzY3JlZW4gYW5kIChtaW4td2lkdGg6ICR7bmFtZWRRdWVyaWVzW2tleV19KWBcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50ID0gdGhpcy5fZ2V0Q3VycmVudFNpemUoKTtcblxuICAgIHRoaXMuX3dhdGNoZXIoKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBzY3JlZW4gaXMgYXQgbGVhc3QgYXMgd2lkZSBhcyBhIGJyZWFrcG9pbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2l6ZSAtIE5hbWUgb2YgdGhlIGJyZWFrcG9pbnQgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGJyZWFrcG9pbnQgbWF0Y2hlcywgYGZhbHNlYCBpZiBpdCdzIHNtYWxsZXIuXG4gICAqL1xuICBhdExlYXN0KHNpemUpIHtcbiAgICB2YXIgcXVlcnkgPSB0aGlzLmdldChzaXplKTtcblxuICAgIGlmIChxdWVyeSkge1xuICAgICAgcmV0dXJuIHdpbmRvdy5tYXRjaE1lZGlhKHF1ZXJ5KS5tYXRjaGVzO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0cyB0aGUgbWVkaWEgcXVlcnkgb2YgYSBicmVha3BvaW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpemUgLSBOYW1lIG9mIHRoZSBicmVha3BvaW50IHRvIGdldC5cbiAgICogQHJldHVybnMge1N0cmluZ3xudWxsfSAtIFRoZSBtZWRpYSBxdWVyeSBvZiB0aGUgYnJlYWtwb2ludCwgb3IgYG51bGxgIGlmIHRoZSBicmVha3BvaW50IGRvZXNuJ3QgZXhpc3QuXG4gICAqL1xuICBnZXQoc2l6ZSkge1xuICAgIGZvciAodmFyIGkgaW4gdGhpcy5xdWVyaWVzKSB7XG4gICAgICBpZih0aGlzLnF1ZXJpZXMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW2ldO1xuICAgICAgICBpZiAoc2l6ZSA9PT0gcXVlcnkubmFtZSkgcmV0dXJuIHF1ZXJ5LnZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IGJyZWFrcG9pbnQgbmFtZSBieSB0ZXN0aW5nIGV2ZXJ5IGJyZWFrcG9pbnQgYW5kIHJldHVybmluZyB0aGUgbGFzdCBvbmUgdG8gbWF0Y2ggKHRoZSBiaWdnZXN0IG9uZSkuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSBOYW1lIG9mIHRoZSBjdXJyZW50IGJyZWFrcG9pbnQuXG4gICAqL1xuICBfZ2V0Q3VycmVudFNpemUoKSB7XG4gICAgdmFyIG1hdGNoZWQ7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW2ldO1xuXG4gICAgICBpZiAod2luZG93Lm1hdGNoTWVkaWEocXVlcnkudmFsdWUpLm1hdGNoZXMpIHtcbiAgICAgICAgbWF0Y2hlZCA9IHF1ZXJ5O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbWF0Y2hlZCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHJldHVybiBtYXRjaGVkLm5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBtYXRjaGVkO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQWN0aXZhdGVzIHRoZSBicmVha3BvaW50IHdhdGNoZXIsIHdoaWNoIGZpcmVzIGFuIGV2ZW50IG9uIHRoZSB3aW5kb3cgd2hlbmV2ZXIgdGhlIGJyZWFrcG9pbnQgY2hhbmdlcy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfd2F0Y2hlcigpIHtcbiAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZS56Zi5tZWRpYXF1ZXJ5JywgKCkgPT4ge1xuICAgICAgdmFyIG5ld1NpemUgPSB0aGlzLl9nZXRDdXJyZW50U2l6ZSgpLCBjdXJyZW50U2l6ZSA9IHRoaXMuY3VycmVudDtcblxuICAgICAgaWYgKG5ld1NpemUgIT09IGN1cnJlbnRTaXplKSB7XG4gICAgICAgIC8vIENoYW5nZSB0aGUgY3VycmVudCBtZWRpYSBxdWVyeVxuICAgICAgICB0aGlzLmN1cnJlbnQgPSBuZXdTaXplO1xuXG4gICAgICAgIC8vIEJyb2FkY2FzdCB0aGUgbWVkaWEgcXVlcnkgY2hhbmdlIG9uIHRoZSB3aW5kb3dcbiAgICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIFtuZXdTaXplLCBjdXJyZW50U2l6ZV0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59O1xuXG5Gb3VuZGF0aW9uLk1lZGlhUXVlcnkgPSBNZWRpYVF1ZXJ5O1xuXG4vLyBtYXRjaE1lZGlhKCkgcG9seWZpbGwgLSBUZXN0IGEgQ1NTIG1lZGlhIHR5cGUvcXVlcnkgaW4gSlMuXG4vLyBBdXRob3JzICYgY29weXJpZ2h0IChjKSAyMDEyOiBTY290dCBKZWhsLCBQYXVsIElyaXNoLCBOaWNob2xhcyBaYWthcywgRGF2aWQgS25pZ2h0LiBEdWFsIE1JVC9CU0QgbGljZW5zZVxud2luZG93Lm1hdGNoTWVkaWEgfHwgKHdpbmRvdy5tYXRjaE1lZGlhID0gZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBGb3IgYnJvd3NlcnMgdGhhdCBzdXBwb3J0IG1hdGNoTWVkaXVtIGFwaSBzdWNoIGFzIElFIDkgYW5kIHdlYmtpdFxuICB2YXIgc3R5bGVNZWRpYSA9ICh3aW5kb3cuc3R5bGVNZWRpYSB8fCB3aW5kb3cubWVkaWEpO1xuXG4gIC8vIEZvciB0aG9zZSB0aGF0IGRvbid0IHN1cHBvcnQgbWF0Y2hNZWRpdW1cbiAgaWYgKCFzdHlsZU1lZGlhKSB7XG4gICAgdmFyIHN0eWxlICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpLFxuICAgIHNjcmlwdCAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpWzBdLFxuICAgIGluZm8gICAgICAgID0gbnVsbDtcblxuICAgIHN0eWxlLnR5cGUgID0gJ3RleHQvY3NzJztcbiAgICBzdHlsZS5pZCAgICA9ICdtYXRjaG1lZGlhanMtdGVzdCc7XG5cbiAgICBzY3JpcHQgJiYgc2NyaXB0LnBhcmVudE5vZGUgJiYgc2NyaXB0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHN0eWxlLCBzY3JpcHQpO1xuXG4gICAgLy8gJ3N0eWxlLmN1cnJlbnRTdHlsZScgaXMgdXNlZCBieSBJRSA8PSA4IGFuZCAnd2luZG93LmdldENvbXB1dGVkU3R5bGUnIGZvciBhbGwgb3RoZXIgYnJvd3NlcnNcbiAgICBpbmZvID0gKCdnZXRDb21wdXRlZFN0eWxlJyBpbiB3aW5kb3cpICYmIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHN0eWxlLCBudWxsKSB8fCBzdHlsZS5jdXJyZW50U3R5bGU7XG5cbiAgICBzdHlsZU1lZGlhID0ge1xuICAgICAgbWF0Y2hNZWRpdW0obWVkaWEpIHtcbiAgICAgICAgdmFyIHRleHQgPSBgQG1lZGlhICR7bWVkaWF9eyAjbWF0Y2htZWRpYWpzLXRlc3QgeyB3aWR0aDogMXB4OyB9IH1gO1xuXG4gICAgICAgIC8vICdzdHlsZS5zdHlsZVNoZWV0JyBpcyB1c2VkIGJ5IElFIDw9IDggYW5kICdzdHlsZS50ZXh0Q29udGVudCcgZm9yIGFsbCBvdGhlciBicm93c2Vyc1xuICAgICAgICBpZiAoc3R5bGUuc3R5bGVTaGVldCkge1xuICAgICAgICAgIHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IHRleHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGVzdCBpZiBtZWRpYSBxdWVyeSBpcyB0cnVlIG9yIGZhbHNlXG4gICAgICAgIHJldHVybiBpbmZvLndpZHRoID09PSAnMXB4JztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24obWVkaWEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbWF0Y2hlczogc3R5bGVNZWRpYS5tYXRjaE1lZGl1bShtZWRpYSB8fCAnYWxsJyksXG4gICAgICBtZWRpYTogbWVkaWEgfHwgJ2FsbCdcbiAgICB9O1xuICB9XG59KCkpO1xuXG4vLyBUaGFuayB5b3U6IGh0dHBzOi8vZ2l0aHViLmNvbS9zaW5kcmVzb3JodXMvcXVlcnktc3RyaW5nXG5mdW5jdGlvbiBwYXJzZVN0eWxlVG9PYmplY3Qoc3RyKSB7XG4gIHZhciBzdHlsZU9iamVjdCA9IHt9O1xuXG4gIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBzdHlsZU9iamVjdDtcbiAgfVxuXG4gIHN0ciA9IHN0ci50cmltKCkuc2xpY2UoMSwgLTEpOyAvLyBicm93c2VycyByZS1xdW90ZSBzdHJpbmcgc3R5bGUgdmFsdWVzXG5cbiAgaWYgKCFzdHIpIHtcbiAgICByZXR1cm4gc3R5bGVPYmplY3Q7XG4gIH1cblxuICBzdHlsZU9iamVjdCA9IHN0ci5zcGxpdCgnJicpLnJlZHVjZShmdW5jdGlvbihyZXQsIHBhcmFtKSB7XG4gICAgdmFyIHBhcnRzID0gcGFyYW0ucmVwbGFjZSgvXFwrL2csICcgJykuc3BsaXQoJz0nKTtcbiAgICB2YXIga2V5ID0gcGFydHNbMF07XG4gICAgdmFyIHZhbCA9IHBhcnRzWzFdO1xuICAgIGtleSA9IGRlY29kZVVSSUNvbXBvbmVudChrZXkpO1xuXG4gICAgLy8gbWlzc2luZyBgPWAgc2hvdWxkIGJlIGBudWxsYDpcbiAgICAvLyBodHRwOi8vdzMub3JnL1RSLzIwMTIvV0QtdXJsLTIwMTIwNTI0LyNjb2xsZWN0LXVybC1wYXJhbWV0ZXJzXG4gICAgdmFsID0gdmFsID09PSB1bmRlZmluZWQgPyBudWxsIDogZGVjb2RlVVJJQ29tcG9uZW50KHZhbCk7XG5cbiAgICBpZiAoIXJldC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICByZXRba2V5XSA9IHZhbDtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocmV0W2tleV0pKSB7XG4gICAgICByZXRba2V5XS5wdXNoKHZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldFtrZXldID0gW3JldFtrZXldLCB2YWxdO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9LCB7fSk7XG5cbiAgcmV0dXJuIHN0eWxlT2JqZWN0O1xufVxuXG5Gb3VuZGF0aW9uLk1lZGlhUXVlcnkgPSBNZWRpYVF1ZXJ5O1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogTW90aW9uIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5tb3Rpb25cbiAqL1xuXG5jb25zdCBpbml0Q2xhc3NlcyAgID0gWydtdWktZW50ZXInLCAnbXVpLWxlYXZlJ107XG5jb25zdCBhY3RpdmVDbGFzc2VzID0gWydtdWktZW50ZXItYWN0aXZlJywgJ211aS1sZWF2ZS1hY3RpdmUnXTtcblxuY29uc3QgTW90aW9uID0ge1xuICBhbmltYXRlSW46IGZ1bmN0aW9uKGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcbiAgICBhbmltYXRlKHRydWUsIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpO1xuICB9LFxuXG4gIGFuaW1hdGVPdXQ6IGZ1bmN0aW9uKGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcbiAgICBhbmltYXRlKGZhbHNlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBNb3ZlKGR1cmF0aW9uLCBlbGVtLCBmbil7XG4gIHZhciBhbmltLCBwcm9nLCBzdGFydCA9IG51bGw7XG4gIC8vIGNvbnNvbGUubG9nKCdjYWxsZWQnKTtcblxuICBmdW5jdGlvbiBtb3ZlKHRzKXtcbiAgICBpZighc3RhcnQpIHN0YXJ0ID0gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xuICAgIC8vIGNvbnNvbGUubG9nKHN0YXJ0LCB0cyk7XG4gICAgcHJvZyA9IHRzIC0gc3RhcnQ7XG4gICAgZm4uYXBwbHkoZWxlbSk7XG5cbiAgICBpZihwcm9nIDwgZHVyYXRpb24peyBhbmltID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShtb3ZlLCBlbGVtKTsgfVxuICAgIGVsc2V7XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUoYW5pbSk7XG4gICAgICBlbGVtLnRyaWdnZXIoJ2ZpbmlzaGVkLnpmLmFuaW1hdGUnLCBbZWxlbV0pLnRyaWdnZXJIYW5kbGVyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKTtcbiAgICB9XG4gIH1cbiAgYW5pbSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobW92ZSk7XG59XG5cbi8qKlxuICogQW5pbWF0ZXMgYW4gZWxlbWVudCBpbiBvciBvdXQgdXNpbmcgYSBDU1MgdHJhbnNpdGlvbiBjbGFzcy5cbiAqIEBmdW5jdGlvblxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNJbiAtIERlZmluZXMgaWYgdGhlIGFuaW1hdGlvbiBpcyBpbiBvciBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvciBIVE1MIG9iamVjdCB0byBhbmltYXRlLlxuICogQHBhcmFtIHtTdHJpbmd9IGFuaW1hdGlvbiAtIENTUyBjbGFzcyB0byB1c2UuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIENhbGxiYWNrIHRvIHJ1biB3aGVuIGFuaW1hdGlvbiBpcyBmaW5pc2hlZC5cbiAqL1xuZnVuY3Rpb24gYW5pbWF0ZShpc0luLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gIGVsZW1lbnQgPSAkKGVsZW1lbnQpLmVxKDApO1xuXG4gIGlmICghZWxlbWVudC5sZW5ndGgpIHJldHVybjtcblxuICB2YXIgaW5pdENsYXNzID0gaXNJbiA/IGluaXRDbGFzc2VzWzBdIDogaW5pdENsYXNzZXNbMV07XG4gIHZhciBhY3RpdmVDbGFzcyA9IGlzSW4gPyBhY3RpdmVDbGFzc2VzWzBdIDogYWN0aXZlQ2xhc3Nlc1sxXTtcblxuICAvLyBTZXQgdXAgdGhlIGFuaW1hdGlvblxuICByZXNldCgpO1xuXG4gIGVsZW1lbnRcbiAgICAuYWRkQ2xhc3MoYW5pbWF0aW9uKVxuICAgIC5jc3MoJ3RyYW5zaXRpb24nLCAnbm9uZScpO1xuXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgZWxlbWVudC5hZGRDbGFzcyhpbml0Q2xhc3MpO1xuICAgIGlmIChpc0luKSBlbGVtZW50LnNob3coKTtcbiAgfSk7XG5cbiAgLy8gU3RhcnQgdGhlIGFuaW1hdGlvblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIGVsZW1lbnRbMF0ub2Zmc2V0V2lkdGg7XG4gICAgZWxlbWVudFxuICAgICAgLmNzcygndHJhbnNpdGlvbicsICcnKVxuICAgICAgLmFkZENsYXNzKGFjdGl2ZUNsYXNzKTtcbiAgfSk7XG5cbiAgLy8gQ2xlYW4gdXAgdGhlIGFuaW1hdGlvbiB3aGVuIGl0IGZpbmlzaGVzXG4gIGVsZW1lbnQub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZChlbGVtZW50KSwgZmluaXNoKTtcblxuICAvLyBIaWRlcyB0aGUgZWxlbWVudCAoZm9yIG91dCBhbmltYXRpb25zKSwgcmVzZXRzIHRoZSBlbGVtZW50LCBhbmQgcnVucyBhIGNhbGxiYWNrXG4gIGZ1bmN0aW9uIGZpbmlzaCgpIHtcbiAgICBpZiAoIWlzSW4pIGVsZW1lbnQuaGlkZSgpO1xuICAgIHJlc2V0KCk7XG4gICAgaWYgKGNiKSBjYi5hcHBseShlbGVtZW50KTtcbiAgfVxuXG4gIC8vIFJlc2V0cyB0cmFuc2l0aW9ucyBhbmQgcmVtb3ZlcyBtb3Rpb24tc3BlY2lmaWMgY2xhc3Nlc1xuICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICBlbGVtZW50WzBdLnN0eWxlLnRyYW5zaXRpb25EdXJhdGlvbiA9IDA7XG4gICAgZWxlbWVudC5yZW1vdmVDbGFzcyhgJHtpbml0Q2xhc3N9ICR7YWN0aXZlQ2xhc3N9ICR7YW5pbWF0aW9ufWApO1xuICB9XG59XG5cbkZvdW5kYXRpb24uTW92ZSA9IE1vdmU7XG5Gb3VuZGF0aW9uLk1vdGlvbiA9IE1vdGlvbjtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5jb25zdCBOZXN0ID0ge1xuICBGZWF0aGVyKG1lbnUsIHR5cGUgPSAnemYnKSB7XG4gICAgbWVudS5hdHRyKCdyb2xlJywgJ21lbnViYXInKTtcblxuICAgIHZhciBpdGVtcyA9IG1lbnUuZmluZCgnbGknKS5hdHRyKHsncm9sZSc6ICdtZW51aXRlbSd9KSxcbiAgICAgICAgc3ViTWVudUNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudWAsXG4gICAgICAgIHN1Ykl0ZW1DbGFzcyA9IGAke3N1Yk1lbnVDbGFzc30taXRlbWAsXG4gICAgICAgIGhhc1N1YkNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudS1wYXJlbnRgO1xuXG4gICAgbWVudS5maW5kKCdhOmZpcnN0JykuYXR0cigndGFiaW5kZXgnLCAwKTtcblxuICAgIGl0ZW1zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJGl0ZW0gPSAkKHRoaXMpLFxuICAgICAgICAgICRzdWIgPSAkaXRlbS5jaGlsZHJlbigndWwnKTtcblxuICAgICAgaWYgKCRzdWIubGVuZ3RoKSB7XG4gICAgICAgICRpdGVtXG4gICAgICAgICAgLmFkZENsYXNzKGhhc1N1YkNsYXNzKVxuICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICdhcmlhLWhhc3BvcHVwJzogdHJ1ZSxcbiAgICAgICAgICAgICdhcmlhLWV4cGFuZGVkJzogZmFsc2UsXG4gICAgICAgICAgICAnYXJpYS1sYWJlbCc6ICRpdGVtLmNoaWxkcmVuKCdhOmZpcnN0JykudGV4dCgpXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgJHN1YlxuICAgICAgICAgIC5hZGRDbGFzcyhgc3VibWVudSAke3N1Yk1lbnVDbGFzc31gKVxuICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICdkYXRhLXN1Ym1lbnUnOiAnJyxcbiAgICAgICAgICAgICdhcmlhLWhpZGRlbic6IHRydWUsXG4gICAgICAgICAgICAncm9sZSc6ICdtZW51J1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoJGl0ZW0ucGFyZW50KCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCkge1xuICAgICAgICAkaXRlbS5hZGRDbGFzcyhgaXMtc3VibWVudS1pdGVtICR7c3ViSXRlbUNsYXNzfWApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuO1xuICB9LFxuXG4gIEJ1cm4obWVudSwgdHlwZSkge1xuICAgIHZhciBpdGVtcyA9IG1lbnUuZmluZCgnbGknKS5yZW1vdmVBdHRyKCd0YWJpbmRleCcpLFxuICAgICAgICBzdWJNZW51Q2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51YCxcbiAgICAgICAgc3ViSXRlbUNsYXNzID0gYCR7c3ViTWVudUNsYXNzfS1pdGVtYCxcbiAgICAgICAgaGFzU3ViQ2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51LXBhcmVudGA7XG5cbiAgICBtZW51XG4gICAgICAuZmluZCgnPmxpLCAubWVudSwgLm1lbnUgPiBsaScpXG4gICAgICAucmVtb3ZlQ2xhc3MoYCR7c3ViTWVudUNsYXNzfSAke3N1Ykl0ZW1DbGFzc30gJHtoYXNTdWJDbGFzc30gaXMtc3VibWVudS1pdGVtIHN1Ym1lbnUgaXMtYWN0aXZlYClcbiAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyggICAgICBtZW51LmZpbmQoJy4nICsgc3ViTWVudUNsYXNzICsgJywgLicgKyBzdWJJdGVtQ2xhc3MgKyAnLCAuaGFzLXN1Ym1lbnUsIC5pcy1zdWJtZW51LWl0ZW0sIC5zdWJtZW51LCBbZGF0YS1zdWJtZW51XScpXG4gICAgLy8gICAgICAgICAgIC5yZW1vdmVDbGFzcyhzdWJNZW51Q2xhc3MgKyAnICcgKyBzdWJJdGVtQ2xhc3MgKyAnIGhhcy1zdWJtZW51IGlzLXN1Ym1lbnUtaXRlbSBzdWJtZW51JylcbiAgICAvLyAgICAgICAgICAgLnJlbW92ZUF0dHIoJ2RhdGEtc3VibWVudScpKTtcbiAgICAvLyBpdGVtcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgLy8gICB2YXIgJGl0ZW0gPSAkKHRoaXMpLFxuICAgIC8vICAgICAgICRzdWIgPSAkaXRlbS5jaGlsZHJlbigndWwnKTtcbiAgICAvLyAgIGlmKCRpdGVtLnBhcmVudCgnW2RhdGEtc3VibWVudV0nKS5sZW5ndGgpe1xuICAgIC8vICAgICAkaXRlbS5yZW1vdmVDbGFzcygnaXMtc3VibWVudS1pdGVtICcgKyBzdWJJdGVtQ2xhc3MpO1xuICAgIC8vICAgfVxuICAgIC8vICAgaWYoJHN1Yi5sZW5ndGgpe1xuICAgIC8vICAgICAkaXRlbS5yZW1vdmVDbGFzcygnaGFzLXN1Ym1lbnUnKTtcbiAgICAvLyAgICAgJHN1Yi5yZW1vdmVDbGFzcygnc3VibWVudSAnICsgc3ViTWVudUNsYXNzKS5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKTtcbiAgICAvLyAgIH1cbiAgICAvLyB9KTtcbiAgfVxufVxuXG5Gb3VuZGF0aW9uLk5lc3QgPSBOZXN0O1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmZ1bmN0aW9uIFRpbWVyKGVsZW0sIG9wdGlvbnMsIGNiKSB7XG4gIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICBkdXJhdGlvbiA9IG9wdGlvbnMuZHVyYXRpb24sLy9vcHRpb25zIGlzIGFuIG9iamVjdCBmb3IgZWFzaWx5IGFkZGluZyBmZWF0dXJlcyBsYXRlci5cbiAgICAgIG5hbWVTcGFjZSA9IE9iamVjdC5rZXlzKGVsZW0uZGF0YSgpKVswXSB8fCAndGltZXInLFxuICAgICAgcmVtYWluID0gLTEsXG4gICAgICBzdGFydCxcbiAgICAgIHRpbWVyO1xuXG4gIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcblxuICB0aGlzLnJlc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICByZW1haW4gPSAtMTtcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIHRoaXMuc3RhcnQoKTtcbiAgfVxuXG4gIHRoaXMuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XG4gICAgLy8gaWYoIWVsZW0uZGF0YSgncGF1c2VkJykpeyByZXR1cm4gZmFsc2U7IH0vL21heWJlIGltcGxlbWVudCB0aGlzIHNhbml0eSBjaGVjayBpZiB1c2VkIGZvciBvdGhlciB0aGluZ3MuXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICByZW1haW4gPSByZW1haW4gPD0gMCA/IGR1cmF0aW9uIDogcmVtYWluO1xuICAgIGVsZW0uZGF0YSgncGF1c2VkJywgZmFsc2UpO1xuICAgIHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIGlmKG9wdGlvbnMuaW5maW5pdGUpe1xuICAgICAgICBfdGhpcy5yZXN0YXJ0KCk7Ly9yZXJ1biB0aGUgdGltZXIuXG4gICAgICB9XG4gICAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7IGNiKCk7IH1cbiAgICB9LCByZW1haW4pO1xuICAgIGVsZW0udHJpZ2dlcihgdGltZXJzdGFydC56Zi4ke25hbWVTcGFjZX1gKTtcbiAgfVxuXG4gIHRoaXMucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcbiAgICAvL2lmKGVsZW0uZGF0YSgncGF1c2VkJykpeyByZXR1cm4gZmFsc2U7IH0vL21heWJlIGltcGxlbWVudCB0aGlzIHNhbml0eSBjaGVjayBpZiB1c2VkIGZvciBvdGhlciB0aGluZ3MuXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICBlbGVtLmRhdGEoJ3BhdXNlZCcsIHRydWUpO1xuICAgIHZhciBlbmQgPSBEYXRlLm5vdygpO1xuICAgIHJlbWFpbiA9IHJlbWFpbiAtIChlbmQgLSBzdGFydCk7XG4gICAgZWxlbS50cmlnZ2VyKGB0aW1lcnBhdXNlZC56Zi4ke25hbWVTcGFjZX1gKTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1bnMgYSBjYWxsYmFjayBmdW5jdGlvbiB3aGVuIGltYWdlcyBhcmUgZnVsbHkgbG9hZGVkLlxuICogQHBhcmFtIHtPYmplY3R9IGltYWdlcyAtIEltYWdlKHMpIHRvIGNoZWNrIGlmIGxvYWRlZC5cbiAqIEBwYXJhbSB7RnVuY30gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gaW1hZ2UgaXMgZnVsbHkgbG9hZGVkLlxuICovXG5mdW5jdGlvbiBvbkltYWdlc0xvYWRlZChpbWFnZXMsIGNhbGxiYWNrKXtcbiAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgdW5sb2FkZWQgPSBpbWFnZXMubGVuZ3RoO1xuXG4gIGlmICh1bmxvYWRlZCA9PT0gMCkge1xuICAgIGNhbGxiYWNrKCk7XG4gIH1cblxuICBpbWFnZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5jb21wbGV0ZSkge1xuICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHRoaXMubmF0dXJhbFdpZHRoICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLm5hdHVyYWxXaWR0aCA+IDApIHtcbiAgICAgIHNpbmdsZUltYWdlTG9hZGVkKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCh0aGlzKS5vbmUoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gc2luZ2xlSW1hZ2VMb2FkZWQoKSB7XG4gICAgdW5sb2FkZWQtLTtcbiAgICBpZiAodW5sb2FkZWQgPT09IDApIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG59XG5cbkZvdW5kYXRpb24uVGltZXIgPSBUaW1lcjtcbkZvdW5kYXRpb24ub25JbWFnZXNMb2FkZWQgPSBvbkltYWdlc0xvYWRlZDtcblxufShqUXVlcnkpO1xuIiwiLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKldvcmsgaW5zcGlyZWQgYnkgbXVsdGlwbGUganF1ZXJ5IHN3aXBlIHBsdWdpbnMqKlxuLy8qKkRvbmUgYnkgWW9oYWkgQXJhcmF0ICoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuKGZ1bmN0aW9uKCQpIHtcblxuICAkLnNwb3RTd2lwZSA9IHtcbiAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgIGVuYWJsZWQ6ICdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcbiAgICBwcmV2ZW50RGVmYXVsdDogZmFsc2UsXG4gICAgbW92ZVRocmVzaG9sZDogNzUsXG4gICAgdGltZVRocmVzaG9sZDogMjAwXG4gIH07XG5cbiAgdmFyICAgc3RhcnRQb3NYLFxuICAgICAgICBzdGFydFBvc1ksXG4gICAgICAgIHN0YXJ0VGltZSxcbiAgICAgICAgZWxhcHNlZFRpbWUsXG4gICAgICAgIGlzTW92aW5nID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gb25Ub3VjaEVuZCgpIHtcbiAgICAvLyAgYWxlcnQodGhpcyk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVG91Y2hFbmQpO1xuICAgIGlzTW92aW5nID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBvblRvdWNoTW92ZShlKSB7XG4gICAgaWYgKCQuc3BvdFN3aXBlLnByZXZlbnREZWZhdWx0KSB7IGUucHJldmVudERlZmF1bHQoKTsgfVxuICAgIGlmKGlzTW92aW5nKSB7XG4gICAgICB2YXIgeCA9IGUudG91Y2hlc1swXS5wYWdlWDtcbiAgICAgIHZhciB5ID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgdmFyIGR4ID0gc3RhcnRQb3NYIC0geDtcbiAgICAgIHZhciBkeSA9IHN0YXJ0UG9zWSAtIHk7XG4gICAgICB2YXIgZGlyO1xuICAgICAgZWxhcHNlZFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZTtcbiAgICAgIGlmKE1hdGguYWJzKGR4KSA+PSAkLnNwb3RTd2lwZS5tb3ZlVGhyZXNob2xkICYmIGVsYXBzZWRUaW1lIDw9ICQuc3BvdFN3aXBlLnRpbWVUaHJlc2hvbGQpIHtcbiAgICAgICAgZGlyID0gZHggPiAwID8gJ2xlZnQnIDogJ3JpZ2h0JztcbiAgICAgIH1cbiAgICAgIC8vIGVsc2UgaWYoTWF0aC5hYnMoZHkpID49ICQuc3BvdFN3aXBlLm1vdmVUaHJlc2hvbGQgJiYgZWxhcHNlZFRpbWUgPD0gJC5zcG90U3dpcGUudGltZVRocmVzaG9sZCkge1xuICAgICAgLy8gICBkaXIgPSBkeSA+IDAgPyAnZG93bicgOiAndXAnO1xuICAgICAgLy8gfVxuICAgICAgaWYoZGlyKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgb25Ub3VjaEVuZC5jYWxsKHRoaXMpO1xuICAgICAgICAkKHRoaXMpLnRyaWdnZXIoJ3N3aXBlJywgZGlyKS50cmlnZ2VyKGBzd2lwZSR7ZGlyfWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uVG91Y2hTdGFydChlKSB7XG4gICAgaWYgKGUudG91Y2hlcy5sZW5ndGggPT0gMSkge1xuICAgICAgc3RhcnRQb3NYID0gZS50b3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgc3RhcnRQb3NZID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgaXNNb3ZpbmcgPSB0cnVlO1xuICAgICAgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlLCBmYWxzZSk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVyICYmIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0KTtcbiAgfVxuXG4gICQuZXZlbnQuc3BlY2lhbC5zd2lwZSA9IHsgc2V0dXA6IGluaXQgfTtcblxuICAkLmVhY2goWydsZWZ0JywgJ3VwJywgJ2Rvd24nLCAncmlnaHQnXSwgZnVuY3Rpb24gKCkge1xuICAgICQuZXZlbnQuc3BlY2lhbFtgc3dpcGUke3RoaXN9YF0gPSB7IHNldHVwOiBmdW5jdGlvbigpe1xuICAgICAgJCh0aGlzKS5vbignc3dpcGUnLCAkLm5vb3ApO1xuICAgIH0gfTtcbiAgfSk7XG59KShqUXVlcnkpO1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1ldGhvZCBmb3IgYWRkaW5nIHBzdWVkbyBkcmFnIGV2ZW50cyB0byBlbGVtZW50cyAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuIWZ1bmN0aW9uKCQpe1xuICAkLmZuLmFkZFRvdWNoID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSxlbCl7XG4gICAgICAkKGVsKS5iaW5kKCd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCcsZnVuY3Rpb24oKXtcbiAgICAgICAgLy93ZSBwYXNzIHRoZSBvcmlnaW5hbCBldmVudCBvYmplY3QgYmVjYXVzZSB0aGUgalF1ZXJ5IGV2ZW50XG4gICAgICAgIC8vb2JqZWN0IGlzIG5vcm1hbGl6ZWQgdG8gdzNjIHNwZWNzIGFuZCBkb2VzIG5vdCBwcm92aWRlIHRoZSBUb3VjaExpc3RcbiAgICAgICAgaGFuZGxlVG91Y2goZXZlbnQpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGFuZGxlVG91Y2ggPSBmdW5jdGlvbihldmVudCl7XG4gICAgICB2YXIgdG91Y2hlcyA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzLFxuICAgICAgICAgIGZpcnN0ID0gdG91Y2hlc1swXSxcbiAgICAgICAgICBldmVudFR5cGVzID0ge1xuICAgICAgICAgICAgdG91Y2hzdGFydDogJ21vdXNlZG93bicsXG4gICAgICAgICAgICB0b3VjaG1vdmU6ICdtb3VzZW1vdmUnLFxuICAgICAgICAgICAgdG91Y2hlbmQ6ICdtb3VzZXVwJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdHlwZSA9IGV2ZW50VHlwZXNbZXZlbnQudHlwZV0sXG4gICAgICAgICAgc2ltdWxhdGVkRXZlbnRcbiAgICAgICAgO1xuXG4gICAgICBpZignTW91c2VFdmVudCcgaW4gd2luZG93ICYmIHR5cGVvZiB3aW5kb3cuTW91c2VFdmVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBzaW11bGF0ZWRFdmVudCA9IG5ldyB3aW5kb3cuTW91c2VFdmVudCh0eXBlLCB7XG4gICAgICAgICAgJ2J1YmJsZXMnOiB0cnVlLFxuICAgICAgICAgICdjYW5jZWxhYmxlJzogdHJ1ZSxcbiAgICAgICAgICAnc2NyZWVuWCc6IGZpcnN0LnNjcmVlblgsXG4gICAgICAgICAgJ3NjcmVlblknOiBmaXJzdC5zY3JlZW5ZLFxuICAgICAgICAgICdjbGllbnRYJzogZmlyc3QuY2xpZW50WCxcbiAgICAgICAgICAnY2xpZW50WSc6IGZpcnN0LmNsaWVudFlcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaW11bGF0ZWRFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50Jyk7XG4gICAgICAgIHNpbXVsYXRlZEV2ZW50LmluaXRNb3VzZUV2ZW50KHR5cGUsIHRydWUsIHRydWUsIHdpbmRvdywgMSwgZmlyc3Quc2NyZWVuWCwgZmlyc3Quc2NyZWVuWSwgZmlyc3QuY2xpZW50WCwgZmlyc3QuY2xpZW50WSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIDAvKmxlZnQqLywgbnVsbCk7XG4gICAgICB9XG4gICAgICBmaXJzdC50YXJnZXQuZGlzcGF0Y2hFdmVudChzaW11bGF0ZWRFdmVudCk7XG4gICAgfTtcbiAgfTtcbn0oalF1ZXJ5KTtcblxuXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8vKipGcm9tIHRoZSBqUXVlcnkgTW9iaWxlIExpYnJhcnkqKlxuLy8qKm5lZWQgdG8gcmVjcmVhdGUgZnVuY3Rpb25hbGl0eSoqXG4vLyoqYW5kIHRyeSB0byBpbXByb3ZlIGlmIHBvc3NpYmxlKipcbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4vKiBSZW1vdmluZyB0aGUgalF1ZXJ5IGZ1bmN0aW9uICoqKipcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4oZnVuY3Rpb24oICQsIHdpbmRvdywgdW5kZWZpbmVkICkge1xuXG5cdHZhciAkZG9jdW1lbnQgPSAkKCBkb2N1bWVudCApLFxuXHRcdC8vIHN1cHBvcnRUb3VjaCA9ICQubW9iaWxlLnN1cHBvcnQudG91Y2gsXG5cdFx0dG91Y2hTdGFydEV2ZW50ID0gJ3RvdWNoc3RhcnQnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNoc3RhcnRcIiA6IFwibW91c2Vkb3duXCIsXG5cdFx0dG91Y2hTdG9wRXZlbnQgPSAndG91Y2hlbmQnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNoZW5kXCIgOiBcIm1vdXNldXBcIixcblx0XHR0b3VjaE1vdmVFdmVudCA9ICd0b3VjaG1vdmUnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNobW92ZVwiIDogXCJtb3VzZW1vdmVcIjtcblxuXHQvLyBzZXR1cCBuZXcgZXZlbnQgc2hvcnRjdXRzXG5cdCQuZWFjaCggKCBcInRvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIFwiICtcblx0XHRcInN3aXBlIHN3aXBlbGVmdCBzd2lwZXJpZ2h0XCIgKS5zcGxpdCggXCIgXCIgKSwgZnVuY3Rpb24oIGksIG5hbWUgKSB7XG5cblx0XHQkLmZuWyBuYW1lIF0gPSBmdW5jdGlvbiggZm4gKSB7XG5cdFx0XHRyZXR1cm4gZm4gPyB0aGlzLmJpbmQoIG5hbWUsIGZuICkgOiB0aGlzLnRyaWdnZXIoIG5hbWUgKTtcblx0XHR9O1xuXG5cdFx0Ly8galF1ZXJ5IDwgMS44XG5cdFx0aWYgKCAkLmF0dHJGbiApIHtcblx0XHRcdCQuYXR0ckZuWyBuYW1lIF0gPSB0cnVlO1xuXHRcdH1cblx0fSk7XG5cblx0ZnVuY3Rpb24gdHJpZ2dlckN1c3RvbUV2ZW50KCBvYmosIGV2ZW50VHlwZSwgZXZlbnQsIGJ1YmJsZSApIHtcblx0XHR2YXIgb3JpZ2luYWxUeXBlID0gZXZlbnQudHlwZTtcblx0XHRldmVudC50eXBlID0gZXZlbnRUeXBlO1xuXHRcdGlmICggYnViYmxlICkge1xuXHRcdFx0JC5ldmVudC50cmlnZ2VyKCBldmVudCwgdW5kZWZpbmVkLCBvYmogKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0JC5ldmVudC5kaXNwYXRjaC5jYWxsKCBvYmosIGV2ZW50ICk7XG5cdFx0fVxuXHRcdGV2ZW50LnR5cGUgPSBvcmlnaW5hbFR5cGU7XG5cdH1cblxuXHQvLyBhbHNvIGhhbmRsZXMgdGFwaG9sZFxuXG5cdC8vIEFsc28gaGFuZGxlcyBzd2lwZWxlZnQsIHN3aXBlcmlnaHRcblx0JC5ldmVudC5zcGVjaWFsLnN3aXBlID0ge1xuXG5cdFx0Ly8gTW9yZSB0aGFuIHRoaXMgaG9yaXpvbnRhbCBkaXNwbGFjZW1lbnQsIGFuZCB3ZSB3aWxsIHN1cHByZXNzIHNjcm9sbGluZy5cblx0XHRzY3JvbGxTdXByZXNzaW9uVGhyZXNob2xkOiAzMCxcblxuXHRcdC8vIE1vcmUgdGltZSB0aGFuIHRoaXMsIGFuZCBpdCBpc24ndCBhIHN3aXBlLlxuXHRcdGR1cmF0aW9uVGhyZXNob2xkOiAxMDAwLFxuXG5cdFx0Ly8gU3dpcGUgaG9yaXpvbnRhbCBkaXNwbGFjZW1lbnQgbXVzdCBiZSBtb3JlIHRoYW4gdGhpcy5cblx0XHRob3Jpem9udGFsRGlzdGFuY2VUaHJlc2hvbGQ6IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID49IDIgPyAxNSA6IDMwLFxuXG5cdFx0Ly8gU3dpcGUgdmVydGljYWwgZGlzcGxhY2VtZW50IG11c3QgYmUgbGVzcyB0aGFuIHRoaXMuXG5cdFx0dmVydGljYWxEaXN0YW5jZVRocmVzaG9sZDogd2luZG93LmRldmljZVBpeGVsUmF0aW8gPj0gMiA/IDE1IDogMzAsXG5cblx0XHRnZXRMb2NhdGlvbjogZnVuY3Rpb24gKCBldmVudCApIHtcblx0XHRcdHZhciB3aW5QYWdlWCA9IHdpbmRvdy5wYWdlWE9mZnNldCxcblx0XHRcdFx0d2luUGFnZVkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXG5cdFx0XHRcdHggPSBldmVudC5jbGllbnRYLFxuXHRcdFx0XHR5ID0gZXZlbnQuY2xpZW50WTtcblxuXHRcdFx0aWYgKCBldmVudC5wYWdlWSA9PT0gMCAmJiBNYXRoLmZsb29yKCB5ICkgPiBNYXRoLmZsb29yKCBldmVudC5wYWdlWSApIHx8XG5cdFx0XHRcdGV2ZW50LnBhZ2VYID09PSAwICYmIE1hdGguZmxvb3IoIHggKSA+IE1hdGguZmxvb3IoIGV2ZW50LnBhZ2VYICkgKSB7XG5cblx0XHRcdFx0Ly8gaU9TNCBjbGllbnRYL2NsaWVudFkgaGF2ZSB0aGUgdmFsdWUgdGhhdCBzaG91bGQgaGF2ZSBiZWVuXG5cdFx0XHRcdC8vIGluIHBhZ2VYL3BhZ2VZLiBXaGlsZSBwYWdlWC9wYWdlLyBoYXZlIHRoZSB2YWx1ZSAwXG5cdFx0XHRcdHggPSB4IC0gd2luUGFnZVg7XG5cdFx0XHRcdHkgPSB5IC0gd2luUGFnZVk7XG5cdFx0XHR9IGVsc2UgaWYgKCB5IDwgKCBldmVudC5wYWdlWSAtIHdpblBhZ2VZKSB8fCB4IDwgKCBldmVudC5wYWdlWCAtIHdpblBhZ2VYICkgKSB7XG5cblx0XHRcdFx0Ly8gU29tZSBBbmRyb2lkIGJyb3dzZXJzIGhhdmUgdG90YWxseSBib2d1cyB2YWx1ZXMgZm9yIGNsaWVudFgvWVxuXHRcdFx0XHQvLyB3aGVuIHNjcm9sbGluZy96b29taW5nIGEgcGFnZS4gRGV0ZWN0YWJsZSBzaW5jZSBjbGllbnRYL2NsaWVudFlcblx0XHRcdFx0Ly8gc2hvdWxkIG5ldmVyIGJlIHNtYWxsZXIgdGhhbiBwYWdlWC9wYWdlWSBtaW51cyBwYWdlIHNjcm9sbFxuXHRcdFx0XHR4ID0gZXZlbnQucGFnZVggLSB3aW5QYWdlWDtcblx0XHRcdFx0eSA9IGV2ZW50LnBhZ2VZIC0gd2luUGFnZVk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHg6IHgsXG5cdFx0XHRcdHk6IHlcblx0XHRcdH07XG5cdFx0fSxcblxuXHRcdHN0YXJ0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHR2YXIgZGF0YSA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlcyA/XG5cdFx0XHRcdFx0ZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzWyAwIF0gOiBldmVudCxcblx0XHRcdFx0bG9jYXRpb24gPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZ2V0TG9jYXRpb24oIGRhdGEgKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHR0aW1lOiAoIG5ldyBEYXRlKCkgKS5nZXRUaW1lKCksXG5cdFx0XHRcdFx0XHRjb29yZHM6IFsgbG9jYXRpb24ueCwgbG9jYXRpb24ueSBdLFxuXHRcdFx0XHRcdFx0b3JpZ2luOiAkKCBldmVudC50YXJnZXQgKVxuXHRcdFx0XHRcdH07XG5cdFx0fSxcblxuXHRcdHN0b3A6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdHZhciBkYXRhID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzID9cblx0XHRcdFx0XHRldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbIDAgXSA6IGV2ZW50LFxuXHRcdFx0XHRsb2NhdGlvbiA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5nZXRMb2NhdGlvbiggZGF0YSApO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHRpbWU6ICggbmV3IERhdGUoKSApLmdldFRpbWUoKSxcblx0XHRcdFx0XHRcdGNvb3JkczogWyBsb2NhdGlvbi54LCBsb2NhdGlvbi55IF1cblx0XHRcdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRoYW5kbGVTd2lwZTogZnVuY3Rpb24oIHN0YXJ0LCBzdG9wLCB0aGlzT2JqZWN0LCBvcmlnVGFyZ2V0ICkge1xuXHRcdFx0aWYgKCBzdG9wLnRpbWUgLSBzdGFydC50aW1lIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLmR1cmF0aW9uVGhyZXNob2xkICYmXG5cdFx0XHRcdE1hdGguYWJzKCBzdGFydC5jb29yZHNbIDAgXSAtIHN0b3AuY29vcmRzWyAwIF0gKSA+ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ob3Jpem9udGFsRGlzdGFuY2VUaHJlc2hvbGQgJiZcblx0XHRcdFx0TWF0aC5hYnMoIHN0YXJ0LmNvb3Jkc1sgMSBdIC0gc3RvcC5jb29yZHNbIDEgXSApIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLnZlcnRpY2FsRGlzdGFuY2VUaHJlc2hvbGQgKSB7XG5cdFx0XHRcdHZhciBkaXJlY3Rpb24gPSBzdGFydC5jb29yZHNbMF0gPiBzdG9wLmNvb3Jkc1sgMCBdID8gXCJzd2lwZWxlZnRcIiA6IFwic3dpcGVyaWdodFwiO1xuXG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgXCJzd2lwZVwiLCAkLkV2ZW50KCBcInN3aXBlXCIsIHsgdGFyZ2V0OiBvcmlnVGFyZ2V0LCBzd2lwZXN0YXJ0OiBzdGFydCwgc3dpcGVzdG9wOiBzdG9wIH0pLCB0cnVlICk7XG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgZGlyZWN0aW9uLCQuRXZlbnQoIGRpcmVjdGlvbiwgeyB0YXJnZXQ6IG9yaWdUYXJnZXQsIHN3aXBlc3RhcnQ6IHN0YXJ0LCBzd2lwZXN0b3A6IHN0b3AgfSApLCB0cnVlICk7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0fSxcblxuXHRcdC8vIFRoaXMgc2VydmVzIGFzIGEgZmxhZyB0byBlbnN1cmUgdGhhdCBhdCBtb3N0IG9uZSBzd2lwZSBldmVudCBldmVudCBpc1xuXHRcdC8vIGluIHdvcmsgYXQgYW55IGdpdmVuIHRpbWVcblx0XHRldmVudEluUHJvZ3Jlc3M6IGZhbHNlLFxuXG5cdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGV2ZW50cyxcblx0XHRcdFx0dGhpc09iamVjdCA9IHRoaXMsXG5cdFx0XHRcdCR0aGlzID0gJCggdGhpc09iamVjdCApLFxuXHRcdFx0XHRjb250ZXh0ID0ge307XG5cblx0XHRcdC8vIFJldHJpZXZlIHRoZSBldmVudHMgZGF0YSBmb3IgdGhpcyBlbGVtZW50IGFuZCBhZGQgdGhlIHN3aXBlIGNvbnRleHRcblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdGlmICggIWV2ZW50cyApIHtcblx0XHRcdFx0ZXZlbnRzID0geyBsZW5ndGg6IDAgfTtcblx0XHRcdFx0JC5kYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiwgZXZlbnRzICk7XG5cdFx0XHR9XG5cdFx0XHRldmVudHMubGVuZ3RoKys7XG5cdFx0XHRldmVudHMuc3dpcGUgPSBjb250ZXh0O1xuXG5cdFx0XHRjb250ZXh0LnN0YXJ0ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuXG5cdFx0XHRcdC8vIEJhaWwgaWYgd2UncmUgYWxyZWFkeSB3b3JraW5nIG9uIGEgc3dpcGUgZXZlbnRcblx0XHRcdFx0aWYgKCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzICkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gdHJ1ZTtcblxuXHRcdFx0XHR2YXIgc3RvcCxcblx0XHRcdFx0XHRzdGFydCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdGFydCggZXZlbnQgKSxcblx0XHRcdFx0XHRvcmlnVGFyZ2V0ID0gZXZlbnQudGFyZ2V0LFxuXHRcdFx0XHRcdGVtaXR0ZWQgPSBmYWxzZTtcblxuXHRcdFx0XHRjb250ZXh0Lm1vdmUgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRcdFx0aWYgKCAhc3RhcnQgfHwgZXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkgKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c3RvcCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdG9wKCBldmVudCApO1xuXHRcdFx0XHRcdGlmICggIWVtaXR0ZWQgKSB7XG5cdFx0XHRcdFx0XHRlbWl0dGVkID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmhhbmRsZVN3aXBlKCBzdGFydCwgc3RvcCwgdGhpc09iamVjdCwgb3JpZ1RhcmdldCApO1xuXHRcdFx0XHRcdFx0aWYgKCBlbWl0dGVkICkge1xuXG5cdFx0XHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBjb250ZXh0IHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzd2lwZSBldmVudFxuXHRcdFx0XHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIHByZXZlbnQgc2Nyb2xsaW5nXG5cdFx0XHRcdFx0aWYgKCBNYXRoLmFicyggc3RhcnQuY29vcmRzWyAwIF0gLSBzdG9wLmNvb3Jkc1sgMCBdICkgPiAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuc2Nyb2xsU3VwcmVzc2lvblRocmVzaG9sZCApIHtcblx0XHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGNvbnRleHQuc3RvcCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0ZW1pdHRlZCA9IHRydWU7XG5cblx0XHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBjb250ZXh0IHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzd2lwZSBldmVudFxuXHRcdFx0XHRcdFx0JC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApO1xuXHRcdFx0XHRcdFx0Y29udGV4dC5tb3ZlID0gbnVsbDtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkZG9jdW1lbnQub24oIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKVxuXHRcdFx0XHRcdC5vbmUoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcblx0XHRcdH07XG5cdFx0XHQkdGhpcy5vbiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XG5cdFx0fSxcblxuXHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBldmVudHMsIGNvbnRleHQ7XG5cblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdGlmICggZXZlbnRzICkge1xuXHRcdFx0XHRjb250ZXh0ID0gZXZlbnRzLnN3aXBlO1xuXHRcdFx0XHRkZWxldGUgZXZlbnRzLnN3aXBlO1xuXHRcdFx0XHRldmVudHMubGVuZ3RoLS07XG5cdFx0XHRcdGlmICggZXZlbnRzLmxlbmd0aCA9PT0gMCApIHtcblx0XHRcdFx0XHQkLnJlbW92ZURhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKCBjb250ZXh0ICkge1xuXHRcdFx0XHRpZiAoIGNvbnRleHQuc3RhcnQgKSB7XG5cdFx0XHRcdFx0JCggdGhpcyApLm9mZiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCBjb250ZXh0Lm1vdmUgKSB7XG5cdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggY29udGV4dC5zdG9wICkge1xuXHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblx0JC5lYWNoKHtcblx0XHRzd2lwZWxlZnQ6IFwic3dpcGUubGVmdFwiLFxuXHRcdHN3aXBlcmlnaHQ6IFwic3dpcGUucmlnaHRcIlxuXHR9LCBmdW5jdGlvbiggZXZlbnQsIHNvdXJjZUV2ZW50ICkge1xuXG5cdFx0JC5ldmVudC5zcGVjaWFsWyBldmVudCBdID0ge1xuXHRcdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkKCB0aGlzICkuYmluZCggc291cmNlRXZlbnQsICQubm9vcCApO1xuXHRcdFx0fSxcblx0XHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0JCggdGhpcyApLnVuYmluZCggc291cmNlRXZlbnQgKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9KTtcbn0pKCBqUXVlcnksIHRoaXMgKTtcbiovXG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmNvbnN0IE11dGF0aW9uT2JzZXJ2ZXIgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgcHJlZml4ZXMgPSBbJ1dlYktpdCcsICdNb3onLCAnTycsICdNcycsICcnXTtcbiAgZm9yICh2YXIgaT0wOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoYCR7cHJlZml4ZXNbaV19TXV0YXRpb25PYnNlcnZlcmAgaW4gd2luZG93KSB7XG4gICAgICByZXR1cm4gd2luZG93W2Ake3ByZWZpeGVzW2ldfU11dGF0aW9uT2JzZXJ2ZXJgXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufSgpKTtcblxuY29uc3QgdHJpZ2dlcnMgPSAoZWwsIHR5cGUpID0+IHtcbiAgZWwuZGF0YSh0eXBlKS5zcGxpdCgnICcpLmZvckVhY2goaWQgPT4ge1xuICAgICQoYCMke2lkfWApWyB0eXBlID09PSAnY2xvc2UnID8gJ3RyaWdnZXInIDogJ3RyaWdnZXJIYW5kbGVyJ10oYCR7dHlwZX0uemYudHJpZ2dlcmAsIFtlbF0pO1xuICB9KTtcbn07XG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLW9wZW5dIHdpbGwgcmV2ZWFsIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtb3Blbl0nLCBmdW5jdGlvbigpIHtcbiAgdHJpZ2dlcnMoJCh0aGlzKSwgJ29wZW4nKTtcbn0pO1xuXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLWNsb3NlXSB3aWxsIGNsb3NlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuLy8gSWYgdXNlZCB3aXRob3V0IGEgdmFsdWUgb24gW2RhdGEtY2xvc2VdLCB0aGUgZXZlbnQgd2lsbCBidWJibGUsIGFsbG93aW5nIGl0IHRvIGNsb3NlIGEgcGFyZW50IGNvbXBvbmVudC5cbiQoZG9jdW1lbnQpLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLWNsb3NlXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ2Nsb3NlJyk7XG4gIGlmIChpZCkge1xuICAgIHRyaWdnZXJzKCQodGhpcyksICdjbG9zZScpO1xuICB9XG4gIGVsc2Uge1xuICAgICQodGhpcykudHJpZ2dlcignY2xvc2UuemYudHJpZ2dlcicpO1xuICB9XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS10b2dnbGVdIHdpbGwgdG9nZ2xlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlXScsIGZ1bmN0aW9uKCkge1xuICB0cmlnZ2VycygkKHRoaXMpLCAndG9nZ2xlJyk7XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS1jbG9zYWJsZV0gd2lsbCByZXNwb25kIHRvIGNsb3NlLnpmLnRyaWdnZXIgZXZlbnRzLlxuJChkb2N1bWVudCkub24oJ2Nsb3NlLnpmLnRyaWdnZXInLCAnW2RhdGEtY2xvc2FibGVdJywgZnVuY3Rpb24oZSl7XG4gIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIGxldCBhbmltYXRpb24gPSAkKHRoaXMpLmRhdGEoJ2Nsb3NhYmxlJyk7XG5cbiAgaWYoYW5pbWF0aW9uICE9PSAnJyl7XG4gICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCgkKHRoaXMpLCBhbmltYXRpb24sIGZ1bmN0aW9uKCkge1xuICAgICAgJCh0aGlzKS50cmlnZ2VyKCdjbG9zZWQuemYnKTtcbiAgICB9KTtcbiAgfWVsc2V7XG4gICAgJCh0aGlzKS5mYWRlT3V0KCkudHJpZ2dlcignY2xvc2VkLnpmJyk7XG4gIH1cbn0pO1xuXG4kKGRvY3VtZW50KS5vbignZm9jdXMuemYudHJpZ2dlciBibHVyLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlLWZvY3VzXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ3RvZ2dsZS1mb2N1cycpO1xuICAkKGAjJHtpZH1gKS50cmlnZ2VySGFuZGxlcigndG9nZ2xlLnpmLnRyaWdnZXInLCBbJCh0aGlzKV0pO1xufSk7XG5cbi8qKlxuKiBGaXJlcyBvbmNlIGFmdGVyIGFsbCBvdGhlciBzY3JpcHRzIGhhdmUgbG9hZGVkXG4qIEBmdW5jdGlvblxuKiBAcHJpdmF0ZVxuKi9cbiQod2luZG93KS5vbignbG9hZCcsICgpID0+IHtcbiAgY2hlY2tMaXN0ZW5lcnMoKTtcbn0pO1xuXG5mdW5jdGlvbiBjaGVja0xpc3RlbmVycygpIHtcbiAgZXZlbnRzTGlzdGVuZXIoKTtcbiAgcmVzaXplTGlzdGVuZXIoKTtcbiAgc2Nyb2xsTGlzdGVuZXIoKTtcbiAgY2xvc2VtZUxpc3RlbmVyKCk7XG59XG5cbi8vKioqKioqKiogb25seSBmaXJlcyB0aGlzIGZ1bmN0aW9uIG9uY2Ugb24gbG9hZCwgaWYgdGhlcmUncyBzb21ldGhpbmcgdG8gd2F0Y2ggKioqKioqKipcbmZ1bmN0aW9uIGNsb3NlbWVMaXN0ZW5lcihwbHVnaW5OYW1lKSB7XG4gIHZhciB5ZXRpQm94ZXMgPSAkKCdbZGF0YS15ZXRpLWJveF0nKSxcbiAgICAgIHBsdWdOYW1lcyA9IFsnZHJvcGRvd24nLCAndG9vbHRpcCcsICdyZXZlYWwnXTtcblxuICBpZihwbHVnaW5OYW1lKXtcbiAgICBpZih0eXBlb2YgcGx1Z2luTmFtZSA9PT0gJ3N0cmluZycpe1xuICAgICAgcGx1Z05hbWVzLnB1c2gocGx1Z2luTmFtZSk7XG4gICAgfWVsc2UgaWYodHlwZW9mIHBsdWdpbk5hbWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBwbHVnaW5OYW1lWzBdID09PSAnc3RyaW5nJyl7XG4gICAgICBwbHVnTmFtZXMuY29uY2F0KHBsdWdpbk5hbWUpO1xuICAgIH1lbHNle1xuICAgICAgY29uc29sZS5lcnJvcignUGx1Z2luIG5hbWVzIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgfVxuICBpZih5ZXRpQm94ZXMubGVuZ3RoKXtcbiAgICBsZXQgbGlzdGVuZXJzID0gcGx1Z05hbWVzLm1hcCgobmFtZSkgPT4ge1xuICAgICAgcmV0dXJuIGBjbG9zZW1lLnpmLiR7bmFtZX1gO1xuICAgIH0pLmpvaW4oJyAnKTtcblxuICAgICQod2luZG93KS5vZmYobGlzdGVuZXJzKS5vbihsaXN0ZW5lcnMsIGZ1bmN0aW9uKGUsIHBsdWdpbklkKXtcbiAgICAgIGxldCBwbHVnaW4gPSBlLm5hbWVzcGFjZS5zcGxpdCgnLicpWzBdO1xuICAgICAgbGV0IHBsdWdpbnMgPSAkKGBbZGF0YS0ke3BsdWdpbn1dYCkubm90KGBbZGF0YS15ZXRpLWJveD1cIiR7cGx1Z2luSWR9XCJdYCk7XG5cbiAgICAgIHBsdWdpbnMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICBsZXQgX3RoaXMgPSAkKHRoaXMpO1xuXG4gICAgICAgIF90aGlzLnRyaWdnZXJIYW5kbGVyKCdjbG9zZS56Zi50cmlnZ2VyJywgW190aGlzXSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNpemVMaXN0ZW5lcihkZWJvdW5jZSl7XG4gIGxldCB0aW1lcixcbiAgICAgICRub2RlcyA9ICQoJ1tkYXRhLXJlc2l6ZV0nKTtcbiAgaWYoJG5vZGVzLmxlbmd0aCl7XG4gICAgJCh3aW5kb3cpLm9mZigncmVzaXplLnpmLnRyaWdnZXInKVxuICAgIC5vbigncmVzaXplLnpmLnRyaWdnZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAodGltZXIpIHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxuXG4gICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblxuICAgICAgICBpZighTXV0YXRpb25PYnNlcnZlcil7Ly9mYWxsYmFjayBmb3IgSUUgOVxuICAgICAgICAgICRub2Rlcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdyZXNpemVtZS56Zi50cmlnZ2VyJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIHJlc2l6ZSBldmVudFxuICAgICAgICAkbm9kZXMuYXR0cignZGF0YS1ldmVudHMnLCBcInJlc2l6ZVwiKTtcbiAgICAgIH0sIGRlYm91bmNlIHx8IDEwKTsvL2RlZmF1bHQgdGltZSB0byBlbWl0IHJlc2l6ZSBldmVudFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNjcm9sbExpc3RlbmVyKGRlYm91bmNlKXtcbiAgbGV0IHRpbWVyLFxuICAgICAgJG5vZGVzID0gJCgnW2RhdGEtc2Nyb2xsXScpO1xuICBpZigkbm9kZXMubGVuZ3RoKXtcbiAgICAkKHdpbmRvdykub2ZmKCdzY3JvbGwuemYudHJpZ2dlcicpXG4gICAgLm9uKCdzY3JvbGwuemYudHJpZ2dlcicsIGZ1bmN0aW9uKGUpe1xuICAgICAgaWYodGltZXIpeyBjbGVhclRpbWVvdXQodGltZXIpOyB9XG5cbiAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuXG4gICAgICAgIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsvL2ZhbGxiYWNrIGZvciBJRSA5XG4gICAgICAgICAgJG5vZGVzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ3Njcm9sbG1lLnpmLnRyaWdnZXInKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgc2Nyb2xsIGV2ZW50XG4gICAgICAgICRub2Rlcy5hdHRyKCdkYXRhLWV2ZW50cycsIFwic2Nyb2xsXCIpO1xuICAgICAgfSwgZGVib3VuY2UgfHwgMTApOy8vZGVmYXVsdCB0aW1lIHRvIGVtaXQgc2Nyb2xsIGV2ZW50XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXZlbnRzTGlzdGVuZXIoKSB7XG4gIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsgcmV0dXJuIGZhbHNlOyB9XG4gIGxldCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXJlc2l6ZV0sIFtkYXRhLXNjcm9sbF0sIFtkYXRhLW11dGF0ZV0nKTtcblxuICAvL2VsZW1lbnQgY2FsbGJhY2tcbiAgdmFyIGxpc3RlbmluZ0VsZW1lbnRzTXV0YXRpb24gPSBmdW5jdGlvbihtdXRhdGlvblJlY29yZHNMaXN0KSB7XG4gICAgdmFyICR0YXJnZXQgPSAkKG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0udGFyZ2V0KTtcbiAgICAvL3RyaWdnZXIgdGhlIGV2ZW50IGhhbmRsZXIgZm9yIHRoZSBlbGVtZW50IGRlcGVuZGluZyBvbiB0eXBlXG4gICAgc3dpdGNoICgkdGFyZ2V0LmF0dHIoXCJkYXRhLWV2ZW50c1wiKSkge1xuXG4gICAgICBjYXNlIFwicmVzaXplXCIgOlxuICAgICAgJHRhcmdldC50cmlnZ2VySGFuZGxlcigncmVzaXplbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0XSk7XG4gICAgICBicmVhaztcblxuICAgICAgY2FzZSBcInNjcm9sbFwiIDpcbiAgICAgICR0YXJnZXQudHJpZ2dlckhhbmRsZXIoJ3Njcm9sbG1lLnpmLnRyaWdnZXInLCBbJHRhcmdldCwgd2luZG93LnBhZ2VZT2Zmc2V0XSk7XG4gICAgICBicmVhaztcblxuICAgICAgLy8gY2FzZSBcIm11dGF0ZVwiIDpcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdtdXRhdGUnLCAkdGFyZ2V0KTtcbiAgICAgIC8vICR0YXJnZXQudHJpZ2dlckhhbmRsZXIoJ211dGF0ZS56Zi50cmlnZ2VyJyk7XG4gICAgICAvL1xuICAgICAgLy8gLy9tYWtlIHN1cmUgd2UgZG9uJ3QgZ2V0IHN0dWNrIGluIGFuIGluZmluaXRlIGxvb3AgZnJvbSBzbG9wcHkgY29kZWluZ1xuICAgICAgLy8gaWYgKCR0YXJnZXQuaW5kZXgoJ1tkYXRhLW11dGF0ZV0nKSA9PSAkKFwiW2RhdGEtbXV0YXRlXVwiKS5sZW5ndGgtMSkge1xuICAgICAgLy8gICBkb21NdXRhdGlvbk9ic2VydmVyKCk7XG4gICAgICAvLyB9XG4gICAgICAvLyBicmVhaztcblxuICAgICAgZGVmYXVsdCA6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAvL25vdGhpbmdcbiAgICB9XG4gIH1cblxuICBpZihub2Rlcy5sZW5ndGgpe1xuICAgIC8vZm9yIGVhY2ggZWxlbWVudCB0aGF0IG5lZWRzIHRvIGxpc3RlbiBmb3IgcmVzaXppbmcsIHNjcm9sbGluZywgKG9yIGNvbWluZyBzb29uIG11dGF0aW9uKSBhZGQgYSBzaW5nbGUgb2JzZXJ2ZXJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBub2Rlcy5sZW5ndGgtMTsgaSsrKSB7XG4gICAgICBsZXQgZWxlbWVudE9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIobGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbik7XG4gICAgICBlbGVtZW50T2JzZXJ2ZXIub2JzZXJ2ZShub2Rlc1tpXSwgeyBhdHRyaWJ1dGVzOiB0cnVlLCBjaGlsZExpc3Q6IGZhbHNlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTpmYWxzZSwgYXR0cmlidXRlRmlsdGVyOltcImRhdGEtZXZlbnRzXCJdfSk7XG4gICAgfVxuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBbUEhdXG4vLyBGb3VuZGF0aW9uLkNoZWNrV2F0Y2hlcnMgPSBjaGVja1dhdGNoZXJzO1xuRm91bmRhdGlvbi5JSGVhcllvdSA9IGNoZWNrTGlzdGVuZXJzO1xuLy8gRm91bmRhdGlvbi5JU2VlWW91ID0gc2Nyb2xsTGlzdGVuZXI7XG4vLyBGb3VuZGF0aW9uLklGZWVsWW91ID0gY2xvc2VtZUxpc3RlbmVyO1xuXG59KGpRdWVyeSk7XG5cbi8vIGZ1bmN0aW9uIGRvbU11dGF0aW9uT2JzZXJ2ZXIoZGVib3VuY2UpIHtcbi8vICAgLy8gISEhIFRoaXMgaXMgY29taW5nIHNvb24gYW5kIG5lZWRzIG1vcmUgd29yazsgbm90IGFjdGl2ZSAgISEhIC8vXG4vLyAgIHZhciB0aW1lcixcbi8vICAgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1tdXRhdGVdJyk7XG4vLyAgIC8vXG4vLyAgIGlmIChub2Rlcy5sZW5ndGgpIHtcbi8vICAgICAvLyB2YXIgTXV0YXRpb25PYnNlcnZlciA9IChmdW5jdGlvbiAoKSB7XG4vLyAgICAgLy8gICB2YXIgcHJlZml4ZXMgPSBbJ1dlYktpdCcsICdNb3onLCAnTycsICdNcycsICcnXTtcbi8vICAgICAvLyAgIGZvciAodmFyIGk9MDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgLy8gICAgIGlmIChwcmVmaXhlc1tpXSArICdNdXRhdGlvbk9ic2VydmVyJyBpbiB3aW5kb3cpIHtcbi8vICAgICAvLyAgICAgICByZXR1cm4gd2luZG93W3ByZWZpeGVzW2ldICsgJ011dGF0aW9uT2JzZXJ2ZXInXTtcbi8vICAgICAvLyAgICAgfVxuLy8gICAgIC8vICAgfVxuLy8gICAgIC8vICAgcmV0dXJuIGZhbHNlO1xuLy8gICAgIC8vIH0oKSk7XG4vL1xuLy9cbi8vICAgICAvL2ZvciB0aGUgYm9keSwgd2UgbmVlZCB0byBsaXN0ZW4gZm9yIGFsbCBjaGFuZ2VzIGVmZmVjdGluZyB0aGUgc3R5bGUgYW5kIGNsYXNzIGF0dHJpYnV0ZXNcbi8vICAgICB2YXIgYm9keU9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoYm9keU11dGF0aW9uKTtcbi8vICAgICBib2R5T2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7IGF0dHJpYnV0ZXM6IHRydWUsIGNoaWxkTGlzdDogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6dHJ1ZSwgYXR0cmlidXRlRmlsdGVyOltcInN0eWxlXCIsIFwiY2xhc3NcIl19KTtcbi8vXG4vL1xuLy8gICAgIC8vYm9keSBjYWxsYmFja1xuLy8gICAgIGZ1bmN0aW9uIGJvZHlNdXRhdGlvbihtdXRhdGUpIHtcbi8vICAgICAgIC8vdHJpZ2dlciBhbGwgbGlzdGVuaW5nIGVsZW1lbnRzIGFuZCBzaWduYWwgYSBtdXRhdGlvbiBldmVudFxuLy8gICAgICAgaWYgKHRpbWVyKSB7IGNsZWFyVGltZW91dCh0aW1lcik7IH1cbi8vXG4vLyAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4vLyAgICAgICAgIGJvZHlPYnNlcnZlci5kaXNjb25uZWN0KCk7XG4vLyAgICAgICAgICQoJ1tkYXRhLW11dGF0ZV0nKS5hdHRyKCdkYXRhLWV2ZW50cycsXCJtdXRhdGVcIik7XG4vLyAgICAgICB9LCBkZWJvdW5jZSB8fCAxNTApO1xuLy8gICAgIH1cbi8vICAgfVxuLy8gfVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIERyb3Bkb3duTWVudSBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uZHJvcGRvd24tbWVudVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5ib3hcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubmVzdFxuICovXG5cbmNsYXNzIERyb3Bkb3duTWVudSB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIERyb3Bkb3duTWVudS5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBEcm9wZG93bk1lbnUjaW5pdFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGEgZHJvcGRvd24gbWVudS5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBEcm9wZG93bk1lbnUuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIEZvdW5kYXRpb24uTmVzdC5GZWF0aGVyKHRoaXMuJGVsZW1lbnQsICdkcm9wZG93bicpO1xuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0Ryb3Bkb3duTWVudScpO1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ0Ryb3Bkb3duTWVudScsIHtcbiAgICAgICdFTlRFUic6ICdvcGVuJyxcbiAgICAgICdTUEFDRSc6ICdvcGVuJyxcbiAgICAgICdBUlJPV19SSUdIVCc6ICduZXh0JyxcbiAgICAgICdBUlJPV19VUCc6ICd1cCcsXG4gICAgICAnQVJST1dfRE9XTic6ICdkb3duJyxcbiAgICAgICdBUlJPV19MRUZUJzogJ3ByZXZpb3VzJyxcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHBsdWdpbiwgYW5kIGNhbGxzIF9wcmVwYXJlTWVudVxuICAgKiBAcHJpdmF0ZVxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBzdWJzID0gdGhpcy4kZWxlbWVudC5maW5kKCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpO1xuICAgIHRoaXMuJGVsZW1lbnQuY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudScpLmFkZENsYXNzKCdmaXJzdC1zdWInKTtcblxuICAgIHRoaXMuJG1lbnVJdGVtcyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW3JvbGU9XCJtZW51aXRlbVwiXScpO1xuICAgIHRoaXMuJHRhYnMgPSB0aGlzLiRlbGVtZW50LmNoaWxkcmVuKCdbcm9sZT1cIm1lbnVpdGVtXCJdJyk7XG4gICAgdGhpcy4kdGFicy5maW5kKCd1bC5pcy1kcm9wZG93bi1zdWJtZW51JykuYWRkQ2xhc3ModGhpcy5vcHRpb25zLnZlcnRpY2FsQ2xhc3MpO1xuXG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3ModGhpcy5vcHRpb25zLnJpZ2h0Q2xhc3MpIHx8IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPT09ICdyaWdodCcgfHwgRm91bmRhdGlvbi5ydGwoKSB8fCB0aGlzLiRlbGVtZW50LnBhcmVudHMoJy50b3AtYmFyLXJpZ2h0JykuaXMoJyonKSkge1xuICAgICAgdGhpcy5vcHRpb25zLmFsaWdubWVudCA9ICdyaWdodCc7XG4gICAgICBzdWJzLmFkZENsYXNzKCdvcGVucy1sZWZ0Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN1YnMuYWRkQ2xhc3MoJ29wZW5zLXJpZ2h0Jyk7XG4gICAgfVxuICAgIHRoaXMuY2hhbmdlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuICB9O1xuXG4gIF9pc1ZlcnRpY2FsKCkge1xuICAgIHJldHVybiB0aGlzLiR0YWJzLmNzcygnZGlzcGxheScpID09PSAnYmxvY2snO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIGVsZW1lbnRzIHdpdGhpbiB0aGUgbWVudVxuICAgKiBAcHJpdmF0ZVxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgICAgaGFzVG91Y2ggPSAnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cgfHwgKHR5cGVvZiB3aW5kb3cub250b3VjaHN0YXJ0ICE9PSAndW5kZWZpbmVkJyksXG4gICAgICAgIHBhckNsYXNzID0gJ2lzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JztcblxuICAgIC8vIHVzZWQgZm9yIG9uQ2xpY2sgYW5kIGluIHRoZSBrZXlib2FyZCBoYW5kbGVyc1xuICAgIHZhciBoYW5kbGVDbGlja0ZuID0gZnVuY3Rpb24oZSkge1xuICAgICAgdmFyICRlbGVtID0gJChlLnRhcmdldCkucGFyZW50c1VudGlsKCd1bCcsIGAuJHtwYXJDbGFzc31gKSxcbiAgICAgICAgICBoYXNTdWIgPSAkZWxlbS5oYXNDbGFzcyhwYXJDbGFzcyksXG4gICAgICAgICAgaGFzQ2xpY2tlZCA9ICRlbGVtLmF0dHIoJ2RhdGEtaXMtY2xpY2snKSA9PT0gJ3RydWUnLFxuICAgICAgICAgICRzdWIgPSAkZWxlbS5jaGlsZHJlbignLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKTtcblxuICAgICAgaWYgKGhhc1N1Yikge1xuICAgICAgICBpZiAoaGFzQ2xpY2tlZCkge1xuICAgICAgICAgIGlmICghX3RoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgfHwgKCFfdGhpcy5vcHRpb25zLmNsaWNrT3BlbiAmJiAhaGFzVG91Y2gpIHx8IChfdGhpcy5vcHRpb25zLmZvcmNlRm9sbG93ICYmIGhhc1RvdWNoKSkgeyByZXR1cm47IH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBfdGhpcy5faGlkZSgkZWxlbSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIF90aGlzLl9zaG93KCRzdWIpO1xuICAgICAgICAgICRlbGVtLmFkZCgkZWxlbS5wYXJlbnRzVW50aWwoX3RoaXMuJGVsZW1lbnQsIGAuJHtwYXJDbGFzc31gKSkuYXR0cignZGF0YS1pcy1jbGljaycsIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZihfdGhpcy5vcHRpb25zLmNsb3NlT25DbGlja0luc2lkZSl7XG4gICAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbGlja09wZW4gfHwgaGFzVG91Y2gpIHtcbiAgICAgIHRoaXMuJG1lbnVJdGVtcy5vbignY2xpY2suemYuZHJvcGRvd25tZW51IHRvdWNoc3RhcnQuemYuZHJvcGRvd25tZW51JywgaGFuZGxlQ2xpY2tGbik7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuZGlzYWJsZUhvdmVyKSB7XG4gICAgICB0aGlzLiRtZW51SXRlbXMub24oJ21vdXNlZW50ZXIuemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgJGVsZW0gPSAkKHRoaXMpLFxuICAgICAgICAgICAgaGFzU3ViID0gJGVsZW0uaGFzQ2xhc3MocGFyQ2xhc3MpO1xuXG4gICAgICAgIGlmIChoYXNTdWIpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMuZGVsYXkpO1xuICAgICAgICAgIF90aGlzLmRlbGF5ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIF90aGlzLl9zaG93KCRlbGVtLmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudScpKTtcbiAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xuICAgICAgICB9XG4gICAgICB9KS5vbignbW91c2VsZWF2ZS56Zi5kcm9wZG93bm1lbnUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciAkZWxlbSA9ICQodGhpcyksXG4gICAgICAgICAgICBoYXNTdWIgPSAkZWxlbS5oYXNDbGFzcyhwYXJDbGFzcyk7XG4gICAgICAgIGlmIChoYXNTdWIgJiYgX3RoaXMub3B0aW9ucy5hdXRvY2xvc2UpIHtcbiAgICAgICAgICBpZiAoJGVsZW0uYXR0cignZGF0YS1pcy1jbGljaycpID09PSAndHJ1ZScgJiYgX3RoaXMub3B0aW9ucy5jbGlja09wZW4pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMuZGVsYXkpO1xuICAgICAgICAgIF90aGlzLmRlbGF5ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIF90aGlzLl9oaWRlKCRlbGVtKTtcbiAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmNsb3NpbmdUaW1lKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuJG1lbnVJdGVtcy5vbigna2V5ZG93bi56Zi5kcm9wZG93bm1lbnUnLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgJGVsZW1lbnQgPSAkKGUudGFyZ2V0KS5wYXJlbnRzVW50aWwoJ3VsJywgJ1tyb2xlPVwibWVudWl0ZW1cIl0nKSxcbiAgICAgICAgICBpc1RhYiA9IF90aGlzLiR0YWJzLmluZGV4KCRlbGVtZW50KSA+IC0xLFxuICAgICAgICAgICRlbGVtZW50cyA9IGlzVGFiID8gX3RoaXMuJHRhYnMgOiAkZWxlbWVudC5zaWJsaW5ncygnbGknKS5hZGQoJGVsZW1lbnQpLFxuICAgICAgICAgICRwcmV2RWxlbWVudCxcbiAgICAgICAgICAkbmV4dEVsZW1lbnQ7XG5cbiAgICAgICRlbGVtZW50cy5lYWNoKGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgaWYgKCQodGhpcykuaXMoJGVsZW1lbnQpKSB7XG4gICAgICAgICAgJHByZXZFbGVtZW50ID0gJGVsZW1lbnRzLmVxKGktMSk7XG4gICAgICAgICAgJG5leHRFbGVtZW50ID0gJGVsZW1lbnRzLmVxKGkrMSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdmFyIG5leHRTaWJsaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghJGVsZW1lbnQuaXMoJzpsYXN0LWNoaWxkJykpIHtcbiAgICAgICAgICAkbmV4dEVsZW1lbnQuY2hpbGRyZW4oJ2E6Zmlyc3QnKS5mb2N1cygpO1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgfSwgcHJldlNpYmxpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHByZXZFbGVtZW50LmNoaWxkcmVuKCdhOmZpcnN0JykuZm9jdXMoKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfSwgb3BlblN1YiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHN1YiA9ICRlbGVtZW50LmNoaWxkcmVuKCd1bC5pcy1kcm9wZG93bi1zdWJtZW51Jyk7XG4gICAgICAgIGlmICgkc3ViLmxlbmd0aCkge1xuICAgICAgICAgIF90aGlzLl9zaG93KCRzdWIpO1xuICAgICAgICAgICRlbGVtZW50LmZpbmQoJ2xpID4gYTpmaXJzdCcpLmZvY3VzKCk7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9IGVsc2UgeyByZXR1cm47IH1cbiAgICAgIH0sIGNsb3NlU3ViID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vaWYgKCRlbGVtZW50LmlzKCc6Zmlyc3QtY2hpbGQnKSkge1xuICAgICAgICB2YXIgY2xvc2UgPSAkZWxlbWVudC5wYXJlbnQoJ3VsJykucGFyZW50KCdsaScpO1xuICAgICAgICBjbG9zZS5jaGlsZHJlbignYTpmaXJzdCcpLmZvY3VzKCk7XG4gICAgICAgIF90aGlzLl9oaWRlKGNsb3NlKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvL31cbiAgICAgIH07XG4gICAgICB2YXIgZnVuY3Rpb25zID0ge1xuICAgICAgICBvcGVuOiBvcGVuU3ViLFxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgX3RoaXMuX2hpZGUoX3RoaXMuJGVsZW1lbnQpO1xuICAgICAgICAgIF90aGlzLiRtZW51SXRlbXMuZmluZCgnYTpmaXJzdCcpLmZvY3VzKCk7IC8vIGZvY3VzIHRvIGZpcnN0IGVsZW1lbnRcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGlmIChpc1RhYikge1xuICAgICAgICBpZiAoX3RoaXMuX2lzVmVydGljYWwoKSkgeyAvLyB2ZXJ0aWNhbCBtZW51XG4gICAgICAgICAgaWYgKEZvdW5kYXRpb24ucnRsKCkpIHsgLy8gcmlnaHQgYWxpZ25lZFxuICAgICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XG4gICAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgICB1cDogcHJldlNpYmxpbmcsXG4gICAgICAgICAgICAgIG5leHQ6IGNsb3NlU3ViLFxuICAgICAgICAgICAgICBwcmV2aW91czogb3BlblN1YlxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHsgLy8gbGVmdCBhbGlnbmVkXG4gICAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgICAgZG93bjogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICAgIHVwOiBwcmV2U2libGluZyxcbiAgICAgICAgICAgICAgbmV4dDogb3BlblN1YixcbiAgICAgICAgICAgICAgcHJldmlvdXM6IGNsb3NlU3ViXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7IC8vIGhvcml6b250YWwgbWVudVxuICAgICAgICAgIGlmIChGb3VuZGF0aW9uLnJ0bCgpKSB7IC8vIHJpZ2h0IGFsaWduZWRcbiAgICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgICBuZXh0OiBwcmV2U2libGluZyxcbiAgICAgICAgICAgICAgcHJldmlvdXM6IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgICBkb3duOiBvcGVuU3ViLFxuICAgICAgICAgICAgICB1cDogY2xvc2VTdWJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7IC8vIGxlZnQgYWxpZ25lZFxuICAgICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XG4gICAgICAgICAgICAgIG5leHQ6IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgICBwcmV2aW91czogcHJldlNpYmxpbmcsXG4gICAgICAgICAgICAgIGRvd246IG9wZW5TdWIsXG4gICAgICAgICAgICAgIHVwOiBjbG9zZVN1YlxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgeyAvLyBub3QgdGFicyAtPiBvbmUgc3ViXG4gICAgICAgIGlmIChGb3VuZGF0aW9uLnJ0bCgpKSB7IC8vIHJpZ2h0IGFsaWduZWRcbiAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgIG5leHQ6IGNsb3NlU3ViLFxuICAgICAgICAgICAgcHJldmlvdXM6IG9wZW5TdWIsXG4gICAgICAgICAgICBkb3duOiBuZXh0U2libGluZyxcbiAgICAgICAgICAgIHVwOiBwcmV2U2libGluZ1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgeyAvLyBsZWZ0IGFsaWduZWRcbiAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgIG5leHQ6IG9wZW5TdWIsXG4gICAgICAgICAgICBwcmV2aW91czogY2xvc2VTdWIsXG4gICAgICAgICAgICBkb3duOiBuZXh0U2libGluZyxcbiAgICAgICAgICAgIHVwOiBwcmV2U2libGluZ1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnRHJvcGRvd25NZW51JywgZnVuY3Rpb25zKTtcblxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYW4gZXZlbnQgaGFuZGxlciB0byB0aGUgYm9keSB0byBjbG9zZSBhbnkgZHJvcGRvd25zIG9uIGEgY2xpY2suXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2FkZEJvZHlIYW5kbGVyKCkge1xuICAgIHZhciAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSksXG4gICAgICAgIF90aGlzID0gdGhpcztcbiAgICAkYm9keS5vZmYoJ21vdXNldXAuemYuZHJvcGRvd25tZW51IHRvdWNoZW5kLnpmLmRyb3Bkb3dubWVudScpXG4gICAgICAgICAub24oJ21vdXNldXAuemYuZHJvcGRvd25tZW51IHRvdWNoZW5kLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgdmFyICRsaW5rID0gX3RoaXMuJGVsZW1lbnQuZmluZChlLnRhcmdldCk7XG4gICAgICAgICAgIGlmICgkbGluay5sZW5ndGgpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgICAgX3RoaXMuX2hpZGUoKTtcbiAgICAgICAgICAgJGJvZHkub2ZmKCdtb3VzZXVwLnpmLmRyb3Bkb3dubWVudSB0b3VjaGVuZC56Zi5kcm9wZG93bm1lbnUnKTtcbiAgICAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIGEgZHJvcGRvd24gcGFuZSwgYW5kIGNoZWNrcyBmb3IgY29sbGlzaW9ucyBmaXJzdC5cbiAgICogQHBhcmFtIHtqUXVlcnl9ICRzdWIgLSB1bCBlbGVtZW50IHRoYXQgaXMgYSBzdWJtZW51IHRvIHNob3dcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEBmaXJlcyBEcm9wZG93bk1lbnUjc2hvd1xuICAgKi9cbiAgX3Nob3coJHN1Yikge1xuICAgIHZhciBpZHggPSB0aGlzLiR0YWJzLmluZGV4KHRoaXMuJHRhYnMuZmlsdGVyKGZ1bmN0aW9uKGksIGVsKSB7XG4gICAgICByZXR1cm4gJChlbCkuZmluZCgkc3ViKS5sZW5ndGggPiAwO1xuICAgIH0pKTtcbiAgICB2YXIgJHNpYnMgPSAkc3ViLnBhcmVudCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKS5zaWJsaW5ncygnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKTtcbiAgICB0aGlzLl9oaWRlKCRzaWJzLCBpZHgpO1xuICAgICRzdWIuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpLmFkZENsYXNzKCdqcy1kcm9wZG93bi1hY3RpdmUnKS5hdHRyKHsnYXJpYS1oaWRkZW4nOiBmYWxzZX0pXG4gICAgICAgIC5wYXJlbnQoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JykuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpXG4gICAgICAgIC5hdHRyKHsnYXJpYS1leHBhbmRlZCc6IHRydWV9KTtcbiAgICB2YXIgY2xlYXIgPSBGb3VuZGF0aW9uLkJveC5JbU5vdFRvdWNoaW5nWW91KCRzdWIsIG51bGwsIHRydWUpO1xuICAgIGlmICghY2xlYXIpIHtcbiAgICAgIHZhciBvbGRDbGFzcyA9IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPT09ICdsZWZ0JyA/ICctcmlnaHQnIDogJy1sZWZ0JyxcbiAgICAgICAgICAkcGFyZW50TGkgPSAkc3ViLnBhcmVudCgnLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50Jyk7XG4gICAgICAkcGFyZW50TGkucmVtb3ZlQ2xhc3MoYG9wZW5zJHtvbGRDbGFzc31gKS5hZGRDbGFzcyhgb3BlbnMtJHt0aGlzLm9wdGlvbnMuYWxpZ25tZW50fWApO1xuICAgICAgY2xlYXIgPSBGb3VuZGF0aW9uLkJveC5JbU5vdFRvdWNoaW5nWW91KCRzdWIsIG51bGwsIHRydWUpO1xuICAgICAgaWYgKCFjbGVhcikge1xuICAgICAgICAkcGFyZW50TGkucmVtb3ZlQ2xhc3MoYG9wZW5zLSR7dGhpcy5vcHRpb25zLmFsaWdubWVudH1gKS5hZGRDbGFzcygnb3BlbnMtaW5uZXInKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY2hhbmdlZCA9IHRydWU7XG4gICAgfVxuICAgICRzdWIuY3NzKCd2aXNpYmlsaXR5JywgJycpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKSB7IHRoaXMuX2FkZEJvZHlIYW5kbGVyKCk7IH1cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBuZXcgZHJvcGRvd24gcGFuZSBpcyB2aXNpYmxlLlxuICAgICAqIEBldmVudCBEcm9wZG93bk1lbnUjc2hvd1xuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignc2hvdy56Zi5kcm9wZG93bm1lbnUnLCBbJHN1Yl0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEhpZGVzIGEgc2luZ2xlLCBjdXJyZW50bHkgb3BlbiBkcm9wZG93biBwYW5lLCBpZiBwYXNzZWQgYSBwYXJhbWV0ZXIsIG90aGVyd2lzZSwgaGlkZXMgZXZlcnl0aGluZy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbSAtIGVsZW1lbnQgd2l0aCBhIHN1Ym1lbnUgdG8gaGlkZVxuICAgKiBAcGFyYW0ge051bWJlcn0gaWR4IC0gaW5kZXggb2YgdGhlICR0YWJzIGNvbGxlY3Rpb24gdG8gaGlkZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2hpZGUoJGVsZW0sIGlkeCkge1xuICAgIHZhciAkdG9DbG9zZTtcbiAgICBpZiAoJGVsZW0gJiYgJGVsZW0ubGVuZ3RoKSB7XG4gICAgICAkdG9DbG9zZSA9ICRlbGVtO1xuICAgIH0gZWxzZSBpZiAoaWR4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICR0b0Nsb3NlID0gdGhpcy4kdGFicy5ub3QoZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgICAgcmV0dXJuIGkgPT09IGlkeDtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICR0b0Nsb3NlID0gdGhpcy4kZWxlbWVudDtcbiAgICB9XG4gICAgdmFyIHNvbWV0aGluZ1RvQ2xvc2UgPSAkdG9DbG9zZS5oYXNDbGFzcygnaXMtYWN0aXZlJykgfHwgJHRvQ2xvc2UuZmluZCgnLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDA7XG5cbiAgICBpZiAoc29tZXRoaW5nVG9DbG9zZSkge1xuICAgICAgJHRvQ2xvc2UuZmluZCgnbGkuaXMtYWN0aXZlJykuYWRkKCR0b0Nsb3NlKS5hdHRyKHtcbiAgICAgICAgJ2FyaWEtZXhwYW5kZWQnOiBmYWxzZSxcbiAgICAgICAgJ2RhdGEtaXMtY2xpY2snOiBmYWxzZVxuICAgICAgfSkucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuXG4gICAgICAkdG9DbG9zZS5maW5kKCd1bC5qcy1kcm9wZG93bi1hY3RpdmUnKS5hdHRyKHtcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogdHJ1ZVxuICAgICAgfSkucmVtb3ZlQ2xhc3MoJ2pzLWRyb3Bkb3duLWFjdGl2ZScpO1xuXG4gICAgICBpZiAodGhpcy5jaGFuZ2VkIHx8ICR0b0Nsb3NlLmZpbmQoJ29wZW5zLWlubmVyJykubGVuZ3RoKSB7XG4gICAgICAgIHZhciBvbGRDbGFzcyA9IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPT09ICdsZWZ0JyA/ICdyaWdodCcgOiAnbGVmdCc7XG4gICAgICAgICR0b0Nsb3NlLmZpbmQoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JykuYWRkKCR0b0Nsb3NlKVxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhgb3BlbnMtaW5uZXIgb3BlbnMtJHt0aGlzLm9wdGlvbnMuYWxpZ25tZW50fWApXG4gICAgICAgICAgICAgICAgLmFkZENsYXNzKGBvcGVucy0ke29sZENsYXNzfWApO1xuICAgICAgICB0aGlzLmNoYW5nZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8qKlxuICAgICAgICogRmlyZXMgd2hlbiB0aGUgb3BlbiBtZW51cyBhcmUgY2xvc2VkLlxuICAgICAgICogQGV2ZW50IERyb3Bkb3duTWVudSNoaWRlXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignaGlkZS56Zi5kcm9wZG93bm1lbnUnLCBbJHRvQ2xvc2VdKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIHBsdWdpbi5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuJG1lbnVJdGVtcy5vZmYoJy56Zi5kcm9wZG93bm1lbnUnKS5yZW1vdmVBdHRyKCdkYXRhLWlzLWNsaWNrJylcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdpcy1yaWdodC1hcnJvdyBpcy1sZWZ0LWFycm93IGlzLWRvd24tYXJyb3cgb3BlbnMtcmlnaHQgb3BlbnMtbGVmdCBvcGVucy1pbm5lcicpO1xuICAgICQoZG9jdW1lbnQuYm9keSkub2ZmKCcuemYuZHJvcGRvd25tZW51Jyk7XG4gICAgRm91bmRhdGlvbi5OZXN0LkJ1cm4odGhpcy4kZWxlbWVudCwgJ2Ryb3Bkb3duJyk7XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbi8qKlxuICogRGVmYXVsdCBzZXR0aW5ncyBmb3IgcGx1Z2luXG4gKi9cbkRyb3Bkb3duTWVudS5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIERpc2FsbG93cyBob3ZlciBldmVudHMgZnJvbSBvcGVuaW5nIHN1Ym1lbnVzXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGRpc2FibGVIb3ZlcjogZmFsc2UsXG4gIC8qKlxuICAgKiBBbGxvdyBhIHN1Ym1lbnUgdG8gYXV0b21hdGljYWxseSBjbG9zZSBvbiBhIG1vdXNlbGVhdmUgZXZlbnQsIGlmIG5vdCBjbGlja2VkIG9wZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgYXV0b2Nsb3NlOiB0cnVlLFxuICAvKipcbiAgICogQW1vdW50IG9mIHRpbWUgdG8gZGVsYXkgb3BlbmluZyBhIHN1Ym1lbnUgb24gaG92ZXIgZXZlbnQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgNTBcbiAgICovXG4gIGhvdmVyRGVsYXk6IDUwLFxuICAvKipcbiAgICogQWxsb3cgYSBzdWJtZW51IHRvIG9wZW4vcmVtYWluIG9wZW4gb24gcGFyZW50IGNsaWNrIGV2ZW50LiBBbGxvd3MgY3Vyc29yIHRvIG1vdmUgYXdheSBmcm9tIG1lbnUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgY2xpY2tPcGVuOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFtb3VudCBvZiB0aW1lIHRvIGRlbGF5IGNsb3NpbmcgYSBzdWJtZW51IG9uIGEgbW91c2VsZWF2ZSBldmVudC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSA1MDBcbiAgICovXG5cbiAgY2xvc2luZ1RpbWU6IDUwMCxcbiAgLyoqXG4gICAqIFBvc2l0aW9uIG9mIHRoZSBtZW51IHJlbGF0aXZlIHRvIHdoYXQgZGlyZWN0aW9uIHRoZSBzdWJtZW51cyBzaG91bGQgb3Blbi4gSGFuZGxlZCBieSBKUy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnbGVmdCdcbiAgICovXG4gIGFsaWdubWVudDogJ2xlZnQnLFxuICAvKipcbiAgICogQWxsb3cgY2xpY2tzIG9uIHRoZSBib2R5IHRvIGNsb3NlIGFueSBvcGVuIHN1Ym1lbnVzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGNsb3NlT25DbGljazogdHJ1ZSxcbiAgLyoqXG4gICAqIEFsbG93IGNsaWNrcyBvbiBsZWFmIGFuY2hvciBsaW5rcyB0byBjbG9zZSBhbnkgb3BlbiBzdWJtZW51cy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2tJbnNpZGU6IHRydWUsXG4gIC8qKlxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHZlcnRpY2FsIG9yaWVudGVkIG1lbnVzLCBGb3VuZGF0aW9uIGRlZmF1bHQgaXMgYHZlcnRpY2FsYC4gVXBkYXRlIHRoaXMgaWYgdXNpbmcgeW91ciBvd24gY2xhc3MuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ3ZlcnRpY2FsJ1xuICAgKi9cbiAgdmVydGljYWxDbGFzczogJ3ZlcnRpY2FsJyxcbiAgLyoqXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gcmlnaHQtc2lkZSBvcmllbnRlZCBtZW51cywgRm91bmRhdGlvbiBkZWZhdWx0IGlzIGBhbGlnbi1yaWdodGAuIFVwZGF0ZSB0aGlzIGlmIHVzaW5nIHlvdXIgb3duIGNsYXNzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdhbGlnbi1yaWdodCdcbiAgICovXG4gIHJpZ2h0Q2xhc3M6ICdhbGlnbi1yaWdodCcsXG4gIC8qKlxuICAgKiBCb29sZWFuIHRvIGZvcmNlIG92ZXJpZGUgdGhlIGNsaWNraW5nIG9mIGxpbmtzIHRvIHBlcmZvcm0gZGVmYXVsdCBhY3Rpb24sIG9uIHNlY29uZCB0b3VjaCBldmVudCBmb3IgbW9iaWxlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBmb3JjZUZvbGxvdzogdHJ1ZVxufTtcblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKERyb3Bkb3duTWVudSwgJ0Ryb3Bkb3duTWVudScpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogRXF1YWxpemVyIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5lcXVhbGl6ZXJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyIGlmIGVxdWFsaXplciBjb250YWlucyBpbWFnZXNcbiAqL1xuXG5jbGFzcyBFcXVhbGl6ZXIge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBFcXVhbGl6ZXIuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgRXF1YWxpemVyI2luaXRcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGFkZCB0aGUgdHJpZ2dlciB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucyl7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zICA9ICQuZXh0ZW5kKHt9LCBFcXVhbGl6ZXIuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0VxdWFsaXplcicpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBFcXVhbGl6ZXIgcGx1Z2luIGFuZCBjYWxscyBmdW5jdGlvbnMgdG8gZ2V0IGVxdWFsaXplciBmdW5jdGlvbmluZyBvbiBsb2FkLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIGVxSWQgPSB0aGlzLiRlbGVtZW50LmF0dHIoJ2RhdGEtZXF1YWxpemVyJykgfHwgJyc7XG4gICAgdmFyICR3YXRjaGVkID0gdGhpcy4kZWxlbWVudC5maW5kKGBbZGF0YS1lcXVhbGl6ZXItd2F0Y2g9XCIke2VxSWR9XCJdYCk7XG5cbiAgICB0aGlzLiR3YXRjaGVkID0gJHdhdGNoZWQubGVuZ3RoID8gJHdhdGNoZWQgOiB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLWVxdWFsaXplci13YXRjaF0nKTtcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2RhdGEtcmVzaXplJywgKGVxSWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnZXEnKSkpO1xuXG4gICAgdGhpcy5oYXNOZXN0ZWQgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLWVxdWFsaXplcl0nKS5sZW5ndGggPiAwO1xuICAgIHRoaXMuaXNOZXN0ZWQgPSB0aGlzLiRlbGVtZW50LnBhcmVudHNVbnRpbChkb2N1bWVudC5ib2R5LCAnW2RhdGEtZXF1YWxpemVyXScpLmxlbmd0aCA+IDA7XG4gICAgdGhpcy5pc09uID0gZmFsc2U7XG4gICAgdGhpcy5fYmluZEhhbmRsZXIgPSB7XG4gICAgICBvblJlc2l6ZU1lQm91bmQ6IHRoaXMuX29uUmVzaXplTWUuYmluZCh0aGlzKSxcbiAgICAgIG9uUG9zdEVxdWFsaXplZEJvdW5kOiB0aGlzLl9vblBvc3RFcXVhbGl6ZWQuYmluZCh0aGlzKVxuICAgIH07XG5cbiAgICB2YXIgaW1ncyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnaW1nJyk7XG4gICAgdmFyIHRvb1NtYWxsO1xuICAgIGlmKHRoaXMub3B0aW9ucy5lcXVhbGl6ZU9uKXtcbiAgICAgIHRvb1NtYWxsID0gdGhpcy5fY2hlY2tNUSgpO1xuICAgICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCB0aGlzLl9jaGVja01RLmJpbmQodGhpcykpO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5fZXZlbnRzKCk7XG4gICAgfVxuICAgIGlmKCh0b29TbWFsbCAhPT0gdW5kZWZpbmVkICYmIHRvb1NtYWxsID09PSBmYWxzZSkgfHwgdG9vU21hbGwgPT09IHVuZGVmaW5lZCl7XG4gICAgICBpZihpbWdzLmxlbmd0aCl7XG4gICAgICAgIEZvdW5kYXRpb24ub25JbWFnZXNMb2FkZWQoaW1ncywgdGhpcy5fcmVmbG93LmJpbmQodGhpcykpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMuX3JlZmxvdygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGV2ZW50IGxpc3RlbmVycyBpZiB0aGUgYnJlYWtwb2ludCBpcyB0b28gc21hbGwuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfcGF1c2VFdmVudHMoKSB7XG4gICAgdGhpcy5pc09uID0gZmFsc2U7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoe1xuICAgICAgJy56Zi5lcXVhbGl6ZXInOiB0aGlzLl9iaW5kSGFuZGxlci5vblBvc3RFcXVhbGl6ZWRCb3VuZCxcbiAgICAgICdyZXNpemVtZS56Zi50cmlnZ2VyJzogdGhpcy5fYmluZEhhbmRsZXIub25SZXNpemVNZUJvdW5kXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogZnVuY3Rpb24gdG8gaGFuZGxlICRlbGVtZW50cyByZXNpemVtZS56Zi50cmlnZ2VyLCB3aXRoIGJvdW5kIHRoaXMgb24gX2JpbmRIYW5kbGVyLm9uUmVzaXplTWVCb3VuZFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX29uUmVzaXplTWUoZSkge1xuICAgIHRoaXMuX3JlZmxvdygpO1xuICB9XG5cbiAgLyoqXG4gICAqIGZ1bmN0aW9uIHRvIGhhbmRsZSAkZWxlbWVudHMgcG9zdGVxdWFsaXplZC56Zi5lcXVhbGl6ZXIsIHdpdGggYm91bmQgdGhpcyBvbiBfYmluZEhhbmRsZXIub25Qb3N0RXF1YWxpemVkQm91bmRcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9vblBvc3RFcXVhbGl6ZWQoZSkge1xuICAgIGlmKGUudGFyZ2V0ICE9PSB0aGlzLiRlbGVtZW50WzBdKXsgdGhpcy5fcmVmbG93KCk7IH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBldmVudHMgZm9yIEVxdWFsaXplci5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB0aGlzLl9wYXVzZUV2ZW50cygpO1xuICAgIGlmKHRoaXMuaGFzTmVzdGVkKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQub24oJ3Bvc3RlcXVhbGl6ZWQuemYuZXF1YWxpemVyJywgdGhpcy5fYmluZEhhbmRsZXIub25Qb3N0RXF1YWxpemVkQm91bmQpO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy4kZWxlbWVudC5vbigncmVzaXplbWUuemYudHJpZ2dlcicsIHRoaXMuX2JpbmRIYW5kbGVyLm9uUmVzaXplTWVCb3VuZCk7XG4gICAgfVxuICAgIHRoaXMuaXNPbiA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSBjdXJyZW50IGJyZWFrcG9pbnQgdG8gdGhlIG1pbmltdW0gcmVxdWlyZWQgc2l6ZS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9jaGVja01RKCkge1xuICAgIHZhciB0b29TbWFsbCA9ICFGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdCh0aGlzLm9wdGlvbnMuZXF1YWxpemVPbik7XG4gICAgaWYodG9vU21hbGwpe1xuICAgICAgaWYodGhpcy5pc09uKXtcbiAgICAgICAgdGhpcy5fcGF1c2VFdmVudHMoKTtcbiAgICAgICAgdGhpcy4kd2F0Y2hlZC5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XG4gICAgICB9XG4gICAgfWVsc2V7XG4gICAgICBpZighdGhpcy5pc09uKXtcbiAgICAgICAgdGhpcy5fZXZlbnRzKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0b29TbWFsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIG5vb3AgdmVyc2lvbiBmb3IgdGhlIHBsdWdpblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2tpbGxzd2l0Y2goKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIG5lY2Vzc2FyeSBmdW5jdGlvbnMgdG8gdXBkYXRlIEVxdWFsaXplciB1cG9uIERPTSBjaGFuZ2VcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9yZWZsb3coKSB7XG4gICAgaWYoIXRoaXMub3B0aW9ucy5lcXVhbGl6ZU9uU3RhY2spe1xuICAgICAgaWYodGhpcy5faXNTdGFja2VkKCkpe1xuICAgICAgICB0aGlzLiR3YXRjaGVkLmNzcygnaGVpZ2h0JywgJ2F1dG8nKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmVxdWFsaXplQnlSb3cpIHtcbiAgICAgIHRoaXMuZ2V0SGVpZ2h0c0J5Um93KHRoaXMuYXBwbHlIZWlnaHRCeVJvdy5iaW5kKHRoaXMpKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuZ2V0SGVpZ2h0cyh0aGlzLmFwcGx5SGVpZ2h0LmJpbmQodGhpcykpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNYW51YWxseSBkZXRlcm1pbmVzIGlmIHRoZSBmaXJzdCAyIGVsZW1lbnRzIGFyZSAqTk9UKiBzdGFja2VkLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2lzU3RhY2tlZCgpIHtcbiAgICByZXR1cm4gdGhpcy4kd2F0Y2hlZFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgIT09IHRoaXMuJHdhdGNoZWRbMV0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmRzIHRoZSBvdXRlciBoZWlnaHRzIG9mIGNoaWxkcmVuIGNvbnRhaW5lZCB3aXRoaW4gYW4gRXF1YWxpemVyIHBhcmVudCBhbmQgcmV0dXJucyB0aGVtIGluIGFuIGFycmF5XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gQSBub24tb3B0aW9uYWwgY2FsbGJhY2sgdG8gcmV0dXJuIHRoZSBoZWlnaHRzIGFycmF5IHRvLlxuICAgKiBAcmV0dXJucyB7QXJyYXl9IGhlaWdodHMgLSBBbiBhcnJheSBvZiBoZWlnaHRzIG9mIGNoaWxkcmVuIHdpdGhpbiBFcXVhbGl6ZXIgY29udGFpbmVyXG4gICAqL1xuICBnZXRIZWlnaHRzKGNiKSB7XG4gICAgdmFyIGhlaWdodHMgPSBbXTtcbiAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0aGlzLiR3YXRjaGVkLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgIHRoaXMuJHdhdGNoZWRbaV0uc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nO1xuICAgICAgaGVpZ2h0cy5wdXNoKHRoaXMuJHdhdGNoZWRbaV0ub2Zmc2V0SGVpZ2h0KTtcbiAgICB9XG4gICAgY2IoaGVpZ2h0cyk7XG4gIH1cblxuICAvKipcbiAgICogRmluZHMgdGhlIG91dGVyIGhlaWdodHMgb2YgY2hpbGRyZW4gY29udGFpbmVkIHdpdGhpbiBhbiBFcXVhbGl6ZXIgcGFyZW50IGFuZCByZXR1cm5zIHRoZW0gaW4gYW4gYXJyYXlcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBBIG5vbi1vcHRpb25hbCBjYWxsYmFjayB0byByZXR1cm4gdGhlIGhlaWdodHMgYXJyYXkgdG8uXG4gICAqIEByZXR1cm5zIHtBcnJheX0gZ3JvdXBzIC0gQW4gYXJyYXkgb2YgaGVpZ2h0cyBvZiBjaGlsZHJlbiB3aXRoaW4gRXF1YWxpemVyIGNvbnRhaW5lciBncm91cGVkIGJ5IHJvdyB3aXRoIGVsZW1lbnQsaGVpZ2h0IGFuZCBtYXggYXMgbGFzdCBjaGlsZFxuICAgKi9cbiAgZ2V0SGVpZ2h0c0J5Um93KGNiKSB7XG4gICAgdmFyIGxhc3RFbFRvcE9mZnNldCA9ICh0aGlzLiR3YXRjaGVkLmxlbmd0aCA/IHRoaXMuJHdhdGNoZWQuZmlyc3QoKS5vZmZzZXQoKS50b3AgOiAwKSxcbiAgICAgICAgZ3JvdXBzID0gW10sXG4gICAgICAgIGdyb3VwID0gMDtcbiAgICAvL2dyb3VwIGJ5IFJvd1xuICAgIGdyb3Vwc1tncm91cF0gPSBbXTtcbiAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0aGlzLiR3YXRjaGVkLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgIHRoaXMuJHdhdGNoZWRbaV0uc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nO1xuICAgICAgLy9tYXliZSBjb3VsZCB1c2UgdGhpcy4kd2F0Y2hlZFtpXS5vZmZzZXRUb3BcbiAgICAgIHZhciBlbE9mZnNldFRvcCA9ICQodGhpcy4kd2F0Y2hlZFtpXSkub2Zmc2V0KCkudG9wO1xuICAgICAgaWYgKGVsT2Zmc2V0VG9wIT1sYXN0RWxUb3BPZmZzZXQpIHtcbiAgICAgICAgZ3JvdXArKztcbiAgICAgICAgZ3JvdXBzW2dyb3VwXSA9IFtdO1xuICAgICAgICBsYXN0RWxUb3BPZmZzZXQ9ZWxPZmZzZXRUb3A7XG4gICAgICB9XG4gICAgICBncm91cHNbZ3JvdXBdLnB1c2goW3RoaXMuJHdhdGNoZWRbaV0sdGhpcy4kd2F0Y2hlZFtpXS5vZmZzZXRIZWlnaHRdKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBqID0gMCwgbG4gPSBncm91cHMubGVuZ3RoOyBqIDwgbG47IGorKykge1xuICAgICAgdmFyIGhlaWdodHMgPSAkKGdyb3Vwc1tqXSkubWFwKGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzWzFdOyB9KS5nZXQoKTtcbiAgICAgIHZhciBtYXggICAgICAgICA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGhlaWdodHMpO1xuICAgICAgZ3JvdXBzW2pdLnB1c2gobWF4KTtcbiAgICB9XG4gICAgY2IoZ3JvdXBzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGFuZ2VzIHRoZSBDU1MgaGVpZ2h0IHByb3BlcnR5IG9mIGVhY2ggY2hpbGQgaW4gYW4gRXF1YWxpemVyIHBhcmVudCB0byBtYXRjaCB0aGUgdGFsbGVzdFxuICAgKiBAcGFyYW0ge2FycmF5fSBoZWlnaHRzIC0gQW4gYXJyYXkgb2YgaGVpZ2h0cyBvZiBjaGlsZHJlbiB3aXRoaW4gRXF1YWxpemVyIGNvbnRhaW5lclxuICAgKiBAZmlyZXMgRXF1YWxpemVyI3ByZWVxdWFsaXplZFxuICAgKiBAZmlyZXMgRXF1YWxpemVyI3Bvc3RlcXVhbGl6ZWRcbiAgICovXG4gIGFwcGx5SGVpZ2h0KGhlaWdodHMpIHtcbiAgICB2YXIgbWF4ID0gTWF0aC5tYXguYXBwbHkobnVsbCwgaGVpZ2h0cyk7XG4gICAgLyoqXG4gICAgICogRmlyZXMgYmVmb3JlIHRoZSBoZWlnaHRzIGFyZSBhcHBsaWVkXG4gICAgICogQGV2ZW50IEVxdWFsaXplciNwcmVlcXVhbGl6ZWRcbiAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3ByZWVxdWFsaXplZC56Zi5lcXVhbGl6ZXInKTtcblxuICAgIHRoaXMuJHdhdGNoZWQuY3NzKCdoZWlnaHQnLCBtYXgpO1xuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgaGVpZ2h0cyBoYXZlIGJlZW4gYXBwbGllZFxuICAgICAqIEBldmVudCBFcXVhbGl6ZXIjcG9zdGVxdWFsaXplZFxuICAgICAqL1xuICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3Bvc3RlcXVhbGl6ZWQuemYuZXF1YWxpemVyJyk7XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlcyB0aGUgQ1NTIGhlaWdodCBwcm9wZXJ0eSBvZiBlYWNoIGNoaWxkIGluIGFuIEVxdWFsaXplciBwYXJlbnQgdG8gbWF0Y2ggdGhlIHRhbGxlc3QgYnkgcm93XG4gICAqIEBwYXJhbSB7YXJyYXl9IGdyb3VwcyAtIEFuIGFycmF5IG9mIGhlaWdodHMgb2YgY2hpbGRyZW4gd2l0aGluIEVxdWFsaXplciBjb250YWluZXIgZ3JvdXBlZCBieSByb3cgd2l0aCBlbGVtZW50LGhlaWdodCBhbmQgbWF4IGFzIGxhc3QgY2hpbGRcbiAgICogQGZpcmVzIEVxdWFsaXplciNwcmVlcXVhbGl6ZWRcbiAgICogQGZpcmVzIEVxdWFsaXplciNwcmVlcXVhbGl6ZWRSb3dcbiAgICogQGZpcmVzIEVxdWFsaXplciNwb3N0ZXF1YWxpemVkUm93XG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcG9zdGVxdWFsaXplZFxuICAgKi9cbiAgYXBwbHlIZWlnaHRCeVJvdyhncm91cHMpIHtcbiAgICAvKipcbiAgICAgKiBGaXJlcyBiZWZvcmUgdGhlIGhlaWdodHMgYXJlIGFwcGxpZWRcbiAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3ByZWVxdWFsaXplZC56Zi5lcXVhbGl6ZXInKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gZ3JvdXBzLmxlbmd0aDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgdmFyIGdyb3Vwc0lMZW5ndGggPSBncm91cHNbaV0ubGVuZ3RoLFxuICAgICAgICAgIG1heCA9IGdyb3Vwc1tpXVtncm91cHNJTGVuZ3RoIC0gMV07XG4gICAgICBpZiAoZ3JvdXBzSUxlbmd0aDw9Mikge1xuICAgICAgICAkKGdyb3Vwc1tpXVswXVswXSkuY3NzKHsnaGVpZ2h0JzonYXV0byd9KTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvKipcbiAgICAgICAgKiBGaXJlcyBiZWZvcmUgdGhlIGhlaWdodHMgcGVyIHJvdyBhcmUgYXBwbGllZFxuICAgICAgICAqIEBldmVudCBFcXVhbGl6ZXIjcHJlZXF1YWxpemVkUm93XG4gICAgICAgICovXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3ByZWVxdWFsaXplZHJvdy56Zi5lcXVhbGl6ZXInKTtcbiAgICAgIGZvciAodmFyIGogPSAwLCBsZW5KID0gKGdyb3Vwc0lMZW5ndGgtMSk7IGogPCBsZW5KIDsgaisrKSB7XG4gICAgICAgICQoZ3JvdXBzW2ldW2pdWzBdKS5jc3MoeydoZWlnaHQnOm1heH0pO1xuICAgICAgfVxuICAgICAgLyoqXG4gICAgICAgICogRmlyZXMgd2hlbiB0aGUgaGVpZ2h0cyBwZXIgcm93IGhhdmUgYmVlbiBhcHBsaWVkXG4gICAgICAgICogQGV2ZW50IEVxdWFsaXplciNwb3N0ZXF1YWxpemVkUm93XG4gICAgICAgICovXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3Bvc3RlcXVhbGl6ZWRyb3cuemYuZXF1YWxpemVyJyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIGhlaWdodHMgaGF2ZSBiZWVuIGFwcGxpZWRcbiAgICAgKi9cbiAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwb3N0ZXF1YWxpemVkLnpmLmVxdWFsaXplcicpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIEVxdWFsaXplci5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuX3BhdXNlRXZlbnRzKCk7XG4gICAgdGhpcy4kd2F0Y2hlZC5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWZhdWx0IHNldHRpbmdzIGZvciBwbHVnaW5cbiAqL1xuRXF1YWxpemVyLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogRW5hYmxlIGhlaWdodCBlcXVhbGl6YXRpb24gd2hlbiBzdGFja2VkIG9uIHNtYWxsZXIgc2NyZWVucy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBlcXVhbGl6ZU9uU3RhY2s6IGZhbHNlLFxuICAvKipcbiAgICogRW5hYmxlIGhlaWdodCBlcXVhbGl6YXRpb24gcm93IGJ5IHJvdy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZXF1YWxpemVCeVJvdzogZmFsc2UsXG4gIC8qKlxuICAgKiBTdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBtaW5pbXVtIGJyZWFrcG9pbnQgc2l6ZSB0aGUgcGx1Z2luIHNob3VsZCBlcXVhbGl6ZSBoZWlnaHRzIG9uLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdtZWRpdW0nXG4gICAqL1xuICBlcXVhbGl6ZU9uOiAnJ1xufTtcblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKEVxdWFsaXplciwgJ0VxdWFsaXplcicpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogT2ZmQ2FudmFzIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5vZmZjYW52YXNcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cbiAqL1xuXG5jbGFzcyBPZmZDYW52YXMge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhbiBvZmYtY2FudmFzIHdyYXBwZXIuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI2luaXRcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGluaXRpYWxpemUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgT2ZmQ2FudmFzLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG4gICAgdGhpcy4kbGFzdFRyaWdnZXIgPSAkKCk7XG4gICAgdGhpcy4kdHJpZ2dlcnMgPSAkKCk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdPZmZDYW52YXMnKVxuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ09mZkNhbnZhcycsIHtcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnXG4gICAgfSk7XG5cbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgb2ZmLWNhbnZhcyB3cmFwcGVyIGJ5IGFkZGluZyB0aGUgZXhpdCBvdmVybGF5IChpZiBuZWVkZWQpLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBpZCA9IHRoaXMuJGVsZW1lbnQuYXR0cignaWQnKTtcblxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuXG4gICAgLy8gRmluZCB0cmlnZ2VycyB0aGF0IGFmZmVjdCB0aGlzIGVsZW1lbnQgYW5kIGFkZCBhcmlhLWV4cGFuZGVkIHRvIHRoZW1cbiAgICB0aGlzLiR0cmlnZ2VycyA9ICQoZG9jdW1lbnQpXG4gICAgICAuZmluZCgnW2RhdGEtb3Blbj1cIicraWQrJ1wiXSwgW2RhdGEtY2xvc2U9XCInK2lkKydcIl0sIFtkYXRhLXRvZ2dsZT1cIicraWQrJ1wiXScpXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpXG4gICAgICAuYXR0cignYXJpYS1jb250cm9scycsIGlkKTtcblxuICAgIC8vIEFkZCBhIGNsb3NlIHRyaWdnZXIgb3ZlciB0aGUgYm9keSBpZiBuZWNlc3NhcnlcbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljaykge1xuICAgICAgaWYgKCQoJy5qcy1vZmYtY2FudmFzLWV4aXQnKS5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy4kZXhpdGVyID0gJCgnLmpzLW9mZi1jYW52YXMtZXhpdCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGV4aXRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBleGl0ZXIuc2V0QXR0cmlidXRlKCdjbGFzcycsICdqcy1vZmYtY2FudmFzLWV4aXQnKTtcbiAgICAgICAgJCgnW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XScpLmFwcGVuZChleGl0ZXIpO1xuXG4gICAgICAgIHRoaXMuJGV4aXRlciA9ICQoZXhpdGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCA9IHRoaXMub3B0aW9ucy5pc1JldmVhbGVkIHx8IG5ldyBSZWdFeHAodGhpcy5vcHRpb25zLnJldmVhbENsYXNzLCAnZycpLnRlc3QodGhpcy4kZWxlbWVudFswXS5jbGFzc05hbWUpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5pc1JldmVhbGVkKSB7XG4gICAgICB0aGlzLm9wdGlvbnMucmV2ZWFsT24gPSB0aGlzLm9wdGlvbnMucmV2ZWFsT24gfHwgdGhpcy4kZWxlbWVudFswXS5jbGFzc05hbWUubWF0Y2goLyhyZXZlYWwtZm9yLW1lZGl1bXxyZXZlYWwtZm9yLWxhcmdlKS9nKVswXS5zcGxpdCgnLScpWzJdO1xuICAgICAgdGhpcy5fc2V0TVFDaGVja2VyKCk7XG4gICAgfVxuICAgIGlmICghdGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lKSB7XG4gICAgICB0aGlzLm9wdGlvbnMudHJhbnNpdGlvblRpbWUgPSBwYXJzZUZsb2F0KHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKCQoJ1tkYXRhLW9mZi1jYW52YXMtd3JhcHBlcl0nKVswXSkudHJhbnNpdGlvbkR1cmF0aW9uKSAqIDEwMDA7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgdG8gdGhlIG9mZi1jYW52YXMgd3JhcHBlciBhbmQgdGhlIGV4aXQgb3ZlcmxheS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYudHJpZ2dlciAuemYub2ZmY2FudmFzJykub24oe1xuICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxuICAgICAgJ2Nsb3NlLnpmLnRyaWdnZXInOiB0aGlzLmNsb3NlLmJpbmQodGhpcyksXG4gICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxuICAgICAgJ2tleWRvd24uemYub2ZmY2FudmFzJzogdGhpcy5faGFuZGxlS2V5Ym9hcmQuYmluZCh0aGlzKVxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgJiYgdGhpcy4kZXhpdGVyLmxlbmd0aCkge1xuICAgICAgdGhpcy4kZXhpdGVyLm9uKHsnY2xpY2suemYub2ZmY2FudmFzJzogdGhpcy5jbG9zZS5iaW5kKHRoaXMpfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgZXZlbnQgbGlzdGVuZXIgZm9yIGVsZW1lbnRzIHRoYXQgd2lsbCByZXZlYWwgYXQgY2VydGFpbiBicmVha3BvaW50cy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9zZXRNUUNoZWNrZXIoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QoX3RoaXMub3B0aW9ucy5yZXZlYWxPbikpIHtcbiAgICAgICAgX3RoaXMucmV2ZWFsKHRydWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX3RoaXMucmV2ZWFsKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9KS5vbmUoJ2xvYWQuemYub2ZmY2FudmFzJywgZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QoX3RoaXMub3B0aW9ucy5yZXZlYWxPbikpIHtcbiAgICAgICAgX3RoaXMucmV2ZWFsKHRydWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgdGhlIHJldmVhbGluZy9oaWRpbmcgdGhlIG9mZi1jYW52YXMgYXQgYnJlYWtwb2ludHMsIG5vdCB0aGUgc2FtZSBhcyBvcGVuLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGlzUmV2ZWFsZWQgLSB0cnVlIGlmIGVsZW1lbnQgc2hvdWxkIGJlIHJldmVhbGVkLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHJldmVhbChpc1JldmVhbGVkKSB7XG4gICAgdmFyICRjbG9zZXIgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLWNsb3NlXScpO1xuICAgIGlmIChpc1JldmVhbGVkKSB7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB0aGlzLmlzUmV2ZWFsZWQgPSB0cnVlO1xuICAgICAgLy8gaWYgKCF0aGlzLm9wdGlvbnMuZm9yY2VUb3ApIHtcbiAgICAgIC8vICAgdmFyIHNjcm9sbFBvcyA9IHBhcnNlSW50KHdpbmRvdy5wYWdlWU9mZnNldCk7XG4gICAgICAvLyAgIHRoaXMuJGVsZW1lbnRbMF0uc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgwLCcgKyBzY3JvbGxQb3MgKyAncHgpJztcbiAgICAgIC8vIH1cbiAgICAgIC8vIGlmICh0aGlzLm9wdGlvbnMuaXNTdGlja3kpIHsgdGhpcy5fc3RpY2soKTsgfVxuICAgICAgdGhpcy4kZWxlbWVudC5vZmYoJ29wZW4uemYudHJpZ2dlciB0b2dnbGUuemYudHJpZ2dlcicpO1xuICAgICAgaWYgKCRjbG9zZXIubGVuZ3RoKSB7ICRjbG9zZXIuaGlkZSgpOyB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaXNSZXZlYWxlZCA9IGZhbHNlO1xuICAgICAgLy8gaWYgKHRoaXMub3B0aW9ucy5pc1N0aWNreSB8fCAhdGhpcy5vcHRpb25zLmZvcmNlVG9wKSB7XG4gICAgICAvLyAgIHRoaXMuJGVsZW1lbnRbMF0uc3R5bGUudHJhbnNmb3JtID0gJyc7XG4gICAgICAvLyAgICQod2luZG93KS5vZmYoJ3Njcm9sbC56Zi5vZmZjYW52YXMnKTtcbiAgICAgIC8vIH1cbiAgICAgIHRoaXMuJGVsZW1lbnQub24oe1xuICAgICAgICAnb3Blbi56Zi50cmlnZ2VyJzogdGhpcy5vcGVuLmJpbmQodGhpcyksXG4gICAgICAgICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcylcbiAgICAgIH0pO1xuICAgICAgaWYgKCRjbG9zZXIubGVuZ3RoKSB7XG4gICAgICAgICRjbG9zZXIuc2hvdygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyB0aGUgb2ZmLWNhbnZhcyBtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gRXZlbnQgb2JqZWN0IHBhc3NlZCBmcm9tIGxpc3RlbmVyLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gdHJpZ2dlciAtIGVsZW1lbnQgdGhhdCB0cmlnZ2VyZWQgdGhlIG9mZi1jYW52YXMgdG8gb3Blbi5cbiAgICogQGZpcmVzIE9mZkNhbnZhcyNvcGVuZWRcbiAgICovXG4gIG9wZW4oZXZlbnQsIHRyaWdnZXIpIHtcbiAgICBpZiAodGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpIHx8IHRoaXMuaXNSZXZlYWxlZCkgeyByZXR1cm47IH1cbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmZvcmNlVG9wKSB7XG4gICAgICAkKCdib2R5Jykuc2Nyb2xsVG9wKDApO1xuICAgIH1cbiAgICAvLyB3aW5kb3cucGFnZVlPZmZzZXQgPSAwO1xuXG4gICAgLy8gaWYgKCF0aGlzLm9wdGlvbnMuZm9yY2VUb3ApIHtcbiAgICAvLyAgIHZhciBzY3JvbGxQb3MgPSBwYXJzZUludCh3aW5kb3cucGFnZVlPZmZzZXQpO1xuICAgIC8vICAgdGhpcy4kZWxlbWVudFswXS5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDAsJyArIHNjcm9sbFBvcyArICdweCknO1xuICAgIC8vICAgaWYgKHRoaXMuJGV4aXRlci5sZW5ndGgpIHtcbiAgICAvLyAgICAgdGhpcy4kZXhpdGVyWzBdLnN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoMCwnICsgc2Nyb2xsUG9zICsgJ3B4KSc7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIG9mZi1jYW52YXMgbWVudSBvcGVucy5cbiAgICAgKiBAZXZlbnQgT2ZmQ2FudmFzI29wZW5lZFxuICAgICAqL1xuXG4gICAgdmFyICR3cmFwcGVyID0gJCgnW2RhdGEtb2ZmLWNhbnZhcy13cmFwcGVyXScpO1xuICAgICR3cmFwcGVyLmFkZENsYXNzKCdpcy1vZmYtY2FudmFzLW9wZW4gaXMtb3Blbi0nKyBfdGhpcy5vcHRpb25zLnBvc2l0aW9uKTtcblxuICAgIF90aGlzLiRlbGVtZW50LmFkZENsYXNzKCdpcy1vcGVuJylcblxuICAgICAgLy8gaWYgKF90aGlzLm9wdGlvbnMuaXNTdGlja3kpIHtcbiAgICAgIC8vICAgX3RoaXMuX3N0aWNrKCk7XG4gICAgICAvLyB9XG5cbiAgICB0aGlzLiR0cmlnZ2Vycy5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKTtcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJylcbiAgICAgICAgLnRyaWdnZXIoJ29wZW5lZC56Zi5vZmZjYW52YXMnKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKSB7XG4gICAgICB0aGlzLiRleGl0ZXIuYWRkQ2xhc3MoJ2lzLXZpc2libGUnKTtcbiAgICB9XG5cbiAgICBpZiAodHJpZ2dlcikge1xuICAgICAgdGhpcy4kbGFzdFRyaWdnZXIgPSB0cmlnZ2VyO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b0ZvY3VzKSB7XG4gICAgICAkd3JhcHBlci5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKCR3cmFwcGVyKSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmKF90aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykpIHsgLy8gaGFuZGxlIGRvdWJsZSBjbGlja3NcbiAgICAgICAgICBfdGhpcy4kZWxlbWVudC5hdHRyKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgICAgIF90aGlzLiRlbGVtZW50LmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMudHJhcEZvY3VzKSB7XG4gICAgICAkd3JhcHBlci5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKCR3cmFwcGVyKSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmKF90aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykpIHsgLy8gaGFuZGxlIGRvdWJsZSBjbGlja3NcbiAgICAgICAgICBfdGhpcy4kZWxlbWVudC5hdHRyKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgICAgIF90aGlzLnRyYXBGb2N1cygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVHJhcHMgZm9jdXMgd2l0aGluIHRoZSBvZmZjYW52YXMgb24gb3Blbi5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF90cmFwRm9jdXMoKSB7XG4gICAgdmFyIGZvY3VzYWJsZSA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZSh0aGlzLiRlbGVtZW50KSxcbiAgICAgICAgZmlyc3QgPSBmb2N1c2FibGUuZXEoMCksXG4gICAgICAgIGxhc3QgPSBmb2N1c2FibGUuZXEoLTEpO1xuXG4gICAgZm9jdXNhYmxlLm9mZignLnpmLm9mZmNhbnZhcycpLm9uKCdrZXlkb3duLnpmLm9mZmNhbnZhcycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBrZXkgPSBGb3VuZGF0aW9uLktleWJvYXJkLnBhcnNlS2V5KGUpO1xuICAgICAgaWYgKGtleSA9PT0gJ1RBQicgJiYgZS50YXJnZXQgPT09IGxhc3RbMF0pIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBmaXJzdC5mb2N1cygpO1xuICAgICAgfVxuICAgICAgaWYgKGtleSA9PT0gJ1NISUZUX1RBQicgJiYgZS50YXJnZXQgPT09IGZpcnN0WzBdKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgbGFzdC5mb2N1cygpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgb2ZmY2FudmFzIHRvIGFwcGVhciBzdGlja3kgdXRpbGl6aW5nIHRyYW5zbGF0ZSBwcm9wZXJ0aWVzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgLy8gT2ZmQ2FudmFzLnByb3RvdHlwZS5fc3RpY2sgPSBmdW5jdGlvbigpIHtcbiAgLy8gICB2YXIgZWxTdHlsZSA9IHRoaXMuJGVsZW1lbnRbMF0uc3R5bGU7XG4gIC8vXG4gIC8vICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spIHtcbiAgLy8gICAgIHZhciBleGl0U3R5bGUgPSB0aGlzLiRleGl0ZXJbMF0uc3R5bGU7XG4gIC8vICAgfVxuICAvL1xuICAvLyAgICQod2luZG93KS5vbignc2Nyb2xsLnpmLm9mZmNhbnZhcycsIGZ1bmN0aW9uKGUpIHtcbiAgLy8gICAgIGNvbnNvbGUubG9nKGUpO1xuICAvLyAgICAgdmFyIHBhZ2VZID0gd2luZG93LnBhZ2VZT2Zmc2V0O1xuICAvLyAgICAgZWxTdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDAsJyArIHBhZ2VZICsgJ3B4KSc7XG4gIC8vICAgICBpZiAoZXhpdFN0eWxlICE9PSB1bmRlZmluZWQpIHsgZXhpdFN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoMCwnICsgcGFnZVkgKyAncHgpJzsgfVxuICAvLyAgIH0pO1xuICAvLyAgIC8vIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignc3R1Y2suemYub2ZmY2FudmFzJyk7XG4gIC8vIH07XG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIG9mZi1jYW52YXMgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gb3B0aW9uYWwgY2IgdG8gZmlyZSBhZnRlciBjbG9zdXJlLlxuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI2Nsb3NlZFxuICAgKi9cbiAgY2xvc2UoY2IpIHtcbiAgICBpZiAoIXRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSB8fCB0aGlzLmlzUmV2ZWFsZWQpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gIEZvdW5kYXRpb24uTW92ZSh0aGlzLm9wdGlvbnMudHJhbnNpdGlvblRpbWUsIHRoaXMuJGVsZW1lbnQsIGZ1bmN0aW9uKCkge1xuICAgICQoJ1tkYXRhLW9mZi1jYW52YXMtd3JhcHBlcl0nKS5yZW1vdmVDbGFzcyhgaXMtb2ZmLWNhbnZhcy1vcGVuIGlzLW9wZW4tJHtfdGhpcy5vcHRpb25zLnBvc2l0aW9ufWApO1xuICAgIF90aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XG4gICAgICAvLyBGb3VuZGF0aW9uLl9yZWZsb3coKTtcbiAgICAvLyB9KTtcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKVxuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyB3aGVuIHRoZSBvZmYtY2FudmFzIG1lbnUgb3BlbnMuXG4gICAgICAgKiBAZXZlbnQgT2ZmQ2FudmFzI2Nsb3NlZFxuICAgICAgICovXG4gICAgICAgIC50cmlnZ2VyKCdjbG9zZWQuemYub2ZmY2FudmFzJyk7XG4gICAgLy8gaWYgKF90aGlzLm9wdGlvbnMuaXNTdGlja3kgfHwgIV90aGlzLm9wdGlvbnMuZm9yY2VUb3ApIHtcbiAgICAvLyAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIF90aGlzLiRlbGVtZW50WzBdLnN0eWxlLnRyYW5zZm9ybSA9ICcnO1xuICAgIC8vICAgICAkKHdpbmRvdykub2ZmKCdzY3JvbGwuemYub2ZmY2FudmFzJyk7XG4gICAgLy8gICB9LCB0aGlzLm9wdGlvbnMudHJhbnNpdGlvblRpbWUpO1xuICAgIC8vIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljaykge1xuICAgICAgdGhpcy4kZXhpdGVyLnJlbW92ZUNsYXNzKCdpcy12aXNpYmxlJyk7XG4gICAgfVxuXG4gICAgdGhpcy4kdHJpZ2dlcnMuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMudHJhcEZvY3VzKSB7XG4gICAgICAkKCdbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdJykucmVtb3ZlQXR0cigndGFiaW5kZXgnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlcyB0aGUgb2ZmLWNhbnZhcyBtZW51IG9wZW4gb3IgY2xvc2VkLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gRXZlbnQgb2JqZWN0IHBhc3NlZCBmcm9tIGxpc3RlbmVyLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gdHJpZ2dlciAtIGVsZW1lbnQgdGhhdCB0cmlnZ2VyZWQgdGhlIG9mZi1jYW52YXMgdG8gb3Blbi5cbiAgICovXG4gIHRvZ2dsZShldmVudCwgdHJpZ2dlcikge1xuICAgIGlmICh0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykpIHtcbiAgICAgIHRoaXMuY2xvc2UoZXZlbnQsIHRyaWdnZXIpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMub3BlbihldmVudCwgdHJpZ2dlcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMga2V5Ym9hcmQgaW5wdXQgd2hlbiBkZXRlY3RlZC4gV2hlbiB0aGUgZXNjYXBlIGtleSBpcyBwcmVzc2VkLCB0aGUgb2ZmLWNhbnZhcyBtZW51IGNsb3NlcywgYW5kIGZvY3VzIGlzIHJlc3RvcmVkIHRvIHRoZSBlbGVtZW50IHRoYXQgb3BlbmVkIHRoZSBtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9oYW5kbGVLZXlib2FyZChlKSB7XG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ09mZkNhbnZhcycsIHtcbiAgICAgIGNsb3NlOiAoKSA9PiB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgdGhpcy4kbGFzdFRyaWdnZXIuZm9jdXMoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuICAgICAgaGFuZGxlZDogKCkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIG9mZmNhbnZhcyBwbHVnaW4uXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmNsb3NlKCk7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50cmlnZ2VyIC56Zi5vZmZjYW52YXMnKTtcbiAgICB0aGlzLiRleGl0ZXIub2ZmKCcuemYub2ZmY2FudmFzJyk7XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuT2ZmQ2FudmFzLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogQWxsb3cgdGhlIHVzZXIgdG8gY2xpY2sgb3V0c2lkZSBvZiB0aGUgbWVudSB0byBjbG9zZSBpdC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2s6IHRydWUsXG5cbiAgLyoqXG4gICAqIEFtb3VudCBvZiB0aW1lIGluIG1zIHRoZSBvcGVuIGFuZCBjbG9zZSB0cmFuc2l0aW9uIHJlcXVpcmVzLiBJZiBub25lIHNlbGVjdGVkLCBwdWxscyBmcm9tIGJvZHkgc3R5bGUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgNTAwXG4gICAqL1xuICB0cmFuc2l0aW9uVGltZTogMCxcblxuICAvKipcbiAgICogRGlyZWN0aW9uIHRoZSBvZmZjYW52YXMgb3BlbnMgZnJvbS4gRGV0ZXJtaW5lcyBjbGFzcyBhcHBsaWVkIHRvIGJvZHkuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgbGVmdFxuICAgKi9cbiAgcG9zaXRpb246ICdsZWZ0JyxcblxuICAvKipcbiAgICogRm9yY2UgdGhlIHBhZ2UgdG8gc2Nyb2xsIHRvIHRvcCBvbiBvcGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGZvcmNlVG9wOiB0cnVlLFxuXG4gIC8qKlxuICAgKiBBbGxvdyB0aGUgb2ZmY2FudmFzIHRvIHJlbWFpbiBvcGVuIGZvciBjZXJ0YWluIGJyZWFrcG9pbnRzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBpc1JldmVhbGVkOiBmYWxzZSxcblxuICAvKipcbiAgICogQnJlYWtwb2ludCBhdCB3aGljaCB0byByZXZlYWwuIEpTIHdpbGwgdXNlIGEgUmVnRXhwIHRvIHRhcmdldCBzdGFuZGFyZCBjbGFzc2VzLCBpZiBjaGFuZ2luZyBjbGFzc25hbWVzLCBwYXNzIHlvdXIgY2xhc3Mgd2l0aCB0aGUgYHJldmVhbENsYXNzYCBvcHRpb24uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgcmV2ZWFsLWZvci1sYXJnZVxuICAgKi9cbiAgcmV2ZWFsT246IG51bGwsXG5cbiAgLyoqXG4gICAqIEZvcmNlIGZvY3VzIHRvIHRoZSBvZmZjYW52YXMgb24gb3Blbi4gSWYgdHJ1ZSwgd2lsbCBmb2N1cyB0aGUgb3BlbmluZyB0cmlnZ2VyIG9uIGNsb3NlLiBTZXRzIHRhYmluZGV4IG9mIFtkYXRhLW9mZi1jYW52YXMtY29udGVudF0gdG8gLTEgZm9yIGFjY2Vzc2liaWxpdHkgcHVycG9zZXMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgYXV0b0ZvY3VzOiB0cnVlLFxuXG4gIC8qKlxuICAgKiBDbGFzcyB1c2VkIHRvIGZvcmNlIGFuIG9mZmNhbnZhcyB0byByZW1haW4gb3Blbi4gRm91bmRhdGlvbiBkZWZhdWx0cyBmb3IgdGhpcyBhcmUgYHJldmVhbC1mb3ItbGFyZ2VgICYgYHJldmVhbC1mb3ItbWVkaXVtYC5cbiAgICogQG9wdGlvblxuICAgKiBUT0RPIGltcHJvdmUgdGhlIHJlZ2V4IHRlc3RpbmcgZm9yIHRoaXMuXG4gICAqIEBleGFtcGxlIHJldmVhbC1mb3ItbGFyZ2VcbiAgICovXG4gIHJldmVhbENsYXNzOiAncmV2ZWFsLWZvci0nLFxuXG4gIC8qKlxuICAgKiBUcmlnZ2VycyBvcHRpb25hbCBmb2N1cyB0cmFwcGluZyB3aGVuIG9wZW5pbmcgYW4gb2ZmY2FudmFzLiBTZXRzIHRhYmluZGV4IG9mIFtkYXRhLW9mZi1jYW52YXMtY29udGVudF0gdG8gLTEgZm9yIGFjY2Vzc2liaWxpdHkgcHVycG9zZXMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgdHJhcEZvY3VzOiBmYWxzZVxufVxuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oT2ZmQ2FudmFzLCAnT2ZmQ2FudmFzJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBSZXNwb25zaXZlTWVudSBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ucmVzcG9uc2l2ZU1lbnVcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5hY2NvcmRpb25NZW51XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmRyaWxsZG93blxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5kcm9wZG93bi1tZW51XG4gKi9cblxuY2xhc3MgUmVzcG9uc2l2ZU1lbnUge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIHJlc3BvbnNpdmUgbWVudS5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBSZXNwb25zaXZlTWVudSNpbml0XG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYSBkcm9wZG93biBtZW51LlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgdGhpcy5ydWxlcyA9IHRoaXMuJGVsZW1lbnQuZGF0YSgncmVzcG9uc2l2ZS1tZW51Jyk7XG4gICAgdGhpcy5jdXJyZW50TXEgPSBudWxsO1xuICAgIHRoaXMuY3VycmVudFBsdWdpbiA9IG51bGw7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdSZXNwb25zaXZlTWVudScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBNZW51IGJ5IHBhcnNpbmcgdGhlIGNsYXNzZXMgZnJvbSB0aGUgJ2RhdGEtUmVzcG9uc2l2ZU1lbnUnIGF0dHJpYnV0ZSBvbiB0aGUgZWxlbWVudC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICAvLyBUaGUgZmlyc3QgdGltZSBhbiBJbnRlcmNoYW5nZSBwbHVnaW4gaXMgaW5pdGlhbGl6ZWQsIHRoaXMucnVsZXMgaXMgY29udmVydGVkIGZyb20gYSBzdHJpbmcgb2YgXCJjbGFzc2VzXCIgdG8gYW4gb2JqZWN0IG9mIHJ1bGVzXG4gICAgaWYgKHR5cGVvZiB0aGlzLnJ1bGVzID09PSAnc3RyaW5nJykge1xuICAgICAgbGV0IHJ1bGVzVHJlZSA9IHt9O1xuXG4gICAgICAvLyBQYXJzZSBydWxlcyBmcm9tIFwiY2xhc3Nlc1wiIHB1bGxlZCBmcm9tIGRhdGEgYXR0cmlidXRlXG4gICAgICBsZXQgcnVsZXMgPSB0aGlzLnJ1bGVzLnNwbGl0KCcgJyk7XG5cbiAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBldmVyeSBydWxlIGZvdW5kXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBydWxlID0gcnVsZXNbaV0uc3BsaXQoJy0nKTtcbiAgICAgICAgbGV0IHJ1bGVTaXplID0gcnVsZS5sZW5ndGggPiAxID8gcnVsZVswXSA6ICdzbWFsbCc7XG4gICAgICAgIGxldCBydWxlUGx1Z2luID0gcnVsZS5sZW5ndGggPiAxID8gcnVsZVsxXSA6IHJ1bGVbMF07XG5cbiAgICAgICAgaWYgKE1lbnVQbHVnaW5zW3J1bGVQbHVnaW5dICE9PSBudWxsKSB7XG4gICAgICAgICAgcnVsZXNUcmVlW3J1bGVTaXplXSA9IE1lbnVQbHVnaW5zW3J1bGVQbHVnaW5dO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMucnVsZXMgPSBydWxlc1RyZWU7XG4gICAgfVxuXG4gICAgaWYgKCEkLmlzRW1wdHlPYmplY3QodGhpcy5ydWxlcykpIHtcbiAgICAgIHRoaXMuX2NoZWNrTWVkaWFRdWVyaWVzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgdGhlIE1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLl9jaGVja01lZGlhUXVlcmllcygpO1xuICAgIH0pO1xuICAgIC8vICQod2luZG93KS5vbigncmVzaXplLnpmLlJlc3BvbnNpdmVNZW51JywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICBfdGhpcy5fY2hlY2tNZWRpYVF1ZXJpZXMoKTtcbiAgICAvLyB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgdGhlIGN1cnJlbnQgc2NyZWVuIHdpZHRoIGFnYWluc3QgYXZhaWxhYmxlIG1lZGlhIHF1ZXJpZXMuIElmIHRoZSBtZWRpYSBxdWVyeSBoYXMgY2hhbmdlZCwgYW5kIHRoZSBwbHVnaW4gbmVlZGVkIGhhcyBjaGFuZ2VkLCB0aGUgcGx1Z2lucyB3aWxsIHN3YXAgb3V0LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9jaGVja01lZGlhUXVlcmllcygpIHtcbiAgICB2YXIgbWF0Y2hlZE1xLCBfdGhpcyA9IHRoaXM7XG4gICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGVhY2ggcnVsZSBhbmQgZmluZCB0aGUgbGFzdCBtYXRjaGluZyBydWxlXG4gICAgJC5lYWNoKHRoaXMucnVsZXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KGtleSkpIHtcbiAgICAgICAgbWF0Y2hlZE1xID0ga2V5O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gTm8gbWF0Y2g/IE5vIGRpY2VcbiAgICBpZiAoIW1hdGNoZWRNcSkgcmV0dXJuO1xuXG4gICAgLy8gUGx1Z2luIGFscmVhZHkgaW5pdGlhbGl6ZWQ/IFdlIGdvb2RcbiAgICBpZiAodGhpcy5jdXJyZW50UGx1Z2luIGluc3RhbmNlb2YgdGhpcy5ydWxlc1ttYXRjaGVkTXFdLnBsdWdpbikgcmV0dXJuO1xuXG4gICAgLy8gUmVtb3ZlIGV4aXN0aW5nIHBsdWdpbi1zcGVjaWZpYyBDU1MgY2xhc3Nlc1xuICAgICQuZWFjaChNZW51UGx1Z2lucywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgX3RoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3ModmFsdWUuY3NzQ2xhc3MpO1xuICAgIH0pO1xuXG4gICAgLy8gQWRkIHRoZSBDU1MgY2xhc3MgZm9yIHRoZSBuZXcgcGx1Z2luXG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLnJ1bGVzW21hdGNoZWRNcV0uY3NzQ2xhc3MpO1xuXG4gICAgLy8gQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBuZXcgcGx1Z2luXG4gICAgaWYgKHRoaXMuY3VycmVudFBsdWdpbikgdGhpcy5jdXJyZW50UGx1Z2luLmRlc3Ryb3koKTtcbiAgICB0aGlzLmN1cnJlbnRQbHVnaW4gPSBuZXcgdGhpcy5ydWxlc1ttYXRjaGVkTXFdLnBsdWdpbih0aGlzLiRlbGVtZW50LCB7fSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGluc3RhbmNlIG9mIHRoZSBjdXJyZW50IHBsdWdpbiBvbiB0aGlzIGVsZW1lbnQsIGFzIHdlbGwgYXMgdGhlIHdpbmRvdyByZXNpemUgaGFuZGxlciB0aGF0IHN3aXRjaGVzIHRoZSBwbHVnaW5zIG91dC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuY3VycmVudFBsdWdpbi5kZXN0cm95KCk7XG4gICAgJCh3aW5kb3cpLm9mZignLnpmLlJlc3BvbnNpdmVNZW51Jyk7XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cblJlc3BvbnNpdmVNZW51LmRlZmF1bHRzID0ge307XG5cbi8vIFRoZSBwbHVnaW4gbWF0Y2hlcyB0aGUgcGx1Z2luIGNsYXNzZXMgd2l0aCB0aGVzZSBwbHVnaW4gaW5zdGFuY2VzLlxudmFyIE1lbnVQbHVnaW5zID0ge1xuICBkcm9wZG93bjoge1xuICAgIGNzc0NsYXNzOiAnZHJvcGRvd24nLFxuICAgIHBsdWdpbjogRm91bmRhdGlvbi5fcGx1Z2luc1snZHJvcGRvd24tbWVudSddIHx8IG51bGxcbiAgfSxcbiBkcmlsbGRvd246IHtcbiAgICBjc3NDbGFzczogJ2RyaWxsZG93bicsXG4gICAgcGx1Z2luOiBGb3VuZGF0aW9uLl9wbHVnaW5zWydkcmlsbGRvd24nXSB8fCBudWxsXG4gIH0sXG4gIGFjY29yZGlvbjoge1xuICAgIGNzc0NsYXNzOiAnYWNjb3JkaW9uLW1lbnUnLFxuICAgIHBsdWdpbjogRm91bmRhdGlvbi5fcGx1Z2luc1snYWNjb3JkaW9uLW1lbnUnXSB8fCBudWxsXG4gIH1cbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihSZXNwb25zaXZlTWVudSwgJ1Jlc3BvbnNpdmVNZW51Jyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBSZXNwb25zaXZlVG9nZ2xlIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5yZXNwb25zaXZlVG9nZ2xlXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqL1xuXG5jbGFzcyBSZXNwb25zaXZlVG9nZ2xlIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgVGFiIEJhci5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBSZXNwb25zaXZlVG9nZ2xlI2luaXRcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGF0dGFjaCB0YWIgYmFyIGZ1bmN0aW9uYWxpdHkgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgUmVzcG9uc2l2ZVRvZ2dsZS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnUmVzcG9uc2l2ZVRvZ2dsZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSB0YWIgYmFyIGJ5IGZpbmRpbmcgdGhlIHRhcmdldCBlbGVtZW50LCB0b2dnbGluZyBlbGVtZW50LCBhbmQgcnVubmluZyB1cGRhdGUoKS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgdGFyZ2V0SUQgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ3Jlc3BvbnNpdmUtdG9nZ2xlJyk7XG4gICAgaWYgKCF0YXJnZXRJRCkge1xuICAgICAgY29uc29sZS5lcnJvcignWW91ciB0YWIgYmFyIG5lZWRzIGFuIElEIG9mIGEgTWVudSBhcyB0aGUgdmFsdWUgb2YgZGF0YS10YWItYmFyLicpO1xuICAgIH1cblxuICAgIHRoaXMuJHRhcmdldE1lbnUgPSAkKGAjJHt0YXJnZXRJRH1gKTtcbiAgICB0aGlzLiR0b2dnbGVyID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS10b2dnbGVdJyk7XG5cbiAgICB0aGlzLl91cGRhdGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIG5lY2Vzc2FyeSBldmVudCBoYW5kbGVycyBmb3IgdGhlIHRhYiBiYXIgdG8gd29yay5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLl91cGRhdGVNcUhhbmRsZXIgPSB0aGlzLl91cGRhdGUuYmluZCh0aGlzKTtcbiAgICBcbiAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIHRoaXMuX3VwZGF0ZU1xSGFuZGxlcik7XG5cbiAgICB0aGlzLiR0b2dnbGVyLm9uKCdjbGljay56Zi5yZXNwb25zaXZlVG9nZ2xlJywgdGhpcy50b2dnbGVNZW51LmJpbmQodGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0aGUgY3VycmVudCBtZWRpYSBxdWVyeSB0byBkZXRlcm1pbmUgaWYgdGhlIHRhYiBiYXIgc2hvdWxkIGJlIHZpc2libGUgb3IgaGlkZGVuLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF91cGRhdGUoKSB7XG4gICAgLy8gTW9iaWxlXG4gICAgaWYgKCFGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdCh0aGlzLm9wdGlvbnMuaGlkZUZvcikpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuc2hvdygpO1xuICAgICAgdGhpcy4kdGFyZ2V0TWVudS5oaWRlKCk7XG4gICAgfVxuXG4gICAgLy8gRGVza3RvcFxuICAgIGVsc2Uge1xuICAgICAgdGhpcy4kZWxlbWVudC5oaWRlKCk7XG4gICAgICB0aGlzLiR0YXJnZXRNZW51LnNob3coKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlcyB0aGUgZWxlbWVudCBhdHRhY2hlZCB0byB0aGUgdGFiIGJhci4gVGhlIHRvZ2dsZSBvbmx5IGhhcHBlbnMgaWYgdGhlIHNjcmVlbiBpcyBzbWFsbCBlbm91Z2ggdG8gYWxsb3cgaXQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgUmVzcG9uc2l2ZVRvZ2dsZSN0b2dnbGVkXG4gICAqL1xuICB0b2dnbGVNZW51KCkgeyAgIFxuICAgIGlmICghRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QodGhpcy5vcHRpb25zLmhpZGVGb3IpKSB7XG4gICAgICB0aGlzLiR0YXJnZXRNZW51LnRvZ2dsZSgwKTtcblxuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyB3aGVuIHRoZSBlbGVtZW50IGF0dGFjaGVkIHRvIHRoZSB0YWIgYmFyIHRvZ2dsZXMuXG4gICAgICAgKiBAZXZlbnQgUmVzcG9uc2l2ZVRvZ2dsZSN0b2dnbGVkXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigndG9nZ2xlZC56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG4gICAgfVxuICB9O1xuXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG4gICAgdGhpcy4kdG9nZ2xlci5vZmYoJy56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG4gICAgXG4gICAgJCh3aW5kb3cpLm9mZignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgdGhpcy5fdXBkYXRlTXFIYW5kbGVyKTtcbiAgICBcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuUmVzcG9uc2l2ZVRvZ2dsZS5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIFRoZSBicmVha3BvaW50IGFmdGVyIHdoaWNoIHRoZSBtZW51IGlzIGFsd2F5cyBzaG93biwgYW5kIHRoZSB0YWIgYmFyIGlzIGhpZGRlbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnbWVkaXVtJ1xuICAgKi9cbiAgaGlkZUZvcjogJ21lZGl1bSdcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihSZXNwb25zaXZlVG9nZ2xlLCAnUmVzcG9uc2l2ZVRvZ2dsZScpO1xuXG59KGpRdWVyeSk7XG4iLCIvLy8vLyAgICAvLy8vLyAgICAvLy8vLyAgICAvLy8vL1xuLy8vLy8gICAgLy8vLy8gICAgLy8vLy8gICAgLy8vLy9cbi8vLy8vICAgIC8vLy8vICAgIC8vLy8vICAgIC8vLy8vXG4vLy8vLyAgICAvLy8vLyAgICAvLy8vLyAgICAvLy8vL1xuLy8vLy8gICAgICAgICAgICAgLy8vLy8gICAgLy8vLy9cbi8vLy8vICAgICAgICAgICAgIC8vLy8vICAgIC8vLy8vXG4vLy8vLyAgICAvLy8vLyAgICAvLy8vLyAgICAvLy8vL1xuLy8vLy8gICAgLy8vLy8gICAgLy8vLy8gICAgLy8vLy9cbiAgICAgICAgIC8vLy8vICAgIC8vLy8vXG4gICAgICAgICAvLy8vLyAgICAvLy8vL1xuLy8vLy8gICAgLy8vLy8gICAgLy8vLy8gICAgLy8vLy9cbi8vLy8vICAgIC8vLy8vICAgIC8vLy8vICAgIC8vLy8vXG4vLy8vLyAgICAvLy8vLyAgICAvLy8vLyAgICAvLy8vL1xuLy8vLy8gICAgLy8vLy8gICAgLy8vLy8gICAgLy8vLy9cblxuLyoqXG4gKiBTY3JvbGxSZXZlYWxcbiAqIC0tLS0tLS0tLS0tLVxuICogVmVyc2lvbiA6IDMuMy4yXG4gKiBXZWJzaXRlIDogc2Nyb2xscmV2ZWFsanMub3JnXG4gKiBSZXBvICAgIDogZ2l0aHViLmNvbS9qbG1ha2VzL3Njcm9sbHJldmVhbC5qc1xuICogQXV0aG9yICA6IEp1bGlhbiBMbG95ZCAoQGpsbWFrZXMpXG4gKi9cblxuOyhmdW5jdGlvbiAoKSB7XG4gICd1c2Ugc3RyaWN0J1xuXG4gIHZhciBzclxuICB2YXIgX3JlcXVlc3RBbmltYXRpb25GcmFtZVxuXG4gIGZ1bmN0aW9uIFNjcm9sbFJldmVhbCAoY29uZmlnKSB7XG4gICAgLy8gU3VwcG9ydCBpbnN0YW50aWF0aW9uIHdpdGhvdXQgdGhlIGBuZXdgIGtleXdvcmQuXG4gICAgaWYgKHR5cGVvZiB0aGlzID09PSAndW5kZWZpbmVkJyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgIT09IFNjcm9sbFJldmVhbC5wcm90b3R5cGUpIHtcbiAgICAgIHJldHVybiBuZXcgU2Nyb2xsUmV2ZWFsKGNvbmZpZylcbiAgICB9XG5cbiAgICBzciA9IHRoaXMgLy8gU2F2ZSByZWZlcmVuY2UgdG8gaW5zdGFuY2UuXG4gICAgc3IudmVyc2lvbiA9ICczLjMuMidcbiAgICBzci50b29scyA9IG5ldyBUb29scygpIC8vICpyZXF1aXJlZCB1dGlsaXRpZXNcblxuICAgIGlmIChzci5pc1N1cHBvcnRlZCgpKSB7XG4gICAgICBzci50b29scy5leHRlbmQoc3IuZGVmYXVsdHMsIGNvbmZpZyB8fCB7fSlcblxuICAgICAgc3IuZGVmYXVsdHMuY29udGFpbmVyID0gX3Jlc29sdmVDb250YWluZXIoc3IuZGVmYXVsdHMpXG5cbiAgICAgIHNyLnN0b3JlID0ge1xuICAgICAgICBlbGVtZW50czoge30sXG4gICAgICAgIGNvbnRhaW5lcnM6IFtdXG4gICAgICB9XG5cbiAgICAgIHNyLnNlcXVlbmNlcyA9IHt9XG4gICAgICBzci5oaXN0b3J5ID0gW11cbiAgICAgIHNyLnVpZCA9IDBcbiAgICAgIHNyLmluaXRpYWxpemVkID0gZmFsc2VcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJiBjb25zb2xlICE9PSBudWxsKSB7XG4gICAgICAvLyBOb3RlOiBJRTkgb25seSBzdXBwb3J0cyBjb25zb2xlIGlmIGRldnRvb2xzIGFyZSBvcGVuLlxuICAgICAgY29uc29sZS5sb2coJ1Njcm9sbFJldmVhbCBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3Nlci4nKVxuICAgIH1cblxuICAgIHJldHVybiBzclxuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyYXRpb25cbiAgICogLS0tLS0tLS0tLS0tLVxuICAgKiBUaGlzIG9iamVjdCBzaWduYXR1cmUgY2FuIGJlIHBhc3NlZCBkaXJlY3RseSB0byB0aGUgU2Nyb2xsUmV2ZWFsIGNvbnN0cnVjdG9yLFxuICAgKiBvciBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IG9mIHRoZSBgcmV2ZWFsKClgIG1ldGhvZC5cbiAgICovXG5cbiAgU2Nyb2xsUmV2ZWFsLnByb3RvdHlwZS5kZWZhdWx0cyA9IHtcbiAgICAvLyAnYm90dG9tJywgJ2xlZnQnLCAndG9wJywgJ3JpZ2h0J1xuICAgIG9yaWdpbjogJ2JvdHRvbScsXG5cbiAgICAvLyBDYW4gYmUgYW55IHZhbGlkIENTUyBkaXN0YW5jZSwgZS5nLiAnNXJlbScsICcxMCUnLCAnMjB2dycsIGV0Yy5cbiAgICBkaXN0YW5jZTogJzIwcHgnLFxuXG4gICAgLy8gVGltZSBpbiBtaWxsaXNlY29uZHMuXG4gICAgZHVyYXRpb246IDUwMCxcbiAgICBkZWxheTogMCxcblxuICAgIC8vIFN0YXJ0aW5nIGFuZ2xlcyBpbiBkZWdyZWVzLCB3aWxsIHRyYW5zaXRpb24gZnJvbSB0aGVzZSB2YWx1ZXMgdG8gMCBpbiBhbGwgYXhlcy5cbiAgICByb3RhdGU6IHsgeDogMCwgeTogMCwgejogMCB9LFxuXG4gICAgLy8gU3RhcnRpbmcgb3BhY2l0eSB2YWx1ZSwgYmVmb3JlIHRyYW5zaXRpb25pbmcgdG8gdGhlIGNvbXB1dGVkIG9wYWNpdHkuXG4gICAgb3BhY2l0eTogMCxcblxuICAgIC8vIFN0YXJ0aW5nIHNjYWxlIHZhbHVlLCB3aWxsIHRyYW5zaXRpb24gZnJvbSB0aGlzIHZhbHVlIHRvIDFcbiAgICBzY2FsZTogMC45LFxuXG4gICAgLy8gQWNjZXB0cyBhbnkgdmFsaWQgQ1NTIGVhc2luZywgZS5nLiAnZWFzZScsICdlYXNlLWluLW91dCcsICdsaW5lYXInLCBldGMuXG4gICAgZWFzaW5nOiAnY3ViaWMtYmV6aWVyKDAuNiwgMC4yLCAwLjEsIDEpJyxcblxuICAgIC8vIGA8aHRtbD5gIGlzIHRoZSBkZWZhdWx0IHJldmVhbCBjb250YWluZXIuIFlvdSBjYW4gcGFzcyBlaXRoZXI6XG4gICAgLy8gRE9NIE5vZGUsIGUuZy4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmZvb0NvbnRhaW5lcicpXG4gICAgLy8gU2VsZWN0b3IsIGUuZy4gJy5mb29Db250YWluZXInXG4gICAgY29udGFpbmVyOiB3aW5kb3cuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxuXG4gICAgLy8gdHJ1ZS9mYWxzZSB0byBjb250cm9sIHJldmVhbCBhbmltYXRpb25zIG9uIG1vYmlsZS5cbiAgICBtb2JpbGU6IHRydWUsXG5cbiAgICAvLyB0cnVlOiAgcmV2ZWFscyBvY2N1ciBldmVyeSB0aW1lIGVsZW1lbnRzIGJlY29tZSB2aXNpYmxlXG4gICAgLy8gZmFsc2U6IHJldmVhbHMgb2NjdXIgb25jZSBhcyBlbGVtZW50cyBiZWNvbWUgdmlzaWJsZVxuICAgIHJlc2V0OiBmYWxzZSxcblxuICAgIC8vICdhbHdheXMnIOKAlCBkZWxheSBmb3IgYWxsIHJldmVhbCBhbmltYXRpb25zXG4gICAgLy8gJ29uY2UnICAg4oCUIGRlbGF5IG9ubHkgdGhlIGZpcnN0IHRpbWUgcmV2ZWFscyBvY2N1clxuICAgIC8vICdvbmxvYWQnIC0gZGVsYXkgb25seSBmb3IgYW5pbWF0aW9ucyB0cmlnZ2VyZWQgYnkgZmlyc3QgbG9hZFxuICAgIHVzZURlbGF5OiAnYWx3YXlzJyxcblxuICAgIC8vIENoYW5nZSB3aGVuIGFuIGVsZW1lbnQgaXMgY29uc2lkZXJlZCBpbiB0aGUgdmlld3BvcnQuIFRoZSBkZWZhdWx0IHZhbHVlXG4gICAgLy8gb2YgMC4yMCBtZWFucyAyMCUgb2YgYW4gZWxlbWVudCBtdXN0IGJlIHZpc2libGUgZm9yIGl0cyByZXZlYWwgdG8gb2NjdXIuXG4gICAgdmlld0ZhY3RvcjogMC4yLFxuXG4gICAgLy8gUGl4ZWwgdmFsdWVzIHRoYXQgYWx0ZXIgdGhlIGNvbnRhaW5lciBib3VuZGFyaWVzLlxuICAgIC8vIGUuZy4gU2V0IGB7IHRvcDogNDggfWAsIGlmIHlvdSBoYXZlIGEgNDhweCB0YWxsIGZpeGVkIHRvb2xiYXIuXG4gICAgLy8gLS1cbiAgICAvLyBWaXN1YWwgQWlkOiBodHRwczovL3Njcm9sbHJldmVhbGpzLm9yZy9hc3NldHMvdmlld29mZnNldC5wbmdcbiAgICB2aWV3T2Zmc2V0OiB7IHRvcDogMCwgcmlnaHQ6IDAsIGJvdHRvbTogMCwgbGVmdDogMCB9LFxuXG4gICAgLy8gQ2FsbGJhY2tzIHRoYXQgZmlyZSBmb3IgZWFjaCB0cmlnZ2VyZWQgZWxlbWVudCByZXZlYWwsIGFuZCByZXNldC5cbiAgICBiZWZvcmVSZXZlYWw6IGZ1bmN0aW9uIChkb21FbCkge30sXG4gICAgYmVmb3JlUmVzZXQ6IGZ1bmN0aW9uIChkb21FbCkge30sXG5cbiAgICAvLyBDYWxsYmFja3MgdGhhdCBmaXJlIGZvciBlYWNoIGNvbXBsZXRlZCBlbGVtZW50IHJldmVhbCwgYW5kIHJlc2V0LlxuICAgIGFmdGVyUmV2ZWFsOiBmdW5jdGlvbiAoZG9tRWwpIHt9LFxuICAgIGFmdGVyUmVzZXQ6IGZ1bmN0aW9uIChkb21FbCkge31cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBjbGllbnQgc3VwcG9ydHMgQ1NTIFRyYW5zZm9ybSBhbmQgQ1NTIFRyYW5zaXRpb24uXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBTY3JvbGxSZXZlYWwucHJvdG90eXBlLmlzU3VwcG9ydGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZVxuICAgIHJldHVybiAnV2Via2l0VHJhbnNpdGlvbicgaW4gc3R5bGUgJiYgJ1dlYmtpdFRyYW5zZm9ybScgaW4gc3R5bGUgfHxcbiAgICAgICd0cmFuc2l0aW9uJyBpbiBzdHlsZSAmJiAndHJhbnNmb3JtJyBpbiBzdHlsZVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByZXZlYWwgc2V0LCBhIGdyb3VwIG9mIGVsZW1lbnRzIHRoYXQgd2lsbCBhbmltYXRlIHdoZW4gdGhleVxuICAgKiBiZWNvbWUgdmlzaWJsZS4gSWYgW2ludGVydmFsXSBpcyBwcm92aWRlZCwgYSBuZXcgc2VxdWVuY2UgaXMgY3JlYXRlZFxuICAgKiB0aGF0IHdpbGwgZW5zdXJlIGVsZW1lbnRzIHJldmVhbCBpbiB0aGUgb3JkZXIgdGhleSBhcHBlYXIgaW4gdGhlIERPTS5cbiAgICpcbiAgICogQHBhcmFtIHtOb2RlfE5vZGVMaXN0fHN0cmluZ30gW3RhcmdldF0gICBUaGUgbm9kZSwgbm9kZSBsaXN0IG9yIHNlbGVjdG9yIHRvIHVzZSBmb3IgYW5pbWF0aW9uLlxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICAgICAgICBbY29uZmlnXSAgIE92ZXJyaWRlIHRoZSBkZWZhdWx0cyBmb3IgdGhpcyByZXZlYWwgc2V0LlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgICAgICAgICAgICBbaW50ZXJ2YWxdIFRpbWUgYmV0d2VlbiBzZXF1ZW5jZWQgZWxlbWVudCBhbmltYXRpb25zIChtaWxsaXNlY29uZHMpLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICBbc3luY10gICAgIFVzZWQgaW50ZXJuYWxseSB3aGVuIHVwZGF0aW5nIHJldmVhbHMgZm9yIGFzeW5jIGNvbnRlbnQuXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGN1cnJlbnQgU2Nyb2xsUmV2ZWFsIGluc3RhbmNlLlxuICAgKi9cbiAgU2Nyb2xsUmV2ZWFsLnByb3RvdHlwZS5yZXZlYWwgPSBmdW5jdGlvbiAodGFyZ2V0LCBjb25maWcsIGludGVydmFsLCBzeW5jKSB7XG4gICAgdmFyIGNvbnRhaW5lclxuICAgIHZhciBlbGVtZW50c1xuICAgIHZhciBlbGVtXG4gICAgdmFyIGVsZW1JZFxuICAgIHZhciBzZXF1ZW5jZVxuICAgIHZhciBzZXF1ZW5jZUlkXG5cbiAgICAvLyBObyBjdXN0b20gY29uZmlndXJhdGlvbiB3YXMgcGFzc2VkLCBidXQgYSBzZXF1ZW5jZSBpbnRlcnZhbCBpbnN0ZWFkLlxuICAgIC8vIGxldOKAmXMgc2h1ZmZsZSB0aGluZ3MgYXJvdW5kIHRvIG1ha2Ugc3VyZSBldmVyeXRoaW5nIHdvcmtzLlxuICAgIGlmIChjb25maWcgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgY29uZmlnID09PSAnbnVtYmVyJykge1xuICAgICAgaW50ZXJ2YWwgPSBjb25maWdcbiAgICAgIGNvbmZpZyA9IHt9XG4gICAgfSBlbHNlIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCB8fCBjb25maWcgPT09IG51bGwpIHtcbiAgICAgIGNvbmZpZyA9IHt9XG4gICAgfVxuXG4gICAgY29udGFpbmVyID0gX3Jlc29sdmVDb250YWluZXIoY29uZmlnKVxuICAgIGVsZW1lbnRzID0gX2dldFJldmVhbEVsZW1lbnRzKHRhcmdldCwgY29udGFpbmVyKVxuXG4gICAgaWYgKCFlbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdTY3JvbGxSZXZlYWw6IHJldmVhbCBvbiBcIicgKyB0YXJnZXQgKyAnXCIgZmFpbGVkLCBubyBlbGVtZW50cyBmb3VuZC4nKVxuICAgICAgcmV0dXJuIHNyXG4gICAgfVxuXG4gICAgLy8gUHJlcGFyZSBhIG5ldyBzZXF1ZW5jZSBpZiBhbiBpbnRlcnZhbCBpcyBwYXNzZWQuXG4gICAgaWYgKGludGVydmFsICYmIHR5cGVvZiBpbnRlcnZhbCA9PT0gJ251bWJlcicpIHtcbiAgICAgIHNlcXVlbmNlSWQgPSBfbmV4dFVpZCgpXG5cbiAgICAgIHNlcXVlbmNlID0gc3Iuc2VxdWVuY2VzW3NlcXVlbmNlSWRdID0ge1xuICAgICAgICBpZDogc2VxdWVuY2VJZCxcbiAgICAgICAgaW50ZXJ2YWw6IGludGVydmFsLFxuICAgICAgICBlbGVtSWRzOiBbXSxcbiAgICAgICAgYWN0aXZlOiBmYWxzZVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEJlZ2luIG1haW4gbG9vcCB0byBjb25maWd1cmUgU2Nyb2xsUmV2ZWFsIGVsZW1lbnRzLlxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIENoZWNrIGlmIHRoZSBlbGVtZW50IGhhcyBhbHJlYWR5IGJlZW4gY29uZmlndXJlZCBhbmQgZ3JhYiBpdCBmcm9tIHRoZSBzdG9yZS5cbiAgICAgIGVsZW1JZCA9IGVsZW1lbnRzW2ldLmdldEF0dHJpYnV0ZSgnZGF0YS1zci1pZCcpXG4gICAgICBpZiAoZWxlbUlkKSB7XG4gICAgICAgIGVsZW0gPSBzci5zdG9yZS5lbGVtZW50c1tlbGVtSWRdXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBPdGhlcndpc2UsIGxldOKAmXMgZG8gc29tZSBiYXNpYyBzZXR1cC5cbiAgICAgICAgZWxlbSA9IHtcbiAgICAgICAgICBpZDogX25leHRVaWQoKSxcbiAgICAgICAgICBkb21FbDogZWxlbWVudHNbaV0sXG4gICAgICAgICAgc2VlbjogZmFsc2UsXG4gICAgICAgICAgcmV2ZWFsaW5nOiBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIGVsZW0uZG9tRWwuc2V0QXR0cmlidXRlKCdkYXRhLXNyLWlkJywgZWxlbS5pZClcbiAgICAgIH1cblxuICAgICAgLy8gU2VxdWVuY2Ugb25seSBzZXR1cFxuICAgICAgaWYgKHNlcXVlbmNlKSB7XG4gICAgICAgIGVsZW0uc2VxdWVuY2UgPSB7XG4gICAgICAgICAgaWQ6IHNlcXVlbmNlLmlkLFxuICAgICAgICAgIGluZGV4OiBzZXF1ZW5jZS5lbGVtSWRzLmxlbmd0aFxuICAgICAgICB9XG5cbiAgICAgICAgc2VxdWVuY2UuZWxlbUlkcy5wdXNoKGVsZW0uaWQpXG4gICAgICB9XG5cbiAgICAgIC8vIE5ldyBvciBleGlzdGluZyBlbGVtZW50LCBpdOKAmXMgdGltZSB0byB1cGRhdGUgaXRzIGNvbmZpZ3VyYXRpb24sIHN0eWxlcyxcbiAgICAgIC8vIGFuZCBzZW5kIHRoZSB1cGRhdGVzIHRvIG91ciBzdG9yZS5cbiAgICAgIF9jb25maWd1cmUoZWxlbSwgY29uZmlnLCBjb250YWluZXIpXG4gICAgICBfc3R5bGUoZWxlbSlcbiAgICAgIF91cGRhdGVTdG9yZShlbGVtKVxuXG4gICAgICAvLyBXZSBuZWVkIHRvIG1ha2Ugc3VyZSBlbGVtZW50cyBhcmUgc2V0IHRvIHZpc2liaWxpdHk6IHZpc2libGUsIGV2ZW4gd2hlblxuICAgICAgLy8gb24gbW9iaWxlIGFuZCBgY29uZmlnLm1vYmlsZSA9PT0gZmFsc2VgLCBvciBpZiB1bnN1cHBvcnRlZC5cbiAgICAgIGlmIChzci50b29scy5pc01vYmlsZSgpICYmICFlbGVtLmNvbmZpZy5tb2JpbGUgfHwgIXNyLmlzU3VwcG9ydGVkKCkpIHtcbiAgICAgICAgZWxlbS5kb21FbC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgZWxlbS5zdHlsZXMuaW5saW5lKVxuICAgICAgICBlbGVtLmRpc2FibGVkID0gdHJ1ZVxuICAgICAgfSBlbHNlIGlmICghZWxlbS5yZXZlYWxpbmcpIHtcbiAgICAgICAgLy8gT3RoZXJ3aXNlLCBwcm9jZWVkIG5vcm1hbGx5LlxuICAgICAgICBlbGVtLmRvbUVsLnNldEF0dHJpYnV0ZSgnc3R5bGUnLFxuICAgICAgICAgIGVsZW0uc3R5bGVzLmlubGluZSArXG4gICAgICAgICAgZWxlbS5zdHlsZXMudHJhbnNmb3JtLmluaXRpYWxcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEVhY2ggYHJldmVhbCgpYCBpcyByZWNvcmRlZCBzbyB0aGF0IHdoZW4gY2FsbGluZyBgc3luYygpYCB3aGlsZSB3b3JraW5nXG4gICAgLy8gd2l0aCBhc3luY2hyb25vdXNseSBsb2FkZWQgY29udGVudCwgaXQgY2FuIHJlLXRyYWNlIHlvdXIgc3RlcHMgYnV0IHdpdGhcbiAgICAvLyBhbGwgeW91ciBuZXcgZWxlbWVudHMgbm93IGluIHRoZSBET00uXG5cbiAgICAvLyBTaW5jZSBgcmV2ZWFsKClgIGlzIGNhbGxlZCBpbnRlcm5hbGx5IGJ5IGBzeW5jKClgLCB3ZSBkb27igJl0IHdhbnQgdG9cbiAgICAvLyByZWNvcmQgb3IgaW50aWlhbGl6ZSBlYWNoIHJldmVhbCBkdXJpbmcgc3luY2luZy5cbiAgICBpZiAoIXN5bmMgJiYgc3IuaXNTdXBwb3J0ZWQoKSkge1xuICAgICAgX3JlY29yZCh0YXJnZXQsIGNvbmZpZywgaW50ZXJ2YWwpXG5cbiAgICAgIC8vIFdlIHB1c2ggaW5pdGlhbGl6YXRpb24gdG8gdGhlIGV2ZW50IHF1ZXVlIHVzaW5nIHNldFRpbWVvdXQsIHNvIHRoYXQgd2UgY2FuXG4gICAgICAvLyBnaXZlIFNjcm9sbFJldmVhbCByb29tIHRvIHByb2Nlc3MgYWxsIHJldmVhbCBjYWxscyBiZWZvcmUgcHV0dGluZyB0aGluZ3MgaW50byBtb3Rpb24uXG4gICAgICAvLyAtLVxuICAgICAgLy8gUGhpbGlwIFJvYmVydHMgLSBXaGF0IHRoZSBoZWNrIGlzIHRoZSBldmVudCBsb29wIGFueXdheT8gKEpTQ29uZiBFVSAyMDE0KVxuICAgICAgLy8gaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj04YUdoWlFrb0ZiUVxuICAgICAgaWYgKHNyLmluaXRUaW1lb3V0KSB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoc3IuaW5pdFRpbWVvdXQpXG4gICAgICB9XG4gICAgICBzci5pbml0VGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KF9pbml0LCAwKVxuICAgIH1cblxuICAgIHJldHVybiBzclxuICB9XG5cbiAgLyoqXG4gICAqIFJlLXJ1bnMgYHJldmVhbCgpYCBmb3IgZWFjaCByZWNvcmQgc3RvcmVkIGluIGhpc3RvcnksIGVmZmVjdGl2ZWx5IGNhcHR1cmluZ1xuICAgKiBhbnkgY29udGVudCBsb2FkZWQgYXN5bmNocm9ub3VzbHkgdGhhdCBtYXRjaGVzIGV4aXN0aW5nIHJldmVhbCBzZXQgdGFyZ2V0cy5cbiAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgY3VycmVudCBTY3JvbGxSZXZlYWwgaW5zdGFuY2UuXG4gICAqL1xuICBTY3JvbGxSZXZlYWwucHJvdG90eXBlLnN5bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHNyLmhpc3RvcnkubGVuZ3RoICYmIHNyLmlzU3VwcG9ydGVkKCkpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3IuaGlzdG9yeS5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcmVjb3JkID0gc3IuaGlzdG9yeVtpXVxuICAgICAgICBzci5yZXZlYWwocmVjb3JkLnRhcmdldCwgcmVjb3JkLmNvbmZpZywgcmVjb3JkLmludGVydmFsLCB0cnVlKVxuICAgICAgfVxuICAgICAgX2luaXQoKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygnU2Nyb2xsUmV2ZWFsOiBzeW5jIGZhaWxlZCwgbm8gcmV2ZWFscyBmb3VuZC4nKVxuICAgIH1cbiAgICByZXR1cm4gc3JcbiAgfVxuXG4gIC8qKlxuICAgKiBQcml2YXRlIE1ldGhvZHNcbiAgICogLS0tLS0tLS0tLS0tLS0tXG4gICAqL1xuXG4gIGZ1bmN0aW9uIF9yZXNvbHZlQ29udGFpbmVyIChjb25maWcpIHtcbiAgICBpZiAoY29uZmlnICYmIGNvbmZpZy5jb250YWluZXIpIHtcbiAgICAgIGlmICh0eXBlb2YgY29uZmlnLmNvbnRhaW5lciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcihjb25maWcuY29udGFpbmVyKVxuICAgICAgfSBlbHNlIGlmIChzci50b29scy5pc05vZGUoY29uZmlnLmNvbnRhaW5lcikpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5jb250YWluZXJcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdTY3JvbGxSZXZlYWw6IGludmFsaWQgY29udGFpbmVyIFwiJyArIGNvbmZpZy5jb250YWluZXIgKyAnXCIgcHJvdmlkZWQuJylcbiAgICAgICAgY29uc29sZS5sb2coJ1Njcm9sbFJldmVhbDogZmFsbGluZyBiYWNrIHRvIGRlZmF1bHQgY29udGFpbmVyLicpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzci5kZWZhdWx0cy5jb250YWluZXJcbiAgfVxuXG4gIC8qKlxuICAgKiBjaGVjayB0byBzZWUgaWYgYSBub2RlIG9yIG5vZGUgbGlzdCB3YXMgcGFzc2VkIGluIGFzIHRoZSB0YXJnZXQsXG4gICAqIG90aGVyd2lzZSBxdWVyeSB0aGUgY29udGFpbmVyIHVzaW5nIHRhcmdldCBhcyBhIHNlbGVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0ge05vZGV8Tm9kZUxpc3R8c3RyaW5nfSBbdGFyZ2V0XSAgICBjbGllbnQgaW5wdXQgZm9yIHJldmVhbCB0YXJnZXQuXG4gICAqIEBwYXJhbSB7Tm9kZX0gICAgICAgICAgICAgICAgIFtjb250YWluZXJdIHBhcmVudCBlbGVtZW50IGZvciBzZWxlY3RvciBxdWVyaWVzLlxuICAgKlxuICAgKiBAcmV0dXJuIHthcnJheX0gZWxlbWVudHMgdG8gYmUgcmV2ZWFsZWQuXG4gICAqL1xuICBmdW5jdGlvbiBfZ2V0UmV2ZWFsRWxlbWVudHMgKHRhcmdldCwgY29udGFpbmVyKSB7XG4gICAgaWYgKHR5cGVvZiB0YXJnZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwodGFyZ2V0KSlcbiAgICB9IGVsc2UgaWYgKHNyLnRvb2xzLmlzTm9kZSh0YXJnZXQpKSB7XG4gICAgICByZXR1cm4gW3RhcmdldF1cbiAgICB9IGVsc2UgaWYgKHNyLnRvb2xzLmlzTm9kZUxpc3QodGFyZ2V0KSkge1xuICAgICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRhcmdldClcbiAgICB9XG4gICAgcmV0dXJuIFtdXG4gIH1cblxuICAvKipcbiAgICogQSBjb25zaXN0ZW50IHdheSBvZiBjcmVhdGluZyB1bmlxdWUgSURzLlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgKi9cbiAgZnVuY3Rpb24gX25leHRVaWQgKCkge1xuICAgIHJldHVybiArK3NyLnVpZFxuICB9XG5cbiAgZnVuY3Rpb24gX2NvbmZpZ3VyZSAoZWxlbSwgY29uZmlnLCBjb250YWluZXIpIHtcbiAgICAvLyBJZiBhIGNvbnRhaW5lciB3YXMgcGFzc2VkIGFzIGEgcGFydCBvZiB0aGUgY29uZmlnIG9iamVjdCxcbiAgICAvLyBsZXTigJlzIG92ZXJ3cml0ZSBpdCB3aXRoIHRoZSByZXNvbHZlZCBjb250YWluZXIgcGFzc2VkIGluLlxuICAgIGlmIChjb25maWcuY29udGFpbmVyKSBjb25maWcuY29udGFpbmVyID0gY29udGFpbmVyXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgaGFzbuKAmXQgYWxyZWFkeSBiZWVuIGNvbmZpZ3VyZWQsIGxldOKAmXMgdXNlIGEgY2xvbmUgb2YgdGhlXG4gICAgLy8gZGVmYXVsdHMgZXh0ZW5kZWQgYnkgdGhlIGNvbmZpZ3VyYXRpb24gcGFzc2VkIGFzIHRoZSBzZWNvbmQgYXJndW1lbnQuXG4gICAgaWYgKCFlbGVtLmNvbmZpZykge1xuICAgICAgZWxlbS5jb25maWcgPSBzci50b29scy5leHRlbmRDbG9uZShzci5kZWZhdWx0cywgY29uZmlnKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPdGhlcndpc2UsIGxldOKAmXMgdXNlIGEgY2xvbmUgb2YgdGhlIGV4aXN0aW5nIGVsZW1lbnQgY29uZmlndXJhdGlvbiBleHRlbmRlZFxuICAgICAgLy8gYnkgdGhlIGNvbmZpZ3VyYXRpb24gcGFzc2VkIGFzIHRoZSBzZWNvbmQgYXJndW1lbnQuXG4gICAgICBlbGVtLmNvbmZpZyA9IHNyLnRvb2xzLmV4dGVuZENsb25lKGVsZW0uY29uZmlnLCBjb25maWcpXG4gICAgfVxuXG4gICAgLy8gSW5mZXIgQ1NTIFRyYW5zZm9ybSBheGlzIGZyb20gb3JpZ2luIHN0cmluZy5cbiAgICBpZiAoZWxlbS5jb25maWcub3JpZ2luID09PSAndG9wJyB8fCBlbGVtLmNvbmZpZy5vcmlnaW4gPT09ICdib3R0b20nKSB7XG4gICAgICBlbGVtLmNvbmZpZy5heGlzID0gJ1knXG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW0uY29uZmlnLmF4aXMgPSAnWCdcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfc3R5bGUgKGVsZW0pIHtcbiAgICB2YXIgY29tcHV0ZWQgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtLmRvbUVsKVxuXG4gICAgaWYgKCFlbGVtLnN0eWxlcykge1xuICAgICAgZWxlbS5zdHlsZXMgPSB7XG4gICAgICAgIHRyYW5zaXRpb246IHt9LFxuICAgICAgICB0cmFuc2Zvcm06IHt9LFxuICAgICAgICBjb21wdXRlZDoge31cbiAgICAgIH1cblxuICAgICAgLy8gQ2FwdHVyZSBhbnkgZXhpc3RpbmcgaW5saW5lIHN0eWxlcywgYW5kIGFkZCBvdXIgdmlzaWJpbGl0eSBvdmVycmlkZS5cbiAgICAgIC8vIC0tXG4gICAgICAvLyBTZWUgc2VjdGlvbiA0LjIuIGluIHRoZSBEb2N1bWVudGF0aW9uOlxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2psbWFrZXMvc2Nyb2xscmV2ZWFsLmpzIzQyLWltcHJvdmUtdXNlci1leHBlcmllbmNlXG4gICAgICBlbGVtLnN0eWxlcy5pbmxpbmUgPSBlbGVtLmRvbUVsLmdldEF0dHJpYnV0ZSgnc3R5bGUnKSB8fCAnJ1xuICAgICAgZWxlbS5zdHlsZXMuaW5saW5lICs9ICc7IHZpc2liaWxpdHk6IHZpc2libGU7ICdcblxuICAgICAgLy8gZ3JhYiB0aGUgZWxlbWVudHMgZXhpc3Rpbmcgb3BhY2l0eS5cbiAgICAgIGVsZW0uc3R5bGVzLmNvbXB1dGVkLm9wYWNpdHkgPSBjb21wdXRlZC5vcGFjaXR5XG5cbiAgICAgIC8vIGdyYWIgdGhlIGVsZW1lbnRzIGV4aXN0aW5nIHRyYW5zaXRpb25zLlxuICAgICAgaWYgKCFjb21wdXRlZC50cmFuc2l0aW9uIHx8IGNvbXB1dGVkLnRyYW5zaXRpb24gPT09ICdhbGwgMHMgZWFzZSAwcycpIHtcbiAgICAgICAgZWxlbS5zdHlsZXMuY29tcHV0ZWQudHJhbnNpdGlvbiA9ICcnXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtLnN0eWxlcy5jb21wdXRlZC50cmFuc2l0aW9uID0gY29tcHV0ZWQudHJhbnNpdGlvbiArICcsICdcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgdHJhbnNpdGlvbiBzdHlsZXNcbiAgICBlbGVtLnN0eWxlcy50cmFuc2l0aW9uLmluc3RhbnQgPSBfZ2VuZXJhdGVUcmFuc2l0aW9uKGVsZW0sIDApXG4gICAgZWxlbS5zdHlsZXMudHJhbnNpdGlvbi5kZWxheWVkID0gX2dlbmVyYXRlVHJhbnNpdGlvbihlbGVtLCBlbGVtLmNvbmZpZy5kZWxheSlcblxuICAgIC8vIEdlbmVyYXRlIHRyYW5zZm9ybSBzdHlsZXMsIGZpcnN0IHdpdGggdGhlIHdlYmtpdCBwcmVmaXguXG4gICAgZWxlbS5zdHlsZXMudHJhbnNmb3JtLmluaXRpYWwgPSAnIC13ZWJraXQtdHJhbnNmb3JtOidcbiAgICBlbGVtLnN0eWxlcy50cmFuc2Zvcm0udGFyZ2V0ID0gJyAtd2Via2l0LXRyYW5zZm9ybTonXG4gICAgX2dlbmVyYXRlVHJhbnNmb3JtKGVsZW0pXG5cbiAgICAvLyBBbmQgYWdhaW4gd2l0aG91dCBhbnkgcHJlZml4LlxuICAgIGVsZW0uc3R5bGVzLnRyYW5zZm9ybS5pbml0aWFsICs9ICd0cmFuc2Zvcm06J1xuICAgIGVsZW0uc3R5bGVzLnRyYW5zZm9ybS50YXJnZXQgKz0gJ3RyYW5zZm9ybTonXG4gICAgX2dlbmVyYXRlVHJhbnNmb3JtKGVsZW0pXG4gIH1cblxuICBmdW5jdGlvbiBfZ2VuZXJhdGVUcmFuc2l0aW9uIChlbGVtLCBkZWxheSkge1xuICAgIHZhciBjb25maWcgPSBlbGVtLmNvbmZpZ1xuXG4gICAgcmV0dXJuICctd2Via2l0LXRyYW5zaXRpb246ICcgKyBlbGVtLnN0eWxlcy5jb21wdXRlZC50cmFuc2l0aW9uICtcbiAgICAgICctd2Via2l0LXRyYW5zZm9ybSAnICsgY29uZmlnLmR1cmF0aW9uIC8gMTAwMCArICdzICcgK1xuICAgICAgY29uZmlnLmVhc2luZyArICcgJyArXG4gICAgICBkZWxheSAvIDEwMDAgKyAncywgb3BhY2l0eSAnICtcbiAgICAgIGNvbmZpZy5kdXJhdGlvbiAvIDEwMDAgKyAncyAnICtcbiAgICAgIGNvbmZpZy5lYXNpbmcgKyAnICcgK1xuICAgICAgZGVsYXkgLyAxMDAwICsgJ3M7ICcgK1xuXG4gICAgICAndHJhbnNpdGlvbjogJyArIGVsZW0uc3R5bGVzLmNvbXB1dGVkLnRyYW5zaXRpb24gK1xuICAgICAgJ3RyYW5zZm9ybSAnICsgY29uZmlnLmR1cmF0aW9uIC8gMTAwMCArICdzICcgK1xuICAgICAgY29uZmlnLmVhc2luZyArICcgJyArXG4gICAgICBkZWxheSAvIDEwMDAgKyAncywgb3BhY2l0eSAnICtcbiAgICAgIGNvbmZpZy5kdXJhdGlvbiAvIDEwMDAgKyAncyAnICtcbiAgICAgIGNvbmZpZy5lYXNpbmcgKyAnICcgK1xuICAgICAgZGVsYXkgLyAxMDAwICsgJ3M7ICdcbiAgfVxuXG4gIGZ1bmN0aW9uIF9nZW5lcmF0ZVRyYW5zZm9ybSAoZWxlbSkge1xuICAgIHZhciBjb25maWcgPSBlbGVtLmNvbmZpZ1xuICAgIHZhciBjc3NEaXN0YW5jZVxuICAgIHZhciB0cmFuc2Zvcm0gPSBlbGVtLnN0eWxlcy50cmFuc2Zvcm1cblxuICAgIC8vIExldOKAmXMgbWFrZSBzdXJlIG91ciBvdXIgcGl4ZWwgZGlzdGFuY2VzIGFyZSBuZWdhdGl2ZSBmb3IgdG9wIGFuZCBsZWZ0LlxuICAgIC8vIGUuZy4gb3JpZ2luID0gJ3RvcCcgYW5kIGRpc3RhbmNlID0gJzI1cHgnIHN0YXJ0cyBhdCBgdG9wOiAtMjVweGAgaW4gQ1NTLlxuICAgIGlmIChjb25maWcub3JpZ2luID09PSAndG9wJyB8fCBjb25maWcub3JpZ2luID09PSAnbGVmdCcpIHtcbiAgICAgIGNzc0Rpc3RhbmNlID0gL14tLy50ZXN0KGNvbmZpZy5kaXN0YW5jZSlcbiAgICAgICAgPyBjb25maWcuZGlzdGFuY2Uuc3Vic3RyKDEpXG4gICAgICAgIDogJy0nICsgY29uZmlnLmRpc3RhbmNlXG4gICAgfSBlbHNlIHtcbiAgICAgIGNzc0Rpc3RhbmNlID0gY29uZmlnLmRpc3RhbmNlXG4gICAgfVxuXG4gICAgaWYgKHBhcnNlSW50KGNvbmZpZy5kaXN0YW5jZSkpIHtcbiAgICAgIHRyYW5zZm9ybS5pbml0aWFsICs9ICcgdHJhbnNsYXRlJyArIGNvbmZpZy5heGlzICsgJygnICsgY3NzRGlzdGFuY2UgKyAnKSdcbiAgICAgIHRyYW5zZm9ybS50YXJnZXQgKz0gJyB0cmFuc2xhdGUnICsgY29uZmlnLmF4aXMgKyAnKDApJ1xuICAgIH1cbiAgICBpZiAoY29uZmlnLnNjYWxlKSB7XG4gICAgICB0cmFuc2Zvcm0uaW5pdGlhbCArPSAnIHNjYWxlKCcgKyBjb25maWcuc2NhbGUgKyAnKSdcbiAgICAgIHRyYW5zZm9ybS50YXJnZXQgKz0gJyBzY2FsZSgxKSdcbiAgICB9XG4gICAgaWYgKGNvbmZpZy5yb3RhdGUueCkge1xuICAgICAgdHJhbnNmb3JtLmluaXRpYWwgKz0gJyByb3RhdGVYKCcgKyBjb25maWcucm90YXRlLnggKyAnZGVnKSdcbiAgICAgIHRyYW5zZm9ybS50YXJnZXQgKz0gJyByb3RhdGVYKDApJ1xuICAgIH1cbiAgICBpZiAoY29uZmlnLnJvdGF0ZS55KSB7XG4gICAgICB0cmFuc2Zvcm0uaW5pdGlhbCArPSAnIHJvdGF0ZVkoJyArIGNvbmZpZy5yb3RhdGUueSArICdkZWcpJ1xuICAgICAgdHJhbnNmb3JtLnRhcmdldCArPSAnIHJvdGF0ZVkoMCknXG4gICAgfVxuICAgIGlmIChjb25maWcucm90YXRlLnopIHtcbiAgICAgIHRyYW5zZm9ybS5pbml0aWFsICs9ICcgcm90YXRlWignICsgY29uZmlnLnJvdGF0ZS56ICsgJ2RlZyknXG4gICAgICB0cmFuc2Zvcm0udGFyZ2V0ICs9ICcgcm90YXRlWigwKSdcbiAgICB9XG4gICAgdHJhbnNmb3JtLmluaXRpYWwgKz0gJzsgb3BhY2l0eTogJyArIGNvbmZpZy5vcGFjaXR5ICsgJzsnXG4gICAgdHJhbnNmb3JtLnRhcmdldCArPSAnOyBvcGFjaXR5OiAnICsgZWxlbS5zdHlsZXMuY29tcHV0ZWQub3BhY2l0eSArICc7J1xuICB9XG5cbiAgZnVuY3Rpb24gX3VwZGF0ZVN0b3JlIChlbGVtKSB7XG4gICAgdmFyIGNvbnRhaW5lciA9IGVsZW0uY29uZmlnLmNvbnRhaW5lclxuXG4gICAgLy8gSWYgdGhpcyBlbGVtZW504oCZcyBjb250YWluZXIgaXNu4oCZdCBhbHJlYWR5IGluIHRoZSBzdG9yZSwgbGV04oCZcyBhZGQgaXQuXG4gICAgaWYgKGNvbnRhaW5lciAmJiBzci5zdG9yZS5jb250YWluZXJzLmluZGV4T2YoY29udGFpbmVyKSA9PT0gLTEpIHtcbiAgICAgIHNyLnN0b3JlLmNvbnRhaW5lcnMucHVzaChlbGVtLmNvbmZpZy5jb250YWluZXIpXG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHRoZSBlbGVtZW50IHN0b3JlZCB3aXRoIG91ciBuZXcgZWxlbWVudC5cbiAgICBzci5zdG9yZS5lbGVtZW50c1tlbGVtLmlkXSA9IGVsZW1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9yZWNvcmQgKHRhcmdldCwgY29uZmlnLCBpbnRlcnZhbCkge1xuICAgIC8vIFNhdmUgdGhlIGByZXZlYWwoKWAgYXJndW1lbnRzIHRoYXQgdHJpZ2dlcmVkIHRoaXMgYF9yZWNvcmQoKWAgY2FsbCwgc28gd2VcbiAgICAvLyBjYW4gcmUtdHJhY2Ugb3VyIHN0ZXBzIHdoZW4gY2FsbGluZyB0aGUgYHN5bmMoKWAgbWV0aG9kLlxuICAgIHZhciByZWNvcmQgPSB7XG4gICAgICB0YXJnZXQ6IHRhcmdldCxcbiAgICAgIGNvbmZpZzogY29uZmlnLFxuICAgICAgaW50ZXJ2YWw6IGludGVydmFsXG4gICAgfVxuICAgIHNyLmhpc3RvcnkucHVzaChyZWNvcmQpXG4gIH1cblxuICBmdW5jdGlvbiBfaW5pdCAoKSB7XG4gICAgaWYgKHNyLmlzU3VwcG9ydGVkKCkpIHtcbiAgICAgIC8vIEluaXRpYWwgYW5pbWF0ZSBjYWxsIHRyaWdnZXJzIHZhbGlkIHJldmVhbCBhbmltYXRpb25zIG9uIGZpcnN0IGxvYWQuXG4gICAgICAvLyBTdWJzZXF1ZW50IGFuaW1hdGUgY2FsbHMgYXJlIG1hZGUgaW5zaWRlIHRoZSBldmVudCBoYW5kbGVyLlxuICAgICAgX2FuaW1hdGUoKVxuXG4gICAgICAvLyBUaGVuIHdlIGxvb3AgdGhyb3VnaCBhbGwgY29udGFpbmVyIG5vZGVzIGluIHRoZSBzdG9yZSBhbmQgYmluZCBldmVudFxuICAgICAgLy8gbGlzdGVuZXJzIHRvIGVhY2guXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNyLnN0b3JlLmNvbnRhaW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc3Iuc3RvcmUuY29udGFpbmVyc1tpXS5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBfaGFuZGxlcilcbiAgICAgICAgc3Iuc3RvcmUuY29udGFpbmVyc1tpXS5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBfaGFuZGxlcilcbiAgICAgIH1cblxuICAgICAgLy8gTGV04oCZcyBhbHNvIGRvIGEgb25lLXRpbWUgYmluZGluZyBvZiB3aW5kb3cgZXZlbnQgbGlzdGVuZXJzLlxuICAgICAgaWYgKCFzci5pbml0aWFsaXplZCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgX2hhbmRsZXIpXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBfaGFuZGxlcilcbiAgICAgICAgc3IuaW5pdGlhbGl6ZWQgPSB0cnVlXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzclxuICB9XG5cbiAgZnVuY3Rpb24gX2hhbmRsZXIgKCkge1xuICAgIF9yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoX2FuaW1hdGUpXG4gIH1cblxuICBmdW5jdGlvbiBfc2V0QWN0aXZlU2VxdWVuY2VzICgpIHtcbiAgICB2YXIgYWN0aXZlXG4gICAgdmFyIGVsZW1cbiAgICB2YXIgZWxlbUlkXG4gICAgdmFyIHNlcXVlbmNlXG5cbiAgICAvLyBMb29wIHRocm91Z2ggYWxsIHNlcXVlbmNlc1xuICAgIHNyLnRvb2xzLmZvck93bihzci5zZXF1ZW5jZXMsIGZ1bmN0aW9uIChzZXF1ZW5jZUlkKSB7XG4gICAgICBzZXF1ZW5jZSA9IHNyLnNlcXVlbmNlc1tzZXF1ZW5jZUlkXVxuICAgICAgYWN0aXZlID0gZmFsc2VcblxuICAgICAgLy8gRm9yIGVhY2ggc2VxdWVuY2VkIGVsZW1lbmV0LCBsZXTigJlzIGNoZWNrIHZpc2liaWxpdHkgYW5kIGlmXG4gICAgICAvLyBhbnkgYXJlIHZpc2libGUsIHNldCBpdOKAmXMgc2VxdWVuY2UgdG8gYWN0aXZlLlxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZXF1ZW5jZS5lbGVtSWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGVsZW1JZCA9IHNlcXVlbmNlLmVsZW1JZHNbaV1cbiAgICAgICAgZWxlbSA9IHNyLnN0b3JlLmVsZW1lbnRzW2VsZW1JZF1cbiAgICAgICAgaWYgKF9pc0VsZW1WaXNpYmxlKGVsZW0pICYmICFhY3RpdmUpIHtcbiAgICAgICAgICBhY3RpdmUgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VxdWVuY2UuYWN0aXZlID0gYWN0aXZlXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIF9hbmltYXRlICgpIHtcbiAgICB2YXIgZGVsYXllZFxuICAgIHZhciBlbGVtXG5cbiAgICBfc2V0QWN0aXZlU2VxdWVuY2VzKClcblxuICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgZWxlbWVudHMgaW4gdGhlIHN0b3JlXG4gICAgc3IudG9vbHMuZm9yT3duKHNyLnN0b3JlLmVsZW1lbnRzLCBmdW5jdGlvbiAoZWxlbUlkKSB7XG4gICAgICBlbGVtID0gc3Iuc3RvcmUuZWxlbWVudHNbZWxlbUlkXVxuICAgICAgZGVsYXllZCA9IF9zaG91bGRVc2VEZWxheShlbGVtKVxuXG4gICAgICAvLyBMZXTigJlzIHNlZSBpZiB3ZSBzaG91bGQgcmV2ZWFsYW5kIGlmIHNvLFxuICAgICAgLy8gdHJpZ2dlciB0aGUgYGJlZm9yZVJldmVhbGAgY2FsbGJhY2sgYW5kXG4gICAgICAvLyBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgdG8gdXNlIGRlbGF5LlxuICAgICAgaWYgKF9zaG91bGRSZXZlYWwoZWxlbSkpIHtcbiAgICAgICAgZWxlbS5jb25maWcuYmVmb3JlUmV2ZWFsKGVsZW0uZG9tRWwpXG4gICAgICAgIGlmIChkZWxheWVkKSB7XG4gICAgICAgICAgZWxlbS5kb21FbC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJyxcbiAgICAgICAgICAgIGVsZW0uc3R5bGVzLmlubGluZSArXG4gICAgICAgICAgICBlbGVtLnN0eWxlcy50cmFuc2Zvcm0udGFyZ2V0ICtcbiAgICAgICAgICAgIGVsZW0uc3R5bGVzLnRyYW5zaXRpb24uZGVsYXllZFxuICAgICAgICAgIClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbGVtLmRvbUVsLnNldEF0dHJpYnV0ZSgnc3R5bGUnLFxuICAgICAgICAgICAgZWxlbS5zdHlsZXMuaW5saW5lICtcbiAgICAgICAgICAgIGVsZW0uc3R5bGVzLnRyYW5zZm9ybS50YXJnZXQgK1xuICAgICAgICAgICAgZWxlbS5zdHlsZXMudHJhbnNpdGlvbi5pbnN0YW50XG4gICAgICAgICAgKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTGV04oCZcyBxdWV1ZSB0aGUgYGFmdGVyUmV2ZWFsYCBjYWxsYmFja1xuICAgICAgICAvLyBhbmQgbWFyayB0aGUgZWxlbWVudCBhcyBzZWVuIGFuZCByZXZlYWxpbmcuXG4gICAgICAgIF9xdWV1ZUNhbGxiYWNrKCdyZXZlYWwnLCBlbGVtLCBkZWxheWVkKVxuICAgICAgICBlbGVtLnJldmVhbGluZyA9IHRydWVcbiAgICAgICAgZWxlbS5zZWVuID0gdHJ1ZVxuXG4gICAgICAgIGlmIChlbGVtLnNlcXVlbmNlKSB7XG4gICAgICAgICAgX3F1ZXVlTmV4dEluU2VxdWVuY2UoZWxlbSwgZGVsYXllZClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChfc2hvdWxkUmVzZXQoZWxlbSkpIHtcbiAgICAgICAgLy9PdGhlcndpc2UgcmVzZXQgb3VyIGVsZW1lbnQgYW5kXG4gICAgICAgIC8vIHRyaWdnZXIgdGhlIGBiZWZvcmVSZXNldGAgY2FsbGJhY2suXG4gICAgICAgIGVsZW0uY29uZmlnLmJlZm9yZVJlc2V0KGVsZW0uZG9tRWwpXG4gICAgICAgIGVsZW0uZG9tRWwuc2V0QXR0cmlidXRlKCdzdHlsZScsXG4gICAgICAgICAgZWxlbS5zdHlsZXMuaW5saW5lICtcbiAgICAgICAgICBlbGVtLnN0eWxlcy50cmFuc2Zvcm0uaW5pdGlhbCArXG4gICAgICAgICAgZWxlbS5zdHlsZXMudHJhbnNpdGlvbi5pbnN0YW50XG4gICAgICAgIClcbiAgICAgICAgLy8gQW5kIHF1ZXVlIHRoZSBgYWZ0ZXJSZXNldGAgY2FsbGJhY2suXG4gICAgICAgIF9xdWV1ZUNhbGxiYWNrKCdyZXNldCcsIGVsZW0pXG4gICAgICAgIGVsZW0ucmV2ZWFsaW5nID0gZmFsc2VcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gX3F1ZXVlTmV4dEluU2VxdWVuY2UgKGVsZW0sIGRlbGF5ZWQpIHtcbiAgICB2YXIgZWxhcHNlZCA9IDBcbiAgICB2YXIgZGVsYXkgPSAwXG4gICAgdmFyIHNlcXVlbmNlID0gc3Iuc2VxdWVuY2VzW2VsZW0uc2VxdWVuY2UuaWRdXG5cbiAgICAvLyBXZeKAmXJlIHByb2Nlc3NpbmcgYSBzZXF1ZW5jZWQgZWxlbWVudCwgc28gbGV0J3MgYmxvY2sgb3RoZXIgZWxlbWVudHMgaW4gdGhpcyBzZXF1ZW5jZS5cbiAgICBzZXF1ZW5jZS5ibG9ja2VkID0gdHJ1ZVxuXG4gICAgLy8gU2luY2Ugd2XigJlyZSB0cmlnZ2VyaW5nIGFuaW1hdGlvbnMgYSBwYXJ0IG9mIGEgc2VxdWVuY2UgYWZ0ZXIgYW5pbWF0aW9ucyBvbiBmaXJzdCBsb2FkLFxuICAgIC8vIHdlIG5lZWQgdG8gY2hlY2sgZm9yIHRoYXQgY29uZGl0aW9uIGFuZCBleHBsaWNpdGx5IGFkZCB0aGUgZGVsYXkgdG8gb3VyIHRpbWVyLlxuICAgIGlmIChkZWxheWVkICYmIGVsZW0uY29uZmlnLnVzZURlbGF5ID09PSAnb25sb2FkJykge1xuICAgICAgZGVsYXkgPSBlbGVtLmNvbmZpZy5kZWxheVxuICAgIH1cblxuICAgIC8vIElmIGEgc2VxdWVuY2UgdGltZXIgaXMgYWxyZWFkeSBydW5uaW5nLCBjYXB0dXJlIHRoZSBlbGFwc2VkIHRpbWUgYW5kIGNsZWFyIGl0LlxuICAgIGlmIChlbGVtLnNlcXVlbmNlLnRpbWVyKSB7XG4gICAgICBlbGFwc2VkID0gTWF0aC5hYnMoZWxlbS5zZXF1ZW5jZS50aW1lci5zdGFydGVkIC0gbmV3IERhdGUoKSlcbiAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoZWxlbS5zZXF1ZW5jZS50aW1lcilcbiAgICB9XG5cbiAgICAvLyBTdGFydCBhIG5ldyB0aW1lci5cbiAgICBlbGVtLnNlcXVlbmNlLnRpbWVyID0geyBzdGFydGVkOiBuZXcgRGF0ZSgpIH1cbiAgICBlbGVtLnNlcXVlbmNlLnRpbWVyLmNsb2NrID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgLy8gU2VxdWVuY2UgaW50ZXJ2YWwgaGFzIHBhc3NlZCwgc28gdW5ibG9jayB0aGUgc2VxdWVuY2UgYW5kIHJlLXJ1biB0aGUgaGFuZGxlci5cbiAgICAgIHNlcXVlbmNlLmJsb2NrZWQgPSBmYWxzZVxuICAgICAgZWxlbS5zZXF1ZW5jZS50aW1lciA9IG51bGxcbiAgICAgIF9oYW5kbGVyKClcbiAgICB9LCBNYXRoLmFicyhzZXF1ZW5jZS5pbnRlcnZhbCkgKyBkZWxheSAtIGVsYXBzZWQpXG4gIH1cblxuICBmdW5jdGlvbiBfcXVldWVDYWxsYmFjayAodHlwZSwgZWxlbSwgZGVsYXllZCkge1xuICAgIHZhciBlbGFwc2VkID0gMFxuICAgIHZhciBkdXJhdGlvbiA9IDBcbiAgICB2YXIgY2FsbGJhY2sgPSAnYWZ0ZXInXG5cbiAgICAvLyBDaGVjayB3aGljaCBjYWxsYmFjayB3ZeKAmXJlIHdvcmtpbmcgd2l0aC5cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ3JldmVhbCc6XG4gICAgICAgIGR1cmF0aW9uID0gZWxlbS5jb25maWcuZHVyYXRpb25cbiAgICAgICAgaWYgKGRlbGF5ZWQpIHtcbiAgICAgICAgICBkdXJhdGlvbiArPSBlbGVtLmNvbmZpZy5kZWxheVxuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrICs9ICdSZXZlYWwnXG4gICAgICAgIGJyZWFrXG5cbiAgICAgIGNhc2UgJ3Jlc2V0JzpcbiAgICAgICAgZHVyYXRpb24gPSBlbGVtLmNvbmZpZy5kdXJhdGlvblxuICAgICAgICBjYWxsYmFjayArPSAnUmVzZXQnXG4gICAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgLy8gSWYgYSB0aW1lciBpcyBhbHJlYWR5IHJ1bm5pbmcsIGNhcHR1cmUgdGhlIGVsYXBzZWQgdGltZSBhbmQgY2xlYXIgaXQuXG4gICAgaWYgKGVsZW0udGltZXIpIHtcbiAgICAgIGVsYXBzZWQgPSBNYXRoLmFicyhlbGVtLnRpbWVyLnN0YXJ0ZWQgLSBuZXcgRGF0ZSgpKVxuICAgICAgd2luZG93LmNsZWFyVGltZW91dChlbGVtLnRpbWVyLmNsb2NrKVxuICAgIH1cblxuICAgIC8vIFN0YXJ0IGEgbmV3IHRpbWVyLlxuICAgIGVsZW0udGltZXIgPSB7IHN0YXJ0ZWQ6IG5ldyBEYXRlKCkgfVxuICAgIGVsZW0udGltZXIuY2xvY2sgPSB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBUaGUgdGltZXIgY29tcGxldGVkLCBzbyBsZXTigJlzIGZpcmUgdGhlIGNhbGxiYWNrIGFuZCBudWxsIHRoZSB0aW1lci5cbiAgICAgIGVsZW0uY29uZmlnW2NhbGxiYWNrXShlbGVtLmRvbUVsKVxuICAgICAgZWxlbS50aW1lciA9IG51bGxcbiAgICB9LCBkdXJhdGlvbiAtIGVsYXBzZWQpXG4gIH1cblxuICBmdW5jdGlvbiBfc2hvdWxkUmV2ZWFsIChlbGVtKSB7XG4gICAgaWYgKGVsZW0uc2VxdWVuY2UpIHtcbiAgICAgIHZhciBzZXF1ZW5jZSA9IHNyLnNlcXVlbmNlc1tlbGVtLnNlcXVlbmNlLmlkXVxuICAgICAgcmV0dXJuIHNlcXVlbmNlLmFjdGl2ZSAmJlxuICAgICAgICAhc2VxdWVuY2UuYmxvY2tlZCAmJlxuICAgICAgICAhZWxlbS5yZXZlYWxpbmcgJiZcbiAgICAgICAgIWVsZW0uZGlzYWJsZWRcbiAgICB9XG4gICAgcmV0dXJuIF9pc0VsZW1WaXNpYmxlKGVsZW0pICYmXG4gICAgICAhZWxlbS5yZXZlYWxpbmcgJiZcbiAgICAgICFlbGVtLmRpc2FibGVkXG4gIH1cblxuICBmdW5jdGlvbiBfc2hvdWxkVXNlRGVsYXkgKGVsZW0pIHtcbiAgICB2YXIgY29uZmlnID0gZWxlbS5jb25maWcudXNlRGVsYXlcbiAgICByZXR1cm4gY29uZmlnID09PSAnYWx3YXlzJyB8fFxuICAgICAgKGNvbmZpZyA9PT0gJ29ubG9hZCcgJiYgIXNyLmluaXRpYWxpemVkKSB8fFxuICAgICAgKGNvbmZpZyA9PT0gJ29uY2UnICYmICFlbGVtLnNlZW4pXG4gIH1cblxuICBmdW5jdGlvbiBfc2hvdWxkUmVzZXQgKGVsZW0pIHtcbiAgICBpZiAoZWxlbS5zZXF1ZW5jZSkge1xuICAgICAgdmFyIHNlcXVlbmNlID0gc3Iuc2VxdWVuY2VzW2VsZW0uc2VxdWVuY2UuaWRdXG4gICAgICByZXR1cm4gIXNlcXVlbmNlLmFjdGl2ZSAmJlxuICAgICAgICBlbGVtLmNvbmZpZy5yZXNldCAmJlxuICAgICAgICBlbGVtLnJldmVhbGluZyAmJlxuICAgICAgICAhZWxlbS5kaXNhYmxlZFxuICAgIH1cbiAgICByZXR1cm4gIV9pc0VsZW1WaXNpYmxlKGVsZW0pICYmXG4gICAgICBlbGVtLmNvbmZpZy5yZXNldCAmJlxuICAgICAgZWxlbS5yZXZlYWxpbmcgJiZcbiAgICAgICFlbGVtLmRpc2FibGVkXG4gIH1cblxuICBmdW5jdGlvbiBfZ2V0Q29udGFpbmVyIChjb250YWluZXIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgd2lkdGg6IGNvbnRhaW5lci5jbGllbnRXaWR0aCxcbiAgICAgIGhlaWdodDogY29udGFpbmVyLmNsaWVudEhlaWdodFxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9nZXRTY3JvbGxlZCAoY29udGFpbmVyKSB7XG4gICAgLy8gUmV0dXJuIHRoZSBjb250YWluZXIgc2Nyb2xsIHZhbHVlcywgcGx1cyB0aGUgaXRzIG9mZnNldC5cbiAgICBpZiAoY29udGFpbmVyICYmIGNvbnRhaW5lciAhPT0gd2luZG93LmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkge1xuICAgICAgdmFyIG9mZnNldCA9IF9nZXRPZmZzZXQoY29udGFpbmVyKVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogY29udGFpbmVyLnNjcm9sbExlZnQgKyBvZmZzZXQubGVmdCxcbiAgICAgICAgeTogY29udGFpbmVyLnNjcm9sbFRvcCArIG9mZnNldC50b3BcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT3RoZXJ3aXNlLCBkZWZhdWx0IHRvIHRoZSB3aW5kb3cgb2JqZWN04oCZcyBzY3JvbGwgdmFsdWVzLlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogd2luZG93LnBhZ2VYT2Zmc2V0LFxuICAgICAgICB5OiB3aW5kb3cucGFnZVlPZmZzZXRcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfZ2V0T2Zmc2V0IChkb21FbCkge1xuICAgIHZhciBvZmZzZXRUb3AgPSAwXG4gICAgdmFyIG9mZnNldExlZnQgPSAwXG5cbiAgICAgIC8vIEdyYWIgdGhlIGVsZW1lbnTigJlzIGRpbWVuc2lvbnMuXG4gICAgdmFyIG9mZnNldEhlaWdodCA9IGRvbUVsLm9mZnNldEhlaWdodFxuICAgIHZhciBvZmZzZXRXaWR0aCA9IGRvbUVsLm9mZnNldFdpZHRoXG5cbiAgICAvLyBOb3cgY2FsY3VsYXRlIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBlbGVtZW50IGFuZCBpdHMgcGFyZW50LCB0aGVuXG4gICAgLy8gYWdhaW4gZm9yIHRoZSBwYXJlbnQgdG8gaXRzIHBhcmVudCwgYW5kIGFnYWluIGV0Yy4uLiB1bnRpbCB3ZSBoYXZlIHRoZVxuICAgIC8vIHRvdGFsIGRpc3RhbmNlIG9mIHRoZSBlbGVtZW50IHRvIHRoZSBkb2N1bWVudOKAmXMgdG9wIGFuZCBsZWZ0IG9yaWdpbi5cbiAgICBkbyB7XG4gICAgICBpZiAoIWlzTmFOKGRvbUVsLm9mZnNldFRvcCkpIHtcbiAgICAgICAgb2Zmc2V0VG9wICs9IGRvbUVsLm9mZnNldFRvcFxuICAgICAgfVxuICAgICAgaWYgKCFpc05hTihkb21FbC5vZmZzZXRMZWZ0KSkge1xuICAgICAgICBvZmZzZXRMZWZ0ICs9IGRvbUVsLm9mZnNldExlZnRcbiAgICAgIH1cbiAgICAgIGRvbUVsID0gZG9tRWwub2Zmc2V0UGFyZW50XG4gICAgfSB3aGlsZSAoZG9tRWwpXG5cbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiBvZmZzZXRUb3AsXG4gICAgICBsZWZ0OiBvZmZzZXRMZWZ0LFxuICAgICAgaGVpZ2h0OiBvZmZzZXRIZWlnaHQsXG4gICAgICB3aWR0aDogb2Zmc2V0V2lkdGhcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfaXNFbGVtVmlzaWJsZSAoZWxlbSkge1xuICAgIHZhciBvZmZzZXQgPSBfZ2V0T2Zmc2V0KGVsZW0uZG9tRWwpXG4gICAgdmFyIGNvbnRhaW5lciA9IF9nZXRDb250YWluZXIoZWxlbS5jb25maWcuY29udGFpbmVyKVxuICAgIHZhciBzY3JvbGxlZCA9IF9nZXRTY3JvbGxlZChlbGVtLmNvbmZpZy5jb250YWluZXIpXG4gICAgdmFyIHZGID0gZWxlbS5jb25maWcudmlld0ZhY3RvclxuXG4gICAgICAvLyBEZWZpbmUgdGhlIGVsZW1lbnQgZ2VvbWV0cnkuXG4gICAgdmFyIGVsZW1IZWlnaHQgPSBvZmZzZXQuaGVpZ2h0XG4gICAgdmFyIGVsZW1XaWR0aCA9IG9mZnNldC53aWR0aFxuICAgIHZhciBlbGVtVG9wID0gb2Zmc2V0LnRvcFxuICAgIHZhciBlbGVtTGVmdCA9IG9mZnNldC5sZWZ0XG4gICAgdmFyIGVsZW1Cb3R0b20gPSBlbGVtVG9wICsgZWxlbUhlaWdodFxuICAgIHZhciBlbGVtUmlnaHQgPSBlbGVtTGVmdCArIGVsZW1XaWR0aFxuXG4gICAgcmV0dXJuIGNvbmZpcm1Cb3VuZHMoKSB8fCBpc1Bvc2l0aW9uRml4ZWQoKVxuXG4gICAgZnVuY3Rpb24gY29uZmlybUJvdW5kcyAoKSB7XG4gICAgICAvLyBEZWZpbmUgdGhlIGVsZW1lbnTigJlzIGZ1bmN0aW9uYWwgYm91bmRhcmllcyB1c2luZyBpdHMgdmlldyBmYWN0b3IuXG4gICAgICB2YXIgdG9wID0gZWxlbVRvcCArIGVsZW1IZWlnaHQgKiB2RlxuICAgICAgdmFyIGxlZnQgPSBlbGVtTGVmdCArIGVsZW1XaWR0aCAqIHZGXG4gICAgICB2YXIgYm90dG9tID0gZWxlbUJvdHRvbSAtIGVsZW1IZWlnaHQgKiB2RlxuICAgICAgdmFyIHJpZ2h0ID0gZWxlbVJpZ2h0IC0gZWxlbVdpZHRoICogdkZcblxuICAgICAgLy8gRGVmaW5lIHRoZSBjb250YWluZXIgZnVuY3Rpb25hbCBib3VuZGFyaWVzIHVzaW5nIGl0cyB2aWV3IG9mZnNldC5cbiAgICAgIHZhciB2aWV3VG9wID0gc2Nyb2xsZWQueSArIGVsZW0uY29uZmlnLnZpZXdPZmZzZXQudG9wXG4gICAgICB2YXIgdmlld0xlZnQgPSBzY3JvbGxlZC54ICsgZWxlbS5jb25maWcudmlld09mZnNldC5sZWZ0XG4gICAgICB2YXIgdmlld0JvdHRvbSA9IHNjcm9sbGVkLnkgLSBlbGVtLmNvbmZpZy52aWV3T2Zmc2V0LmJvdHRvbSArIGNvbnRhaW5lci5oZWlnaHRcbiAgICAgIHZhciB2aWV3UmlnaHQgPSBzY3JvbGxlZC54IC0gZWxlbS5jb25maWcudmlld09mZnNldC5yaWdodCArIGNvbnRhaW5lci53aWR0aFxuXG4gICAgICByZXR1cm4gdG9wIDwgdmlld0JvdHRvbSAmJlxuICAgICAgICBib3R0b20gPiB2aWV3VG9wICYmXG4gICAgICAgIGxlZnQgPiB2aWV3TGVmdCAmJlxuICAgICAgICByaWdodCA8IHZpZXdSaWdodFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzUG9zaXRpb25GaXhlZCAoKSB7XG4gICAgICByZXR1cm4gKHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0uZG9tRWwpLnBvc2l0aW9uID09PSAnZml4ZWQnKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVdGlsaXRpZXNcbiAgICogLS0tLS0tLS0tXG4gICAqL1xuXG4gIGZ1bmN0aW9uIFRvb2xzICgpIHt9XG5cbiAgVG9vbHMucHJvdG90eXBlLmlzT2JqZWN0ID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgIT09IG51bGwgJiYgdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcgJiYgb2JqZWN0LmNvbnN0cnVjdG9yID09PSBPYmplY3RcbiAgfVxuXG4gIFRvb2xzLnByb3RvdHlwZS5pc05vZGUgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgcmV0dXJuIHR5cGVvZiB3aW5kb3cuTm9kZSA9PT0gJ29iamVjdCdcbiAgICAgID8gb2JqZWN0IGluc3RhbmNlb2Ygd2luZG93Lk5vZGVcbiAgICAgIDogb2JqZWN0ICYmIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnICYmXG4gICAgICAgIHR5cGVvZiBvYmplY3Qubm9kZVR5cGUgPT09ICdudW1iZXInICYmXG4gICAgICAgIHR5cGVvZiBvYmplY3Qubm9kZU5hbWUgPT09ICdzdHJpbmcnXG4gIH1cblxuICBUb29scy5wcm90b3R5cGUuaXNOb2RlTGlzdCA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICB2YXIgcHJvdG90eXBlVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KVxuICAgIHZhciByZWdleCA9IC9eXFxbb2JqZWN0IChIVE1MQ29sbGVjdGlvbnxOb2RlTGlzdHxPYmplY3QpXFxdJC9cblxuICAgIHJldHVybiB0eXBlb2Ygd2luZG93Lk5vZGVMaXN0ID09PSAnb2JqZWN0J1xuICAgICAgPyBvYmplY3QgaW5zdGFuY2VvZiB3aW5kb3cuTm9kZUxpc3RcbiAgICAgIDogb2JqZWN0ICYmIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnICYmXG4gICAgICAgIHJlZ2V4LnRlc3QocHJvdG90eXBlVG9TdHJpbmcpICYmXG4gICAgICAgIHR5cGVvZiBvYmplY3QubGVuZ3RoID09PSAnbnVtYmVyJyAmJlxuICAgICAgICAob2JqZWN0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmlzTm9kZShvYmplY3RbMF0pKVxuICB9XG5cbiAgVG9vbHMucHJvdG90eXBlLmZvck93biA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCF0aGlzLmlzT2JqZWN0KG9iamVjdCkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwib2JqZWN0XCIsIGJ1dCByZWNlaXZlZCBcIicgKyB0eXBlb2Ygb2JqZWN0ICsgJ1wiLicpXG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIHByb3BlcnR5IGluIG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KHByb3BlcnR5KSkge1xuICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgVG9vbHMucHJvdG90eXBlLmV4dGVuZCA9IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSkge1xuICAgIHRoaXMuZm9yT3duKHNvdXJjZSwgZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICBpZiAodGhpcy5pc09iamVjdChzb3VyY2VbcHJvcGVydHldKSkge1xuICAgICAgICBpZiAoIXRhcmdldFtwcm9wZXJ0eV0gfHwgIXRoaXMuaXNPYmplY3QodGFyZ2V0W3Byb3BlcnR5XSkpIHtcbiAgICAgICAgICB0YXJnZXRbcHJvcGVydHldID0ge31cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV4dGVuZCh0YXJnZXRbcHJvcGVydHldLCBzb3VyY2VbcHJvcGVydHldKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGFyZ2V0W3Byb3BlcnR5XSA9IHNvdXJjZVtwcm9wZXJ0eV1cbiAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpXG4gICAgcmV0dXJuIHRhcmdldFxuICB9XG5cbiAgVG9vbHMucHJvdG90eXBlLmV4dGVuZENsb25lID0gZnVuY3Rpb24gKHRhcmdldCwgc291cmNlKSB7XG4gICAgcmV0dXJuIHRoaXMuZXh0ZW5kKHRoaXMuZXh0ZW5kKHt9LCB0YXJnZXQpLCBzb3VyY2UpXG4gIH1cblxuICBUb29scy5wcm90b3R5cGUuaXNNb2JpbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIC9BbmRyb2lkfHdlYk9TfGlQaG9uZXxpUGFkfGlQb2R8QmxhY2tCZXJyeXxJRU1vYmlsZXxPcGVyYSBNaW5pL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KVxuICB9XG5cbiAgLyoqXG4gICAqIFBvbHlmaWxsc1xuICAgKiAtLS0tLS0tLVxuICAgKi9cblxuICBfcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICB3aW5kb3cuc2V0VGltZW91dChjYWxsYmFjaywgMTAwMCAvIDYwKVxuICAgIH1cblxuICAvKipcbiAgICogTW9kdWxlIFdyYXBwZXJcbiAgICogLS0tLS0tLS0tLS0tLS1cbiAgICovXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09PSAnb2JqZWN0JyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBTY3JvbGxSZXZlYWxcbiAgICB9KVxuICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBTY3JvbGxSZXZlYWxcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cuU2Nyb2xsUmV2ZWFsID0gU2Nyb2xsUmV2ZWFsXG4gIH1cbn0oKSlcbiIsIi8qIVxuICogalF1ZXJ5IGNsaXAtcGF0aC1wb2x5Z29uIFBsdWdpbiB2MC4xLjExICgyMDE2LTEyLTIwKVxuICogalF1ZXJ5IHBsdWdpbiB0aGF0IG1ha2VzIGVhc3kgdG8gdXNlIGNsaXAtcGF0aCBvbiB3aGF0ZXZlciB0YWcgdW5kZXIgZGlmZmVyZW50IGJyb3dzZXJzXG4gKiBodHRwczovL2dpdGh1Yi5jb20vYW5kcnVzaWVjemtvL2NsaXAtcGF0aC1wb2x5Z29uXG4gKiBcbiAqIENvcHlyaWdodCAyMDE2IEthcm9sIEFuZHJ1c2llY3prb1xuICogUmVsZWFzZWQgdW5kZXIgTUlUIGxpY2Vuc2VcbiAqL1xudmFyIGdsb2JhbFZhcmlhYmxlPXdpbmRvd3x8cm9vdCxqUXVlcnk9alF1ZXJ5fHxnbG9iYWxWYXJpYWJsZS5qUXVlcnl8fHJlcXVpcmUmJnJlcXVpcmUoXCJqcXVlcnlcIik7KGZ1bmN0aW9uKGEpe3ZhciBiPTAsYz1mdW5jdGlvbihhLGMsZCxlKXt0aGlzLiQ9YSx0aGlzLiRlbD1jLHRoaXMucG9pbnRzPWQsdGhpcy5zdmdEZWZJZD1cImNsaXBQYXRoUG9seWdvbkdlbklkXCIrYisrLHRoaXMucHJvY2Vzc09wdGlvbnMoZSl9O1widW5kZWZpbmVkXCIhPXR5cGVvZiBleHBvcnRzPyhcInVuZGVmaW5lZFwiIT10eXBlb2YgbW9kdWxlJiZtb2R1bGUuZXhwb3J0cyYmKGV4cG9ydHM9bW9kdWxlLmV4cG9ydHM9YyksZXhwb3J0cy5DbGlwUGF0aD1jKTpnbG9iYWxWYXJpYWJsZS5DbGlwUGF0aD1jLGMucHJvdG90eXBlPXskOm51bGwsJGVsOm51bGwscG9pbnRzOm51bGwsaXNGb3JXZWJraXQ6ITAsaXNGb3JTdmc6ITAsc3ZnRGVmSWQ6bnVsbCxpc1BlcmNlbnRhZ2U6ITEsY3JlYXRlOmZ1bmN0aW9uKCl7dGhpcy5fY3JlYXRlQ2xpcFBhdGgodGhpcy5wb2ludHMpfSxfY3JlYXRlQ2xpcFBhdGg6ZnVuY3Rpb24oYSl7dGhpcy5fY3JlYXRlU3ZnRGVmcygpLHRoaXMuaXNGb3JTdmcmJnRoaXMuX2NyZWF0ZVN2Z0Jhc2VkQ2xpcFBhdGgoYSksdGhpcy5pc0ZvcldlYmtpdCYmdGhpcy5fY3JlYXRlV2Via2l0Q2xpcFBhdGgoYSl9LF9jcmVhdGVXZWJraXRDbGlwUGF0aDpmdW5jdGlvbihhKXt2YXIgYj1cInBvbHlnb24oXCIrdGhpcy5fdHJhbnNsYXRlUG9pbnRzKGEsITAsdGhpcy5pc1BlcmNlbnRhZ2UpK1wiKVwiO3RoaXMuJGVsLmNzcyhcIi13ZWJraXQtY2xpcC1wYXRoXCIsYil9LF9jcmVhdGVTdmdCYXNlZENsaXBQYXRoOmZ1bmN0aW9uKGEpe3RoaXMuJChcIiNcIit0aGlzLnN2Z0RlZklkKS5maW5kKFwicG9seWdvblwiKS5hdHRyKFwicG9pbnRzXCIsdGhpcy5fdHJhbnNsYXRlUG9pbnRzKGEsITEsdGhpcy5pc1BlcmNlbnRhZ2UpKSx0aGlzLiRlbC5jc3MoXCJjbGlwLXBhdGhcIixcInVybCgjXCIrdGhpcy5zdmdEZWZJZCtcIilcIil9LF90cmFuc2xhdGVQb2ludHM6ZnVuY3Rpb24oYSxiLGMpe3ZhciBkPVtdO2Zvcih2YXIgZSBpbiBhKXt2YXIgZj10aGlzLl9oYW5kbGVQeHMoYVtlXVswXSxiLGMpLGc9dGhpcy5faGFuZGxlUHhzKGFbZV1bMV0sYixjKTtkLnB1c2goZitcIiBcIitnKX1yZXR1cm4gZC5qb2luKFwiLCBcIil9LF9oYW5kbGVQeHM6ZnVuY3Rpb24oYSxiLGMpe3JldHVybiAwPT09YT9hOmI/YSsoYz9cIiVcIjpcInB4XCIpOmM/YS8xMDA6YX0sX2NyZWF0ZVN2Z0VsZW1lbnQ6ZnVuY3Rpb24oYSl7cmV0dXJuIHRoaXMuJChkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLGEpKX0sX2NyZWF0ZVN2Z0RlZnM6ZnVuY3Rpb24oKXtpZigwPT09dGhpcy4kKFwiI1wiK3RoaXMuc3ZnRGVmSWQpLmxlbmd0aCl7dmFyIGE9dGhpcy5fY3JlYXRlU3ZnRWxlbWVudChcInN2Z1wiKS5hdHRyKFwid2lkdGhcIiwwKS5hdHRyKFwiaGVpZ2h0XCIsMCkuY3NzKHtwb3NpdGlvbjpcImFic29sdXRlXCIsdmlzaWJpbGl0eTpcImhpZGRlblwiLHdpZHRoOjAsaGVpZ2h0OjB9KSxiPXRoaXMuX2NyZWF0ZVN2Z0VsZW1lbnQoXCJkZWZzXCIpO2EuYXBwZW5kKGIpO3ZhciBjPXRoaXMuX2NyZWF0ZVN2Z0VsZW1lbnQoXCJjbGlwUGF0aFwiKS5hdHRyKFwiaWRcIix0aGlzLnN2Z0RlZklkKTt0aGlzLmlzUGVyY2VudGFnZSYmYy5nZXQoMCkuc2V0QXR0cmlidXRlKFwiY2xpcFBhdGhVbml0c1wiLFwib2JqZWN0Qm91bmRpbmdCb3hcIiksYi5hcHBlbmQoYyk7dmFyIGQ9dGhpcy5fY3JlYXRlU3ZnRWxlbWVudChcInBvbHlnb25cIik7Yy5hcHBlbmQoZCksdGhpcy4kKFwiYm9keVwiKS5hcHBlbmQoYSl9fSxwcm9jZXNzT3B0aW9uczpmdW5jdGlvbihhKXt0aGlzLmlzRm9yV2Via2l0PWEmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBhLmlzRm9yV2Via2l0P2EuaXNGb3JXZWJraXQ6dGhpcy5pc0ZvcldlYmtpdCx0aGlzLmlzRm9yU3ZnPWEmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBhLmlzRm9yU3ZnP2EuaXNGb3JTdmc6dGhpcy5pc0ZvclN2Zyx0aGlzLmlzUGVyY2VudGFnZT1hJiZhLmlzUGVyY2VudGFnZXx8dGhpcy5pc1BlcmNlbnRhZ2UsdGhpcy5zdmdEZWZJZD1hJiZhLnN2Z0RlZklkfHx0aGlzLnN2Z0RlZklkfX0sYS5mbi5jbGlwUGF0aD1mdW5jdGlvbihiLGQpe3JldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oKXt2YXIgZT1hKHRoaXMpLGY9bmV3IGMoYSxlLGIsZCk7Zi5jcmVhdGUoKX0pfX0pLmNhbGwodGhpcyxqUXVlcnkpOyIsIihmdW5jdGlvbiAoJCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICAkKHdpbmRvdykuYmluZCgnbG9hZCcsIGZ1bmN0aW9uICgpIHtcblxuICAgIC8vIGluaXRpYXRlIGZvdW5kYXRpb25cblxuICAgICQoZG9jdW1lbnQpLmZvdW5kYXRpb24oKTtcblxuICAgIC8vIGhhbWJ1cmdlciBpY29uIGFuaW1hdGlvblxuXG4gICAgJCgnI29mZkNhbnZhcycpLmJpbmQoJ29wZW5lZC56Zi5vZmZjYW52YXMgY2xvc2VkLnpmLm9mZmNhbnZhcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICQoJy5tZW51LWljb24nKS50b2dnbGVDbGFzcygncm90YXRlJyk7XG4gICAgfSk7XG5cbiAgfSk7XG5cbiAgLy8gY2xpcC1wYXRoIHBvbHlmaWxsIGZvciAnYnJhbmRzJyBwYWdlXG5cbiAgZnVuY3Rpb24gY2xpcHBhdGhQb2x5ZmlsbCgpIHtcbiAgICB2YXIgZXZlblBvaW50cyA9IFtbNSwgMTAwXSwgWzUsIDYwXSwgWzAsIDUwXSwgWzUsIDQwXSwgWzUsIDBdLCBbMTAwLCAwXSwgWzEwMCwgMTAwXV07XG4gICAgdmFyIG9kZFBvaW50cyA9IFtbOTUsIDYwXSwgWzk1LCAxMDBdLCBbMCwgMTAwXSwgWzAsIDBdLCBbOTUsIDBdLCBbOTUsIDQwXSwgWzEwMCwgNTBdXTtcbiAgICB2YXIgc21hbGxQb2ludHMgPSBbWzEwMCwgOTVdLCBbNjAsIDk1XSwgWzUwLCAxMDBdLCBbNDAsIDk1XSwgWzAsIDk1XSwgWzAsIDBdLCBbMTAwLCAwXV07XG4gICAgdmFyIGN1cnJlbnRfd2lkdGggPSAkKHdpbmRvdykud2lkdGgoKTtcbiAgICBpZihjdXJyZW50X3dpZHRoIDwgNjQwKXtcbiAgICAgICQoJy52aWV3cy1yb3ctb2RkIC50ZXh0JykuY2xpcFBhdGgoc21hbGxQb2ludHMsIHtcbiAgICAgICAgaXNQZXJjZW50YWdlOiB0cnVlLFxuICAgICAgICBzdmdEZWZJZDogJ3NtYWxsb2RkU3ZnJ1xuICAgICAgfSk7XG4gICAgICAkKCcudmlld3Mtcm93LWV2ZW4gLnRleHQnKS5jbGlwUGF0aChzbWFsbFBvaW50cywge1xuICAgICAgICBpc1BlcmNlbnRhZ2U6IHRydWUsXG4gICAgICAgIHN2Z0RlZklkOiAnc21hbGxldmVuU3ZnJ1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICQoJy52aWV3cy1yb3ctb2RkIC50ZXh0JykuY2xpcFBhdGgob2RkUG9pbnRzLCB7XG4gICAgICAgIGlzUGVyY2VudGFnZTogdHJ1ZSxcbiAgICAgICAgc3ZnRGVmSWQ6ICdvZGRTdmcnXG4gICAgICB9KTtcbiAgICAgICQoJy52aWV3cy1yb3ctZXZlbiAudGV4dCcpLmNsaXBQYXRoKGV2ZW5Qb2ludHMsIHtcbiAgICAgICAgaXNQZXJjZW50YWdlOiB0cnVlLFxuICAgICAgICBzdmdEZWZJZDogJ2V2ZW5TdmcnXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAkKGRvY3VtZW50KS5yZWFkeShjbGlwcGF0aFBvbHlmaWxsKTtcblxuICAkKHdpbmRvdykucmVzaXplKGNsaXBwYXRoUG9seWZpbGwpO1xuXG4gICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XG5cbiAgICAvLyBhZGQgY2xhc3NlcyB0byBzcGxpdCBjb2x1bW5zIG9uIHByb2R1Y3QgcmFuZ2VzIHBhZ2VcblxuICAgICQoJy52aWV3cy1yb3ctZXZlbiAudGV4dCcpLmFkZENsYXNzKCdtZWRpdW0tcHVzaC00IGxhcmdlLXB1c2gtNicpO1xuICAgICQoJy52aWV3cy1yb3ctZXZlbiAubG9nbycpLmFkZENsYXNzKCdtZWRpdW0tcHVsbC04IGxhcmdlLXB1bGwtNicpO1xuXG4gICAgLy8gd3JhcCBsaSdzIGFyb3VuZCBsaW5rcyBpbiBtb2JpbGUgbmF2aWdhdGlvblxuXG4gICAgJCgnLm9mZi1jYW52YXMtbGlzdD5hJykud3JhcCgnPGxpIC8+Jyk7XG5cbiAgICAvLyB3cmFwIGEncyBhcm91bmQgY3VycmVudCBwYWdpbmF0aW9uIG51bWJlcnNcblxuICAgICQoJ2xpLnBhZ2VyLWN1cnJlbnQsIGxpLnBhZ2VyLWVsbGlwc2lzJykud3JhcElubmVyKCc8YSAvPicpO1xuXG4gICAgLy8gdW53cmFwIHVsIGZyb20gbW9iaWxlIG5hdmlnYXRpb25cblxuICAgICQoJy5vZmYtY2FudmFzLWxpc3QgdWwjbWFpbi1tZW51LWxpbmtzPmxpJykudW53cmFwKCk7XG5cbiAgICAvLyBhZGQgYmxvY2sgZ3JpZCBjbGFzcyB0byBzaXRlIG1hcCBsaXN0XG5cbiAgICAkKCcuc2l0ZS1tYXAtYm94LW1lbnU+LmNvbnRlbnQ+dWwuc2l0ZS1tYXAtbWVudScpLmFkZENsYXNzKCdyb3cgc21hbGwtdXAtMiBtZWRpdW0tdXAtMycpO1xuXG4gICAgLy8gYWRkIGNvbHVtbiB0byBsaSBvbiBibG9jayBncmlkIG9uIHNpdGUgbWFwIHBhZ2VcblxuICAgICQoJy5zaXRlLW1hcC1ib3gtbWVudT4uY29udGVudD51bC5zaXRlLW1hcC1tZW51PmxpJykuYWRkQ2xhc3MoJ2NvbHVtbicpO1xuXG4gICAgLy8gYWRkIGg0IHRhZ3MgdG8gcGFnZSB0aXRsZXMgb24gc2l0ZSBtYXAgcGFnZVxuXG4gICAgJCgnLnNpdGUtbWFwLWJveC1tZW51Pi5jb250ZW50PnVsLnNpdGUtbWFwLW1lbnU+bGk+YScpLndyYXAoJzxoNCAvPicpO1xuXG4gICAgLy8gYWRkIHN2ZyBpY29uIHRvIGRvd25sb2FkIGxpbmtcblxuICAgICQoJzxzdmcgY2xhc3M9XCJpY29uIGljb24tZG93bmxvYWRcIj48dXNlIHhsaW5rOmhyZWY9XCIjaWNvbi1kb3dubG9hZFwiPjwvdXNlPjwvc3ZnPicpLnByZXBlbmRUbygnLm1ham9yLWhlYWRlcj4uY2F0YWxvZ3VlLWxpbms+bGk+YScpO1xuXG4gICAgLy8gd3JhcCB0YWJsZXMgd2l0aCBvdmVyZmxvdyBhdXRvXG5cbiAgICAkKCd0YWJsZScpLndyYXAoJzxkaXYgY2xhc3M9XCJvdmVyZmxvdy1hdXRvXCIgLz4nKTtcblxuICB9KTtcblxuICAvLyBoaWRlIG1hcHMgb3ZlcmxheSB3aGVuIGNsaWNrZWRcblxuICAkKCcuZ29vZ2xlLW1hcHMtb3ZlcmxheScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKCdoaWRlJyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9KTtcblxuICAvLyBjaGFuZ2UgdG8gNCBpdGVtIGJsb2NrIGdyaWQgd2hlbiBsb2dnZWQgaW4gZm9yIHByb2R1Y3QgZGF0YSBzaGVldHNcblxuICAkKCcubG9nZ2VkLWluIC52aWV3LXByb2R1Y3QtZGF0YS1zaGVldHMtbWFpbiB1bC5tZWRpdW0tdXAtMycpLmFkZENsYXNzKCdtZWRpdW0tdXAtNCcpLnJlbW92ZUNsYXNzKCdtZWRpdW0tdXAtMycpO1xuXG4gIC8vIGNvbGxhcHNpbmcgZmllbGRzZXRcblxuICAkKCcuZmllbGRzZXQtdGl0bGUnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgJCgnLnNlYXJjaC1hZHZhbmNlZCcpLnRvZ2dsZUNsYXNzKCdjb2xsYXBzaW5nJyk7XG4gICAgJCgnLmZpZWxkc2V0LXdyYXBwZXInKS50b2dnbGUoZnVuY3Rpb24gKCkge1xuICAgICAgJCh0aGlzKS5hbmltYXRlKHtoZWlnaHQ6ICcxNnB4J30sIDEwMDApO1xuICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh0aGlzKS5hbmltYXRlKHtoZWlnaHQ6ICdhdXRvJ30sIDEwMDApO1xuICAgIH0pO1xuICAgICQoJy5maWVsZHNldC13cmFwcGVyPi5jcml0ZXJpb24sIC5maWVsZHNldC13cmFwcGVyPi5hY3Rpb24nKS5mYWRlVG9nZ2xlKDUwMCk7XG4gICAgJCgnLmZpZWxkc2V0LWxlZ2VuZC1hcnJvdycpLnRvZ2dsZUNsYXNzKCdyb3RhdGVkJyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9KTtcblxuICAvLyBzY3JvbGwgdG8gc2VjdGlvbnNcblxuICAkKCdhW2hyZWYqPVxcXFwjXTpub3QoW2hyZWY9XFxcXCNdKScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAobG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXlxcLy8sJycpID09PSB0aGlzLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vLCcnKSAmJiBsb2NhdGlvbi5ob3N0bmFtZSA9PT0gdGhpcy5ob3N0bmFtZSkge1xuICAgICAgdmFyIHRhcmdldCA9ICQodGhpcy5oYXNoKTtcbiAgICAgIHRhcmdldCA9IHRhcmdldC5sZW5ndGggPyB0YXJnZXQgOiAkKCdbbmFtZT0nICsgdGhpcy5oYXNoLnNsaWNlKDEpICsnXScpO1xuICAgICAgaWYgKHRhcmdldC5sZW5ndGgpIHtcbiAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICAgIHNjcm9sbFRvcDogdGFyZ2V0Lm9mZnNldCgpLnRvcFxuICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8gRHJ1cGFsIGFqYXggKHVzZWZ1bCBmb3IgY2FwdGNoYSBvbiBmb3JtcylcblxuICBEcnVwYWwuYmVoYXZpb3JzLnJlY2FwY2hhX2FqYXhfYmVoYXZpb3VyID0ge1xuICAgIGF0dGFjaDogZnVuY3Rpb24gKGNvbnRleHQsIHNldHRpbmdzKSB7XG4gICAgICBpZiAodHlwZW9mIGdyZWNhcHRjaGEgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB2YXIgY2FwdGNoYXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdnLXJlY2FwdGNoYScpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhcHRjaGFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIHNpdGVfa2V5ID0gY2FwdGNoYXNbaV0uZ2V0QXR0cmlidXRlKCdkYXRhLXNpdGVrZXknKTtcbiAgICAgICAgICBpZiAoISQoY2FwdGNoYXNbaV0pLmh0bWwoKSkge1xuICAgICAgICAgICAgZ3JlY2FwdGNoYS5yZW5kZXIoY2FwdGNoYXNbaV0sIHsnc2l0ZWtleScgOiBzaXRlX2tleX0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG59KShqUXVlcnkpO1xuXG4vLyBhbmltYXRpb24gc2V0dGluZ3NcblxudmFyIGVudGVyTGVmdCA9IHtcbiAgb3JpZ2luOiAnbGVmdCcsXG4gIGRpc3RhbmNlIDogJzUwcHgnLFxufTtcblxudmFyIGVudGVyUmlnaHQgPSB7XG4gIG9yaWdpbjogJ3JpZ2h0JyxcbiAgZGlzdGFuY2UgOiAnNTBweCcsXG59O1xuXG52YXIgZW50ZXJMZWZ0MSA9IHtcbiAgZGVsYXk6IDEwMDAsXG4gIG9yaWdpbjogJ2xlZnQnLFxuICBkaXN0YW5jZSA6ICc1MHB4Jyxcbn07XG5cbnZhciBlbnRlclJpZ2h0MSA9IHtcbiAgZGVsYXk6IDEwMDAsXG4gIG9yaWdpbjogJ3JpZ2h0JyxcbiAgZGlzdGFuY2UgOiAnNTBweCcsXG59O1xuXG53aW5kb3cuc3IgPSBTY3JvbGxSZXZlYWwoKVxuICAucmV2ZWFsKCcuZW50ZXItYm90dG9tJylcbiAgLnJldmVhbCgnLmVudGVyLWJvdHRvbS0xJywge2RlbGF5OiA1MDB9KVxuICAucmV2ZWFsKCcuZW50ZXItYm90dG9tLTInLCB7ZGVsYXk6IDEwMDB9KVxuICAucmV2ZWFsKCcuZW50ZXItYm90dG9tLTMnLCB7ZGVsYXk6IDE1MDB9KVxuICAucmV2ZWFsKCcuZW50ZXItYm90dG9tLTQnLCB7ZGVsYXk6IDIwMDB9KVxuICAucmV2ZWFsKCcuZW50ZXItbGVmdCcsIGVudGVyTGVmdClcbiAgLnJldmVhbCgnLmVudGVyLXJpZ2h0JywgZW50ZXJSaWdodClcbiAgLnJldmVhbCgnLmVudGVyLWxlZnQtMScsIGVudGVyTGVmdDEpXG4gIC5yZXZlYWwoJy5lbnRlci1yaWdodC0xJywgZW50ZXJSaWdodDEpOyIsIi8qIVxuICogalF1ZXJ5IEZvcm0gUGx1Z2luXG4gKiB2ZXJzaW9uOiAzLjQ2LjAtMjAxMy4xMS4yMVxuICogUmVxdWlyZXMgalF1ZXJ5IHYxLjUgb3IgbGF0ZXJcbiAqIENvcHlyaWdodCAoYykgMjAxMyBNLiBBbHN1cFxuICogRXhhbXBsZXMgYW5kIGRvY3VtZW50YXRpb24gYXQ6IGh0dHA6Ly9tYWxzdXAuY29tL2pxdWVyeS9mb3JtL1xuICogUHJvamVjdCByZXBvc2l0b3J5OiBodHRwczovL2dpdGh1Yi5jb20vbWFsc3VwL2Zvcm1cbiAqIER1YWwgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBhbmQgR1BMIGxpY2Vuc2VzLlxuICogaHR0cHM6Ly9naXRodWIuY29tL21hbHN1cC9mb3JtI2NvcHlyaWdodC1hbmQtbGljZW5zZVxuICovXG4vKmdsb2JhbCBBY3RpdmVYT2JqZWN0ICovXG5cbi8vIEFNRCBzdXBwb3J0XG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIC8vIHVzaW5nIEFNRDsgcmVnaXN0ZXIgYXMgYW5vbiBtb2R1bGVcbiAgICAgICAgZGVmaW5lKFsnanF1ZXJ5J10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG5vIEFNRDsgaW52b2tlIGRpcmVjdGx5XG4gICAgICAgIGZhY3RvcnkoICh0eXBlb2YoalF1ZXJ5KSAhPSAndW5kZWZpbmVkJykgPyBqUXVlcnkgOiB3aW5kb3cuWmVwdG8gKTtcbiAgICB9XG59XG5cbihmdW5jdGlvbigkKSB7XG5cInVzZSBzdHJpY3RcIjtcblxuLypcbiAgICBVc2FnZSBOb3RlOlxuICAgIC0tLS0tLS0tLS0tXG4gICAgRG8gbm90IHVzZSBib3RoIGFqYXhTdWJtaXQgYW5kIGFqYXhGb3JtIG9uIHRoZSBzYW1lIGZvcm0uICBUaGVzZVxuICAgIGZ1bmN0aW9ucyBhcmUgbXV0dWFsbHkgZXhjbHVzaXZlLiAgVXNlIGFqYXhTdWJtaXQgaWYgeW91IHdhbnRcbiAgICB0byBiaW5kIHlvdXIgb3duIHN1Ym1pdCBoYW5kbGVyIHRvIHRoZSBmb3JtLiAgRm9yIGV4YW1wbGUsXG5cbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnI215Rm9ybScpLm9uKCdzdWJtaXQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7IC8vIDwtLSBpbXBvcnRhbnRcbiAgICAgICAgICAgICQodGhpcykuYWpheFN1Ym1pdCh7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnI291dHB1dCdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIFVzZSBhamF4Rm9ybSB3aGVuIHlvdSB3YW50IHRoZSBwbHVnaW4gdG8gbWFuYWdlIGFsbCB0aGUgZXZlbnQgYmluZGluZ1xuICAgIGZvciB5b3UuICBGb3IgZXhhbXBsZSxcblxuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcjbXlGb3JtJykuYWpheEZvcm0oe1xuICAgICAgICAgICAgdGFyZ2V0OiAnI291dHB1dCdcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBZb3UgY2FuIGFsc28gdXNlIGFqYXhGb3JtIHdpdGggZGVsZWdhdGlvbiAocmVxdWlyZXMgalF1ZXJ5IHYxLjcrKSwgc28gdGhlXG4gICAgZm9ybSBkb2VzIG5vdCBoYXZlIHRvIGV4aXN0IHdoZW4geW91IGludm9rZSBhamF4Rm9ybTpcblxuICAgICQoJyNteUZvcm0nKS5hamF4Rm9ybSh7XG4gICAgICAgIGRlbGVnYXRpb246IHRydWUsXG4gICAgICAgIHRhcmdldDogJyNvdXRwdXQnXG4gICAgfSk7XG5cbiAgICBXaGVuIHVzaW5nIGFqYXhGb3JtLCB0aGUgYWpheFN1Ym1pdCBmdW5jdGlvbiB3aWxsIGJlIGludm9rZWQgZm9yIHlvdVxuICAgIGF0IHRoZSBhcHByb3ByaWF0ZSB0aW1lLlxuKi9cblxuLyoqXG4gKiBGZWF0dXJlIGRldGVjdGlvblxuICovXG52YXIgZmVhdHVyZSA9IHt9O1xuZmVhdHVyZS5maWxlYXBpID0gJChcIjxpbnB1dCB0eXBlPSdmaWxlJy8+XCIpLmdldCgwKS5maWxlcyAhPT0gdW5kZWZpbmVkO1xuZmVhdHVyZS5mb3JtZGF0YSA9IHdpbmRvdy5Gb3JtRGF0YSAhPT0gdW5kZWZpbmVkO1xuXG52YXIgaGFzUHJvcCA9ICEhJC5mbi5wcm9wO1xuXG4vLyBhdHRyMiB1c2VzIHByb3Agd2hlbiBpdCBjYW4gYnV0IGNoZWNrcyB0aGUgcmV0dXJuIHR5cGUgZm9yXG4vLyBhbiBleHBlY3RlZCBzdHJpbmcuICB0aGlzIGFjY291bnRzIGZvciB0aGUgY2FzZSB3aGVyZSBhIGZvcm0gXG4vLyBjb250YWlucyBpbnB1dHMgd2l0aCBuYW1lcyBsaWtlIFwiYWN0aW9uXCIgb3IgXCJtZXRob2RcIjsgaW4gdGhvc2Vcbi8vIGNhc2VzIFwicHJvcFwiIHJldHVybnMgdGhlIGVsZW1lbnRcbiQuZm4uYXR0cjIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoICEgaGFzUHJvcCApXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB2YXIgdmFsID0gdGhpcy5wcm9wLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgaWYgKCAoIHZhbCAmJiB2YWwuanF1ZXJ5ICkgfHwgdHlwZW9mIHZhbCA9PT0gJ3N0cmluZycgKVxuICAgICAgICByZXR1cm4gdmFsO1xuICAgIHJldHVybiB0aGlzLmF0dHIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cbi8qKlxuICogYWpheFN1Ym1pdCgpIHByb3ZpZGVzIGEgbWVjaGFuaXNtIGZvciBpbW1lZGlhdGVseSBzdWJtaXR0aW5nXG4gKiBhbiBIVE1MIGZvcm0gdXNpbmcgQUpBWC5cbiAqL1xuJC5mbi5hamF4U3VibWl0ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIC8qanNoaW50IHNjcmlwdHVybDp0cnVlICovXG5cbiAgICAvLyBmYXN0IGZhaWwgaWYgbm90aGluZyBzZWxlY3RlZCAoaHR0cDovL2Rldi5qcXVlcnkuY29tL3RpY2tldC8yNzUyKVxuICAgIGlmICghdGhpcy5sZW5ndGgpIHtcbiAgICAgICAgbG9nKCdhamF4U3VibWl0OiBza2lwcGluZyBzdWJtaXQgcHJvY2VzcyAtIG5vIGVsZW1lbnQgc2VsZWN0ZWQnKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdmFyIG1ldGhvZCwgYWN0aW9uLCB1cmwsICRmb3JtID0gdGhpcztcblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7IHN1Y2Nlc3M6IG9wdGlvbnMgfTtcbiAgICB9XG4gICAgZWxzZSBpZiAoIG9wdGlvbnMgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cblxuICAgIG1ldGhvZCA9IG9wdGlvbnMudHlwZSB8fCB0aGlzLmF0dHIyKCdtZXRob2QnKTtcbiAgICBhY3Rpb24gPSBvcHRpb25zLnVybCAgfHwgdGhpcy5hdHRyMignYWN0aW9uJyk7XG5cbiAgICB1cmwgPSAodHlwZW9mIGFjdGlvbiA9PT0gJ3N0cmluZycpID8gJC50cmltKGFjdGlvbikgOiAnJztcbiAgICB1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLmhyZWYgfHwgJyc7XG4gICAgaWYgKHVybCkge1xuICAgICAgICAvLyBjbGVhbiB1cmwgKGRvbid0IGluY2x1ZGUgaGFzaCB2YXVlKVxuICAgICAgICB1cmwgPSAodXJsLm1hdGNoKC9eKFteI10rKS8pfHxbXSlbMV07XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcbiAgICAgICAgdXJsOiAgdXJsLFxuICAgICAgICBzdWNjZXNzOiAkLmFqYXhTZXR0aW5ncy5zdWNjZXNzLFxuICAgICAgICB0eXBlOiBtZXRob2QgfHwgJC5hamF4U2V0dGluZ3MudHlwZSxcbiAgICAgICAgaWZyYW1lU3JjOiAvXmh0dHBzL2kudGVzdCh3aW5kb3cubG9jYXRpb24uaHJlZiB8fCAnJykgPyAnamF2YXNjcmlwdDpmYWxzZScgOiAnYWJvdXQ6YmxhbmsnXG4gICAgfSwgb3B0aW9ucyk7XG5cbiAgICAvLyBob29rIGZvciBtYW5pcHVsYXRpbmcgdGhlIGZvcm0gZGF0YSBiZWZvcmUgaXQgaXMgZXh0cmFjdGVkO1xuICAgIC8vIGNvbnZlbmllbnQgZm9yIHVzZSB3aXRoIHJpY2ggZWRpdG9ycyBsaWtlIHRpbnlNQ0Ugb3IgRkNLRWRpdG9yXG4gICAgdmFyIHZldG8gPSB7fTtcbiAgICB0aGlzLnRyaWdnZXIoJ2Zvcm0tcHJlLXNlcmlhbGl6ZScsIFt0aGlzLCBvcHRpb25zLCB2ZXRvXSk7XG4gICAgaWYgKHZldG8udmV0bykge1xuICAgICAgICBsb2coJ2FqYXhTdWJtaXQ6IHN1Ym1pdCB2ZXRvZWQgdmlhIGZvcm0tcHJlLXNlcmlhbGl6ZSB0cmlnZ2VyJyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8vIHByb3ZpZGUgb3Bwb3J0dW5pdHkgdG8gYWx0ZXIgZm9ybSBkYXRhIGJlZm9yZSBpdCBpcyBzZXJpYWxpemVkXG4gICAgaWYgKG9wdGlvbnMuYmVmb3JlU2VyaWFsaXplICYmIG9wdGlvbnMuYmVmb3JlU2VyaWFsaXplKHRoaXMsIG9wdGlvbnMpID09PSBmYWxzZSkge1xuICAgICAgICBsb2coJ2FqYXhTdWJtaXQ6IHN1Ym1pdCBhYm9ydGVkIHZpYSBiZWZvcmVTZXJpYWxpemUgY2FsbGJhY2snKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdmFyIHRyYWRpdGlvbmFsID0gb3B0aW9ucy50cmFkaXRpb25hbDtcbiAgICBpZiAoIHRyYWRpdGlvbmFsID09PSB1bmRlZmluZWQgKSB7XG4gICAgICAgIHRyYWRpdGlvbmFsID0gJC5hamF4U2V0dGluZ3MudHJhZGl0aW9uYWw7XG4gICAgfVxuXG4gICAgdmFyIGVsZW1lbnRzID0gW107XG4gICAgdmFyIHF4LCBhID0gdGhpcy5mb3JtVG9BcnJheShvcHRpb25zLnNlbWFudGljLCBlbGVtZW50cyk7XG4gICAgaWYgKG9wdGlvbnMuZGF0YSkge1xuICAgICAgICBvcHRpb25zLmV4dHJhRGF0YSA9IG9wdGlvbnMuZGF0YTtcbiAgICAgICAgcXggPSAkLnBhcmFtKG9wdGlvbnMuZGF0YSwgdHJhZGl0aW9uYWwpO1xuICAgIH1cblxuICAgIC8vIGdpdmUgcHJlLXN1Ym1pdCBjYWxsYmFjayBhbiBvcHBvcnR1bml0eSB0byBhYm9ydCB0aGUgc3VibWl0XG4gICAgaWYgKG9wdGlvbnMuYmVmb3JlU3VibWl0ICYmIG9wdGlvbnMuYmVmb3JlU3VibWl0KGEsIHRoaXMsIG9wdGlvbnMpID09PSBmYWxzZSkge1xuICAgICAgICBsb2coJ2FqYXhTdWJtaXQ6IHN1Ym1pdCBhYm9ydGVkIHZpYSBiZWZvcmVTdWJtaXQgY2FsbGJhY2snKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLy8gZmlyZSB2ZXRvYWJsZSAndmFsaWRhdGUnIGV2ZW50XG4gICAgdGhpcy50cmlnZ2VyKCdmb3JtLXN1Ym1pdC12YWxpZGF0ZScsIFthLCB0aGlzLCBvcHRpb25zLCB2ZXRvXSk7XG4gICAgaWYgKHZldG8udmV0bykge1xuICAgICAgICBsb2coJ2FqYXhTdWJtaXQ6IHN1Ym1pdCB2ZXRvZWQgdmlhIGZvcm0tc3VibWl0LXZhbGlkYXRlIHRyaWdnZXInKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdmFyIHEgPSAkLnBhcmFtKGEsIHRyYWRpdGlvbmFsKTtcbiAgICBpZiAocXgpIHtcbiAgICAgICAgcSA9ICggcSA/IChxICsgJyYnICsgcXgpIDogcXggKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMudHlwZS50b1VwcGVyQ2FzZSgpID09ICdHRVQnKSB7XG4gICAgICAgIG9wdGlvbnMudXJsICs9IChvcHRpb25zLnVybC5pbmRleE9mKCc/JykgPj0gMCA/ICcmJyA6ICc/JykgKyBxO1xuICAgICAgICBvcHRpb25zLmRhdGEgPSBudWxsOyAgLy8gZGF0YSBpcyBudWxsIGZvciAnZ2V0J1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgb3B0aW9ucy5kYXRhID0gcTsgLy8gZGF0YSBpcyB0aGUgcXVlcnkgc3RyaW5nIGZvciAncG9zdCdcbiAgICB9XG5cbiAgICB2YXIgY2FsbGJhY2tzID0gW107XG4gICAgaWYgKG9wdGlvbnMucmVzZXRGb3JtKSB7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGZ1bmN0aW9uKCkgeyAkZm9ybS5yZXNldEZvcm0oKTsgfSk7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLmNsZWFyRm9ybSkge1xuICAgICAgICBjYWxsYmFja3MucHVzaChmdW5jdGlvbigpIHsgJGZvcm0uY2xlYXJGb3JtKG9wdGlvbnMuaW5jbHVkZUhpZGRlbik7IH0pO1xuICAgIH1cblxuICAgIC8vIHBlcmZvcm0gYSBsb2FkIG9uIHRoZSB0YXJnZXQgb25seSBpZiBkYXRhVHlwZSBpcyBub3QgcHJvdmlkZWRcbiAgICBpZiAoIW9wdGlvbnMuZGF0YVR5cGUgJiYgb3B0aW9ucy50YXJnZXQpIHtcbiAgICAgICAgdmFyIG9sZFN1Y2Nlc3MgPSBvcHRpb25zLnN1Y2Nlc3MgfHwgZnVuY3Rpb24oKXt9O1xuICAgICAgICBjYWxsYmFja3MucHVzaChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB2YXIgZm4gPSBvcHRpb25zLnJlcGxhY2VUYXJnZXQgPyAncmVwbGFjZVdpdGgnIDogJ2h0bWwnO1xuICAgICAgICAgICAgJChvcHRpb25zLnRhcmdldClbZm5dKGRhdGEpLmVhY2gob2xkU3VjY2VzcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKG9wdGlvbnMuc3VjY2Vzcykge1xuICAgICAgICBjYWxsYmFja3MucHVzaChvcHRpb25zLnN1Y2Nlc3MpO1xuICAgIH1cblxuICAgIG9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uKGRhdGEsIHN0YXR1cywgeGhyKSB7IC8vIGpRdWVyeSAxLjQrIHBhc3NlcyB4aHIgYXMgM3JkIGFyZ1xuICAgICAgICB2YXIgY29udGV4dCA9IG9wdGlvbnMuY29udGV4dCB8fCB0aGlzIDsgICAgLy8galF1ZXJ5IDEuNCsgc3VwcG9ydHMgc2NvcGUgY29udGV4dFxuICAgICAgICBmb3IgKHZhciBpPTAsIG1heD1jYWxsYmFja3MubGVuZ3RoOyBpIDwgbWF4OyBpKyspIHtcbiAgICAgICAgICAgIGNhbGxiYWNrc1tpXS5hcHBseShjb250ZXh0LCBbZGF0YSwgc3RhdHVzLCB4aHIgfHwgJGZvcm0sICRmb3JtXSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKG9wdGlvbnMuZXJyb3IpIHtcbiAgICAgICAgdmFyIG9sZEVycm9yID0gb3B0aW9ucy5lcnJvcjtcbiAgICAgICAgb3B0aW9ucy5lcnJvciA9IGZ1bmN0aW9uKHhociwgc3RhdHVzLCBlcnJvcikge1xuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQgfHwgdGhpcztcbiAgICAgICAgICAgIG9sZEVycm9yLmFwcGx5KGNvbnRleHQsIFt4aHIsIHN0YXR1cywgZXJyb3IsICRmb3JtXSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgIGlmIChvcHRpb25zLmNvbXBsZXRlKSB7XG4gICAgICAgIHZhciBvbGRDb21wbGV0ZSA9IG9wdGlvbnMuY29tcGxldGU7XG4gICAgICAgIG9wdGlvbnMuY29tcGxldGUgPSBmdW5jdGlvbih4aHIsIHN0YXR1cykge1xuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQgfHwgdGhpcztcbiAgICAgICAgICAgIG9sZENvbXBsZXRlLmFwcGx5KGNvbnRleHQsIFt4aHIsIHN0YXR1cywgJGZvcm1dKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBhcmUgdGhlcmUgZmlsZXMgdG8gdXBsb2FkP1xuXG4gICAgLy8gW3ZhbHVlXSAoaXNzdWUgIzExMyksIGFsc28gc2VlIGNvbW1lbnQ6XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21hbHN1cC9mb3JtL2NvbW1pdC81ODgzMDZhZWRiYTFkZTAxMzg4MDMyZDVmNDJhNjAxNTllZWE5MjI4I2NvbW1pdGNvbW1lbnQtMjE4MDIxOVxuICAgIHZhciBmaWxlSW5wdXRzID0gJCgnaW5wdXRbdHlwZT1maWxlXTplbmFibGVkJywgdGhpcykuZmlsdGVyKGZ1bmN0aW9uKCkgeyByZXR1cm4gJCh0aGlzKS52YWwoKSAhPT0gJyc7IH0pO1xuXG4gICAgdmFyIGhhc0ZpbGVJbnB1dHMgPSBmaWxlSW5wdXRzLmxlbmd0aCA+IDA7XG4gICAgdmFyIG1wID0gJ211bHRpcGFydC9mb3JtLWRhdGEnO1xuICAgIHZhciBtdWx0aXBhcnQgPSAoJGZvcm0uYXR0cignZW5jdHlwZScpID09IG1wIHx8ICRmb3JtLmF0dHIoJ2VuY29kaW5nJykgPT0gbXApO1xuXG4gICAgdmFyIGZpbGVBUEkgPSBmZWF0dXJlLmZpbGVhcGkgJiYgZmVhdHVyZS5mb3JtZGF0YTtcbiAgICBsb2coXCJmaWxlQVBJIDpcIiArIGZpbGVBUEkpO1xuICAgIHZhciBzaG91bGRVc2VGcmFtZSA9IChoYXNGaWxlSW5wdXRzIHx8IG11bHRpcGFydCkgJiYgIWZpbGVBUEk7XG5cbiAgICB2YXIganF4aHI7XG5cbiAgICAvLyBvcHRpb25zLmlmcmFtZSBhbGxvd3MgdXNlciB0byBmb3JjZSBpZnJhbWUgbW9kZVxuICAgIC8vIDA2LU5PVi0wOTogbm93IGRlZmF1bHRpbmcgdG8gaWZyYW1lIG1vZGUgaWYgZmlsZSBpbnB1dCBpcyBkZXRlY3RlZFxuICAgIGlmIChvcHRpb25zLmlmcmFtZSAhPT0gZmFsc2UgJiYgKG9wdGlvbnMuaWZyYW1lIHx8IHNob3VsZFVzZUZyYW1lKSkge1xuICAgICAgICAvLyBoYWNrIHRvIGZpeCBTYWZhcmkgaGFuZyAodGhhbmtzIHRvIFRpbSBNb2xlbmRpamsgZm9yIHRoaXMpXG4gICAgICAgIC8vIHNlZTogIGh0dHA6Ly9ncm91cHMuZ29vZ2xlLmNvbS9ncm91cC9qcXVlcnktZGV2L2Jyb3dzZV90aHJlYWQvdGhyZWFkLzM2Mzk1YjdhYjUxMGRkNWRcbiAgICAgICAgaWYgKG9wdGlvbnMuY2xvc2VLZWVwQWxpdmUpIHtcbiAgICAgICAgICAgICQuZ2V0KG9wdGlvbnMuY2xvc2VLZWVwQWxpdmUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGpxeGhyID0gZmlsZVVwbG9hZElmcmFtZShhKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAganF4aHIgPSBmaWxlVXBsb2FkSWZyYW1lKGEpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKChoYXNGaWxlSW5wdXRzIHx8IG11bHRpcGFydCkgJiYgZmlsZUFQSSkge1xuICAgICAgICBqcXhociA9IGZpbGVVcGxvYWRYaHIoYSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBqcXhociA9ICQuYWpheChvcHRpb25zKTtcbiAgICB9XG5cbiAgICAkZm9ybS5yZW1vdmVEYXRhKCdqcXhocicpLmRhdGEoJ2pxeGhyJywganF4aHIpO1xuXG4gICAgLy8gY2xlYXIgZWxlbWVudCBhcnJheVxuICAgIGZvciAodmFyIGs9MDsgayA8IGVsZW1lbnRzLmxlbmd0aDsgaysrKVxuICAgICAgICBlbGVtZW50c1trXSA9IG51bGw7XG5cbiAgICAvLyBmaXJlICdub3RpZnknIGV2ZW50XG4gICAgdGhpcy50cmlnZ2VyKCdmb3JtLXN1Ym1pdC1ub3RpZnknLCBbdGhpcywgb3B0aW9uc10pO1xuICAgIHJldHVybiB0aGlzO1xuXG4gICAgLy8gdXRpbGl0eSBmbiBmb3IgZGVlcCBzZXJpYWxpemF0aW9uXG4gICAgZnVuY3Rpb24gZGVlcFNlcmlhbGl6ZShleHRyYURhdGEpe1xuICAgICAgICB2YXIgc2VyaWFsaXplZCA9ICQucGFyYW0oZXh0cmFEYXRhLCBvcHRpb25zLnRyYWRpdGlvbmFsKS5zcGxpdCgnJicpO1xuICAgICAgICB2YXIgbGVuID0gc2VyaWFsaXplZC5sZW5ndGg7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgdmFyIGksIHBhcnQ7XG4gICAgICAgIGZvciAoaT0wOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIC8vICMyNTI7IHVuZG8gcGFyYW0gc3BhY2UgcmVwbGFjZW1lbnRcbiAgICAgICAgICAgIHNlcmlhbGl6ZWRbaV0gPSBzZXJpYWxpemVkW2ldLnJlcGxhY2UoL1xcKy9nLCcgJyk7XG4gICAgICAgICAgICBwYXJ0ID0gc2VyaWFsaXplZFtpXS5zcGxpdCgnPScpO1xuICAgICAgICAgICAgLy8gIzI3ODsgdXNlIGFycmF5IGluc3RlYWQgb2Ygb2JqZWN0IHN0b3JhZ2UsIGZhdm9yaW5nIGFycmF5IHNlcmlhbGl6YXRpb25zXG4gICAgICAgICAgICByZXN1bHQucHVzaChbZGVjb2RlVVJJQ29tcG9uZW50KHBhcnRbMF0pLCBkZWNvZGVVUklDb21wb25lbnQocGFydFsxXSldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgICAvLyBYTUxIdHRwUmVxdWVzdCBMZXZlbCAyIGZpbGUgdXBsb2FkcyAoYmlnIGhhdCB0aXAgdG8gZnJhbmNvaXMybWV0eilcbiAgICBmdW5jdGlvbiBmaWxlVXBsb2FkWGhyKGEpIHtcbiAgICAgICAgdmFyIGZvcm1kYXRhID0gbmV3IEZvcm1EYXRhKCk7XG5cbiAgICAgICAgZm9yICh2YXIgaT0wOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZm9ybWRhdGEuYXBwZW5kKGFbaV0ubmFtZSwgYVtpXS52YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5leHRyYURhdGEpIHtcbiAgICAgICAgICAgIHZhciBzZXJpYWxpemVkRGF0YSA9IGRlZXBTZXJpYWxpemUob3B0aW9ucy5leHRyYURhdGEpO1xuICAgICAgICAgICAgZm9yIChpPTA7IGkgPCBzZXJpYWxpemVkRGF0YS5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgICAgICBpZiAoc2VyaWFsaXplZERhdGFbaV0pXG4gICAgICAgICAgICAgICAgICAgIGZvcm1kYXRhLmFwcGVuZChzZXJpYWxpemVkRGF0YVtpXVswXSwgc2VyaWFsaXplZERhdGFbaV1bMV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgb3B0aW9ucy5kYXRhID0gbnVsbDtcblxuICAgICAgICB2YXIgcyA9ICQuZXh0ZW5kKHRydWUsIHt9LCAkLmFqYXhTZXR0aW5ncywgb3B0aW9ucywge1xuICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogbWV0aG9kIHx8ICdQT1NUJ1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAob3B0aW9ucy51cGxvYWRQcm9ncmVzcykge1xuICAgICAgICAgICAgLy8gd29ya2Fyb3VuZCBiZWNhdXNlIGpxWEhSIGRvZXMgbm90IGV4cG9zZSB1cGxvYWQgcHJvcGVydHlcbiAgICAgICAgICAgIHMueGhyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHhociA9ICQuYWpheFNldHRpbmdzLnhocigpO1xuICAgICAgICAgICAgICAgIGlmICh4aHIudXBsb2FkKSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci51cGxvYWQuYWRkRXZlbnRMaXN0ZW5lcigncHJvZ3Jlc3MnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBlcmNlbnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBvc2l0aW9uID0gZXZlbnQubG9hZGVkIHx8IGV2ZW50LnBvc2l0aW9uOyAvKmV2ZW50LnBvc2l0aW9uIGlzIGRlcHJlY2F0ZWQqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRvdGFsID0gZXZlbnQudG90YWw7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcmNlbnQgPSBNYXRoLmNlaWwocG9zaXRpb24gLyB0b3RhbCAqIDEwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnVwbG9hZFByb2dyZXNzKGV2ZW50LCBwb3NpdGlvbiwgdG90YWwsIHBlcmNlbnQpO1xuICAgICAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB4aHI7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcy5kYXRhID0gbnVsbDtcbiAgICAgICAgdmFyIGJlZm9yZVNlbmQgPSBzLmJlZm9yZVNlbmQ7XG4gICAgICAgIHMuYmVmb3JlU2VuZCA9IGZ1bmN0aW9uKHhociwgbykge1xuICAgICAgICAgICAgLy9TZW5kIEZvcm1EYXRhKCkgcHJvdmlkZWQgYnkgdXNlclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZm9ybURhdGEpXG4gICAgICAgICAgICAgICAgby5kYXRhID0gb3B0aW9ucy5mb3JtRGF0YTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBvLmRhdGEgPSBmb3JtZGF0YTtcbiAgICAgICAgICAgIGlmKGJlZm9yZVNlbmQpXG4gICAgICAgICAgICAgICAgYmVmb3JlU2VuZC5jYWxsKHRoaXMsIHhociwgbyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAkLmFqYXgocyk7XG4gICAgfVxuXG4gICAgLy8gcHJpdmF0ZSBmdW5jdGlvbiBmb3IgaGFuZGxpbmcgZmlsZSB1cGxvYWRzIChoYXQgdGlwIHRvIFlBSE9PISlcbiAgICBmdW5jdGlvbiBmaWxlVXBsb2FkSWZyYW1lKGEpIHtcbiAgICAgICAgdmFyIGZvcm0gPSAkZm9ybVswXSwgZWwsIGksIHMsIGcsIGlkLCAkaW8sIGlvLCB4aHIsIHN1YiwgbiwgdGltZWRPdXQsIHRpbWVvdXRIYW5kbGU7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKTtcblxuICAgICAgICAvLyAjMzQxXG4gICAgICAgIGRlZmVycmVkLmFib3J0ID0gZnVuY3Rpb24oc3RhdHVzKSB7XG4gICAgICAgICAgICB4aHIuYWJvcnQoc3RhdHVzKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoYSkge1xuICAgICAgICAgICAgLy8gZW5zdXJlIHRoYXQgZXZlcnkgc2VyaWFsaXplZCBpbnB1dCBpcyBzdGlsbCBlbmFibGVkXG4gICAgICAgICAgICBmb3IgKGk9MDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZWwgPSAkKGVsZW1lbnRzW2ldKTtcbiAgICAgICAgICAgICAgICBpZiAoIGhhc1Byb3AgKVxuICAgICAgICAgICAgICAgICAgICBlbC5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGVsLnJlbW92ZUF0dHIoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzID0gJC5leHRlbmQodHJ1ZSwge30sICQuYWpheFNldHRpbmdzLCBvcHRpb25zKTtcbiAgICAgICAgcy5jb250ZXh0ID0gcy5jb250ZXh0IHx8IHM7XG4gICAgICAgIGlkID0gJ2pxRm9ybUlPJyArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XG4gICAgICAgIGlmIChzLmlmcmFtZVRhcmdldCkge1xuICAgICAgICAgICAgJGlvID0gJChzLmlmcmFtZVRhcmdldCk7XG4gICAgICAgICAgICBuID0gJGlvLmF0dHIyKCduYW1lJyk7XG4gICAgICAgICAgICBpZiAoIW4pXG4gICAgICAgICAgICAgICAgICRpby5hdHRyMignbmFtZScsIGlkKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZCA9IG47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAkaW8gPSAkKCc8aWZyYW1lIG5hbWU9XCInICsgaWQgKyAnXCIgc3JjPVwiJysgcy5pZnJhbWVTcmMgKydcIiAvPicpO1xuICAgICAgICAgICAgJGlvLmNzcyh7IHBvc2l0aW9uOiAnYWJzb2x1dGUnLCB0b3A6ICctMTAwMHB4JywgbGVmdDogJy0xMDAwcHgnIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlvID0gJGlvWzBdO1xuXG5cbiAgICAgICAgeGhyID0geyAvLyBtb2NrIG9iamVjdFxuICAgICAgICAgICAgYWJvcnRlZDogMCxcbiAgICAgICAgICAgIHJlc3BvbnNlVGV4dDogbnVsbCxcbiAgICAgICAgICAgIHJlc3BvbnNlWE1MOiBudWxsLFxuICAgICAgICAgICAgc3RhdHVzOiAwLFxuICAgICAgICAgICAgc3RhdHVzVGV4dDogJ24vYScsXG4gICAgICAgICAgICBnZXRBbGxSZXNwb25zZUhlYWRlcnM6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgICAgICBnZXRSZXNwb25zZUhlYWRlcjogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgICAgIHNldFJlcXVlc3RIZWFkZXI6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgICAgICBhYm9ydDogZnVuY3Rpb24oc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGUgPSAoc3RhdHVzID09PSAndGltZW91dCcgPyAndGltZW91dCcgOiAnYWJvcnRlZCcpO1xuICAgICAgICAgICAgICAgIGxvZygnYWJvcnRpbmcgdXBsb2FkLi4uICcgKyBlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFib3J0ZWQgPSAxO1xuXG4gICAgICAgICAgICAgICAgdHJ5IHsgLy8gIzIxNCwgIzI1N1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW8uY29udGVudFdpbmRvdy5kb2N1bWVudC5leGVjQ29tbWFuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW8uY29udGVudFdpbmRvdy5kb2N1bWVudC5leGVjQ29tbWFuZCgnU3RvcCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoKGlnbm9yZSkge31cblxuICAgICAgICAgICAgICAgICRpby5hdHRyKCdzcmMnLCBzLmlmcmFtZVNyYyk7IC8vIGFib3J0IG9wIGluIHByb2dyZXNzXG4gICAgICAgICAgICAgICAgeGhyLmVycm9yID0gZTtcbiAgICAgICAgICAgICAgICBpZiAocy5lcnJvcilcbiAgICAgICAgICAgICAgICAgICAgcy5lcnJvci5jYWxsKHMuY29udGV4dCwgeGhyLCBlLCBzdGF0dXMpO1xuICAgICAgICAgICAgICAgIGlmIChnKVxuICAgICAgICAgICAgICAgICAgICAkLmV2ZW50LnRyaWdnZXIoXCJhamF4RXJyb3JcIiwgW3hociwgcywgZV0pO1xuICAgICAgICAgICAgICAgIGlmIChzLmNvbXBsZXRlKVxuICAgICAgICAgICAgICAgICAgICBzLmNvbXBsZXRlLmNhbGwocy5jb250ZXh0LCB4aHIsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGcgPSBzLmdsb2JhbDtcbiAgICAgICAgLy8gdHJpZ2dlciBhamF4IGdsb2JhbCBldmVudHMgc28gdGhhdCBhY3Rpdml0eS9ibG9jayBpbmRpY2F0b3JzIHdvcmsgbGlrZSBub3JtYWxcbiAgICAgICAgaWYgKGcgJiYgMCA9PT0gJC5hY3RpdmUrKykge1xuICAgICAgICAgICAgJC5ldmVudC50cmlnZ2VyKFwiYWpheFN0YXJ0XCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChnKSB7XG4gICAgICAgICAgICAkLmV2ZW50LnRyaWdnZXIoXCJhamF4U2VuZFwiLCBbeGhyLCBzXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocy5iZWZvcmVTZW5kICYmIHMuYmVmb3JlU2VuZC5jYWxsKHMuY29udGV4dCwgeGhyLCBzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGlmIChzLmdsb2JhbCkge1xuICAgICAgICAgICAgICAgICQuYWN0aXZlLS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoKTtcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeGhyLmFib3J0ZWQpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYWRkIHN1Ym1pdHRpbmcgZWxlbWVudCB0byBkYXRhIGlmIHdlIGtub3cgaXRcbiAgICAgICAgc3ViID0gZm9ybS5jbGs7XG4gICAgICAgIGlmIChzdWIpIHtcbiAgICAgICAgICAgIG4gPSBzdWIubmFtZTtcbiAgICAgICAgICAgIGlmIChuICYmICFzdWIuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgICAgICBzLmV4dHJhRGF0YSA9IHMuZXh0cmFEYXRhIHx8IHt9O1xuICAgICAgICAgICAgICAgIHMuZXh0cmFEYXRhW25dID0gc3ViLnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmIChzdWIudHlwZSA9PSBcImltYWdlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcy5leHRyYURhdGFbbisnLngnXSA9IGZvcm0uY2xrX3g7XG4gICAgICAgICAgICAgICAgICAgIHMuZXh0cmFEYXRhW24rJy55J10gPSBmb3JtLmNsa195O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBDTElFTlRfVElNRU9VVF9BQk9SVCA9IDE7XG4gICAgICAgIHZhciBTRVJWRVJfQUJPUlQgPSAyO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBmdW5jdGlvbiBnZXREb2MoZnJhbWUpIHtcbiAgICAgICAgICAgIC8qIGl0IGxvb2tzIGxpa2UgY29udGVudFdpbmRvdyBvciBjb250ZW50RG9jdW1lbnQgZG8gbm90XG4gICAgICAgICAgICAgKiBjYXJyeSB0aGUgcHJvdG9jb2wgcHJvcGVydHkgaW4gaWU4LCB3aGVuIHJ1bm5pbmcgdW5kZXIgc3NsXG4gICAgICAgICAgICAgKiBmcmFtZS5kb2N1bWVudCBpcyB0aGUgb25seSB2YWxpZCByZXNwb25zZSBkb2N1bWVudCwgc2luY2VcbiAgICAgICAgICAgICAqIHRoZSBwcm90b2NvbCBpcyBrbm93IGJ1dCBub3Qgb24gdGhlIG90aGVyIHR3byBvYmplY3RzLiBzdHJhbmdlP1xuICAgICAgICAgICAgICogXCJTYW1lIG9yaWdpbiBwb2xpY3lcIiBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1NhbWVfb3JpZ2luX3BvbGljeVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBkb2MgPSBudWxsO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBJRTggY2FzY2FkaW5nIGFjY2VzcyBjaGVja1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoZnJhbWUuY29udGVudFdpbmRvdykge1xuICAgICAgICAgICAgICAgICAgICBkb2MgPSBmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICAgICAgLy8gSUU4IGFjY2VzcyBkZW5pZWQgdW5kZXIgc3NsICYgbWlzc2luZyBwcm90b2NvbFxuICAgICAgICAgICAgICAgIGxvZygnY2Fubm90IGdldCBpZnJhbWUuY29udGVudFdpbmRvdyBkb2N1bWVudDogJyArIGVycik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkb2MpIHsgLy8gc3VjY2Vzc2Z1bCBnZXR0aW5nIGNvbnRlbnRcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkgeyAvLyBzaW1wbHkgY2hlY2tpbmcgbWF5IHRocm93IGluIGllOCB1bmRlciBzc2wgb3IgbWlzbWF0Y2hlZCBwcm90b2NvbFxuICAgICAgICAgICAgICAgIGRvYyA9IGZyYW1lLmNvbnRlbnREb2N1bWVudCA/IGZyYW1lLmNvbnRlbnREb2N1bWVudCA6IGZyYW1lLmRvY3VtZW50O1xuICAgICAgICAgICAgfSBjYXRjaChlcnIpIHtcbiAgICAgICAgICAgICAgICAvLyBsYXN0IGF0dGVtcHRcbiAgICAgICAgICAgICAgICBsb2coJ2Nhbm5vdCBnZXQgaWZyYW1lLmNvbnRlbnREb2N1bWVudDogJyArIGVycik7XG4gICAgICAgICAgICAgICAgZG9jID0gZnJhbWUuZG9jdW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZG9jO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmFpbHMgQ1NSRiBoYWNrICh0aGFua3MgdG8gWXZhbiBCYXJ0aGVsZW15KVxuICAgICAgICB2YXIgY3NyZl90b2tlbiA9ICQoJ21ldGFbbmFtZT1jc3JmLXRva2VuXScpLmF0dHIoJ2NvbnRlbnQnKTtcbiAgICAgICAgdmFyIGNzcmZfcGFyYW0gPSAkKCdtZXRhW25hbWU9Y3NyZi1wYXJhbV0nKS5hdHRyKCdjb250ZW50Jyk7XG4gICAgICAgIGlmIChjc3JmX3BhcmFtICYmIGNzcmZfdG9rZW4pIHtcbiAgICAgICAgICAgIHMuZXh0cmFEYXRhID0gcy5leHRyYURhdGEgfHwge307XG4gICAgICAgICAgICBzLmV4dHJhRGF0YVtjc3JmX3BhcmFtXSA9IGNzcmZfdG9rZW47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0YWtlIGEgYnJlYXRoIHNvIHRoYXQgcGVuZGluZyByZXBhaW50cyBnZXQgc29tZSBjcHUgdGltZSBiZWZvcmUgdGhlIHVwbG9hZCBzdGFydHNcbiAgICAgICAgZnVuY3Rpb24gZG9TdWJtaXQoKSB7XG4gICAgICAgICAgICAvLyBtYWtlIHN1cmUgZm9ybSBhdHRycyBhcmUgc2V0XG4gICAgICAgICAgICB2YXIgdCA9ICRmb3JtLmF0dHIyKCd0YXJnZXQnKSwgYSA9ICRmb3JtLmF0dHIyKCdhY3Rpb24nKTtcblxuICAgICAgICAgICAgLy8gdXBkYXRlIGZvcm0gYXR0cnMgaW4gSUUgZnJpZW5kbHkgd2F5XG4gICAgICAgICAgICBmb3JtLnNldEF0dHJpYnV0ZSgndGFyZ2V0JyxpZCk7XG4gICAgICAgICAgICBpZiAoIW1ldGhvZCB8fCAvcG9zdC9pLnRlc3QobWV0aG9kKSApIHtcbiAgICAgICAgICAgICAgICBmb3JtLnNldEF0dHJpYnV0ZSgnbWV0aG9kJywgJ1BPU1QnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhICE9IHMudXJsKSB7XG4gICAgICAgICAgICAgICAgZm9ybS5zZXRBdHRyaWJ1dGUoJ2FjdGlvbicsIHMudXJsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWUgYm9ya3MgaW4gc29tZSBjYXNlcyB3aGVuIHNldHRpbmcgZW5jb2RpbmdcbiAgICAgICAgICAgIGlmICghIHMuc2tpcEVuY29kaW5nT3ZlcnJpZGUgJiYgKCFtZXRob2QgfHwgL3Bvc3QvaS50ZXN0KG1ldGhvZCkpKSB7XG4gICAgICAgICAgICAgICAgJGZvcm0uYXR0cih7XG4gICAgICAgICAgICAgICAgICAgIGVuY29kaW5nOiAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScsXG4gICAgICAgICAgICAgICAgICAgIGVuY3R5cGU6ICAnbXVsdGlwYXJ0L2Zvcm0tZGF0YSdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc3VwcG9ydCB0aW1vdXRcbiAgICAgICAgICAgIGlmIChzLnRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICB0aW1lb3V0SGFuZGxlID0gc2V0VGltZW91dChmdW5jdGlvbigpIHsgdGltZWRPdXQgPSB0cnVlOyBjYihDTElFTlRfVElNRU9VVF9BQk9SVCk7IH0sIHMudGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGxvb2sgZm9yIHNlcnZlciBhYm9ydHNcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNoZWNrU3RhdGUoKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXRlID0gZ2V0RG9jKGlvKS5yZWFkeVN0YXRlO1xuICAgICAgICAgICAgICAgICAgICBsb2coJ3N0YXRlID0gJyArIHN0YXRlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlICYmIHN0YXRlLnRvTG93ZXJDYXNlKCkgPT0gJ3VuaW5pdGlhbGl6ZWQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChjaGVja1N0YXRlLDUwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgICAgICBsb2coJ1NlcnZlciBhYm9ydDogJyAsIGUsICcgKCcsIGUubmFtZSwgJyknKTtcbiAgICAgICAgICAgICAgICAgICAgY2IoU0VSVkVSX0FCT1JUKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRpbWVvdXRIYW5kbGUpXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXRIYW5kbGUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBhZGQgXCJleHRyYVwiIGRhdGEgdG8gZm9ybSBpZiBwcm92aWRlZCBpbiBvcHRpb25zXG4gICAgICAgICAgICB2YXIgZXh0cmFJbnB1dHMgPSBbXTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHMuZXh0cmFEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gaW4gcy5leHRyYURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzLmV4dHJhRGF0YS5oYXNPd25Qcm9wZXJ0eShuKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgdXNpbmcgdGhlICQucGFyYW0gZm9ybWF0IHRoYXQgYWxsb3dzIGZvciBtdWx0aXBsZSB2YWx1ZXMgd2l0aCB0aGUgc2FtZSBuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBpZigkLmlzUGxhaW5PYmplY3Qocy5leHRyYURhdGFbbl0pICYmIHMuZXh0cmFEYXRhW25dLmhhc093blByb3BlcnR5KCduYW1lJykgJiYgcy5leHRyYURhdGFbbl0uaGFzT3duUHJvcGVydHkoJ3ZhbHVlJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYUlucHV0cy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIicrcy5leHRyYURhdGFbbl0ubmFtZSsnXCI+JykudmFsKHMuZXh0cmFEYXRhW25dLnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kVG8oZm9ybSlbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYUlucHV0cy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIicrbisnXCI+JykudmFsKHMuZXh0cmFEYXRhW25dKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kVG8oZm9ybSlbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFzLmlmcmFtZVRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBhZGQgaWZyYW1lIHRvIGRvYyBhbmQgc3VibWl0IHRoZSBmb3JtXG4gICAgICAgICAgICAgICAgICAgICRpby5hcHBlbmRUbygnYm9keScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaW8uYXR0YWNoRXZlbnQpXG4gICAgICAgICAgICAgICAgICAgIGlvLmF0dGFjaEV2ZW50KCdvbmxvYWQnLCBjYik7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpby5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgY2IsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrU3RhdGUsMTUpO1xuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybS5zdWJtaXQoKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgICAgICAgICAvLyBqdXN0IGluIGNhc2UgZm9ybSBoYXMgZWxlbWVudCB3aXRoIG5hbWUvaWQgb2YgJ3N1Ym1pdCdcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1Ym1pdEZuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZm9ybScpLnN1Ym1pdDtcbiAgICAgICAgICAgICAgICAgICAgc3VibWl0Rm4uYXBwbHkoZm9ybSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICAgICAgLy8gcmVzZXQgYXR0cnMgYW5kIHJlbW92ZSBcImV4dHJhXCIgaW5wdXQgZWxlbWVudHNcbiAgICAgICAgICAgICAgICBmb3JtLnNldEF0dHJpYnV0ZSgnYWN0aW9uJyxhKTtcbiAgICAgICAgICAgICAgICBpZih0KSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm0uc2V0QXR0cmlidXRlKCd0YXJnZXQnLCB0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkZm9ybS5yZW1vdmVBdHRyKCd0YXJnZXQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJChleHRyYUlucHV0cykucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocy5mb3JjZVN5bmMpIHtcbiAgICAgICAgICAgIGRvU3VibWl0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGRvU3VibWl0LCAxMCk7IC8vIHRoaXMgbGV0cyBkb20gdXBkYXRlcyByZW5kZXJcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkYXRhLCBkb2MsIGRvbUNoZWNrQ291bnQgPSA1MCwgY2FsbGJhY2tQcm9jZXNzZWQ7XG5cbiAgICAgICAgZnVuY3Rpb24gY2IoZSkge1xuICAgICAgICAgICAgaWYgKHhoci5hYm9ydGVkIHx8IGNhbGxiYWNrUHJvY2Vzc2VkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBkb2MgPSBnZXREb2MoaW8pO1xuICAgICAgICAgICAgaWYoIWRvYykge1xuICAgICAgICAgICAgICAgIGxvZygnY2Fubm90IGFjY2VzcyByZXNwb25zZSBkb2N1bWVudCcpO1xuICAgICAgICAgICAgICAgIGUgPSBTRVJWRVJfQUJPUlQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZSA9PT0gQ0xJRU5UX1RJTUVPVVRfQUJPUlQgJiYgeGhyKSB7XG4gICAgICAgICAgICAgICAgeGhyLmFib3J0KCd0aW1lb3V0Jyk7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KHhociwgJ3RpbWVvdXQnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChlID09IFNFUlZFUl9BQk9SVCAmJiB4aHIpIHtcbiAgICAgICAgICAgICAgICB4aHIuYWJvcnQoJ3NlcnZlciBhYm9ydCcpO1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCh4aHIsICdlcnJvcicsICdzZXJ2ZXIgYWJvcnQnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghZG9jIHx8IGRvYy5sb2NhdGlvbi5ocmVmID09IHMuaWZyYW1lU3JjKSB7XG4gICAgICAgICAgICAgICAgLy8gcmVzcG9uc2Ugbm90IHJlY2VpdmVkIHlldFxuICAgICAgICAgICAgICAgIGlmICghdGltZWRPdXQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpby5kZXRhY2hFdmVudClcbiAgICAgICAgICAgICAgICBpby5kZXRhY2hFdmVudCgnb25sb2FkJywgY2IpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlvLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBjYiwgZmFsc2UpO1xuXG4gICAgICAgICAgICB2YXIgc3RhdHVzID0gJ3N1Y2Nlc3MnLCBlcnJNc2c7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICh0aW1lZE91dCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyAndGltZW91dCc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGlzWG1sID0gcy5kYXRhVHlwZSA9PSAneG1sJyB8fCBkb2MuWE1MRG9jdW1lbnQgfHwgJC5pc1hNTERvYyhkb2MpO1xuICAgICAgICAgICAgICAgIGxvZygnaXNYbWw9Jytpc1htbCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1htbCAmJiB3aW5kb3cub3BlcmEgJiYgKGRvYy5ib2R5ID09PSBudWxsIHx8ICFkb2MuYm9keS5pbm5lckhUTUwpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgtLWRvbUNoZWNrQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluIHNvbWUgYnJvd3NlcnMgKE9wZXJhKSB0aGUgaWZyYW1lIERPTSBpcyBub3QgYWx3YXlzIHRyYXZlcnNhYmxlIHdoZW5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZSBvbmxvYWQgY2FsbGJhY2sgZmlyZXMsIHNvIHdlIGxvb3AgYSBiaXQgdG8gYWNjb21tb2RhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZygncmVxdWVpbmcgb25Mb2FkIGNhbGxiYWNrLCBET00gbm90IGF2YWlsYWJsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChjYiwgMjUwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBsZXQgdGhpcyBmYWxsIHRocm91Z2ggYmVjYXVzZSBzZXJ2ZXIgcmVzcG9uc2UgY291bGQgYmUgYW4gZW1wdHkgZG9jdW1lbnRcbiAgICAgICAgICAgICAgICAgICAgLy9sb2coJ0NvdWxkIG5vdCBhY2Nlc3MgaWZyYW1lIERPTSBhZnRlciBtdXRpcGxlIHRyaWVzLicpO1xuICAgICAgICAgICAgICAgICAgICAvL3Rocm93ICdET01FeGNlcHRpb246IG5vdCBhdmFpbGFibGUnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vbG9nKCdyZXNwb25zZSBkZXRlY3RlZCcpO1xuICAgICAgICAgICAgICAgIHZhciBkb2NSb290ID0gZG9jLmJvZHkgPyBkb2MuYm9keSA6IGRvYy5kb2N1bWVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgeGhyLnJlc3BvbnNlVGV4dCA9IGRvY1Jvb3QgPyBkb2NSb290LmlubmVySFRNTCA6IG51bGw7XG4gICAgICAgICAgICAgICAgeGhyLnJlc3BvbnNlWE1MID0gZG9jLlhNTERvY3VtZW50ID8gZG9jLlhNTERvY3VtZW50IDogZG9jO1xuICAgICAgICAgICAgICAgIGlmIChpc1htbClcbiAgICAgICAgICAgICAgICAgICAgcy5kYXRhVHlwZSA9ICd4bWwnO1xuICAgICAgICAgICAgICAgIHhoci5nZXRSZXNwb25zZUhlYWRlciA9IGZ1bmN0aW9uKGhlYWRlcil7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoZWFkZXJzID0geydjb250ZW50LXR5cGUnOiBzLmRhdGFUeXBlfTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGhlYWRlcnNbaGVhZGVyLnRvTG93ZXJDYXNlKCldO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLy8gc3VwcG9ydCBmb3IgWEhSICdzdGF0dXMnICYgJ3N0YXR1c1RleHQnIGVtdWxhdGlvbiA6XG4gICAgICAgICAgICAgICAgaWYgKGRvY1Jvb3QpIHtcbiAgICAgICAgICAgICAgICAgICAgeGhyLnN0YXR1cyA9IE51bWJlciggZG9jUm9vdC5nZXRBdHRyaWJ1dGUoJ3N0YXR1cycpICkgfHwgeGhyLnN0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgeGhyLnN0YXR1c1RleHQgPSBkb2NSb290LmdldEF0dHJpYnV0ZSgnc3RhdHVzVGV4dCcpIHx8IHhoci5zdGF0dXNUZXh0O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBkdCA9IChzLmRhdGFUeXBlIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHZhciBzY3IgPSAvKGpzb258c2NyaXB0fHRleHQpLy50ZXN0KGR0KTtcbiAgICAgICAgICAgICAgICBpZiAoc2NyIHx8IHMudGV4dGFyZWEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2VlIGlmIHVzZXIgZW1iZWRkZWQgcmVzcG9uc2UgaW4gdGV4dGFyZWFcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCd0ZXh0YXJlYScpWzBdO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHhoci5yZXNwb25zZVRleHQgPSB0YS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN1cHBvcnQgZm9yIFhIUiAnc3RhdHVzJyAmICdzdGF0dXNUZXh0JyBlbXVsYXRpb24gOlxuICAgICAgICAgICAgICAgICAgICAgICAgeGhyLnN0YXR1cyA9IE51bWJlciggdGEuZ2V0QXR0cmlidXRlKCdzdGF0dXMnKSApIHx8IHhoci5zdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgICAgICB4aHIuc3RhdHVzVGV4dCA9IHRhLmdldEF0dHJpYnV0ZSgnc3RhdHVzVGV4dCcpIHx8IHhoci5zdGF0dXNUZXh0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNjcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWNjb3VudCBmb3IgYnJvd3NlcnMgaW5qZWN0aW5nIHByZSBhcm91bmQganNvbiByZXNwb25zZVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZSA9IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgncHJlJylbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYiA9IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhoci5yZXNwb25zZVRleHQgPSBwcmUudGV4dENvbnRlbnQgPyBwcmUudGV4dENvbnRlbnQgOiBwcmUuaW5uZXJUZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhoci5yZXNwb25zZVRleHQgPSBiLnRleHRDb250ZW50ID8gYi50ZXh0Q29udGVudCA6IGIuaW5uZXJUZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGR0ID09ICd4bWwnICYmICF4aHIucmVzcG9uc2VYTUwgJiYgeGhyLnJlc3BvbnNlVGV4dCkge1xuICAgICAgICAgICAgICAgICAgICB4aHIucmVzcG9uc2VYTUwgPSB0b1htbCh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhID0gaHR0cERhdGEoeGhyLCBkdCwgcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzID0gJ3BhcnNlcmVycm9yJztcbiAgICAgICAgICAgICAgICAgICAgeGhyLmVycm9yID0gZXJyTXNnID0gKGVyciB8fCBzdGF0dXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBsb2coJ2Vycm9yIGNhdWdodDogJyxlcnIpO1xuICAgICAgICAgICAgICAgIHN0YXR1cyA9ICdlcnJvcic7XG4gICAgICAgICAgICAgICAgeGhyLmVycm9yID0gZXJyTXNnID0gKGVyciB8fCBzdGF0dXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoeGhyLmFib3J0ZWQpIHtcbiAgICAgICAgICAgICAgICBsb2coJ3VwbG9hZCBhYm9ydGVkJyk7XG4gICAgICAgICAgICAgICAgc3RhdHVzID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMpIHsgLy8gd2UndmUgc2V0IHhoci5zdGF0dXNcbiAgICAgICAgICAgICAgICBzdGF0dXMgPSAoeGhyLnN0YXR1cyA+PSAyMDAgJiYgeGhyLnN0YXR1cyA8IDMwMCB8fCB4aHIuc3RhdHVzID09PSAzMDQpID8gJ3N1Y2Nlc3MnIDogJ2Vycm9yJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gb3JkZXJpbmcgb2YgdGhlc2UgY2FsbGJhY2tzL3RyaWdnZXJzIGlzIG9kZCwgYnV0IHRoYXQncyBob3cgJC5hamF4IGRvZXMgaXRcbiAgICAgICAgICAgIGlmIChzdGF0dXMgPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgIGlmIChzLnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgICAgIHMuc3VjY2Vzcy5jYWxsKHMuY29udGV4dCwgZGF0YSwgJ3N1Y2Nlc3MnLCB4aHIpO1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoeGhyLnJlc3BvbnNlVGV4dCwgJ3N1Y2Nlc3MnLCB4aHIpO1xuICAgICAgICAgICAgICAgIGlmIChnKVxuICAgICAgICAgICAgICAgICAgICAkLmV2ZW50LnRyaWdnZXIoXCJhamF4U3VjY2Vzc1wiLCBbeGhyLCBzXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyTXNnID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgICAgIGVyck1zZyA9IHhoci5zdGF0dXNUZXh0O1xuICAgICAgICAgICAgICAgIGlmIChzLmVycm9yKVxuICAgICAgICAgICAgICAgICAgICBzLmVycm9yLmNhbGwocy5jb250ZXh0LCB4aHIsIHN0YXR1cywgZXJyTXNnKTtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoeGhyLCAnZXJyb3InLCBlcnJNc2cpO1xuICAgICAgICAgICAgICAgIGlmIChnKVxuICAgICAgICAgICAgICAgICAgICAkLmV2ZW50LnRyaWdnZXIoXCJhamF4RXJyb3JcIiwgW3hociwgcywgZXJyTXNnXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChnKVxuICAgICAgICAgICAgICAgICQuZXZlbnQudHJpZ2dlcihcImFqYXhDb21wbGV0ZVwiLCBbeGhyLCBzXSk7XG5cbiAgICAgICAgICAgIGlmIChnICYmICEgLS0kLmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICQuZXZlbnQudHJpZ2dlcihcImFqYXhTdG9wXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocy5jb21wbGV0ZSlcbiAgICAgICAgICAgICAgICBzLmNvbXBsZXRlLmNhbGwocy5jb250ZXh0LCB4aHIsIHN0YXR1cyk7XG5cbiAgICAgICAgICAgIGNhbGxiYWNrUHJvY2Vzc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChzLnRpbWVvdXQpXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRIYW5kbGUpO1xuXG4gICAgICAgICAgICAvLyBjbGVhbiB1cFxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXMuaWZyYW1lVGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICAkaW8ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgZWxzZSAgLy9hZGRpbmcgZWxzZSB0byBjbGVhbiB1cCBleGlzdGluZyBpZnJhbWUgcmVzcG9uc2UuXG4gICAgICAgICAgICAgICAgICAgICRpby5hdHRyKCdzcmMnLCBzLmlmcmFtZVNyYyk7XG4gICAgICAgICAgICAgICAgeGhyLnJlc3BvbnNlWE1MID0gbnVsbDtcbiAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdG9YbWwgPSAkLnBhcnNlWE1MIHx8IGZ1bmN0aW9uKHMsIGRvYykgeyAvLyB1c2UgcGFyc2VYTUwgaWYgYXZhaWxhYmxlIChqUXVlcnkgMS41KylcbiAgICAgICAgICAgIGlmICh3aW5kb3cuQWN0aXZlWE9iamVjdCkge1xuICAgICAgICAgICAgICAgIGRvYyA9IG5ldyBBY3RpdmVYT2JqZWN0KCdNaWNyb3NvZnQuWE1MRE9NJyk7XG4gICAgICAgICAgICAgICAgZG9jLmFzeW5jID0gJ2ZhbHNlJztcbiAgICAgICAgICAgICAgICBkb2MubG9hZFhNTChzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhzLCAndGV4dC94bWwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAoZG9jICYmIGRvYy5kb2N1bWVudEVsZW1lbnQgJiYgZG9jLmRvY3VtZW50RWxlbWVudC5ub2RlTmFtZSAhPSAncGFyc2VyZXJyb3InKSA/IGRvYyA6IG51bGw7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYXJzZUpTT04gPSAkLnBhcnNlSlNPTiB8fCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICAvKmpzbGludCBldmlsOnRydWUgKi9cbiAgICAgICAgICAgIHJldHVybiB3aW5kb3dbJ2V2YWwnXSgnKCcgKyBzICsgJyknKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaHR0cERhdGEgPSBmdW5jdGlvbiggeGhyLCB0eXBlLCBzICkgeyAvLyBtb3N0bHkgbGlmdGVkIGZyb20ganExLjQuNFxuXG4gICAgICAgICAgICB2YXIgY3QgPSB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ2NvbnRlbnQtdHlwZScpIHx8ICcnLFxuICAgICAgICAgICAgICAgIHhtbCA9IHR5cGUgPT09ICd4bWwnIHx8ICF0eXBlICYmIGN0LmluZGV4T2YoJ3htbCcpID49IDAsXG4gICAgICAgICAgICAgICAgZGF0YSA9IHhtbCA/IHhoci5yZXNwb25zZVhNTCA6IHhoci5yZXNwb25zZVRleHQ7XG5cbiAgICAgICAgICAgIGlmICh4bWwgJiYgZGF0YS5kb2N1bWVudEVsZW1lbnQubm9kZU5hbWUgPT09ICdwYXJzZXJlcnJvcicpIHtcbiAgICAgICAgICAgICAgICBpZiAoJC5lcnJvcilcbiAgICAgICAgICAgICAgICAgICAgJC5lcnJvcigncGFyc2VyZXJyb3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzICYmIHMuZGF0YUZpbHRlcikge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBzLmRhdGFGaWx0ZXIoZGF0YSwgdHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdqc29uJyB8fCAhdHlwZSAmJiBjdC5pbmRleE9mKCdqc29uJykgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhID0gcGFyc2VKU09OKGRhdGEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJzY3JpcHRcIiB8fCAhdHlwZSAmJiBjdC5pbmRleE9mKFwiamF2YXNjcmlwdFwiKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICQuZ2xvYmFsRXZhbChkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gZGVmZXJyZWQ7XG4gICAgfVxufTtcblxuLyoqXG4gKiBhamF4Rm9ybSgpIHByb3ZpZGVzIGEgbWVjaGFuaXNtIGZvciBmdWxseSBhdXRvbWF0aW5nIGZvcm0gc3VibWlzc2lvbi5cbiAqXG4gKiBUaGUgYWR2YW50YWdlcyBvZiB1c2luZyB0aGlzIG1ldGhvZCBpbnN0ZWFkIG9mIGFqYXhTdWJtaXQoKSBhcmU6XG4gKlxuICogMTogVGhpcyBtZXRob2Qgd2lsbCBpbmNsdWRlIGNvb3JkaW5hdGVzIGZvciA8aW5wdXQgdHlwZT1cImltYWdlXCIgLz4gZWxlbWVudHMgKGlmIHRoZSBlbGVtZW50XG4gKiAgICBpcyB1c2VkIHRvIHN1Ym1pdCB0aGUgZm9ybSkuXG4gKiAyLiBUaGlzIG1ldGhvZCB3aWxsIGluY2x1ZGUgdGhlIHN1Ym1pdCBlbGVtZW50J3MgbmFtZS92YWx1ZSBkYXRhIChmb3IgdGhlIGVsZW1lbnQgdGhhdCB3YXNcbiAqICAgIHVzZWQgdG8gc3VibWl0IHRoZSBmb3JtKS5cbiAqIDMuIFRoaXMgbWV0aG9kIGJpbmRzIHRoZSBzdWJtaXQoKSBtZXRob2QgdG8gdGhlIGZvcm0gZm9yIHlvdS5cbiAqXG4gKiBUaGUgb3B0aW9ucyBhcmd1bWVudCBmb3IgYWpheEZvcm0gd29ya3MgZXhhY3RseSBhcyBpdCBkb2VzIGZvciBhamF4U3VibWl0LiAgYWpheEZvcm0gbWVyZWx5XG4gKiBwYXNzZXMgdGhlIG9wdGlvbnMgYXJndW1lbnQgYWxvbmcgYWZ0ZXIgcHJvcGVybHkgYmluZGluZyBldmVudHMgZm9yIHN1Ym1pdCBlbGVtZW50cyBhbmRcbiAqIHRoZSBmb3JtIGl0c2VsZi5cbiAqL1xuJC5mbi5hamF4Rm9ybSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBvcHRpb25zLmRlbGVnYXRpb24gPSBvcHRpb25zLmRlbGVnYXRpb24gJiYgJC5pc0Z1bmN0aW9uKCQuZm4ub24pO1xuXG4gICAgLy8gaW4galF1ZXJ5IDEuMysgd2UgY2FuIGZpeCBtaXN0YWtlcyB3aXRoIHRoZSByZWFkeSBzdGF0ZVxuICAgIGlmICghb3B0aW9ucy5kZWxlZ2F0aW9uICYmIHRoaXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHZhciBvID0geyBzOiB0aGlzLnNlbGVjdG9yLCBjOiB0aGlzLmNvbnRleHQgfTtcbiAgICAgICAgaWYgKCEkLmlzUmVhZHkgJiYgby5zKSB7XG4gICAgICAgICAgICBsb2coJ0RPTSBub3QgcmVhZHksIHF1ZXVpbmcgYWpheEZvcm0nKTtcbiAgICAgICAgICAgICQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJChvLnMsby5jKS5hamF4Rm9ybShvcHRpb25zKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaXMgeW91ciBET00gcmVhZHk/ICBodHRwOi8vZG9jcy5qcXVlcnkuY29tL1R1dG9yaWFsczpJbnRyb2R1Y2luZ18kKGRvY3VtZW50KS5yZWFkeSgpXG4gICAgICAgIGxvZygndGVybWluYXRpbmc7IHplcm8gZWxlbWVudHMgZm91bmQgYnkgc2VsZWN0b3InICsgKCQuaXNSZWFkeSA/ICcnIDogJyAoRE9NIG5vdCByZWFkeSknKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmICggb3B0aW9ucy5kZWxlZ2F0aW9uICkge1xuICAgICAgICAkKGRvY3VtZW50KVxuICAgICAgICAgICAgLm9mZignc3VibWl0LmZvcm0tcGx1Z2luJywgdGhpcy5zZWxlY3RvciwgZG9BamF4U3VibWl0KVxuICAgICAgICAgICAgLm9mZignY2xpY2suZm9ybS1wbHVnaW4nLCB0aGlzLnNlbGVjdG9yLCBjYXB0dXJlU3VibWl0dGluZ0VsZW1lbnQpXG4gICAgICAgICAgICAub24oJ3N1Ym1pdC5mb3JtLXBsdWdpbicsIHRoaXMuc2VsZWN0b3IsIG9wdGlvbnMsIGRvQWpheFN1Ym1pdClcbiAgICAgICAgICAgIC5vbignY2xpY2suZm9ybS1wbHVnaW4nLCB0aGlzLnNlbGVjdG9yLCBvcHRpb25zLCBjYXB0dXJlU3VibWl0dGluZ0VsZW1lbnQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5hamF4Rm9ybVVuYmluZCgpXG4gICAgICAgIC5iaW5kKCdzdWJtaXQuZm9ybS1wbHVnaW4nLCBvcHRpb25zLCBkb0FqYXhTdWJtaXQpXG4gICAgICAgIC5iaW5kKCdjbGljay5mb3JtLXBsdWdpbicsIG9wdGlvbnMsIGNhcHR1cmVTdWJtaXR0aW5nRWxlbWVudCk7XG59O1xuXG4vLyBwcml2YXRlIGV2ZW50IGhhbmRsZXJzXG5mdW5jdGlvbiBkb0FqYXhTdWJtaXQoZSkge1xuICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgdmFyIG9wdGlvbnMgPSBlLmRhdGE7XG4gICAgaWYgKCFlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSB7IC8vIGlmIGV2ZW50IGhhcyBiZWVuIGNhbmNlbGVkLCBkb24ndCBwcm9jZWVkXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgJChlLnRhcmdldCkuYWpheFN1Ym1pdChvcHRpb25zKTsgLy8gIzM2NVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY2FwdHVyZVN1Ym1pdHRpbmdFbGVtZW50KGUpIHtcbiAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICB2YXIgJGVsID0gJCh0YXJnZXQpO1xuICAgIGlmICghKCRlbC5pcyhcIlt0eXBlPXN1Ym1pdF0sW3R5cGU9aW1hZ2VdXCIpKSkge1xuICAgICAgICAvLyBpcyB0aGlzIGEgY2hpbGQgZWxlbWVudCBvZiB0aGUgc3VibWl0IGVsPyAgKGV4OiBhIHNwYW4gd2l0aGluIGEgYnV0dG9uKVxuICAgICAgICB2YXIgdCA9ICRlbC5jbG9zZXN0KCdbdHlwZT1zdWJtaXRdJyk7XG4gICAgICAgIGlmICh0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRhcmdldCA9IHRbMF07XG4gICAgfVxuICAgIHZhciBmb3JtID0gdGhpcztcbiAgICBmb3JtLmNsayA9IHRhcmdldDtcbiAgICBpZiAodGFyZ2V0LnR5cGUgPT0gJ2ltYWdlJykge1xuICAgICAgICBpZiAoZS5vZmZzZXRYICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGZvcm0uY2xrX3ggPSBlLm9mZnNldFg7XG4gICAgICAgICAgICBmb3JtLmNsa195ID0gZS5vZmZzZXRZO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAkLmZuLm9mZnNldCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJGVsLm9mZnNldCgpO1xuICAgICAgICAgICAgZm9ybS5jbGtfeCA9IGUucGFnZVggLSBvZmZzZXQubGVmdDtcbiAgICAgICAgICAgIGZvcm0uY2xrX3kgPSBlLnBhZ2VZIC0gb2Zmc2V0LnRvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvcm0uY2xrX3ggPSBlLnBhZ2VYIC0gdGFyZ2V0Lm9mZnNldExlZnQ7XG4gICAgICAgICAgICBmb3JtLmNsa195ID0gZS5wYWdlWSAtIHRhcmdldC5vZmZzZXRUb3A7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gY2xlYXIgZm9ybSB2YXJzXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgZm9ybS5jbGsgPSBmb3JtLmNsa194ID0gZm9ybS5jbGtfeSA9IG51bGw7IH0sIDEwMCk7XG59XG5cblxuLy8gYWpheEZvcm1VbmJpbmQgdW5iaW5kcyB0aGUgZXZlbnQgaGFuZGxlcnMgdGhhdCB3ZXJlIGJvdW5kIGJ5IGFqYXhGb3JtXG4kLmZuLmFqYXhGb3JtVW5iaW5kID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMudW5iaW5kKCdzdWJtaXQuZm9ybS1wbHVnaW4gY2xpY2suZm9ybS1wbHVnaW4nKTtcbn07XG5cbi8qKlxuICogZm9ybVRvQXJyYXkoKSBnYXRoZXJzIGZvcm0gZWxlbWVudCBkYXRhIGludG8gYW4gYXJyYXkgb2Ygb2JqZWN0cyB0aGF0IGNhblxuICogYmUgcGFzc2VkIHRvIGFueSBvZiB0aGUgZm9sbG93aW5nIGFqYXggZnVuY3Rpb25zOiAkLmdldCwgJC5wb3N0LCBvciBsb2FkLlxuICogRWFjaCBvYmplY3QgaW4gdGhlIGFycmF5IGhhcyBib3RoIGEgJ25hbWUnIGFuZCAndmFsdWUnIHByb3BlcnR5LiAgQW4gZXhhbXBsZSBvZlxuICogYW4gYXJyYXkgZm9yIGEgc2ltcGxlIGxvZ2luIGZvcm0gbWlnaHQgYmU6XG4gKlxuICogWyB7IG5hbWU6ICd1c2VybmFtZScsIHZhbHVlOiAnanJlc2lnJyB9LCB7IG5hbWU6ICdwYXNzd29yZCcsIHZhbHVlOiAnc2VjcmV0JyB9IF1cbiAqXG4gKiBJdCBpcyB0aGlzIGFycmF5IHRoYXQgaXMgcGFzc2VkIHRvIHByZS1zdWJtaXQgY2FsbGJhY2sgZnVuY3Rpb25zIHByb3ZpZGVkIHRvIHRoZVxuICogYWpheFN1Ym1pdCgpIGFuZCBhamF4Rm9ybSgpIG1ldGhvZHMuXG4gKi9cbiQuZm4uZm9ybVRvQXJyYXkgPSBmdW5jdGlvbihzZW1hbnRpYywgZWxlbWVudHMpIHtcbiAgICB2YXIgYSA9IFtdO1xuICAgIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG5cbiAgICB2YXIgZm9ybSA9IHRoaXNbMF07XG4gICAgdmFyIGVscyA9IHNlbWFudGljID8gZm9ybS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnKicpIDogZm9ybS5lbGVtZW50cztcbiAgICBpZiAoIWVscykge1xuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG5cbiAgICB2YXIgaSxqLG4sdixlbCxtYXgsam1heDtcbiAgICBmb3IoaT0wLCBtYXg9ZWxzLmxlbmd0aDsgaSA8IG1heDsgaSsrKSB7XG4gICAgICAgIGVsID0gZWxzW2ldO1xuICAgICAgICBuID0gZWwubmFtZTtcbiAgICAgICAgaWYgKCFuIHx8IGVsLmRpc2FibGVkKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZW1hbnRpYyAmJiBmb3JtLmNsayAmJiBlbC50eXBlID09IFwiaW1hZ2VcIikge1xuICAgICAgICAgICAgLy8gaGFuZGxlIGltYWdlIGlucHV0cyBvbiB0aGUgZmx5IHdoZW4gc2VtYW50aWMgPT0gdHJ1ZVxuICAgICAgICAgICAgaWYoZm9ybS5jbGsgPT0gZWwpIHtcbiAgICAgICAgICAgICAgICBhLnB1c2goe25hbWU6IG4sIHZhbHVlOiAkKGVsKS52YWwoKSwgdHlwZTogZWwudHlwZSB9KTtcbiAgICAgICAgICAgICAgICBhLnB1c2goe25hbWU6IG4rJy54JywgdmFsdWU6IGZvcm0uY2xrX3h9LCB7bmFtZTogbisnLnknLCB2YWx1ZTogZm9ybS5jbGtfeX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB2ID0gJC5maWVsZFZhbHVlKGVsLCB0cnVlKTtcbiAgICAgICAgaWYgKHYgJiYgdi5jb25zdHJ1Y3RvciA9PSBBcnJheSkge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnRzKVxuICAgICAgICAgICAgICAgIGVsZW1lbnRzLnB1c2goZWwpO1xuICAgICAgICAgICAgZm9yKGo9MCwgam1heD12Lmxlbmd0aDsgaiA8IGptYXg7IGorKykge1xuICAgICAgICAgICAgICAgIGEucHVzaCh7bmFtZTogbiwgdmFsdWU6IHZbal19KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChmZWF0dXJlLmZpbGVhcGkgJiYgZWwudHlwZSA9PSAnZmlsZScpIHtcbiAgICAgICAgICAgIGlmIChlbGVtZW50cylcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKGVsKTtcbiAgICAgICAgICAgIHZhciBmaWxlcyA9IGVsLmZpbGVzO1xuICAgICAgICAgICAgaWYgKGZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGZvciAoaj0wOyBqIDwgZmlsZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYS5wdXNoKHtuYW1lOiBuLCB2YWx1ZTogZmlsZXNbal0sIHR5cGU6IGVsLnR5cGV9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyAjMTgwXG4gICAgICAgICAgICAgICAgYS5wdXNoKHsgbmFtZTogbiwgdmFsdWU6ICcnLCB0eXBlOiBlbC50eXBlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHYgIT09IG51bGwgJiYgdHlwZW9mIHYgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmIChlbGVtZW50cylcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKGVsKTtcbiAgICAgICAgICAgIGEucHVzaCh7bmFtZTogbiwgdmFsdWU6IHYsIHR5cGU6IGVsLnR5cGUsIHJlcXVpcmVkOiBlbC5yZXF1aXJlZH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFzZW1hbnRpYyAmJiBmb3JtLmNsaykge1xuICAgICAgICAvLyBpbnB1dCB0eXBlPT0naW1hZ2UnIGFyZSBub3QgZm91bmQgaW4gZWxlbWVudHMgYXJyYXkhIGhhbmRsZSBpdCBoZXJlXG4gICAgICAgIHZhciAkaW5wdXQgPSAkKGZvcm0uY2xrKSwgaW5wdXQgPSAkaW5wdXRbMF07XG4gICAgICAgIG4gPSBpbnB1dC5uYW1lO1xuICAgICAgICBpZiAobiAmJiAhaW5wdXQuZGlzYWJsZWQgJiYgaW5wdXQudHlwZSA9PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICBhLnB1c2goe25hbWU6IG4sIHZhbHVlOiAkaW5wdXQudmFsKCl9KTtcbiAgICAgICAgICAgIGEucHVzaCh7bmFtZTogbisnLngnLCB2YWx1ZTogZm9ybS5jbGtfeH0sIHtuYW1lOiBuKycueScsIHZhbHVlOiBmb3JtLmNsa195fSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGE7XG59O1xuXG4vKipcbiAqIFNlcmlhbGl6ZXMgZm9ybSBkYXRhIGludG8gYSAnc3VibWl0dGFibGUnIHN0cmluZy4gVGhpcyBtZXRob2Qgd2lsbCByZXR1cm4gYSBzdHJpbmdcbiAqIGluIHRoZSBmb3JtYXQ6IG5hbWUxPXZhbHVlMSZhbXA7bmFtZTI9dmFsdWUyXG4gKi9cbiQuZm4uZm9ybVNlcmlhbGl6ZSA9IGZ1bmN0aW9uKHNlbWFudGljKSB7XG4gICAgLy9oYW5kIG9mZiB0byBqUXVlcnkucGFyYW0gZm9yIHByb3BlciBlbmNvZGluZ1xuICAgIHJldHVybiAkLnBhcmFtKHRoaXMuZm9ybVRvQXJyYXkoc2VtYW50aWMpKTtcbn07XG5cbi8qKlxuICogU2VyaWFsaXplcyBhbGwgZmllbGQgZWxlbWVudHMgaW4gdGhlIGpRdWVyeSBvYmplY3QgaW50byBhIHF1ZXJ5IHN0cmluZy5cbiAqIFRoaXMgbWV0aG9kIHdpbGwgcmV0dXJuIGEgc3RyaW5nIGluIHRoZSBmb3JtYXQ6IG5hbWUxPXZhbHVlMSZhbXA7bmFtZTI9dmFsdWUyXG4gKi9cbiQuZm4uZmllbGRTZXJpYWxpemUgPSBmdW5jdGlvbihzdWNjZXNzZnVsKSB7XG4gICAgdmFyIGEgPSBbXTtcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBuID0gdGhpcy5uYW1lO1xuICAgICAgICBpZiAoIW4pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdiA9ICQuZmllbGRWYWx1ZSh0aGlzLCBzdWNjZXNzZnVsKTtcbiAgICAgICAgaWYgKHYgJiYgdi5jb25zdHJ1Y3RvciA9PSBBcnJheSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaT0wLG1heD12Lmxlbmd0aDsgaSA8IG1heDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgYS5wdXNoKHtuYW1lOiBuLCB2YWx1ZTogdltpXX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHYgIT09IG51bGwgJiYgdHlwZW9mIHYgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGEucHVzaCh7bmFtZTogdGhpcy5uYW1lLCB2YWx1ZTogdn0pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgLy9oYW5kIG9mZiB0byBqUXVlcnkucGFyYW0gZm9yIHByb3BlciBlbmNvZGluZ1xuICAgIHJldHVybiAkLnBhcmFtKGEpO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZShzKSBvZiB0aGUgZWxlbWVudCBpbiB0aGUgbWF0Y2hlZCBzZXQuICBGb3IgZXhhbXBsZSwgY29uc2lkZXIgdGhlIGZvbGxvd2luZyBmb3JtOlxuICpcbiAqICA8Zm9ybT48ZmllbGRzZXQ+XG4gKiAgICAgIDxpbnB1dCBuYW1lPVwiQVwiIHR5cGU9XCJ0ZXh0XCIgLz5cbiAqICAgICAgPGlucHV0IG5hbWU9XCJBXCIgdHlwZT1cInRleHRcIiAvPlxuICogICAgICA8aW5wdXQgbmFtZT1cIkJcIiB0eXBlPVwiY2hlY2tib3hcIiB2YWx1ZT1cIkIxXCIgLz5cbiAqICAgICAgPGlucHV0IG5hbWU9XCJCXCIgdHlwZT1cImNoZWNrYm94XCIgdmFsdWU9XCJCMlwiLz5cbiAqICAgICAgPGlucHV0IG5hbWU9XCJDXCIgdHlwZT1cInJhZGlvXCIgdmFsdWU9XCJDMVwiIC8+XG4gKiAgICAgIDxpbnB1dCBuYW1lPVwiQ1wiIHR5cGU9XCJyYWRpb1wiIHZhbHVlPVwiQzJcIiAvPlxuICogIDwvZmllbGRzZXQ+PC9mb3JtPlxuICpcbiAqICB2YXIgdiA9ICQoJ2lucHV0W3R5cGU9dGV4dF0nKS5maWVsZFZhbHVlKCk7XG4gKiAgLy8gaWYgbm8gdmFsdWVzIGFyZSBlbnRlcmVkIGludG8gdGhlIHRleHQgaW5wdXRzXG4gKiAgdiA9PSBbJycsJyddXG4gKiAgLy8gaWYgdmFsdWVzIGVudGVyZWQgaW50byB0aGUgdGV4dCBpbnB1dHMgYXJlICdmb28nIGFuZCAnYmFyJ1xuICogIHYgPT0gWydmb28nLCdiYXInXVxuICpcbiAqICB2YXIgdiA9ICQoJ2lucHV0W3R5cGU9Y2hlY2tib3hdJykuZmllbGRWYWx1ZSgpO1xuICogIC8vIGlmIG5laXRoZXIgY2hlY2tib3ggaXMgY2hlY2tlZFxuICogIHYgPT09IHVuZGVmaW5lZFxuICogIC8vIGlmIGJvdGggY2hlY2tib3hlcyBhcmUgY2hlY2tlZFxuICogIHYgPT0gWydCMScsICdCMiddXG4gKlxuICogIHZhciB2ID0gJCgnaW5wdXRbdHlwZT1yYWRpb10nKS5maWVsZFZhbHVlKCk7XG4gKiAgLy8gaWYgbmVpdGhlciByYWRpbyBpcyBjaGVja2VkXG4gKiAgdiA9PT0gdW5kZWZpbmVkXG4gKiAgLy8gaWYgZmlyc3QgcmFkaW8gaXMgY2hlY2tlZFxuICogIHYgPT0gWydDMSddXG4gKlxuICogVGhlIHN1Y2Nlc3NmdWwgYXJndW1lbnQgY29udHJvbHMgd2hldGhlciBvciBub3QgdGhlIGZpZWxkIGVsZW1lbnQgbXVzdCBiZSAnc3VjY2Vzc2Z1bCdcbiAqIChwZXIgaHR0cDovL3d3dy53My5vcmcvVFIvaHRtbDQvaW50ZXJhY3QvZm9ybXMuaHRtbCNzdWNjZXNzZnVsLWNvbnRyb2xzKS5cbiAqIFRoZSBkZWZhdWx0IHZhbHVlIG9mIHRoZSBzdWNjZXNzZnVsIGFyZ3VtZW50IGlzIHRydWUuICBJZiB0aGlzIHZhbHVlIGlzIGZhbHNlIHRoZSB2YWx1ZShzKVxuICogZm9yIGVhY2ggZWxlbWVudCBpcyByZXR1cm5lZC5cbiAqXG4gKiBOb3RlOiBUaGlzIG1ldGhvZCAqYWx3YXlzKiByZXR1cm5zIGFuIGFycmF5LiAgSWYgbm8gdmFsaWQgdmFsdWUgY2FuIGJlIGRldGVybWluZWQgdGhlXG4gKiAgICBhcnJheSB3aWxsIGJlIGVtcHR5LCBvdGhlcndpc2UgaXQgd2lsbCBjb250YWluIG9uZSBvciBtb3JlIHZhbHVlcy5cbiAqL1xuJC5mbi5maWVsZFZhbHVlID0gZnVuY3Rpb24oc3VjY2Vzc2Z1bCkge1xuICAgIGZvciAodmFyIHZhbD1bXSwgaT0wLCBtYXg9dGhpcy5sZW5ndGg7IGkgPCBtYXg7IGkrKykge1xuICAgICAgICB2YXIgZWwgPSB0aGlzW2ldO1xuICAgICAgICB2YXIgdiA9ICQuZmllbGRWYWx1ZShlbCwgc3VjY2Vzc2Z1bCk7XG4gICAgICAgIGlmICh2ID09PSBudWxsIHx8IHR5cGVvZiB2ID09ICd1bmRlZmluZWQnIHx8ICh2LmNvbnN0cnVjdG9yID09IEFycmF5ICYmICF2Lmxlbmd0aCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2LmNvbnN0cnVjdG9yID09IEFycmF5KVxuICAgICAgICAgICAgJC5tZXJnZSh2YWwsIHYpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB2YWwucHVzaCh2KTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbDtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgdmFsdWUgb2YgdGhlIGZpZWxkIGVsZW1lbnQuXG4gKi9cbiQuZmllbGRWYWx1ZSA9IGZ1bmN0aW9uKGVsLCBzdWNjZXNzZnVsKSB7XG4gICAgdmFyIG4gPSBlbC5uYW1lLCB0ID0gZWwudHlwZSwgdGFnID0gZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChzdWNjZXNzZnVsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgc3VjY2Vzc2Z1bCA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHN1Y2Nlc3NmdWwgJiYgKCFuIHx8IGVsLmRpc2FibGVkIHx8IHQgPT0gJ3Jlc2V0JyB8fCB0ID09ICdidXR0b24nIHx8XG4gICAgICAgICh0ID09ICdjaGVja2JveCcgfHwgdCA9PSAncmFkaW8nKSAmJiAhZWwuY2hlY2tlZCB8fFxuICAgICAgICAodCA9PSAnc3VibWl0JyB8fCB0ID09ICdpbWFnZScpICYmIGVsLmZvcm0gJiYgZWwuZm9ybS5jbGsgIT0gZWwgfHxcbiAgICAgICAgdGFnID09ICdzZWxlY3QnICYmIGVsLnNlbGVjdGVkSW5kZXggPT0gLTEpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodGFnID09ICdzZWxlY3QnKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGVsLnNlbGVjdGVkSW5kZXg7XG4gICAgICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhID0gW10sIG9wcyA9IGVsLm9wdGlvbnM7XG4gICAgICAgIHZhciBvbmUgPSAodCA9PSAnc2VsZWN0LW9uZScpO1xuICAgICAgICB2YXIgbWF4ID0gKG9uZSA/IGluZGV4KzEgOiBvcHMubGVuZ3RoKTtcbiAgICAgICAgZm9yKHZhciBpPShvbmUgPyBpbmRleCA6IDApOyBpIDwgbWF4OyBpKyspIHtcbiAgICAgICAgICAgIHZhciBvcCA9IG9wc1tpXTtcbiAgICAgICAgICAgIGlmIChvcC5zZWxlY3RlZCkge1xuICAgICAgICAgICAgICAgIHZhciB2ID0gb3AudmFsdWU7XG4gICAgICAgICAgICAgICAgaWYgKCF2KSB7IC8vIGV4dHJhIHBhaW4gZm9yIElFLi4uXG4gICAgICAgICAgICAgICAgICAgIHYgPSAob3AuYXR0cmlidXRlcyAmJiBvcC5hdHRyaWJ1dGVzWyd2YWx1ZSddICYmICEob3AuYXR0cmlidXRlc1sndmFsdWUnXS5zcGVjaWZpZWQpKSA/IG9wLnRleHQgOiBvcC52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG9uZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYS5wdXNoKHYpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cbiAgICByZXR1cm4gJChlbCkudmFsKCk7XG59O1xuXG4vKipcbiAqIENsZWFycyB0aGUgZm9ybSBkYXRhLiAgVGFrZXMgdGhlIGZvbGxvd2luZyBhY3Rpb25zIG9uIHRoZSBmb3JtJ3MgaW5wdXQgZmllbGRzOlxuICogIC0gaW5wdXQgdGV4dCBmaWVsZHMgd2lsbCBoYXZlIHRoZWlyICd2YWx1ZScgcHJvcGVydHkgc2V0IHRvIHRoZSBlbXB0eSBzdHJpbmdcbiAqICAtIHNlbGVjdCBlbGVtZW50cyB3aWxsIGhhdmUgdGhlaXIgJ3NlbGVjdGVkSW5kZXgnIHByb3BlcnR5IHNldCB0byAtMVxuICogIC0gY2hlY2tib3ggYW5kIHJhZGlvIGlucHV0cyB3aWxsIGhhdmUgdGhlaXIgJ2NoZWNrZWQnIHByb3BlcnR5IHNldCB0byBmYWxzZVxuICogIC0gaW5wdXRzIG9mIHR5cGUgc3VibWl0LCBidXR0b24sIHJlc2V0LCBhbmQgaGlkZGVuIHdpbGwgKm5vdCogYmUgZWZmZWN0ZWRcbiAqICAtIGJ1dHRvbiBlbGVtZW50cyB3aWxsICpub3QqIGJlIGVmZmVjdGVkXG4gKi9cbiQuZm4uY2xlYXJGb3JtID0gZnVuY3Rpb24oaW5jbHVkZUhpZGRlbikge1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJ2lucHV0LHNlbGVjdCx0ZXh0YXJlYScsIHRoaXMpLmNsZWFyRmllbGRzKGluY2x1ZGVIaWRkZW4pO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBDbGVhcnMgdGhlIHNlbGVjdGVkIGZvcm0gZWxlbWVudHMuXG4gKi9cbiQuZm4uY2xlYXJGaWVsZHMgPSAkLmZuLmNsZWFySW5wdXRzID0gZnVuY3Rpb24oaW5jbHVkZUhpZGRlbikge1xuICAgIHZhciByZSA9IC9eKD86Y29sb3J8ZGF0ZXxkYXRldGltZXxlbWFpbHxtb250aHxudW1iZXJ8cGFzc3dvcmR8cmFuZ2V8c2VhcmNofHRlbHx0ZXh0fHRpbWV8dXJsfHdlZWspJC9pOyAvLyAnaGlkZGVuJyBpcyBub3QgaW4gdGhpcyBsaXN0XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHQgPSB0aGlzLnR5cGUsIHRhZyA9IHRoaXMudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAocmUudGVzdCh0KSB8fCB0YWcgPT0gJ3RleHRhcmVhJykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9ICcnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHQgPT0gJ2NoZWNrYm94JyB8fCB0ID09ICdyYWRpbycpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRhZyA9PSAnc2VsZWN0Jykge1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gLTE7XG4gICAgICAgIH1cblx0XHRlbHNlIGlmICh0ID09IFwiZmlsZVwiKSB7XG5cdFx0XHRpZiAoL01TSUUvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcblx0XHRcdFx0JCh0aGlzKS5yZXBsYWNlV2l0aCgkKHRoaXMpLmNsb25lKHRydWUpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCQodGhpcykudmFsKCcnKTtcblx0XHRcdH1cblx0XHR9XG4gICAgICAgIGVsc2UgaWYgKGluY2x1ZGVIaWRkZW4pIHtcbiAgICAgICAgICAgIC8vIGluY2x1ZGVIaWRkZW4gY2FuIGJlIHRoZSB2YWx1ZSB0cnVlLCBvciBpdCBjYW4gYmUgYSBzZWxlY3RvciBzdHJpbmdcbiAgICAgICAgICAgIC8vIGluZGljYXRpbmcgYSBzcGVjaWFsIHRlc3Q7IGZvciBleGFtcGxlOlxuICAgICAgICAgICAgLy8gICQoJyNteUZvcm0nKS5jbGVhckZvcm0oJy5zcGVjaWFsOmhpZGRlbicpXG4gICAgICAgICAgICAvLyB0aGUgYWJvdmUgd291bGQgY2xlYW4gaGlkZGVuIGlucHV0cyB0aGF0IGhhdmUgdGhlIGNsYXNzIG9mICdzcGVjaWFsJ1xuICAgICAgICAgICAgaWYgKCAoaW5jbHVkZUhpZGRlbiA9PT0gdHJ1ZSAmJiAvaGlkZGVuLy50ZXN0KHQpKSB8fFxuICAgICAgICAgICAgICAgICAodHlwZW9mIGluY2x1ZGVIaWRkZW4gPT0gJ3N0cmluZycgJiYgJCh0aGlzKS5pcyhpbmNsdWRlSGlkZGVuKSkgKVxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSAnJztcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZXNldHMgdGhlIGZvcm0gZGF0YS4gIENhdXNlcyBhbGwgZm9ybSBlbGVtZW50cyB0byBiZSByZXNldCB0byB0aGVpciBvcmlnaW5hbCB2YWx1ZS5cbiAqL1xuJC5mbi5yZXNldEZvcm0gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBndWFyZCBhZ2FpbnN0IGFuIGlucHV0IHdpdGggdGhlIG5hbWUgb2YgJ3Jlc2V0J1xuICAgICAgICAvLyBub3RlIHRoYXQgSUUgcmVwb3J0cyB0aGUgcmVzZXQgZnVuY3Rpb24gYXMgYW4gJ29iamVjdCdcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnJlc2V0ID09ICdmdW5jdGlvbicgfHwgKHR5cGVvZiB0aGlzLnJlc2V0ID09ICdvYmplY3QnICYmICF0aGlzLnJlc2V0Lm5vZGVUeXBlKSkge1xuICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIEVuYWJsZXMgb3IgZGlzYWJsZXMgYW55IG1hdGNoaW5nIGVsZW1lbnRzLlxuICovXG4kLmZuLmVuYWJsZSA9IGZ1bmN0aW9uKGIpIHtcbiAgICBpZiAoYiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGIgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmRpc2FibGVkID0gIWI7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIENoZWNrcy91bmNoZWNrcyBhbnkgbWF0Y2hpbmcgY2hlY2tib3hlcyBvciByYWRpbyBidXR0b25zIGFuZFxuICogc2VsZWN0cy9kZXNlbGVjdHMgYW5kIG1hdGNoaW5nIG9wdGlvbiBlbGVtZW50cy5cbiAqL1xuJC5mbi5zZWxlY3RlZCA9IGZ1bmN0aW9uKHNlbGVjdCkge1xuICAgIGlmIChzZWxlY3QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzZWxlY3QgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdCA9IHRoaXMudHlwZTtcbiAgICAgICAgaWYgKHQgPT0gJ2NoZWNrYm94JyB8fCB0ID09ICdyYWRpbycpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tlZCA9IHNlbGVjdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PSAnb3B0aW9uJykge1xuICAgICAgICAgICAgdmFyICRzZWwgPSAkKHRoaXMpLnBhcmVudCgnc2VsZWN0Jyk7XG4gICAgICAgICAgICBpZiAoc2VsZWN0ICYmICRzZWxbMF0gJiYgJHNlbFswXS50eXBlID09ICdzZWxlY3Qtb25lJykge1xuICAgICAgICAgICAgICAgIC8vIGRlc2VsZWN0IGFsbCBvdGhlciBvcHRpb25zXG4gICAgICAgICAgICAgICAgJHNlbC5maW5kKCdvcHRpb24nKS5zZWxlY3RlZChmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gc2VsZWN0O1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vLyBleHBvc2UgZGVidWcgdmFyXG4kLmZuLmFqYXhTdWJtaXQuZGVidWcgPSBmYWxzZTtcblxuLy8gaGVscGVyIGZuIGZvciBjb25zb2xlIGxvZ2dpbmdcbmZ1bmN0aW9uIGxvZygpIHtcbiAgICBpZiAoISQuZm4uYWpheFN1Ym1pdC5kZWJ1ZylcbiAgICAgICAgcmV0dXJuO1xuICAgIHZhciBtc2cgPSAnW2pxdWVyeS5mb3JtXSAnICsgQXJyYXkucHJvdG90eXBlLmpvaW4uY2FsbChhcmd1bWVudHMsJycpO1xuICAgIGlmICh3aW5kb3cuY29uc29sZSAmJiB3aW5kb3cuY29uc29sZS5sb2cpIHtcbiAgICAgICAgd2luZG93LmNvbnNvbGUubG9nKG1zZyk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHdpbmRvdy5vcGVyYSAmJiB3aW5kb3cub3BlcmEucG9zdEVycm9yKSB7XG4gICAgICAgIHdpbmRvdy5vcGVyYS5wb3N0RXJyb3IobXNnKTtcbiAgICB9XG59XG5cbn0pKTtcblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
