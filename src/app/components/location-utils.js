/**
 * @author chrisl / Geodan
 *
 */

function rotateCoords(position, rotatedObject) {
    "use strict";

    const rotatedPosition = {x: 0, y: 0, z: 0};
    rotatedPosition.x = position.x;
    rotatedPosition.y = Math.abs(rotatedObject.position.z - position.z) + rotatedObject.position.y;
    rotatedPosition.z = (rotatedObject.position.y - position.y) + rotatedObject.position.z;
    return rotatedPosition;
}

function updatePosition(location, height) {
    "use strict";

    let coords = ol.proj.transform([location.longitude, location.latitude], 'EPSG:4326', 'EPSG:28992')

    if (typeof rotatedObject !== undefined) {
        coords = rotateCoords({x: coords[1], y: coords[0], z: height}, rotatedObject);
    }

    viewer.scene.view.position.x = coords.x;
    viewer.scene.view.position.y = coords.y;
    viewer.scene.view.position.z = coords.z;
}
