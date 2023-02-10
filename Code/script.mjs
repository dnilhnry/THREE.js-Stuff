//--------------------------------------------------------------------------------------------------------------------------

// START

//--------------------------------------------------------------------------------------------------------------------------

import * as THREE from 'three';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

/* 
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
*/

import { TIFFLoader } from 'three/addons/loaders/TIFFLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { Reflector } from 'three/addons/objects/Reflector.js'

THREE.Cache.enabled = true;

//--------------------------------------------------------------------------------------------------------------------------
// Custom Camera Controller - based on THREE.FirstPersonControls, modified for a better user experience
//--------------------------------------------------------------------------------------------------------------------------

const FirstPersonControls = function ( camera, MouseMoveSensitivity = 0.002, ZoomSensitivity = 1, speed = 50.0 ) {
  var scope = this;
  
  scope.MouseMoveSensitivity = MouseMoveSensitivity;
  scope.ZoomSensitivity = ZoomSensitivity;
  scope.speed = speed;
  
  var moveForward = false;
  var moveBackward = false;
  var moveLeft = false;
  var moveRight = false;
  var incHeight = false;
  var decHeight = false;
  
  var velocity = new THREE.Vector3();
  var direction = new THREE.Vector3();

  var prevTime = performance.now();

  camera.rotation.set( 0, 0, 0 );

  var pitchObject = new THREE.Object3D();
  pitchObject.add( camera );

  var yawObject = new THREE.Object3D();
  yawObject.position.set ( 8.8, 1.65, 8 );
  yawObject.add( pitchObject );

  var PI_2 = Math.PI / 2;

  // rotate camera on mouse move
  var onMouseMove = function ( event ) {

    if ( scope.enabled === false ) return;

    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    yawObject.rotation.y -= movementX * scope.MouseMoveSensitivity;
    pitchObject.rotation.x -= movementY * scope.MouseMoveSensitivity;

    pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

  };

  // move camera on key press
  var onKeyDown = (function ( event ) {
    
    if ( scope.enabled === false ) return;
    
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

      case 32: // space
        incHeight = true;
        break;

      case 16: // shift
        decHeight = true;
        break;

    }

  }).bind(this);

  var onKeyUp = (function ( event ) {
    
    if ( scope.enabled === false ) return;
    
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

      case 32: // space
        incHeight = false;
        break;

      case 16: // shift
        decHeight = false;
        break;

    }

  }).bind(this);
  
  // zoom camera on mouse wheel
  var onWheel = (function ( event ) {
    if ( scope.enabled === false ) return; 
        
    if (event.deltaY < 0) { camera.zoom += ( 0.10 * scope.ZoomSensitivity ); }
    if (event.deltaY > 0 && camera.zoom >= 1) { camera.zoom -= ( 0.10 * scope.ZoomSensitivity ); }

  }).bind(this);


  scope.dispose = function() {
    document.removeEventListener( 'mousemove', onMouseMove, false );
    document.removeEventListener( 'keydown', onKeyDown, false );
    document.removeEventListener( 'keyup', onKeyUp, false );
    document.removeEventListener( 'wheel', onWheel, false );
  };

  document.addEventListener( 'mousemove', onMouseMove, false );
  document.addEventListener( 'keydown', onKeyDown, false );
  document.addEventListener( 'keyup', onKeyUp, false );
  document.addEventListener( 'wheel', onWheel, false );


  scope.enabled = false;

  scope.getObject = function () {

    return yawObject;

  };

  // update camera on camera rotation + movement + zoom
  scope.update = function () {

    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.y -= velocity.y * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.x = Number( moveRight ) - Number( moveLeft );
    direction.y = Number( incHeight ) - Number( decHeight );
    direction.z = Number( moveForward ) - Number( moveBackward );
    direction.normalize();

    var speed = scope.speed;

    if ( moveRight || moveLeft ) velocity.x -= direction.x * speed * delta;
    if ( incHeight || decHeight ) velocity.y -= direction.y * speed * delta;
    if ( moveForward || moveBackward ) velocity.z -= direction.z * speed * delta;

    scope.getObject().translateX( -velocity.x * delta );
    scope.getObject().position.y += ( -velocity.y * delta );
    scope.getObject().translateZ( velocity.z * delta );

    prevTime = time;
  };
};

//--------------------------------------------------------------------------------------------------------------------------
// End - Camera Controller
// Display and Remove Instructions
//--------------------------------------------------------------------------------------------------------------------------

// Display instructions on html document and lock the pointer used for the mouse
var instructions = document.querySelector("#instructions");
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
if ( havePointerLock ) {
  var element = document.body;
  var pointerlockchange = function ( event ) {
    if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
      controls.enabled = true;
      instructions.style.display = 'none';
    } else {
      controls.enabled = false;
      instructions.style.display = '-webkit-box';
    }
  };
  var pointerlockerror = function ( event ) {
    instructions.style.display = 'none';
  };

  document.addEventListener( 'pointerlockchange', pointerlockchange, false );
  document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
  document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
  document.addEventListener( 'pointerlockerror', pointerlockerror, false );
  document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
  document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

  // Remove instructions on html document and unlock the pointer used for the mouse
  instructions.addEventListener( 'click', function ( event ) {
    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
    if ( /Firefox/i.test( navigator.userAgent ) ) {
      var fullscreenchange = function ( event ) {
        if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
          document.removeEventListener( 'fullscreenchange', fullscreenchange );
          document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
          element.requestPointerLock();
        }
      };
      document.addEventListener( 'fullscreenchange', fullscreenchange, false );
      document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
      element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
      element.requestFullscreen();
    } else {
      element.requestPointerLock();
    }
  }, false );
} else {
  instructions.innerHTML = 'Your browser not suported PointerLock';
}

//--------------------------------------------------------------------------------------------------------------------------
// End - Instructions
// Initialise Scene
//--------------------------------------------------------------------------------------------------------------------------

var clock, camera, scene, renderer, controls, structure, SpotLights;
const mixers = [];

init();
animate();

