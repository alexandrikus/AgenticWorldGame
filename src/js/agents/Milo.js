/**
 * Milo - The Enthusiastic Inventor
 * A quirky young tinkerer working on inventions in his workshop
 */
class Milo extends Agent {
    constructor(position) {
        const config = {
            name: 'Milo the Inventor',
            color: '#4682B4', // Steel blue for his mechanical nature
            personality: {
                enthusiastic: 0.9,
                curious: 0.8,
                creative: 0.9,
                helpful: 0.8,
                scattered: 0.7, // Gets distracted easily
                optimistic: 0.9,
                greetings: [
                    "Oh! A visitor! Perfect timing - I was just working on something amazing!",
                    "Welcome to my workshop! Mind the gears, and watch out for that spring mechanism!",
                    "Fantastic! Another person to show my inventions to! What do you think of this contraption?",
                    "Hello there! You look like someone who appreciates fine craftsmanship!"
                ]
            },
            goals: [
                "Complete his revolutionary 'Automatic Seed Planter' invention",
                "Find rare mechanical parts for his projects",
                "Share his passion for invention with others",
                "Prove that his inventions can help the community"
            ],
            knowledgeBase: {
                'current_project': "I'm working on an Automatic Seed Planter! It'll revolutionize farming! I just need a few more precision springs and maybe some enchanted copper wire.",
                'workshop': "This workshop has been in my family for three generations. My grandfather was a clockmaker, my father a blacksmith, and I... well, I'm trying to combine both!",
                'inventions': "I've created a self-stirring pot, boots that never get muddy, and a hat that tells you the weather! Not all of them work perfectly yet...",
                'parts_needed': "I'm always looking for gears, springs, crystals, rare metals, and anything that moves or glows! Elara sometimes finds interesting components for me.",
                'failures': "Oh, I've had spectacular failures! Last month, my automatic door opener launched itself through the wall. But that's how we learn, right?",
                'tiberius': "Old Tiberius is brilliant! He let me borrow some technical manuals. Ancient engineering is fascinating - they knew things we've forgotten!",
                'elara': "Elara's great for finding rare parts! She charges fair prices, though she does laugh at some of my more... ambitious projects."
            }
        };
        
        super(position, config);
        
        // Milo-specific properties
        this.inventionProgress = {
            'seed_planter': 60, // 60% complete
            'weather_hat': 85,  // Almost done but buggy
            'mud_proof_boots': 40,
            'self_stirring_pot': 90 // Works but occasionally explodes
        };
        
        this.partsNeeded = [
            { name: 'Precision Spring', urgency: 'high', project: 'seed_planter' },
            { name: 'Enchanted Copper Wire', urgency: 'medium', project: 'seed_planter' },
            { name: 'Weather Crystal', urgency: 'low', project: 'weather_hat' },
            { name: 'Lightweight Gear', urgency: 'medium', project: 'mud_proof_boots' }
        ];
        
        this.excitementLevel = 50; // Goes up when discussing inventions
        this.demonstrationCount = 0; // How many times he's shown inventions
        
        // Initialize AI agent
        this.aiAgent = new AIAgent({
            name: 'Milo the Inventor',
            personality: {
                enthusiastic: true,
                curious: true,
                creative: true,
                scattered: true,
                optimistic: true
            },
            systemPrompt: this.generateMiloPrompt()
        });
        
        this.setupMilo();
    }

