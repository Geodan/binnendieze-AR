"use strict"
document.title = "Binnedieze 3D viewer";

let mode;

$("#manualLoc").on("click", function() {
    mode = "manual";

    $("#welcomeContainer").css("z-index", 1)
    $("#mapContainer").css("z-index", 3);

    $("#manualLoc").prop("disabled", true);
    $("#autoLoc").prop("disabled", true);

    setTimeout(toggleMap(), 100);
});

$("#autoLoc").on("click", function() {
    mode = "auto";

    $("#welcomeContainer").css("z-index", 1)
    $("#potree_container").css("z-index", 3)

    enablePotree();

    $("#manualLoc").prop("disabled", true);
    $("#autoLoc").prop("disabled", true);

    $("#accuracy").css("visibility", "hidden");
    $("#mapInstuctions").css("visibility", "hidden");
    map.removeInteraction(draw);
})
