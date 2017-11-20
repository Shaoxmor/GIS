var blur = document.getElementById('blur');
var radius = document.getElementById('radius');
var flagWangge = false;           //控制网格图层信息


// 创建一个视图
var view = new ol.View({
  // 设置成都为地图中心，此处进行坐标转换， 把EPSG:4326的坐标，转换为EPSG:3857坐标，因为ol默认使用的是EPSG:3857坐标
  center: ol.proj.transform([104.06, 30.67], 'EPSG:4326', 'EPSG:3857'),
  zoom: 4,
  //extent:[102, 29, 104, 31]
})


//定义Google电子source
var dianzisource = new ol.source.TileWMS({
  url: '/gis',
  params: {
    'LAYERS': 'HP0823RS:google-dianzi',//此处可以是单个图层名称，也可以是图层组名称，或多个图层名称
    'TILED': false
  },
  serverType: 'geoserver',    //服务器类型
})
//定义Google电子地图层
var googledianzi = new ol.layer.Tile({
    visible:true,  //是否可见，默认为true
    crossOrigin:'anonymous',
    source: dianzisource,
  })



//定义google卫星source
var weixingsource = new ol.source.TileWMS({
  url: '/gis',
  params: {
    'LAYERS': 'HP0823RS:google-weixing',//此处可以是单个图层名称，也可以是图层组名称，或多个图层名称
    'TILED': false
  },
  serverType: 'geoserver'   //服务器类型
})
//定义google卫星地图层
var googleweixing = new ol.layer.Tile({
    source: weixingsource,
  })


//定义遥感信息图层
var MULTI_RS_WGS84_0824 = new ol.layer.Tile({
    source: new ol.source.TileWMS({
      url: '/gis',
      params: {
        'LAYERS': 'HP0823RS:MULTI_RS_WGS84_0824',//此处可以是单个图层名称，也可以是图层组名称，或多个图层名称
        'TILED': false
      },
      serverType: 'geoserver'   //服务器类型
    })
  })


// 创建第一个地图
var map11 = new ol.Map({
  layers: [
    googledianzi
  ],
  target: 'map1',
  view: view,
  // 在默认控件的基础上，再加上其他内置的控件
  controls: ol.control.defaults().extend([
    new ol.control.FullScreen(),  //全屏控件
    //new ol.control.MousePosition(),   //鼠标位置控件
    //new ol.control.OverviewMap(),   //鹰眼控件
    new ol.control.ZoomSlider(),  //滚动条缩放控件
    new ol.control.ZoomToExtent()   //缩放到范围控件
  ])
})

// 创建第二个地图
var map22 = new ol.Map({
  layers: map11.getLayers(),
  target: 'map2',
  view: view,
  controls: ol.control.defaults({
    attributionOptions: {
      collapsible: false
    }
  })
})

// 创建第三个地图
var map33 = new ol.Map({
  layers: [googleweixing],
  target: 'map3',
  view: view,
  controls: ol.control.defaults({
    attributionOptions: {
      collapsible: false
    }
  })
})


//定义地图全局变量
var proj = 'EPSG:4326';   //定义wgs84地图坐标系
var proj_m = 'EPSG:3857';   //定义墨卡托地图坐标系
var mapLayer, mapLayerlabel;  //定义图层对象
var source_measure, vector_measure;  //定义全局测量控件源和层
var popup;  //定义全局变量popup
var source_zx, vector_zx;    //定义全局折线对象源和层
var l;  //定义一根全局折线
var source_bezier, vector_bezier;    //定义全局贝塞尔曲线对象源和层
var source_arrow, vector_arrow;    //定义全局箭头线对象源和层
var source_polygon, vector_polygon;    //定义全局多边形对象源和层
var source_circle, vector_circle;    //定义全局多边形对象源和层
var source_region, vector_region;    //定义全局多边形对象源和层
var source_draw, vector_draw;    //定义全局鼠标绘制对象源和层
var mapDragInteraction;       //定义拖动交互功能
var tiled , untiled;             //定义遥感影像变量

//加载多边形面标注层
source_polygon = new ol.source.Vector();
vector_polygon = new ol.layer.Vector({
  source: source_polygon
});
map11.addLayer(vector_polygon);

