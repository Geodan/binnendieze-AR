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

function wgsToRD (latitude, longitude) {
    "use strict";

    const rd = rdnaptrans.Transform.etrs2rd(new rdnaptrans.Geographic(latitude, longitude));
    return {x: rd.X, y: rd.Y}
}

function updatePosition(location, height) {
    "use strict";

    let coords = wgsToRD(location.latitude, location.longitude);

    if (typeof rotatedObject !== undefined) {
        coords = rotateCoords({x: coords.x, y: coords.y, z: height}, rotatedObject);
    }

    viewer.scene.view.position.x = coords.x;
    viewer.scene.view.position.y = coords.y;
    viewer.scene.view.position.z = coords.z;
}
