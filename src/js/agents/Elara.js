/**
 * Elara - The Shrewd Merchant
 * A fast-talking trader in the town square who knows all the local gossip
 */
class Elara extends Agent {
    constructor(position) {
        const config = {
            name: 'Elara the Merchant',
            color: '#DAA520', // Gold for wealth and trade
            personality: {
                shrewd: 0.9,
                talkative: 0.8,
                friendly: 0.7,
                business_minded: 0.9,
                gossipy: 0.8,
                competitive: 0.7,
                greetings: [
                    "Well, well! A new face in town! Looking to make a deal, perhaps?",
                    "Welcome to the finest trading post this side of the realm!",
                    "Ah, a potential customer! What can Elara do for you today?",
                    "Step right up! I've got exactly what you're looking for!"
                ]
            },
            goals: [
                "Expand her trading business and outperform her rival Marcus",
                "Learn about potential new trade opportunities",
                "Gather and share local gossip and news",
                "Build a network of reliable customers and contacts"
            ],
            knowledgeBase: {
                'trade_routes': "I know all the best trade routes! The eastern pass is fastest for spices, but the northern route is safer for precious goods.",
                'local_gossip': "Oh, the stories I could tell! Did you know that Marcus tried to undercut my prices last week? The nerve!",
                'town_economics': "Business has been good lately. The harvest was excellent, and the miners found a new silver vein up north.",
                'rival_marcus': "Marcus thinks he's so clever with his 'premium' goods. Ha! I offer better quality at fair prices.",
                'inventory': "I deal in fine silks, rare spices, quality tools, and the occasional magical trinket. Always something interesting!",
                'tiberius': "Old Tiberius? Lovely man, but so serious! He once bought a rare manuscript from me - paid quite handsomely too.",
                'milo': "That inventor boy is always asking for strange parts. Good for business though - he pays well for hard-to-find items."
            }
        };
        
        super(position, config);
        
        // Elara-specific properties
        this.businessRelationship = 'potential_customer'; // 'potential_customer', 'regular', 'valued_customer', 'partner'
        this.gossipShared = new Set();
        this.tradeOffers = new Map();
        this.salesPitch = 0; // Tracks how many times she's made a sales pitch
        
        // Trading system
        this.inventory = [
            { item: 'Silk Scarf', price: 25, rarity: 'common' },
            { item: 'Exotic Spices', price: 50, rarity: 'uncommon' },
            { item: 'Quality Hammer', price: 75, rarity: 'common' },
            { item: 'Lucky Charm', price: 100, rarity: 'rare' },
            { item: 'Ancient Coin', price: 200, rarity: 'very_rare' }
        ];
        
        // Initialize AI agent
        this.aiAgent = new AIAgent({
            name: 'Elara the Merchant',
            personality: {
                shrewd: true,
                talkative: true,
                business_minded: true,
                gossipy: true,
                friendly: true
            },
            systemPrompt: this.generateElaraPrompt()
        });
        
        this.setupElara();
    }

    generateElaraPrompt() {
        return `You are Elara, a shrewd and charismatic merchant in a fantasy town square. You're in your 30s, quick-witted, and always looking for business opportunities.

PERSONALITY:
- Fast-talking and business-minded, always thinking about profit
- Friendly and talkative, loves to chat and gossip
- Shrewd negotiator but fair in her dealings
- Competitive, especially with her rival Marcus
- Well-informed about local news and trade

BACKGROUND:
- You run the most successful trading post in town
- You have connections across multiple trade routes
- You're competing with another merchant named Marcus
- You know everyone in town and all the local gossip

CURRENT GOALS:
- Expand your business and find new customers
- Gather information about trade opportunities
- Stay ahead of your competition
- Build relationships that benefit your business

SPEAKING STYLE:
- Enthusiastic and energetic
- Use business terms and trade language
- Often mention deals, prices, and opportunities
- Share gossip naturally in conversation
- Ask questions about the visitor's needs

INVENTORY KNOWLEDGE:
- You sell silks, spices, tools, and occasional magical items
- You can source hard-to-find items for the right price
- You know the value of everything

Keep responses under 150 words and maintain Elara's merchant personality - always friendly but with business on her mind.`;
    }

