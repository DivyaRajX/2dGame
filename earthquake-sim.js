// Earthquake Simulation Module
class EarthquakeSimulation {
    constructor(gameEngine, gameInstance) {
        this.engine = gameEngine;
        this.game = gameInstance;
        this.currentPhase = 0;
        this.score = 0;
        this.startTime = 0;
        this.accuracy = 100;
        this.mistakes = 0;
        this.maxMistakes = 3;
        
        // Simulation objects
        this.classroom = null;
        this.students = [];
        this.teacher = null;
        this.desks = [];
        this.emergencyKit = null;
        this.exitDoors = [];
        
        // Phase tracking
        this.phases = [
            { name: 'preparation', duration: 30000 }, // 30 seconds
            { name: 'earthquake', duration: 45000 },  // 45 seconds
            { name: 'aftermath', duration: 60000 },   // 1 minute
            { name: 'evacuation', duration: 90000 }   // 1.5 minutes
        ];
        
        this.phaseStartTime = 0;
        this.isEarthquakeActive = false;
        this.evacuatedStudents = 0;
        this.totalStudents = 8;
        
        // Learning objectives
        this.objectives = {
            dropCoverHold: false,
            stayCalm: false,
            checkInjuries: false,
            evacuateSafely: false,
            assembleAtSafePoint: false
        };
        
        this.setupInstructions();
    }

    async start() {
        this.startTime = performance.now();
        await this.createClassroomScene();
        this.startPhase(0);
        this.showWelcomeInstructions();
    }

    setupInstructions() {
        this.instructionTexts = {
            welcome: {
                title: "Welcome to Earthquake Response Training",
                text: "You are in a classroom when an earthquake strikes. Learn the proper Drop, Cover, and Hold technique and evacuation procedures.",
                actions: [
                    {
                        text: "Start Training",
                        callback: () => this.game.hideInstructions()
                    }
                ]
            },
            preparation: {
                title: "Phase 1: Preparation",
                text: "Look around the classroom. Identify potential hazards and safe spots. Click on objects to learn more about earthquake safety.",
                actions: [
                    {
                        text: "Continue",
                        callback: () => this.game.hideInstructions()
                    }
                ]
            },
            earthquake: {
                title: "⚠️ EARTHQUAKE HAPPENING NOW!",
                text: "The ground is shaking! Immediately perform Drop, Cover, and Hold. Drag students to safe positions under desks.",
                actions: [
                    {
                        text: "Take Action!",
                        callback: () => this.startEarthquakePhase()
                    }
                ]
            },
            aftermath: {
                title: "Phase 3: Immediate Aftermath",
                text: "The shaking has stopped. Check for injuries and hazards before moving. Look for broken glass, fires, or structural damage.",
                actions: [
                    {
                        text: "Assess Situation",
                        callback: () => this.game.hideInstructions()
                    }
                ]
            },
            evacuation: {
                title: "Phase 4: Safe Evacuation",
                text: "It's time to evacuate. Guide all students to the emergency exit. Avoid elevators and watch for aftershocks.",
                actions: [
                    {
                        text: "Begin Evacuation",
                        callback: () => this.startEvacuationPhase()
                    }
                ]
            }
        };
    }

    async createClassroomScene() {
        // Create ground
        this.engine.createGround(100, 100);
        
        // Create classroom walls
        this.createClassroomWalls();
        
        // Create desks in rows
        this.createDesks();
        
        // Create students
        this.createStudents();
        
        // Create teacher
        this.teacher = this.engine.createPerson(0, 0, -15, 0x4169E1);
        this.teacher.userData.role = 'teacher';
        this.teacher.userData.name = 'Ms. Johnson';
        
        // Create emergency kit
        this.emergencyKit = this.engine.createEmergencyKit(20, 0, -18);
        
        // Create exit doors
        this.createExitDoors();
        
        // Create potential hazards
        this.createHazards();
        
        // Set camera position for classroom view
        this.engine.camera.position.set(0, 25, 35);
        this.engine.camera.lookAt(0, 0, 0);
    }

