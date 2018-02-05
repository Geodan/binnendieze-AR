const source = new ol.source.Vector();
const vector = new ol.layer.Vector({
    source: source,
    style: new ol.style.Style({
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#e74c3c'
            })
        })
    }),
    updateWhileInteracting: true
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
    $("#submitLocation").css("display", "inline");
    setTimeout(function() { $("#submitLocation").prop("disabled", false); }, 100);
})

$("#submitLocation").on("click", function () {
    const position = ol.proj.transform(source.getFeatures()[0].getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');
    currentPosition.latitude = position[1];
    currentPosition.longitude = position[0];
    updatePosition(currentPosition, currentHeight);
    $("#potree_container").css("display", "inline");
});

$("#centerView").on("click", function() {
    console.log("click");
    view.setCenter(geolocation.getPosition());
    view.fit(geolocation.getAccuracyGeometry(), map.getSize());
    autoZoom = view.getZoom();
    autoLoc = view.getCenter();
    $("#centerView").css("display", "none");
    $("#centerView").prop("disabled", true);
});
