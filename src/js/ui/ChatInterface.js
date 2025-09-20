/**
 * ChatInterface - Handles the UI for conversations with AI agents
 */
class ChatInterface extends EventEmitter {
    constructor() {
        super();
        
        // UI Elements
        this.chatInterface = document.getElementById('chatInterface');
        this.chatWindow = document.getElementById('chatWindow');
        this.chatHeader = document.getElementById('chatHeader');
        this.agentNameElement = document.getElementById('agentName');
        this.chatHistory = document.getElementById('chatHistory');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.closeChatBtn = document.getElementById('closeChatBtn');
        
        // Chat state
        this.isOpen = false;
        this.currentAgent = null;
        this.messageHistory = [];
        this.isWaitingForResponse = false;
        
        // Configuration
        this.maxMessageLength = 500;
        this.maxHistoryMessages = 50;
        this.typingDelay = 50; // ms between characters for typing animation
        
        this.setupEventListeners();
        console.log('ChatInterface initialized');
    }

    setupEventListeners() {
        // Send button click
        this.sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Enter key to send message
        this.messageInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.sendMessage();
            }
        });
        
        // Close button
        this.closeChatBtn.addEventListener('click', () => {
            this.closeChat();
        });
        
        // Escape key to close
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isOpen) {
                this.closeChat();
            }
        });
        
        // Auto-resize input as user types
        this.messageInput.addEventListener('input', () => {
            this.updateInputState();
        });
        
        // Handle input focus and prevent game controls while typing
        this.messageInput.addEventListener('focus', () => {
            // Stop game input propagation when focused on chat input
            this.emit('chatInputFocused');
        });
        
        this.messageInput.addEventListener('blur', () => {
            // Re-enable game input when chat input loses focus
            this.emit('chatInputBlurred');
        });
        
        // Prevent game controls while typing in chat
        this.messageInput.addEventListener('keydown', (event) => {
            // Stop event propagation to prevent game controls
            event.stopPropagation();
            
            // Allow all keys in chat input, don't prevent anything
            if (this.isWaitingForResponse && event.key !== 'Escape') {
                event.preventDefault();
            }
        });
    }

    openChat(agent) {
        if (!agent) {
            console.error('Cannot open chat: no agent provided');
            return;
        }
        
        this.currentAgent = agent;
        this.isOpen = true;
        
        // Clear previous conversation for new chats
        this.clearHistory();
        
        // Update UI
        this.agentNameElement.textContent = agent.name || 'Unknown Agent';
        this.chatInterface.classList.remove('hidden');
        
        // Reset input state
        this.setWaitingState(false);
        this.messageInput.value = '';
        
        // Focus input after a short delay to ensure proper focusing
        setTimeout(() => {
            this.messageInput.focus();
        }, 100);
        
        // Start conversation with agent
        if (agent.startConversation) {
            agent.startConversation({ name: 'Player' });
        }
        
        // Add greeting for new conversation
        this.addGreeting(agent);
        
        this.emit('chatOpened', agent);
        console.log(`Chat opened with ${agent.name}`);
    }

    closeChat() {
        if (!this.isOpen) return;
        
        const previousAgent = this.currentAgent;
        
        // End conversation with agent
        if (this.currentAgent && this.currentAgent.endConversation) {
            this.currentAgent.endConversation();
        }
        
        // Reset state
        this.isOpen = false;
        this.currentAgent = null;
        this.isWaitingForResponse = false;
        
        // Update UI
        this.chatInterface.classList.add('hidden');
        this.messageInput.value = '';
        this.updateInputState();
        
        this.emit('chatClosed', previousAgent);
        console.log('Chat closed');
    }

    addGreeting(agent) {
        const greetings = this.getAgentGreeting(agent);
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        
        this.addMessage(greeting, 'agent', agent.name);
    }

    getAgentGreeting(agent) {
        // Default greetings based on agent type or personality
        const defaultGreetings = [
            "Hello there! What brings you to me today?",
            "Greetings, traveler. How can I help you?",
            "Well, well... what do we have here?",
            "Oh, hello! I wasn't expecting anyone."
        ];
        
        // Agent-specific greetings could be defined in agent data
        if (agent.personality && agent.personality.greetings) {
            return agent.personality.greetings;
        }
        
        return defaultGreetings;
    }

    async sendMessage() {
        if (!this.currentAgent || this.isWaitingForResponse) return;
        
        const message = this.messageInput.value.trim();
        if (!message || message.length > this.maxMessageLength) return;
        
        // Add player message to history
        this.addMessage(message, 'player');
        
        // Clear input
        this.messageInput.value = '';
        this.updateInputState();
        
        // Set waiting state
        this.setWaitingState(true);
        
        try {
            // Send message to agent and emit event
            this.emit('messageSent', message, this.currentAgent);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage('Sorry, I had trouble understanding that.', 'agent', this.currentAgent.name);
            this.setWaitingState(false);
        }
    }

    addMessage(text, sender, senderName = null) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;
        
        // Create message content
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = text;
        
        // Create message metadata
        const messageMeta = document.createElement('div');
        messageMeta.className = 'message-meta';
        messageMeta.textContent = this.formatTimestamp(new Date());
        
        messageElement.appendChild(messageContent);
        messageElement.appendChild(messageMeta);
        
        // Add to history
        this.chatHistory.appendChild(messageElement);
        
        // Store in message history
        this.messageHistory.push({
            text: text,
            sender: sender,
            senderName: senderName || (sender === 'player' ? 'Player' : 'Agent'),
            timestamp: new Date()
        });
        
        // Limit history size
        if (this.messageHistory.length > this.maxHistoryMessages) {
            this.messageHistory.shift();
            this.chatHistory.removeChild(this.chatHistory.firstChild);
        }
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Add typing animation for agent messages
        if (sender === 'agent') {
            this.animateMessage(messageElement);
        }
        
        this.emit('messageAdded', text, sender, senderName);
    }

    animateMessage(messageElement) {
        const content = messageElement.querySelector('.message-content');
        const originalText = content.textContent;
        
        // Start with empty content
        content.textContent = '';
        
        // Add typing cursor
        const cursor = document.createElement('span');
        cursor.textContent = '|';
        cursor.style.animation = 'blink 1s infinite';
        content.appendChild(cursor);
        
        // Animate text character by character
        let charIndex = 0;
        const typeInterval = setInterval(() => {
            if (charIndex < originalText.length) {
                content.textContent = originalText.substring(0, charIndex + 1);
                content.appendChild(cursor);
                charIndex++;
            } else {
                // Remove cursor when done
                content.removeChild(cursor);
                clearInterval(typeInterval);
            }
        }, this.typingDelay);
    }

    setWaitingState(waiting) {
        this.isWaitingForResponse = waiting;
        
        // Update UI to show waiting state
        this.sendBtn.disabled = waiting;
        this.messageInput.disabled = waiting;
        
        if (waiting) {
            this.sendBtn.textContent = '...';
            this.messageInput.placeholder = 'Waiting for response...';
        } else {
            this.sendBtn.textContent = 'Send';
            this.messageInput.placeholder = 'Type your message...';
            this.messageInput.focus();
        }
    }

    updateInputState() {
        const hasText = this.messageInput.value.trim().length > 0;
        const isValid = hasText && this.messageInput.value.length <= this.maxMessageLength;
        
        this.sendBtn.disabled = !isValid || this.isWaitingForResponse;
        
        // Show character count for long messages
        if (this.messageInput.value.length > this.maxMessageLength * 0.8) {
            const remaining = this.maxMessageLength - this.messageInput.value.length;
            this.messageInput.title = `${remaining} characters remaining`;
        } else {
            this.messageInput.title = '';
        }
    }

    scrollToBottom() {
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }

    formatTimestamp(date) {
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    clearHistory() {
        this.chatHistory.innerHTML = '';
        this.messageHistory = [];
        this.emit('historyCleard');
    }

    // Agent response handling (called by GameEngine)
    handleAgentResponse(response, agent) {
        this.setWaitingState(false);
        
        if (response && response.trim()) {
            this.addMessage(response, 'agent', agent.name);
        } else {
            // Fallback response
            this.addMessage(`${agent.name} seems lost in thought.`, 'agent', agent.name);
        }
    }

    // Conversation management
    getConversationHistory() {
        return this.messageHistory.slice();
    }

    exportConversation() {
        const conversation = {
            agent: this.currentAgent ? this.currentAgent.name : null,
            messages: this.messageHistory,
            timestamp: new Date()
        };
        
        return JSON.stringify(conversation, null, 2);
    }

    importConversation(conversationData) {
        try {
            const conversation = JSON.parse(conversationData);
            
            this.clearHistory();
            
            conversation.messages.forEach(msg => {
                this.addMessage(msg.text, msg.sender, msg.senderName);
            });
            
            console.log('Conversation imported successfully');
        } catch (error) {
            console.error('Failed to import conversation:', error);
        }
    }

    // Utility methods
    isCurrentlyTalking() {
        return this.isOpen && this.currentAgent;
    }

    getCurrentAgent() {
        return this.currentAgent;
    }

    getLastMessage() {
        return this.messageHistory.length > 0 ? 
               this.messageHistory[this.messageHistory.length - 1] : null;
    }

    // Configuration methods
    setMaxMessageLength(length) {
        this.maxMessageLength = Math.max(50, Math.min(1000, length));
    }

    setTypingDelay(delay) {
        this.typingDelay = Math.max(10, Math.min(200, delay));
    }

    // Accessibility methods
    announceMessage(message, sender) {
        // For screen readers
        const announcement = `${sender === 'player' ? 'You said' : sender + ' said'}: ${message}`;
        
        const announcementElement = document.createElement('div');
        announcementElement.setAttribute('aria-live', 'polite');
        announcementElement.setAttribute('aria-atomic', 'true');
        announcementElement.style.position = 'absolute';
        announcementElement.style.left = '-10000px';
        announcementElement.textContent = announcement;
        
        document.body.appendChild(announcementElement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcementElement);
        }, 1000);
    }
}