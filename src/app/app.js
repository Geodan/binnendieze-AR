"use strict"
document.title = "Binnedieze 3D viewer";

let mode;

$("#manualLoc").on("click", function() {
    mode = "manual";
    geolocation.setTracking(true);

    $("#welcomeContainer").css("z-index", 1);
    $("#mapContainer").css("z-index", 3);

    $("#manualLoc").prop("disabled", true);
    $("#autoLoc").prop("disabled", true);
    $("#startRegular").prop("disabled", true);

    setTimeout(toggleMap(), 100);
});

$("#autoLoc").on("click", function() {
    mode = "auto";
    geolocation.setTracking(true);

    $("#welcomeContainer").css("z-index", 1)
    $("#potree_container").css("z-index", 3)

    enablePotree();

    $("#manualLoc").prop("disabled", true);
    $("#autoLoc").prop("disabled", true);
    $("#startRegular").prop("disabled", true);

    $("#accuracy").css("visibility", "hidden");
    $("#mapInstuctions").css("visibility", "hidden");
    map.removeInteraction(draw);
});

$("#startRegular").on("click", function() {
    mode = "regular";

    $("#welcomeContainer").css("z-index", 1);
    $("#mapContainer").css("z-index", 3);
    $("#mapInstuctions").text("Start Locatie?");

    $("#manualLoc").prop("disabled", true);
    $("#autoLoc").prop("disabled", true);
    $("#startRegular").prop("disabled", true);
    $("#heightRange").prop("disabled", true);
    $("#heightContainer").css("visibility", "hidden");
    $("#accuracy").css("visibility", "hidden");

    const startCoords = ol.proj.transform([5.303330, 51.688878], 'EPSG:4326', 'EPSG:3857')
    setTimeout(toggleMap(startCoords, 14), 100);
    positionFeature.setGeometry();
});