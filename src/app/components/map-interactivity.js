geolocation.on('change:accuracy', function() {
    $("#accuracy").text('Geschatte accuraatheid: ' + geolocation.getAccuracy() + ' [m]');
});

let accuracyFeature = new ol.Feature();
geolocation.on('change:accuracyGeometry', function() {
    const accuracyGeometry = geolocation.getAccuracyGeometry();
    accuracyFeature.setGeometry(accuracyGeometry);
    if (view.getZoom() === autoZoom) {
        view.fit(accuracyGeometry, map.getSize())
        autoZoom = view.getZoom();
    }
});

let positionFeature = new ol.Feature();
positionFeature.setStyle(new ol.style.Style({
    image: new ol.style.Circle({
        radius: 6,
        fill: new ol.style.Fill({
            color: '#3399CC'
        }),
        stroke: new ol.style.Stroke({
            color: '#fff',
            width: 2
        })
    })
}));

new ol.layer.Vector({
    map: map,
    source: new ol.source.Vector({
        features: [accuracyFeature, positionFeature]
    })
});

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
