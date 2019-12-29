import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let door, roy;
let doorMixer, royMixer;
let model;
let pm;
const clock = new THREE.Clock();

function isMobile() {
	return /Android|mobile|iPad|iPhone/i.test(navigator.userAgent);
}

const interpolationFactor = 5;

let trackedMatrix = {
	// for interpolation
	delta: [
		0,0,0,0,
		0,0,0,0,
		0,0,0,0,
		0,0,0,0
	],
	interpolated: [
		0,0,0,0,
		0,0,0,0,
		0,0,0,0,
		0,0,0,0
	]
}

var setMatrix = function(matrix, value) {
	let array = [];
	for (let key in value) {
		array[key] = value[key];
	}
	if (typeof matrix.elements.set === "function") {
		matrix.elements.set(array);
	} else {
		matrix.elements = [].slice.call(array);
	}
};

export default function StartNFT (
	container,
	marker,
	video,
	input_width,
	input_height,
	canvas_draw,
	stats1,
	stats2,
	greyCover
) {
	let vw, vh;
	let sw, sh;
	let pscale, sscale;
	let w, h;
	let pw, ph;
	let ox, oy;
	let worker;
	let camera_para = "../../../Data/camera_para-iPhone 5 rear 640x480 1.0m.dat";
	// let camera_para = "../../../Data/camera_para.dat";

	let canvas_process = document.createElement("canvas");
	let context_process = canvas_process.getContext("2d");

	// let context_draw = canvas_draw.getContext('2d');
	let renderer = new THREE.WebGLRenderer({
		canvas: canvas_draw,
		alpha: true,
		antialias: true
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.outputEncoding = THREE.sRGBEncoding;

	const scene = new THREE.Scene();

	const camera = new THREE.Camera();
	camera.matrixAutoUpdate = false;
	
	const dummyCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 3000);
	camera.projectionMatrix = dummyCamera.projectionMatrix;
	// camera.position.set(-1.8, 0.6, 2.7);
	// camera.matrixAutoUpdate = false;

	// const controls = new OrbitControls(camera, renderer.domElement);
	// controls.target.set(0, 0, - 0.2);
	// controls.update();

	console.log(camera);
	scene.add(camera);

	const light1 = new THREE.AmbientLight(0xffffff);
	scene.add(light1);

	const light2 = new THREE.DirectionalLight(0xFFFFFF, 1);
	scene.add(light2);

	const root = new THREE.Object3D();
	scene.add(root);

	/* Load Model */
	const loadingManager = new THREE.LoadingManager();
	loadingManager.onLoad = () => {
		console.log( 'Loading complete!');
		doorMixer = new THREE.AnimationMixer(door);
		royMixer = new THREE.AnimationMixer(roy);
		// const animations = gltf.animations;
		setTimeout(() => {
			for (let anim of door.animations) {
				console.log(`add dooranim:${anim.name}`);
				const action = doorMixer.clipAction(anim) ;
				action.setLoop(THREE.LoopOnce); 
				action.clampWhenFinished = true;
				action.play();
			}
			for (let anim of roy.animations) {
				console.log(`add royanim:${anim.name}`);
				const action = royMixer.clipAction(anim) ;
				action.setLoop(THREE.LoopOnce); 
				action.clampWhenFinished = true;
				action.play();
			}
		}, 5000);

		root.matrixAutoUpdate = false;
		root.add(door);
		root.add(roy);
	};

	const loader = new FBXLoader(loadingManager);
	loader.load('models/hny2020fbx/Greeting_OnlyDoor.fbx', (object) => {
		console.log('door loaded', object.scale, object.position);
		object.scale.x = 200;
		object.scale.y = 200;
		object.scale.z = 200;
		object.rotateX(90 * Math.PI / 180);
		object.position.x = 70.0;
		object.position.y = 90.0;
		object.position.z = 0;
		door = object;
	});
	loader.load('models/hny2020fbx/Greeting280_OnlyRoy.fbx', (object) => {
		console.log('roy loaded', object.scale, object.position);
		// console.log(object.children);
		for (let child of object.children) {
			// console.log(child.name, child.type);
			if (child.type == 'SkinnedMesh') {
				console.log(child.material);
			}
		}
		object.scale.x = 0.2;
		object.scale.y = 0.2;
		object.scale.z = 0.2;
		object.rotateX(90 * Math.PI / 180);
		object.position.x = 70.0;
		object.position.y = 90.0;
		object.position.z = 0;
		console.log('a');
		roy = object;
	});

	let load = () => {
		vw = input_width;
		vh = input_height;

		pscale = 320 / Math.max(vw, (vh / 3) * 4);
		sscale = isMobile() ? window.outerWidth / input_width : 1;

		sw = vw * sscale;
		sh = vh * sscale;
		video.style.width = sw + "px";
		video.style.height = sh + "px";
		container.style.width = sw + "px";
		container.style.height = sh + "px";
		canvas_draw.style.clientWidth = sw + "px";
		canvas_draw.style.clientHeight = sh + "px";
		canvas_draw.width = sw;
		canvas_draw.height = sh;
		w = vw * pscale;
		h = vh * pscale;
		pw = Math.max(w, (h / 3) * 4);
		ph = Math.max(h, (w / 4) * 3);
		ox = (pw - w) / 2;
		oy = (ph - h) / 2;
		canvas_process.style.clientWidth = pw + "px";
		canvas_process.style.clientHeight = ph + "px";
		canvas_process.width = pw;
		canvas_process.height = ph;

		renderer.setSize(sw, sh);

		worker = new Worker("./vendor/jsartoolkit5/js/artoolkit.worker.js");

		worker.postMessage({
			type: "load",
			pw: pw,
			ph: ph,
			camera_para: camera_para,
			marker: marker.url
		});

		worker.onmessage = ev => {
			let msg = ev.data;
			switch (msg.type) {
				case "loaded": {
					// ARKitで用意されたカメラパラメータを使うと3Dモデルのメッシュ表示が崩れるので使わない
					// let proj = JSON.parse(msg.proj);
					// let ratioW = pw / w;
					// let ratioH = ph / h;
					// proj[0] *= ratioW;
					// proj[4] *= ratioW;
					// proj[8] *= ratioW;
					// proj[12] *= ratioW;
					// proj[1] *= ratioH;
					// proj[5] *= ratioH;
					// proj[9] *= ratioH;
					// proj[13] *= ratioH;
					// setMatrix(camera.projectionMatrix, proj);
					break;
				}
				case "endLoading": {
					if (msg.end == true)
						// removing loader page if present
						document.body.classList.remove("loading");
					document.getElementById("loading").remove();
					break;
				}
				case "found": {
					found(msg);
					break;
				}
				case "not found": {
					found(null);
					break;
				}
			}
			// track_update();
			process();
		};
	};

	let world;

	let found = msg => {
		if (!msg) {
			world = null;
		} else {
			world = JSON.parse(msg.matrixGL_RH);
		}
	};

	let lasttime = Date.now();
	let time = 0;

	let draw = () => {
		// render_update();
		let now = Date.now();
		let dt = now - lasttime;
		time += dt;
		lasttime = now;

		if (!world) {
			root.visible = false;
		} else {
			root.visible = true;

			// interpolate matrix
			for (let i = 0; i < 16; i++) {
				trackedMatrix.delta[i] = world[i] - trackedMatrix.interpolated[i];
				trackedMatrix.interpolated[i] =
					trackedMatrix.interpolated[i] +
					trackedMatrix.delta[i] / interpolationFactor;
			}

			// set matrix of 'root' by detected 'world' matrix
			setMatrix(root.matrix, trackedMatrix.interpolated);
		}
		renderer.render(scene, camera);
	};

	function process() {
		context_process.fillStyle = "black";
		context_process.fillRect(0, 0, pw, ph);
		context_process.drawImage(video, 0, 0, vw, vh, ox, oy, w, h);

		let imageData = context_process.getImageData(0, 0, pw, ph);
		worker.postMessage({ type: "process", imagedata: imageData }, [
			imageData.data.buffer
		]);
	}
	let tick = () => {
		draw();
		// renderer.render(scene, camera);

		// requestAnimationFrame(tick);
		setTimeout(function() {
        	requestAnimationFrame(tick);
    	}, 1000 / 30);
		const delta = clock.getDelta();
		if (doorMixer) {
			doorMixer.update(delta);
		}
		if (royMixer) {
			royMixer.update(delta);
		}
		if (stats1) {
			stats1();
		}
		if (stats2) {
			stats2();
		}
	};

	load();
	tick();
	process();
}
