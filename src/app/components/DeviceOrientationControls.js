/**
 * @author chrisl / Geodan
 *
 * adapted from Potree.FirstPersonControls by
 *
 * @author mschuetz / http://mschuetz.at
 *
 * and THREE.DeviceOrientationControls  by
 *
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 *
 *
 */

Potree.DeviceOrientationControls = class DeviceOrientationControls extends THREE.EventDispatcher{
    constructor(viewer){
        super();

        this.viewer = viewer;
        this.renderer = viewer.renderer;

        this.scene = null;
        this.sceneControls = new THREE.Scene();

        this.screenOrientation = 0;

        this.onDeviceOrientationChangeEvent = e => {
            this.deviceOrientation = e;
        };

        this.onScreenOrientationChangeEvent = e => {
            this.screenOrientation = window.orientation || 0;
        };

        this.listeners = false;
    }

    addListeners () {
        if (this.listeners === false) {
            if ('ondeviceorientationabsolute' in window) {
                window.addEventListener('deviceorientationabsolute', this.onDeviceOrientationChangeEvent, false);
            } else if ('ondeviceorientation' in window) {
                alert("WARNING: Absolute coordinates could not be guaranteed.");
                window.addEventListener('deviceorientation', this.onDeviceOrientationChangeEvent, false);
            } else {
                alert("ERROR: No device orientation found.");
            }
            // window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);
            window.addEventListener('orientationchange', this.onScreenOrientationChangeEvent, false);

            this.listeners = true;
        }
    }

    setScene (scene) {
        window.scene = scene;
    }

    update (delta) {
        if (typeof this.deviceOrientation !== 'undefined') {
            let alpha = this.deviceOrientation.alpha ? THREE.Math.degToRad(this.deviceOrientation.alpha) : 0;
            let beta = this.deviceOrientation.beta ? THREE.Math.degToRad(this.deviceOrientation.beta) : 0;
            let gamma = this.deviceOrientation.gamma ? THREE.Math.degToRad(this.deviceOrientation.gamma) : 0;
            let orient = this.screenOrientation ? THREE.Math.degToRad(this.screenOrientation) : 0;

            let currentQ = new THREE.Quaternion().copy(viewer.scene.camera.quaternion);
            setObjectQuaternion(currentQ, alpha, beta, gamma, orient);
            viewer.scene.camera.quaternion.set(currentQ.x, currentQ.y, currentQ.z, currentQ.w);

            // let qm = new THREE.Quaternion();
            // THREE.Quaternion.slerp(viewer.scene.camera.quaternion, currentQ, qm, this.fadeFactor * delta);
            // viewer.scene.camera.quaternion.set(qm.x, qm.y, qm.z, qm.w)
        }
    }
};

let setObjectQuaternion = function () {
    let zee = new THREE.Vector3(0, 0, 1);
    let euler = new THREE.Euler();
    let q0 = new THREE.Quaternion();
    let q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

    return function (quaternion, alpha, beta, gamma, orient) {
        euler.set(beta, alpha, -gamma, 'YXZ');
        quaternion.setFromEuler(euler);

        quaternion.multiply(q1);

        quaternion.multiply(q0.setFromAxisAngle(zee, -orient));
    }
}();
