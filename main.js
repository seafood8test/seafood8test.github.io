import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera, scene, renderer, controls;
let model;

init();
animate();

function init() {
    console.log('初始化開始');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    document.getElementById('scene3D').appendChild(renderer.domElement);

    // 添加 OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;

    // 添加燈光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);

    // 設置相機位置
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);

    // 載入3D模型
    const loader = new GLTFLoader();
    loader.load(
        './MODEL/untitled.glb',
        function (gltf) {
            model = gltf.scene;
            
            // 調整模型
            model.scale.set(0.5, 0.5, 0.5);
            
            // 確保材質和貼圖正確載入
            model.traverse((node) => {
                if (node.isMesh) {
                    node.material.needsUpdate = true;
                    if (node.material.map) {
                        node.material.map.needsUpdate = true;
                    }
                    // 啟用陰影
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            
            scene.add(model);
            console.log('模型載入成功');

            // 自動調整相機位置以適應模型
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            
            camera.position.z = cameraZ * 1.5;
            camera.updateProjectionMatrix();
            
            // 將控制器的目標點設置為模型中心
            controls.target.copy(center);
            controls.update();
        },
        function (progress) {
            console.log('載入進度:', (progress.loaded / progress.total * 100) + '%');
        },
        function (error) {
            console.error('模型載入錯誤:', error);
        }
    );

    // 添加模式切換事件
    const scene3D = document.getElementById('scene3D');
    const sceneAR = document.getElementById('sceneAR');
    
    document.getElementById('view-3d').addEventListener('click', () => {
        scene3D.classList.add('active');
        sceneAR.classList.remove('active');
        if (model) model.visible = true;
    });

    document.getElementById('view-ar').addEventListener('click', () => {
        scene3D.classList.remove('active');
        sceneAR.classList.add('active');
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// 響應視窗大小變化
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
} 