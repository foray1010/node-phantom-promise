'use strict'

const driver = require('node-phantom-simple')

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

  return promisifiedTarget
}

module.exports = promisifyAll(driver)
