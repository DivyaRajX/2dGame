// Badge and Achievement System
class BadgeSystem {
    constructor() {
        this.badges = {
            earthquake: {
                id: 'earthquake',
                name: 'Earthquake Expert',
                icon: '🏗️',
                description: 'Master of earthquake response protocols',
                requirements: {
                    completeSimulation: 'earthquake',
                    minScore: 500,
                    maxTime: 900 // 15 minutes
                }
            },
            landslide: {
                id: 'landslide',
                name: 'Landslide Guardian',
                icon: '🏔️',
                description: 'Expert in landslide safety measures',
                requirements: {
                    completeSimulation: 'landslide',
                    minScore: 600,
                    maxTime: 1200 // 20 minutes
                }
            },
            flood: {
                id: 'flood',
                name: 'Flood Hero',
                icon: '🏊',
                description: 'Champion of flood emergency response',
                requirements: {
                    completeSimulation: 'flood',
                    minScore: 700,
                    maxTime: 1500 // 25 minutes
                }
            },
            master: {
                id: 'master',
                name: 'Disaster Master',
                icon: '🌟',
                description: 'Complete all simulations with excellence',
                requirements: {
                    completeAllSimulations: true,
                    totalScore: 2000
                }
            },
            speedRunner: {
                id: 'speedRunner',
                name: 'Quick Response',
                icon: '⚡',
                description: 'Complete any simulation in record time',
                requirements: {
                    completeAnyIn: 300 // 5 minutes
                }
            },
            perfectionist: {
                id: 'perfectionist',
                name: 'Perfect Score',
                icon: '💯',
                description: 'Achieve 100% accuracy in any simulation',
                requirements: {
                    perfectAccuracy: true
                }
            },
            lifeSaver: {
                id: 'lifeSaver',
                name: 'Life Saver',
                icon: '🚨',
                description: 'Successfully evacuate all people in a simulation',
                requirements: {
                    evacuateAll: true
                }
            },
            educator: {
                id: 'educator',
                name: 'Disaster Educator',
                icon: '📚',
                description: 'Share knowledge by completing tutorial mode',
                requirements: {
                    completeTutorials: 3
                }
            }
        };

        this.earnedBadges = [];
        this.achievements = [];
    }

    getBadgeForDisaster(disasterType) {
        return this.badges[disasterType];
    }

    checkBadgeRequirements(badgeId, playerStats) {
        const badge = this.badges[badgeId];
        if (!badge) return false;

        const req = badge.requirements;
        
        // Check specific simulation completion
        if (req.completeSimulation) {
            const simulation = playerStats.completedSimulations[req.completeSimulation];
            if (!simulation || !simulation.completed) return false;
            
            if (req.minScore && simulation.score < req.minScore) return false;
            if (req.maxTime && simulation.timeElapsed > req.maxTime) return false;
        }

        // Check all simulations completion
        if (req.completeAllSimulations) {
            const requiredSims = ['earthquake', 'landslide', 'flood'];
            const completed = requiredSims.every(sim => 
                playerStats.completedSimulations[sim] && 
                playerStats.completedSimulations[sim].completed
            );
            if (!completed) return false;
        }

        // Check total score
        if (req.totalScore && playerStats.totalScore < req.totalScore) return false;

        // Check speed requirements
        if (req.completeAnyIn) {
            const fastCompletion = Object.values(playerStats.completedSimulations)
                .some(sim => sim.timeElapsed <= req.completeAnyIn);
            if (!fastCompletion) return false;
        }

        // Check accuracy requirements
        if (req.perfectAccuracy) {
            const perfectRun = Object.values(playerStats.completedSimulations)
                .some(sim => sim.accuracy >= 100);
            if (!perfectRun) return false;
        }

        return true;
    }

