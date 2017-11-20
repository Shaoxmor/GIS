/**
 * Created by 萌 on 2017/10/20.
 */
var express = require('express');
var request = require('request');
var app = express();
app.use('/public', express.static('./public'))
app.use('/gis', function(req, res) {
  var url = 'http://localhost:8080/geoserver/HP0823RS/wms' + req.url;
  req.pipe(request(url)).pipe(res);
});
app.listen(3000, function () {
  console.log('server running at 127.0.0.1:3000');
});