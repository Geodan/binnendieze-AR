document.title = "Binnedieze 3D viewer";

let mode;
function toggleMap() {
    map.updateSize();
    const coordinates = geolocation.getPosition();
    const accuracyGeometry = geolocation.getAccuracyGeometry();
    if (typeof coordinates !== "undefined") {
        positionFeature.setGeometry(coordinates ?
            new ol.geom.Point(coordinates) : null);
        view.setCenter(coordinates);
        autoLoc = view.getCenter();
    }
    if (typeof accuracyGeometry !== "undefined") {
        accuracyFeature.setGeometry(accuracyGeometry);
        view.fit(accuracyGeometry, map.getSize());
        autoZoom = view.getZoom();
        $("#accuracy").text('Geschatte accuraatheid: ' + geolocation.getAccuracy().toFixed(2) + ' [m]');
    }
}

$("#manualLoc").on("click", function() {
    mode = "manual";

    $("#welcomeContainer").css("display", "none")
    $("#mapContainer").css("display", "inline");

    $("#manualLoc").prop("disabled", true);
    $("#autoLoc").prop("disabled", true);

    setTimeout(toggleMap(), 100)
});

$("#autoLoc").on("click", function() {
    mode = "auto";

    $("#potree_container").css("display", "inline");
    $("#welcomeContainer").css("display", "none")

    $("#manualLoc").prop("disabled", true);
    $("#autoLoc").prop("disabled", true);
})
