/**
 * Zone class - Represents different areas within the game world
 */
class Zone extends EventEmitter {
    constructor(type = 'default', position = Vector2.zero(), width = 200, height = 200) {
        super();
        
        // Zone identification
        this.id = this.generateZoneId();
        this.type = type;
        this.name = this.getZoneName(type);
        
        // Spatial properties
        this.position = position.clone();
        this.width = width;
        this.height = height;
        
        // Visual properties
        this.backgroundColor = this.getZoneColor(type);
        this.borderColor = this.getZoneBorderColor(type);
        this.opacity = 0.7;
        
        // Zone properties
        this.description = this.getZoneDescription(type);
        this.ambientSound = null;
        this.musicTrack = null;
        
        // Entities in this zone
        this.entities = new Set();
        this.maxEntities = 50;
        
        // Zone-specific effects
        this.effects = new Map();
        this.lighting = {
            brightness: 1.0,
            color: '#ffffff'
        };
        
        // Interactive elements
        this.interactables = [];
        this.spawnPoints = [];
        
        console.log(`Zone '${this.name}' created at (${position.x}, ${position.y})`);
    }

    generateZoneId() {
        return 'zone_' + Math.random().toString(36).substring(2, 11);
    }

    getZoneName(type) {
        const zoneNames = {
            'library': 'Ancient Library',
            'townSquare': 'Town Square', 
            'workshop': "Milo's Workshop",
            'forest': 'Whispering Woods',
            'marketplace': 'Bustling Marketplace',
            'default': 'Unknown Area'
        };
        
        return zoneNames[type] || zoneNames.default;
    }

    getZoneDescription(type) {
        const descriptions = {
            'library': 'A quiet sanctuary filled with ancient books and scrolls. The air smells of parchment and wisdom.',
            'townSquare': 'The heart of the community where people gather to trade news and goods.',
            'workshop': 'A cluttered space full of gears, tools, and half-finished inventions.',
            'forest': 'Tall trees sway gently in the breeze, their leaves whispering ancient secrets.',
            'marketplace': 'Vendors call out their wares while customers haggle over prices.',
            'default': 'An unremarkable area.'
        };
        
        return descriptions[type] || descriptions.default;
    }

    getZoneColor(type) {
        const colors = {
            'library': '#4a4a6a',
            'townSquare': '#6a5a4a',
            'workshop': '#5a4a6a',
            'forest': '#4a6a4a',
            'marketplace': '#6a6a4a',
            'default': '#5a5a5a'
        };
        
        return colors[type] || colors.default;
    }

    getZoneBorderColor(type) {
        const borderColors = {
            'library': '#6a6a8a',
            'townSquare': '#8a7a6a',
            'workshop': '#7a6a8a',
            'forest': '#6a8a6a',
            'marketplace': '#8a8a6a',
            'default': '#7a7a7a'
        };
        
        return borderColors[type] || borderColors.default;
    }

    update(deltaTime) {
        // Update zone effects
        this.updateEffects(deltaTime);
        
        // Update lighting (day/night cycles, etc.)
        this.updateLighting(deltaTime);
        
        // Update any zone-specific systems
        this.updateZoneSpecificSystems(deltaTime);
        
        // Emit update event
        this.emit('zoneUpdate', deltaTime);
    }

    updateEffects(deltaTime) {
        this.effects.forEach((effect, name) => {
            if (effect.update) {
                effect.update(deltaTime);
            }
            
            // Remove expired effects
            if (effect.expired) {
                this.effects.delete(name);
            }
        });
    }

    updateLighting(deltaTime) {
        // Dynamic lighting based on zone type and time
        // This could be connected to the world's time system
    }

    updateZoneSpecificSystems(deltaTime) {
        // Zone-specific behavior
        switch (this.type) {
            case 'library':
                this.updateLibraryAmbience(deltaTime);
                break;
            case 'workshop':
                this.updateWorkshopAmbience(deltaTime);
                break;
            case 'townSquare':
                this.updateTownSquareActivity(deltaTime);
                break;
        }
    }

