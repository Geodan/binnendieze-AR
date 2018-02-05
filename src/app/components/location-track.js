/**
 * @author chrisl / Geodan
 *
 */

let measuredPositions = [];
const averagingNum = 20;

geolocation.on('change:position', function() {
    if (typeof mode !== "undefined") {
        const currentZoom = view.getZoom();
        const currentCenter = view.getCenter();
        const coordinates = geolocation.getPosition();

        if (currentZoom === autoZoom &&
                currentCenter[0].toFixed(0) === autoLoc[0].toFixed(0) &&
                currentCenter[1].toFixed(0)  === autoLoc[1].toFixed(0)) {

            view.fit(geolocation.getAccuracyGeometry(), map.getSize());
            autoZoom = currentZoom;
            autoLoc = view.getCenter();
        } else {
            $("#centerView").css("display", "inline");
            $("#centerView").prop("disabled", false);
        }

        positionFeature.setGeometry(coordinates ?
            new ol.geom.Point(coordinates) : null);

        if (mode === "auto") {
            measuredPositions.push(coordinates);

            const numMeasurements = measuredPositions.length;
            if (numMeasurements > averagingNum) {
                measuredPositions.shift();
            } else {
                $("#measurements").css("display", "inline");
                $("#measurements").text("Locatie metingen: " + numMeasurements + "/20");
                $("#refreshMeasurements").prop("disabled", false);
                $("#refreshMeasurements").css("display", "inline");
            }

            let sumLatitude = 0;
            let sumLongitude = 0;
            measuredPositions.forEach(coord => {
                sumLatitude += coord[1];
                sumLongitude += coord[0];
            });
            meanLatitude = sumLatitude / numMeasurements;
            meanLongitude = sumLongitude / numMeasurements;

            const wgs84Loc = ol.proj.transform([meanLongitude, meanLatitude], 'EPSG:3857', 'EPSG:4326');

            currentPosition.latitude = wgs84Loc[1];
            currentPosition.longitude = wgs84Loc[0];
            updatePosition(currentPosition, currentHeight);
        }
    }
});

geolocation.on('change:accuracy', function() {
    if (typeof mode !== "undefined") {
        $("#accuracy").text('Geschatte accuraatheid: ' + geolocation.getAccuracy().toFixed(2) + ' [m]');
    }
});

geolocation.on('change:accuracyGeometry', function() {
    if (typeof mode !== "undefined") {
        const accuracyGeometry = geolocation.getAccuracyGeometry();
        accuracyFeature.setGeometry(accuracyGeometry);

        const currentCenter = view.getCenter();
        if (view.getZoom() === autoZoom &&
                currentCenter[0].toFixed(0) === autoLoc[0].toFixed(0) &&
                currentCenter[1].toFixed(0)  === autoLoc[1].toFixed(0)) {
            view.fit(accuracyGeometry, map.getSize())
            autoZoom = view.getZoom();
            autoLoc = view.getCenter();
        }
    }
});
