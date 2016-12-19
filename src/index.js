import APIS from './apis'

const JSSDK = 'https://res.wx.qq.com/open/js/jweixin-1.0.0.js'

function plugin(Vue, opts) {
    let weixin, queue

    queue = []
    weixin = {}

    opts = Object.assign({}, {
        url: '',
        config: null
    }, opts)

    if (!opts.url) {
        console.error('Configure the url parameter to inject the wechat js sdk configuration information')
        return
    }

    if (!opts.config) {
        console.error('Configure the config parameter to obtain the wechat js sdk authorization')
        return
    }

    getScript(JSSDK, () => {
        let url = `${opts.url}${opts.url.indexOf('?') < 0 ? '?' : '&'}url=${encodeURIComponent(location.href)}`

        getJSONP(url, (res) => {
            window.wx.config(Object.assign({}, opts.config(res), {
                debug: false,
                jsApiList: APIS
            }))

            window.wx.ready(() => {
                queue.done = true

                for (let index = 0; index < queue.length; index++) {
                    window.wx[queue[index]](queue[++index])
                }

                queue = []
            })

            window.wx.error((res) => {
                queue.done = false
                alert(JSON.stringify(res))
            })
        })
    })

    APIS.map((item) => {
        weixin[item] = (options = {}) => {
            if (queue.done) {
                window.wx[item](options)
            } else {
                queue = [...queue, item, options]
            }
        }
    })

    Vue.wx = weixin
    Vue.prototype.$wx = weixin
}

function getScript(url, callback) {
    let script = document.createElement('script')
    script.src = url
    script.async = true

    scriptOnload(script, callback)

    setTimeout(() => {
        document.getElementsByTagName('head')[0].appendChild(script)
    }, 0)
}

function getJSONP(url, callback = noop) {
    let script, callbackName

    script = document.createElement('script')
    callbackName = `jsonpCallback${random()}${random()}`

    window[callbackName] = function(data) {
        clear()
        callback(data)
    }

    script.id = callbackName
    script.addEventListener('error', clear)
    script.src = `${url}${url.indexOf('?') < 0 ? '?' : '&'}callback=${callbackName}`
    document.getElementsByTagName('head')[0].appendChild(script)

    function clear() {
        delete window[callbackName]
        let element = document.getElementById(callbackName)
        element.parentNode.removeChild(element)
    }
}

function scriptOnload(el, fn = noop) {
    if (el.addEventListener) {
        el.addEventListener('load', (_, e) => {
            fn(null, e)
        }, false)

        el.addEventListener('error', (e) => {
            let err = new Error(`script error ${el.src}`)
            err.event = e
            fn(err)
        }, false)
    } else {
        el.attachEvent('onreadystatechange', (e) => {
            if (!/complete|loaded/.test(el.readyState)) {
                return
            }

            fn(null, e)
        })

        el.attachEvent('onerror', (e) => {
            let err = new Error(`failed to load the script ${el.src}`)
            err.event = e || window.event
            fn(err)
        })
    }
}

function noop() { }

function random() {
    return Math.round(10000 * Math.random())
}

if (typeof window !== 'undefined' && window.Vue) {
    window.Vue.use(plugin)
}

export default plugin