//加载画圆标注层
source_circle = new ol.source.Vector();
vector_circle = new ol.layer.Vector({
  source: source_circle
});
map11.addLayer(vector_circle);

//加载多边形面图层
source_region = new ol.source.Vector();
vector_region = new ol.layer.Vector({
  source: source_region
});
map11.addLayer(vector_region);

//加载鼠标绘制标注图层
source_draw = new ol.source.Vector();
vector_draw = new ol.layer.Vector({
  source: source_draw
});
map11.addLayer(vector_draw);

//加载测量距离、测量面积汇至图层
source_measure = new ol.source.Vector();
vector_measure = new ol.layer.Vector({
  source: source_measure
});
map11.addLayer(vector_measure);

//用鼠标绘制各种图形
var drawonmap // global so we can remove it later
function addDrawOnMap (type) {   //The geometry type. One of 'Point', 'LineString', 'LinearRing', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection', 'Circle'.
  if (drawonmap) {
    map11.removeInteraction(drawonmap)
  }
  if (type !== 'None') {
    var geometryFunction, maxPoints
    if (type === 'Square') {
      type = 'Circle'
      geometryFunction = ol.interaction.Draw.createRegularPolygon(4)
    } else if (type === 'Box') {
      type = 'LineString'
      maxPoints = 2
      geometryFunction = function (coordinates, geometry) {
        if (!geometry) {
          geometry = new ol.geom.Polygon(null)
        }
        var start = coordinates[0]
        var end = coordinates[1]
        geometry.setCoordinates([
          [start, [start[0], end[1]], end, [end[0], start[1]], start]
        ])
        return geometry
      }
    }

    var style = createPolygonStyle('#808080', 2, 'rgba(200, 0, 255, 0.1)')
    drawonmap = new ol.interaction.Draw({
      source: source_draw,
      style: style,
      type: /** @type {ol.geom.GeometryType} */ (type),
      geometryFunction: geometryFunction,
      maxPoints: maxPoints
    })
    map11.addInteraction(drawonmap)
  }
}

function clearDrawOnMap () {
  source_draw.clear()
  addDrawOnMap('None')
}

//载入遥感信息
function loadRs () {
  map11.addLayer(MULTI_RS_WGS84_0824)    //添加新图层
}

//移除遥感信息
function removeRs () {
  map11.removeLayer(MULTI_RS_WGS84_0824)   // 移除遥感信息的图层
}

var tmpWeiXingMap = Object.assign(googleweixing.getSource())
var tmpDianZiMap = Object.assign(googledianzi.getSource())
//切换为Google卫星地图
function googleWeixing () {
  map11.getLayers().item(0).setSource(tmpWeiXingMap)  //切换位Google卫星地图的source
}
//切换为Google电子地图
function googleDianzi () {
  map11.getLayers().item(0).setSource(tmpDianZiMap)  //切换为Google电子地图的source
}



//定义网格信息图层
var osmSource = new ol.source.OSM();   //实例化图层数据源对象,ol.source.OSM使用的是Open Street Map提供的在线地图数据
var wangge= new ol.layer.Tile({
    source: new ol.source.TileDebug({
      projection: 'EPSG:3857',             //地图投影坐标系
      tileGrid: osmSource.getTileGrid()     //获取瓦片图层数据对象（osmSource）的网格信息
    })
  })

function addWangge () {
  if(flagWangge === false){
    map11.addLayer(wangge)    //添加网格图层
    flagWangge = true
  }else {
    map11.removeLayer(wangge)   //移除
    flagWangge = false
  }
}

//添加实时位置控件
var weizhiflag = false
var mousePosition;
function addWeizhi(){
  if(weizhiflag === false){
    mousePosition = new ol.control.MousePosition()
    map11.addControl(mousePosition)
    weizhiflag = true
  }else{
    map11.removeControl(mousePosition)
    weizhiflag = false
  }
}


//添加鹰眼控件
var yingyanflag = false
var yingyan;
function addYingyan(){
  if(yingyanflag === false){
    yingyan = new ol.control.OverviewMap()
    map11.addControl(yingyan)
    yingyanflag = true
  }else{
    map11.removeControl(yingyan)
    yingyanflag = false
  }
}

