const view = new ol.View({
    center: [0, 0],
    zoom: 19
});
let autoZoom = view.getZoom();

const map = new ol.Map({
    layers: [
        new ol.layer.Tile({
        source: new ol.source.OSM()
        })
    ],
    target: 'map',
    controls: ol.control.defaults({
        attributionOptions: {
        collapsible: false
        }
    }),
    view: view
});

const geolocation = new ol.Geolocation({
    projection: view.getProjection()
});

geolocation.setTracking(true);

geolocation.on('change', function() {
    $("#accuracy").text('Geschatte accuraatheid: ' + geolocation.getAccuracy() + ' [m]');
});

const accuracyFeature = new ol.Feature();
geolocation.on('change:accuracyGeometry', function() {
    const accuracyGeometry = geolocation.getAccuracyGeometry();
    accuracyFeature.setGeometry(accuracyGeometry);
    if (view.getZoom() === autoZoom) {
        view.fit(accuracyGeometry, map.getSize())
        autoZoom = view.getZoom();
    }
});

const positionFeature = new ol.Feature();
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

geolocation.on('change:position', function() {
    const coordinates = geolocation.getPosition();
    view.setCenter(coordinates);

    positionFeature.setGeometry(coordinates ?
        new ol.geom.Point(coordinates) : null);
});

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
