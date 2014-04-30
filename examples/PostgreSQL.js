var ogr2ogr = require('../')


var myfile = ogr2ogr(target_path)
  .project("+proj=longlat +datum=WGS84 +no_defs ", "+proj=lcc +lat_1=39.45 +lat_2=38.3 +lat_0=37.66666666666666 +lon_0=-77 +x_0=399999.9998983998 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs")
        .format('PostgreSQL')
        .options(["-lco", "DROP_TABLE=IF_EXISTS", "-lco", "WRITE_EWKT_GEOM=ON", "-nlt", "MULTIPOLYGON"])
        .skipfailures()
        .stream()
myfile.pipe(fs.createWriteStream(target_path + ".sql"))