//测量距离、面积
var measureLine = false
var measureArea = false
var measureRect = false
var measureCircle = false
function drawRect(){
  addDrawOnMap("Box");
  drawonmap.on('drawend', function (evt) {
    var extent = evt.feature.getGeometry().getExtent()    //得到选中的区域
    var leftdownPoint = ol.proj.transform([extent[0], extent[1]], proj_m, proj)
    var rightupPoint = ol.proj.transform([extent[2], extent[3]], proj_m, proj)
    alert("左下坐标：" + leftdownPoint + "\n" + "右上坐标：" + rightupPoint)
  })
}
function drawCircle () {
  addDrawOnMap("Circle");
  drawonmap.on('drawend', function (evt) {
    var center = ol.proj.transform(evt.feature.getGeometry().getCenter(), proj_m, proj);
    var radius = evt.feature.getGeometry().getRadius();
    alert("圆心坐标：" + center + "\n" + "半径：" + radius);
  })
}
function startControl(control, self) {
  removeMeasure(source_measure);
  if ("line" === control && measureLine === false) {
    $('#self').bind('click',addMeasure(control, source_measure))
    measureLine = true
  }else{
    $('#self').unbind('click')
    measureLine = false
  }
  if("area" === control && measureArea === false){
    $('#self').bind('click',addMeasure(control, source_measure))
    measureArea = true
  }else{
    $('#self').unbind('click')
    measureArea = false
  }
  if ("rectSelect" === control && measureRect === false) {         //矩形选择，有弹出
    $('#self').bind('click',drawRect())
    measureRect = true
  }else{
    $('#self').unbind('click')
    measureRect = false
  }
  if ("circleSelect" === control && measureCircle === false) {     //圆形选择，有弹出
    $('#self').bind('click',drawCircle())
    measureArea = true
  }else{
    $('#self').unbind('click')
    measureRect = false
  }
}

//下载
document.getElementById('download-png').addEventListener('click', function() {
  map11.once('postcompose', function(event) {
    var canvas = event.context.canvas;
    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(canvas.msToBlob(), 'map11.png');
    } else {
      canvas.toBlob(function(blob) {
        saveAs(blob, 'map11.png');
      });
    }
  });
  map11.renderSync();
});



//点击弹出当前坐标
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');

//Add a click handler to hide the popup.
closer.onclick = function() {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};
//Create an overlay to anchor the popup to the map.
var overlay = new ol.Overlay(({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250   //当Popup超出地图边界时，为了Popup全部可见，地图移动的速度. 单位为毫秒（ms）
  }
}));
var key =function(evt) {
    var coordinate = evt.coordinate;
    var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(
      coordinate, 'EPSG:3857', 'EPSG:4326'));
    content.innerHTML = '<p>你点击的坐标是：</p><code>' + hdms + '</code>';
    overlay.setPosition(coordinate);
    map11.addOverlay(overlay);
  };
var flagtanchu = false
function tanchu(){
  if(flagtanchu === false){
    map11.on('click',key)
    flagtanchu = true
  }else{
    map11.un('click',key)   //取消事件监听
    flagtanchu = false
  }
}


// 是否可拖动
var canMove = 0;
function moveOrNot () {
  var pan;
  map11.getInteractions().forEach(function(element,index,array){
    if(element instanceof ol.interaction.DragPan) {
      pan = element;
      if(canMove) {
        pan.setActive(true);
        canMove = 0;
      } else {
        pan.setActive(false);
        canMove = 1;
      }
    }
  });
}

//跳转，移到某个地方
function moveToChengdu() {
  var view = map11.getView();
  view.setCenter(ol.proj.transform([104.06, 30.67], 'EPSG:4326', 'EPSG:3857'));
  map11.render();
}
function moveToWuhan(){
  var view = map11.getView();
  view.setCenter(ol.proj.transform([114.21, 30.37], 'EPSG:4326', 'EPSG:3857'));
  map11.render();
}
function moveToBeijing() {
  var view = map11.getView();
  view.setCenter(ol.proj.transform([116.28, 39.54], 'EPSG:4326', 'EPSG:3857'));
  map11.render();
}


