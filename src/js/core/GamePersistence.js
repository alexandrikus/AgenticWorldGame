/**
 * Game Save/Load System
 * Handles persistent storage of game state and agent memories
 */
class GamePersistence extends EventEmitter {
    constructor() {
        super();
        
        this.storageKey = 'agenticWorldGame';
        this.autoSaveInterval = 300000; // 5 minutes
        this.maxSaveSlots = 5;
        
        // Storage methods
        this.storageMethod = this.detectStorageMethod();
        
        // Auto-save timer
        this.autoSaveTimer = null;
        
        console.log(`GamePersistence initialized with ${this.storageMethod} storage`);
    }

    detectStorageMethod() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return 'localStorage';
            }
        } catch (e) {
            console.warn('localStorage not available, using memory storage');
        }
        
        // Fallback to in-memory storage
        this.memoryStorage = new Map();
        return 'memory';
    }

    // Save game state
    async saveGame(gameEngine, slotName = 'autosave') {
        try {
            const saveData = this.createSaveData(gameEngine);
            const savedAt = new Date().toISOString();
            
            const savePackage = {
                version: '1.0.0',
                savedAt: savedAt,
                slotName: slotName,
                data: saveData
            };
            
            await this.writeToStorage(`${this.storageKey}_${slotName}`, savePackage);
            
            this.emit('gameSaved', slotName, savedAt);
            console.log(`Game saved to slot: ${slotName}`);
            
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            this.emit('saveError', error);
            return false;
        }
    }

    // Load game state
    async loadGame(gameEngine, slotName = 'autosave') {
        try {
            const savePackage = await this.readFromStorage(`${this.storageKey}_${slotName}`);
            
            if (!savePackage || !savePackage.data) {
                throw new Error('No save data found');
            }
            
            this.applySaveData(gameEngine, savePackage.data);
            
            this.emit('gameLoaded', slotName, savePackage.savedAt);
            console.log(`Game loaded from slot: ${slotName} (saved ${savePackage.savedAt})`);
            
            return true;
        } catch (error) {
            console.error('Failed to load game:', error);
            this.emit('loadError', error);
            return false;
        }
    }

    // Create comprehensive save data
    createSaveData(gameEngine) {
        const saveData = {
            // Player data
            player: gameEngine.player ? gameEngine.player.serialize() : null,
            
            // World state
            world: gameEngine.world ? gameEngine.world.serialize() : null,
            
            // Agent data with full memory
            agents: {},
            
            // Game settings
            settings: {
                volume: 1.0,
                debugMode: window.DEBUG_MODE || false
            },
            
            // Play statistics
            statistics: {
                playTime: Date.now() - (gameEngine.startTime || Date.now()),
                conversationsHad: 0,
                zonesVisited: new Set()
            }
        };
        
        // Save each agent with full memory and state
        if (gameEngine.agents) {
            gameEngine.agents.forEach((agent, id) => {
                saveData.agents[id] = {
                    ...agent.serialize(),
                    memory: agent.memory.serialize(),
                    aiAgent: agent.aiAgent ? agent.aiAgent.serialize() : null
                };
                
                // Count conversations for statistics
                saveData.statistics.conversationsHad += agent.memory.conversations.length;
            });
        }
        
        return saveData;
    }

    // Apply loaded save data to game
    applySaveData(gameEngine, saveData) {
        // Restore player
        if (saveData.player && gameEngine.player) {
            gameEngine.player.deserialize(saveData.player);
        }
        
        // Restore world
        if (saveData.world && gameEngine.world) {
            gameEngine.world.deserialize(saveData.world);
        }
        
        // Restore agents
        if (saveData.agents && gameEngine.agents) {
            gameEngine.agents.forEach((agent, id) => {
                const agentData = saveData.agents[id];
                if (agentData) {
                    // Restore base agent data
                    agent.deserialize(agentData);
                    
                    // Restore memory
                    if (agentData.memory) {
                        agent.memory.deserialize(agentData.memory);
                    }
                    
                    // Restore AI agent state
                    if (agentData.aiAgent && agent.aiAgent) {
                        agent.aiAgent.deserialize(agentData.aiAgent);
                    }
                }
            });
        }
        
        // Apply settings
        if (saveData.settings) {
            window.DEBUG_MODE = saveData.settings.debugMode;
        }
    }

    // Storage operations
    async writeToStorage(key, data) {
        const serializedData = JSON.stringify(data);
        
        if (this.storageMethod === 'localStorage') {
            localStorage.setItem(key, serializedData);
        } else {
            this.memoryStorage.set(key, serializedData);
        }
    }

    async readFromStorage(key) {
        let serializedData;
        
        if (this.storageMethod === 'localStorage') {
            serializedData = localStorage.getItem(key);
        } else {
            serializedData = this.memoryStorage.get(key);
        }
        
        return serializedData ? JSON.parse(serializedData) : null;
    }

    // Auto-save functionality
    startAutoSave(gameEngine) {
        this.stopAutoSave(); // Clear any existing timer
        
        this.autoSaveTimer = setInterval(() => {
            this.saveGame(gameEngine, 'autosave');
        }, this.autoSaveInterval);
        
        console.log(`Auto-save started (every ${this.autoSaveInterval / 1000}s)`);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log('Auto-save stopped');
        }
    }

    // Save slot management
    async getSaveSlots() {
        const slots = [];
        
        for (let i = 0; i < this.maxSaveSlots; i++) {
            const slotName = `save_${i + 1}`;
            const saveData = await this.readFromStorage(`${this.storageKey}_${slotName}`);
            
            slots.push({
                slot: i + 1,
                slotName: slotName,
                exists: !!saveData,
                savedAt: saveData ? saveData.savedAt : null,
                preview: saveData ? this.createSavePreview(saveData.data) : null
            });
        }
        
        // Add autosave slot
        const autoSave = await this.readFromStorage(`${this.storageKey}_autosave`);
        if (autoSave) {
            slots.unshift({
                slot: 'auto',
                slotName: 'autosave',
                exists: true,
                savedAt: autoSave.savedAt,
                preview: this.createSavePreview(autoSave.data)
            });
        }
        
        return slots;
    }

    createSavePreview(saveData) {
        const preview = {
            playerLevel: 1,
            location: 'Unknown',
            playTime: '0:00',
            agentCount: 0
        };
        
        if (saveData.player && saveData.player.position) {
            // Determine location based on position
            const pos = saveData.player.position;
            if (pos.x < 400 && pos.y < 300) {
                preview.location = 'Library';
            } else if (pos.x >= 400 && pos.y < 300) {
                preview.location = 'Town Square';
            } else {
                preview.location = 'Workshop';
            }
        }
        
        if (saveData.statistics) {
            const playTimeMs = saveData.statistics.playTime || 0;
            const minutes = Math.floor(playTimeMs / 60000);
            const hours = Math.floor(minutes / 60);
            preview.playTime = hours > 0 ? 
                `${hours}:${(minutes % 60).toString().padStart(2, '0')}` :
                `0:${minutes.toString().padStart(2, '0')}`;
        }
        
        if (saveData.agents) {
            preview.agentCount = Object.keys(saveData.agents).length;
        }
        
        return preview;
    }

    async deleteSave(slotName) {
        try {
            const key = `${this.storageKey}_${slotName}`;
            
            if (this.storageMethod === 'localStorage') {
                localStorage.removeItem(key);
            } else {
                this.memoryStorage.delete(key);
            }
            
            this.emit('saveDeleted', slotName);
            console.log(`Save deleted: ${slotName}`);
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }

    // Export/import functionality
    async exportSave(slotName) {
        const savePackage = await this.readFromStorage(`${this.storageKey}_${slotName}`);
        if (!savePackage) {
            throw new Error('Save not found');
        }
        
        return JSON.stringify(savePackage, null, 2);
    }

    async importSave(saveString, slotName) {
        try {
            const savePackage = JSON.parse(saveString);
            
            // Validate save format
            if (!savePackage.data || !savePackage.version) {
                throw new Error('Invalid save format');
            }
            
            await this.writeToStorage(`${this.storageKey}_${slotName}`, savePackage);
            
            this.emit('saveImported', slotName);
            console.log(`Save imported to slot: ${slotName}`);
            return true;
        } catch (error) {
            console.error('Failed to import save:', error);
            throw error;
        }
    }

    // Utility methods
    getStorageUsage() {
        if (this.storageMethod === 'localStorage') {
            let total = 0;
            for (let key in localStorage) {
                if (key.startsWith(this.storageKey)) {
                    total += localStorage[key].length;
                }
            }
            return {
                used: total,
                total: 5 * 1024 * 1024, // Approximate localStorage limit
                percentage: (total / (5 * 1024 * 1024)) * 100
            };
        } else {
            return {
                used: this.memoryStorage.size,
                total: Infinity,
                percentage: 0
            };
        }
    }

    clearAllSaves() {
        const keys = [];
        
        if (this.storageMethod === 'localStorage') {
            for (let key in localStorage) {
                if (key.startsWith(this.storageKey)) {
                    keys.push(key);
                }
            }
            keys.forEach(key => localStorage.removeItem(key));
        } else {
            this.memoryStorage.clear();
        }
        
        this.emit('allSavesCleared');
        console.log('All saves cleared');
    }
}