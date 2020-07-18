import * as THREE from '/public/js/three.module.js';

import { PointerLockControls } from '/public/js/PointerLockControls.js';

var camera, scene, renderer, controls;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();

var socket = io();
var playerId = 0;
var oldPos = {x: 0, y: 0}
var sendPos = 0;
var playerObjects = [];
var playerObj = null;
var galleryScene = null;
var collisionObjs = null;

var loader = document.getElementById("loader");
var loaderContainer = document.getElementById("loader-container");
var startButton = document.getElementById("start");
var dirPad = document.getElementById("dir-pad");

var dirPadRect = dirPad.getBoundingClientRect();
var dirCenterPoint = {
	x: dirPadRect.left + (dirPadRect.width / 2),
	y: dirPadRect.top + (dirPadRect.height / 2),
};

init();
animate();

function init() {

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.y = 2;
	camera.position.z = 10;

	scene = new THREE.Scene();

	controls = new PointerLockControls( camera, document.body );

	var blocker = document.getElementById( 'blocker' );
	var instructions = document.getElementById( 'instructions' );

	startButton.addEventListener( 'click', function () {
		controls.lock();
	}, false );

	controls.addEventListener( 'lock', function () {
		loaderContainer.style.display = 'none';
	});

	controls.addEventListener( 'unlock', function () {
		loaderContainer.style.display = 'block';
	});

	dirPad.addEventListener( 'touchstart', onDirPadTouchStart, false );
	dirPad.addEventListener( 'touchmove', onDirPadTouchMove, false );
	dirPad.addEventListener( 'touchend', onDirPadTouchEnd, false );

	scene.add( camera);

	
	var onKeyDown = function ( event ) {

		switch ( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = true;
				break;

			case 37: // left
			case 65: // a
				moveLeft = true;
				break;

			case 40: // down
			case 83: // s
				moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				moveRight = true;
				break;

		}

	};

	var onKeyUp = function ( event ) {

		switch ( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = false;
				break;

			case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			case 40: // down
			case 83: // s
				moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				moveRight = false;
				break;
		}

	};

	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );

	new THREE.ObjectLoader().load(
		// resource URL
		"/public/scene.json",

		// onLoad callback
		// Here the loaded data is assumed to be an object
		function ( obj ) {
			// Add the loaded object to the scene
			galleryScene = obj
			galleryScene.name = "Gallery";
			collisionObjs = galleryScene.children.find(obj => obj.name === "CollisionObjects");
			scene.add(galleryScene);
			//Hide the spinner and show the play button
			loader.style.display = "none";
			startButton.style.display = "block";
			
		},

		// onProgress callback
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		},

		// onError callback
		function ( err ) {
			console.error( 'An error happened' );
		}
	);

	new THREE.ObjectLoader().load(
		"/public/player.json",
		function ( obj ) {
			playerObj = obj
		},
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		},
		function ( err ) {
			console.error( 'An error happened' );
		}
	);
	

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	window.addEventListener( 'resize', onWindowResize, false );

}

function onDirPadTouchStart(event) {
	controls.dirPadIsTouched = true;
}

function onDirPadTouchMove(event) {
	if(event.touches.length > 0) {
		moveRight = false;
		moveLeft = false;
		moveBackward = false;
		moveForward = false;
		const touch = event.touches[0];
		if(touch.clientX > dirCenterPoint.x) {
			moveRight = true;	
		} else if(touch.clientX < dirCenterPoint.x) {
			moveLeft = true;
		}
		if(touch.clientY > dirCenterPoint.y) {
			moveBackward = true;
		} else if(touch.clientY < dirCenterPoint.y) {
			moveForward = true;
		}
	}
}

function onDirPadTouchEnd(event) {
	moveRight = false;
	moveLeft = false;
	moveBackward = false;
	moveForward = false;
	controls.dirPadIsTouched = false;
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
	
	dirPadRect = dirPad.getBoundingClientRect();
	dirCenterPoint = {
		x: dirPadRect.left + (dirPadRect.width / 2),
		y: dirPadRect.top + (dirPadRect.height / 2),
	};

}

