/**
 * World class - Manages the game world, zones, and global state
 */
class World extends EventEmitter {
    constructor() {
        super();
        
        // World properties
        this.width = 1024;
        this.height = 768;
        this.zones = new Map();
        this.entities = new Map();
        
        // World state
        this.timeOfDay = 12; // 0-24 hours
        this.dayCount = 1;
        this.weather = 'clear';
        
        // World systems
        this.physics = {
            gravity: 0,
            friction: 0.95
        };
        
        console.log('World initialized');
    }

    update(deltaTime) {
        // Update time of day
        this.updateTime(deltaTime);
        
        // Update all zones
        this.zones.forEach(zone => {
            zone.update(deltaTime);
        });
        
        // Update world entities (not managed by zones)
        this.entities.forEach(entity => {
            if (entity.active) {
                entity.update(deltaTime);
            }
        });
        
        // Check zone transitions
        this.checkZoneTransitions();
    }

    render(renderer) {
        // Render all zones
        this.zones.forEach(zone => {
            zone.render(renderer);
        });
        
        // Render world entities
        this.entities.forEach(entity => {
            if (entity.visible) {
                entity.render(renderer);
            }
        });
        
        // Render world effects (weather, lighting, etc.)
        this.renderWorldEffects(renderer);
    }

    updateTime(deltaTime) {
        // Time passes slowly - 1 real minute = 1 game hour
        const timeScale = 1/60; // 60 seconds = 1 game hour
        this.timeOfDay += deltaTime * timeScale;
        
        if (this.timeOfDay >= 24) {
            this.timeOfDay = 0;
            this.dayCount++;
            this.emit('newDay', this.dayCount);
        }
    }

    renderWorldEffects(renderer) {
        // Apply time-of-day lighting
        this.applyLighting(renderer);
        
        // Render weather effects
        this.renderWeather(renderer);
    }

    applyLighting(renderer) {
        // Create day/night lighting overlay
        let lightLevel = 1.0;
        
        if (this.timeOfDay < 6 || this.timeOfDay > 20) {
            // Night time (darker)
            lightLevel = 0.6;
        } else if (this.timeOfDay < 8 || this.timeOfDay > 18) {
            // Dawn/dusk (slightly darker)
            lightLevel = 0.8;
        }
        
        if (lightLevel < 1.0) {
            renderer.ctx.save();
            renderer.ctx.fillStyle = `rgba(0, 20, 40, ${1 - lightLevel})`;
            renderer.ctx.fillRect(0, 0, this.width, this.height);
            renderer.ctx.restore();
        }
    }

    renderWeather(renderer) {
        // Simple weather effects
        if (this.weather === 'rain') {
            this.renderRain(renderer);
        }
    }

    renderRain(renderer) {
        // Simple rain effect
        renderer.ctx.save();
        renderer.ctx.strokeStyle = 'rgba(200, 200, 255, 0.6)';
        renderer.ctx.lineWidth = 1;
        
        const raindrops = 50;
        for (let i = 0; i < raindrops; i++) {
            const x = Math.random() * this.width;
            const y = (Math.random() * this.height + performance.now() * 0.1) % this.height;
            
            renderer.ctx.beginPath();
            renderer.ctx.moveTo(x, y);
            renderer.ctx.lineTo(x - 2, y + 10);
            renderer.ctx.stroke();
        }
        
        renderer.ctx.restore();
    }

    // Zone management
    addZone(zone) {
        this.zones.set(zone.id, zone);
        this.emit('zoneAdded', zone);
        console.log(`Zone '${zone.name}' added to world`);
    }

    removeZone(zoneId) {
        const zone = this.zones.get(zoneId);
        if (zone) {
            this.zones.delete(zoneId);
            this.emit('zoneRemoved', zone);
            console.log(`Zone '${zone.name}' removed from world`);
        }
    }

    getZone(zoneId) {
        return this.zones.get(zoneId);
    }

    getCurrentZone(position) {
        for (const zone of this.zones.values()) {
            if (zone.containsPoint(position)) {
                return zone;
            }
        }
        return null;
    }