    setupElara() {
        // Elara moves around the town square area more actively
        this.wanderRange = 60;
        this.speed = 120; // Faster movement, energetic personality
        
        // More trusting than Tiberius - she wants to make sales
        this.trustLevel = 60;
        
        console.log('Elara the Merchant initialized in town square');
    }

    async receiveMessage(message, sender) {
        console.log(`Elara received: "${message}"`);
        
        // Store conversation
        this.memory.addConversation(sender, message, 'received');
        
        // Analyze message for business opportunities
        this.analyzeBusinessOpportunity(message, sender);
        
        // Update relationship status
        this.updateBusinessRelationship(message, sender);
        
        let response;
        
        try {
            const context = this.buildConversationContext(sender);
            response = await this.aiAgent.generateResponse(message, context);
        } catch (error) {
            console.warn('Elara AI response failed:', error.message);
            response = this.generateScriptedResponse(message, sender);
        }
        
        // Store response
        this.memory.addConversation(sender, response, 'sent');
        
        return response;
    }

    buildConversationContext(sender) {
        return {
            businessRelationship: this.businessRelationship,
            salesPitch: this.salesPitch,
            gossipShared: Array.from(this.gossipShared),
            recentInventory: this.inventory.slice(0, 3),
            worldInfo: {
                location: 'Town Square - Trading Post',
                character: 'Elara the Merchant',
                relationship: this.memory.getRelationship(sender.name),
                mood: 'business_focused'
            }
        };
    }

    analyzeBusinessOpportunity(message, sender) {
        const messageLower = message.toLowerCase();
        
        // Looking for items/services
        if (messageLower.includes('buy') || messageLower.includes('need') || 
            messageLower.includes('looking for') || messageLower.includes('sell')) {
            this.salesPitch++;
        }
        
        // Interest in gossip
        if (messageLower.includes('news') || messageLower.includes('gossip') || 
            messageLower.includes('heard') || messageLower.includes('tell me')) {
            this.adjustTrust(3); // Elara likes people who are interested in news
        }
        
        // Business-friendly language
        if (messageLower.includes('deal') || messageLower.includes('trade') || 
            messageLower.includes('business') || messageLower.includes('profit')) {
            this.adjustTrust(5);
        }
    }

    updateBusinessRelationship(message, sender) {
        const interactionCount = this.memory.getConversationsWith(sender.name).length;
        
        if (interactionCount >= 5 && this.businessRelationship === 'potential_customer') {
            this.businessRelationship = 'regular';
        } else if (interactionCount >= 10 && this.businessRelationship === 'regular') {
            this.businessRelationship = 'valued_customer';
        } else if (this.trustLevel > 80 && this.businessRelationship === 'valued_customer') {
            this.businessRelationship = 'partner';
        }
    }

    generateScriptedResponse(message, sender) {
        const messageLower = message.toLowerCase();
        
        // First interaction
        if (this.isFirstInteraction(sender)) {
            return this.getRandomPersonalityResponse('greetings');
        }
        
        // Business inquiries
        if (messageLower.includes('buy') || messageLower.includes('purchase')) {
            return this.handlePurchaseInquiry(messageLower);
        }
        
        // Inventory questions
        if (messageLower.includes('inventory') || messageLower.includes('what do you have')) {
            return this.handleInventoryInquiry();
        }
        
        // Gossip requests
        if (messageLower.includes('news') || messageLower.includes('gossip')) {
            return this.shareGossip();
        }
        
        // Questions about other people
        if (messageLower.includes('tiberius') || messageLower.includes('milo') || 
            messageLower.includes('marcus')) {
            return this.handlePersonInquiry(messageLower);
        }
        
        // General business response
        return this.getBusinessResponse();
    }

    handlePurchaseInquiry(messageLower) {
        if (this.salesPitch < 2) {
            return "Excellent! You've come to the right place. I have the finest goods at the most reasonable prices. What kind of item are you looking for?";
        } else {
            // More specific offers for repeat customers
            const item = this.inventory[Math.floor(Math.random() * this.inventory.length)];
            return `I've got just the thing! How about this ${item.item} for ${item.price} gold? It's a steal at that price!`;
        }
    }

    handleInventoryInquiry() {
        const featuredItems = this.inventory.slice(0, 3);
        const itemList = featuredItems.map(item => `${item.item} (${item.price}g)`).join(', ');
        
        return `Today I have ${itemList}, and much more! I can also source special items if you have something specific in mind. What catches your interest?`;
    }

