/**
 * Tiberius - The Old Historian
 * A reclusive scholar who lives in the library, slow to trust but holds vast knowledge
 */
class Tiberius extends Agent {
    constructor(position) {
        const config = {
            name: 'Old Man Tiberius',
            color: '#8B4513', // Brown for scholarly robes
            personality: {
                scholarly: 0.9,
                suspicious: 0.7,
                helpful: 0.6,
                patient: 0.8,
                wise: 0.9,
                reclusive: 0.8,
                greetings: [
                    "Ah, a visitor... it's been some time since anyone has sought out my company.",
                    "Welcome to my humble library. What knowledge do you seek?",
                    "Not many venture this deep into the archives. You must be after something specific.",
                    "Another soul drawn to the whispers of ancient knowledge, I presume?"
                ]
            },
            goals: [
                "Find the missing Volume VII of 'Chronicles of the Ancient Realm'",
                "Preserve the knowledge of the old ways",
                "Determine if this visitor can be trusted with sensitive information",
                "Complete his research on the Great Library's founding"
            ],
            knowledgeBase: {
                'library_history': 'This library was founded 300 years ago by the scholar Aldric the Wise. It contains the most comprehensive collection of historical texts in the realm.',
                'missing_book': 'Volume VII of the Chronicles has been missing for 20 years. It contains crucial information about the founding of our town and some... sensitive matters.',
                'ancient_magic': 'The old magics are not what they used to be. Most practitioners today barely understand the fundamentals.',
                'town_history': 'This town was built on the ruins of an older settlement. There are still mysteries buried beneath our feet.',
                'aldric_the_wise': 'The founder of this library. A brilliant scholar who disappeared mysteriously 250 years ago, leaving behind only his books and a cryptic note.',
                'other_residents': 'Elara is a shrewd merchant, but honest in her dealings. Milo is a talented inventor, though sometimes his enthusiasm gets the better of him.'
            }
        };
        
        super(position, config);
        
        // Tiberius-specific properties
        this.trustThreshold = 70; // Higher than default - he's slow to trust
        this.knowledgeShared = new Set(); // Track what knowledge has been shared
        this.questProgress = {
            'missing_book_clues': 0,
            'player_trustworthiness': 0,
            'sensitive_info_revealed': false
        };
        
        // Initialize AI agent for advanced conversations
        this.aiAgent = new AIAgent({
            name: 'Old Man Tiberius',
            personality: {
                scholarly: true,
                suspicious: true,
                wise: true,
                patient: true,
                reclusive: true
            },
            systemPrompt: this.generateTiberiusPrompt()
        });
        
        this.setupTiberius();
    }

    generateTiberiusPrompt() {
        return `You are Old Man Tiberius, a 70-year-old historian and librarian in a fantasy world. You are the keeper of ancient knowledge and have spent decades studying the history of your realm.

PERSONALITY:
- Scholarly and wise, but suspicious of strangers
- Slow to trust but deeply helpful to those who prove themselves
- Patient and methodical in your responses
- Speaks in a formal, educated manner with occasional archaic terms
- Protective of sensitive knowledge until trust is established

BACKGROUND:
- You've been the librarian for 40 years
- You're searching for a missing historical text (Volume VII of Chronicles of the Ancient Realm)
- You know secrets about the town's history that could be dangerous in the wrong hands
- You respect genuine seekers of knowledge

CURRENT GOALS:
- Find the missing Volume VII
- Determine if this visitor can be trusted
- Preserve important historical knowledge
- Share wisdom with worthy individuals

SPEAKING STYLE:
- Use "Ah," "Indeed," "I see," "Curious," frequently
- Reference books, scrolls, and ancient knowledge
- Ask probing questions to test the visitor's character
- Gradually become more helpful as trust builds

Keep responses under 150 words and stay in character as a cautious but wise old scholar.`;
    }

