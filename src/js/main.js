/**
 * Main Game Entry Point
 * Initializes and starts the AgenticWorldGame
 */

// Global game instance
let gameEngine = null;

// Debug mode (can be toggled in browser console)
window.DEBUG_MODE = false;

/**
 * Initialize and start the game
 */
async function initGame() {
    try {
        console.log('Initializing AgenticWorldGame...');
        
        // Check for required elements
        if (!document.getElementById('gameCanvas')) {
            throw new Error('Game canvas not found');
        }
        
        // Create game engine
        gameEngine = new GameEngine();
        
        // Wait for initialization to complete
        await gameEngine.init();

        // Apply AI configuration if provided via environment
        applyEnvironmentAIConfig();
        
        // Set up global event listeners
        setupGlobalEvents();
        
        // Start the game
        gameEngine.start();
        
        console.log('AgenticWorldGame started successfully!');
        
        // Expose game engine to global scope for debugging
        window.gameEngine = gameEngine;
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showErrorMessage('Failed to initialize game: ' + error.message);
    }
}

/**
 * Set up global event listeners
 */
function setupGlobalEvents() {
    // Window resize handler
    window.addEventListener('resize', debounce(() => {
        if (gameEngine && gameEngine.renderer) {
            // Handle canvas resize if needed
            console.log('Window resized');
        }
    }, 250));
    
    // Visibility change (pause when tab is hidden)
    document.addEventListener('visibilitychange', () => {
        if (!gameEngine) return;
        
        if (document.hidden) {
            gameEngine.pause();
        } else if (!gameEngine.chatInterface.isOpen) {
            gameEngine.resume();
        }
    });
    
    // Game engine events
    if (gameEngine) {
        gameEngine.on('gameStarted', () => {
            console.log('Game started');
        });
        
        gameEngine.on('gamePaused', () => {
            console.log('Game paused');
        });
        
        gameEngine.on('gameResumed', () => {
            console.log('Game resumed');
        });
        
        gameEngine.on('conversationStarted', (agent) => {
            console.log(`Conversation started with ${agent.name}`);
        });
    }
}

/**
 * Configure all AI agents using environment configuration if available
 */
function applyEnvironmentAIConfig() {
    if (!gameEngine || !window.__AI_CONFIG__) {
        return;
    }

    const config = window.__AI_CONFIG__;

    if (!config.enabled) {
        console.log('AI environment configuration not enabled. Using fallback responses.');
        return;
    }

    const agentConfigs = {
        endpoint: config.apiEndpoint || null,
        apiKey: config.apiKey || null,
        model: config.model || 'gpt-3.5-turbo',
        temperature: typeof config.temperature === 'number' ? config.temperature : undefined,
        maxTokens: typeof config.maxTokens === 'number' ? config.maxTokens : undefined
    };

    if (!agentConfigs.endpoint) {
        console.warn('AI environment configuration missing endpoint. Skipping AI setup.');
        return;
    }

    gameEngine.agents.forEach((agent) => {
        if (agent.aiAgent && typeof agent.aiAgent.setAPIConfiguration === 'function') {
            agent.aiAgent.setAPIConfiguration(agentConfigs);
        }
    });

    console.log('Applied AI configuration from environment for all agents.');
}

