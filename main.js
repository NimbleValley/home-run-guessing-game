import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js'
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js'

const loadingMessage = document.getElementById('loading-message');
loadingMessage.style.display = 'flex';

var currentScore = 0;
var bestScore = 0;
if(localStorage.getItem('best') != null) {
  bestScore = localStorage.getItem('best');
}

const currentScoreText = document.getElementById('current-score');
const bestScoreText = document.getElementById('best-score');
bestScoreText.innerText = `Best: ${bestScore}`;

/*     DATA */
var data;
var homerunData = [];

const scene = new THREE.Scene();

const background = new THREE.Color(0x9dbef5);
scene.background = (background);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.setX(15);
camera.position.setY(50);
camera.position.setZ(0);
camera.lookAt(0, 15, -50);

var playerId;
var year;

//HDRI
new RGBELoader()
  .load('textures/syferfontein_0d_clear_puresky_4k.hdr', function (texture) {

    texture.mapping = THREE.EquirectangularReflectionMapping;

    //scene.background = texture;
    scene.background = texture;

    setUpStadium();
  });

//Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.toneMapping = THREE.CineonToneMapping;
renderer.toneMappingExposure = 1;

renderer.render(scene, camera);


//Orbit Control
//const controls = new OrbitControls(camera, renderer.domElement);
//controls.update();


const ballGeometry = new THREE.SphereGeometry(0.1, 32, 16, 100);
const material = new THREE.MeshBasicMaterial({ color: 0xFF6347, wireframe: false });
const ball = new THREE.Mesh(ballGeometry, material);

scene.add(ball);

const loader = new GLTFLoader();

var abb = 'AZ';
var stadium;
var previousAmount = 0;

function setUpStadium() {
  loader.load(`models/Stadium_${abb}.glb`, function (model) {
    stadium = model.scene;
    stadium.castShadow = true;
    stadium.receiveShadow = true;
    stadium.name = 'stadium-mlb';
    scene.add(stadium);
    renderer.render(scene, camera);
    loadingMessage.style.display = 'none';
  });
}

const light = new THREE.AmbientLight(0xffffff, 12);
light.position.y = 10;

scene.add(light);

//1 foot is 19.4 units in 3.js
const SCALE = 19.4 / 90;
const DISTANCE_SCALE = 182 / 128;

const gravity = 32.174 * SCALE;

const options = document.getElementsByClassName('player-option');
for (let i = 0; i < options.length; i++) {
  options[i].addEventListener('click', function () {
    let correctAnswer = '';
    for(let i = 0; i < options.length; i ++) {
      if(options[i].id == 'correct') {
        correctAnswer = options[i].innerText;
      }
    }
    if (this.id == 'correct') {
      alert('Correct!');
      currentScore ++;
      currentScoreText.innerText = currentScore;
      if(currentScore > bestScore) {
        localStorage.setItem('best', currentScore);
        bestScore = currentScore;
        bestScoreText.innerText = `Best: ${bestScore}`;
      }
    } else {
      alert('Incorrect, player was ' + correctAnswer + '.');
      currentScore = 0;
      currentScoreText.innerText = currentScore;
    }
    for (let id = 0; id < previousAmount+1; id++) {
      for (let y = -0.1; y <= 0.1; y += 0.05) {
        for (let x = -0.1; x <= 0.1; x += 0.05) {
          scene.remove(scene.getObjectByName('curve' + String(((x* 10) + 10 + (y * 10 * 20) + 10) + (id*878))));
        }
      }
    }
    newRound();
  });
}

var stadiumIds = [
  /*Ari*/ '15%7C',
  /*Atl*/ '4705%7C',
  /*Bal*/ '2%7C',
  /*Bos*/ '3%7C',
  /*Chc*/ '17%7C',
  /*Cin*/ '2602%7C',
  /*Cle*/ '5%7C',
  /*Col*/ '19%7C',
  /*Cws*/ '4%7C',
  /*Det*/ '2394%7C',
  /*Hou*/ '2392%7C',
  /*Kc*/ '7%7C',
  /*Laa*/ '1%7C',
  /*Lad*/ '22%7C',
  /*Mia*/ '4169%7C',
  /*Mil*/ '32%7C',
  /*Min*/ '3312%7C',
  /*Nym*/ '3289%7C',
  /*Nyy*/ '3313%7C',
  /*Oak*/ '10%7C',
  /*Phi*/ '2681%7C',
  /*Pit*/ '31%7C',
  /*Sd*/ '2680%7C',
  /*Sea*/ '680%7C',
  /*Sf*/ '2395%7C',
  /*Stl*/ '2889%7C',
  /*Tb*/ '12%7C',
  /*Tex*/ '5325%7C',
  /*Tor*/ '14%7C',
  /*Wsh*/ '3309%7C',
  /*None*/ ''
];

