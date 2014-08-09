var cuid = require('cuid')
var ldjson = require('ldjson-stream')
var duplexify = require('duplexify')
var once = require('once')
var util = require('util')
var EventEmitter = require('events').EventEmitter

var Log = function(id) {
  if (!(this instanceof Log)) return new Log(id)
  EventEmitter.call(this)

  this.id = id || cuid()
  this.seq = 0
  this.changes = []
  this.digest = {}

  this._streams = []
}

util.inherits(Log, EventEmitter)

Log.prototype.change = function(data) {
  var change = {
    peer: this.id,
    seq: ++this.seq,
    data: data
  }

  this._apply(change, null)
}

Log.prototype._apply = function(change, from) {
  var seq = this.digest[change.peer] || 0
  if (seq >= change.seq) return

  this.digest[change.peer] = change.seq
  this.changes.push(change)
  this.emit('change', change)

  for (var i = 0; i < this._streams.length; i++) {
    if (this._streams[i] !== from) this._streams[i].serialize.write(change)
  }
}

Log.prototype._addStream = function(pair) {
  var self = this

  this._streams.push(pair)

  var clean = once(function() {
    var i = self._streams.indexOf(pair)
    if (i > -1) self._streams.splice(i, 1)
  })

  pair.stream.on('close', clean).on('end', clean).on('finish', clean)

  if (!pair.parse) return pair.stream

  pair.parse.on('data', function(change) {
    self._apply(change, pair)
  })

  return pair.stream
}

Log.prototype.createReadStream = function(opts) {
  if (!opts) opts = {}

  var self = this
  var serialize = ldjson.serialize()
  var live = opts.live !== false

  if (!opts.tail) {
    for (var i = 0; i < this.changes.length; i++) serialize.write(this.changes[i])
  }

  if (!live) {
    serialize.end()
    return duplexify(null, serialize)
  }

  return this._addStream({
    stream: duplexify(null, serialize),
    serialize: serialize
  })
}

Log.prototype.createWriteStream = function() {
  var self = this
  var parse = ldjson.parse()

  parse.on('data', function(change) {
    self._apply(change, null)
  })

  return parse
}

Log.prototype.createStream = function() {
  var self = this

  var parse = ldjson.parse()
  var serialize = ldjson.serialize()
  var dup = duplexify(parse, serialize)

  var pair = {
    stream: dup,
    parse: parse,
    serialize: serialize
  }

  serialize.write({
    id: this.id,
    digest: this.digest
  })

  parse.once('data', function(handshake) {
    dup.emit('connect', handshake.id)

    for (var i = 0; i < self.changes.length; i++) {
      var change = self.changes[i]
      var seq = handshake.digest[change.peer] || 0
      if (change.seq > seq) serialize.write(change)
    }

    self._addStream(pair)
  })

  return dup
}

module.exports = Log