"use strict"
document.title = "Binnedieze 3D viewer";

window.viewer = new Potree.Viewer(document.getElementById("potree_render_area"));

viewer.setFOV(60);
viewer.setPointBudget(5*1000*1000);
viewer.setEDLEnabled(true);
viewer.setBackground("gradient");
viewer.setDescription(``);
viewer.loadSettingsFromURL();

viewer.loadGUI(() => {
    viewer.setLanguage('en');
});

let wpid;
let rotatedObject;
let currentPosition = {
    latitude: 0,
    longitude: 0
}
let currentHeight = 3.5;
const heightSlider = document.getElementById("heightRange");
const heightValue = document.getElementById("heightValue");
heightValue.innerHTML = currentHeight + "m";

Potree.loadPointCloud("greyhound://https://binnendieze.geodan.nl/resource/binnendieze/", "binnendieze", e => {
    // Add point cloud to viewer
    const pointcloud = e.pointcloud;
    viewer.scene.addPointCloud(pointcloud);

    rotatedObject = viewer.scene.pointclouds[0]
    rotatedObject.rotation.x = -Math.PI/2;

    // Point styling
    const material = pointcloud.material;
    material.pointColorType = Potree.PointColorType.INTENSITY; // any Potree.PointColorType.XXXX
    material.size = 3;
    material.pointSizeType = Potree.PointSizeType.FIXED;
    material.shape = Potree.PointShape.SQUARE;
    material.uniforms.rgbBrightness.value = 0.1;
    material.uniforms.rgbGamma.value = 0.8;

    // Camera settings
    viewer.fitToScreen();
    viewer.setMoveSpeed(1);
    viewer.setNavigationMode(Potree.FirstPersonControls);

    // Start location
    currentPosition.latitude = 51.68784;
    currentPosition.longitude = 5.30352;
    updatePosition(currentPosition, currentHeight);
    // const startPosition = rotateCoords({x: 149213.286, y: 411008.908, z: 3.5}, viewer.scene.pointclouds[0]);
    // viewer.scene.view.position.x = startPosition.x;
    // viewer.scene.view.position.y = startPosition.y;
    // viewer.scene.view.position.z = startPosition.z;

    // trackLocation();
});

heightSlider.oninput = function() {
    currentHeight = this.value / 10;
    heightValue.innerHTML = currentHeight + "m";
    updatePosition(currentPosition, currentHeight);
};

locToggle.addEventListener('change', function() {
    if(this.checked) {
        trackLocation();
    } else {
        navigator.geolocation.clearWatch(wpid);
    }
});