//添加标注图层
var popuplayer = new ol.layer.Vector({
  source: new ol.source.Vector()
})
map11.addLayer(popuplayer)

//添加船舶标注
var chuanboStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '10px sans-serif',    //默认这个字体，可以修改成其他的，格式和css的字体设置一样
    text: '船舶',
    fill: new ol.style.Fill({
      color: 'blue'
    })
  }),
  image: new ol.style.Icon({
    src: 'images/船舶.png',
    scale:0.2,
    anchor: [0.5, 1.1]    // 设置图标位置
  })
})

var allId = 0;
var biaoji = [];
function addChuanbo () {
  map11.once('singleclick',function(event){
    //console.log(event.target.focus_);
    var chuanbo = new ol.Feature({                      //初始化feature及其坐标
      geometry: new ol.geom.Point(event.target.focus_)
    });
// 设置feature的文字、图片style
    chuanbo.setStyle(chuanboStyle);
    chuanbo.setId(allId);
    biaoji.push({
      id: allId,
      icon: chuanbo
    })
    allId++;
    popuplayer.getSource().addFeature(chuanbo);
    //console.log(chuanbo.getId())
  })
}

//添加港口标注
var gangkouStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '10px sans-serif',    //默认这个字体，可以修改成其他的，格式和css的字体设置一样
    text: '港口',
    fill: new ol.style.Fill({
      color: 'gray'
    })
  }),
  image: new ol.style.Icon({
    src: 'images/港口.png',
    scale:0.2,
    anchor: [0.5, 1.1]    // 设置图标位置
  })
})
function addGangkou () {
  map11.once('singleclick',function(event){
    //console.log(event.target.focus_);
    var gangkou = new ol.Feature({                      //初始化feature及其坐标
      geometry: new ol.geom.Point(event.target.focus_)
    });
// 设置feature的文字、图片style
    gangkou.setStyle(gangkouStyle);
    gangkou.setId(allId)
    biaoji.push({
      id: allId,
      icon: gangkou
    })
    allId++;
    popuplayer.getSource().addFeature(gangkou);
    //console.log(gangkou.getId())
  })
}
//添加机场标注
var jichangStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '10px sans-serif',    //默认这个字体，可以修改成其他的，格式和css的字体设置一样
    text: '机场',
    fill: new ol.style.Fill({
      color: '#255e90'
    })
  }),
  image: new ol.style.Icon({
    src: 'images/机场.png',
    scale:0.2,
    anchor: [0.5, 1.1]    // 设置图标位置
  })
})
function addJichang () {
  map11.once('singleclick',function(event){
    //console.log(event.target.focus_);
    var jichang = new ol.Feature({                      //初始化feature及其坐标
      geometry: new ol.geom.Point(event.target.focus_)
    });
// 设置feature的文字、图片style
    jichang.setStyle(jichangStyle);
    jichang.setId(allId)
    biaoji.push({
      id: allId,
      icon: jichang
    })
    allId++;
    popuplayer.getSource().addFeature(jichang);
  })
}
//添加仓库
var cangkuStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '10px sans-serif',    //默认这个字体，可以修改成其他的，格式和css的字体设置一样
    text: '仓库',
    fill: new ol.style.Fill({
      color: '#f65714'
    })
  }),
  image: new ol.style.Icon({
    src: 'images/仓库.png',
    scale:0.2,
    anchor: [0.5, 1.1]    // 设置图标位置
  })
})
function addCangku () {
  map11.once('singleclick',function(event){
    //console.log(event.target.focus_);
    var cangku = new ol.Feature({                      //初始化feature及其坐标
      geometry: new ol.geom.Point(event.target.focus_)
    });
// 设置feature的文字、图片style
    cangku.setStyle(cangkuStyle);
    cangku.setId(allId)
    biaoji.push({
      id: allId,
      icon: cangku
    })
    allId++;
    popuplayer.getSource().addFeature(cangku);
  })
}

