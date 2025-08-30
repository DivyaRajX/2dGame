// Landslide Simulation Module
class LandslideSimulation {
    constructor(gameEngine, gameInstance) {
        this.engine = gameEngine;
        this.game = gameInstance;
        this.currentPhase = 0;
        this.score = 0;
        this.startTime = 0;
        this.accuracy = 100;
        this.mistakes = 0;
        
        // Simulation objects
        this.hillside = null;
        this.houses = [];
        this.residents = [];
        this.warningSystem = null;
        this.safeZones = [];
        this.evacuationRoutes = [];
        
        // Phase tracking
        this.phases = [
            { name: 'warning_signs', duration: 45000 },
            { name: 'early_warning', duration: 60000 },
            { name: 'evacuation', duration: 90000 },
            { name: 'landslide_event', duration: 30000 }
        ];
        
        this.evacuatedResidents = 0;
        this.totalResidents = 6;
        this.warningSystemActivated = false;
        this.warningSignsFound = 0;
        this.totalWarningSigns = 13; // 3 cracks + 4 trees + 6 rocks
        
        // Learning objectives
        this.objectives = {
            identifyWarningSigns: false,
            activateWarningSystem: false,
            evacuateResidents: false,
            reachSafeZone: false,
            avoidDangerZone: false
        };
    }

    async start() {
        this.startTime = performance.now();
        await this.createHillsideScene();
        this.startPhase(0);
        this.showWelcomeInstructions();
    }

    async createHillsideScene() {
        // Create sloped ground for hillside
        this.createHillsideGround();
        
        // Create houses on the slope
        this.createHillsideHouses();
        
        // Create residents
        this.createResidents();
        
        // Create warning system
        this.createWarningSystem();
        
        // Create safe zones
        this.createSafeZones();
        
        // Create potential debris and warning signs
        this.createWarningSigns();
        
        // Set camera for hillside view
        this.engine.camera.position.set(30, 40, 50);
        this.engine.camera.lookAt(0, 10, 0);
    }

    createHillsideGround() {
        // Create sloped terrain
        const groundGeometry = new THREE.PlaneGeometry(100, 80, 20, 16);
        const vertices = groundGeometry.attributes.position.array;
        
        // Create slope with varying heights
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            // Create slope effect
            vertices[i + 1] = Math.max(0, (z + 40) * 0.3 + Math.sin(x * 0.1) * 2);
        }
        
