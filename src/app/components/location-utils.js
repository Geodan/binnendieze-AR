/**
 * @author chrisl / Geodan
 *
 */

function updatePosition(location, height) {
    "use strict";

    let coords = ol.proj.transform([location.longitude, location.latitude], 'EPSG:4326', 'EPSG:28992')

    viewer.scene.view.position.set(coords[0], coords[1], height)

    if (mode === "firstPerson") {
        viewer.scene.view.pitch = 0;
    }
}