//添加军舰
var junjianStyle = new ol.style.Style({
text: new ol.style.Text({
  font: '10px sans-serif',    //默认这个字体，可以修改成其他的，格式和css的字体设置一样
  text: '军用船舶',
  fill: new ol.style.Fill({
    color: '#0b3615'
  })
}),
  image: new ol.style.Icon({
  src: 'images/军舰.png',
  scale:0.2,
  anchor: [0.5, 1.1]    // 设置图标位置
})
})
function addJunjian () {
  map11.once('singleclick',function(event){
    //console.log(event.target.focus_);
    var junjian = new ol.Feature({                      //初始化feature及其坐标
      geometry: new ol.geom.Point(event.target.focus_)
    });
// 设置feature的文字、图片style
    junjian.setStyle(junjianStyle);
    junjian.setId(allId)
    biaoji.push({
      id: allId,
      icon: junjian
    })
    allId++;
    popuplayer.getSource().addFeature(junjian);
  })
}

//添加商船
var shangchuanStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '10px sans-serif',    //默认这个字体，可以修改成其他的，格式和css的字体设置一样
    text: '商用船舶',
    fill: new ol.style.Fill({
      color: '#5b3c26'
    })
  }),
  image: new ol.style.Icon({
    src: 'images/商船.png',
    scale:0.2,
    anchor: [0.5, 1.1]    // 设置图标位置
  })
})
function addShangchuan () {
  map11.once('singleclick',function(event){
    //console.log(event.target.focus_);
    var Shangchuan = new ol.Feature({                      //初始化feature及其坐标
      geometry: new ol.geom.Point(event.target.focus_)
    });
// 设置feature的文字、图片style
    Shangchuan.setStyle(shangchuanStyle);
    Shangchuan.setId(allId)
    biaoji.push({
      id: allId,
      icon: Shangchuan
    })
    allId++;
    popuplayer.getSource().addFeature(Shangchuan);
  })
}


//添加民用船舶
var minchuanStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '10px sans-serif',    //默认这个字体，可以修改成其他的，格式和css的字体设置一样
    text: '民用船舶',
    fill: new ol.style.Fill({
      color: '#d81e06'
    })
  }),
  image: new ol.style.Icon({
    src: 'images/民船.png',
    scale:0.2,
    anchor: [0.5, 1.1]    // 设置图标位置
  })
})
function addMinchuan () {
  map11.once('singleclick',function(event){
    //console.log(event.target.focus_);
    var minchuan = new ol.Feature({                      //初始化feature及其坐标
      geometry: new ol.geom.Point(event.target.focus_)
    });
// 设置feature的文字、图片style
    minchuan.setStyle(minchuanStyle);
    minchuan.setId(allId)
    biaoji.push({
      id: allId,
      icon: minchuan
    })
    allId++;
    popuplayer.getSource().addFeature(minchuan);
  })
}

//添加执法船舶
var zhichuanStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '10px sans-serif',    //默认这个字体，可以修改成其他的，格式和css的字体设置一样
    text: '执法船舶',
    fill: new ol.style.Fill({
      color: '#0061b2'
    })
  }),
  image: new ol.style.Icon({
    src: 'images/执船.png',
    scale:0.2,
    anchor: [0.5, 1.1]    // 设置图标位置
  })
})
function addZhichuan () {
  map11.once('singleclick',function(event){
    //console.log(event.target.focus_);
    var zhichuan = new ol.Feature({                      //初始化feature及其坐标
      geometry: new ol.geom.Point(event.target.focus_)
    });
// 设置feature的文字、图片style
    zhichuan.setStyle(zhichuanStyle);
    zhichuan.setId(allId)
    biaoji.push({
      id: allId,
      icon: zhichuan
    })
    allId++;
    popuplayer.getSource().addFeature(zhichuan);
  })
}

//添加海上漂浮物
var piaofuStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '10px sans-serif',    //默认这个字体，可以修改成其他的，格式和css的字体设置一样
    text: '海上漂浮物',
    fill: new ol.style.Fill({
      color: '#515151'
    })
  }),
  image: new ol.style.Icon({
    src: 'images/漂浮.png',
    scale:0.2,
    anchor: [0.5, 1.1]    // 设置图标位置
  })
})
function addPiaofu () {
  map11.once('singleclick',function(event){
    //console.log(event.target.focus_);
    var piaofu = new ol.Feature({                      //初始化feature及其坐标
      geometry: new ol.geom.Point(event.target.focus_)
    });
// 设置feature的文字、图片style
    piaofu.setStyle(piaofuStyle);
    piaofu.setId(allId)
    biaoji.push({
      id: allId,
      icon: piaofu
    })
    allId++;
    popuplayer.getSource().addFeature(piaofu);
  })
}

