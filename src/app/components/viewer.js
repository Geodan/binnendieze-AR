"use strict"

let rotatedObject;

function enablePotree() {
    let promise = new Promise(function(resolve, reject) {
        window.viewer = new Potree.Viewer(document.getElementById("potree_render_area"));

        viewer.setFOV(60);
        viewer.setPointBudget(5*1000*1000);
        viewer.setEDLEnabled(true);
        viewer.setBackground("gradient");
        viewer.setDescription(``);
        viewer.loadSettingsFromURL();

        // let mapToggle;
        viewer.loadGUI(() => {
            viewer.setLanguage('en');
            $("#potree_map_toggle").css("display", "inline");
            $("#potree_map_toggle").on("click", function() {
                $("#potree_container").css("z-index", 1);
                $("#mapContainer").css("z-index", 3);

                if (mode === "manual") {
                    toggleMap();
                } else if (mode === "auto") {
                    const coordinates = ol.proj.transform([currentPosition.longitude, currentPosition.latitude], 'EPSG:4326', 'EPSG:3857');
                    toggleMap(coordinates);
                }
            })
        });

        $("#heightValue").text(currentHeight + "m");

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

            resolve();
        });
    });

    return promise;
}

$("#heightRange").on("input", function() {
    currentHeight = this.value / 10;
    $("#heightValue").text(currentHeight + "m");
    updatePosition(currentPosition, currentHeight);
});

$("#refreshMeasurements").on("click", function() {
    measuredPositions = [];
    $("#measurements").css("visibility", "hidden");
    $("#refreshMeasurements").prop("disabled", true);
    $("#refreshMeasurements").css("visibility", "hidden");
});
