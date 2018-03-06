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
                } else if (mode === "firstPerson" || mode === "earth") {
                    const coordinates = ol.proj.transform([viewer.scene.view.position.x, viewer.scene.view.position.y], 'EPSG:28992', 'EPSG:3857');
                    toggleMap(coordinates);
                }
            })
        });

        $("#heightValue").text(currentHeight + "m");

        Potree.loadPointCloud("greyhound://https://binnendieze.geodan.nl/resource/binnendieze/", "binnendieze", e => {
            // Add point cloud to viewer
            const pointcloud = e.pointcloud;
            viewer.scene.addPointCloud(pointcloud);

            // Point styling
            const material = pointcloud.material;
            material.pointColorType = Potree.PointColorType.INTENSITY; // any Potree.PointColorType.XXXX
            $("#optMaterial0").val('Intensity');
            $("#optMaterial0").selectmenu("refresh");

            material.size = 3;
            material.pointSizeType = Potree.PointSizeType.FIXED;
            material.shape = Potree.PointShape.SQUARE;
            material.uniforms.rgbBrightness.value = 0.1;
            material.uniforms.rgbGamma.value = 0.8;

            // Camera settings
            viewer.fitToScreen();
            if (mode === "firstPerson") {
                viewer.setMoveSpeed(2);
                viewer.setNavigationMode(Potree.FirstPersonControls);
                viewer.fpControls.fixedZ = 3.5;
                viewer.scene.view.pitch = 0;
            } else if (mode === "earth") {
                viewer.setNavigationMode(Potree.EarthControls);
                viewer.scene.view.position.x = 149281.65978994727;
                viewer.scene.view.position.y = 411044.88721504353;
                viewer.scene.view.position.z = 1353.5061355679848;
                setTimeout(function () {
                    viewer.scene.view.yaw = 0;
                    viewer.scene.view.pitch = -Math.PI/2;
                }, 100);
            } else {
                rotatedObject = viewer.scene.pointclouds[0]
                rotatedObject.rotation.x = -Math.PI/2;
                viewer.setNavigationMode(Potree.DeviceOrientationControls);
            }

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

$("#fixedZCheck").on("change", function() {
    if (this.checked) {
        $("#fixedZInput").prop("disabled", false);
        viewer.fpControls.fixedZ = parseFloat($("#fixedZInput").val());
    } else {
        $("#fixedZInput").prop("disabled", true);
        viewer.fpControls.fixedZ = null;
    }
});

$("#fixedZInput").on("change", function() {
    viewer.fpControls.fixedZ = parseFloat($("#fixedZInput").val());
})