        groundGeometry.attributes.position.needsUpdate = true;
        groundGeometry.computeVertexNormals();
        
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        this.hillside = new THREE.Mesh(groundGeometry, groundMaterial);
        this.hillside.rotation.x = -Math.PI / 2;
        this.hillside.receiveShadow = true;
        this.engine.scene.add(this.hillside);
    }

    createHillsideHouses() {
        const housePositions = [
            { x: -20, z: 10 }, { x: -10, z: 15 }, { x: 0, z: 20 },
            { x: 10, z: 25 }, { x: 20, z: 30 }, { x: -15, z: 35 }
        ];
        
        housePositions.forEach((pos, index) => {
            const height = this.getHeightAtPosition(pos.x, pos.z);
            const house = this.engine.createBuilding(4, 6, 4, pos.x, height, pos.z);
            house.userData.id = index;
            house.userData.residents = 1;
            house.userData.evacuated = false;
            this.houses.push(house);
        });
    }

    createResidents() {
        this.houses.forEach((house, index) => {
            const resident = this.engine.createPerson(
                house.position.x + 2,
                house.position.y - 3,
                house.position.z + 2,
                0x4169E1
            );
            
            resident.userData = {
                ...resident.userData,
                id: index,
                house: house,
                evacuated: false,
                atRisk: true,
                interactive: true,
                onInteract: (obj) => this.evacuateResident(obj)
            };
            
            this.residents.push(resident);
            this.engine.interactiveObjects.push(resident);
        });
    }

    createWarningSystem() {
        // Create warning siren/speaker
        const sirenGeometry = new THREE.ConeGeometry(1, 3, 8);
        const sirenMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4444 });
        
        this.warningSystem = new THREE.Mesh(sirenGeometry, sirenMaterial);
        this.warningSystem.position.set(0, 15, 0);
        this.warningSystem.userData = {
            type: 'warning_system',
            interactive: true,
            activated: false,
            onInteract: (obj) => this.activateWarningSystem()
        };
        
        this.engine.scene.add(this.warningSystem);
        this.engine.interactiveObjects.push(this.warningSystem);
    }

    createSafeZones() {
        // Create safe areas away from the slope
        const safePositions = [
            { x: -40, z: -30 }, { x: 40, z: -30 }
        ];
        
        safePositions.forEach(pos => {
            const safeZone = this.engine.createSafeZone(pos.x, 0, pos.z, 8);
            safeZone.userData.evacuees = 0;
            this.safeZones.push(safeZone);
        });
    }

    createWarningSigns() {
        // Create visible cracks in the ground
        const crackGeometry = new THREE.PlaneGeometry(10, 1, 1, 1);
        const crackMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        
        for (let i = 0; i < 3; i++) {
            const crack = new THREE.Mesh(crackGeometry, crackMaterial);
            crack.position.set(
                Math.random() * 30 - 15,
                this.getHeightAtPosition(0, 25) + 0.1,
                25 + Math.random() * 10
            );
            crack.rotation.x = -Math.PI / 2;
            crack.rotation.z = Math.random() * Math.PI;
            crack.userData = {
                type: 'ground_crack',
                interactive: true,
                warningSign: true,
                identified: false,
                onInteract: (obj) => this.onWarningSignClick(obj)
            };
            
            this.engine.scene.add(crack);
            this.engine.interactiveObjects.push(crack);
        }
        
        // Create tilting trees
        this.createTiltingTrees();
        
        // Create loose rocks
        this.createLooseRocks();
    }

    createTiltingTrees() {
        const treeGeometry = new THREE.CylinderGeometry(0.5, 0.8, 8, 8);
        const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        for (let i = 0; i < 4; i++) {
            const tree = new THREE.Mesh(treeGeometry, treeMaterial);
            const x = Math.random() * 20 - 10;
            const z = 20 + Math.random() * 15;
            
            tree.position.set(x, this.getHeightAtPosition(x, z) + 4, z);
            tree.rotation.z = Math.random() * 0.3 + 0.2; // Tilted
            tree.userData = {
                type: 'tilting_tree',
                interactive: true,
                warningSign: true,
                identified: false,
                onInteract: (obj) => this.onWarningSignClick(obj)
            };
            
            this.engine.scene.add(tree);
            this.engine.interactiveObjects.push(tree);
        }
    }

    createLooseRocks() {
        const rockGeometry = new THREE.SphereGeometry(1, 8, 8);
        const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        
        for (let i = 0; i < 6; i++) {
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            const x = Math.random() * 25 - 12.5;
            const z = 30 + Math.random() * 10;
            
            rock.position.set(x, this.getHeightAtPosition(x, z) + 1, z);
            rock.userData = {
                type: 'loose_rock',
                interactive: true,
                warningSign: true,
                identified: false,
                canRoll: true,
                onInteract: (obj) => this.onWarningSignClick(obj)
            };
            
            this.engine.scene.add(rock);
            this.engine.interactiveObjects.push(rock);
        }
    }

    getHeightAtPosition(x, z) {
        // Simple height calculation based on slope
        return Math.max(0, (z + 40) * 0.3);
    }

    showWelcomeInstructions() {
        this.game.showInstructions(
            "Welcome to Landslide Safety Training",
            "You are monitoring a hillside community. Learn to identify warning signs and coordinate evacuation procedures.",
            [
                {
                    text: "Start Training",
                    callback: () => this.game.hideInstructions()
                }
            ]
        );
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
            case 'warning_signs':
                this.startWarningSignsPhase();
                break;
            case 'early_warning':
                this.startEarlyWarningPhase();
                break;
            case 'evacuation':
                this.startEvacuationPhase();
                break;
            case 'landslide_event':
                this.startLandslideEvent();
                break;
        }
        
        setTimeout(() => {
            if (this.currentPhase === phaseIndex) {
                this.startPhase(phaseIndex + 1);
            }
        }, phase.duration);
    }

    startWarningSignsPhase() {
        this.game.showInstructions(
            "Phase 1: Identify Warning Signs",
            "Look for signs of potential landslide: ground cracks, tilting trees, loose rocks, and unusual water drainage. Click on suspicious objects.",
            [
                {
                    text: "Start Investigation",
                    callback: () => this.game.hideInstructions()
                }
            ]
        );
    }

    startEarlyWarningPhase() {
        this.game.showInstructions(
            "Phase 2: Early Warning System",
            "Warning signs detected! Activate the warning system to alert residents and prepare for evacuation.",
            [
                {
                    text: "Activate Warning",
                    callback: () => {
                        this.game.hideInstructions();
                        this.showWarningInterface();
                    }
                }
            ]
        );
    }

    showWarningInterface() {
        const warningItems = [
            { id: 'siren', text: '🚨 Emergency Siren', type: 'warning' },
            { id: 'radio', text: '📻 Radio Alert', type: 'warning' },
            { id: 'phone', text: '📱 Mobile Alert', type: 'warning' }
        ];
        
        const warningZones = [
            { id: 'community', text: 'Alert Community', accepts: ['warning'] },
            { id: 'authorities', text: 'Notify Authorities', accepts: ['warning'] }
        ];
        
        this.game.showDragDropPanel(warningItems, warningZones);
    }

    startEvacuationPhase() {
        this.game.hideDragDropPanel();
        this.game.showInstructions(
            "Phase 3: Evacuation",
            "Guide residents to safe zones away from the landslide path. Click on residents to evacuate them.",
            [
                {
                    text: "Begin Evacuation",
                    callback: () => this.game.hideInstructions()
                }
            ]
        );
        
        this.highlightEvacuationRoutes();
    }

    startLandslideEvent() {
        this.game.showInstructions(
            "⚠️ LANDSLIDE IN PROGRESS!",
            "The landslide has started! Ensure all residents are in safe zones and stay clear of the danger area.",
            [
                {
                    text: "Take Cover!",
                    callback: () => {
                        this.game.hideInstructions();
                        this.simulateLandslide();
                    }
                }
            ]
        );
    }

    simulateLandslide() {
        const startPos = new THREE.Vector3(0, 30, 40);
        const direction = new THREE.Vector3(0, -0.5, -1).normalize();
        
        // Create landslide debris
        const debris = this.engine.simulateLandslide(startPos, direction, 5);
        
        // Check for any residents still in danger
        this.checkResidentSafety();
    }

    // Event handlers
    onWarningSignClick(warningObject) {
        const warningTypes = {
            ground_crack: "Ground cracks indicate soil instability - a major landslide warning sign!",
            tilting_tree: "Tilting trees show ground movement - evacuate the area immediately!",
            loose_rock: "Loose rocks can indicate slope failure - warning sign of potential landslide!"
        };

        if (!warningObject.userData.identified) {
            warningObject.userData.identified = true;
            this.warningSignsFound++;
            
            // Change color to indicate it's been identified
            warningObject.material.color.setHex(0x00FF00);
            
            // Add points for identifying warning sign
            this.score += 10;
            
            // Show feedback message
            this.game.showFeedback(
                "Warning Sign Identified!",
                warningTypes[warningObject.userData.type] || "Good observation! This is a landslide warning sign.",
                2000
            );
            
            // Check if enough warning signs found
            if (this.warningSignsFound >= 5) {
                this.objectives.identifyWarningSigns = true;
                this.score += 50;
                this.game.showFeedback("Excellent! You've identified critical warning signs.", "", 3000);
            }
        } else {
            this.game.showFeedback("Already Identified", "You've already marked this warning sign.", 1000);
        }
    }

    activateWarningSystem() {
        if (!this.warningSystemActivated) {
            this.warningSystemActivated = true;
            this.objectives.activateWarningSystem = true;
            this.score += 100;
            
            // Change appearance to show activation
            this.warningSystem.material.color.setHex(0x00FF00);
            this.warningSystem.material.emissive.setHex(0x002200);
            
            // Animate the warning system
            const animate = () => {
                this.warningSystem.rotation.y += 0.1;
                if (this.warningSystemActivated) {
                    requestAnimationFrame(animate);
                }
            };
            animate();
            
            this.game.showFeedback(
                "Warning System Activated!",
                "Emergency alert sent to all residents. Evacuation procedures initiated.",
                3000
            );
        }
    }

    evacuateResident(resident) {
        if (!resident.userData.evacuated) {
            resident.userData.evacuated = true;
            this.evacuatedResidents++;
            
            // Move resident to nearest safe zone
            const nearestSafeZone = this.findNearestSafeZone(resident.position);
            if (nearestSafeZone) {
                this.animateResidentToSafeZone(resident, nearestSafeZone);
                nearestSafeZone.userData.evacuees++;
            }
            
            this.score += 50;
            
            this.game.showFeedback(
                "Resident Evacuated",
                `${this.evacuatedResidents}/${this.totalResidents} residents evacuated to safety.`,
                2000
            );
            
            // Check if all residents evacuated
            if (this.evacuatedResidents >= this.totalResidents) {
                this.objectives.evacuateResidents = true;
                this.score += 200;
                this.game.showFeedback("All Residents Safe!", "Excellent evacuation coordination!", 3000);
            }
        }
    }

    findNearestSafeZone(position) {
        let nearest = null;
        let minDistance = Infinity;
        
        this.safeZones.forEach(zone => {
            const distance = position.distanceTo(zone.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = zone;
            }
        });
        
        return nearest;
    }

    animateResidentToSafeZone(resident, safeZone) {
        const startPos = resident.position.clone();
        const endPos = safeZone.position.clone();
        endPos.y = 3; // Keep resident above ground
        
        const duration = 3000;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Lerp between start and end position
            resident.position.lerpVectors(startPos, endPos, progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Change color to indicate safety
                if (resident.material) {
                    resident.material.color.setHex(0x00FF00);
                }
            }
        };
        
        requestAnimationFrame(animate);
    }

    highlightEvacuationRoutes() {
        // Create visible paths to safe zones
        this.safeZones.forEach((safeZone, index) => {
            const pathGeometry = new THREE.CylinderGeometry(0.5, 0.5, 60, 8);
            const pathMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x00FF00,
                transparent: true,
                opacity: 0.3
            });
            
            const path = new THREE.Mesh(pathGeometry, pathMaterial);
            path.position.set(safeZone.position.x, 1, safeZone.position.z / 2);
            path.rotation.z = Math.PI / 2;
            
            this.engine.scene.add(path);
            this.evacuationRoutes.push(path);
        });
    }

    checkResidentSafety() {
        let residentsInDanger = 0;
        
        this.residents.forEach(resident => {
            if (!resident.userData.evacuated) {
                residentsInDanger++;
                // Flash red to indicate danger
                this.flashDanger(resident);
                this.mistakes++;
                this.accuracy = Math.max(0, 100 - (this.mistakes * 10));
            }
        });
        
        if (residentsInDanger === 0) {
            this.objectives.avoidDangerZone = true;
            this.score += 300;
        }
    }

    flashDanger(object) {
        const originalColor = object.material.color.getHex();
        let flashCount = 0;
        
        const flash = () => {
            object.material.color.setHex(flashCount % 2 === 0 ? 0xFF0000 : originalColor);
            flashCount++;
            
            if (flashCount < 10) {
                setTimeout(flash, 200);
            }
        };
        
        flash();
    }

    completeSimulation() {
        const endTime = performance.now();
        const timeElapsed = Math.round((endTime - this.startTime) / 1000);
        
        // Calculate final score
        let objectiveBonus = 0;
        Object.values(this.objectives).forEach(completed => {
            if (completed) objectiveBonus += 100;
        });
        
        const finalScore = this.score + objectiveBonus;
        
        // Determine performance rating
        let rating = "Needs Improvement";
        let message = "Review landslide safety procedures and try again.";
        
        if (finalScore >= 800) {
            rating = "Excellent";
            message = "Outstanding disaster response coordination!";
        } else if (finalScore >= 600) {
            rating = "Good";
            message = "Well done! You showed good emergency management skills.";
        } else if (finalScore >= 400) {
            rating = "Fair";
            message = "Decent performance, but there's room for improvement.";
        }
        
        const results = {
            score: finalScore,
            accuracy: this.accuracy,
            timeElapsed: timeElapsed,
            rating: rating,
            message: message,
            objectives: this.objectives,
            stats: {
                warningSignsFound: this.warningSignsFound,
                evacuatedResidents: this.evacuatedResidents,
                totalResidents: this.totalResidents,
                warningSystemActivated: this.warningSystemActivated
            }
        };
        
        this.showCompletionScreen(results);
    }

    showCompletionScreen(results) {
        const objectivesList = Object.entries(this.objectives)
            .map(([key, completed]) => {
                const objectiveNames = {
                    identifyWarningSigns: "Identify Warning Signs",
                    activateWarningSystem: "Activate Warning System",
                    evacuateResidents: "Evacuate All Residents",
                    reachSafeZone: "Guide to Safe Zones",
                    avoidDangerZone: "Avoid Danger Areas"
                };
                
                const status = completed ? "✅" : "❌";
                return `${status} ${objectiveNames[key] || key}`;
            }).join('\n');
        
        this.game.showInstructions(
            `Landslide Simulation Complete - ${results.rating}`,
            `${results.message}\n\nFinal Score: ${results.score}\nAccuracy: ${results.accuracy}%\nTime: ${results.timeElapsed}s\n\nObjectives:\n${objectivesList}\n\nStatistics:\nWarning Signs Found: ${results.stats.warningSignsFound}/${this.totalWarningSigns}\nResidents Evacuated: ${results.stats.evacuatedResidents}/${results.stats.totalResidents}\nWarning System: ${results.stats.warningSystemActivated ? "Activated" : "Not Activated"}`,
            [
                {
                    text: "Restart Simulation",
                    callback: () => this.restart()
                },
                {
                    text: "Main Menu",
                    callback: () => this.game.returnToMenu()
                }
            ]
        );
    }

    restart() {
        // Reset all variables
        this.currentPhase = 0;
        this.score = 0;
        this.accuracy = 100;
        this.mistakes = 0;
        this.evacuatedResidents = 0;
        this.warningSystemActivated = false;
        this.warningSignsFound = 0;
        
        // Reset objectives
        Object.keys(this.objectives).forEach(key => {
            this.objectives[key] = false;
        });
        
        // Clear scene and restart
        this.engine.clearScene();
        this.houses = [];
        this.residents = [];
        this.safeZones = [];
        this.evacuationRoutes = [];
        
        this.start();
    }

    // Handle drag and drop for warning system
    onDragDropComplete(item, zone) {
        if (zone.id === 'community' || zone.id === 'authorities') {
            if (item.type === 'warning') {
                this.score += 25;
                this.game.showFeedback(
                    "Alert Sent!",
                    `${item.text} activated for ${zone.text}`,
                    2000
                );
                
                // Auto-activate warning system after successful drag-drop
                setTimeout(() => {
                    this.activateWarningSystem();
                }, 1000);
            }
        }
    }

    // Update method for continuous simulation updates
    update() {
        // Update any ongoing animations or effects
        if (this.currentPhase === 3 && this.engine.landslideDebris) {
            // Update landslide debris movement
            this.engine.landslideDebris.forEach(debris => {
                debris.position.y -= 0.2;
                debris.position.z -= 0.3;
                debris.rotation.x += 0.1;
                debris.rotation.z += 0.05;
            });
        }
    }
}