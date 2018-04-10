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
    })
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

    function setPosition() {
        // const position = ol.proj.transform(source.getFeatures()[0].getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');
        const position = source.getFeatures()[0].getGeometry().getCoordinates()
        // console.log(position);
        currentPosition.latitude = position[1];
        currentPosition.longitude = position[0];
        // updatePosition(currentPosition, currentHeight);
        currentPosition.x = position[0];
        currentPosition.y = position[1];

        updatePosition(currentPosition, currentHeight);
    }

    if (typeof window.viewer === "undefined") {
        enablePotree().then(function() {
            setPosition();
            $("#mapClose").css("visibility", "visible");
        });
    } else {
        setPosition();
    }
});

$("#centerView").on("click", function() {
    setMapView();

    $("#centerView").css("visibility", "hidden");
    $("#centerView").prop("disabled", true);
});

$("#mapClose").on("click", function() {
    $("#mapContainer").css("z-index", 1);
    $("#potree_container").css("z-index", 3);
});
