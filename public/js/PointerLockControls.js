/**
 * Original:
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 * Edited By:
 * @author John Labod / https://labod.co/
 */

import {
	Euler,
	EventDispatcher,
	Vector3
} from "/public/js/three.module.js";

var PointerLockControls = function ( camera, domElement ) {

	if ( domElement === undefined ) {
		console.warn( 'THREE.PointerLockControls: The second parameter "domElement" is now mandatory.' );
		domElement = document.body;
	}
	
	this.dirPadIsTouched = false;
	this.domElement = domElement;
	this.isLocked = false;

	//
	// internals
	//

	var scope = this;
	
	var oldTouchX = 0;
	var oldTouchY = 0;
	var isTouchDevice = false;
	var dirPadIsTouched = false;
	
	var changeEvent = { type: 'change' };
	var lockEvent = { type: 'lock' };
	var unlockEvent = { type: 'unlock' };

	var euler = new Euler( 0, 0, 0, 'YXZ' );

	var PI_2 = Math.PI / 2;

	var vec = new Vector3();

	function onMouseMove( event ) {

		if ( scope.isLocked === false ) return;
		
		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
		
		euler.setFromQuaternion( camera.quaternion );

		euler.y -= movementX * 0.002;
		euler.x -= movementY * 0.002;

		euler.x = Math.max( - PI_2, Math.min( PI_2, euler.x ) );

		camera.quaternion.setFromEuler( euler );

		scope.dispatchEvent( changeEvent );

	}
	
	function onTouchMove(event) {
		event.preventDefault();
		// Don't rotate the camera if the directional pad is being touched
		if(scope.dirPadIsTouched || !scope.isLocked) {
			return;
		}
		if(event.touches.length > 0) {
			const touch = event.touches[0];

			var movementX = touch.clientX - oldTouchX;
			var movementY = touch.clientY - oldTouchY;
			
			euler.setFromQuaternion( camera.quaternion );

			euler.y += movementX * 0.004;
			euler.x += movementY * 0.004;

			euler.x = Math.max( - PI_2, Math.min( PI_2, euler.x ) );

			camera.quaternion.setFromEuler( euler );

			scope.dispatchEvent( changeEvent );
			
			oldTouchX = touch.clientX;
			oldTouchY = touch.clientY;
		}
		
	}
	
	function onTouchStart(event) {
		isTouchDevice = true;
		if(event.touches.length > 0) {
			const touch = event.touches[0];
			oldTouchX = touch.clientX;
			oldTouchY = touch.clientY;
		}
	}

	function onPointerlockChange() {

		if ( document.pointerLockElement === scope.domElement ) {

			scope.dispatchEvent( lockEvent );

			scope.isLocked = true;

		} else {
			//Touching causes a pointer lock change. Make sure the screen is not locked on mobile devices
			if(!isTouchDevice) {
				scope.dispatchEvent( unlockEvent );		
				scope.isLocked = false;
			}

		}

	}

	function onPointerlockError() {

		console.error( 'THREE.PointerLockControls: Unable to use Pointer Lock API' );

	}

	this.connect = function () {

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'touchmove', onTouchMove, false );
		document.addEventListener( 'touchstart', onTouchStart, false );
		document.addEventListener( 'pointerlockchange', onPointerlockChange, false );
		document.addEventListener( 'pointerlockerror', onPointerlockError, false );

	};

	this.disconnect = function () {

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'touchmove', onTouchMove, false );
		document.removeEventListener( 'touchstart', onTouchStart, false );
		document.removeEventListener( 'pointerlockchange', onPointerlockChange, false );
		document.removeEventListener( 'pointerlockerror', onPointerlockError, false );

	};

	this.dispose = function () {

		this.disconnect();

	};

	this.getObject = function () { // retaining this method for backward compatibility

		return camera;

	};

	this.getDirection = function () {

		var direction = new Vector3( 0, 0, - 1 );

		return function ( v ) {

			return v.copy( direction ).applyQuaternion( camera.quaternion );

		};

	}();

	this.moveForward = function ( distance ) {

		// move forward parallel to the xz-plane
		// assumes camera.up is y-up

		vec.setFromMatrixColumn( camera.matrix, 0 );

		vec.crossVectors( camera.up, vec );

		camera.position.addScaledVector( vec, distance );

	};

	this.moveRight = function ( distance ) {

		vec.setFromMatrixColumn( camera.matrix, 0 );

		camera.position.addScaledVector( vec, distance );

	};

	this.lock = function () {

		this.domElement.requestPointerLock();

	};

	this.unlock = function () {

		document.exitPointerLock();

	};

	this.connect();

};

PointerLockControls.prototype = Object.create( EventDispatcher.prototype );
PointerLockControls.prototype.constructor = PointerLockControls;

export { PointerLockControls };