function animate() {

	requestAnimationFrame( animate );

	if ( controls.isLocked === true ) {
		
		var time = performance.now();
		var delta = ( time - prevTime ) / 1000;
		
		velocity.x = 0;
		velocity.z = 0;
		
		direction.z = Number( moveForward ) - Number( moveBackward );
		direction.x = Number( moveRight ) - Number( moveLeft );
		direction.normalize(); // this ensures consistent movements in all directions
		
		var lookingDirection = new THREE.Vector3(0, 0, -1);
		camera.getWorldDirection(lookingDirection);
		lookingDirection.normalize()
		lookingDirection.y = 0
		
		var oppositeDirection = lookingDirection.clone();
		oppositeDirection.multiplyScalar(-1);
		
		var leftDirection = lookingDirection.clone();
		leftDirection.x = lookingDirection.z;
		leftDirection.z = lookingDirection.x * -1;
		
		var rightDirection = oppositeDirection.clone();
		rightDirection.x = oppositeDirection.z
		rightDirection.z = oppositeDirection.x * -1;
		
		var forwardRightDirection = lookingDirection.clone();
		forwardRightDirection.x = lookingDirection.x * Math.cos(THREE.Math.degToRad(45)) - lookingDirection.z * Math.sin(THREE.Math.degToRad(45))
		forwardRightDirection.z = lookingDirection.x * Math.sin(THREE.Math.degToRad(45)) + lookingDirection.z * Math.cos(THREE.Math.degToRad(45))
		
		var forwardLeftDirection = lookingDirection.clone();
		forwardLeftDirection.x = (lookingDirection.x * Math.cos(THREE.Math.degToRad(45)) - lookingDirection.z * Math.sin(THREE.Math.degToRad(45))) * -1;
		forwardLeftDirection.z = lookingDirection.x * Math.sin(THREE.Math.degToRad(45)) + lookingDirection.z * Math.cos(THREE.Math.degToRad(45))
		
		var oppositeRightDirection = oppositeDirection.clone();
		oppositeRightDirection.x = oppositeDirection.x * Math.cos(THREE.Math.degToRad(45)) - oppositeDirection.z * Math.sin(THREE.Math.degToRad(45));
		oppositeRightDirection.z = oppositeDirection.x * Math.sin(THREE.Math.degToRad(45)) + oppositeDirection.z * Math.cos(THREE.Math.degToRad(45))
		
		var oppositeLeftDirection = oppositeDirection.clone();
		oppositeLeftDirection.x = (oppositeDirection.x * Math.cos(THREE.Math.degToRad(45)) - oppositeDirection.z * Math.sin(THREE.Math.degToRad(45))) * -1;
		oppositeLeftDirection.z = oppositeDirection.x * Math.sin(THREE.Math.degToRad(45)) + oppositeDirection.z * Math.cos(THREE.Math.degToRad(45))
		
		var rayDirections = [
			lookingDirection,
			oppositeDirection,
			leftDirection,
			rightDirection,
			forwardRightDirection,
			forwardLeftDirection,
			oppositeRightDirection,
			oppositeLeftDirection
		];

		rayDirections.forEach((rayDir, i) => {
			var ray = new THREE.Raycaster( camera.position, rayDir,0 , 1);
			var intersections = ray.intersectObjects(collisionObjs.children);
			if(intersections.length > 0) {
				if(i === 0 && moveForward) {
					direction.z = 0;		
				}
				if(i === 1 && moveBackward) {
					direction.z = 0;
				}
				if(i === 2 && moveLeft) {
					direction.x = 0;
				}
				if(i === 3 && moveRight) {
					direction.x = 0;
				}
				if(i === 4 && (moveRight || moveForward)) {
					direction.x = 0;
					direction.z = 0;
				}
				if(i === 5 && (moveLeft || moveForward)) {
					direction.x = 0;
					direction.z = 0;
				}
				if(i === 6 && (moveRight || moveBackward)) {
					direction.x = 0;
					direction.z = 0;
				}
				if(i === 7 && (moveLeft || moveBackward)) {
					direction.x = 0;
					direction.z = 0;
				}
			}
		});
		velocity.z = direction.z * 6 * delta;
		velocity.x = direction.x * 6 * delta;
		

		controls.moveRight(velocity.x);
		controls.moveForward(velocity.z);

		prevTime = time;
		
		// Only send the 20th position result so the server doesn't get bogged down
		if(sendPos % 20 === 0) {
			socket.emit('movement', JSON.stringify(camera.position));
		}
		sendPos++;
	}

	renderer.render( scene, camera );

}

socket.on('connect', function () {
	console.log(socket.io.engine.id);
	playerId = socket.io.engine.id;
});

socket.on('movement', function(msg){
	try {
		var playerPos = JSON.parse(msg);
		if(playerPos.playerId !== playerId) {
			var player = playerObjects.find(player => player.playerId === playerPos.playerId);
			if(player) {
				player.position.set(playerPos.x, 0, playerPos.z)
			} else {
				//Create a new player object
				var color = new THREE.Color(Math.random(), Math.random(), Math.random())
				var playerMaterial = new THREE.MeshStandardMaterial( { color: color, emissive: color  } );
				player = playerObj.clone();
				player.children.forEach(child => {
					child.material = playerMaterial
				});
				player.position.x = playerPos.x;
				player.position.y = playerPos.y;
				player.position.z = playerPos.z;
				
				scene.add( player );
				player.playerId = playerPos.playerId;
				playerObjects.push(player);
			}
		}
	} catch (err) {
		console.log(err)
	}
});
