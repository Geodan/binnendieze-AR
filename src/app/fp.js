"use strict"
document.title = "Binnedieze 3D viewer";

const mode = "firstPerson";

const startCoords = ol.proj.transform([5.303330, 51.688878], 'EPSG:4326', 'EPSG:3857')
setTimeout(toggleMap(startCoords, 15), 100);
positionFeature.setGeometry();