    updateLibraryAmbience(deltaTime) {
        // Quiet, scholarly atmosphere
        // Could add particle effects like dust motes floating in sunbeams
    }

    updateWorkshopAmbience(deltaTime) {
        // Busy, mechanical atmosphere
        // Could add spark effects, tool sounds, etc.
    }

    updateTownSquareActivity(deltaTime) {
        // Bustling social atmosphere
        // Could manage crowd density, market activity
    }

    render(renderer) {
        // Render zone background
        this.renderBackground(renderer);
        
        // Render zone decorations
        this.renderDecorations(renderer);
        
        // Render zone effects
        this.renderEffects(renderer);
        
        // Render zone border (if enabled)
        if (window.DEBUG_MODE) {
            this.renderDebugInfo(renderer);
        }
    }

    renderBackground(renderer) {
        renderer.ctx.save();
        renderer.ctx.globalAlpha = this.opacity;
        
        // Fill zone area
        renderer.ctx.fillStyle = this.backgroundColor;
        renderer.ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        
        renderer.ctx.restore();
    }

    renderDecorations(renderer) {
        // Zone-specific decorative elements
        switch (this.type) {
            case 'library':
                this.renderLibraryDecorations(renderer);
                break;
            case 'workshop':
                this.renderWorkshopDecorations(renderer);
                break;
            case 'townSquare':
                this.renderTownSquareDecorations(renderer);
                break;
        }
    }

    renderLibraryDecorations(renderer) {
        // Draw bookshelves as simple rectangles
        const shelfColor = '#8B4513';
        const shelfWidth = 15;
        const shelfHeight = 60;
        
        // Left wall bookshelves
        for (let i = 0; i < 3; i++) {
            const x = this.position.x + 20;
            const y = this.position.y + 40 + (i * 80);
            renderer.drawRect(new Vector2(x, y), shelfWidth, shelfHeight, shelfColor);
        }
        
        // Right wall bookshelves
        for (let i = 0; i < 3; i++) {
            const x = this.position.x + this.width - 35;
            const y = this.position.y + 40 + (i * 80);
            renderer.drawRect(new Vector2(x, y), shelfWidth, shelfHeight, shelfColor);
        }
    }

    renderWorkshopDecorations(renderer) {
        // Draw workbenches and tools
        const benchColor = '#654321';
        const toolColor = '#C0C0C0';
        
        // Main workbench
        renderer.drawRect(
            new Vector2(this.position.x + 50, this.position.y + this.height - 80),
            100, 20, benchColor
        );
        
        // Tool rack (simplified)
        renderer.drawRect(
            new Vector2(this.position.x + 20, this.position.y + 30),
            10, 50, toolColor
        );
    }

    renderTownSquareDecorations(renderer) {
        // Draw fountain or central feature
        const fountainColor = '#87CEEB';
        const centerX = this.position.x + this.width / 2;
        const centerY = this.position.y + this.height / 2;
        
        // Simple circular fountain
        renderer.drawCircle(new Vector2(centerX, centerY), 25, fountainColor);
        
        // Fountain base
        renderer.drawCircle(new Vector2(centerX, centerY), 30, '#696969', false);
    }

    renderEffects(renderer) {
        this.effects.forEach(effect => {
            if (effect.render) {
                effect.render(renderer);
            }
        });
    }

    renderDebugInfo(renderer) {
        // Zone border
        renderer.ctx.save();
        renderer.ctx.strokeStyle = this.borderColor;
        renderer.ctx.lineWidth = 2;
        renderer.ctx.setLineDash([5, 5]);
        renderer.ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
        renderer.ctx.restore();
        
        // Zone label
        const centerX = this.position.x + this.width / 2;
        const labelY = this.position.y + 15;
        
        renderer.drawText(this.name, new Vector2(centerX, labelY), {
            font: '14px Arial',
            color: '#ffffff',
            align: 'center'
        });
        
        // Zone info
        const infoY = this.position.y + this.height - 10;
        renderer.drawText(`Entities: ${this.entities.size}`, new Vector2(centerX, infoY), {
            font: '10px Arial',
            color: '#cccccc',
            align: 'center'
        });
    }