    updateBadgeDisplay(earnedBadgeIds) {
        Object.keys(this.badges).forEach(badgeId => {
            const badgeElement = document.getElementById(`badge-${badgeId}`);
            if (badgeElement) {
                if (earnedBadgeIds.includes(badgeId)) {
                    badgeElement.classList.remove('locked');
                    badgeElement.classList.add('earned');
                } else {
                    badgeElement.classList.add('locked');
                    badgeElement.classList.remove('earned');
                }
            }
        });
    }

    generateBadgeHTML(badge, earned = false) {
        return `
            <div class="badge-item ${earned ? 'earned' : 'locked'}" id="badge-${badge.id}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-description">${badge.description}</div>
            </div>
        `;
    }

    getAllBadges() {
        return Object.values(this.badges);
    }

    getEarnedBadges(playerStats) {
        const earned = [];
        
        Object.keys(this.badges).forEach(badgeId => {
            if (this.checkBadgeRequirements(badgeId, playerStats)) {
                earned.push(this.badges[badgeId]);
            }
        });

        return earned;
    }

    calculateBadgeProgress(badgeId, playerStats) {
        const badge = this.badges[badgeId];
        if (!badge) return 0;

        const req = badge.requirements;
        let progress = 0;
        let totalRequirements = 0;

        // Calculate progress based on different requirements
        if (req.completeSimulation) {
            totalRequirements++;
            const simulation = playerStats.completedSimulations[req.completeSimulation];
            if (simulation && simulation.completed) {
                progress++;
            }
        }

        if (req.minScore) {
            totalRequirements++;
            const simulation = playerStats.completedSimulations[req.completeSimulation];
            if (simulation && simulation.score >= req.minScore) {
                progress++;
            }
        }

        if (req.maxTime) {
            totalRequirements++;
            const simulation = playerStats.completedSimulations[req.completeSimulation];
            if (simulation && simulation.timeElapsed <= req.maxTime) {
                progress++;
            }
        }

        if (req.completeAllSimulations) {
            totalRequirements += 3;
            const requiredSims = ['earthquake', 'landslide', 'flood'];
            requiredSims.forEach(sim => {
                if (playerStats.completedSimulations[sim] && 
                    playerStats.completedSimulations[sim].completed) {
                    progress++;
                }
            });
        }

        return totalRequirements > 0 ? (progress / totalRequirements) * 100 : 0;
    }

    showBadgeTooltip(badgeId, playerStats) {
        const badge = this.badges[badgeId];
        if (!badge) return '';

        const progress = this.calculateBadgeProgress(badgeId, playerStats);
        const isEarned = progress >= 100;

        let tooltip = `<div class="badge-tooltip">`;
        tooltip += `<h4>${badge.name}</h4>`;
        tooltip += `<p>${badge.description}</p>`;
        
        if (!isEarned) {
            tooltip += `<div class="progress-bar">`;
            tooltip += `<div class="progress-fill" style="width: ${progress}%"></div>`;
            tooltip += `</div>`;
            tooltip += `<p>Progress: ${Math.round(progress)}%</p>`;
            
            // Show specific requirements
            tooltip += `<div class="requirements">`;
            const req = badge.requirements;
            
            if (req.completeSimulation) {
                const simulation = playerStats.completedSimulations[req.completeSimulation];
                const completed = simulation && simulation.completed;
                tooltip += `<div class="requirement ${completed ? 'completed' : 'pending'}">`;
                tooltip += `${completed ? '✅' : '⏳'} Complete ${req.completeSimulation} simulation`;
                tooltip += `</div>`;
            }
            
            if (req.minScore) {
                const simulation = playerStats.completedSimulations[req.completeSimulation];
                const score = simulation ? simulation.score : 0;
                const achieved = score >= req.minScore;
                tooltip += `<div class="requirement ${achieved ? 'completed' : 'pending'}">`;
                tooltip += `${achieved ? '✅' : '⏳'} Score at least ${req.minScore} points (${score}/${req.minScore})`;
                tooltip += `</div>`;
            }
            
            if (req.maxTime) {
                const simulation = playerStats.completedSimulations[req.completeSimulation];
                const time = simulation ? simulation.timeElapsed : Infinity;
                const achieved = time <= req.maxTime;
                tooltip += `<div class="requirement ${achieved ? 'completed' : 'pending'}">`;
                tooltip += `${achieved ? '✅' : '⏳'} Complete within ${Math.floor(req.maxTime / 60)} minutes`;
                tooltip += `</div>`;
            }
            
            tooltip += `</div>`;
        } else {
            tooltip += `<p class="earned-text">🎉 Badge Earned!</p>`;
        }
        
        tooltip += `</div>`;
        return tooltip;
    }

