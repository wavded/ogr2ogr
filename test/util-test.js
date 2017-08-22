var util = require('../modules/util')
var test = require('tape')

test('oneCallback', function(t) {
  t.plan(1)

  var cb = function(er, data) {
    t.ok(data)
  }
  var one = util.oneCallback(cb)
  one(null, 'test')
  one(new Error('should not be called'))
})

test('allCallback', function(t) {
  t.plan(1)

  var cb = function(er, len) {
    t.equal(len, 4)
  }
  var all = util.allCallback(cb)

  function doWork(cb2) {
    setTimeout(function() {
      cb2()
    }, 100)
  }

  doWork(all())
  doWork(all())
  doWork(all())
  doWork(all())
})
