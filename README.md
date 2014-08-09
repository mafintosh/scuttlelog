# scuttlelog

The replication log from scuttlebutt but as a seperate module

```
npm install scuttlelog
```

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