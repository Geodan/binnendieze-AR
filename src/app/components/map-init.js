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