var tape = require('tape')
var log = require('./')

tape('emits', function(t) {
  var l = log()

  l.on('change', function(change) {
    t.same(change.data, 'hello world')
    t.end()
  })

  l.change('hello world')
})

tape('replicates', function(t) {
  var l1 = log()
  var l2 = log()

  l1.change('hello world')

  l2.on('change', function(change) {
    t.same(change.data, 'hello world')
    t.end()
  })

  var s1 = l1.createStream()
  var s2 = l2.createStream()

  s1.pipe(s2).pipe(s1)
})

tape('live replicates', function(t) {
  var l1 = log()
  var l2 = log()

  l1.change('hello world')

  var s1 = l1.createStream()
  var s2 = l2.createStream()

  s1.pipe(s2).pipe(s1)

  l2.change('hello welt')

  setImmediate(function() {
    var vals1 = l1.changes.map(function(change) {
      return change.data
    }).sort()

    var vals2 = l1.changes.map(function(change) {
      return change.data
    }).sort()

    t.same(vals1, ['hello welt', 'hello world'])
    t.same(vals2, ['hello welt', 'hello world'])
    t.end()
  })
})