/**
 * @author chrisl / Geodan
 *
 */
"use strict"

let measuredPositions = [];
const averagingNum = 20;
let firstPosition = true;

geolocation.on('change:position', function() {
    let coordinates = geolocation.getPosition();

    if (mode === "auto") {
        measuredPositions.push(coordinates);

        let numMeasurements = measuredPositions.length;
        if (numMeasurements > averagingNum) {
            measuredPositions.shift();
            numMeasurements = averagingNum;
        } else {
            $("#measurements").css("visibility", "visible");
            $("#measurements").text("Locatie metingen: " + numMeasurements + "/20");
            $("#refreshMeasurements").prop("disabled", false);
            $("#refreshMeasurements").css("visibility", "visible");
        }

        let sumLatitude = 0;
        let sumLongitude = 0;
        measuredPositions.forEach(coord => {
            sumLatitude += coord[1];
            sumLongitude += coord[0];
        });
        const meanLatitude = sumLatitude / numMeasurements;
        const meanLongitude = sumLongitude / numMeasurements;

        const wgs84Loc = ol.proj.transform([meanLongitude, meanLatitude], 'EPSG:3857', 'EPSG:4326');

        currentPosition.latitude = wgs84Loc[1];
        currentPosition.longitude = wgs84Loc[0];
        updatePosition(currentPosition, currentHeight);

        coordinates = [meanLongitude, meanLatitude];
    }

    positionFeature.setGeometry(coordinates ?
        new ol.geom.Point(coordinates) : null);

    if (firstPosition) {
        if (setMapView()) {
            $("#accuracy").text('Geschatte accuraatheid: ' + geolocation.getAccuracy().toFixed(2) + ' [m]');
            firstPosition = false;
        }
    } else {
        const viewExtent = map.getView().calculateExtent(map.getSize());
        const featureExtent = positionFeature.getGeometry().getExtent();
        const inView = ol.extent.containsExtent(viewExtent, featureExtent);
        if (!inView) {
            $("#centerView").css("visibility", "visible");
            $("#centerView").prop("disabled", false);

        }
    }
});

geolocation.on('change:accuracy', function() {
    if (mode === "manual" && !firstPosition) {
        $("#accuracy").text('Geschatte accuraatheid: ' + geolocation.getAccuracy().toFixed(2) + ' [m]');
    }
});

geolocation.on('change:accuracyGeometry', function() {
    if (mode === "manual") {
        const accuracyGeometry = geolocation.getAccuracyGeometry();
        accuracyFeature.setGeometry(accuracyGeometry);
    }
});