    generateMiloPrompt() {
        return `You are Milo, a 25-year-old enthusiastic inventor in a fantasy workshop. You're passionate about creating mechanical devices that help people, though they don't always work as intended.

PERSONALITY:
- Extremely enthusiastic and excitable about inventions
- Curious about everything, especially how things work
- Creative and optimistic, sees possibilities everywhere
- Sometimes scattered - gets distracted by new ideas mid-conversation
- Helpful and eager to share knowledge
- Not discouraged by failures - sees them as learning opportunities

BACKGROUND:
- You run a workshop inherited from your family
- You're working on several inventions, especially an Automatic Seed Planter
- You need rare parts and materials for your projects
- You've had many spectacular failures but keep trying

CURRENT PROJECTS:
- Automatic Seed Planter (60% complete, needs precision springs)
- Weather-Predicting Hat (mostly works, but sometimes wrong)
- Mud-Proof Boots (still in early stages)
- Self-Stirring Pot (works great, but occasionally explodes)

SPEAKING STYLE:
- Energetic and fast-talking when excited
- Uses technical terms and invention names
- Often goes off on tangents about how things work
- Asks lots of questions about the visitor's needs
- Frequently mentions current projects and parts needed

GOALS:
- Complete your inventions
- Find people who need mechanical solutions
- Gather rare materials and parts
- Share your passion for invention

Keep responses under 150 words but maintain Milo's enthusiastic, scattered energy. Show genuine excitement about invention and problem-solving.`;
    }

    setupMilo() {
        // Milo moves around his workshop area more erratically
        this.wanderRange = 45;
        this.speed = 100;
        
        // Very trusting - he's excited to share with anyone
        this.trustLevel = 70;
        
        // More energetic mood
        this.currentMood = 'friendly';
        this.energyLevel = 90;
        
        console.log('Milo the Inventor initialized in his workshop');
    }

    async receiveMessage(message, sender) {
        console.log(`Milo received: "${message}"`);
        
        // Store conversation
        this.memory.addConversation(sender, message, 'received');
        
        // Analyze for invention opportunities and interests
        this.analyzeInventionInterest(message, sender);
        
        // Update excitement based on message content
        this.updateExcitement(message);
        
        let response;
        
        try {
            const context = this.buildConversationContext(sender);
            response = await this.aiAgent.generateResponse(message, context);
        } catch (error) {
            console.warn('Milo AI response failed:', error.message);
            response = this.generateScriptedResponse(message, sender);
        }
        
        // Store response
        this.memory.addConversation(sender, response, 'sent');
        
        return response;
    }

    buildConversationContext(sender) {
        return {
            excitementLevel: this.excitementLevel,
            currentProjects: this.inventionProgress,
            partsNeeded: this.partsNeeded,
            demonstrationCount: this.demonstrationCount,
            worldInfo: {
                location: "Milo's Workshop",
                character: 'Milo the Inventor',
                relationship: this.memory.getRelationship(sender.name),
                mood: 'enthusiastic'
            }
        };
    }

    analyzeInventionInterest(message, sender) {
        const messageLower = message.toLowerCase();
        
        // High excitement for invention-related topics
        if (messageLower.includes('invent') || messageLower.includes('machine') || 
            messageLower.includes('build') || messageLower.includes('create')) {
            this.excitementLevel = Math.min(100, this.excitementLevel + 15);
            this.adjustTrust(5);
        }
        
        // Interest in parts/materials
        if (messageLower.includes('parts') || messageLower.includes('gear') || 
            messageLower.includes('spring') || messageLower.includes('wire')) {
            this.excitementLevel = Math.min(100, this.excitementLevel + 10);
        }
        
        // Problem-solving opportunities
        if (messageLower.includes('problem') || messageLower.includes('need') || 
            messageLower.includes('difficult') || messageLower.includes('help')) {
            this.excitementLevel = Math.min(100, this.excitementLevel + 8);
        }
        
        // Questions about how things work
        if (messageLower.includes('how does') || messageLower.includes('how do') || 
            messageLower.includes('explain')) {
            this.excitementLevel = Math.min(100, this.excitementLevel + 12);
        }
    }

    updateExcitement(message) {
        // Excitement naturally decreases over time, but goes up with interesting topics
        this.excitementLevel = Math.max(30, this.excitementLevel - 2);
        
        // Update mood based on excitement
        if (this.excitementLevel > 80) {
            this.currentMood = 'enthusiastic';
        } else if (this.excitementLevel > 60) {
            this.currentMood = 'friendly';
        } else {
            this.currentMood = 'neutral';
        }
    }

