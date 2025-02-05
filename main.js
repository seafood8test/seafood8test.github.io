import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera, scene, renderer, controls;
let model;

init();
animate();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

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

    // 添加一個臨時的幾何體（在模型加載前可以看到）
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // 載入3D模型
    const loader = new GLTFLoader();
    loader.load(
        './MODEL/untitled.glb',
        function (gltf) {
            model = gltf.scene;
            // 調整模型大小
            model.scale.set(1, 1, 1);
            // 調整模型位置
            model.position.set(0, 0, 0);
            scene.add(model);
            // 預設顯示模型
            model.visible = true;
            // 移除臨時幾何體
            scene.remove(cube);
            console.log('模型載入成功');
        },
        // 添加載入進度回調
        function (progress) {
            console.log('載入進度:', (progress.loaded / progress.total * 100) + '%');
        },
        function (error) {
            console.error('模型載入錯誤:', error);
        }
    );

    // 添加控制按鈕事件監聽
    const view3DButton = document.getElementById('view-3d');
    view3DButton.addEventListener('click', start3DView);

    // 檢查AR支援
    const arButton = document.getElementById('ar-button');
    
    if ('xr' in navigator) {
        // 檢查 WebXR 的 AR 支援
        navigator.xr.isSessionSupported('immersive-ar')
            .then((supported) => {
                if (supported) {
                    arButton.style.display = 'block';
                    arButton.addEventListener('click', startAR);
                    console.log('AR支援已啟用');
                } else {
                    console.log('設備不支援AR');
                    arButton.style.display = 'block';
                    arButton.textContent = 'AR不支援';
                    arButton.disabled = true;
                    arButton.style.backgroundColor = '#cccccc';
                }
            })
            .catch(error => {
                console.error('檢查AR支援時發生錯誤:', error);
                arButton.style.display = 'block';
                arButton.textContent = 'AR檢查失敗';
                arButton.disabled = true;
                arButton.style.backgroundColor = '#cccccc';
            });
    } else {
        console.log('瀏覽器不支援WebXR');
        arButton.style.display = 'block';
        arButton.textContent = '不支援WebXR';
        arButton.disabled = true;
        arButton.style.backgroundColor = '#cccccc';
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    // 更新 OrbitControls
    controls.update();
    
    renderer.render(scene, camera);
}

// 添加3D瀏覽模式
function start3DView() {
    if (model) {
        model.visible = true;
        // 重置相機位置
        camera.position.set(0, 1, 5);
        camera.lookAt(0, 0, 0);
        console.log('切換到3D模式');
    } else {
        console.log('模型未載入');
    }
}

// 修改AR模式啟動函數
async function startAR() {
    if (!renderer.xr.enabled) {
        renderer.xr.enabled = true;
    }

    try {
        const session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test']
        });

        renderer.xr.setSession(session);
        
        // 確保模型在AR模式下可見
        if (model) {
            model.visible = true;
        }
        
        session.addEventListener('end', () => {
            renderer.xr.setSession(null);
            // AR模式結束時重置場景
            if (model) {
                model.visible = true; // 保持模型可見
                start3DView(); // 返回3D視圖
            }
        });
    } catch (error) {
        console.error('AR 啟動失敗:', error);
        alert('AR啟動失敗。請確保：\n1. 使用支援的設備\n2. 使用最新版Chrome瀏覽器\n3. 已安裝ARCore（Android）或使用WebXR Viewer（iOS）');
    }
}

// 響應視窗大小變化
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
} 