function renderHit(row, id) {

  let abb = row[19];
  let initialHeight = row[30] * DISTANCE_SCALE * 3;
  let hitDistance = row[52] * DISTANCE_SCALE;
  let hc_x = row[37];
  let hc_y = row[38];
  let launch_speed_fts = row[53] * 5280 / 3600;
  let launch_angle = row[54] * Math.PI / 180;

  let hc_x_ = hc_x - 125.42;
  let hc_y_ = 198.27 - hc_y;
  let launch_speed_y = launch_speed_fts * Math.sin(launch_angle) * SCALE;

  let spray = Math.atan(hc_x_ / hc_y_) * -180 / Math.PI * 1;

  if (spray > 44.75) {
    spray = 44.75;
  } else if (spray < -44.75) {
    spray = -44.75;
  }

  //Total Hang Time
  var total_time = (launch_speed_y + Math.sqrt(Math.pow(launch_speed_y, 2) + (2 * gravity * initialHeight))) / gravity;

  ball.position.y = initialHeight * SCALE;

  var landingGeometry = new THREE.SphereGeometry(0.25, 32, 16, 100);
  const landing = new THREE.Mesh(landingGeometry, material);

  landing.name = 'landing';
  scene.add(landing);

  landing.position.z = Math.cos(convert(spray)) * hitDistance * SCALE * -1;
  landing.position.y = 0;
  landing.position.x = Math.sin(convert(spray)) * hitDistance * SCALE * -1;

  var maxHeight = (-16.085 * Math.pow(total_time, 2)) + (launch_speed_fts * Math.sin(launch_angle) * (total_time / 2)) + (initialHeight * 2);
  for (let y = -0.1; y <= 0.1; y += 0.05) {
    for (let i = -0.1; i <= 0.1; i += 0.05) {
      let bezier = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(i, y, 0),
        new THREE.Vector3(landing.position.x / 2 + i, maxHeight * SCALE * -1 * DISTANCE_SCALE + y, landing.position.z / 2),
        new THREE.Vector3(landing.position.x + i, landing.position.y + y, landing.position.z)
      );

      /*curve.points.push(new THREE.Vector3(landing.position.x / 2, 100 * SCALE, landing.position.z / 2));
      curve.points.push(new THREE.Vector3(landing.position.x, landing.position.y, landing.position.z));*/

      let points = bezier.getPoints(50);
      let curveGeometry = new THREE.BufferGeometry().setFromPoints(points);

      let curveMaterial = new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 100,
        linecap: 'round', //ignored by WebGLRenderer
        linejoin: 'round' //ignored by WebGLRenderer
      });

      let curveObject = new THREE.Line(curveGeometry, curveMaterial);
      curveObject.name = 'curve' + String(((i * 10) + 10 + (y * 10 * 20) + 10) + (id*878));
      scene.add(curveObject);
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  //renderer.render(scene, camera);
}

animate();

function convert(deg) {
  return deg * (Math.PI / 180);
}

//New Stadium
function swapStadium() {
  loadingMessage.style.display = 'flex';

  abb = document.getElementById('stadium-select').value;

  document.getElementById('stadium-select').value = abb;

  var selectedObject = scene.getObjectByName('stadium-mlb');
  scene.remove(selectedObject);

  abb = abb.replace(' ', '');

  loader.load(`models/Stadium_${abb}.glb`, function (model) {
    stadium = model.scene;
    stadium.name = 'stadium-mlb'
    scene.add(stadium);
    renderer.render(scene, camera);
    loadingMessage.style.display = 'none';
  });
}

//Stadium Select
document.getElementById('stadium-select').addEventListener('change', function () {
  swapStadium();
});

async function parseCSV(url) {
  await Papa.parse(url, {
    download: true,
    complete: function (results) {
      data = results;

      for (var i = 1; i < data.data.length; i++) {
        switch (data.data[i][8]) {
          case 'home_run':
            homerunData.push(data.data[i]);
            break;
          default:
            break;
        }
      }
      newRound();
    }
  });
}

function newRound() {
  let randomRow = homerunData[Math.floor(Math.random() * homerunData.length)];
  let playerId = randomRow[6];
  let playerName = randomRow[5];

  let tempOptions = [playerName];
  let counter = 0;

  for (let i = 0; i < homerunData.length; i++) {
    if (homerunData[i][6] == playerId) {
      counter ++;
      renderHit(homerunData[i], counter);
    }
  }
  previousAmount = counter;

  for (let i = 0; i < 2; i++) {
    let temp = homerunData[Math.floor(Math.random() * homerunData.length)][5];
    while (tempOptions.includes(temp)) {
      temp = homerunData[Math.floor(Math.random() * homerunData.length)][5];
    }
    tempOptions.push(temp);
  }

  for (let i = 0; i < 3; i++) {
    let current = Math.floor(Math.random() * tempOptions.length);
    let tempText = tempOptions[current];
    let outputText = tempText.substring(tempText.indexOf(',') + 1) + ' ' + tempText.substring(0, tempText.indexOf(','));
    options[i].innerText = outputText;
    tempText == playerName ? options[i].id = 'correct' : options[i].id = 'wrong';
    tempOptions.splice(current, 1);
  }

  renderer.render(scene, camera);

  //console.log(playerName);
}

window.addEventListener('resize', () => {

  // Update camera
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

//https://baseballsavant.mlb.com/statcast_search/csv?all=true&hfPT=&hfAB=single%7Cdouble%7Ctriple%7Chome%5C.%5C.run%7Cfield%5C.%5C.out%7C&hfGT=R%7C&hfPR=&hfZ=&hfStadium=&hfBBL=&hfNewZones=&hfPull=&hfC=&hfSea=2023%7C&hfSit=&player_type=batter&hfOuts=&hfOpponent=&pitcher_throws=&batter_stands=&hfSA=&game_date_gt=&game_date_lt=&hfMo=&hfTeam=&home_road=&hfRO=&position=&hfInfield=&hfOutfield=&hfInn=&hfBBT=fly%5C.%5C.ball%7Cline%5C.%5C.drive%7C&hfFlag=&metric_1=&group_by=name-date&min_pitches=0&min_results=0&min_pas=0&sort_col=pitches&metric_1=api_h_distance_projected&metric_1_gt=300&metric_1_lt=&player_event_sort=api_p_release_speed&sort_order=desc&min_abs=0&type=detals#results

parseCSV(`./data/${2024}.csv`);