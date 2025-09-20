/**
 * AgentMemory - Handles memory storage and retrieval for AI agents
 */
class AgentMemory extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Memory configuration
        this.maxMemories = config.maxMemories || 200;
        this.maxConversations = config.maxConversations || 50;
        this.decayRate = config.decayRate || 0.1; // How fast memories fade
        
        // Memory storage
        this.shortTermMemory = new Map(); // Recent, high-importance memories
        this.longTermMemory = new Map();  // Persistent memories
        this.conversations = [];          // Conversation history
        this.relationships = new Map();   // Relationship tracking
        this.facts = new Map();          // Known facts about the world
        
        // Memory categories
        this.categories = {
            CONVERSATION: 'conversation',
            EVENT: 'event',
            FACT: 'fact',
            EMOTION: 'emotion',
            GOAL: 'goal',
            RELATIONSHIP: 'relationship'
        };
        
        // Importance levels
        this.importance = {
            TRIVIAL: 1,
            LOW: 2,
            NORMAL: 3,
            HIGH: 4,
            CRITICAL: 5
        };
        
        this.lastCleanupTime = Date.now();
        this.cleanupInterval = 60000; // Clean up every minute
        
        console.log('AgentMemory initialized');
    }

    // Core memory operations
    store(key, data, importance = this.importance.NORMAL, category = null) {
        const memory = {
            id: this.generateMemoryId(),
            key: key,
            data: data,
            category: category || this.categories.FACT,
            importance: importance,
            timestamp: Date.now(),
            accessCount: 0,
            lastAccessed: Date.now(),
            strength: 1.0, // Memory strength (0-1)
            emotional_weight: 0, // Emotional significance
            connections: new Set() // Connected memories
        };
        
        // Store based on importance
        if (importance >= this.importance.HIGH) {
            this.longTermMemory.set(key, memory);
        } else {
            this.shortTermMemory.set(key, memory);
        }
        
        this.emit('memoryStored', memory);
        
        // Cleanup if needed
        this.maybeCleanup();
        
        return memory.id;
    }

    retrieve(key, strengthenMemory = true) {
        let memory = this.shortTermMemory.get(key) || this.longTermMemory.get(key);
        
        if (memory) {
            if (strengthenMemory) {
                memory.accessCount++;
                memory.lastAccessed = Date.now();
                memory.strength = Math.min(1.0, memory.strength + 0.1);
            }
            
            this.emit('memoryRetrieved', memory);
            return memory.data;
        }
        
        return null;
    }

    hasMemoryOf(key) {
        return this.shortTermMemory.has(key) || this.longTermMemory.has(key);
    }

    forget(key) {
        const shortTermDeleted = this.shortTermMemory.delete(key);
        const longTermDeleted = this.longTermMemory.delete(key);
        
        if (shortTermDeleted || longTermDeleted) {
            this.emit('memoryForgotten', key);
            return true;
        }
        
        return false;
    }

    // Conversation memory
    addConversation(participant, message, type = 'received') {
        const conversation = {
            id: this.generateMemoryId(),
            participant: participant.name || 'Unknown',
            participantId: participant.id,
            message: message,
            type: type, // 'received' or 'sent'
            timestamp: Date.now(),
            importance: this.calculateMessageImportance(message),
            sentiment: this.analyzeSentiment(message),
            topics: this.extractTopics(message)
        };
        
        this.conversations.push(conversation);
        
        // Limit conversation history
        if (this.conversations.length > this.maxConversations) {
            this.conversations.shift();
        }
        
        // Update relationship based on conversation
        this.updateRelationship(participant, conversation);
        
        // Store important messages as memories
        if (conversation.importance >= this.importance.NORMAL) {
            const memoryKey = `conversation_${conversation.id}`;
            this.store(memoryKey, conversation, conversation.importance, this.categories.CONVERSATION);
        }
        
        this.emit('conversationAdded', conversation);
        
        return conversation.id;
    }

    getConversationsWith(participantName, limit = 10) {
        return this.conversations
            .filter(conv => conv.participant === participantName)
            .slice(-limit)
            .reverse();
    }

    getRecentConversations(limit = 10) {
        return this.conversations
            .slice(-limit)
            .reverse();
    }

    // Relationship management
    updateRelationship(participant, conversation) {
        const participantName = participant.name || 'Unknown';
        
        if (!this.relationships.has(participantName)) {
            this.relationships.set(participantName, {
                name: participantName,
                id: participant.id,
                trustLevel: 50,
                familiarity: 0,
                lastInteraction: Date.now(),
                totalInteractions: 0,
                sentimentHistory: [],
                sharedTopics: new Set(),
                notes: []
            });
        }
        
        const relationship = this.relationships.get(participantName);
        
        // Update relationship metrics
        relationship.totalInteractions++;
        relationship.lastInteraction = conversation.timestamp;
        relationship.familiarity = Math.min(100, relationship.familiarity + 1);
        
        // Update sentiment history
        relationship.sentimentHistory.push(conversation.sentiment);
        if (relationship.sentimentHistory.length > 20) {
            relationship.sentimentHistory.shift();
        }
        
        // Update trust based on sentiment
        const avgSentiment = this.calculateAverageSentiment(relationship.sentimentHistory);
        if (avgSentiment > 0.2) {
            relationship.trustLevel = Math.min(100, relationship.trustLevel + 2);
        } else if (avgSentiment < -0.2) {
            relationship.trustLevel = Math.max(0, relationship.trustLevel - 2);
        }
        
        // Add shared topics
        conversation.topics.forEach(topic => {
            relationship.sharedTopics.add(topic);
        });
        
        this.emit('relationshipUpdated', relationship);
    }

    getRelationship(participantName) {
        return this.relationships.get(participantName);
    }

    getAllRelationships() {
        return Array.from(this.relationships.values());
    }

    // Memory search and filtering
    searchMemories(query, category = null) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        // Search function
        const searchInMemory = (memory) => {
            if (category && memory.category !== category) return false;
            
            const searchIn = [
                memory.key,
                JSON.stringify(memory.data)
            ].join(' ').toLowerCase();
            
            return searchIn.includes(queryLower);
        };
        
        // Search short-term memory
        this.shortTermMemory.forEach(memory => {
            if (searchInMemory(memory)) {
                results.push(memory);
            }
        });
        
        // Search long-term memory
        this.longTermMemory.forEach(memory => {
            if (searchInMemory(memory)) {
                results.push(memory);
            }
        });
        
        // Sort by relevance (importance * strength * recency)
        results.sort((a, b) => {
            const scoreA = this.calculateMemoryScore(a);
            const scoreB = this.calculateMemoryScore(b);
            return scoreB - scoreA;
        });
        
        return results;
    }

    getMemoriesByCategory(category, limit = 20) {
        const memories = [];
        
        this.shortTermMemory.forEach(memory => {
            if (memory.category === category) {
                memories.push(memory);
            }
        });
        
        this.longTermMemory.forEach(memory => {
            if (memory.category === category) {
                memories.push(memory);
            }
        });
        
        return memories
            .sort((a, b) => this.calculateMemoryScore(b) - this.calculateMemoryScore(a))
            .slice(0, limit);
    }

    // Memory analysis helpers
    calculateMessageImportance(message) {
        let importance = this.importance.NORMAL;
        
        // Length-based importance
        if (message.length > 100) importance++;
        if (message.length > 200) importance++;
        
        // Content-based importance
        const importantWords = ['secret', 'important', 'help', 'problem', 'quest', 'treasure'];
        const messageLower = message.toLowerCase();
        
        importantWords.forEach(word => {
            if (messageLower.includes(word)) {
                importance++;
            }
        });
        
        // Question importance
        if (message.includes('?')) importance++;
        
        return Math.min(this.importance.CRITICAL, importance);
    }

    analyzeSentiment(message) {
        // Simple sentiment analysis
        const positiveWords = ['good', 'great', 'awesome', 'wonderful', 'excellent', 'love', 'like', 'happy', 'pleased', 'thank'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'sad', 'angry', 'upset', 'disappointed'];
        
        const messageLower = message.toLowerCase();
        let sentiment = 0;
        
        positiveWords.forEach(word => {
            if (messageLower.includes(word)) sentiment += 0.1;
        });
        
        negativeWords.forEach(word => {
            if (messageLower.includes(word)) sentiment -= 0.1;
        });
        
        return Math.max(-1, Math.min(1, sentiment));
    }

    extractTopics(message) {
        // Simple topic extraction based on keywords
        const topics = new Set();
        const topicKeywords = {
            'history': ['history', 'past', 'ancient', 'old', 'before'],
            'magic': ['magic', 'spell', 'enchant', 'wizard', 'mystical'],
            'trade': ['trade', 'sell', 'buy', 'merchant', 'gold', 'coin'],
            'invention': ['invent', 'create', 'build', 'machine', 'gadget'],
            'books': ['book', 'read', 'library', 'tome', 'scroll'],
            'weather': ['weather', 'rain', 'sun', 'storm', 'cloud'],
            'people': ['person', 'people', 'friend', 'family', 'stranger']
        };
        
        const messageLower = message.toLowerCase();
        
        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
            keywords.forEach(keyword => {
                if (messageLower.includes(keyword)) {
                    topics.add(topic);
                }
            });
        });
        
        return Array.from(topics);
    }

    calculateAverageSentiment(sentiments) {
        if (sentiments.length === 0) return 0;
        const sum = sentiments.reduce((a, b) => a + b, 0);
        return sum / sentiments.length;
    }

    calculateMemoryScore(memory) {
        const age = Date.now() - memory.timestamp;
        const recency = Math.max(0, 1 - (age / (7 * 24 * 60 * 60 * 1000))); // Week-based recency
        const accessBonus = Math.min(1, memory.accessCount / 10);
        
        return memory.importance * memory.strength * (recency + accessBonus);
    }

    // Memory maintenance
    update(deltaTime) {
        // Gradual memory decay
        const decayAmount = this.decayRate * (deltaTime / 60); // Per minute
        
        this.shortTermMemory.forEach(memory => {
            memory.strength = Math.max(0, memory.strength - decayAmount);
            
            // Move important memories to long-term
            if (memory.accessCount > 3 && memory.importance >= this.importance.NORMAL) {
                this.longTermMemory.set(memory.key, memory);
                this.shortTermMemory.delete(memory.key);
            }
        });
        
        // Periodic cleanup
        this.maybeCleanup();
    }

    maybeCleanup() {
        const now = Date.now();
        
        if (now - this.lastCleanupTime > this.cleanupInterval) {
            this.cleanup();
            this.lastCleanupTime = now;
        }
    }

    cleanup() {
        // Remove weak short-term memories
        const toRemove = [];
        
        this.shortTermMemory.forEach((memory, key) => {
            if (memory.strength < 0.1) {
                toRemove.push(key);
            }
        });
        
        toRemove.forEach(key => {
            this.shortTermMemory.delete(key);
        });
        
        // Limit total memory count
        if (this.shortTermMemory.size > this.maxMemories) {
            const memoryArray = Array.from(this.shortTermMemory.entries());
            memoryArray.sort(([,a], [,b]) => this.calculateMemoryScore(a) - this.calculateMemoryScore(b));
            
            const toDelete = memoryArray.slice(0, memoryArray.length - this.maxMemories);
            toDelete.forEach(([key]) => {
                this.shortTermMemory.delete(key);
            });
        }
        
        this.emit('memoryCleanup', {
            removedCount: toRemove.length,
            shortTermCount: this.shortTermMemory.size,
            longTermCount: this.longTermMemory.size
        });
    }

    // Utility methods
    generateMemoryId() {
        return 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }

    getMemoryStats() {
        return {
            shortTermCount: this.shortTermMemory.size,
            longTermCount: this.longTermMemory.size,
            conversationCount: this.conversations.length,
            relationshipCount: this.relationships.size,
            totalMemories: this.shortTermMemory.size + this.longTermMemory.size
        };
    }

    // Serialization for saving/loading
    serialize() {
        return {
            shortTermMemory: Array.from(this.shortTermMemory.entries()),
            longTermMemory: Array.from(this.longTermMemory.entries()),
            conversations: this.conversations,
            relationships: Array.from(this.relationships.entries()),
            facts: Array.from(this.facts.entries()),
            config: {
                maxMemories: this.maxMemories,
                maxConversations: this.maxConversations,
                decayRate: this.decayRate
            }
        };
    }

    deserialize(data) {
        if (data.shortTermMemory) {
            this.shortTermMemory = new Map(data.shortTermMemory);
        }
        
        if (data.longTermMemory) {
            this.longTermMemory = new Map(data.longTermMemory);
        }
        
        if (data.conversations) {
            this.conversations = data.conversations;
        }
        
        if (data.relationships) {
            this.relationships = new Map(data.relationships);
        }
        
        if (data.facts) {
            this.facts = new Map(data.facts);
        }
        
        if (data.config) {
            this.maxMemories = data.config.maxMemories || this.maxMemories;
            this.maxConversations = data.config.maxConversations || this.maxConversations;
            this.decayRate = data.config.decayRate || this.decayRate;
        }
        
        console.log('AgentMemory deserialized', this.getMemoryStats());
    }
}