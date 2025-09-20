/**
 * Agent class - Base class for AI-driven NPCs
 */
class Agent extends Entity {
    constructor(position = Vector2.zero(), config = {}) {
        super(position);
        
        // Agent specific properties
        this.type = 'agent';
        this.name = config.name || 'Agent';
        this.color = config.color || '#e74c3c';
        
        // AI properties
        this.personality = config.personality || {};
        this.memory = new AgentMemory();
        this.goals = config.goals || [];
        this.knowledgeBase = config.knowledgeBase || {};
        
        // Conversation state
        this.isInConversation = false;
        this.conversationPartner = null;
        this.lastInteractionTime = null;
        
        // Behavior state
        this.currentMood = 'neutral';
        this.energyLevel = 100;
        this.trustLevel = 50; // 0-100, how much they trust the player
        
        // Movement behavior
        this.wanderRange = 50;
        this.homePosition = position.clone();
        this.wanderTarget = null;
        this.wanderCooldown = 0;
        
        // Visual properties
        this.width = 35;
        this.height = 35;
        this.collisionRadius = 18;
        
        this.setupAgent();
    }

    setupAgent() {
        // Initialize random wander target
        this.setNewWanderTarget();
        
        console.log(`Agent ${this.name} created at:`, this.position.toString());
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.isInConversation) {
            this.updateBehavior(deltaTime);
        }
        
