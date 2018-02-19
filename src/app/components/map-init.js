"use strict"

const view = new ol.View({
    center: [0, 0],
    zoom: 19
});

let accuracyFeature = new ol.Feature();

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

const map = new ol.Map({
    layers: [
        new ol.layer.Tile({
        source: new ol.source.OSM()
        }),
        new ol.layer.Vector({
            source: new ol.source.Vector({
                features: [accuracyFeature, positionFeature]
            })
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

function toggleMap(coordinates, zoom) {
    map.updateSize();
    let accuracyGeometry;
    if (typeof coordinates === "undefined") {
        coordinates = geolocation.getPosition();
        accuracyGeometry = geolocation.getAccuracyGeometry();
    }

    if (typeof coordinates !== "undefined") {
        positionFeature.setGeometry(coordinates ?
            new ol.geom.Point(coordinates) : null);
        view.setCenter(coordinates);
    }
    if (typeof accuracyGeometry !== "undefined") {
        accuracyFeature.setGeometry(accuracyGeometry);
        view.fit(accuracyGeometry, map.getSize());
        $("#accuracy").text('Geschatte accuraatheid: ' + geolocation.getAccuracy().toFixed(2) + ' [m]');
    }

    if (typeof zoom !== "undefined") {
        view.setZoom(zoom);
    }
}