//添加其他兴趣点
var qitaStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '10px sans-serif',    //默认这个字体，可以修改成其他的，格式和css的字体设置一样
    text: '其他兴趣点',
    fill: new ol.style.Fill({
      color: '#ec2b12'
    })
  }),
  image: new ol.style.Icon({
    src: 'images/其他.png',
    scale:0.2,
    anchor: [0.5, 1.1]    // 设置图标位置
  })
})
function addQita () {
  map11.once('singleclick',function(event){
    //console.log(event.target.focus_);
    var qita = new ol.Feature({                      //初始化feature及其坐标
      geometry: new ol.geom.Point(event.target.focus_)
    });
// 设置feature的文字、图片style
    qita.setStyle(qitaStyle);
    qita.setId(allId)
    biaoji.push({
      id: allId,
      icon: qita
    })
    allId++;
    popuplayer.getSource().addFeature(qita);
  })
}

//添加地面建筑
var jianzhuStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '10px sans-serif',    //默认这个字体，可以修改成其他的，格式和css的字体设置一样
    text: '地面建筑',
    fill: new ol.style.Fill({
      color: '#d6204b'
    })
  }),
  image: new ol.style.Icon({
    src: 'images/建筑.png',
    scale:0.2,
    anchor: [0.5, 1.2]    // 设置图标位置
  })
})
function addJianzhu () {
  map11.once('singleclick',function(event){
    //console.log(event.target.focus_);
    var jianzhu = new ol.Feature({                      //初始化feature及其坐标
      geometry: new ol.geom.Point(event.target.focus_)
    });
// 设置feature的文字、图片style
    jianzhu.setStyle(jianzhuStyle);
    jianzhu.setId(allId)
    biaoji.push({
      id: allId,
      icon: jianzhu
    })
    allId++;
    popuplayer.getSource().addFeature(jianzhu);
  })
}


//添加补给站
var bujiStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '10px sans-serif',    //默认这个字体，可以修改成其他的，格式和css的字体设置一样
    text: '补给站',
    fill: new ol.style.Fill({
      color: '#112079'
    })
  }),
  image: new ol.style.Icon({
    src: 'images/补给.png',
    scale:0.35,
    anchor: [0.5, 0.9]    // 设置图标位置
  })
})
function addBuji () {
  map11.once('singleclick',function(event){
    //console.log(event.target.focus_);
    var buji = new ol.Feature({                      //初始化feature及其坐标
      geometry: new ol.geom.Point(event.target.focus_)
    });
// 设置feature的文字、图片style
    buji.setStyle(bujiStyle);
    buji.setId(allId)
    biaoji.push({
      id: allId,
      icon: buji
    })
    allId++;
    popuplayer.getSource().addFeature(buji);
  })
}

//添加停泊区
var tingboStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '10px sans-serif',    //默认这个字体，可以修改成其他的，格式和css的字体设置一样
    text: '停泊区',
    fill: new ol.style.Fill({
      color: '#ea9518'
    })
  }),
  image: new ol.style.Icon({
    src: 'images/停泊.png',
    scale:0.2,
    anchor: [0.5, 1.2]    // 设置图标位置
  })
})
function addTingbo () {
  map11.once('singleclick',function(event){
    //console.log(event.target.focus_);
    var tingbo = new ol.Feature({                      //初始化feature及其坐标
      geometry: new ol.geom.Point(event.target.focus_)
    });
// 设置feature的文字、图片style
    tingbo.setStyle(tingboStyle);
    tingbo.setId(allId)
    biaoji.push({
      id: allId,
      icon: tingbo
    })
    allId++;
    popuplayer.getSource().addFeature(tingbo);
  })
}

