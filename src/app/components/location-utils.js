/**
 * @author chrisl / Geodan
 *
 */

function updatePosition(location, height) {
    "use strict";

    // let coords = ol.proj.transform([location.longitude, location.latitude], 'EPSG:4326', 'EPSG:28992')
    // let coords = ol.proj.transform([location.longitude, location.latitude], 'EPSG:4326', 'EPSG:3857')

    // viewer.scene.view.position.set(coords[0], coords[1], height)
    viewer.scene.view.position.set(location.x, location.y, height)

    if (mode === "firstPerson") {
        viewer.scene.view.pitch = 0;
    }
}
