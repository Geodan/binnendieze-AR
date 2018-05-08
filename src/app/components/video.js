"use strict"

const video = document.getElementById('video');

function enableVideo() {
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
            video: {facingMode: "environment"}
        }).then(function(stream) {
            video.srcObject = stream;
        });
    }
};

$("#videoToggle").on("click", function() {
    if (video.srcObject !== null) {
        const tracks = video.srcObject.getTracks()

        if (tracks.length > 0) {
            tracks[0].stop()
            video.srcObject.removeTrack(tracks[0]);

            $("#video").css("visibility", "hidden")
            viewer.setBackground("gradient");
        } else {
            enableVideo()

            $("#video").css("visibility", "visible")
            viewer.setBackground("none");
        }
    } else {
        enableVideo()

        $("#video").css("visibility", "visible")
        viewer.setBackground("none");
    }
});