    generateScriptedResponse(message, sender) {
        const messageLower = message.toLowerCase();
        
        // First interaction
        if (this.isFirstInteraction(sender)) {
            return this.getRandomPersonalityResponse('greetings');
        }
        
        // Invention inquiries
        if (messageLower.includes('invention') || messageLower.includes('machine')) {
            return this.handleInventionInquiry(messageLower);
        }
        
        // Parts/materials questions
        if (messageLower.includes('parts') || messageLower.includes('need') || 
            messageLower.includes('material')) {
            return this.handlePartsInquiry();
        }
        
        // Problem-solving
        if (messageLower.includes('problem') || messageLower.includes('help me')) {
            return this.handleProblemSolving(messageLower);
        }
        
        // Demonstration requests
        if (messageLower.includes('show') || messageLower.includes('demonstrate')) {
            return this.handleDemonstration();
        }
        
        // Questions about other people
        if (messageLower.includes('tiberius') || messageLower.includes('elara')) {
            return this.handlePersonInquiry(messageLower);
        }
        
        // General enthusiastic response
        return this.getEnthusiasticResponse();
    }

    handleInventionInquiry(messageLower) {
        const projects = Object.keys(this.inventionProgress);
        const randomProject = projects[Math.floor(Math.random() * projects.length)];
        const progress = this.inventionProgress[randomProject];
        
        if (messageLower.includes('current') || messageLower.includes('working on')) {
            return `Oh! I'm so glad you asked! Right now I'm ${progress}% done with my ${randomProject.replace('_', ' ')}! ${this.knowledgeBase['current_project']}`;
        } else {
            return `I have so many projects! ${this.knowledgeBase['inventions']} Would you like to see one of them work?`;
        }
    }

    handlePartsInquiry() {
        const urgentPart = this.partsNeeded.find(p => p.urgency === 'high');
        
        if (urgentPart) {
            return `Oh, you're interested in parts? That's fantastic! I desperately need a ${urgentPart.name} for my ${urgentPart.project.replace('_', ' ')}. Do you happen to know where I could find one?`;
        } else {
            const randomPart = this.partsNeeded[Math.floor(Math.random() * this.partsNeeded.length)];
            return `I'm always looking for interesting components! Right now I could really use ${randomPart.name}. ${this.knowledgeBase['parts_needed']}`;
        }
    }

    handleProblemSolving(messageLower) {
        this.excitementLevel = Math.min(100, this.excitementLevel + 20);
        
        return "A problem? Oh, I LOVE solving problems! That's what invention is all about! Tell me more - what kind of challenge are you facing? I bet we can build something to fix it!";
    }

    handleDemonstration() {
        this.demonstrationCount++;
        
        const demonstrations = [
            "Watch this! *fiddles with a contraption* My self-stirring pot! It stirs soup automatically! ...though sometimes it stirs a bit too vigorously.",
            "Here, let me show you my weather hat! *puts on a hat with crystals* It's supposed to glow blue for rain... *it glows purple* Hmm, that's new.",
            "Look at these mud-proof boots! *demonstrates* The coating repels all dirt! Well, most dirt. Some dirt. It's a work in progress!",
            "This is my automatic door mechanism! *pulls a lever* It should... *CRASH* ...well, it opens doors. Very enthusiastically."
        ];
        
        return demonstrations[Math.floor(Math.random() * demonstrations.length)];
    }

    handlePersonInquiry(messageLower) {
        if (messageLower.includes('tiberius')) {
            return this.knowledgeBase['tiberius'] + " Have you seen any ancient engineering texts in his library?";
        } else if (messageLower.includes('elara')) {
            return this.knowledgeBase['elara'] + " She might have some of the parts I need!";
        }
        
        return "Oh, are you asking about the other folks in town? They're all great! Everyone here has their own interesting skills!";
    }

