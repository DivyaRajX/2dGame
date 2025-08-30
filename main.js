// Main Game Controller
class DisasterSimGame {
    constructor() {
        this.playerData = {
            totalScore: 0,
            level: 1,
            badges: [],
            completedSimulations: {}
        };
        
        this.currentSimulation = null;
        this.gameEngine = null;
        this.badgeSystem = new BadgeSystem();
        
        this.init();
        this.loadPlayerData();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        this.showWelcomeAnimation();
    }

    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentSimulation) {
                this.exitSimulation();
            }
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            if (this.gameEngine && this.gameEngine.renderer) {
                this.gameEngine.handleResize();
            }
        });

        // Prevent context menu on canvas
        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'CANVAS') {
                e.preventDefault();
            }
        });
    }

    showWelcomeAnimation() {
        const cards = document.querySelectorAll('.sim-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(50px)';
                card.style.transition = 'all 0.6s ease';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100);
            }, index * 200);
        });
    }

    loadPlayerData() {
        // In a real application, this would load from a backend
        // For demo purposes, using localStorage simulation
        const saved = localStorage.getItem('disasterSimPlayerData');
        if (saved) {
            try {
                this.playerData = {...this.playerData, ...JSON.parse(saved)};
            } catch (e) {
                console.warn('Could not load saved player data');
            }
        }
        this.updateUI();
    }

    savePlayerData() {
        // In a real application, this would save to a backend
        // For demo purposes, using localStorage simulation
        localStorage.setItem('disasterSimPlayerData', JSON.stringify(this.playerData));
    }

    updateUI() {
        document.getElementById('totalScore').textContent = this.playerData.totalScore;
        document.getElementById('badgeCount').textContent = this.playerData.badges.length;
        document.getElementById('playerLevel').textContent = this.playerData.level;

        // Update completion status
        Object.keys(this.playerData.completedSimulations).forEach(disaster => {
            const statusElement = document.getElementById(`${disaster}-status`);
            if (statusElement && this.playerData.completedSimulations[disaster]) {
                statusElement.textContent = 'Completed!';
                statusElement.className = 'completion-status completed';
            }
        });

        // Update badge display
        this.badgeSystem.updateBadgeDisplay(this.playerData.badges);
    }

    async startSimulation(disasterType) {
        try {
            this.showLoading(`Loading ${disasterType} simulation...`);
            
            // Hide main interface
            document.querySelector('.main-container').style.display = 'none';
            
            // Show simulation container
            const simContainer = document.getElementById('simulationContainer');
            simContainer.style.display = 'flex';
            
            // Set simulation title
            document.getElementById('currentSimTitle').textContent = 
                `${disasterType.charAt(0).toUpperCase() + disasterType.slice(1)} Response Training`;

            // Initialize the appropriate simulation
            await this.initializeSimulation(disasterType);
            
            this.hideLoading();
            this.currentSimulation = disasterType;

        } catch (error) {
            console.error('Failed to start simulation:', error);
            this.hideLoading();
            alert('Failed to load simulation. Please try again.');
        }
    }

    async initializeSimulation(disasterType) {
        const canvas = document.getElementById('simulationCanvas');
        
        // Initialize game engine
        this.gameEngine = new GameEngine(canvas);
        await this.gameEngine.init();

        // Load appropriate simulation module
        switch (disasterType) {
            case 'earthquake':
                this.simulationModule = new EarthquakeSimulation(this.gameEngine, this);
                break;
            case 'landslide':
                this.simulationModule = new LandslideSimulation(this.gameEngine, this);
                break;
            case 'flood':
                this.simulationModule = new FloodSimulation(this.gameEngine, this);
                break;
            default:
                throw new Error(`Unknown disaster type: ${disasterType}`);
        }

        // Start the simulation
        await this.simulationModule.start();
    }

    showLoading(message) {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingText = document.getElementById('loadingText');
        
        loadingText.textContent = message;
        loadingScreen.classList.add('visible');
    }

    hideLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.classList.remove('visible');
    }

    updateProgress(percentage) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${Math.round(percentage)}%`;
    }

    showInstructions(title, text, actions = []) {
        const panel = document.getElementById('instructionsPanel');
        const titleElement = document.getElementById('instructionTitle');
        const textElement = document.getElementById('instructionText');
        const actionsContainer = document.querySelector('.instruction-actions');

        titleElement.textContent = title;
        textElement.textContent = text;
        
        // Clear existing action buttons
        actionsContainer.innerHTML = '';
        
        // Add new action buttons
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = `action-btn ${action.type || 'primary'}`;
            button.textContent = action.text;
            button.onclick = action.callback;
            actionsContainer.appendChild(button);
        });

        // If no actions provided, add default continue button
        if (actions.length === 0) {
            const continueBtn = document.createElement('button');
            continueBtn.className = 'action-btn primary';
            continueBtn.textContent = 'Continue';
            continueBtn.onclick = () => this.hideInstructions();
            actionsContainer.appendChild(continueBtn);
        }

        panel.classList.add('visible');
    }

    hideInstructions() {
        const panel = document.getElementById('instructionsPanel');
        panel.classList.remove('visible');
    }

    showDragDropPanel(items, dropZones) {
        const panel = document.getElementById('dragDropPanel');
        const itemsContainer = document.getElementById('draggableItems');
        const zonesContainer = document.getElementById('dropZones');

        // Clear existing content
        itemsContainer.innerHTML = '';
        zonesContainer.innerHTML = '';

        // Create draggable items
        items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'draggable-item';
            itemElement.draggable = true;
            itemElement.textContent = item.text;
            itemElement.dataset.id = item.id;
            itemElement.dataset.type = item.type;

            // Add drag event listeners
            itemElement.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.id);
                e.target.classList.add('dragging');
            });

            itemElement.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });

            itemsContainer.appendChild(itemElement);
        });

        // Create drop zones
        dropZones.forEach((zone, index) => {
            const zoneElement = document.createElement('div');
            zoneElement.className = 'drop-zone';
            zoneElement.textContent = zone.text;
            zoneElement.dataset.accepts = zone.accepts;
            zoneElement.dataset.id = zone.id;

            // Add drop event listeners
            zoneElement.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.target.classList.add('drag-over');
            });

            zoneElement.addEventListener('dragleave', (e) => {
                e.target.classList.remove('drag-over');
            });

            zoneElement.addEventListener('drop', (e) => {
                e.preventDefault();
                e.target.classList.remove('drag-over');
                
                const draggedId = e.dataTransfer.getData('text/plain');
                const draggedElement = document.querySelector(`[data-id="${draggedId}"]`);
                
                if (draggedElement) {
                    const isCorrect = zone.accepts.includes(draggedElement.dataset.type);
                    
                    if (isCorrect) {
                        e.target.classList.add('correct');
                        e.target.textContent = draggedElement.textContent + ' ✓';
                        draggedElement.remove();
                        
                        // Notify simulation of correct drop
                        if (this.simulationModule && this.simulationModule.onCorrectDrop) {
                            this.simulationModule.onCorrectDrop(draggedId, zone.id);
                        }
                    } else {
                        e.target.classList.add('incorrect');
                        setTimeout(() => {
                            e.target.classList.remove('incorrect');
                        }, 1000);
                        
                        // Notify simulation of incorrect drop
                        if (this.simulationModule && this.simulationModule.onIncorrectDrop) {
                            this.simulationModule.onIncorrectDrop(draggedId, zone.id);
                        }
                    }
                }
            });

            zonesContainer.appendChild(zoneElement);
        });

        panel.classList.add('visible');
    }

    hideDragDropPanel() {
        const panel = document.getElementById('dragDropPanel');
        panel.classList.remove('visible');
    }

    completeSimulation(results) {
        const { score, timeBonus, accuracy, disaster } = results;
        
        // Update player data
        this.playerData.totalScore += score + timeBonus;
        this.playerData.completedSimulations[disaster] = {
            completed: true,
            score: score,
            timeBonus: timeBonus,
            accuracy: accuracy,
            completedAt: new Date().toISOString()
        };

        // Calculate level based on total score
        const newLevel = Math.floor(this.playerData.totalScore / 1000) + 1;
        if (newLevel > this.playerData.level) {
            this.playerData.level = newLevel;
        }

        // Award badge
        const badge = this.badgeSystem.getBadgeForDisaster(disaster);
        if (!this.playerData.badges.includes(badge.id)) {
            this.playerData.badges.push(badge.id);
            this.showBadgeModal(badge, results);
        }

        // Check for master badge
        const allDisasters = ['earthquake', 'landslide', 'flood'];
        const completedAll = allDisasters.every(d => this.playerData.completedSimulations[d]);
        if (completedAll && !this.playerData.badges.includes('master')) {
            this.playerData.badges.push('master');
        }

        this.savePlayerData();
        this.updateUI();
    }

    showBadgeModal(badge, results) {
        const modal = document.getElementById('badgeModal');
        const iconElement = document.getElementById('earnedBadgeIcon');
        const nameElement = document.getElementById('earnedBadgeName');
        const messageElement = document.getElementById('badgeMessage');
        const pointsElement = document.getElementById('pointsEarned');
        const timeBonusElement = document.getElementById('timeBonus');
        const accuracyElement = document.getElementById('accuracyScore');

        iconElement.textContent = badge.icon;
        nameElement.textContent = badge.name;
        messageElement.textContent = badge.description;
        pointsElement.textContent = results.score;
        timeBonusElement.textContent = results.timeBonus;
        accuracyElement.textContent = `${results.accuracy}%`;

        modal.classList.add('visible');
        
        // Play celebration sound (if available)
        this.playSound('badge_earned');
    }

    closeBadgeModal() {
        const modal = document.getElementById('badgeModal');
        modal.classList.remove('visible');
    }

    playSound(soundName) {
        // In a real implementation, you would have audio files
        // For now, we'll use the Web Audio API to create simple tones
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            if (soundName === 'badge_earned') {
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(783, audioContext.currentTime + 0.2); // G5
            }

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Could not play sound:', error);
        }
    }

    togglePause() {
        if (this.gameEngine) {
            this.gameEngine.togglePause();
            const pauseBtn = document.getElementById('pauseBtn');
            pauseBtn.textContent = this.gameEngine.isPaused ? '▶️' : '⏸️';
        }
    }

    resetSimulation() {
        if (this.simulationModule) {
            this.simulationModule.reset();
        }
    }

    exitSimulation() {
        if (this.gameEngine) {
            this.gameEngine.cleanup();
            this.gameEngine = null;
        }

        if (this.simulationModule) {
            this.simulationModule.cleanup();
            this.simulationModule = null;
        }

        // Hide simulation interface
        document.getElementById('simulationContainer').style.display = 'none';
        
        // Show main interface
        document.querySelector('.main-container').style.display = 'block';
        
        this.currentSimulation = null;
        this.hideInstructions();
        this.hideDragDropPanel();
    }
}

// Global functions for HTML onclick handlers
function startSimulation(disasterType) {
    if (window.gameInstance) {
        window.gameInstance.startSimulation(disasterType);
    }
}

function togglePause() {
    if (window.gameInstance) {
        window.gameInstance.togglePause();
    }
}

function resetSimulation() {
    if (window.gameInstance) {
        window.gameInstance.resetSimulation();
    }
}

function exitSimulation() {
    if (window.gameInstance) {
        window.gameInstance.exitSimulation();
    }
}

function closeBadgeModal() {
    if (window.gameInstance) {
        window.gameInstance.closeBadgeModal();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new DisasterSimGame();
    
    // Add some loading animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });

    document.querySelectorAll('.sim-card, .badge-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Export for use in other modules
window.DisasterSimGame = DisasterSimGame;