    // Leaderboard functionality
    getLeaderboardData() {
        // In a real application, this would fetch from a server
        return [
            { name: 'Alex Johnson', score: 2850, badges: 8, level: 5 },
            { name: 'Sarah Chen', score: 2640, badges: 7, level: 4 },
            { name: 'Michael Rodriguez', score: 2420, badges: 6, level: 4 },
            { name: 'Emily Davis', score: 2180, badges: 5, level: 3 },
            { name: 'David Kim', score: 1950, badges: 4, level: 3 },
            { name: 'Lisa Thompson', score: 1720, badges: 4, level: 2 },
            { name: 'James Wilson', score: 1580, badges: 3, level: 2 },
            { name: 'Maria Garcia', score: 1340, badges: 3, level: 2 },
            { name: 'Robert Brown', score: 1120, badges: 2, level: 1 },
            { name: 'Jennifer Lee', score: 980, badges: 2, level: 1 }
        ];
    }

    generateLeaderboardHTML() {
        const data = this.getLeaderboardData();
        let html = `
            <div class="leaderboard">
                <h3>🏆 Global Leaderboard</h3>
                <div class="leaderboard-list">
        `;

        data.forEach((player, index) => {
            const rank = index + 1;
            let rankIcon = '🥇';
            if (rank === 2) rankIcon = '🥈';
            else if (rank === 3) rankIcon = '🥉';
            else if (rank <= 10) rankIcon = '🏅';

            html += `
                <div class="leaderboard-item">
                    <div class="rank">${rankIcon} #${rank}</div>
                    <div class="player-info">
                        <div class="player-name">${player.name}</div>
                        <div class="player-stats">
                            <span>⭐ ${player.score}</span>
                            <span>🏆 ${player.badges}</span>
                            <span>📈 Lvl ${player.level}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    // Achievement notifications
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-text">
                    <div class="achievement-title">Achievement Unlocked!</div>
                    <div class="achievement-name">${achievement.name}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('visible');
        }, 100);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);

        // Play achievement sound
        this.playAchievementSound();
    }

    playAchievementSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create achievement melody
            const notes = [
                { frequency: 523, duration: 0.2 }, // C5
                { frequency: 659, duration: 0.2 }, // E5
                { frequency: 784, duration: 0.2 }, // G5
                { frequency: 1047, duration: 0.4 } // C6
            ];

            let currentTime = audioContext.currentTime;

            notes.forEach(note => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(note.frequency, currentTime);
                gainNode.gain.setValueAtTime(0.3, currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);

                oscillator.start(currentTime);
                oscillator.stop(currentTime + note.duration);

                currentTime += note.duration;
            });
        } catch (error) {
            console.warn('Could not play achievement sound:', error);
        }
    }

    // Badge sharing functionality
    generateBadgeShareImage(badge) {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 400, 300);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 300);

        // Badge container
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.roundRect = function(x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.beginPath();
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            this.closePath();
            return this;
        };
        ctx.roundRect(50, 50, 300, 200, 20).fill();

        // Badge icon
        ctx.font = '72px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(badge.icon, 200, 130);

        // Badge name
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(badge.name, 200, 170);

        // Badge description
        ctx.font = '16px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(badge.description, 200, 200);

        // Footer text
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('DisasterSim Academy', 200, 270);

        return canvas.toDataURL();
    }

    shareBadge(badgeId) {
        const badge = this.badges[badgeId];
        if (!badge) return;

        if (navigator.share) {
            // Use native sharing if available
            const imageData = this.generateBadgeShareImage(badge);
            navigator.share({
                title: `I earned the ${badge.name} badge!`,
                text: `${badge.description} - DisasterSim Academy`,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback to copying to clipboard
            const shareText = `🎉 I just earned the "${badge.name}" badge in DisasterSim Academy! ${badge.description} #DisasterPreparedness #Learning`;
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(shareText).then(() => {
                    alert('Badge achievement copied to clipboard!');
                });
            } else {
                // Final fallback
                const textArea = document.createElement('textarea');
                textArea.value = shareText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Badge achievement copied to clipboard!');
            }
        }
    }

