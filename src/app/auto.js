"use strict"
document.title = "Binnedieze 3D viewer";

const mode = 'auto';
geolocation.setTracking(true);

enablePotree();
map.removeInteraction(draw);
$("#mapClose").css("visibility", "visible");
