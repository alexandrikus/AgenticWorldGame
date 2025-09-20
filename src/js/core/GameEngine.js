/**
 * Main Game Engine - Handles game loop, state management, and coordination
 */
class GameEngine extends EventEmitter {
    constructor() {
        super();
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.fps = 60;
        
        // Core systems
        this.renderer = null;
        this.inputManager = null;
        this.world = null;
        this.chatInterface = null;
        
        // Game objects
        this.player = null;
        this.agents = new Map();
        
        // Interaction system
        this.nearbyAgent = null;
        this.interactionDistance = 80; // pixels
    }

    async init() {
        console.log('Initializing GameEngine...');
        
        // Initialize core systems
        this.renderer = new Renderer('gameCanvas');
        this.inputManager = new InputManager();
        this.chatInterface = new ChatInterface();
        this.world = new World();
        
        // Create player
        this.player = new Player(new Vector2(400, 300));
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize world and agents
        await this.initializeWorld();
        
        console.log('GameEngine initialized successfully');
    }

    setupEventListeners() {
        // Input events
        this.inputManager.on('move', (direction) => {
            if (!this.isPaused && this.player) {
                this.player.move(direction, this.deltaTime);
            }
        });

        this.inputManager.on('interact', () => {
            if (this.nearbyAgent && !this.chatInterface.isOpen) {
                this.startConversation(this.nearbyAgent);
            }
        });

        // Chat events
        this.chatInterface.on('chatClosed', () => {
            this.isPaused = false;
            this.emit('gameResumed');
        });

        this.chatInterface.on('messageSent', (message, agent) => {
            this.handlePlayerMessage(message, agent);
        });

        // Handle chat input focus to prevent game controls interference
        this.chatInterface.on('chatInputFocused', () => {
            this.inputManager.isInputDisabled = true;
        });

        this.chatInterface.on('chatInputBlurred', () => {
            this.inputManager.isInputDisabled = false;
        });

        // Window events
        window.addEventListener('blur', () => {
            this.pause();
        });

        window.addEventListener('focus', () => {
            if (!this.chatInterface.isOpen) {
                this.resume();
            }
        });
    }

    async initializeWorld() {
        // Create zones
        const libraryZone = new Zone('library', new Vector2(0, 0), 400, 300);
        const townSquareZone = new Zone('townSquare', new Vector2(400, 0), 400, 300);
        const workshopZone = new Zone('workshop', new Vector2(0, 300), 400, 300);
        
        this.world.addZone(libraryZone);
        this.world.addZone(townSquareZone);
        this.world.addZone(workshopZone);
        
        // Create initial agents
        await this.createAgents();
    }

    async createAgents() {
        // Create Tiberius in the library
        const tiberius = new Tiberius(new Vector2(200, 150));
        this.agents.set('tiberius', tiberius);
        
        // Create Elara in town square
        const elara = new Elara(new Vector2(600, 150));
        this.agents.set('elara', elara);
        
        // Create Milo in workshop
        const milo = new Milo(new Vector2(200, 450));
        this.agents.set('milo', milo);
        
        console.log('Agents created:', Array.from(this.agents.keys()));
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
        
        this.gameLoop();
        this.emit('gameStarted');
        
        console.log('Game started');
    }

    pause() {
        this.isPaused = true;
        this.emit('gamePaused');
    }

    resume() {
        this.isPaused = false;
        this.emit('gameResumed');
    }

    stop() {
        this.isRunning = false;
        this.emit('gameStopped');
    }

    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        this.deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 1/30); // Cap at 30 FPS
        this.lastFrameTime = currentTime;

        if (!this.isPaused) {
            this.update(this.deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // Update input manager for continuous input handling
        if (this.inputManager) {
            this.inputManager.update();
        }

        // Update player
        if (this.player) {
            this.player.update(deltaTime);
        }

        // Update agents
        this.agents.forEach(agent => {
            agent.update(deltaTime);
        });

        // Check for nearby agents
        this.checkNearbyAgents();

        // Update world
        this.world.update(deltaTime);

        // Update UI
        this.updateUI();
    }

    render() {
        // Clear canvas
        this.renderer.clear();

        // Render world
        this.world.render(this.renderer);

        // Render agents
        this.agents.forEach(agent => {
            agent.render(this.renderer);
        });

        // Render player
        if (this.player) {
            this.player.render(this.renderer);
        }
    }

    checkNearbyAgents() {
        if (!this.player) return;

        let closestAgent = null;
        let closestDistance = Infinity;

        this.agents.forEach(agent => {
            const distance = this.player.position.distance(agent.position);
            
            if (distance < this.interactionDistance && distance < closestDistance) {
                closestAgent = agent;
                closestDistance = distance;
            }
        });

        // Update nearby agent
        if (closestAgent !== this.nearbyAgent) {
            this.nearbyAgent = closestAgent;
            this.updateInteractionPrompt();
        }
    }

    updateInteractionPrompt() {
        const prompt = document.getElementById('interactionPrompt');
        
        if (this.nearbyAgent && !this.chatInterface.isOpen) {
            prompt.classList.remove('hidden');
        } else {
            prompt.classList.add('hidden');
        }
    }

    updateUI() {
        // Update player position display
        const positionDisplay = document.getElementById('playerPosition');
        if (positionDisplay && this.player) {
            positionDisplay.textContent = `${Math.round(this.player.position.x)}, ${Math.round(this.player.position.y)}`;
        }
    }

    startConversation(agent) {
        this.isPaused = true;
        this.chatInterface.openChat(agent);
        this.updateInteractionPrompt();
        this.emit('conversationStarted', agent);
    }

    async handlePlayerMessage(message, agent) {
        try {
            // Send message to agent and get response
            const response = await agent.receiveMessage(message, this.player);
            
            // Display response in chat using the proper method
            this.chatInterface.handleAgentResponse(response, agent);
            
            this.emit('messageProcessed', message, response, agent);
        } catch (error) {
            console.error('Error processing message:', error);
            
            // Fallback response
            const fallbackResponse = `${agent.name} seems lost in thought and doesn't respond clearly.`;
            this.chatInterface.handleAgentResponse(fallbackResponse, agent);
        }
    }

    // Utility methods
    getAgent(id) {
        return this.agents.get(id);
    }

    getAllAgents() {
        return Array.from(this.agents.values());
    }

    getCurrentZone() {
        return this.world.getCurrentZone(this.player.position);
    }
}