/**
 * @author chrisl / Geodan
 *
 */

let measuredPositions = [];
const averagingNum = 20;

geolocation.on('change:position', function() {
    const coordinates = geolocation.getPosition();
    if (view.getZoom() === autoZoom) {
        view.setCenter(coordinates);
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
    };
});

$("#centerView").on("click", function() {
    view.setCenter(geolocation.getPosition());
    view.fit(geolocation.getAccuracyGeometry(), map.getSize());
    autoZoom = view.getZoom();
});
