"use strict"
document.title = "Binnedieze 3D viewer";

let mode;

$(function() {
    $("#accordion").accordion({
        collapsible: true,
        active: false,
        icons: false
    });

    if (('ondeviceorientation' in window) && (/Mobi|Tablet|iPad|iPhone/.test(navigator.userAgent))) {
        $("#accordion").accordion("option", {active: 0});
    } else {
        $("#accordion").accordion("option", {active: 1});
    }
});

$("#manualLoc").on("click", function() {
    mode = "manual";
    geolocation.setTracking(true);

    $("#welcomeContainer").css("z-index", 1);
    $("#mapContainer").css("z-index", 3);

    $("#manualLoc").prop("disabled", true);
    $("#autoLoc").prop("disabled", true);
    $("#fpControls").prop("disabled", true);
    $("#earthControls").prop("disabled", true);

    setTimeout(toggleMap(), 100);
});

$("#autoLoc").on("click", function() {
    mode = "auto";
    geolocation.setTracking(true);

    $("#welcomeContainer").css("z-index", 1);
    $("#potree_container").css("z-index", 3);

    enablePotree();

    $("#manualLoc").prop("disabled", true);
    $("#autoLoc").prop("disabled", true);
    $("#fpControls").prop("disabled", true);
    $("#earthControls").prop("disabled", true);

    $("#accuracy").css("visibility", "hidden");
    $("#mapInstuctions").css("visibility", "hidden");
    map.removeInteraction(draw);
});

$("#fpControls").on("click", function() {
    mode = "firstPerson";

    $("#welcomeContainer").css("z-index", 1);
    $("#mapContainer").css("z-index", 3);
    $("#mapInstuctions").text("Start Locatie?");

    $("#manualLoc").prop("disabled", true);
    $("#autoLoc").prop("disabled", true);
    $("#fpControls").prop("disabled", true);
    $("#earthControls").prop("disabled", true);
    $("#heightRange").prop("disabled", true);
    $("#heightContainer").css("visibility", "hidden");
    $("#accuracy").css("visibility", "hidden");

    $("#fixedZContainer").css("visibility", "visible");
    $("#fixedZContainer").prop("disabled", false);

    const startCoords = ol.proj.transform([5.303330, 51.688878], 'EPSG:4326', 'EPSG:3857')
    setTimeout(toggleMap(startCoords, 15), 100);
    positionFeature.setGeometry();
});

$("#earthControls").on("click", function() {
    mode = "earth";

    $("#welcomeContainer").css("z-index", 1);
    $("#potree_container").css("z-index", 3);

    enablePotree();

    $("#manualLoc").prop("disabled", true);
    $("#autoLoc").prop("disabled", true);
    $("#fpControls").prop("disabled", true);
    $("#earthControls").prop("disabled", true);
    $("#heightRange").prop("disabled", true);
    $("#heightContainer").css("visibility", "hidden");
    $("#accuracy").css("visibility", "hidden");
});
