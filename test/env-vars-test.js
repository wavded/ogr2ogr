const test = require('tape')
const ogr2ogr = require('../')

const sampleGeojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {area: '51'},
    },
  ],
}

test('env vars can be used', function (t) {
  t.plan(2)

  ogr2ogr(sampleGeojson)
  .env({
    ATTRIBUTES_SKIP: 'NO'
  })
  .exec(function (er, data) {
    t.isEquivalent(data.features[0].properties, sampleGeojson.features[0].properties, 'has atrributes')
  })

  ogr2ogr(sampleGeojson)
  .env({
    ATTRIBUTES_SKIP: 'YES'
  })
  .exec(function (er, data) {
    t.isEquivalent(data.features[0].properties, {}, 'has no atrributes')
  })  
})