    setupTiberius() {
        // Set specific wandering behavior for library
        this.wanderRange = 30; // Stays close to his books
        this.speed = 50; // Moves slowly, as befits an old scholar
        
        // Tiberius rarely leaves his area
        this.homePosition = this.position.clone();
        
        console.log('Tiberius the Historian initialized in the library');
    }

    async receiveMessage(message, sender) {
        console.log(`Tiberius received: "${message}"`);
        
        // Store conversation in memory
        this.memory.addConversation(sender, message, 'received');
        
        // Update trust and quest progress based on message
        this.analyzePlayerMessage(message, sender);
        
        // Generate response based on current state
        let response;
        
        try {
            // Try AI response first
            const context = this.buildConversationContext(sender);
            response = await this.aiAgent.generateResponse(message, context);
        } catch (error) {
            // Fallback to scripted responses
            response = this.generateScriptedResponse(message, sender);
        }
        
        // Store our response
        this.memory.addConversation(sender, response, 'sent');
        
        // Update quest progress based on our response
        this.updateQuestProgress(message, response);
        
        return response;
    }

    buildConversationContext(sender) {
        return {
            trustLevel: this.trustLevel,
            questProgress: this.questProgress,
            knowledgeShared: Array.from(this.knowledgeShared),
            worldInfo: {
                location: 'Ancient Library',
                character: 'Tiberius the Historian',
                relationship: this.memory.getRelationship(sender.name)
            }
        };
    }

    analyzePlayerMessage(message, sender) {
        const messageLower = message.toLowerCase();
        
        // Increase trust for scholarly interest
        if (messageLower.includes('book') || messageLower.includes('history') || 
            messageLower.includes('knowledge') || messageLower.includes('learn')) {
            this.adjustTrust(5);
            this.questProgress.player_trustworthiness += 1;
        }
        
        // Increase trust for polite behavior
        if (messageLower.includes('please') || messageLower.includes('thank') || 
            messageLower.includes('respect')) {
            this.adjustTrust(3);
        }
        
        // Decrease trust for pushy behavior
        if (messageLower.includes('tell me everything') || messageLower.includes('secret') && 
            this.trustLevel < this.trustThreshold) {
            this.adjustTrust(-5);
        }
        
        // Special responses to missing book inquiries
        if (messageLower.includes('missing') || messageLower.includes('chronicle') || 
            messageLower.includes('volume')) {
            this.questProgress.missing_book_clues += 1;
        }
    }

    generateScriptedResponse(message, sender) {
        const messageLower = message.toLowerCase();
        
        // Greeting responses
        if (this.isFirstInteraction(sender)) {
            return this.getRandomPersonalityResponse('greetings');
        }
        
        // Knowledge-seeking responses
        if (messageLower.includes('book') || messageLower.includes('history')) {
            return this.handleKnowledgeRequest(messageLower);
        }
        
        // Missing book specific
        if (messageLower.includes('missing') || messageLower.includes('chronicle')) {
            return this.handleMissingBookInquiry();
        }
        
        // Trust-based responses
        if (this.trustLevel < 30) {
            return this.getSuspiciousResponse();
        } else if (this.trustLevel > this.trustThreshold) {
            return this.getHelpfulResponse(messageLower);
        } else {
            return this.getCautiousResponse();
        }
    }

    handleKnowledgeRequest(messageLower) {
        if (this.trustLevel < 50) {
            return "Knowledge is precious, young one. It must be earned through patience and respect. What draws you to seek such wisdom?";
        }
        
        // Share appropriate knowledge based on trust level
        if (messageLower.includes('town') && !this.knowledgeShared.has('town_history')) {
            this.knowledgeShared.add('town_history');
            return "Ah, the history of our town is fascinating indeed. " + this.knowledgeBase['town_history'];
        }
        
        if (messageLower.includes('library') && !this.knowledgeShared.has('library_history')) {
            this.knowledgeShared.add('library_history');
            return "This library holds many secrets. " + this.knowledgeBase['library_history'];
        }
        
        return "There is much to learn, but one must ask the right questions. What specific knowledge do you seek?";
    }