//添加管理局
var guanliStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '10px sans-serif',    //默认这个字体，可以修改成其他的，格式和css的字体设置一样
    text: '管理局',
    fill: new ol.style.Fill({
      color: 'black'
    })
  }),
  image: new ol.style.Icon({
    src: 'images/管理.png',
    scale:0.2,
    anchor: [0.5, 1.2]    // 设置图标位置
  })
})
function addGuanli () {
  map11.once('singleclick',function(event){
    //console.log(event.target.focus_);
    var guanli = new ol.Feature({                      //初始化feature及其坐标
      geometry: new ol.geom.Point(event.target.focus_)
    });
// 设置feature的文字、图片style
    guanli.setStyle(guanliStyle);
    guanli.setId(allId)
    biaoji.push({
      id: allId,
      icon: guanli
    })
    allId++;
    popuplayer.getSource().addFeature(guanli);
  })
}



$('#tankuang').hide('normal');
map11.on('click', function (event) {
  var feature = map11.forEachFeatureAtPixel(event.pixel, function(feature){
    return feature;
  });
  //console.log(feature)
  //console.log((feature) && (typeof feature.getId() !== 'undefined'))
  if((feature) && (typeof feature.getId() !== 'undefined')) {
    //console.log(event.originalEvent);
    $("#tankuang").css({"top": event.originalEvent.clientY, "left": event.originalEvent.clientX}).show('normal');
    $("#tankuang-id").text('ID:' + feature.getId())   //返回弹簧内容中的ID
    var msg = biaoji.filter(function (item) {
      return item.id.toString() === feature.getId().toString();
    })[0].msg || '';
    console.log(msg);
    $('#tankuangmsg').val(msg);        //val返回里面的值
    //alert(feature.getId());
  }
})

//关闭弹框
function closeTanKuang () {
  $("#tankuang").hide('normal');
}



//删除标注
function deleteBiaozhu(){
  $("#tankuang").hide('normal');
  var id = $("#tankuang-id").text().slice(3);
  console.log(id);
  var feature = biaoji.filter(function (item) {
    return item.id.toString() === id.toString();
  })[0].icon
  console.log((feature));
  popuplayer.getSource().removeFeature(feature);
  //console.log(feature, biaoji);
  //console.log(popuplayer.getSource().removeFeature(feature.chuanbo));
}

$('#tankuangmsg').attr("disabled", true);    //禁用input

function writeOrNot () {
  console.log(typeof $("#tankuangmsg")[0].getAttribute('disabled'));
  if($("#tankuangmsg").attr('disabled')) {
    $('#tankuangmsg').attr("disabled", false);
    $('#writeOrNot').text('完成')
  } else {
    $('#tankuangmsg').attr('disabled', true);
    $('#writeOrNot').text('编辑');
    var id = $('#tankuang-id').text().slice(3);
    biaoji.forEach(function (item) {
      if(item.id.toString() === id.toString()) {
        console.log('ok');
        item.msg = $('#tankuangmsg').val();
      }
    })
  }
}
var buketuodong = true;
$('#buketuodong').on('click', function (e) {
 if(buketuodong){
   $('#buketuodong').css('background', "#ccc");
   buketuodong = false
 }else{
   $('#buketuodong').css('background', "white");
   buketuodong = true
 }
})

var shishiweizhi = true;
$('#shishiweizhi').on('click', function (e) {
  if(shishiweizhi){
    $('#shishiweizhi').css('background', "#ccc");
    shishiweizhi = false
  }else{
    $('#shishiweizhi').css('background', "white");
    shishiweizhi = true
  }
})

var wanggexinxi = false;
$('#wanggexinxi').on('click', function () {
  if(wanggexinxi === false){
    $('#wanggexinxi').css('background', "#ccc");
    wanggexinxi = true
  }else{
    $('#wanggexinxi').css('background', "white");
    wanggexinxi = false
  }
})

var tanchuwenzhi = false;
$('#tanchuwenzhi').on('click', function () {
  if(tanchuwenzhi === false){
    $('#tanchuwenzhi').css('background', "#ccc");
    tanchuwenzhi = true
  }else{
    $('#tanchuwenzhi').css('background', "white");
    tanchuwenzhi = false
  }
})



