// Flood Simulation Module
class FloodSimulation {
    constructor(gameEngine, gameInstance) {
        this.engine = gameEngine;
        this.game = gameInstance;
        this.currentPhase = 0;
        this.score = 0;
        this.startTime = 0;
        this.accuracy = 100;
        this.mistakes = 0;
        
        // Flood-specific properties
        this.waterLevel = -5;
        this.maxWaterLevel = 8;
        this.floodSpeed = 0.02;
        this.isFlooding = false;
        
        // Simulation objects
        this.community = null;
        this.houses = [];
        this.residents = [];
        this.emergencySupplies = [];
        this.evacuationCenters = [];
        this.floodBarriers = [];
        this.boats = [];
        
        // Phase tracking
        this.phases = [
            { name: 'preparation', duration: 60000 },  // 1 minute
            { name: 'early_flood', duration: 90000 },  // 1.5 minutes
            { name: 'rescue_ops', duration: 120000 },  // 2 minutes
            { name: 'recovery', duration: 90000 }      // 1.5 minutes
        ];
        
        this.rescuedResidents = 0;
        this.totalResidents = 10;
        this.suppliesDistributed = 0;
        this.barriersBuilt = 0;
        
        // Learning objectives
        this.objectives = {
            prepareSupplies: false,
            buildBarriers: false,
            evacuateResidents: false,
            rescueStranded: false,
            establishShelter: false
        };
        
        this.setupInstructions();
    }

    async start() {
        this.startTime = performance.now();
        await this.createCommunityScene();
        this.startPhase(0);
        this.showWelcomeInstructions();
    }

    setupInstructions() {
        this.instructionTexts = {
            welcome: {
                title: "Welcome to Flood Response Training",
                text: "A flood warning has been issued for your community. Learn flood preparedness, evacuation procedures, and rescue operations.",
                actions: [
                    {
                        text: "Start Training",
                        callback: () => this.game.hideInstructions()
                    }
                ]
            },
            preparation: {
                title: "Phase 1: Flood Preparation",
                text: "Gather emergency supplies and build flood barriers. Click on houses to help residents prepare.",
                actions: [
                    {
                        text: "Begin Preparation",
                        callback: () => this.game.hideInstructions()
                    }
                ]
            },
            early_flood: {
                title: "Phase 2: Early Flooding",
                text: "Water levels are rising! Help residents move to higher ground and evacuate vulnerable areas.",
                actions: [
                    {
                        text: "Start Evacuation",
                        callback: () => this.startFloodPhase()
                    }
                ]
            },
            rescue_ops: {
                title: "Phase 3: Rescue Operations",
                text: "Use boats to rescue stranded residents. Navigate carefully through flood waters.",
                actions: [
                    {
                        text: "Deploy Rescue Teams",
                        callback: () => this.startRescuePhase()
                    }
                ]
            },
            recovery: {
                title: "Phase 4: Recovery and Shelter",
                text: "Set up emergency shelters and distribute supplies to displaced residents.",
                actions: [
                    {
                        text: "Begin Recovery",
                        callback: () => this.game.hideInstructions()
                    }
                ]
            }
        };
    }

    async createCommunityScene() {
        // Create ground with varied elevations
        this.createFloodPlainTerrain();
        
        // Create community buildings
        this.createCommunityBuildings();
        
        // Create residents
        this.createResidents();
        
        // Create emergency supplies
        this.createEmergencySupplies();
        
        // Create evacuation centers on higher ground
        this.createEvacuationCenters();
        
        // Create rescue boats
        this.createRescueBoats();
        
        // Create river/water source
        this.createRiver();
        
        // Set camera for community overview
        this.engine.camera.position.set(0, 50, 60);
        this.engine.camera.lookAt(0, 0, 0);
    }

    createFloodPlainTerrain() {
        const groundGeometry = new THREE.PlaneGeometry(120, 100, 24, 20);
        const vertices = groundGeometry.attributes.position.array;
        
        // Create varied terrain with low-lying areas and higher ground
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            // Create elevation map
            let height = 0;
            
            // River valley (lower)
            if (Math.abs(z) < 20) {
                height = -2 + Math.sin(x * 0.1) * 1;
            }
            // Higher ground areas
            else if (Math.abs(z) > 30) {
                height = 5 + Math.sin(x * 0.05) * 2;
            }
            // Mid-level areas
            else {
                height = 1 + Math.cos(x * 0.08) * 1.5;
            }
            
            vertices[i + 1] = height;
        }
        
