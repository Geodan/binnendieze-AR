/**
 * @author chrisl / Geodan
 *
 */

function rotateCoords(position, rotatedObject) {
    "use strict";

    const rotatedPosition = {x: 0, y: 0, z: 0};
    rotatedPosition.x = position.x;
    // rotatedPosition.y = position.z + rotatedObject.position.y - rotatedObject.position.z;
    rotatedPosition.y = Math.abs(rotatedObject.position.z - position.z) + rotatedObject.position.y;
    // rotatedPosition.z = rotatedObject.position.y - position.y + rotatedObject.position.z;
    rotatedPosition.z = (rotatedObject.position.y - position.y) + rotatedObject.position.z;
    return rotatedPosition;
}

// function rotateCoordsBack(position, rotatedObject) {
//     "use strict";

//     const rotatedPosition = {x: 0, y: 0, z: 0};
//     rotatedPosition.x = position.x;
//     rotatedPosition.y = -position.z + rotatedObject.position.z + rotatedObject.position.y
//     rotatedPosition.z = position.y - rotatedObject.position.y + rotatedObject.position.z
//     return rotatedPosition;
// }

function updatePosition(location, height) {
    "use strict";

    let coords = ol.proj.transform([location.longitude, location.latitude], 'EPSG:4326', 'EPSG:28992')

    if (typeof rotatedObject !== "undefined") {
        coords = rotateCoords({x: coords[0], y: coords[1], z: height}, rotatedObject);
    } else {
        coords = {x: coords[0], y: coords[1], z: height};
    }

    viewer.scene.view.position.x = coords.x;
    viewer.scene.view.position.y = coords.y;
    viewer.scene.view.position.z = coords.z;
}
