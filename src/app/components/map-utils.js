"use strict"

function toggleMap(coordinates, zoom) {
    map.updateSize();
    let accuracyGeometry;
    if (typeof coordinates === "undefined") {
        coordinates = geolocation.getPosition();
        accuracyGeometry = geolocation.getAccuracyGeometry();
    }

    if (typeof coordinates !== "undefined") {
        positionFeature.setGeometry(coordinates ?
            new ol.geom.Point(coordinates) : null);
        view.setCenter(coordinates);
    }
    if (typeof accuracyGeometry !== "undefined" && accuracyGeometry !== null) {
        accuracyFeature.setGeometry(accuracyGeometry);
        view.fit(accuracyGeometry, map.getSize());
        $("#accuracy").text('Geschatte accuraatheid: ' + geolocation.getAccuracy().toFixed(2) + ' [m]');
    }

    if (typeof zoom !== "undefined") {
        view.setZoom(zoom);
    }
}

function setMapView(){
    if (mode === "manual") {
        const accuracyGeometry = geolocation.getAccuracyGeometry();
        if (typeof accuracyGeometry !== "undefined" && accuracyGeometry !== null) {
            view.fit(accuracyGeometry, map.getSize());
            return true;
        } else {
            return false;
        }
    } else if (mode === "auto") {
        view.setCenter(positionFeature.getGeometry().getCoordinates());
        return true;
    }
}