//地图锐化
var kernels = {
  none: [
    0, 0, 0,
    0, 1, 0,
    0, 0, 0
  ],
  sharpen: [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ],
  sharpenless: [
    0, -1, 0,
    -1, 10, -1,
    0, -1, 0
  ],
  blur: [
    1, 1, 1,
    1, 1, 1,
    1, 1, 1
  ],
  shadow: [
    1, 2, 1,
    0, 1, 0,
    -1, -2, -1
  ],
  emboss: [
    -2, 1, 0,
    -1, 1, 1,
    0, 1, 2
  ],
  edge: [
    0, 1, 0,
    1, -4, 1,
    0, 1, 0
  ]
};

function normalize(kernel) {
  var len = kernel.length;
  var normal = new Array(len);
  var i, sum = 0;
  for (i = 0; i < len; ++i) {
    sum += kernel[i];
  }
  if (sum <= 0) {
    normal.normalized = false;
    sum = 1;
  } else {
    normal.normalized = true;
  }
  for (i = 0; i < len; ++i) {
    normal[i] = kernel[i] / sum;
  }
  return normal;
}

var selectedKernel = normalize(kernels['none']);


function sharpenEdge(degree){
  selectedKernel = normalize(kernels[degree]);
  map11.render();
  map22.render();
  map33.render();
}

map11.on('postcompose', function(event) {
  convolve(event.context, selectedKernel);
});
map22.on('postcompose', function(event) {
  convolve(event.context, selectedKernel);
});
map33.on('postcompose', function(event) {
  convolve(event.context, selectedKernel);
});


function convolve(context, kernel) {
  var canvas = context.canvas;
  var width = canvas.width;
  var height = canvas.height;

  var size = Math.sqrt(kernel.length);
  var half = Math.floor(size / 2);

  var inputData = context.getImageData(0, 0, width, height).data;

  var output = context.createImageData(width, height);
  var outputData = output.data;

  for (var pixelY = 0; pixelY < height; ++pixelY) {
    var pixelsAbove = pixelY * width;
    for (var pixelX = 0; pixelX < width; ++pixelX) {
      var r = 0, g = 0, b = 0, a = 0;
      for (var kernelY = 0; kernelY < size; ++kernelY) {
        for (var kernelX = 0; kernelX < size; ++kernelX) {
          var weight = kernel[kernelY * size + kernelX];
          var neighborY = Math.min(
            height - 1, Math.max(0, pixelY + kernelY - half));
          var neighborX = Math.min(
            width - 1, Math.max(0, pixelX + kernelX - half));
          var inputIndex = (neighborY * width + neighborX) * 4;
          r += inputData[inputIndex] * weight;
          g += inputData[inputIndex + 1] * weight;
          b += inputData[inputIndex + 2] * weight;
          a += inputData[inputIndex + 3] * weight;
        }
      }
      var outputIndex = (pixelsAbove + pixelX) * 4;
      outputData[outputIndex] = r;
      outputData[outputIndex + 1] = g;
      outputData[outputIndex + 2] = b;
      outputData[outputIndex + 3] = kernel.normalized ? a : 255;
    }
  }
  context.putImageData(output, 0, 0);
}



//重置关闭
function reset(){
  source_draw.clear()
  addDrawOnMap('None')
  map11.getLayers().item(0).setSource(tmpDianZiMap)  //切换为Google电子地图的source
  var view = map11.getView();
  view.setCenter(ol.proj.transform([116.28, 39.54], 'EPSG:4326', 'EPSG:3857'));
  view.setZoom(4);
  map11.render();
  if(MULTI_RS_WGS84_0824){
    map11.removeLayer(MULTI_RS_WGS84_0824)   // 移除遥感信息的图层
  }
  if(flagWangge === true){
    map11.removeLayer(wangge)   //移除网格
    flagWangge = false
    $('#wanggexinxi').css('background', "white");
  }
  sharpenEdge('none')
  removeMeasure(source_measure);
  map11.un('click',key)   //取消事件监听
  flagtanchu = false
  $('#tanchuwenzhi').css('background', "white");
  tanchuwenzhi = false
}

