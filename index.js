'use strict'

const driver = require('node-phantom-simple')

// copy from node-phantom-simple/bridge.js
const pageCallbacks = [
  'onAlert', 'onCallback', 'onClosing', 'onConfirm', 'onConsoleMessage', 'onError', 'onFilePicker',
  'onInitialized', 'onLoadFinished', 'onLoadStarted', 'onNavigationRequested',
  'onPrompt', 'onResourceRequested', 'onResourceReceived', 'onResourceTimeout', 'onResourceError', 'onUrlChanged',
  // SlimerJS only
  'onAuthPrompt'
]
// copy from node-phantom-simple/node-phantom-simple.js
const pageMethods = [
  'addCookie', 'childFramesCount', 'childFramesName', 'clearCookies', 'close',
  'currentFrameName', 'deleteCookie', 'evaluateJavaScript',
  'evaluateAsync', 'getPage', 'go', 'goBack', 'goForward', 'includeJs',
  'injectJs', 'open', 'openUrl', 'release', 'reload', 'render', 'renderBase64',
  'sendEvent', 'setContent', 'stop', 'switchToFocusedFrame', 'switchToFrame',
  'switchToFrame', 'switchToChildFrame', 'switchToChildFrame', 'switchToMainFrame',
  'switchToParentFrame', 'uploadFile', 'clearMemoryCache'
]

function genPromiseFunc(originalFunc) {
  return function () {
    const _args = Array.prototype.slice.call(arguments)
    const _this = this

    return new Promise(function (resolve, reject) {
      _args.push(function () {
        const _args2 = Array.prototype.slice.call(arguments)

        const err = _args2.shift()

        if (err) {
          reject(err)
        } else {
          const _arg3 = _args2.map(function (arg) {
            return promisifyAll(arg)
          })

          resolve.apply(null, _arg3)
        }
      })

      originalFunc.apply(_this, _args)
    })
  }
}

function promisifyAll(target) {
  if (typeof target !== 'object' || Array.isArray(target) || target === null) {
    return target
  }

  const promisifiedTarget = {}

  for (let targetPropName of Object.keys(target)) {
    const targetPropValue = target[targetPropName]

    promisifiedTarget[targetPropName] = typeof targetPropValue === 'function' ?
      genPromiseFunc(targetPropValue) :
      targetPropValue
  }

  // fill onWhatever callback when it is a page object
  const isPage = pageMethods.every(function (pageMethodName) {
    return Boolean(target[pageMethodName])
  })
  if (isPage) {
    const propsDescriptor = {}
    for (let pageCallbackName of pageCallbacks) {
      propsDescriptor[pageCallbackName] = {
        get: function () {
          return target[pageCallbackName]
        },
        set: function (newValue) {
          target[pageCallbackName] = newValue
        }
      }
    }

    Object.defineProperties(promisifiedTarget, propsDescriptor)
  }

  return promisifiedTarget
}

module.exports = promisifyAll(driver)
