const util = require('../modules/util')
const test = require('tape')

test('oneCallback', function (t) {
  t.plan(1)

  let cb = function (er, data) {
    t.ok(data)
  }
  let one = util.oneCallback(cb)
  one(null, 'test')
  one(new Error('should not be called'))
})

test('allCallback', function (t) {
  t.plan(1)

  let cb = function (er, len) {
    t.equal(len, 4)
  }
  let all = util.allCallback(cb)

  function doWork(cb2) {
    setTimeout(function () {
      cb2()
    }, 100)
  }

  doWork(all())
  doWork(all())
  doWork(all())
  doWork(all())
})
