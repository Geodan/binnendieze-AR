"use strict"

let rotatedObject;

function enablePotree() {
    let promise = new Promise(function(resolve, reject) {
        window.viewer = new Potree.Viewer(document.getElementById("potree_render_area"));

        viewer.setFOV(60);
        viewer.setPointBudget(5*1000*1000);
        viewer.setEDLEnabled(true);
        if (typeof video !== "undefined") {
            if (video.srcObject !== null) {
                viewer.setBackground("none");
            } else {
                viewer.setBackground("gradient");
            }
        } else {
            viewer.setBackground("gradient");
        }
        viewer.setDescription(``);
        viewer.loadSettingsFromURL();

        // let mapToggle;
        viewer.loadGUI(() => {
            viewer.setLanguage('en');
            $("#potree_sidebar_container").prop('hidden', true);
            $(".potree_menu_toggle").on("click", function() {
                $("#potree_sidebar_container").prop('hidden', !$("#potree_sidebar_container").prop('hidden'));
            })
            $("#potree_map_toggle").css("display", "inline");
            $("#potree_map_toggle").prop('onclick', null)
            $("#potree_map_toggle").on("click", function() {
                $("#potree_container").css("z-index", 1);
                $("#mapContainer").css("z-index", 3);

                const coordinates = ol.proj.transform([viewer.scene.view.position.x, viewer.scene.view.position.y], 'EPSG:28992', 'EPSG:3857');
                toggleMap(coordinates);

                // if (mode === "manual") {
                //     toggleMap();
                // } else if (mode === "auto") {
                //     const coordinates = ol.proj.transform([currentPosition.longitude, currentPosition.latitude], 'EPSG:4326', 'EPSG:3857');
                //     toggleMap(coordinates);
                // } else if (mode === "firstPerson" || mode === "earth") {
                //     const coordinates = ol.proj.transform([viewer.scene.view.position.x, viewer.scene.view.position.y], 'EPSG:28992', 'EPSG:3857');
                //     toggleMap(coordinates);
                // }
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
            if (mode === "firstPerson") {
                viewer.setMoveSpeed(2);
                viewer.setNavigationMode(Potree.FirstPersonControls);
                viewer.fpControls.lockElevation = true;
                viewer.scene.view.position.z = parseFloat($("#fixedZInput").val());
            } else if (mode === "earth") {
                viewer.setNavigationMode(Potree.EarthControls);
                viewer.scene.view.position.set(149281, 411044, 1353);
                viewer.scene.view.yaw = 0;
                viewer.scene.view.pitch = -Math.PI/2;
            } else if (mode === "manual" || mode === "auto") {
                viewer.setNavigationMode(Potree.DeviceOrientationControls);
            } else {
                reject();
            }

            resolve();
        });
    });

    return promise;
}

$("#heightRange").slider({
    orientation: "vertical",
    range: "min",
    min: 0,
    max: 200,
    value: currentHeight * 10,
    slide: function(event, ui) {
        currentHeight = ui.value/10
        $("#heightValue").val(currentHeight + " m");
        updatePosition(currentPosition, currentHeight);
    }
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
        viewer.fpControls.lockElevation = true;
        viewer.scene.view.position.z = parseFloat($("#fixedZInput").val());
    } else {
        $("#fixedZInput").prop("disabled", true);
        viewer.fpControls.lockElevation = false;
    }
});

$("#fixedZInput").on("change", function() {
    viewer.scene.view.position.z = parseFloat($("#fixedZInput").val());
});