        groundGeometry.attributes.position.needsUpdate = true;
        groundGeometry.computeVertexNormals();
        
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x7CFC00 });
        this.community = new THREE.Mesh(groundGeometry, groundMaterial);
        this.community.rotation.x = -Math.PI / 2;
        this.community.receiveShadow = true;
        this.engine.scene.add(this.community);
    }

    createCommunityBuildings() {
        // Houses in flood-prone areas (low elevation)
        const lowHousePositions = [
            { x: -25, z: -10, elevation: -1 },
            { x: -15, z: -8, elevation: -0.5 },
            { x: -5, z: -12, elevation: -1.5 },
            { x: 5, z: -6, elevation: -0.8 },
            { x: 15, z: -14, elevation: -1.2 },
            { x: 25, z: -8, elevation: -0.6 }
        ];
        
        lowHousePositions.forEach((pos, index) => {
            const house = this.engine.createBuilding(4, 5, 4, pos.x, pos.elevation, pos.z);
            house.userData = {
                ...house.userData,
                id: `low_${index}`,
                floodRisk: 'high',
                residents: 1,
                elevation: pos.elevation,
                waterResistant: false
            };
            this.houses.push(house);
        });
        
        // Houses on higher ground (safer)
        const highHousePositions = [
            { x: -30, z: 35, elevation: 6 },
            { x: -10, z: 40, elevation: 7 },
            { x: 10, z: 38, elevation: 6.5 },
            { x: 30, z: 42, elevation: 7.5 }
        ];
        
        highHousePositions.forEach((pos, index) => {
            const house = this.engine.createBuilding(4, 6, 4, pos.x, pos.elevation, pos.z);
            house.userData = {
                ...house.userData,
                id: `high_${index}`,
                floodRisk: 'low',
                residents: 1,
                elevation: pos.elevation,
                waterResistant: true
            };
            this.houses.push(house);
        });
    }

    createResidents() {
        const residentColors = [
            0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFECA57,
            0xFF9FF3, 0x54A0FF, 0x5F27CD, 0xFFA502, 0xF0932B
        ];
        
        this.houses.forEach((house, index) => {
            if (index < this.totalResidents) {
                const resident = this.engine.createPerson(
                    house.position.x + 3,
                    house.position.y - 2.5,
                    house.position.z + 3,
                    residentColors[index % residentColors.length]
                );
                
                resident.userData = {
                    ...resident.userData,
                    id: index,
                    house: house,
                    rescued: false,
                    inShelter: false,
                    canSwim: Math.random() > 0.3,
                    mobility: Math.random() > 0.2 ? 'normal' : 'limited',
                    onInteract: (obj) => this.onResidentClick(obj)
                };
                
                this.residents.push(resident);
            }
        });
    }

    createEmergencySupplies() {
        const supplyTypes = [
            { type: 'water', color: 0x4169E1, points: 30 },
            { type: 'food', color: 0xFF6347, points: 25 },
            { type: 'medical', color: 0x32CD32, points: 40 },
            { type: 'blankets', color: 0x8B4513, points: 20 }
        ];
        
        // Place supplies at various locations
        for (let i = 0; i < 8; i++) {
            const supplyType = supplyTypes[i % supplyTypes.length];
            const supply = this.engine.createEmergencyKit(
                Math.random() * 40 - 20,
                2,
                Math.random() * 60 - 30
            );
            
            supply.material.color.setHex(supplyType.color);
            supply.userData = {
                ...supply.userData,
                supplyType: supplyType.type,
                points: supplyType.points,
                collected: false,
                onInteract: (obj) => this.onSupplyClick(obj)
            };
            
            this.emergencySupplies.push(supply);
        }
    }

    createEvacuationCenters() {
        const centerPositions = [
            { x: -20, z: 45, capacity: 6 },
            { x: 20, z: 48, capacity: 8 }
        ];
        
        centerPositions.forEach((pos, index) => {
            // Create larger building for shelter
            const center = this.engine.createBuilding(8, 8, 6, pos.x, pos.elevation || 7, pos.z);
            center.material.color.setHex(0x4169E1); // Blue for emergency center
            
            center.userData = {
                ...center.userData,
                type: 'evacuation_center',
                capacity: pos.capacity,
                occupants: 0,
                supplies: 0,
                onInteract: (obj) => this.onEvacuationCenterClick(obj)
            };
            
            this.evacuationCenters.push(center);
        });
    }

    createRescueBoats() {
        const boatPositions = [
            { x: -40, z: 0 },
            { x: 40, z: 0 },
            { x: 0, z: -25 }
        ];
        
        boatPositions.forEach((pos, index) => {
            // Create simple boat geometry
            const boatGeometry = new THREE.BoxGeometry(4, 1, 8);
            const boatMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
            const boat = new THREE.Mesh(boatGeometry, boatMaterial);
            
            boat.position.set(pos.x, 0, pos.z);
            boat.userData = {
                type: 'rescue_boat',
                capacity: 4,
                passengers: 0,
                available: true,
                onInteract: (obj) => this.onBoatClick(obj)
            };
            
            this.engine.scene.add(boat);
            this.engine.interactiveObjects.push(boat);
            this.boats.push(boat);
        });
    }

    createRiver() {
        // Create river geometry
        const riverGeometry = new THREE.PlaneGeometry(100, 15);
        const riverMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4169E1, 
            transparent: true, 
            opacity: 0.8 
        });
        
        this.engine.floodWater = new THREE.Mesh(riverGeometry, riverMaterial);
        this.engine.floodWater.rotation.x = -Math.PI / 2;
        this.engine.floodWater.position.set(0, this.waterLevel, 0);
        this.engine.floodWater.userData = { type: 'flood_water' };
        
        this.engine.scene.add(this.engine.floodWater);
    }

    showWelcomeInstructions() {
        const instruction = this.instructionTexts.welcome;
        this.game.showInstructions(instruction.title, instruction.text, instruction.actions);
    }

    startPhase(phaseIndex) {
        if (phaseIndex >= this.phases.length) {
            this.completeSimulation();
            return;
        }
        
        this.currentPhase = phaseIndex;
        const phase = this.phases[phaseIndex];
        
        this.game.updateProgress((phaseIndex / this.phases.length) * 100);
        
        switch (phase.name) {
            case 'preparation':
                this.startPreparationPhase();
                break;
            case 'early_flood':
                this.showEarlyFloodInstructions();
                break;
            case 'rescue_ops':
                this.showRescueInstructions();
                break;
            case 'recovery':
                this.startRecoveryPhase();
                break;
        }
        
        setTimeout(() => {
            if (this.currentPhase === phaseIndex) {
                this.startPhase(phaseIndex + 1);
            }
        }, phase.duration);
    }

    startPreparationPhase() {
        const instruction = this.instructionTexts.preparation;
        this.game.showInstructions(instruction.title, instruction.text, instruction.actions);
        
        this.showPreparationInterface();
    }

    showPreparationInterface() {
        const preparationItems = [
            { id: 'water_supply', text: 'Water Bottles', type: 'supply' },
            { id: 'food_kit', text: 'Emergency Food', type: 'supply' },
            { id: 'first_aid', text: 'First Aid Kit', type: 'supply' },
            { id: 'sandbags', text: 'Sandbags', type: 'barrier' },
            { id: 'plastic_sheeting', text: 'Plastic Sheeting', type: 'barrier' }
        ];
        
        const preparationZones = [
            { id: 'house_prep', text: 'Prepare Houses', accepts: ['supply'] },
            { id: 'barrier_build', text: 'Build Barriers', accepts: ['barrier'] }
        ];
        
        this.game.showDragDropPanel(preparationItems, preparationZones);
    }

    showEarlyFloodInstructions() {
        const instruction = this.instructionTexts.early_flood;
        this.game.showInstructions(instruction.title, instruction.text, instruction.actions);
    }

    startFloodPhase() {
        this.game.hideDragDropPanel();
        this.isFlooding = true;
        
        // Start water level rising
        this.startFloodAnimation();
        
        // Mark low-lying houses as at risk
        this.identifyFloodRisks();
        
        // Begin evacuation procedures
        this.initiateEvacuation();
    }

    startFloodAnimation() {
        const raiseWater = () => {
            if (this.isFlooding && this.waterLevel < this.maxWaterLevel) {
                this.waterLevel += this.floodSpeed;
                
                if (this.engine.floodWater) {
                    this.engine.floodWater.position.y = this.waterLevel;
                    
                    // Expand water coverage as level rises
                    const scale = 1 + (this.waterLevel + 5) * 0.1;
                    this.engine.floodWater.scale.set(scale, 1, scale);
                }
                
                // Check for residents in danger
                this.checkResidentsInDanger();
                
                requestAnimationFrame(raiseWater);
            }
        };
        
        raiseWater();
    }

    identifyFloodRisks() {
        this.houses.forEach(house => {
            if (house.userData.elevation < 2) {
                // House is at flood risk
                house.material.color.setHex(0xFF4444); // Red warning
                house.userData.atRisk = true;
            }
        });
    }

    checkResidentsInDanger() {
        this.residents.forEach(resident => {
            const residentElevation = resident.position.y;
            
            if (residentElevation < this.waterLevel + 1 && !resident.userData.rescued) {
                // Resident needs rescue
                resident.material.children[0].material.emissive.setHex(0xFF0000);
                resident.userData.needsRescue = true;
                
                if (!resident.userData.canSwim) {
                    // Non-swimmer in critical danger
                    this.score -= 20;
                    this.accuracy -= 5;
                }
            }
        });
    }

    initiateEvacuation() {
        // Move residents from low areas to evacuation centers
        this.residents.forEach((resident, index) => {
            if (resident.userData.house && resident.userData.house.userData.floodRisk === 'high') {
                setTimeout(() => {
                    this.evacuateResident(resident);
                }, index * 2000);
            }
        });
    }

    evacuateResident(resident) {
        const nearestCenter = this.findNearestEvacuationCenter(resident.position);
        
        if (nearestCenter && nearestCenter.userData.occupants < nearestCenter.userData.capacity) {
            const targetPosition = new THREE.Vector3(
                nearestCenter.position.x + (Math.random() - 0.5) * 6,
                nearestCenter.position.y - 3,
                nearestCenter.position.z + (Math.random() - 0.5) * 4
            );
            
            this.engine.moveObject(resident, targetPosition, 3);
            
            setTimeout(() => {
                resident.userData.rescued = true;
                resident.userData.inShelter = true;
                nearestCenter.userData.occupants++;
                this.rescuedResidents++;
                this.score += 50;
                
                if (this.rescuedResidents >= this.totalResidents * 0.7) {
                    this.objectives.evacuateResidents = true;
                    this.showAchievementMessage("Most residents evacuated to safety!");
                }
            }, 3000);
        }
    }

    findNearestEvacuationCenter(position) {
        let nearest = null;
        let minDistance = Infinity;
        
        this.evacuationCenters.forEach(center => {
            const distance = position.distanceTo(center.position);
            if (distance < minDistance && center.userData.occupants < center.userData.capacity) {
                minDistance = distance;
                nearest = center;
            }
        });
        
        return nearest;
    }

    showRescueInstructions() {
        const instruction = this.instructionTexts.rescue_ops;
        this.game.showInstructions(instruction.title, instruction.text, instruction.actions);
    }

    startRescuePhase() {
        this.game.hideInstructions();
        
        // Enable boat operations
        this.enableBoatRescue();
        
        // Identify stranded residents
        this.identifyStrandedResidents();
    }

    enableBoatRescue() {
        this.boats.forEach(boat => {
            boat.material.color.setHex(0x00FF00); // Green for active
            boat.userData.available = true;
        });
        
        this.showBoatInterface();
    }

    showBoatInterface() {
        const rescueItems = this.residents
            .filter(r => r.userData.needsRescue && !r.userData.rescued)
            .map((resident, index) => ({
                id: `resident_${resident.userData.id}`,
                text: `Rescue Person ${resident.userData.id + 1}`,
                type: 'rescue'
            }));
        
        const boatZones = this.boats.map((boat, index) => ({
            id: `boat_${index}`,
            text: `Rescue Boat ${index + 1}`,
            accepts: ['rescue']
        }));
        
        if (rescueItems.length > 0) {
            this.game.showDragDropPanel(rescueItems, boatZones);
        }
    }

    identifyStrandedResidents() {
        this.residents.forEach(resident => {
            if (!resident.userData.rescued && resident.position.y < this.waterLevel + 2) {
                resident.userData.stranded = true;
                resident.userData.needsRescue = true;
                
                // Visual indicator for stranded resident
                const indicator = new THREE.Mesh(
                    new THREE.ConeGeometry(1, 2, 8),
                    new THREE.MeshLambertMaterial({ color: 0xFF0000 })
                );
                indicator.position.copy(resident.position);
                indicator.position.y += 4;
                this.engine.scene.add(indicator);
            }
        });
    }

    onBoatRescue(residentId, boatId) {
        const residentIndex = parseInt(residentId.split('_')[1]);
        const boatIndex = parseInt(boatId.split('_')[1]);
        
        const resident = this.residents[residentIndex];
        const boat = this.boats[boatIndex];
        
        if (resident && boat && boat.userData.passengers < boat.userData.capacity) {
            this.performRescue(resident, boat);
        }
    }

    performRescue(resident, boat) {
        // Move resident to boat
        this.engine.moveObject(resident, boat.position.clone().add(new THREE.Vector3(0, 2, 0)), 2);
        
        setTimeout(() => {
            // Transport to evacuation center
            const evacuationCenter = this.findNearestEvacuationCenter(boat.position);
            if (evacuationCenter) {
                this.engine.moveObject(boat, evacuationCenter.position.clone().add(new THREE.Vector3(0, -2, 8)), 4);
                
                setTimeout(() => {
                    resident.userData.rescued = true;
                    resident.userData.inShelter = true;
                    this.rescuedResidents++;
                    this.score += 75;
                    
                    // Remove resident from scene (now in shelter)
                    this.engine.scene.remove(resident);
                    
                    // Return boat to position
                    this.engine.moveObject(boat, boat.userData.originalPosition || boat.position, 3);
                    
                    if (this.rescuedResidents >= this.totalResidents) {
                        this.objectives.rescueStranded = true;
                        this.showAchievementMessage("All residents rescued from flood waters!");
                    }
                }, 4000);
            }
        }, 2000);
    }

    startRecoveryPhase() {
        const instruction = this.instructionTexts.recovery;
        this.game.showInstructions(instruction.title, instruction.text, instruction.actions);
        
        // Set up shelter operations
        this.setupShelterOperations();
        
        // Begin water receding
        this.startWaterReceding();
    }

    setupShelterOperations() {
        // Distribute supplies to evacuation centers
        this.distributeSuppliesToShelters();
        
        // Set up temporary housing
        this.objectives.establishShelter = true;
        this.score += 100;
    }

    distributeSuppliesToShelters() {
        this.emergencySupplies.forEach((supply, index) => {
            if (!supply.userData.collected) {
                setTimeout(() => {
                    const center = this.evacuationCenters[index % this.evacuationCenters.length];
                    this.engine.moveObject(supply, center.position.clone().add(new THREE.Vector3(-3, 0, 0)), 2);
                    
                    setTimeout(() => {
                        supply.userData.collected = true;
                        center.userData.supplies++;
                        this.suppliesDistributed++;
                        this.score += supply.userData.points;
                        
                        if (this.suppliesDistributed >= this.emergencySupplies.length * 0.75) {
                            this.objectives.prepareSupplies = true;
                            this.showAchievementMessage("Emergency supplies distributed to shelters!");
                        }
                    }, 2000);
                }, index * 1000);
            }
        });
    }

    startWaterReceding() {
        const recedeWater = () => {
            if (this.waterLevel > -5) {
                this.waterLevel -= 0.01;
                
                if (this.engine.floodWater) {
                    this.engine.floodWater.position.y = this.waterLevel;
                    
                    const scale = Math.max(0.1, 1 + (this.waterLevel + 5) * 0.1);
                    this.engine.floodWater.scale.set(scale, 1, scale);
                }
                
                requestAnimationFrame(recedeWater);
            } else {
                this.isFlooding = false;
            }
        };
        
        recedeWater();
    }

    // Event handlers
    onResidentClick(resident) {
        if (resident.userData.needsRescue && !resident.userData.rescued) {
            this.showHint(`This person needs immediate rescue! Use a boat to reach them safely.`);
        } else if (resident.userData.inShelter) {
            this.showEducationalInfo("Shelter Resident", "This person is safe in the evacuation center. Ensure they have adequate supplies and medical care.");
        } else {
            this.evacuateResident(resident);
        }
    }

    onSupplyClick(supply) {
        if (!supply.userData.collected) {
            supply.userData.collected = true;
            this.suppliesDistributed++;
            this.score += supply.userData.points;
            
            this.showEducationalInfo("Emergency Supply", `Collected ${supply.userData.supplyType} supplies. These are essential for shelter operations.`);
            
            // Move supply to nearest evacuation center
            const nearestCenter = this.findNearestEvacuationCenter(supply.position);
            if (nearestCenter) {
                this.engine.moveObject(supply, nearestCenter.position.clone().add(new THREE.Vector3(-2, 0, 0)), 3);
                nearestCenter.userData.supplies++;
            }
        }
    }

    onEvacuationCenterClick(center) {
        const info = `Evacuation Center Status:\n• Occupants: ${center.userData.occupants}/${center.userData.capacity}\n• Supplies: ${center.userData.supplies} units\n• Status: ${center.userData.occupants >= center.userData.capacity ? 'Full' : 'Available'}`;
        
        this.showEducationalInfo("Evacuation Center", info);
    }

    onBoatClick(boat) {
        if (boat.userData.available) {
            this.showEducationalInfo("Rescue Boat", `This boat can rescue up to ${boat.userData.capacity} people. Use drag-and-drop interface to assign rescue missions.`);
        }
    }

    onBuildingInteract(building) {
        if (building.userData.floodRisk === 'high') {
            this.showEducationalInfo("Flood Risk Building", "This building is in a flood-prone area. Residents should be evacuated to higher ground immediately.");
        } else {
            this.showEducationalInfo("Safe Building", "This building is on higher ground and relatively safe from flooding.");
        }
    }

    onPersonInteract(person) {
        this.onResidentClick(person);
    }

    onEmergencyKitInteract(kit) {
        this.onSupplyClick(kit);
    }

    // UI feedback methods
    showEducationalInfo(title, text) {
        this.game.showInstructions(title, text, [
            {
                text: "Understood",
                callback: () => this.game.hideInstructions()
            }
        ]);
    }

    showHint(message) {
        const hintElement = document.createElement('div');
        hintElement.className = 'hint-message';
        hintElement.textContent = message;
        hintElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 1000;
            font-size: 14px;
            backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(hintElement);
        
        setTimeout(() => {
            if (hintElement.parentNode) {
                hintElement.parentNode.removeChild(hintElement);
            }
        }, 3000);
    }

    showAchievementMessage(message) {
        const achievementElement = document.createElement('div');
        achievementElement.className = 'achievement-message';
        achievementElement.textContent = message;
        achievementElement.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 1000;
            font-size: 16px;
            font-weight: bold;
            backdrop-filter: blur(10px);
            border: 2px solid #4caf50;
        `;
        
        document.body.appendChild(achievementElement);
        
        setTimeout(() => {
            if (achievementElement.parentNode) {
                achievementElement.parentNode.removeChild(achievementElement);
            }
        }, 4000);
    }

    calculateFinalScore() {
        const timeElapsed = (performance.now() - this.startTime) / 1000;
        const baseScore = this.score;
        
        const maxTime = 450; // 7.5 minutes
        const timeBonus = Math.max(0, Math.floor((maxTime - timeElapsed) / maxTime * 200));
        
        const accuracyBonus = Math.floor(this.accuracy * 2);
        
        const objectiveCount = Object.values(this.objectives).filter(Boolean).length;
        const objectiveBonus = objectiveCount * 100;
        
        // Special bonuses
        const rescueBonus = this.rescuedResidents * 25;
        const supplyBonus = this.suppliesDistributed * 15;
        
        return {
            baseScore,
            timeBonus,
            accuracyBonus,
            objectiveBonus,
            rescueBonus,
            supplyBonus,
            total: baseScore + timeBonus + accuracyBonus + objectiveBonus + rescueBonus + supplyBonus,
            timeElapsed: Math.floor(timeElapsed),
            accuracy: this.accuracy,
            objectives: this.objectives,
            rescued: this.rescuedResidents,
            supplies: this.suppliesDistributed
        };
    }

    completeSimulation() {
        const results = this.calculateFinalScore();
        
        this.game.updateProgress(100);
        
        const completionText = this.generateCompletionSummary(results);
        this.game.showInstructions(
            "Flood Response Training Complete!",
            completionText,
            [
                {
                    text: "View Results",
                    callback: () => {
                        this.game.hideInstructions();
                        this.game.completeSimulation({
                            disaster: 'flood',
                            score: results.total,
                            timeBonus: results.timeBonus,
                            accuracy: results.accuracy
                        });
                    }
                }
            ]
        );
    }

    generateCompletionSummary(results) {
        let summary = `You have completed the flood response training!\n\n`;
        summary += `Performance Summary:\n`;
        summary += `• Base Score: ${results.baseScore} points\n`;
        summary += `• Time Bonus: ${results.timeBonus} points\n`;
        summary += `• Rescue Operations: ${results.rescued}/${this.totalResidents} people\n`;
        summary += `• Supplies Distributed: ${results.supplies}/${this.emergencySupplies.length}\n`;
        summary += `• Accuracy: ${results.accuracy}%\n`;
        summary += `• Time Elapsed: ${Math.floor(results.timeElapsed / 60)}:${(results.timeElapsed % 60).toString().padStart(2, '0')}\n\n`;
        
        summary += `Learning Objectives:\n`;
        summary += `${results.objectives.prepareSupplies ? '✅' : '❌'} Emergency Supply Preparation\n`;
        summary += `${results.objectives.buildBarriers ? '✅' : '❌'} Flood Barrier Construction\n`;
        summary += `${results.objectives.evacuateResidents ? '✅' : '❌'} Resident Evacuation\n`;
        summary += `${results.objectives.rescueStranded ? '✅' : '❌'} Water Rescue Operations\n`;
        summary += `${results.objectives.establishShelter ? '✅' : '❌'} Emergency Shelter Setup\n\n`;
        
        summary += `Total Score: ${results.total} points`;
        
        return summary;
    }

    reset() {
        this.currentPhase = 0;
        this.score = 0;
        this.accuracy = 100;
        this.mistakes = 0;
        this.rescuedResidents = 0;
        this.suppliesDistributed = 0;
        this.barriersBuilt = 0;
        this.isFlooding = false;
        this.waterLevel = -5;
        
        Object.keys(this.objectives).forEach(key => {
            this.objectives[key] = false;
        });
        
        this.residents.forEach(resident => {
            resident.userData.rescued = false;
            resident.userData.inShelter = false;
            resident.userData.needsRescue = false;
            resident.userData.stranded = false;
        });
        
        this.emergencySupplies.forEach(supply => {
            supply.userData.collected = false;
        });
        
        this.evacuationCenters.forEach(center => {
            center.userData.occupants = 0;
            center.userData.supplies = 0;
        });
        
        this.boats.forEach(boat => {
            boat.userData.passengers = 0;
            boat.userData.available = true;
        });
        
        this.startTime = performance.now();
        this.startPhase(0);
    }

    cleanup() {
        this.residents = [];
        this.houses = [];
        this.emergencySupplies = [];
        this.evacuationCenters = [];
        this.boats = [];
        this.isFlooding = false;
        console.log('Flood simulation cleaned up');
    }
}