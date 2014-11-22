
0.5.1 / 2014-11-21
==================

  * fix; properly close pass through stream
  * mod; switch to jenkins ci

0.5.0 / 2014-11-04
==================

  * fix; ensure extractHead always call us back [kapouer]
  * fix; gdal 1.10.1 virtual driver requires geometryType [kapouer]
  * mod; cast column names to string [kapouer]
  * mod; faster comma-separated-values to parse csv header [kapouer]
  * mod; toggle source/target srs when loading CSV [kapouer]
  * deps; update all dependencies

0.4.1 / 2014-10-17
==================

 * fix; PostgreSQL driver

0.4.0 / 2014-10-14
==================

 * add; sample cryllic file
 * mod; stderr on non-zero exit
 * mod; use gdal 1.11.0 for tests

0.3.1 / 2014-05-30
==================

 * add; PostgreSQL format [ChrisCarto]
 * fix; prevent emitting two successive errors when outputting to a zip file [boreal-is]
 * fix; do not unzip /vsizip/ input paths [kapouer]

0.2.2 / 2014-02-18
==================

 * fix; tighten source reqs

0.2.1 / 2014-01-12
==================

 * fix; do not use 'error' event for ogr2ogr info

0.2.0 / 2014-01-06 
==================

 * change; .project(dest, null) removes default sourceSrs [kapouer]
 * add; destination() custom ogr2ogr destination [kapouer]
 * add; .skipfailures() [kapouer] **BREAKING** No longer skipping failures by default
 * add; .options([]) appends custom parameters [kapouer]

0.1.2 / 2013-11-15 
==================

 * add; timeout option

0.1.1 / 2013-11-11 
==================

 * add; note about spatial urls as inputs
 * add; gpx format
 * add; gml, gmt, and vrt support
 * add; georss, geoconcept, dxf, dgn support
 * add; infer some stream types
