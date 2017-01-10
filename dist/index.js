'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _apis = require('./apis');

var _apis2 = _interopRequireDefault(_apis);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var JSSDK = 'https://res.wx.qq.com/open/js/jweixin-1.2.0.js';

function plugin(Vue, opts) {
    var weixin = void 0,
        queue = void 0,
        done = void 0;

    queue = [];
    weixin = {};
    done = false;

    opts = (0, _assign2.default)({}, {
        url: '',
        debug: false,
        config: null
    }, opts);

    if (!opts.url) {
        console.error('Configure the url parameter to inject the wechat js sdk configuration information');
        return;
    }

    if (!opts.config) {
        console.error('Configure the config parameter to obtain the wechat js sdk authorization');
        return;
    }

    getScript(JSSDK, function () {
        var url = '' + opts.url + (opts.url.indexOf('?') < 0 ? '?' : '&') + 'url=' + encodeURIComponent(location.href);

        getJSONP(url, function (res) {
            window.wx.config((0, _assign2.default)({}, opts.config(res), {
                jsApiList: _apis2.default,
                debug: opts.debug
            }));

            window.wx.ready(function () {
                done = true;

                for (var index = 0; index < queue.length; index++) {
                    window.wx[queue[index]](queue[++index]);
                }

                queue = [];
            });

            window.wx.error(function (res) {
                alert((0, _stringify2.default)(res));
            });
        });
    });

    _apis2.default.map(function (item) {
        weixin[item] = function () {
            var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            if (done) {
                window.wx[item](options);
            } else {
                queue = [].concat((0, _toConsumableArray3.default)(queue), [item, options]);
            }
        };
    });

    weixin.webviewIsWK = function () {
        return !!window.__wxjs_is_wkwebview;
    };
    weixin.webviewIsUI = function () {
        return !window.__wxjs_is_wkwebview;
    };

    Vue.wx = weixin;
    Vue.prototype.$wx = weixin;
}

function getScript(url, callback) {
    var script = document.createElement('script');
    script.src = url;
    script.async = true;

    scriptOnload(script, callback);

    setTimeout(function () {
        document.getElementsByTagName('head')[0].appendChild(script);
    }, 0);
}

function getJSONP(url) {
    var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;

    var script = void 0,
        callbackName = void 0;

    script = document.createElement('script');
    callbackName = 'jsonpCallback' + random() + random();

    window[callbackName] = function (data) {
        clear();
        callback(data);
    };

    script.id = callbackName;
    script.addEventListener('error', clear);
    script.src = '' + url + (url.indexOf('?') < 0 ? '?' : '&') + 'callback=' + callbackName;
    document.getElementsByTagName('head')[0].appendChild(script);

    function clear() {
        delete window[callbackName];
        var element = document.getElementById(callbackName);
        element.parentNode.removeChild(element);
    }
}

function scriptOnload(el) {
    var fn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;

    if (el.addEventListener) {
        el.addEventListener('load', function (_, e) {
            fn(null, e);
        }, false);

        el.addEventListener('error', function (e) {
            var err = new Error('script error ' + el.src);
            err.event = e;
            fn(err);
        }, false);
    } else {
        el.attachEvent('onreadystatechange', function (e) {
            if (!/complete|loaded/.test(el.readyState)) {
                return;
            }

            fn(null, e);
        });

        el.attachEvent('onerror', function (e) {
            var err = new Error('failed to load the script ' + el.src);
            err.event = e || window.event;
            fn(err);
        });
    }
}

function noop() {}

function random() {
    return Math.round(10000 * Math.random());
}

if (typeof window !== 'undefined' && window.Vue) {
    window.Vue.use(plugin);
}

exports.default = plugin;