    handleMissingBookInquiry() {
        if (this.trustLevel < this.trustThreshold) {
            return "Missing? I'm not sure what you're referring to. This library is quite comprehensive...";
        } else {
            if (!this.knowledgeShared.has('missing_book')) {
                this.knowledgeShared.add('missing_book');
                return "Ah, so you've heard about Volume VII... " + this.knowledgeBase['missing_book'] + 
                       " Perhaps you could help me locate it?";
            } else {
                return "As I mentioned, Volume VII has been missing for two decades. Any leads would be most appreciated.";
            }
        }
    }

    getSuspiciousResponse() {
        const responses = [
            "I don't know you well enough to discuss such matters.",
            "Patience, young one. Trust is earned, not given freely.",
            "You seem... eager. Perhaps too eager. What are your true intentions?",
            "The knowledge in these halls is not for everyone. Prove your worth first."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getHelpfulResponse(messageLower) {
        const responses = [
            "Ah, a worthy question! Let me share what I know...",
            "Indeed, that's a matter I've studied extensively.",
            "You show genuine curiosity. I believe I can help you with that.",
            "Your patience has been noted. Allow me to elaborate..."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getCautiousResponse() {
        const responses = [
            "Interesting... tell me more about why you wish to know this.",
            "Perhaps. First, tell me about your own background.",
            "I might have some information, but I need to understand your motivations.",
            "Knowledge is powerful. How do you intend to use what you learn?"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    adjustTrust(amount) {
        this.trustLevel = Math.max(0, Math.min(100, this.trustLevel + amount));
        
        // Update mood based on trust level
        if (this.trustLevel > 70) {
            this.currentMood = 'friendly';
        } else if (this.trustLevel < 30) {
            this.currentMood = 'suspicious';
        } else {
            this.currentMood = 'neutral';
        }
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
        return "Welcome to my library, traveler.";
    }

    updateQuestProgress(playerMessage, myResponse) {
        // Track if we've revealed sensitive information
        if (myResponse.includes('Volume VII') && !this.questProgress.sensitive_info_revealed) {
            this.questProgress.sensitive_info_revealed = true;
        }
        
        // Emit quest events for game system
        if (this.questProgress.missing_book_clues >= 3 && this.trustLevel > this.trustThreshold) {
            this.emit('questAdvanced', 'missing_book_revealed');
        }
    }

    // Override rendering to show book/scroll items
    renderEntity(renderer) {
        // Render base agent
        super.renderEntity(renderer);
        
        // Add scholarly accessories
        if (Math.floor(Date.now() / 2000) % 2) { // Animate every 2 seconds
            // Draw a book in his hands
            renderer.ctx.fillStyle = '#4a4a4a';
            renderer.ctx.fillRect(-8, -2, 12, 8);
            renderer.ctx.strokeStyle = '#2a2a2a';
            renderer.ctx.lineWidth = 1;
            renderer.ctx.strokeRect(-8, -2, 12, 8);
        }
    }

    // Tiberius-specific methods
    getTiberiusState() {
        return {
            trustLevel: this.trustLevel,
            knowledgeShared: Array.from(this.knowledgeShared),
            questProgress: { ...this.questProgress },
            conversationCount: this.memory.conversations.length
        };
    }

    // Serialization including Tiberius-specific data
    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            knowledgeShared: Array.from(this.knowledgeShared),
            questProgress: this.questProgress,
            trustThreshold: this.trustThreshold
        };
    }

    deserialize(data) {
        super.deserialize(data);
        this.knowledgeShared = new Set(data.knowledgeShared || []);
        this.questProgress = data.questProgress || {
            'missing_book_clues': 0,
            'player_trustworthiness': 0,
            'sensitive_info_revealed': false
        };
        this.trustThreshold = data.trustThreshold || 70;
    }
}