    createClassroomWalls() {
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 });
        
        // Back wall
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(40, 10, 1),
            wallMaterial
        );
        backWall.position.set(0, 5, -20);
        backWall.receiveShadow = true;
        this.engine.scene.add(backWall);
        
        // Side walls
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(1, 10, 40),
            wallMaterial
        );
        leftWall.position.set(-20, 5, 0);
        leftWall.receiveShadow = true;
        this.engine.scene.add(leftWall);
        
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(1, 10, 40),
            wallMaterial
        );
        rightWall.position.set(20, 5, 0);
        rightWall.receiveShadow = true;
        this.engine.scene.add(rightWall);
        
        // Add whiteboard
        const whiteboard = new THREE.Mesh(
            new THREE.BoxGeometry(12, 4, 0.2),
            new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
        );
        whiteboard.position.set(0, 6, -19.8);
        this.engine.scene.add(whiteboard);
    }

    createDesks() {
        const deskGeometry = new THREE.BoxGeometry(2, 1.5, 1.2);
        const deskMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        // Create 4 rows of 2 desks each
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 2; col++) {
                const desk = new THREE.Mesh(deskGeometry, deskMaterial);
                desk.position.set(
                    (col - 0.5) * 4,
                    0.75,
                    row * 4 - 8
                );
                desk.castShadow = true;
                desk.receiveShadow = true;
                desk.userData = {
                    type: 'desk',
                    interactive: true,
                    safe: true,
                    onInteract: (obj) => this.onDeskClick(obj)
                };
                
                this.engine.scene.add(desk);
                this.engine.interactiveObjects.push(desk);
                this.desks.push(desk);
            }
        }
    }

    createStudents() {
        const studentColors = [
            0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4,
            0xFECA57, 0xFF9FF3, 0x54A0FF, 0x5F27CD
        ];
        
        // Place students near desks
        for (let i = 0; i < this.totalStudents; i++) {
            const desk = this.desks[i];
            const student = this.engine.createPerson(
                desk.position.x + (Math.random() - 0.5) * 2,
                0,
                desk.position.z + 2,
                studentColors[i]
            );
            
            student.userData = {
                ...student.userData,
                role: 'student',
                id: i,
                name: `Student ${i + 1}`,
                safe: false,
                evacuated: false,
                assignedDesk: desk,
                onInteract: (obj) => this.onStudentClick(obj)
            };
            
            this.students.push(student);
        }
    }

    createExitDoors() {
        const doorGeometry = new THREE.BoxGeometry(3, 8, 0.5);
        const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        
        // Main exit door
        const mainExit = new THREE.Mesh(doorGeometry, doorMaterial);
        mainExit.position.set(-15, 4, 20);
        mainExit.userData = {
            type: 'exit_door',
            interactive: true,
            onInteract: (obj) => this.onExitClick(obj)
        };
        
        this.engine.scene.add(mainExit);
        this.engine.interactiveObjects.push(mainExit);
        this.exitDoors.push(mainExit);
        
        // Emergency exit
        const emergencyExit = new THREE.Mesh(doorGeometry, doorMaterial);
        emergencyExit.position.set(15, 4, 20);
        emergencyExit.userData = {
            type: 'emergency_exit',
            interactive: true,
            onInteract: (obj) => this.onExitClick(obj)
        };
        
        this.engine.scene.add(emergencyExit);
        this.engine.interactiveObjects.push(emergencyExit);
        this.exitDoors.push(emergencyExit);
        
        // Add exit signs
        this.createExitSigns();
    }

    createExitSigns() {
        const signGeometry = new THREE.BoxGeometry(2, 0.8, 0.1);
        const signMaterial = new THREE.MeshLambertMaterial({ color: 0x00FF00 });
        
        this.exitDoors.forEach(door => {
            const sign = new THREE.Mesh(signGeometry, signMaterial);
            sign.position.set(
                door.position.x,
                door.position.y + 4.5,
                door.position.z - 1
            );
            this.engine.scene.add(sign);
        });
    }

    createHazards() {
        // Create light fixtures that can fall
        const lightGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 16);
        const lightMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        
        for (let i = 0; i < 4; i++) {
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.set(
                (i % 2 - 0.5) * 20,
                9,
                Math.floor(i / 2) * 20 - 10
            );
            light.userData = {
                type: 'light_fixture',
                hazardous: true,
                canFall: true
            };
            this.engine.scene.add(light);
        }
        
        // Create windows that can break
        const windowGeometry = new THREE.BoxGeometry(4, 6, 0.2);
        const windowMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x87CEEB, 
            transparent: true, 
            opacity: 0.7 
        });
        
        for (let i = 0; i < 3; i++) {
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(-19.8, 6, i * 8 - 8);
            window.userData = {
                type: 'window',
                hazardous: true,
                canBreak: true
            };
            this.engine.scene.add(window);
        }
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
        this.phaseStartTime = performance.now();
        const phase = this.phases[phaseIndex];
        
        this.game.updateProgress((phaseIndex / this.phases.length) * 100);
        
        switch (phase.name) {
            case 'preparation':
                this.startPreparationPhase();
                break;
            case 'earthquake':
                this.showEarthquakeInstructions();
                break;
            case 'aftermath':
                this.startAftermathPhase();
                break;
            case 'evacuation':
                this.showEvacuationInstructions();
                break;
        }
        
        // Auto-advance to next phase
        setTimeout(() => {
            if (this.currentPhase === phaseIndex) {
                this.startPhase(phaseIndex + 1);
            }
        }, phase.duration);
    }

    startPreparationPhase() {
        const instruction = this.instructionTexts.preparation;
        this.game.showInstructions(instruction.title, instruction.text, instruction.actions);
        
        // Enable object highlighting for learning
        this.enableLearningMode();
    }

    showEarthquakeInstructions() {
        const instruction = this.instructionTexts.earthquake;
        this.game.showInstructions(instruction.title, instruction.text, instruction.actions);
    }

    startEarthquakePhase() {
        this.game.hideInstructions();
        this.isEarthquakeActive = true;
        
        // Start earthquake simulation
        this.engine.simulateEarthquake(0.8, 15000); // High intensity for 15 seconds
        
        // Show drag and drop interface for student positioning
        this.showDropCoverHoldInterface();
        
        // Add earthquake sound effect
        this.playEarthquakeSound();
        
        // Change lighting to emergency mode
        this.engine.directionalLight.intensity = 0.3;
        this.engine.ambientLight.intensity = 0.8;
    }

    showDropCoverHoldInterface() {
        const students = this.students.map((student, index) => ({
            id: `student_${index}`,
            text: `Student ${index + 1}`,
            type: 'person'
        }));
        
        const safeSpots = this.desks.map((desk, index) => ({
            id: `desk_${index}`,
            text: `Under Desk ${index + 1}`,
            accepts: ['person']
        }));
        
        this.game.showDragDropPanel(students, safeSpots);
    }

    onCorrectDrop(studentId, deskId) {
        const studentIndex = parseInt(studentId.split('_')[1]);
        const deskIndex = parseInt(deskId.split('_')[1]);
        
        const student = this.students[studentIndex];
        const desk = this.desks[deskIndex];
        
        if (student && desk) {
            // Move student to safe position under desk
            this.engine.moveObject(student, new THREE.Vector3(
                desk.position.x,
                0,
                desk.position.z
            ));
            
            student.userData.safe = true;
            this.score += 100;
            
            // Check if this completes Drop, Cover, Hold objective
            if (this.students.filter(s => s.userData.safe).length >= this.totalStudents * 0.75) {
                this.objectives.dropCoverHold = true;
                this.showAchievementMessage("✅ Drop, Cover, and Hold completed!");
            }
        }
    }

    onIncorrectDrop(studentId, deskId) {
        this.mistakes++;
        this.accuracy = Math.max(0, this.accuracy - 10);
        
        if (this.mistakes >= this.maxMistakes) {
            this.showErrorMessage("Too many mistakes! Remember: Drop, Cover, and Hold under sturdy furniture.");
        }
    }

    startAftermathPhase() {
        this.isEarthquakeActive = false;
        this.game.hideDragDropPanel();
        
        // Restore normal lighting
        this.engine.directionalLight.intensity = 0.8;
        this.engine.ambientLight.intensity = 0.6;
        
        const instruction = this.instructionTexts.aftermath;
        this.game.showInstructions(instruction.title, instruction.text, instruction.actions);
        
        // Create some aftermath effects
        this.createAftermathEffects();
    }

    createAftermathEffects() {
        // Simulate broken glass
        const glassGeometry = new THREE.PlaneGeometry(2, 2);
        const glassMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x87CEEB, 
            transparent: true, 
            opacity: 0.8 
        });
        
        for (let i = 0; i < 5; i++) {
            const glass = new THREE.Mesh(glassGeometry, glassMaterial);
            glass.position.set(
                Math.random() * 20 - 10,
                0.1,
                Math.random() * 20 - 10
            );
            glass.rotation.x = -Math.PI / 2;
            glass.userData = { type: 'broken_glass', hazard: true };
            this.engine.scene.add(glass);
        }
        
        // Add some smoke effects (simple particle system)
        this.createSmokeEffect();
    }

    createSmokeEffect() {
        const smokeGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const smokeMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x888888, 
            transparent: true, 
            opacity: 0.3 
        });
        
        for (let i = 0; i < 3; i++) {
            const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
            smoke.position.set(
                Math.random() * 10 - 5,
                2 + Math.random() * 3,
                Math.random() * 10 - 5
            );
            smoke.userData = { 
                type: 'smoke',
                velocity: new THREE.Vector3(0, 0.1, 0),
                life: 1.0
            };
            this.engine.scene.add(smoke);
            this.engine.physicsObjects.push(smoke);
        }
    }

    showEvacuationInstructions() {
        const instruction = this.instructionTexts.evacuation;
        this.game.showInstructions(instruction.title, instruction.text, instruction.actions);
    }

    startEvacuationPhase() {
        this.game.hideInstructions();
        
        // Create evacuation path indicators
        this.createEvacuationPaths();
        
        // Start moving students toward exits
        this.initiateEvacuation();
    }

    createEvacuationPaths() {
        const pathMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x00FF00, 
            transparent: true, 
            opacity: 0.5 
        });
        
        // Create path markers to exits
        for (let i = 0; i < 10; i++) {
            const marker = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8),
                pathMaterial
            );
            marker.position.set(
                -15 + (i * 1.5),
                0.1,
                -10 + (i * 3)
            );
            this.engine.scene.add(marker);
        }
    }

    initiateEvacuation() {
        // Move students toward exits one by one
        this.students.forEach((student, index) => {
            setTimeout(() => {
                if (!student.userData.evacuated) {
                    this.evacuateStudent(student);
                }
            }, index * 2000); // Stagger evacuations
        });
    }

    evacuateStudent(student) {
        const exitPosition = new THREE.Vector3(-15, 0, 25);
        this.engine.moveObject(student, exitPosition, 3);
        
        // Mark as evacuated after movement completes
        setTimeout(() => {
            student.userData.evacuated = true;
            this.evacuatedStudents++;
            this.score += 50;
            
            // Remove student from scene (they've exited)
            this.engine.scene.remove(student);
            
            // Check if all students are evacuated
            if (this.evacuatedStudents >= this.totalStudents) {
                this.objectives.evacuateSafely = true;
                this.objectives.assembleAtSafePoint = true;
                this.showAchievementMessage("🎉 All students evacuated safely!");
                
                // Complete simulation early if all objectives met
                setTimeout(() => {
                    this.completeSimulation();
                }, 2000);
            }
        }, 3000);
    }

    enableLearningMode() {
        // Add educational tooltips to objects
        this.desks.forEach(desk => {
            desk.userData.tooltip = "Sturdy desk - Good for Drop, Cover, and Hold";
        });
        
        this.exitDoors.forEach(door => {
            door.userData.tooltip = "Emergency exit - Use for evacuation after shaking stops";
        });
        
        if (this.emergencyKit) {
            this.emergencyKit.userData.tooltip = "Emergency kit - Contains first aid supplies";
        }
    }

    // Event handlers
    onDeskClick(desk) {
        if (this.currentPhase === 0) {
            this.showEducationalInfo("Desk Safety", "This desk provides good protection during an earthquake. The 'Drop, Cover, and Hold' technique involves getting under sturdy furniture like this.");
        }
        this.score += 10;
    }

    onStudentClick(student) {
        if (this.isEarthquakeActive && !student.userData.safe) {
            this.showHint(`Help ${student.userData.name} get to safety under a desk!`);
        } else if (this.currentPhase === 3 && !student.userData.evacuated) {
            this.evacuateStudent(student);
        }
    }

    onExitClick(exit) {
        if (this.currentPhase === 0) {
            this.showEducationalInfo("Emergency Exit", "Always know where the emergency exits are located. Never use elevators during an earthquake.");
        } else if (this.currentPhase === 3) {
            this.showHint("Guide students to this exit for safe evacuation.");
        }
        this.score += 10;
    }

    // Interaction handlers from game engine
    onBuildingInteract(building) {
        this.showEducationalInfo("Building Safety", "During an earthquake, stay inside until the shaking stops. Modern buildings are designed to withstand earthquakes.");
    }

    onPersonInteract(person) {
        if (person.userData.role === 'student') {
            this.onStudentClick(person);
        } else if (person.userData.role === 'teacher') {
            this.showEducationalInfo("Teacher Role", "Teachers should help students perform Drop, Cover, and Hold, then assist with evacuation.");
        }
    }

    onEmergencyKitInteract(kit) {
        this.showEducationalInfo("Emergency Kit", "Emergency kits should contain first aid supplies, flashlights, water, and emergency contact information.");
        this.objectives.checkInjuries = true;
        this.score += 50;
    }

    // UI feedback methods
    showEducationalInfo(title, text) {
        this.game.showInstructions(title, text, [
            {
                text: "Got it!",
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
        
        // Play success sound
        this.playSuccessSound();
    }

    showErrorMessage(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(244, 67, 54, 0.9);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 1000;
            font-size: 16px;
            font-weight: bold;
            backdrop-filter: blur(10px);
            border: 2px solid #f44336;
        `;
        
        document.body.appendChild(errorElement);
        
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
        }, 4000);
    }

    // Audio effects
    playEarthquakeSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();

            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Low frequency rumble
            oscillator.frequency.setValueAtTime(30, audioContext.currentTime);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(100, audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 15);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 15);
        } catch (error) {
            console.warn('Could not play earthquake sound:', error);
        }
    }

    playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Success chime
            oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.2); // E5
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Could not play success sound:', error);
        }
    }

    // Scoring and completion
    calculateFinalScore() {
        const timeElapsed = (performance.now() - this.startTime) / 1000;
        const baseScore = this.score;
        
        // Time bonus (faster completion = higher bonus)
        const maxTime = 300; // 5 minutes
        const timeBonus = Math.max(0, Math.floor((maxTime - timeElapsed) / maxTime * 200));
        
        // Accuracy bonus
        const accuracyBonus = Math.floor(this.accuracy * 2);
        
        // Objective completion bonus
        const objectiveCount = Object.values(this.objectives).filter(Boolean).length;
        const objectiveBonus = objectiveCount * 100;
        
        return {
            baseScore,
            timeBonus,
            accuracyBonus,
            objectiveBonus,
            total: baseScore + timeBonus + accuracyBonus + objectiveBonus,
            timeElapsed: Math.floor(timeElapsed),
            accuracy: this.accuracy,
            objectives: this.objectives
        };
    }

    completeSimulation() {
        const results = this.calculateFinalScore();
        
        // Update progress to 100%
        this.game.updateProgress(100);
        
        // Show completion summary
        const completionText = this.generateCompletionSummary(results);
        this.game.showInstructions(
            "🎉 Earthquake Simulation Complete!",
            completionText,
            [
                {
                    text: "View Results",
                    callback: () => {
                        this.game.hideInstructions();
                        this.game.completeSimulation({
                            disaster: 'earthquake',
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
        let summary = `Excellent work! You've completed the earthquake response training.\n\n`;
        summary += `📊 Performance Summary:\n`;
        summary += `• Base Score: ${results.baseScore} points\n`;
        summary += `• Time Bonus: ${results.timeBonus} points\n`;
        summary += `• Accuracy: ${results.accuracy}%\n`;
        summary += `• Time Elapsed: ${Math.floor(results.timeElapsed / 60)}:${(results.timeElapsed % 60).toString().padStart(2, '0')}\n\n`;
        
        summary += `✅ Learning Objectives:\n`;
        summary += `${results.objectives.dropCoverHold ? '✅' : '❌'} Drop, Cover, and Hold\n`;
        summary += `${results.objectives.stayCalm ? '✅' : '❌'} Remain Calm During Shaking\n`;
        summary += `${results.objectives.checkInjuries ? '✅' : '❌'} Check for Injuries\n`;
        summary += `${results.objectives.evacuateSafely ? '✅' : '❌'} Safe Evacuation\n`;
        summary += `${results.objectives.assembleAtSafePoint ? '✅' : '❌'} Assembly at Safe Point\n\n`;
        
        summary += `🎯 Total Score: ${results.total} points`;
        
        return summary;
    }

    reset() {
        // Reset simulation state
        this.currentPhase = 0;
        this.score = 0;
        this.accuracy = 100;
        this.mistakes = 0;
        this.evacuatedStudents = 0;
        this.isEarthquakeActive = false;
        
        // Reset objectives
        Object.keys(this.objectives).forEach(key => {
            this.objectives[key] = false;
        });
        
        // Reset student states
        this.students.forEach(student => {
            student.userData.safe = false;
            student.userData.evacuated = false;
        });
        
        // Restart from beginning
        this.startTime = performance.now();
        this.startPhase(0);
    }

    cleanup() {
        // Clean up any intervals or timeouts
        if (this.phaseTimer) {
            clearTimeout(this.phaseTimer);
        }
        
        // Remove event listeners
        this.students = [];
        this.desks = [];
        this.exitDoors = [];
        
        console.log('Earthquake simulation cleaned up');
    }
}