/**
 * Show error message to user
 */
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #e74c3c;
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 9999;
        max-width: 400px;
        text-align: center;
        font-family: Arial, sans-serif;
    `;
    errorDiv.innerHTML = `
        <h3>Game Error</h3>
        <p>${message}</p>
        <button onclick="this.parentElement.remove()" style="
            background: white;
            color: #e74c3c;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            margin-top: 10px;
            cursor: pointer;
        ">Close</button>
    `;
    document.body.appendChild(errorDiv);
}

/**
 * Utility function for debouncing events
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Debug functions (available in browser console)
 */
window.debugFunctions = {
    // Toggle debug mode
    toggleDebug: () => {
        window.DEBUG_MODE = !window.DEBUG_MODE;
        console.log('Debug mode:', window.DEBUG_MODE);
    },
    
    // Get game stats
    getStats: () => {
        if (!gameEngine) return null;
        
        return {
            player: gameEngine.player ? gameEngine.player.getStats() : null,
            agents: Array.from(gameEngine.agents.values()).map(agent => ({
                name: agent.name,
                position: agent.position,
                mood: agent.currentMood,
                trustLevel: agent.trustLevel,
                conversationCount: agent.memory.conversations.length
            })),
            world: gameEngine.world ? gameEngine.world.getWorldInfo() : null,
            performance: {
                fps: Math.round(1 / gameEngine.deltaTime),
                entities: gameEngine.agents.size + 1, // +1 for player
                zones: gameEngine.world ? gameEngine.world.zones.size : 0
            }
        };
    },
    
    // Teleport player
    teleportPlayer: (x, y) => {
        if (gameEngine && gameEngine.player) {
            gameEngine.player.teleport(new Vector2(x, y));
            console.log(`Player teleported to (${x}, ${y})`);
        }
    },
    
    // Set agent trust level
    setAgentTrust: (agentName, trustLevel) => {
        const agent = Array.from(gameEngine.agents.values())
            .find(a => a.name.toLowerCase().includes(agentName.toLowerCase()));
        
        if (agent) {
            agent.trustLevel = Math.max(0, Math.min(100, trustLevel));
            console.log(`${agent.name} trust set to ${agent.trustLevel}`);
        } else {
            console.log('Agent not found');
        }
    },
    
    // Force conversation with agent
    talkTo: (agentName) => {
        const agent = Array.from(gameEngine.agents.values())
            .find(a => a.name.toLowerCase().includes(agentName.toLowerCase()));
        
        if (agent) {
            gameEngine.startConversation(agent);
        } else {
            console.log('Agent not found. Available agents:', 
                Array.from(gameEngine.agents.values()).map(a => a.name));
        }
    },
    
    // Save game state
    saveGame: () => {
        if (!gameEngine) return null;
        
        const saveData = {
            player: gameEngine.player.serialize(),
            agents: {},
            world: gameEngine.world.serialize(),
            timestamp: Date.now()
        };
        
        gameEngine.agents.forEach((agent, id) => {
            saveData.agents[id] = agent.serialize();
        });
        
        const saveString = JSON.stringify(saveData, null, 2);
        console.log('Game saved! Copy this data to restore later:');
        console.log(saveString);
        
        // Also save to localStorage
        localStorage.setItem('agenticWorldGameSave', saveString);
        
        return saveString;
    },
    
    // Load game state
    loadGame: (saveData = null) => {
        try {
            let data;
            
            if (saveData) {
                data = typeof saveData === 'string' ? JSON.parse(saveData) : saveData;
            } else {
                const saved = localStorage.getItem('agenticWorldGameSave');
                if (!saved) {
                    console.log('No save data found');
                    return false;
                }
                data = JSON.parse(saved);
            }
            
            if (!gameEngine) {
                console.log('Game not initialized');
                return false;
            }
            
            // Restore player
            if (data.player) {
                gameEngine.player.deserialize(data.player);
            }
            
            // Restore agents
            if (data.agents) {
                gameEngine.agents.forEach((agent, id) => {
                    if (data.agents[id]) {
                        agent.deserialize(data.agents[id]);
                    }
                });
            }
            
            // Restore world
            if (data.world) {
                gameEngine.world.deserialize(data.world);
            }
            
            console.log(`Game loaded from save dated ${new Date(data.timestamp)}`);
            return true;
            
        } catch (error) {
            console.error('Failed to load game:', error);
            return false;
        }
    }
};

/**
 * AI Integration Setup
 * Instructions for connecting to AI services
 */
function showAISetupInstructions() {
    console.log(`
%c=== AgenticWorldGame AI Integration ===
%cTo enable AI-powered conversations, you can configure API access:

%c1. OpenAI API Integration:%c
   gameEngine.agents.forEach((agent) => {
       agent.aiAgent.setAPIConfiguration(
           'https://api.openai.com/v1/chat/completions',
           'your-openai-api-key',
           'gpt-3.5-turbo'
       );
   });

%c2. Local LLM Integration (Ollama):%c
   gameEngine.agents.forEach((agent) => {
       agent.aiAgent.setAPIConfiguration(
           'http://localhost:11434/v1/chat/completions',
           'not-needed',
           'llama2'
       );
   });

%c3. Custom AI Service:%c
   Configure with your own API endpoint that accepts OpenAI-compatible requests.

%cNote: The game works with fallback responses if no AI is configured.
%cUse debugFunctions.getStats() to see current game state.
    `, 
    'color: #4a90e2; font-weight: bold; font-size: 16px',
    'color: #333; font-size: 14px',
    'color: #27ae60; font-weight: bold',
    'color: #555; font-family: monospace; font-size: 12px',
    'color: #8e44ad; font-weight: bold',
    'color: #555; font-family: monospace; font-size: 12px',
    'color: #e67e22; font-weight: bold',
    'color: #555; font-size: 12px',
    'color: #7f8c8d; font-size: 12px',
    'color: #34495e; font-weight: bold'
    );
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// Show AI setup instructions after a delay
setTimeout(showAISetupInstructions, 2000);