function init() {

  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 300 );
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x000000 );
  scene.fog = new THREE.Fog( 0xc0c0c0, 0, 100 );

  renderer = new THREE.WebGLRenderer( { antialias: true, powerPreference: "high-performance" } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.enabled = true;
  document.body.appendChild( renderer.domElement );
  renderer.outputEncoding = THREE.sRGBEncoding;
  //reduce pixelration to increase fps
  renderer.setPixelRatio( window.devicePixelRatio * 1 );

  window.addEventListener( 'resize', onWindowResize, false );

  controls = new FirstPersonControls( camera );
  scene.add( controls.getObject() );

  var nullMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide});

  // welcome message - I used a tutorial to help me with this part however it results in a 1x1x1 cube rather than textGeometry
  /* 
  const fontLoader = new FontLoader();

  const font = fontLoader.load( 'https://unpkg.com/three@0.148.0/examples/fonts/helvetiker_regular.typeface.json' );

  var textOptions = {
    font: font,
    size: 10,
    height: 0.1,
    curveSegments: 12,
    bevelEnabled: false,
    material: 0, extrudeMaterial: 0.1
  };

  const text = 'Student ID: W20005109\nTo Start: Move Forards';
  const textGeometry = new TextGeometry( text, textOptions );

  textGeometry.computeBoundingBox();
  const centreOffsetText0 = -0.5 * ( textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x );

  const textMesh = new THREE.Mesh( textGeometry, nullMaterial );
  textMesh.position.set ( 8.8+centreOffsetText, 1.65, 8 );
  textMesh.rotation.y = Math.PI * 2;
  scene.add( textMesh );
  */


  // Model loader
  const gltfLoader = new GLTFLoader();
  
  function beerTap( x, y, z, rx, ry, rz, size, parent) {
    // beer tap - "Draught Of Beer" (https://skfb.ly/oBCJv) by Sirolalo is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
     gltfLoader.load( 'models/beerTap/scene.gltf', function ( gltf ) {
      gltf.scene.traverse( function( node ) { if ( node.isMesh ) { node.castShadow = true; node.receiveShadow = true; } } );
      beerTap = gltf.scene.children[0];
      beerTap.material = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('models/beerTap/textures/M_DraughtOfBeer_baseColor.png'),
        shininess: 100
      });
      beerTap.scale.set(size, size, size);
      beerTap.position.set(x, y, z);
      beerTap.rotation.set(rx, ry, rz);
      parent.add( beerTap );

    });
  }

  function beerBottle( x, y, z, rx, ry, rz, size, parent) {
    // beer bottle - "Bitcoin Beer Bottle - Hodler" (https://skfb.ly/oAHuB) by BitGem is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
    gltfLoader.load( 'models/beerBottle/scene.gltf', function ( gltf ) {
      gltf.scene.traverse( function( node ) { if ( node.isMesh ) { node.castShadow = true; node.receiveShadow = true; } } );
      beerBottle = gltf.scene.children[0];
      beerBottle.material = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('models/beerBottle/textures/beer_bottle_texture_mat_baseColor.jpeg'),
        shininess: 100
      });
      beerBottle.scale.set(size, size, size);
      beerBottle.position.set(x, y, z);
      beerBottle.rotation.set(rx, ry, rz);
      parent.add( beerBottle );
    });
  }

  function spiritBottle( x, y, z, rx, ry, rz, size, parent) {
    // spirit bottle - "fake vodka bottle" (https://skfb.ly/ou6EN) by sdallas is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
    gltfLoader.load( 'models/spiritBottle/scene.gltf', function ( gltf ) {
      gltf.scene.traverse( function( node ) { if ( node.isMesh ) { node.castShadow = true; node.receiveShadow = true; } } );
      spiritBottle = gltf.scene.children[0];
      spiritBottle.material = new THREE.MeshPhongMaterial({ 
        map: new THREE.TextureLoader().load('models/spiritBottle/textures/Bottleclear_baseColor.png'),
        normalMap: new THREE.TextureLoader().load('models/spiritBottle/textures/Bottleclear_normal.png'),
        shininess: 100,
        reflectivity: 1
       });
      spiritBottle.scale.set(size, size, size);
      spiritBottle.position.set(x, y, z);
      spiritBottle.rotation.set(rx, ry, rz);
      parent.add( spiritBottle );
    });
  }

  function dartBoard( x, y, z, rx, ry, rz, size, parent) {
    // dart board - "Dart Board" (https://skfb.ly/6wPwD) by danny_p3d is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
    gltfLoader.load( 'models/dartBoard/scene.gltf', function ( gltf ) {
      gltf.scene.traverse( function( node ) { if ( node.isMesh ) { node.castShadow = true; node.receiveShadow = true; } } );
      dartBoard = gltf.scene.children[0];
      dartBoard.material = new THREE.MeshPhongMaterial({ map: 'models/dartBoard/textures/DartBoard_MAT_baseColor.jpeg' });
      dartBoard.scale.set(size, size, size);
      dartBoard.position.set(x, y, z);
      dartBoard.rotation.set(rx, ry, rz);
      parent.add( dartBoard );
    });
  }

  function dancer( x, y, z, rx, ry, rz, size, parent) {
    // dancer - "DANCING STORMTROOPER" (https://skfb.ly/WVIA) by StrykerDoesAnimation is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
    gltfLoader.load( 'models/dancer/scene.gltf', function ( gltf ) {
      gltf.scene.traverse( function( node ) { if ( node.isMesh ) { node.castShadow = true; node.receiveShadow = true; } } );
      dancer = gltf.scene.children[0];
      const mixer = new THREE.AnimationMixer( dancer );
      mixer.clipAction( gltf.animations[0] ).play();
      mixers.push( mixer );
      dancer.material = new THREE.MeshPhongMaterial({ map: 'models/dancer/textures/Stormtroopermat_baseColor.png' });
      dancer.scale.set(size, size, size);
      dancer.position.set(x, y, z);
      dancer.rotation.set(rx, ry, rz);
      parent.add( dancer );
    });
  }

  function poolTable( x, y, z, rx, ry, rz, size, parent) {
    //pool table - "Low Poly Pool Table" (https://skfb.ly/6Tryx) by Digitalis Reality is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
    gltfLoader.load( 'models/poolTable/scene.gltf', function ( gltf ) {
      gltf.scene.traverse( function( node ) { if ( node.isMesh ) { node.castShadow = true; node.receiveShadow = true; } } );
      poolTable = gltf.scene.children[0];
      poolTable.scale.set(size, size, size);
      poolTable.position.set(x, y, z);
      poolTable.rotation.set(rx, ry, rz);
      parent.add( poolTable );
    });
  }


  // Textures
  const tifLoader = new TIFFLoader();

  const concreteFloorMap = tifLoader.load('textures/concretePolished/concretePolishedMap.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 10, 5 );
  });
  const concreteFloorNormalMap = tifLoader.load('textures/concretePolished/concretePolishedMapNormal.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 10, 5 );
  });
  const concreteFloorRoughnessMap = tifLoader.load('textures/concretePolished/concretePolishedMapRoughness.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 10, 5 );
  });

  const brickWallMap = tifLoader.load('textures/brickWall/brickWallMap.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 4, 1 );
  });
  const brickWallNormalMap = tifLoader.load('textures/brickWall/brickWallMapNormal.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 4, 1 );
  });
  const brickWallRoughnessMap = tifLoader.load('textures/brickWall/brickWallMapRoughness.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 4, 1 );
  });
  const brickWallAOMap = tifLoader.load('textures/brickWall/brickWallMapAO.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 4, 1 );
  });
  const brickWallBumpMap = tifLoader.load('textures/brickWall/brickWallMapBump.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 4, 1 );
  });

  const plasterMap = tifLoader.load('textures/plaster/plasterMap.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 2, 1 );
  });
  const plasterNormalMap = tifLoader.load('textures/plaster/plasterMapNormal.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 2, 1 );
  });
  const plasterAOMap = tifLoader.load('textures/plaster/plasterMapAO.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 2, 1 );
  });

  const woodGrainMap = tifLoader.load('textures/woodGrain/woodGrainMap.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 0.5, 1 );
  });
  const woodGrainNormalMap = tifLoader.load('textures/woodGrain/woodGrainMapNormal.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 0.5, 1 );
  });
  const woodGrainRoughnessMap = tifLoader.load('textures/woodGrain/woodGrainMapRoughness.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 0.5, 1 );
  });
  const woodGrainAOMap = tifLoader.load('textures/woodGrain/woodGrainMapAO.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 0.5, 1 );
  });

  const woodPatternMap = tifLoader.load('textures/woodPattern/woodPatternMap.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 3, 1.25 );
  });
  const woodPatternNormalMap = tifLoader.load('textures/woodPattern/woodPatternMapNormal.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 3, 1.25 );
  });
  const woodPatternRoughnessMap = tifLoader.load('textures/woodPattern/woodPatternMapRoughness.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 3, 1.25 );
  });

  const woodTilesMap = tifLoader.load('textures/woodTiles/woodTilesMap.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1, 1 );
  });
  const woodTilesNormalMap = tifLoader.load('textures/woodTiles/woodTilesMapNormal.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1, 1 );
  });
  const woodTilesRoughnessMap = tifLoader.load('textures/woodTiles/woodTilesMapRoughness.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1, 1 );
  });
  const woodTilesAOMap = tifLoader.load('textures/woodTiles/woodTilesMapAO.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1, 1 );
  });
  const woodTilesBumpMap = tifLoader.load('textures/woodTiles/woodTilesMapBump.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1, 1 );
  });

  const marbleMap = tifLoader.load('textures/marble/marbleMap.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1, 1 );
  });
  const marbleNormalMap = tifLoader.load('textures/marble/marbleMapNormal.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1, 1 );
  });
  const marbleRoughnessMap = tifLoader.load('textures/marble/marbleMapRoughness.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1, 1 );
  });

  const doorWoodMap = tifLoader.load('textures/doorWood/doorWoodMap.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1, 2 );
  });
  const doorWoodNormalMap = tifLoader.load('textures/doorWood/doorWoodMapNormal.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1, 2 );
  });
  const doorWoodAOMap = tifLoader.load('textures/doorWood/doorWoodMapAO.tif', function ( texture ) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1, 2 );
  });

  const glowMap = new THREE.TextureLoader().load('textures/glow.png');


  // matertials

  const concreteFloorMaterial = new THREE.MeshStandardMaterial( {
    map: concreteFloorMap,
    normalMap: concreteFloorNormalMap,
    roughnessMap: concreteFloorRoughnessMap,
    side: THREE.DoubleSide,
    color: 0x505050
  } );

  const darkPlasterMaterial = new THREE.MeshPhongMaterial( {
    map: plasterMap,
    normalMap: plasterNormalMap,
    aoMap: plasterAOMap,
    side: THREE.DoubleSide,
    color: 0x505050
  } );

  const lightPlasterMaterial = new THREE.MeshPhongMaterial( {
    map: plasterMap,
    normalMap: plasterNormalMap,
    aoMap: plasterAOMap,
    side: THREE.DoubleSide,
    color: 0xe0e0e0
  } );

  const brickWallMaterial = new THREE.MeshStandardMaterial( {
    map: brickWallMap,
    normalMap: brickWallNormalMap,
    roughnessMap: brickWallRoughnessMap,
    aoMap: brickWallAOMap,
    bumpMap: brickWallBumpMap,
    side : THREE.DoubleSide
  } );

  const woodGrainMaterial = new THREE.MeshStandardMaterial( {
    map: woodGrainMap,
    normalMap: woodGrainNormalMap,
    roughnessMap: woodGrainRoughnessMap,
    aoMap: woodGrainAOMap,
    side : THREE.DoubleSide
  } );

  const woodPatternMaterial = new THREE.MeshStandardMaterial( {
    map: woodPatternMap,
    normalMap: woodPatternNormalMap,
    roughnessMap: woodPatternRoughnessMap,
    side : THREE.DoubleSide
  } );

  const woodTilesMaterial = new THREE.MeshStandardMaterial( {
    map: woodTilesMap,
    normalMap: woodTilesNormalMap,
    roughnessMap: woodTilesRoughnessMap,
    aoMap: woodTilesAOMap,
    bumpMap: woodTilesBumpMap,
    side : THREE.DoubleSide,
    color: 0x5f3723
  } );

  const marbleMaterial = new THREE.MeshStandardMaterial( {
    map: marbleMap,
    normalMap: marbleNormalMap,
    roughnessMap: marbleRoughnessMap,
    side : THREE.DoubleSide
  } );

  const doorWoodMaterial = new THREE.MeshPhongMaterial( {
    map: doorWoodMap,
    normalMap: doorWoodNormalMap,
    aoMap: doorWoodAOMap,
    side : THREE.DoubleSide
  } );

  const doorKnobMaterial = new THREE.MeshPhongMaterial( {
    color: 0x1d2739,
    shininess: 100,
    side : THREE.DoubleSide
  } );

  const glowMaterial = new THREE.SpriteMaterial( {
    map: glowMap,
    transparent: true,
    blending: THREE.AdditiveBlending,
    color: 0xfcf9d9
  } );




  // material and texture mapping ends
  // exterior structure starts

  structure = new THREE.Group();

  function doorFunction(){

    const doorObj = new THREE.Group();

    const doorGeometry = new THREE.PlaneGeometry( 0.80, 2.00 );
    const door = new THREE.Mesh( doorGeometry, doorWoodMaterial );
    door.receiveShadow = true;
    doorObj.add(door);

    const doorKnobGeometry = new THREE.PlaneGeometry( 0.15, 0.40 );
    const doorKnob = new THREE.Mesh( doorKnobGeometry, doorKnobMaterial );
    doorKnob.position.set( 0.30, 0.20, 0.01 );
    doorKnob.receiveShadow = true;
    door.add(doorKnob);

    return door;
  }

  const floorGeometry = new THREE.PlaneGeometry( 19.60, 10.00 );
  const floor = new THREE.Mesh( floorGeometry, concreteFloorMaterial );
  floor.rotation.x = - Math.PI / 2;
  floor.receiveShadow = true;
  structure.add(floor);
  
  const entrenceWayGeometry = new THREE.BoxGeometry( 1.60, 0.80, 0.20 );
  const entrenceWay = new THREE.Mesh( entrenceWayGeometry, darkPlasterMaterial );
  entrenceWay.position.set( 8.80, 2.40, 4.90 );
  entrenceWay.rotation.y = 0;
  entrenceWay.castShadow = true;
  entrenceWay.receiveShadow = true;
  structure.add(entrenceWay);

  var wall0003Mats = [
    lightPlasterMaterial, //l
    nullMaterial,//r
    nullMaterial,//t
    nullMaterial,//bo
    darkPlasterMaterial,//f
    brickWallMaterial//ba
  ]
  const wall0003Geometry = new THREE.BoxGeometry( 4.20, 2.80, 2.80 );
  const wall0003 = new THREE.Mesh( wall0003Geometry, wall0003Mats );
  wall0003.position.set( 6.60, 1.40, 2.90 );
  wall0003.rotation.y = Math.PI / 2;
  wall0003.castShadow = true;
  wall0003.receiveShadow = true;
  structure.add(wall0003);

  const wall2door3 = doorFunction();
  wall2door3.position.set( 5.19, 1.00, 1.30 );
  wall2door3.rotation.y = - Math.PI / 2;
  structure.add(wall2door3);

  const wall04Shape = new THREE.Shape();
  wall04Shape.moveTo( 0,0 );
  wall04Shape.lineTo( 0, 2.80 );
  wall04Shape.lineTo( 14.80, 2.80 );
  wall04Shape.lineTo( 14.80, 0 );
  wall04Shape.lineTo( 0, 0 );

  const wall04Hole = new THREE.Path();
  wall04Hole.moveTo( 0.20, 1.70 );
  wall04Hole.lineTo( 0.20, 2.40 );
  wall04Hole.lineTo( 14.60, 2.40 );
  wall04Hole.lineTo( 14.60, 1.70 );
  wall04Hole.lineTo( 0.20, 1.70 );

  wall04Shape.holes.push( wall04Hole );

  const wall04Geometry = new THREE.ExtrudeGeometry( wall04Shape, { depth: 0.20, bevelEnabled: false } );

  const wall04 = new THREE.Mesh( wall04Geometry, darkPlasterMaterial );
  wall04.position.set( -9.6, 0, 4.80 );
  wall04.rotation.y = 0;
  wall04.castShadow = true;
  wall04.receiveShadow = true;
  structure.add(wall04);

  const mirrorGeometry = new THREE.PlaneGeometry( 14.40, 0.70 );
  const Wall04Mirror = new Reflector( mirrorGeometry, {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0x889999
  } );
  Wall04Mirror.position.set( 7.40, 2.05, 0.10 );
  Wall04Mirror.rotation.x = Math.PI;
  wall04.add( Wall04Mirror );

  const wall05Geometry = new THREE.BoxGeometry( 10, 2.80, 0.20 );
  const wall05 = new THREE.Mesh( wall05Geometry, brickWallMaterial );
  wall05.position.set( -9.70, 1.40, 0.00 );
  wall05.rotation.y = Math.PI / 2;
  wall05.castShadow = true;
  wall05.receiveShadow = true;
  structure.add(wall05);

  const wall0607Geometry = new THREE.BoxGeometry( 10, 2.80, 0.20 );
  const wall0607 = new THREE.Mesh( wall0607Geometry, lightPlasterMaterial );
  wall0607.position.set( -4.80, 1.40, -4.90 );
  wall0607.rotation.y = 0;
  wall0607.castShadow = true;
  wall0607.receiveShadow = true;
  structure.add(wall0607);

  const wall06door07 = doorFunction();
  wall06door07.position.set( -5.80, 1.00, -4.79 );
  wall06door07.receiveShadow = true;
  structure.add(wall06door07);

  const wall0810Geometry = new THREE.BoxGeometry( 7.80, 2.80, 1.00 );
  const wall0810 = new THREE.Mesh( wall0810Geometry, lightPlasterMaterial );
  wall0810.position.set( 4.10, 1.40, -4.50 );
  wall0810.rotation.y = 0;
  wall0810.castShadow = true;
  wall0810.receiveShadow = true;
  structure.add(wall0810);

  const wall08door10 = doorFunction();
  wall08door10.position.set( 0.80, 1.00, -3.99 );
  wall08door10.receiveShadow = true;
  structure.add(wall08door10);

  const wall1113Geometry = new THREE.BoxGeometry( 2.20, 2.80, 2.70 );
  const wall1113 = new THREE.Mesh( wall1113Geometry, darkPlasterMaterial );
  wall1113.position.set( 8.70, 1.40, -3.65 );
  wall1113.rotation.y = 0; 
  wall1113.castShadow = true;
  wall1113.receiveShadow = true;
  structure.add(wall1113);

  const wall11door13 = doorFunction();
  wall11door13.position.set( 7.59, 1.00, -3.50 );
  wall11door13.rotation.y = - Math.PI / 2;
  wall11door13.receiveShadow = true;
  structure.add(wall11door13);

  const wall14Geometry = new THREE.BoxGeometry( 10 , 2.80, 0.20);
  const wall14 = new THREE.Mesh( wall14Geometry, darkPlasterMaterial );
  wall14.position.set( 9.70, 1.40, 0 );
  wall14.rotation.y = Math.PI / 2;
  wall14.castShadow = true;
  wall14.receiveShadow = true;
  structure.add(wall14);

  const ceilingGeometry = new THREE.PlaneGeometry( 19.60, 10.00 );
  const ceiling = new THREE.Mesh( ceilingGeometry, darkPlasterMaterial );
  ceiling.position.set( 0, 2.80, 0 );
  ceiling.rotation.x = - Math.PI / 2;
  ceiling.receiveShadow = true;
  structure.add(ceiling);

  // exterior structure ends
  // interior structure starts

  const stairsShape = new THREE.Shape();
  
  stairsShape.moveTo(0.00, 0.00);
  stairsShape.lineTo(0.00, -0.40);
  stairsShape.lineTo(0.50, -0.40);
  stairsShape.lineTo(0.50, -0.20);
  stairsShape.lineTo(0.25, -0.20);
  stairsShape.lineTo(0.25, 0.00);
  stairsShape.lineTo(0.00, 0.00);
  
  const stairExtrudeSettings = { depth: 1.60, bevelEnabled: false };
  const stairGeometry = new THREE.ExtrudeGeometry( stairsShape, stairExtrudeSettings );
  const stair = new THREE.Mesh( stairGeometry, woodGrainMaterial );
  stair.position.set( 3.60, 0.40, 2.60 );
  stair.rotation.y = Math.PI / 2;
  stair.castShadow = true;
  stair.receiveShadow = true;
  structure.add(stair);

  const stair1 = new THREE.Mesh( stairGeometry, woodGrainMaterial );
  stair1.position.set( -3.20, 0.40, 2.60  );
  stair1.rotation.y = Math.PI / 2;
  stair1.castShadow = true;
  stair1.receiveShadow = true;
  structure.add(stair1);

  const raisedFloorGeometry = new THREE.BoxGeometry( 11.00, 0.60, 2.20 );
  const raisedFloor = new THREE.Mesh( raisedFloorGeometry, woodPatternMaterial );
  raisedFloor.position.set( -0.30, 0.30, 3.70 );
  raisedFloor.castShadow = true;
  raisedFloor.receiveShadow = true;
  structure.add(raisedFloor);

  const partitionWall0Geometry = new THREE.BoxGeometry( 5.20, 1.50, 0.50 );
  const partitionWall0 = new THREE.Mesh( partitionWall0Geometry, darkPlasterMaterial );
  partitionWall0.position.set( 1.00, 0.75, 2.35 );
  partitionWall0.castShadow = true;
  partitionWall0.receiveShadow = true;
  structure.add(partitionWall0);

  const spiralPilarGeometry = new THREE.BoxBufferGeometry( 0.25, 1.30, 0.25, 6, 24, 6 );

  twisting(spiralPilarGeometry, 2*Math.PI);

  function twisting(geometry, radian) {
    const quaternion = new THREE.Quaternion();
    
    var positionAttribute = geometry.getAttribute("position");
    const vertex = new THREE.Vector3();
    for (let vertexIndex = 0; vertexIndex < positionAttribute.count; vertexIndex++){
      vertex.fromBufferAttribute(positionAttribute, vertexIndex);
  
      const yPos = vertex.y;
      const upVec = new THREE.Vector3(0, 1, 0);
  
      quaternion.setFromAxisAngle(upVec, radian*yPos);
  
      vertex.applyQuaternion(quaternion);
  
      geometry.attributes.position.setXYZ(vertexIndex, vertex.x, vertex.y, vertex.z);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

  }

  const spiralPilar0 = new THREE.Mesh( spiralPilarGeometry, woodGrainMaterial );
  spiralPilar0.position.set( 2.35, 1.40, 0.00 );
  spiralPilar0.castShadow = true;
  spiralPilar0.receiveShadow = true;
  partitionWall0.add(spiralPilar0);

  const spiralPilar1 = new THREE.Mesh( spiralPilarGeometry, woodGrainMaterial );
  spiralPilar1.position.set( -2.35, 1.40, 0.00 );
  spiralPilar1.castShadow = true;
  spiralPilar1.receiveShadow = true;
  partitionWall0.add(spiralPilar1);

  const tableGeometry = new THREE.BoxGeometry( 4.50, 0.10, 0.40 );
  const table = new THREE.Mesh( tableGeometry, woodPatternMaterial );
  table.position.set( 0.00, 0.30, -0.45 );
  table.castShadow = true;
  table.receiveShadow = true;
  partitionWall0.add(table);

  const tableLegGeometry = new THREE.CylinderGeometry( 0.02, 0.02, 1.05, 6 , 6 );

  const tableLeg0 = new THREE.Mesh( tableLegGeometry, doorKnobMaterial );
  tableLeg0.position.set( 2.2, -0.525, -0.15 );
  tableLeg0.castShadow = true;
  tableLeg0.receiveShadow = true;
  table.add(tableLeg0);

  const tableLeg1 = new THREE.Mesh( tableLegGeometry, doorKnobMaterial );
  tableLeg1.position.set( -2.2, -0.525, -0.15 );
  tableLeg1.castShadow = true;
  tableLeg1.receiveShadow = true;
  table.add(tableLeg1);

  const partitionWall1Geometry = new THREE.BoxGeometry( 3.10, 1.50, 0.50 );
  const partitionWall1 = new THREE.Mesh( partitionWall1Geometry, darkPlasterMaterial );
  partitionWall1.position.set( -4.75, 0.75, 2.35 );
  partitionWall1.castShadow = true;
  partitionWall1.receiveShadow = true;
  structure.add(partitionWall1);

  const spiralPilar2 = new THREE.Mesh( spiralPilarGeometry, woodGrainMaterial );
  spiralPilar2.position.set( 1.30, 1.40, 0.00 );
  spiralPilar2.castShadow = true;
  spiralPilar2.receiveShadow = true;
  partitionWall1.add(spiralPilar2);

  const spiralPilar3 = new THREE.Mesh( spiralPilarGeometry, woodGrainMaterial );
  spiralPilar3.position.set( -1.30, 1.40, 0.00 );
  spiralPilar3.castShadow = true;
  spiralPilar3.receiveShadow = true;
  partitionWall1.add(spiralPilar3);

  const partitionWall2Geometry = new THREE.BoxGeometry( 0.50, 1.50, 2.20 );
  const partitionWall2 = new THREE.Mesh( partitionWall2Geometry, darkPlasterMaterial );
  partitionWall2.position.set( -6.05, 0.75, 3.70 );
  partitionWall2.castShadow = true;
  partitionWall2.receiveShadow = true;
  structure.add(partitionWall2);

  const barShape = new THREE.Shape();

  barShape.moveTo(0.00, 0.00);
  barShape.lineTo(-5.80, 0.00);
  barShape.lineTo(-5.80, 0.75);
  barShape.lineTo(-5.45, 0.75);
  barShape.lineTo(-5.45, 0.35);
  barShape.lineTo(0.00, 0.35);
  barShape.lineTo(0.00, 0.00);

  const barExtrudeSettings = { depth: 0.95, bevelEnabled: false };
  const barGeometry = new THREE.ExtrudeGeometry( barShape, barExtrudeSettings );
  
  const bar = new THREE.Mesh( barGeometry, woodTilesMaterial );
  bar.position.set( 7.60, 0, -2.35 );
  bar.rotation.x = -Math.PI / 2;
  bar.castShadow = true;
  bar.receiveShadow = true;
  structure.add(bar);

  const barTopShape = new THREE.Shape();

  barTopShape.moveTo(0.00, 0.00);
  barTopShape.lineTo(-5.85, 0.00);
  barTopShape.lineTo(-5.85, 0.85);
  barTopShape.lineTo(-5.40, 0.85);
  barTopShape.lineTo(-5.40, 0.45);
  barTopShape.lineTo(0.00, 0.45);
  barTopShape.lineTo(0.00, 0.00);

  const barTopExtrudeSettings = { depth: 0.05, bevelEnabled: false };
  const barTopGeometry = new THREE.ExtrudeGeometry( barTopShape, barTopExtrudeSettings );

  const barTop = new THREE.Mesh( barTopGeometry, marbleMaterial );
  barTop.position.set( 0, -0.05, 0.95 );
  barTop.castShadow = true;
  barTop.receiveShadow = true;
  bar.add(barTop);

  const barTop2Geometry = new THREE.BoxGeometry( 0.45, 0.95, 0.05 );
  const barTop2 = new THREE.Mesh( barTop2Geometry, marbleMaterial );
  barTop2.position.set( -5.625, 0.775, 0.475 );
  barTop2.rotation.x = Math.PI / 2;
  barTop2.castShadow = true;
  barTop2.receiveShadow = true;
  bar.add(barTop2);
  

  const stageShape = new THREE.Shape();
  
  stageShape.moveTo(0.00, 0.00);
  stageShape.lineTo(0.00, 2.80);
  stageShape.lineTo(1.40, 2.80);
  stageShape.quadraticCurveTo(2.80, 2.80, 2.80, 1.40);
  stageShape.lineTo(2.80, 0.00);
  stageShape.lineTo(0.00, 0.00);
  
  const stageExtrudeSettings = { depth: 0.40, bevelEnabled: false };
  const stageGeometry = new THREE.ExtrudeGeometry( stageShape, stageExtrudeSettings );
  const stage = new THREE.Mesh( stageGeometry, woodGrainMaterial );
  stage.position.set( -9.6, 0.4, -4.8  );
  stage.rotation.x = Math.PI / 2;
  stage.castShadow = true;
  stage.receiveShadow = true;
  structure.add(stage);

  // objects

  beerTap( -1, 0.25, 0.00, Math.PI, Math.PI, 0, 0.9, barTop );
  beerTap( -3.5, 0.25, 0.00, Math.PI, Math.PI, 0, 0.9, barTop );
  
  spiritBottle( -5, 0.25, 0.05, 0, 0, -Math.PI/2, 3, barTop );
  spiritBottle( -5.05, 0.20, 0.05, 0, 0, -Math.PI/2, 3, barTop );
  spiritBottle( -5.10, 0.25, 0.05, 0, 0, -Math.PI/2, 3, barTop );

  beerBottle( 1.2, 0.20, 0, -Math.PI/2, 0, Math.PI, 0.35, table );
  beerBottle( -1.60, 0.20, 0, -Math.PI/2, 0, 0.9*Math.PI, 0.35, table );
  beerBottle( -1.75, 0.20, 0, -Math.PI/2, 0, 1.1*Math.PI, 0.35, table );

  dartBoard( 5.19, 2.10, 3.70, -Math.PI/2, 0, -Math.PI/2, 0.01, structure );

  dancer( 1.5, 1.5, 0, Math.PI, 0, Math.PI/3, 0.5, stage );

  poolTable( -7.825, 0.2, 2.4, -Math.PI/2, 0, Math.PI/2, 0.15, structure );
  poolTable( -2.60, 0.2, -3, -Math.PI/2, 0, 0, 0.15, structure );

  // Lighting

  // gui the intensity of hemispherelight
  var light = new THREE.HemisphereLight( 0xffffff, 0xb0b0b0, 0.275 );
  light.position.set( 0, 10, 0 );


  const color0 = new THREE.Color( 0xff0000 )
  const color1 = new THREE.Color( 0xff7d00 )
  const color2 = new THREE.Color( 0xffff00 )
  const color3 = new THREE.Color( 0x7dff00 )
  const color4 = new THREE.Color( 0x00ff00 )
  const color5 = new THREE.Color( 0x00ff7d )
  const color6 = new THREE.Color( 0x00ffff )
  const color7 = new THREE.Color( 0x007dff )
  const color8 = new THREE.Color( 0x0000ff )
  const color9 = new THREE.Color( 0x7d00ff )
  const color10 = new THREE.Color( 0xff00ff )
  const color11 = new THREE.Color( 0xff007d )

  var colorArray = [ color0, color1, color2, color3, color4, color5, color6, color7, color8, color9, color10, color11 ];
    
  function randomColor(colorArray)
  {
    
  return colorArray[Math.floor(Math.random()*colorArray.length)];
        
  }

  function randomAngleBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

function SpotLightsFunction(){
  // spotlights gui should have randomRotation, (randomColor(colorArray)) and intensity(slider 0-1)
  SpotLights = new THREE.Group();
  
  const lightBaseGeometry = new THREE.BoxGeometry( 0.50 , 0.20, 0.50);
  const lightHousingGeometry = new THREE.CylinderGeometry( 0.035, 0.070, 0.15, 6 );
  const lensGeometry = new THREE.CylinderGeometry( 0.070, 0.070, 0.001, 6 );

  const lightBaseMaterial = new THREE.MeshBasicMaterial( { color: 0x000000 } );
  const lensMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } );

  const lightBase = new THREE.Mesh( lightBaseGeometry, lightBaseMaterial );
  lightBase.position.set( 0, 0, 0 );
  SpotLights.add(lightBase);

  // max x rotation is 0 and min is -pI/3
  // max z rotation is pI/4 and min is 0
  const lightHousing0 = new THREE.Mesh( lightHousingGeometry, lightBaseMaterial );
  lightHousing0.position.set( 0.125, -0.15, 0.125 );
  lightHousing0.rotation.x = ( randomAngleBetween( -Math.PI / 3 , 0 ) );
  lightHousing0.rotation.z = ( randomAngleBetween( 0, Math.PI / 4 ) );
  lightBase.add(lightHousing0);
  const lens0 = new THREE.Mesh( lensGeometry, lensMaterial );
  lens0.position.set( 0, -0.076, 0 )
  lightHousing0.add(lens0);

  // max x rotation is 0 and min is -pI/3
  // max z rotation is 0 and min is -pI/4
  const lightHousing1 = new THREE.Mesh( lightHousingGeometry, lightBaseMaterial );
  lightHousing1.position.set( -0.125, -0.15, 0.125 );
  lightHousing1.rotation.x = ( randomAngleBetween( - Math.PI / 3 , 0 ) );
  lightHousing1.rotation.z = ( randomAngleBetween( - Math.PI / 4 , 0 ) );
  lightBase.add(lightHousing1);
  const lens1 = new THREE.Mesh( lensGeometry, lensMaterial );
  lens1.position.set( 0, -0.076, 0 )
  lightHousing1.add(lens1);

  // max x rotation is pI/4 and min is 0
  // max z rotation is pI/3 and min is 0
  const lightHousing2 = new THREE.Mesh( lightHousingGeometry, lightBaseMaterial );
  lightHousing2.position.set( 0.125, -0.15, -0.125 );
  lightHousing2.rotation.x = ( randomAngleBetween( 0, Math.PI / 4 ) );
  lightHousing2.rotation.z = ( randomAngleBetween( 0, Math.PI / 3 ) );
  lightBase.add(lightHousing2);
  const lens2 = new THREE.Mesh( lensGeometry, lensMaterial );
  lens2.position.set( 0, -0.076, 0 )
  lightHousing2.add(lens2);

  // max x rotation is pI/4 and min is 0
  // max z rotation is 0 and min is -pI/3
  const lightHousing3 = new THREE.Mesh( lightHousingGeometry, lightBaseMaterial );
  lightHousing3.position.set( -0.125, -0.15, -0.125 );
  lightHousing3.rotation.x = ( randomAngleBetween( 0, Math.PI / 4 ) );
  lightHousing3.rotation.z = ( randomAngleBetween( - Math.PI / 3, 0 ) );
  lightBase.add(lightHousing3);
  const lens3 = new THREE.Mesh( lensGeometry, lensMaterial );
  lens3.position.set( 0, -0.076, 0 )
  lightHousing3.add(lens3);

  const spotLight0 = new THREE.SpotLight( (randomColor(colorArray)), 0.35, 20, Math.PI / 8);
  spotLight0.position.set( 0, 0, 0 );
  spotLight0.castShadow = true;
  spotLight0.shadow.mapSize.width = 1024;
  spotLight0.shadow.mapSize.height = 1024;
  spotLight0.shadow.camera.near = 0.5;
  spotLight0.shadow.camera.far = 100;
  spotLight0.shadow.camera.fov = 30;
  spotLight0.target = lens0;
  lightHousing0.add(spotLight0);

  const spotLight1 = new THREE.SpotLight( (randomColor(colorArray)), 0.35, 20, Math.PI / 8);
  spotLight1.position.set( 0, 0, 0 );
  spotLight1.castShadow = true;
  spotLight1.shadow.mapSize.width = 1024;
  spotLight1.shadow.mapSize.height = 1024;
  spotLight1.shadow.camera.near = 0.5;
  spotLight1.shadow.camera.far = 100;
  spotLight1.shadow.camera.fov = 30;
  spotLight1.target = lens1;
  lightHousing1.add(spotLight1);

  const spotLight2 = new THREE.SpotLight( (randomColor(colorArray)), 0.35, 20, Math.PI / 8);
  spotLight2.position.set( 0, 0, 0 );
  spotLight2.castShadow = true;
  spotLight2.shadow.mapSize.width = 1024;
  spotLight2.shadow.mapSize.height = 1024;
  spotLight2.shadow.camera.near = 0.5;
  spotLight2.shadow.camera.far = 100;
  spotLight2.shadow.camera.fov = 30;
  spotLight2.target = lens2;
  lightHousing2.add(spotLight2);

  const spotLight3 = new THREE.SpotLight( (randomColor(colorArray)), 0.35, 20, Math.PI / 8);
  spotLight3.position.set( 0, 0, 0 );
  spotLight3.castShadow = true;
  spotLight3.shadow.mapSize.width = 1024;
  spotLight3.shadow.mapSize.height = 1024;
  spotLight3.shadow.camera.near = 0.5;
  spotLight3.shadow.camera.far = 100;
  spotLight3.shadow.camera.fov = 30;
  spotLight3.target = lens3;
  lightHousing3.add(spotLight3);

  return SpotLights;
}
  
  var SpotLights0 = SpotLightsFunction();
  SpotLights0.position.set( -5.85, -0.2, 0 );
  SpotLights0.rotation.x = Math.PI / 2;

  var SpotLights1 = SpotLightsFunction();
  SpotLights1.position.set( -2.10, -0.2, 0 );
  SpotLights1.rotation.x = Math.PI / 2;

  var SpotLights2 = SpotLightsFunction();
  SpotLights2.position.set( 1.65, -0.2, 0 );
  SpotLights2.rotation.x = Math.PI / 2;

  // blubs per metre must be an integer
  function FairyLightsFunction( stringLength, bulbsPerMetre){

    const noBulbs = stringLength * bulbsPerMetre;

    const FairyLights = new THREE.Group();
 
    const stringGeometry = new THREE.CylinderGeometry( 0.0025, 0.0025, stringLength, 6, 1 );
    const stringMaterial = new THREE.MeshPhongMaterial( { color: 0x000000, } );
    const string = new THREE.Mesh( stringGeometry, stringMaterial );
    FairyLights.add(string);

    const bulbGeometry = new THREE.SphereGeometry( 0.01, 4, 4 );
    const bulbMaterial = new THREE.MeshPhongMaterial( {
      emissive: 0xffffee,
      emissiveIntensity: 1,
      shininess: 100,
      color: 0xffffee
    } );

    var bulbs = 0;
    for ( var i = 0; i < noBulbs; i++ ) {
      
      // spawns too many lights - requies too much processing power
      //bulbs = new THREE.PointLight( 0xffee8b, 0.01, 5, 2 );
      //bulbs.castShadow = true;
      //bulbs.add( new THREE.Mesh( bulbGeometry, bulbMaterial ) );
      //bulbs.position.set( 0, ( i / bulbsPerMetre ), 0 );

      bulbs = new THREE.Mesh( bulbGeometry, bulbMaterial );
      bulbs.position.set( 0, ( stringLength / 2 ) - ( i / bulbsPerMetre ), 0 );

      string.add(bulbs);

      const glow = new THREE.Sprite( glowMaterial );
      glow.scale.set( 0.1, 0.1, 0.1 );
      bulbs.add( glow );

      bulbs++;

    }

    return FairyLights;
  }

  for ( var i = 0; i < 24; i++ ) {

    const FairyLightWall4 = FairyLightsFunction(2.8, 6);
    FairyLightWall4.position.set( -9.59, 1.40, -4.80 + ( i * 0.4 ) );
    scene.add(FairyLightWall4);

  }

  for ( var i = 0; i < 8; i++ ) {

    const FairyLightStage = FairyLightsFunction(2.8, 6);
    FairyLightStage.position.set( -9.59 + ( i * 0.4 ), 1.40, -4.79 );
    scene.add(FairyLightStage);

  }
  
  
  // Add everything to the scene
  
  scene.add( structure );

  ceiling.add( SpotLights0 );
  ceiling.add( SpotLights1 );
  ceiling.add( SpotLights2 );

  scene.add( light );


}

