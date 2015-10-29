# node-phantom-promise
> A simple wrapper for [baudehlo/node-phantom-simple](https://github.com/baudehlo/node-phantom-simple) with promise

This module is API-compatible with
[node-phantom](https://www.npmjs.com/package/node-phantom) but doesn't rely on
`WebSockets` / `socket.io`. In essence the communication between Node and
Phantom / Slimer has been simplified significantly. It has the following advantages
over `node-phantom`:

  - Fewer dependencies/layers.
  - Doesn't use the unreliable and huge socket.io.
  - Works under [`cluster`](http://nodejs.org/api/cluster.html) (node-phantom
    does not, due to [how it works](https://nodejs.org/api/cluster.html#cluster_how_it_works))
    `server.listen(0)` works in cluster.
  - Supports SlimerJS.
  - Promise callback

## Installing
```bash
npm install node-phantom-promise

# Also need phantomjs OR slimerjs:

npm install phantomjs
# OR
npm install slimerjs
```

__Note__. SlimerJS is not headless and requires a windowing environment.
Under Linux/FreeBSD/OSX [xvfb can be used to run headlessly.](https://docs.slimerjs.org/current/installation.html#having-a-headless-slimerjs). For example, if you wish
to run SlimerJS on Travis-CI, add those lines to your `.travis.yml` config:

```yaml
before_script:
  - export DISPLAY=:99.0
  - "sh -e /etc/init.d/xvfb start"
```

## Usage
Refer to `Usage` in [baudehlo/node-phantom-simple](https://github.com/baudehlo/node-phantom-simple/blob/master/README.md)

** Please be aware that

1. You should use it in promise style, put callback function in `then` or `catch`

2. the argument `err` is moved to `catch` of promise chain, the rest argument will be available in `then` of promise chain

## Example
Highly recommended to use this with [co](https://github.com/tj/co)
```js
'use strict'

const co = require('co')
const driver = require('node-phantom-promise')
const phantomjs = require('phantomjs')
const wait = require('co-wait')

co(function* () {
  const browser = yield driver.create({path: phantomjs.path})

  const page = yield browser.createPage()

  const status = yield page.open('http://tilomitra.com/repository/screenscrape/ajax.html')

  console.log('opened site? ', status)

  yield page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js')

  // jQuery Loaded.
  // Wait for a bit for AJAX content to load on the page. Here, we are waiting 5 seconds.
  yield wait(5000)

  const result = yield page.evaluate(function () {
    // Get what you want from the page using jQuery. A good way is to populate an object with all the jQuery commands that you need and then return the object.
    const h2Arr = []
    const pArr = []

    $('h2').each(function () {
      h2Arr.push($(this).html())
    })
    $('p').each(function () {
      pArr.push($(this).html())
    })

    return {
      h2: h2Arr,
      p: pArr
    }
  })

  console.log(result)

  browser.exit()
}).catch(function (err) {
  console.error(err.stack)
})
```

Or using ES7 `async`/`await` with [babel](https://github.com/babel/babel)
```js
import driver from 'node-phantom-promise'
import phantomjs from 'phantomjs'
import sleep from 'sleep-promise'

!async function () {
  const browser = await driver.create({path: phantomjs.path})

  const page = await browser.createPage()

  const status = await page.open('http://tilomitra.com/repository/screenscrape/ajax.html')

  console.log('opened site? ', status)

  await page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js')

  // jQuery Loaded.
  // Wait for a bit for AJAX content to load on the page. Here, we are waiting 5 seconds.
  await sleep(5000)

  const result = await page.evaluate(function () {
    // Get what you want from the page using jQuery. A good way is to populate an object with all the jQuery commands that you need and then return the object.
    const h2Arr = $('h2').map((index, el) => el.innerHTML).get()
    const pArr = $('p').map((index, el) => el.innerHTML).get()

    return {
      h2: h2Arr,
      p: pArr
    }
  })

  console.log(result)

  browser.exit()
}().catch((err) => {
  console.error(err.stack)
})
```

But no one will stop you from using the old school way
```js
'use strict'

const driver = require('node-phantom-promise')
const phantomjs = require('phantomjs')

driver.create({path: phantomjs.path}).then(function (browser) {
  return browser.createPage().then(function (page) {
    return page.open('http://tilomitra.com/repository/screenscrape/ajax.html').then(function (status) {
      console.log('opened site? ', status)

      return page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js').then(function () {
        // jQuery Loaded.
        // Wait for a bit for AJAX content to load on the page. Here, we are waiting 5 seconds.
        setTimeout(function () {
          page.evaluate(function () {
            // Get what you want from the page using jQuery. A good way is to populate an object with all the jQuery commands that you need and then return the object.
            const h2Arr = []
            const pArr = []

            $('h2').each(function () {
              h2Arr.push($(this).html())
            })
            $('p').each(function () {
              pArr.push($(this).html())
            })

            return {
              h2: h2Arr,
              p: pArr
            }
          }).then(function (result) {
            console.log(result)
            browser.exit()
          }).catch(function (err) {
            console.error(err.stack)
          })
        }, 5000)
      })
    })
  })
}).catch(function (err) {
  console.error(err.stack)
})
```