        this.updateMood(deltaTime);
        this.updateMemory(deltaTime);
    }

    updateBehavior(deltaTime) {
        // Wandering behavior when not in conversation
        this.wanderCooldown -= deltaTime;
        
        if (this.wanderCooldown <= 0) {
            this.wander(deltaTime);
        }
    }

    wander(deltaTime) {
        if (!this.wanderTarget) {
            this.setNewWanderTarget();
        }
        
        // Move towards wander target
        const distanceToTarget = this.position.distance(this.wanderTarget);
        
        if (distanceToTarget < 10) {
            // Reached target, set new one
            this.setNewWanderTarget();
            this.wanderCooldown = Math.random() * 3 + 1; // 1-4 seconds
        } else {
            // Move towards target
            const direction = this.wanderTarget.subtract(this.position).normalize();
            const wanderSpeed = this.speed * 0.3; // Slower wandering
            this.move(direction, deltaTime, wanderSpeed);
        }
    }

    setNewWanderTarget() {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.wanderRange;
        
        this.wanderTarget = this.homePosition.add(new Vector2(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance
        ));
    }

    move(direction, deltaTime, speed = null) {
        const moveSpeed = speed || this.speed;
        const movement = direction.multiply(moveSpeed * deltaTime);
        this.position = this.position.add(movement);
        
        // Keep within world bounds (basic implementation)
        this.position.x = Math.max(10, Math.min(1014, this.position.x));
        this.position.y = Math.max(10, Math.min(758, this.position.y));
    }

    updateMood(deltaTime) {
        // Simple mood system - could be expanded
        this.energyLevel = Math.max(0, Math.min(100, this.energyLevel + deltaTime * 5));
        
        if (this.energyLevel < 30) {
            this.currentMood = 'tired';
        } else if (this.trustLevel > 70) {
            this.currentMood = 'friendly';
        } else if (this.trustLevel < 30) {
            this.currentMood = 'suspicious';
        } else {
            this.currentMood = 'neutral';
        }
    }

    updateMemory(deltaTime) {
        // Update memory system
        this.memory.update(deltaTime);
    }

    renderEntity(renderer) {
        // Render agent as a square with rounded corners
        renderer.ctx.fillStyle = this.color;
        
        // Main body (rounded rectangle)
        const radius = 5;
        renderer.ctx.beginPath();
        renderer.ctx.roundRect(-this.width/2, -this.height/2, this.width, this.height, radius);
        renderer.ctx.fill();
        
        // Border
        renderer.ctx.strokeStyle = this.getBorderColor();
        renderer.ctx.lineWidth = 2;
        renderer.ctx.stroke();
        
        // Name label
        this.renderNameLabel(renderer);
        
        // Mood indicator
        this.renderMoodIndicator(renderer);
        
        // Conversation indicator
        if (this.isInConversation) {
            this.renderConversationIndicator(renderer);
        }
    }

    getBorderColor() {
        const moodColors = {
            'friendly': '#27ae60',
            'suspicious': '#e67e22',
            'tired': '#95a5a6',
            'neutral': '#34495e'
        };
        
        return moodColors[this.currentMood] || moodColors.neutral;
    }

    renderNameLabel(renderer) {
        // Render name above the agent
        const labelY = -this.height/2 - 20;
        
        renderer.ctx.fillStyle = '#ffffff';
        renderer.ctx.font = '12px Arial';
        renderer.ctx.textAlign = 'center';
        renderer.ctx.textBaseline = 'bottom';
        renderer.ctx.fillText(this.name, 0, labelY);
    }

    renderMoodIndicator(renderer) {
        // Small colored dot indicating mood
        const indicatorY = this.height/2 - 5;
        const moodColor = this.getBorderColor();
        
        renderer.ctx.fillStyle = moodColor;
        renderer.ctx.beginPath();
        renderer.ctx.arc(0, indicatorY, 3, 0, Math.PI * 2);
        renderer.ctx.fill();
    }

    renderConversationIndicator(renderer) {
        // Speech bubble or indicator when in conversation
        const bubbleY = -this.height/2 - 35;
        
        renderer.ctx.fillStyle = '#ffffff';
        renderer.ctx.strokeStyle = '#333333';
        renderer.ctx.lineWidth = 1;
        
        // Speech bubble
        renderer.ctx.beginPath();
        renderer.ctx.arc(0, bubbleY, 8, 0, Math.PI * 2);
        renderer.ctx.fill();
        renderer.ctx.stroke();
        
        // Three dots
        renderer.ctx.fillStyle = '#333333';
        for (let i = -1; i <= 1; i++) {
            renderer.ctx.beginPath();
            renderer.ctx.arc(i * 3, bubbleY, 1, 0, Math.PI * 2);
            renderer.ctx.fill();
        }
    }

    // Conversation methods
    async receiveMessage(message, sender) {
        console.log(`${this.name} received message: "${message}" from ${sender.name || 'Player'}`);
        
        // Store the conversation in memory
        this.memory.addConversation(sender, message, 'received');
        
        // Update trust based on message (simple implementation)
        this.updateTrust(message, sender);
        
        // Generate AI response (this will be implemented with actual AI)
        const response = await this.generateResponse(message, sender);
        
        // Store our response in memory
        this.memory.addConversation(sender, response, 'sent');
        
        return response;
    }

    async generateResponse(message, sender) {
        // Placeholder for AI response generation
        // In a real implementation, this would call an LLM API
        const responses = this.getPersonalityResponses(message);
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        // Add some personality-based delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        return randomResponse;
    }

    getPersonalityResponses(message) {
        // Default responses based on current mood and personality
        const moodResponses = {
            'friendly': [
                "That's interesting! Tell me more.",
                "I'm glad we can talk about this.",
                "You seem like someone I can trust.",
                "That reminds me of something..."
            ],
            'suspicious': [
                "Why are you asking me that?",
                "I'm not sure I should tell you.",
                "What's your real reason for wanting to know?",
                "Hmm, I need to think about that."
            ],
            'tired': [
                "I'm feeling a bit worn out today.",
                "Can we talk about something else?",
                "I don't have much energy for this right now.",
                "Perhaps another time would be better."
            ],
            'neutral': [
                "I see.",
                "That's one way to look at it.",
                "What do you think about that?",
                "Interesting perspective."
            ]
        };
        
        return moodResponses[this.currentMood] || moodResponses.neutral;
    }

    updateTrust(message, sender) {
        // Simple trust system - could be much more sophisticated
        const messageLength = message.length;
        const isPolite = /please|thank|sorry|excuse me/i.test(message);
        const isQuestion = message.includes('?');
        
        let trustChange = 0;
        
        if (isPolite) trustChange += 5;
        if (isQuestion && messageLength > 20) trustChange += 2;
        if (messageLength < 10) trustChange -= 1;
        
        this.trustLevel = Math.max(0, Math.min(100, this.trustLevel + trustChange));
    }

    startConversation(partner) {
        this.isInConversation = true;
        this.conversationPartner = partner;
        this.lastInteractionTime = Date.now();
        
        console.log(`${this.name} started conversation with ${partner.name || 'Player'}`);
    }

    endConversation() {
        this.isInConversation = false;
        this.conversationPartner = null;
        
        console.log(`${this.name} ended conversation`);
    }

    // Memory and knowledge methods
    remember(key, value, importance = 1) {
        this.memory.store(key, value, importance);
    }

    recall(key) {
        return this.memory.retrieve(key);
    }

    knowsAbout(topic) {
        return this.knowledgeBase.hasOwnProperty(topic) || this.memory.hasMemoryOf(topic);
    }

    // Utility methods
    getPersonalityTrait(trait) {
        return this.personality[trait] || 0.5; // Default to neutral
    }

    setGoal(goal) {
        this.goals.push(goal);
    }

    completeGoal(goalIndex) {
        if (goalIndex >= 0 && goalIndex < this.goals.length) {
            const completedGoal = this.goals.splice(goalIndex, 1)[0];
            this.emit('goalCompleted', completedGoal);
            return completedGoal;
        }
        return null;
    }

    // Serialization
    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            name: this.name,
            personality: this.personality,
            goals: this.goals,
            knowledgeBase: this.knowledgeBase,
            currentMood: this.currentMood,
            energyLevel: this.energyLevel,
            trustLevel: this.trustLevel,
            homePosition: { x: this.homePosition.x, y: this.homePosition.y }
        };
    }

    deserialize(data) {
        super.deserialize(data);
        this.name = data.name || 'Agent';
        this.personality = data.personality || {};
        this.goals = data.goals || [];
        this.knowledgeBase = data.knowledgeBase || {};
        this.currentMood = data.currentMood || 'neutral';
        this.energyLevel = data.energyLevel || 100;
        this.trustLevel = data.trustLevel || 50;
        this.homePosition = new Vector2(data.homePosition?.x || 0, data.homePosition?.y || 0);
    }
}