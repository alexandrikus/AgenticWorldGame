/**
 * AIAgent - Enhanced AI agent with LLM integration capabilities
 */
class AIAgent extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // AI Configuration
        this.apiEndpoint = config.apiEndpoint || null;
        this.apiKey = config.apiKey || null;
        this.model = config.model || 'gpt-3.5-turbo';
        
        // Agent persona
        this.name = config.name || 'AI Agent';
        this.personality = config.personality || {};
        this.systemPrompt = config.systemPrompt || this.generateDefaultSystemPrompt();
        
        // Context management
        this.maxContextTokens = config.maxContextTokens || 2000;
        this.conversationHistory = [];
        this.worldKnowledge = new Map();
        
        // Response settings
        this.responseStyle = config.responseStyle || 'conversational';
        this.temperature = config.temperature || 0.7;
        this.maxTokens = config.maxTokens || 150;
        
        // Fallback responses for when AI is unavailable
        this.fallbackResponses = this.generateFallbackResponses();
        
        console.log(`AIAgent ${this.name} initialized`);
    }

    generateDefaultSystemPrompt() {
        return `You are ${this.name}, a character in a 2D fantasy world game. You have your own personality, goals, and memories. 
        
Respond naturally and stay in character. Keep responses conversational and under 150 words.
Keep the fantasy setting in mind - this is a world with magic, merchants, inventors, and scholars.

Your personality traits:
${Object.entries(this.personality).map(([trait, value]) => `- ${trait}: ${value}`).join('\n')}

Always respond as this character would, considering their background, goals, and relationship with the player.`;
    }

    generateFallbackResponses() {
        return {
            greeting: [
                `Hello there! I'm ${this.name}.`,
                `Greetings, traveler.`,
                `Well, hello! What brings you here?`
            ],
            confused: [
                "I'm not sure I understand what you mean.",
                "Could you rephrase that?",
                "That's an interesting way to put it...",
                "Hmm, I'm not quite following."
            ],
            goodbye: [
                "Farewell for now!",
                "Until we meet again.",
                "Safe travels!",
                "It was good talking with you."
            ],
            busy: [
                "I'm rather busy at the moment.",
                "Can we talk later? I have things to do.",
                "I'm in the middle of something important."
            ],
            default: [
                "That's interesting.",
                "I see.",
                "Tell me more about that.",
                "What do you think about that?"
            ]
        };
    }

    async generateResponse(message, context = {}) {
        try {
            // Try AI response first
            if (this.apiEndpoint && this.apiKey) {
                return await this.generateAIResponse(message, context);
            } else {
                return this.generateFallbackResponse(message, context);
            }
        } catch (error) {
            console.warn(`AI response failed for ${this.name}:`, error.message);
            return this.generateFallbackResponse(message, context);
        }
    }

    async generateAIResponse(message, context) {
        // Build conversation context
        const messages = this.buildConversationContext(message, context);
        
        const requestBody = {
            model: this.model,
            messages: messages,
            max_tokens: this.maxTokens,
            temperature: this.temperature,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        };

        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            const aiResponse = data.choices[0].message.content.trim();
            
            // Store in conversation history
            this.addToConversationHistory(message, aiResponse);
            
            return aiResponse;
        } else {
            throw new Error('No response from AI');
        }
    }

    buildConversationContext(currentMessage, context) {
        const messages = [];
        
        // System prompt
        messages.push({
            role: 'system',
            content: this.systemPrompt
        });
        
        // Add world context if available
        if (context.worldInfo) {
            messages.push({
                role: 'system',
                content: `Current world context: ${JSON.stringify(context.worldInfo)}`
            });
        }
        
        // Add recent conversation history
        const recentHistory = this.conversationHistory.slice(-6); // Last 6 messages
        recentHistory.forEach(entry => {
            messages.push({
                role: 'user',
                content: entry.user
            });
            messages.push({
                role: 'assistant',
                content: entry.assistant
            });
        });
        
        // Add current message
        messages.push({
            role: 'user',
            content: currentMessage
        });
        
        return messages;
    }

    generateFallbackResponse(message, context) {
        const messageLower = message.toLowerCase();
        
        // Pattern matching for different response types
        if (this.isGreeting(messageLower)) {
            return this.getRandomResponse('greeting');
        } else if (this.isGoodbye(messageLower)) {
            return this.getRandomResponse('goodbye');
        } else if (this.isConfused(messageLower)) {
            return this.getRandomResponse('confused');
        } else if (this.personality.busy && Math.random() < 0.1) {
            return this.getRandomResponse('busy');
        } else {
            return this.generatePersonalityResponse(message, context);
        }
    }

    generatePersonalityResponse(message, context) {
        // Generate response based on personality traits
        const responses = [];
        
        // Add personality-specific responses
        if (this.personality.scholarly) {
            responses.push(
                "That's a fascinating topic. In my studies, I've found...",
                "From what I know about such matters...",
                "An interesting question indeed."
            );
        }
        
        if (this.personality.friendly) {
            responses.push(
                "I'm always happy to chat about that!",
                "You seem like someone I can trust.",
                "It's wonderful to have someone to talk to."
            );
        }
        
        if (this.personality.suspicious) {
            responses.push(
                "Why do you want to know about that?",
                "I'm not sure I should share that information.",
                "That's a rather personal question..."
            );
        }
        
        if (this.personality.helpful) {
            responses.push(
                "Let me see if I can help you with that.",
                "I'd be glad to assist you.",
                "Perhaps I can offer some advice."
            );
        }
        
        // Add default responses if no personality matches
        if (responses.length === 0) {
            responses.push(...this.fallbackResponses.default);
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Helper methods for response classification
    isGreeting(message) {
        const greetings = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good day'];
        return greetings.some(greeting => message.includes(greeting));
    }

    isGoodbye(message) {
        const goodbyes = ['goodbye', 'bye', 'farewell', 'see you', 'later', 'exit'];
        return goodbyes.some(goodbye => message.includes(goodbye));
    }

    isConfused(message) {
        // Very short messages or nonsensical input
        return message.length < 3 || /^[^a-zA-Z]*$/.test(message);
    }

    getRandomResponse(category) {
        const responses = this.fallbackResponses[category];
        if (responses && responses.length > 0) {
            return responses[Math.floor(Math.random() * responses.length)];
        }
        return "I'm not sure how to respond to that.";
    }

    // Conversation management
    addToConversationHistory(userMessage, assistantResponse) {
        this.conversationHistory.push({
            user: userMessage,
            assistant: assistantResponse,
            timestamp: Date.now()
        });
        
        // Limit history length
        if (this.conversationHistory.length > 20) {
            this.conversationHistory.shift();
        }
    }

    clearConversationHistory() {
        this.conversationHistory = [];
        this.emit('conversationCleared');
    }

    // World knowledge management
    addWorldKnowledge(key, value) {
        this.worldKnowledge.set(key, {
            value: value,
            timestamp: Date.now(),
            importance: 1
        });
    }

    getWorldKnowledge(key) {
        const knowledge = this.worldKnowledge.get(key);
        return knowledge ? knowledge.value : null;
    }

    updateWorldKnowledge(key, value, importance = 1) {
        if (this.worldKnowledge.has(key)) {
            const existing = this.worldKnowledge.get(key);
            existing.value = value;
            existing.timestamp = Date.now();
            existing.importance = Math.max(existing.importance, importance);
        } else {
            this.addWorldKnowledge(key, value);
        }
    }

    // Configuration methods
    setAPIConfiguration(endpoint, apiKey, model = 'gpt-3.5-turbo') {
        this.apiEndpoint = endpoint;
        this.apiKey = apiKey;
        this.model = model;
        console.log(`AI API configured for ${this.name}`);
    }

    updatePersonality(traits) {
        this.personality = { ...this.personality, ...traits };
        this.systemPrompt = this.generateDefaultSystemPrompt();
        console.log(`Personality updated for ${this.name}`);
    }

    setResponseStyle(style, temperature = null, maxTokens = null) {
        this.responseStyle = style;
        if (temperature !== null) this.temperature = temperature;
        if (maxTokens !== null) this.maxTokens = maxTokens;
    }

    // Analysis methods
    analyzeMessage(message) {
        return {
            length: message.length,
            wordCount: message.split(/\s+/).length,
            sentiment: this.analyzeSentiment(message),
            topics: this.extractTopics(message),
            questions: (message.match(/\?/g) || []).length,
            complexity: this.calculateComplexity(message)
        };
    }

    analyzeSentiment(message) {
        // Simple sentiment analysis (could be replaced with more sophisticated method)
        const positive = ['good', 'great', 'wonderful', 'amazing', 'excellent', 'love', 'like', 'happy'];
        const negative = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'disappointed'];
        
        const words = message.toLowerCase().split(/\s+/);
        let score = 0;
        
        words.forEach(word => {
            if (positive.includes(word)) score += 1;
            if (negative.includes(word)) score -= 1;
        });
        
        return Math.max(-1, Math.min(1, score / words.length));
    }

    extractTopics(message) {
        // Extract key topics from message (simplified implementation)
        const topics = [];
        const topicWords = {
            'history': ['history', 'past', 'ancient', 'old', 'before'],
            'magic': ['magic', 'spell', 'wizard', 'enchant'],
            'trade': ['trade', 'buy', 'sell', 'merchant', 'gold'],
            'invention': ['invent', 'create', 'build', 'machine'],
            'books': ['book', 'read', 'library', 'knowledge']
        };
        
        const messageLower = message.toLowerCase();
        
        Object.entries(topicWords).forEach(([topic, keywords]) => {
            if (keywords.some(keyword => messageLower.includes(keyword))) {
                topics.push(topic);
            }
        });
        
        return topics;
    }

    calculateComplexity(message) {
        const sentences = message.split(/[.!?]+/).length;
        const words = message.split(/\s+/).length;
        const avgWordsPerSentence = words / Math.max(1, sentences);
        
        // Simple complexity score
        return Math.min(1, avgWordsPerSentence / 15);
    }

    // Utility methods
    getStats() {
        return {
            name: this.name,
            conversationLength: this.conversationHistory.length,
            worldKnowledgeCount: this.worldKnowledge.size,
            hasAIAPI: !!(this.apiEndpoint && this.apiKey),
            personality: Object.keys(this.personality),
            responseStyle: this.responseStyle
        };
    }

    // Serialization
    serialize() {
        return {
            name: this.name,
            personality: this.personality,
            conversationHistory: this.conversationHistory.slice(-10), // Only recent history
            worldKnowledge: Array.from(this.worldKnowledge.entries()),
            responseStyle: this.responseStyle,
            temperature: this.temperature,
            maxTokens: this.maxTokens
        };
    }

    deserialize(data) {
        this.name = data.name || this.name;
        this.personality = data.personality || {};
        this.conversationHistory = data.conversationHistory || [];
        this.responseStyle = data.responseStyle || 'conversational';
        this.temperature = data.temperature || 0.7;
        this.maxTokens = data.maxTokens || 150;
        
        if (data.worldKnowledge) {
            this.worldKnowledge = new Map(data.worldKnowledge);
        }
        
        // Regenerate system prompt with new personality
        this.systemPrompt = this.generateDefaultSystemPrompt();
    }
}