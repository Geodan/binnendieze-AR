/**
 * @author chrisl / Geodan
 *
 */

let currentPosition = {
    latitude: 0,
    longitude: 0
}
let currentHeight = 3.5;

const geolocation = new ol.Geolocation({
    tracking: true,
    trackingOptions: {enableHighAccuracy: true},
    projection: view.getProjection()
});

geolocation.on("error", function(error) {
    alert(error.message);
});