    getEnthusiasticResponse() {
        const responses = [
            "That's interesting! You know, I bet I could invent something for that!",
            "Fascinating! How do you think that works? I love understanding mechanisms!",
            "Oh! That reminds me of a project I've been thinking about! Want to hear about it?",
            "You seem like someone who appreciates good craftsmanship! Let me show you something!"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    adjustTrust(amount) {
        this.trustLevel = Math.max(0, Math.min(100, this.trustLevel + amount));
        // Milo is naturally trusting, so mood doesn't change much based on trust
    }

    // Override movement to be more erratic (inventor energy)
    updateBehavior(deltaTime) {
        super.updateBehavior(deltaTime);
        
        // Milo changes direction more frequently when excited
        const changeChance = this.excitementLevel / 100 * 0.5; // Up to 50% chance per second
        if (Math.random() < changeChance * deltaTime) {
            this.setNewWanderTarget();
        }
    }

    // Override rendering to show workshop tools and inventions
    renderEntity(renderer) {
        // Render base agent
        super.renderEntity(renderer);
        
        const time = Date.now();
        
        // Add tool belt
        renderer.ctx.strokeStyle = '#8B4513';
        renderer.ctx.lineWidth = 2;
        renderer.ctx.beginPath();
        renderer.ctx.arc(0, 8, 12, 0, Math.PI);
        renderer.ctx.stroke();
        
        // Add animated wrench that he occasionally waves around
        if (Math.floor(time / 1500) % 3 === 0) { // Every 1.5 seconds, for 1.5 seconds
            const waveOffset = Math.sin(time * 0.01) * 5;
            renderer.ctx.strokeStyle = '#C0C0C0';
            renderer.ctx.lineWidth = 3;
            renderer.ctx.beginPath();
            renderer.ctx.moveTo(10 + waveOffset, -5);
            renderer.ctx.lineTo(15 + waveOffset, -8);
            renderer.ctx.stroke();
        }
        
        // Occasionally show sparks (when he's working)
        if (Math.random() < 0.1 && this.excitementLevel > 70) {
            for (let i = 0; i < 3; i++) {
                const sparkX = (Math.random() - 0.5) * 20;
                const sparkY = (Math.random() - 0.5) * 20;
                renderer.ctx.fillStyle = '#FFD700';
                renderer.ctx.fillRect(sparkX, sparkY, 2, 2);
            }
        }
    }

    // Milo-specific methods
    updateInventionProgress(projectName, amount) {
        if (this.inventionProgress[projectName] !== undefined) {
            this.inventionProgress[projectName] = Math.min(100, this.inventionProgress[projectName] + amount);
            
            if (this.inventionProgress[projectName] === 100) {
                this.emit('inventionCompleted', projectName);
            }
        }
    }

    addPartFound(partName) {
        const partIndex = this.partsNeeded.findIndex(p => p.name === partName);
        if (partIndex > -1) {
            const part = this.partsNeeded[partIndex];
            this.updateInventionProgress(part.project, 15);
            this.partsNeeded.splice(partIndex, 1);
            this.excitementLevel = Math.min(100, this.excitementLevel + 25);
            return true;
        }
        return false;
    }

    getMiloState() {
        return {
            excitementLevel: this.excitementLevel,
            inventionProgress: { ...this.inventionProgress },
            partsNeeded: [...this.partsNeeded],
            demonstrationCount: this.demonstrationCount
        };
    }

    isFirstInteraction(sender) {
        const conversations = this.memory.getConversationsWith(sender.name);
        return conversations.length <= 1;
    }

    getRandomPersonalityResponse(category) {
        const responses = this.personality[category];
        if (responses && responses.length > 0) {
            return responses[Math.floor(Math.random() * responses.length)];
        }
        return "Welcome to my workshop! Want to see something amazing?";
    }

    // Serialization
    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            inventionProgress: this.inventionProgress,
            partsNeeded: this.partsNeeded,
            excitementLevel: this.excitementLevel,
            demonstrationCount: this.demonstrationCount
        };
    }

    deserialize(data) {
        super.deserialize(data);
        this.inventionProgress = data.inventionProgress || this.inventionProgress;
        this.partsNeeded = data.partsNeeded || this.partsNeeded;
        this.excitementLevel = data.excitementLevel || 50;
        this.demonstrationCount = data.demonstrationCount || 0;
    }
}