    // Spatial methods
    containsPoint(point) {
        return point.x >= this.position.x && 
               point.x <= this.position.x + this.width &&
               point.y >= this.position.y && 
               point.y <= this.position.y + this.height;
    }

    containsEntity(entity) {
        return this.containsPoint(entity.position);
    }

    getCenter() {
        return new Vector2(
            this.position.x + this.width / 2,
            this.position.y + this.height / 2
        );
    }

    getBounds() {
        return {
            left: this.position.x,
            right: this.position.x + this.width,
            top: this.position.y,
            bottom: this.position.y + this.height
        };
    }

    // Entity management
    addEntity(entity) {
        if (this.entities.size < this.maxEntities) {
            this.entities.add(entity);
            this.emit('entityEntered', entity);
            return true;
        }
        return false;
    }

    removeEntity(entity) {
        if (this.entities.has(entity)) {
            this.entities.delete(entity);
            this.emit('entityLeft', entity);
            return true;
        }
        return false;
    }

    getEntities() {
        return Array.from(this.entities);
    }

    getEntitiesByType(type) {
        return this.getEntities().filter(entity => entity.type === type);
    }

    // Effect management
    addEffect(name, effect) {
        this.effects.set(name, effect);
        this.emit('effectAdded', name, effect);
    }

    removeEffect(name) {
        const effect = this.effects.get(name);
        if (effect) {
            this.effects.delete(name);
            this.emit('effectRemoved', name, effect);
        }
    }

    hasEffect(name) {
        return this.effects.has(name);
    }

    // Interactable management
    addInteractable(interactable) {
        this.interactables.push(interactable);
    }

    removeInteractable(interactable) {
        const index = this.interactables.indexOf(interactable);
        if (index > -1) {
            this.interactables.splice(index, 1);
        }
    }

    getInteractablesNear(position, range) {
        return this.interactables.filter(interactable => {
            return position.distance(interactable.position) <= range;
        });
    }

    // Spawn point management
    addSpawnPoint(position, type = 'default') {
        this.spawnPoints.push({ position: position.clone(), type });
    }

    getSpawnPoint(type = 'default') {
        const spawnPoints = this.spawnPoints.filter(sp => sp.type === type);
        if (spawnPoints.length > 0) {
            return spawnPoints[Math.floor(Math.random() * spawnPoints.length)].position;
        }
        
        // Fallback to zone center
        return this.getCenter();
    }

    // Utility methods
    getZoneInfo() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            description: this.description,
            entityCount: this.entities.size,
            effectCount: this.effects.size,
            bounds: this.getBounds()
        };
    }

    // Serialization
    serialize() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            position: { x: this.position.x, y: this.position.y },
            width: this.width,
            height: this.height,
            backgroundColor: this.backgroundColor,
            borderColor: this.borderColor,
            description: this.description,
            lighting: this.lighting,
            spawnPoints: this.spawnPoints.map(sp => ({
                position: { x: sp.position.x, y: sp.position.y },
                type: sp.type
            }))
        };
    }

    deserialize(data) {
        this.id = data.id;
        this.type = data.type || 'default';
        this.name = data.name || this.getZoneName(this.type);
        this.position = new Vector2(data.position.x, data.position.y);
        this.width = data.width || 200;
        this.height = data.height || 200;
        this.backgroundColor = data.backgroundColor || this.getZoneColor(this.type);
        this.borderColor = data.borderColor || this.getZoneBorderColor(this.type);
        this.description = data.description || this.getZoneDescription(this.type);
        this.lighting = data.lighting || { brightness: 1.0, color: '#ffffff' };
        
        if (data.spawnPoints) {
            this.spawnPoints = data.spawnPoints.map(sp => ({
                position: new Vector2(sp.position.x, sp.position.y),
                type: sp.type
            }));
        }
    }
}