    shareGossip() {
        const gossipTopics = ['local_gossip', 'rival_marcus', 'town_economics'];
        const randomTopic = gossipTopics[Math.floor(Math.random() * gossipTopics.length)];
        
        if (!this.gossipShared.has(randomTopic)) {
            this.gossipShared.add(randomTopic);
            return "Oh, do I have news for you! " + this.knowledgeBase[randomTopic];
        } else {
            return "Well, I've already shared the juiciest gossip with you! But I'm always hearing new things. Come back later!";
        }
    }

    handlePersonInquiry(messageLower) {
        if (messageLower.includes('tiberius')) {
            return this.knowledgeBase['tiberius'] + " Do you know him well?";
        } else if (messageLower.includes('milo')) {
            return this.knowledgeBase['milo'] + " Are you looking for some invention perhaps?";
        } else if (messageLower.includes('marcus')) {
            return this.knowledgeBase['rival_marcus'] + " You're not thinking of shopping with him, are you?";
        }
        
        return "Ah, asking about the locals? I know everyone in town! Who specifically interests you?";
    }

    getBusinessResponse() {
        const responses = [
            "Business is always on my mind! Is there something I can help you with?",
            "Every conversation is an opportunity! What brings you to my shop today?",
            "I love meeting new people - especially potential customers! What do you need?",
            "You know, I might have exactly what you're looking for. Tell me more!"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    adjustTrust(amount) {
        this.trustLevel = Math.max(0, Math.min(100, this.trustLevel + amount));
        
        // Elara's mood is generally positive but business-focused
        if (this.trustLevel > 70) {
            this.currentMood = 'friendly';
        } else if (this.trustLevel < 40) {
            this.currentMood = 'neutral'; // She's rarely suspicious, just more cautious
        } else {
            this.currentMood = 'friendly';
        }
    }

    // Override movement to be more animated
    updateBehavior(deltaTime) {
        super.updateBehavior(deltaTime);
        
        // Elara is more animated - changes direction more frequently
        if (Math.random() < 0.3 * deltaTime) { // 30% chance per second
            this.setNewWanderTarget();
        }
    }

    // Override rendering to show merchant items
    renderEntity(renderer) {
        // Render base agent
        super.renderEntity(renderer);
        
        // Add merchant accessories
        const time = Date.now();
        
        // Money pouch that swings
        const swingOffset = Math.sin(time * 0.005) * 3;
        renderer.ctx.fillStyle = '#FFD700';
        renderer.ctx.beginPath();
        renderer.ctx.arc(8 + swingOffset, 5, 4, 0, Math.PI * 2);
        renderer.ctx.fill();
        
        // Occasionally show a trade item
        if (Math.floor(time / 3000) % 2) {
            renderer.ctx.fillStyle = '#8B4513';
            renderer.ctx.fillRect(-12, -8, 6, 10); // Small crate/box
        }
    }

    // Elara-specific methods
    getTradeOffer(itemName) {
        const item = this.inventory.find(inv => inv.item.toLowerCase().includes(itemName.toLowerCase()));
        if (item) {
            return {
                item: item.item,
                price: item.price,
                available: true
            };
        }
        return { available: false };
    }

    addToInventory(item, price, rarity = 'common') {
        this.inventory.push({ item, price, rarity });
        if (this.inventory.length > 10) {
            // Remove oldest common item
            const commonIndex = this.inventory.findIndex(inv => inv.rarity === 'common');
            if (commonIndex > -1) {
                this.inventory.splice(commonIndex, 1);
            }
        }
    }

    getElaraState() {
        return {
            businessRelationship: this.businessRelationship,
            salesPitch: this.salesPitch,
            gossipShared: Array.from(this.gossipShared),
            inventoryCount: this.inventory.length,
            trustLevel: this.trustLevel
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
        return "Welcome to my shop, traveler!";
    }

    // Serialization
    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            businessRelationship: this.businessRelationship,
            gossipShared: Array.from(this.gossipShared),
            salesPitch: this.salesPitch,
            inventory: this.inventory
        };
    }

    deserialize(data) {
        super.deserialize(data);
        this.businessRelationship = data.businessRelationship || 'potential_customer';
        this.gossipShared = new Set(data.gossipShared || []);
        this.salesPitch = data.salesPitch || 0;
        this.inventory = data.inventory || this.inventory;
    }
}