    // Progress tracking
    getOverallProgress(playerStats) {
        const totalBadges = Object.keys(this.badges).length;
        const earnedBadges = this.getEarnedBadges(playerStats).length;
        
        const totalSimulations = 3;
        const completedSimulations = Object.values(playerStats.completedSimulations)
            .filter(sim => sim.completed).length;

        return {
            badgeProgress: (earnedBadges / totalBadges) * 100,
            simulationProgress: (completedSimulations / totalSimulations) * 100,
            overallProgress: ((earnedBadges + completedSimulations) / (totalBadges + totalSimulations)) * 100
        };
    }

    // Statistics generation
    generatePlayerReport(playerStats) {
        const progress = this.getOverallProgress(playerStats);
        const earnedBadges = this.getEarnedBadges(playerStats);
        
        return {
            totalScore: playerStats.totalScore,
            level: playerStats.level,
            badgesEarned: earnedBadges.length,
            totalBadges: Object.keys(this.badges).length,
            simulationsCompleted: Object.values(playerStats.completedSimulations)
                .filter(sim => sim.completed).length,
            totalSimulations: 3,
            overallProgress: progress.overallProgress,
            strengths: this.getPlayerStrengths(playerStats),
            recommendations: this.getRecommendations(playerStats)
        };
    }

    getPlayerStrengths(playerStats) {
        const strengths = [];
        
        // Analyze completion times
        const completions = Object.values(playerStats.completedSimulations);
        const avgTime = completions.reduce((sum, sim) => sum + sim.timeElapsed, 0) / completions.length;
        
        if (avgTime < 600) { // 10 minutes average
            strengths.push('Quick Decision Making');
        }
        
        // Analyze scores
        const avgScore = completions.reduce((sum, sim) => sum + sim.score, 0) / completions.length;
        if (avgScore > 700) {
            strengths.push('Excellent Safety Knowledge');
        }
        
        // Analyze accuracy
        const avgAccuracy = completions.reduce((sum, sim) => sum + sim.accuracy, 0) / completions.length;
        if (avgAccuracy > 85) {
            strengths.push('High Accuracy');
        }
        
        return strengths.length > 0 ? strengths : ['Dedicated Learner'];
    }

    getRecommendations(playerStats) {
        const recommendations = [];
        const completions = Object.values(playerStats.completedSimulations);
        
        // Check which simulations need improvement
        ['earthquake', 'landslide', 'flood'].forEach(disaster => {
            const sim = playerStats.completedSimulations[disaster];
            if (!sim || !sim.completed) {
                recommendations.push(`Try the ${disaster} simulation to expand your knowledge`);
            } else if (sim.accuracy < 75) {
                recommendations.push(`Review ${disaster} safety protocols to improve accuracy`);
            }
        });
        
        // General recommendations
        if (completions.length > 0) {
            const avgAccuracy = completions.reduce((sum, sim) => sum + sim.accuracy, 0) / completions.length;
            if (avgAccuracy < 80) {
                recommendations.push('Take time to read instructions carefully');
            }
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Great job! Try helping others learn disaster preparedness');
        }
        
        return recommendations;
    }

    // Badge verification (for preventing cheating in a real system)
    verifyBadgeEligibility(badgeId, playerStats) {
        // In a real system, this would verify with server-side data
        return this.checkBadgeRequirements(badgeId, playerStats);
    }
}