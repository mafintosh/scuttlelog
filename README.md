# scuttlelog

The replication log from [scuttlebutt](https://github.com/dominictarr/scuttlebutt) but as a seperate module

```
npm install scuttlelog
```

[![build status](http://img.shields.io/travis/mafintosh/scuttlelog.svg?style=flat)](http://travis-ci.org/mafintosh/scuttlelog)

## Usage

Use this to implement your own scuttlebutt like data structure with a custom changes feed

``` js
var scuttlelog = require('scuttlelog')

var log = scuttlelog()

log.change({ // add something to the changes feed
  hello: 'world'
})

var log2 = scuttlelog()

log2.on('change', function(change) {
  console.log('change received', change)
})

// replicate between the logs
var s = log.createStream()
s.pipe(log2.createStream()).pipe(s)
```

## License

MIT