var ogr2ogr = require('../')

var target = 'mygeodatabase.gdb targetlayer'

var ogr = ogr2ogr(target)
  .skipfailures()
  .append()
  .update()
  .format('PostgreSQL')
  .destination('PG:"host=localhost user=username dbname=mydb password=abc123" -nln myshema.mylayer')

ogr.exec(function (er, data) {
  console.log(er || data)
})
