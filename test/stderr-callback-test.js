var test = require('tape')
var fs = require('fs')
var ogr2ogr = require('../')
var join = require('path').join
var sampleKml = join(__dirname, '/samples/sample.kml')
var sampleCsv = join(__dirname, '/samples/sample.csv')
var sampleJson = join(__dirname, '/samples/sample.json')
var sampleEsri = join(__dirname, '/samples/sample.shp.zip')



test('outputs debug messages when CPL_DEBUG is ON', function(t) {
    t.plan(3);

    var matches = [];


    var ogr = ogr2ogr(sampleCsv)
        .options(["--config", "CPL_DEBUG", "ON"])
        .onStderr(function(data) {
            var matches_GDAL = /(GDAL):/.exec(data);
            var matches_GDALOpen = /(GDALOpen)/.exec(data);
            var matches_GDALDriver = /(GDALDriver)/.exec(data);
            if (matches_GDAL) {
                matches.push(matches_GDAL[1]);
            }
            if (matches_GDALOpen) {
                matches.push(matches_GDALOpen[1]);
            }
            if (matches_GDALDriver) {
                matches.push(matches_GDALDriver[1]);
            }
        });

    ogr.exec(function(er, data) {
        t.ok(matches.indexOf('GDAL') !== -1, 'GDAL has been printed to stderr');
        t.ok(matches.indexOf('GDALOpen') !== -1, 'GDALOpen has been printed to stderr');
        t.ok(matches.indexOf('GDALDriver') !== -1, 'GDALDriver has been printed to stderr');
    });

});

test('outputs debug messages when converting from JSON when CPL_DEBUG is ON', function(t) {
    t.plan(1);

    var matches = [];

    var ogr = ogr2ogr(sampleJson)
        .options(["--config", "CPL_DEBUG", "ON"])
        .onStderr(function(data) {
            var matches_success = /(succeeds as GeoJSON)/.exec(data);

            if (matches_success) {
                matches.push(matches_success[1]);
            }

        });

    ogr.exec(function(er, data) {
        t.ok(matches.indexOf('succeeds as GeoJSON') !== -1, '"succeeds as GeoJSON" has been printed to stderr');
    });

});

test('outputs debug messages when converting from CSV when CPL_DEBUG is ON', function(t) {
    t.plan(1);

    var matches = [];

    var ogr = ogr2ogr(sampleCsv)
        .options(["--config", "CPL_DEBUG", "ON"])
        .onStderr(function(data) {
            var matches_success = /(succeeds as CSV)/.exec(data);
            if (matches_success) {
                matches.push(matches_success[1]);
            }
        });

    ogr.exec(function(er, data) {
        t.ok(matches.indexOf('succeeds as CSV') !== -1, '"succeeds as CSV" has been printed to stderr');
    });

});

test('outputs debug messages when converting from KML when CPL_DEBUG is ON', function(t) {
    t.plan(1);

    var matches = [];

    var ogr = ogr2ogr(sampleKml)
        .options(["--config", "CPL_DEBUG", "ON"])
        .onStderr(function(data) {
            var matches_success = /(succeeds as LIBKML)/.exec(data);
            if (matches_success) {
                matches.push(matches_success[1]);
            }
        });

    ogr.exec(function(er, data) {
        t.ok(matches.indexOf('succeeds as LIBKML') !== -1, '"succeeds as LIBKML" has been printed to stderr');
    });

});

test('outputs debug messages when converting from ESRI Shapefile when CPL_DEBUG is ON', function(t) {
    t.plan(1);

    var matches = [];

    var ogr = ogr2ogr(sampleEsri)
        .options(["--config", "CPL_DEBUG", "ON"])
        .onStderr(function(data) {
            var matches_success = /(succeeds as ESRI Shapefile)/.exec(data);
            if (matches_success) {
                matches.push(matches_success[1]);
            }
        });

    ogr.exec(function(er, data) {
        t.ok(matches.indexOf('succeeds as ESRI Shapefile') !== -1, '"succeeds as ESRI Shapefile" has been printed to stderr');
    });

});