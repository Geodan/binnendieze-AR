"use strict"

const source = new ol.source.Vector();
const vector = new ol.layer.Vector({
    source: source,
    style: new ol.style.Style({
        image: new ol.style.Circle({
            radius: 6,
            fill: new ol.style.Fill({
                color: '#e74c3c'
            }),
            stroke: new ol.style.Stroke({
                color: '#fff',
                width: 2
            })
        })
    }),
});
map.addLayer(vector);

const draw = new ol.interaction.Draw({
    source: source,
    type: "Point",
});
map.addInteraction(draw);

draw.on("drawstart", function() {
    source.clear()
});

draw.on("drawend", function() {
    $("#submitLocation").css("visibility", "visible");
    setTimeout(function() { $("#submitLocation").prop("disabled", false); }, 100);
})

// A hack to prevent draw on drag
map.on("moveend", function() {
    setTimeout(function() {map.removeInteraction(draw)}, 10);
    map.addInteraction(draw);
});

$("#submitLocation").on("click", function () {
    $("#mapContainer").css("z-index", 1);
    $("#potree_container").css("z-index", 3);
    $("#submitLocation").css("visibility", "hidden");

    if (typeof window.viewer === "undefined") {
        enablePotree().then(function() {
            const position = ol.proj.transform(source.getFeatures()[0].getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');
            currentPosition.latitude = position[1];
            currentPosition.longitude = position[0];
            updatePosition(currentPosition, currentHeight);
        });
    } else {
        const position = ol.proj.transform(source.getFeatures()[0].getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');
        currentPosition.latitude = position[1];
        currentPosition.longitude = position[0];
        updatePosition(currentPosition, currentHeight);
    }
});

$("#centerView").on("click", function() {
    if (mode === "manual") {
        // view.setCenter(geolocation.getPosition());
        view.fit(geolocation.getAccuracyGeometry(), map.getSize());
        autoZoom = view.getZoom();
        autoLoc = view.getCenter();
    } else if (mode === "auto") {
        view.setCenter(positionFeature.getGeometry().getCoordinates());
    }

    $("#centerView").css("visibility", "hidden");
    $("#centerView").prop("disabled", true);
});

$("#mapClose").on("click", function() {
    if (typeof window.viewer !== "undefined") {
        $("#mapContainer").css("z-index", 1);
        $("#potree_container").css("z-index", 3);
    } else{
        source.clear();
        positionFeature.setGeometry();
        accuracyFeature.setGeometry();
        $("#submitLocation").css("visibility", "hidden");
        $("#mapContainer").css("z-index", 1);
        $("#welcomeContainer").css("z-index", 3);
        $("#manualLoc").prop("disabled", false);
        $("#autoLoc").prop("disabled", false);
    }
});