    checkZoneTransitions() {
        // This would handle zone transition logic
        // For now, just emit events when entities move between zones
    }

    // Entity management
    addEntity(entity) {
        this.entities.set(entity.id, entity);
        this.emit('entityAdded', entity);
    }

    removeEntity(entityId) {
        const entity = this.entities.get(entityId);
        if (entity) {
            this.entities.delete(entityId);
            this.emit('entityRemoved', entity);
        }
    }

    getEntity(entityId) {
        return this.entities.get(entityId);
    }

    getAllEntities() {
        return Array.from(this.entities.values());
    }

    getEntitiesInZone(zone) {
        return this.getAllEntities().filter(entity => 
            zone.containsPoint(entity.position)
        );
    }

    // World queries
    findEntitiesInRange(position, range, entityType = null) {
        return this.getAllEntities().filter(entity => {
            const distance = position.distance(entity.position);
            const typeMatch = !entityType || entity.type === entityType;
            return distance <= range && typeMatch;
        });
    }

    findNearestEntity(position, entityType = null) {
        let nearest = null;
        let nearestDistance = Infinity;
        
        this.getAllEntities().forEach(entity => {
            if (entityType && entity.type !== entityType) return;
            
            const distance = position.distance(entity.position);
            if (distance < nearestDistance) {
                nearest = entity;
                nearestDistance = distance;
            }
        });
        
        return nearest;
    }

    // Collision detection
    checkCollisions(entity, entityTypes = []) {
        const collisions = [];
        
        this.getAllEntities().forEach(other => {
            if (other === entity) return;
            if (entityTypes.length > 0 && !entityTypes.includes(other.type)) return;
            
            if (entity.isCollidingWith(other)) {
                collisions.push(other);
            }
        });
        
        return collisions;
    }

    // World state management
    setTimeOfDay(hour) {
        this.timeOfDay = Math.max(0, Math.min(24, hour));
        this.emit('timeChanged', this.timeOfDay);
    }

    setWeather(weather) {
        const validWeather = ['clear', 'rain', 'cloudy', 'storm'];
        if (validWeather.includes(weather)) {
            this.weather = weather;
            this.emit('weatherChanged', weather);
        }
    }

    // Utility methods
    isValidPosition(position) {
        return position.x >= 0 && position.x <= this.width && 
               position.y >= 0 && position.y <= this.height;
    }

    clampToWorldBounds(position) {
        return new Vector2(
            Math.max(0, Math.min(this.width, position.x)),
            Math.max(0, Math.min(this.height, position.y))
        );
    }

    getWorldInfo() {
        return {
            width: this.width,
            height: this.height,
            timeOfDay: this.timeOfDay,
            dayCount: this.dayCount,
            weather: this.weather,
            zoneCount: this.zones.size,
            entityCount: this.entities.size
        };
    }

    // Serialization
    serialize() {
        const zonesData = {};
        this.zones.forEach((zone, id) => {
            zonesData[id] = zone.serialize();
        });
        
        const entitiesData = {};
        this.entities.forEach((entity, id) => {
            entitiesData[id] = entity.serialize();
        });
        
        return {
            width: this.width,
            height: this.height,
            timeOfDay: this.timeOfDay,
            dayCount: this.dayCount,
            weather: this.weather,
            zones: zonesData,
            entities: entitiesData
        };
    }

    deserialize(data) {
        this.width = data.width || 1024;
        this.height = data.height || 768;
        this.timeOfDay = data.timeOfDay || 12;
        this.dayCount = data.dayCount || 1;
        this.weather = data.weather || 'clear';
        
        // Restore zones
        if (data.zones) {
            Object.entries(data.zones).forEach(([id, zoneData]) => {
                const zone = new Zone();
                zone.deserialize(zoneData);
                this.zones.set(id, zone);
            });
        }
        
        // Restore entities
        if (data.entities) {
            Object.entries(data.entities).forEach(([id, entityData]) => {
                // Would need to create appropriate entity types based on data.type
                // This is a simplified version
                const entity = new Entity();
                entity.deserialize(entityData);
                this.entities.set(id, entity);
            });
        }
    }
}