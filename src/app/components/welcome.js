let mode;

$("#manualLoc").on("click", function() {
    mode = "manual";

    $("#welcomeContainer").css("display", "none")
    $("#mapContainer").css("display", "inline");

    $("#manualLoc").prop("disabled", true);
    $("#autoLoc").prop("disabled", true);

    map.updateSize();
    view.fit(accuracyFeature.getGeometry(), map.getSize());
    autoZoom = view.getZoom();
})

$("#autoLoc").on("click", function() {
    mode = "auto";

    $("#potree_container").css("display", "inline");
    $("#welcomeContainer").css("display", "none")

    $("#manualLoc").prop("disabled", true);
    $("#autoLoc").prop("disabled", true);
})