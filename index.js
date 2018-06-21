#! /usr/bin/env node
const fs = require('fs')
const readline = require('readline')
const zlib = require('zlib')
const Protobuf = require('pbf')
const VectorTile = require('@mapbox/vector-tile').VectorTile
let count = { empty: 0, filled: 0 }

if (process.argv.length === 2) {
  console.log('node index.html {headless-serialtiles}')
  process.exit()
}

for (let i = 2; i < process.argv.length; i++) {
  const path = process.argv[i]
  if (!fs.existsSync(path)) throw `${path} not found`
  readline.createInterface({
    input: fs.createReadStream(path, 'utf-8')
  }).on('line', line => {
    const r = JSON.parse(line)
    if (r.buffer) {
      count.filled++
      const tile = new VectorTile(
        new Protobuf(zlib.gunzipSync(Buffer.from(r.buffer, 'base64')))
      )
      for (const l of Object.keys(tile.layers)) {
        for (let i = 0; i < tile.layers[l].length; i++) {
          const f = tile.layers[l].feature(i).toGeoJSON(r.x, r.y, r.z)
          if ('_layer' in f.properties) throw '_layer is aleady there!'
          f.properties._layer = l
          console.log(JSON.stringify(f))
        }
      }
    } else {
      count.empty++
    }
  }).on('close', () => {
  })
}
