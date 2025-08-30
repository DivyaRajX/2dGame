// 3D Game Engine using Three.js
class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.isPaused = false;
        this.animationId = null;
        
        // Lighting
        this.ambientLight = null;
        this.directionalLight = null;
        
        // Raycaster for mouse interactions
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Interactive objects
        this.interactiveObjects = [];
        this.selectedObject = null;
        
        // Physics simulation (simple)
        this.physicsObjects = [];
        this.gravity = new THREE.Vector3(0, -9.8, 0);
        
        // Environment
        this.environment = {
            weather: 'clear',
            timeOfDay: 'day',
            intensity: 0
        };
        
        this.setupEventListeners();
    }

    async init() {
        try {
            this.setupScene();
            this.setupCamera();
            this.setupRenderer();
            this.setupLights();
            this.setupControls();
            this.startRenderLoop();
            
            // Load default assets
            await this.loadDefaultAssets();
            
            console.log('Game engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game engine:', error);
            throw error;
        }
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        
        // Add fog for depth perception
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 2000);
    }

    setupCamera() {
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 2000);
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }

    setupLights() {
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(this.ambientLight);

        // Directional light (sun)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(50, 100, 50);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -100;
        this.directionalLight.shadow.camera.right = 100;
        this.directionalLight.shadow.camera.top = 100;
        this.directionalLight.shadow.camera.bottom = -100;
        this.scene.add(this.directionalLight);
    }

    setupControls() {
        // Simple orbit controls simulation
        this.controls = {
            target: new THREE.Vector3(0, 0, 0),
            minDistance: 5,
            maxDistance: 100,
            enablePan: true,
            enableZoom: true,
            enableRotate: true,
            autoRotate: false,
            update: () => {} // Placeholder
        };
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousemove', (event) => {
            this.onMouseMove(event);
        });

        this.canvas.addEventListener('click', (event) => {
            this.onMouseClick(event);
        });

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (event) => {
            this.onTouchStart(event);
        });

        this.canvas.addEventListener('touchmove', (event) => {
            this.onTouchMove(event);
        });

        // Prevent right-click context menu
        this.canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Check for intersections
        this.checkIntersections();
    }

    onMouseClick(event) {
        if (this.selectedObject) {
            // Trigger interaction with selected object
            this.triggerInteraction(this.selectedObject);
        }
    }

    onTouchStart(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.onMouseMove({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }
    }

    onTouchMove(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.onMouseMove({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }
    }

    checkIntersections() {
        const intersects = this.raycaster.intersectObjects(this.interactiveObjects);
        
        // Reset previous selection
        if (this.selectedObject) {
            this.selectedObject.material.emissive.setHex(0x000000);
        }
        
        if (intersects.length > 0) {
            this.selectedObject = intersects[0].object;
            this.selectedObject.material.emissive.setHex(0x222222);
            this.canvas.style.cursor = 'pointer';
        } else {
            this.selectedObject = null;
            this.canvas.style.cursor = 'default';
        }
    }

    triggerInteraction(object) {
        if (object.userData.interactive && object.userData.onInteract) {
            object.userData.onInteract(object);
        }
    }

    async loadDefaultAssets() {
        // Create basic geometries and materials
        this.geometries = {
            box: new THREE.BoxGeometry(1, 1, 1),
            sphere: new THREE.SphereGeometry(0.5, 32, 32),
            plane: new THREE.PlaneGeometry(1, 1),
            cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 32),
            cone: new THREE.ConeGeometry(0.5, 1, 32)
        };

        this.materials = {
            default: new THREE.MeshLambertMaterial({ color: 0x808080 }),
            ground: new THREE.MeshLambertMaterial({ color: 0x8FBC8F }),
            building: new THREE.MeshLambertMaterial({ color: 0xDDDDDD }),
            emergency: new THREE.MeshLambertMaterial({ color: 0xFF4444 }),
            safe: new THREE.MeshLambertMaterial({ color: 0x44FF44 }),
            water: new THREE.MeshLambertMaterial({ 
                color: 0x4169E1, 
                transparent: true, 
                opacity: 0.7 
            }),
            warning: new THREE.MeshLambertMaterial({ color: 0xFFAA00 })
        };

        // Load textures (in a real implementation, you'd load actual texture files)
        this.createProcceduralTextures();
    }

    createProcceduralTextures() {
        // Create simple procedural textures
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');

        // Ground texture
        context.fillStyle = '#8FBC8F';
        context.fillRect(0, 0, 64, 64);
        context.fillStyle = '#7AA87A';
        for (let i = 0; i < 20; i++) {
            context.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
        }
        const groundTexture = new THREE.CanvasTexture(canvas);
        this.materials.ground.map = groundTexture;

        // Building texture
        context.fillStyle = '#CCCCCC';
        context.fillRect(0, 0, 64, 64);
        context.fillStyle = '#333333';
        context.strokeStyle = '#333333';
        context.lineWidth = 1;
        // Draw windows
        for (let x = 8; x < 64; x += 16) {
            for (let y = 8; y < 64; y += 16) {
                context.strokeRect(x, y, 8, 8);
            }
        }
        const buildingTexture = new THREE.CanvasTexture(canvas);
        this.materials.building.map = buildingTexture;
    }

    createGround(width = 200, height = 200) {
        const groundGeometry = new THREE.PlaneGeometry(width, height);
        const ground = new THREE.Mesh(groundGeometry, this.materials.ground);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.userData = { type: 'ground' };
        this.scene.add(ground);
        return ground;
    }

    createBuilding(width, height, depth, x = 0, y = 0, z = 0) {
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(buildingGeometry, this.materials.building);
        building.position.set(x, height / 2 + y, z);
        building.castShadow = true;
        building.receiveShadow = true;
        building.userData = { 
            type: 'building', 
            interactive: true,
            onInteract: (obj) => this.onBuildingClick(obj)
        };
        this.scene.add(building);
        this.interactiveObjects.push(building);
        return building;
    }

    createPerson(x = 0, y = 0, z = 0, color = 0x8B4513) {
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB3 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.75;
        group.add(head);
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB3 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.5, 1, 0);
        leftArm.rotation.z = 0.3;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.5, 1, 0);
        rightArm.rotation.z = -0.3;
        group.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.12, 0.12, 1.5, 8);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x000080 });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.2, -0.75, 0);
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.2, -0.75, 0);
        group.add(rightLeg);
        
        group.position.set(x, y, z);
        group.castShadow = true;
        group.userData = { 
            type: 'person', 
            interactive: true,
            onInteract: (obj) => this.onPersonClick(obj),
            canMove: true,
            speed: 2
        };
        
        this.scene.add(group);
        this.interactiveObjects.push(group);
        return group;
    }

    createEmergencyKit(x = 0, y = 0, z = 0) {
        const kitGeometry = new THREE.BoxGeometry(1, 0.5, 0.8);
        const kit = new THREE.Mesh(kitGeometry, this.materials.emergency);
        kit.position.set(x, y + 0.25, z);
        kit.castShadow = true;
        kit.userData = { 
            type: 'emergency_kit', 
            interactive: true,
            onInteract: (obj) => this.onEmergencyKitClick(obj),
            canPickUp: true
        };
        this.scene.add(kit);
        this.interactiveObjects.push(kit);
        return kit;
    }

    createSafeZone(x = 0, y = 0, z = 0, radius = 5) {
        const zoneGeometry = new THREE.CylinderGeometry(radius, radius, 0.1, 32);
        const zone = new THREE.Mesh(zoneGeometry, this.materials.safe);
        zone.position.set(x, y, z);
        zone.userData = { type: 'safe_zone', radius: radius };
        this.scene.add(zone);
        return zone;
    }

    simulateEarthquake(intensity = 0.5, duration = 5000) {
        const startTime = performance.now();
        const originalPositions = new Map();
        
        // Store original positions of all objects
        this.scene.traverse((object) => {
            if (object.type === 'Mesh' || object.type === 'Group') {
                originalPositions.set(object, object.position.clone());
            }
        });
        
        const shake = () => {
            const elapsed = performance.now() - startTime;
            if (elapsed > duration) {
                // Restore original positions
                originalPositions.forEach((originalPos, object) => {
                    object.position.copy(originalPos);
                });
                return;
            }
            
            const shakeAmount = intensity * Math.sin(elapsed * 0.01) * (1 - elapsed / duration);
            
            this.scene.traverse((object) => {
                if (object.type === 'Mesh' || object.type === 'Group') {
                    const originalPos = originalPositions.get(object);
                    if (originalPos) {
                        object.position.x = originalPos.x + (Math.random() - 0.5) * shakeAmount;
                        object.position.z = originalPos.z + (Math.random() - 0.5) * shakeAmount;
                        
                        if (object.userData.type !== 'ground') {
                            object.position.y = originalPos.y + (Math.random() - 0.5) * shakeAmount * 0.5;
                        }
                    }
                }
            });
            
            // Shake camera
            this.camera.position.x += (Math.random() - 0.5) * shakeAmount * 0.1;
            this.camera.position.y += (Math.random() - 0.5) * shakeAmount * 0.1;
            this.camera.position.z += (Math.random() - 0.5) * shakeAmount * 0.1;
            
            requestAnimationFrame(shake);
        };
        
        shake();
    }

    simulateLandslide(startPos, direction, speed = 1) {
        const debris = [];
        
        // Create debris objects
        for (let i = 0; i < 20; i++) {
            const size = Math.random() * 2 + 0.5;
            const debrisGeometry = new THREE.BoxGeometry(size, size, size);
            const debrisMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x8B4513 
            });
            const debrisObject = new THREE.Mesh(debrisGeometry, debrisMaterial);
            
            debrisObject.position.set(
                startPos.x + (Math.random() - 0.5) * 10,
                startPos.y + Math.random() * 5,
                startPos.z + (Math.random() - 0.5) * 10
            );
            
            debrisObject.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            debrisObject.castShadow = true;
            debrisObject.userData = { 
                type: 'debris',
                velocity: direction.clone().multiplyScalar(speed * (0.5 + Math.random())),
                angularVelocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                )
            };
            
            this.scene.add(debrisObject);
            debris.push(debrisObject);
            this.physicsObjects.push(debrisObject);
        }
        
        return debris;
    }

    simulateFlood(waterLevel = 0, riseSpeed = 0.01) {
        // Create water plane
        if (!this.floodWater) {
            const waterGeometry = new THREE.PlaneGeometry(200, 200);
            this.floodWater = new THREE.Mesh(waterGeometry, this.materials.water);
            this.floodWater.rotation.x = -Math.PI / 2;
            this.floodWater.position.y = waterLevel;
            this.floodWater.userData = { type: 'flood_water' };
            this.scene.add(this.floodWater);
        }
        
        // Animate water rising
        const riseWater = () => {
            if (this.floodWater && this.floodWater.position.y < waterLevel) {
                this.floodWater.position.y += riseSpeed;
                
                // Check if any objects are submerged
                this.scene.traverse((object) => {
                    if (object.userData.type === 'person' && 
                        object.position.y < this.floodWater.position.y + 1) {
                        // Person is in danger
                        if (object.material) {
                            object.material.color.setHex(0xFF4444);
                        }
                    }
                });
                
                requestAnimationFrame(riseWater);
            }
        };
        
        riseWater();
    }

    updatePhysics(deltaTime) {
        this.physicsObjects.forEach((object, index) => {
            if (object.userData.velocity) {
                // Apply gravity
                object.userData.velocity.add(
                    this.gravity.clone().multiplyScalar(deltaTime)
                );
                
                // Update position
                object.position.add(
                    object.userData.velocity.clone().multiplyScalar(deltaTime)
                );
                
                // Update rotation
                if (object.userData.angularVelocity) {
                    object.rotation.x += object.userData.angularVelocity.x;
                    object.rotation.y += object.userData.angularVelocity.y;
                    object.rotation.z += object.userData.angularVelocity.z;
                }
                
                // Ground collision
                if (object.position.y <= 0) {
                    object.position.y = 0;
                    object.userData.velocity.y *= -0.3; // Bounce with energy loss
                    object.userData.velocity.x *= 0.8; // Friction
                    object.userData.velocity.z *= 0.8;
                    
                    // Stop if velocity is very low
                    if (object.userData.velocity.length() < 0.1) {
                        this.physicsObjects.splice(index, 1);
                    }
                }
                
                // Remove objects that fall too far
                if (object.position.y < -50) {
                    this.scene.remove(object);
                    this.physicsObjects.splice(index, 1);
                }
            }
        });
    }

    // Event handlers for interactions
    onBuildingClick(building) {
        console.log('Building clicked:', building.userData);
        // Trigger building-specific interactions
        if (window.gameInstance && window.gameInstance.simulationModule) {
            window.gameInstance.simulationModule.onBuildingInteract(building);
        }
    }

    onPersonClick(person) {
        console.log('Person clicked:', person.userData);
        // Trigger person-specific interactions
        if (window.gameInstance && window.gameInstance.simulationModule) {
            window.gameInstance.simulationModule.onPersonInteract(person);
        }
    }

    onEmergencyKitClick(kit) {
        console.log('Emergency kit clicked:', kit.userData);
        // Trigger emergency kit interactions
        if (window.gameInstance && window.gameInstance.simulationModule) {
            window.gameInstance.simulationModule.onEmergencyKitInteract(kit);
        }
    }

    moveObject(object, targetPosition, speed = 2) {
        const startPosition = object.position.clone();
        const distance = startPosition.distanceTo(targetPosition);
        const duration = distance / speed * 1000; // Convert to milliseconds
        const startTime = performance.now();
        
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            object.position.lerpVectors(startPosition, targetPosition, progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    setEnvironment(weather, timeOfDay, intensity = 1) {
        this.environment = { weather, timeOfDay, intensity };
        
        // Update lighting based on time of day
        if (timeOfDay === 'night') {
            this.ambientLight.intensity = 0.2;
            this.directionalLight.intensity = 0.1;
            this.scene.background = new THREE.Color(0x001122);
        } else {
            this.ambientLight.intensity = 0.6;
            this.directionalLight.intensity = 0.8;
            this.scene.background = new THREE.Color(0x87CEEB);
        }
        
        // Update fog and background based on weather
        switch (weather) {
            case 'storm':
                this.scene.background = new THREE.Color(0x333333);
                this.scene.fog.color = new THREE.Color(0x333333);
                this.directionalLight.intensity *= 0.5;
                break;
            case 'rain':
                this.scene.background = new THREE.Color(0x666666);
                this.scene.fog.density = 0.01;
                break;
            default:
                this.scene.fog.color = new THREE.Color(0x87CEEB);
        }
    }

    startRenderLoop() {
        const animate = () => {
            if (!this.isPaused) {
                const deltaTime = this.clock.getDelta();
                
                // Update physics
                this.updatePhysics(deltaTime);
                
                // Update controls if available
                if (this.controls.update) {
                    this.controls.update();
                }
                
                // Render the scene
                this.renderer.render(this.scene, this.camera);
            }
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.clock.stop();
        } else {
            this.clock.start();
        }
    }

    handleResize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    cleanup() {
        // Stop animation loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Dispose of geometries and materials
        this.scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (object.material.map) {
                    object.material.map.dispose();
                }
                object.material.dispose();
            }
        });
        
        // Clear arrays
        this.interactiveObjects.length = 0;
        this.physicsObjects.length = 0;
        
        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        console.log('Game engine cleaned up');
    }
}