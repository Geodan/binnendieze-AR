/**
 * @author chrisl / Geodan
 *
 */
"use strict"

// ol.proj.setProj4(proj4);
// proj4.defs("EPSG:28992","+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.999908 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs");
// proj4.defs("EPSG:4258","+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");

// let currentPosition = {
//     latitude: 0,
//     longitude: 0
// }
let currentPosition = {
    x: 0,
    y: 0
}
let currentHeight;

const geolocation = new ol.Geolocation({
    trackingOptions: {enableHighAccuracy: true},
    projection: view.getProjection()
});

geolocation.on("error", function(error) {
    alert(error.message);
});
