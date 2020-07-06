const ogr2ogr = require('../')

let geojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [102.0, 0.5],
      },
      properties: {area: '51'},
    },
  ],
}

let ogr = ogr2ogr(geojson).project('EPSG:3857')

ogr.exec(function (er, data) {
  if (er) console.error(er)
  console.log(data) // reprojected geojson data
})
