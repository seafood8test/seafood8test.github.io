import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera, scene, renderer, controls;
let model;
let currentSession = null;
let reticle = null;
let hitTestSource = null;
let hitTestSourceRequested = false;

init();
animate();

function init() {
    console.log('初始化開始');
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
    const modelPath = window.location.pathname.includes('your-repo-name') 
        ? '/your-repo-name/MODEL/untitled.glb' 
        : '/MODEL/untitled.glb';
    loader.load(
        modelPath,
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

    window.onerror = function(msg, url, lineNo, columnNo, error) {
        console.error('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo + '\nColumn: ' + columnNo + '\nError object: ' + JSON.stringify(error));
        return false;
    };
}

function animate() {
    if (!currentSession) {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
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
    console.log('開始 AR 模式');
    if (!renderer.xr.enabled) {
        renderer.xr.enabled = true;
    }

    try {
        // 請求 AR 會話
        const session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test', 'dom-overlay'],
            domOverlay: { root: document.body }
        });

        // 創建 reticle（用於顯示放置位置）
        reticle = new THREE.Mesh(
            new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial()
        );
        reticle.visible = false;
        scene.add(reticle);

        // 設置 session
        currentSession = session;
        await renderer.xr.setSession(session);

        // 添加會話事件監聽器
        session.addEventListener('end', onSessionEnd);
        
        // 設置 AR 幀循環
        renderer.setAnimationLoop(onXRFrame);

        // 隱藏按鈕容器
        document.querySelector('.button-container').style.display = 'none';

    } catch (error) {
        console.error('AR 啟動詳細錯誤:', error);
        alert('AR啟動失敗。請確保：\n1. 使用支援的設備\n2. 使用最新版Chrome瀏覽器\n3. 已安裝ARCore（Android）或使用WebXR Viewer（iOS）');
    }
}

// 添加 AR 會話結束處理函數
function onSessionEnd() {
    if (currentSession) {
        currentSession.removeEventListener('end', onSessionEnd);
        currentSession = null;
        
        // 重置 hit test 相關變量
        hitTestSource = null;
        hitTestSourceRequested = false;
        
        // 移除 reticle
        if (reticle) {
            scene.remove(reticle);
            reticle = null;
        }

        // 恢復正常渲染循環
        renderer.setAnimationLoop(animate);
        
        // 顯示按鈕容器
        document.querySelector('.button-container').style.display = 'flex';
        
        // 重置場景
        start3DView();
    }
}

// 添加 AR 幀渲染函數
function onXRFrame(timestamp, frame) {
    if (!frame) return;

    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = frame.session;

    // 處理 hit test
    if (!hitTestSourceRequested) {
        session.requestReferenceSpace('viewer').then((referenceSpace) => {
            session.requestHitTestSource({ space: referenceSpace })
                .then((source) => {
                    hitTestSource = source;
                });
        });
        hitTestSourceRequested = true;
    }

    if (hitTestSource) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);

            if (reticle) {
                reticle.visible = true;
                reticle.position.set(
                    pose.transform.position.x,
                    pose.transform.position.y,
                    pose.transform.position.z
                );
                reticle.updateMatrixWorld(true);
            }

            // 如果模型存在，更新其位置
            if (model) {
                model.position.set(
                    pose.transform.position.x,
                    pose.transform.position.y,
                    pose.transform.position.z
                );
                model.updateMatrixWorld(true);
            }
        } else {
            if (reticle) {
                reticle.visible = false;
            }
        }
    }

    // 渲染場景
    renderer.render(scene, camera);
}

// 響應視窗大小變化
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
} 