//--------------------------------------------------------------------------------------------------------------------------
// End - Scene
// Required Functions - Animate etc.
//--------------------------------------------------------------------------------------------------------------------------

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

  requestAnimationFrame( animate );

  if ( controls.enabled === true ) {

    controls.update();
    camera.updateProjectionMatrix();
    
  }

  renderer.render( scene, camera );

  const deltaUpdate = clock.getDelta();

	for ( const mixer of mixers ) mixer.update( deltaUpdate )

}

function randomPosition(radius) {
  radius = radius * Math.random();
  var theta = Math.random() * 2.0 * Math.PI;
  var phi = Math.random() * Math.PI;

  var sinTheta = Math.sin(theta); 
  var cosTheta = Math.cos(theta);
  var sinPhi = Math.sin(phi); 
  var cosPhi = Math.cos(phi);
  var x = radius * sinPhi * cosTheta;
  var y = radius * sinPhi * sinTheta;
  var z = radius * cosPhi;

  return [x, y, z];
}


//--------------------------------------------------------------------------------------------------------------------------
// End - Functions
// GUI
//--------------------------------------------------------------------------------------------------------------------------

var Controlers = function() {

  this.MouseMoveSensitivity = 0.002;
  this.ZoomSensitivity = 1;
  this.speed = 50.0;

};

window.onload = function() {
  var controler = new Controlers();
  var gui = new GUI();
  gui.add(controler, 'MouseMoveSensitivity', 0, 0.005).step(0.001).name('Mouse Sensitivity').onChange(function(value) {
    controls.MouseMoveSensitivity = value;
  });
  gui.add(controler, 'ZoomSensitivity', 0.1, 5).step(0.1).name('Zoom Sensitivity').onChange(function(value) {
    controls.ZoomSensitivity = value;
  });
  gui.add(controler, 'speed', 0, 500).step(10).name('Speed').onChange(function(value) {
    controls.speed = value;
  });
};

//--------------------------------------------------------------------------------------------------------------------------
// End - GUI
//--------------------------------------------------------------------------------------------------------------------------


//--------------------------------------------------------------------------------------------------------------------------

// END

//--------------------------------------------------------------------------------------------------------------------------