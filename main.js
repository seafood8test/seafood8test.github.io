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
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('scene3D').appendChild(renderer.domElement);

    // 添加 OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 添加燈光
    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    // 設置相機位置
    camera.position.set(0, 1, 5);
    camera.lookAt(0, 0, 0);

    // 載入3D模型
    const loader = new GLTFLoader();
    const getModelPath = () => {
        const repoName = 'your-repo-name'; // 替換為您的倉庫名稱
        const basePath = window.location.pathname.includes(repoName) 
            ? `/${repoName}` 
            : '';
        return `${basePath}/MODEL/untitled.glb`;
    };

    // 設置跨域載入
    THREE.Cache.enabled = true;
    
    loader.load(
        getModelPath(),
        function (gltf) {
            model = gltf.scene;
            // 確保正確載入貼圖
            model.traverse((node) => {
                if (node.isMesh) {
                    node.material.needsUpdate = true;
                    if (node.material.map) {
                        node.material.map.needsUpdate = true;
                    }
                }
            });
            
            scene.add(model);
            console.log('模型載入成功');

            // 同時設置 AR.js 的模型
            const arModel = document.createElement('a-asset-item');
            arModel.id = 'model';
            arModel.src = getModelPath();
            document.querySelector('a-scene').appendChild(arModel);
        },
        function (progress) {
            console.log('載入進度:', (progress.loaded / progress.total * 100) + '%');
        },
        function (error) {
            console.error('模型載入錯誤:', error);
        }
    );

    // 添加模式切換事件
    document.getElementById('view-3d').addEventListener('click', () => {
        document.getElementById('scene3D').classList.add('active');
        document.getElementById('sceneAR').classList.remove('active');
    });

    document.getElementById('view-ar').addEventListener('click', () => {
        document.getElementById('scene3D').classList.remove('active');
        document.getElementById('sceneAR').classList.add('active');
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