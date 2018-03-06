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

const coverageLayer = new ol.layer.Vector({
    title: 'Puntenwolkdekking',
    source: new ol.source.Vector({
        url: 'app/resources/vec/coverage.geojson',
        format: new ol.format.GeoJSON()
    }),
    style: new ol.style.Style({
        image: new ol.style.Circle({
            radius: 3,
            fill: new ol.style.Fill({
                color: '#3399CC'
            }),
            stroke: new ol.style.Stroke({
                color: '#000',
                width: 1
            })
        })
    })
})

const map = new ol.Map({
    layers: [
        new ol.layer.Group({
            title: 'Achtergrondkaarten',
            layers: [
                new ol.layer.Tile({
                    title: 'OpenStreetMap',
                    type: 'base',
                    visible: true,
                    source: new ol.source.OSM()
                }),
                new ol.layer.Tile({
                    title: 'Luchtfoto',
                    type: 'base',
                    visible: false,
                    source: new ol.source.TileWMS({
                        url: 'https://geodata.nationaalgeoregister.nl/luchtfoto/rgb/wms',
                        params: {'LAYERS': 'Actueel_ortho25'}
                    })
                }),
            ]
        }),
        new ol.layer.Vector({
            source: new ol.source.Vector({
                features: [accuracyFeature, positionFeature]
            })
        }),
        coverageLayer
    ],
    target: 'map',
    controls: ol.control.defaults({
        attributionOptions: {
            collapsible: false
        }
    }),
    view: view
});

const layerSwitcher = new ol.control.LayerSwitcher({
    tipLabel: 'Legend' // Optional label for button
});
map.addControl(layerSwitcher);
