/**
 * Player class - Represents the player character
 */
class Player extends Entity {
    constructor(position = Vector2.zero()) {
        super(position);
        
        // Player specific properties
        this.type = 'player';
        this.speed = 200; // pixels per second
        this.color = '#F5F5DC'; // Beige bunny color
        this.name = 'Bunny Player';
        
        // Movement state
        this.isMoving = false;
        this.lastMoveDirection = Vector2.zero();
        
        // Animation states
        this.animationState = 'idle'; // idle, walking
        this.facingDirection = 'down'; // up, down, left, right
        
        // Player stats (for future expansion)
        this.health = 100;
        this.maxHealth = 100;
        this.energy = 100;
        this.maxEnergy = 100;
        
        // Interaction system
        this.interactionRange = 80;
        this.currentInteraction = null;
        
        // Initialize player
        this.setupPlayer();
    }

    setupPlayer() {
        // Set collision radius for bunny (slightly smaller)
        this.collisionRadius = 12;
        
        // Set visual properties for bunny sprite
        this.width = 24;  // Smaller width for bunny
        this.height = 30; // Taller for bunny ears
        
        console.log('Bunny player created at:', this.position.toString());
    }

    update(deltaTime) {
        // Update base entity
        super.update(deltaTime);
        
        // Update movement state
        this.updateMovementState();
        
        // Update animation based on movement
        this.updatePlayerAnimation();
        
        // Regenerate energy (if not at max)
        if (this.energy < this.maxEnergy) {
            this.energy = Math.min(this.maxEnergy, this.energy + 20 * deltaTime);
        }
        
        // Emit player update event
        this.emit('playerUpdate', {
            position: this.position,
            health: this.health,
            energy: this.energy,
            isMoving: this.isMoving
        });
    }

    updateMovementState() {
        // Check if velocity indicates movement
        const velocityThreshold = 10;
        const wasMoving = this.isMoving;
        this.isMoving = this.velocity.magnitude() > velocityThreshold;
        
        // Update facing direction based on movement
        if (this.isMoving) {
            this.updateFacingDirection();
        }
        
        // Emit movement state changes
        if (wasMoving !== this.isMoving) {
            this.emit('movementStateChanged', this.isMoving);
        }
    }

    updateFacingDirection() {
        const vel = this.velocity;
        const threshold = 0.1;
        
        // Determine primary direction based on velocity
        if (Math.abs(vel.x) > Math.abs(vel.y)) {
            this.facingDirection = vel.x > threshold ? 'right' : 'left';
        } else {
            this.facingDirection = vel.y > threshold ? 'down' : 'up';
        }
    }

    updatePlayerAnimation() {
        const previousState = this.animationState;
        this.animationState = this.isMoving ? 'walking' : 'idle';
        
        if (previousState !== this.animationState) {
            this.emit('animationStateChanged', this.animationState);
        }
    }

    move(direction, deltaTime) {
        if (!direction || direction.magnitude() === 0) return;
        
        // Apply movement with energy consumption
        if (this.energy > 0) {
            const normalizedDirection = direction.normalize();
            const movement = normalizedDirection.multiply(this.speed * deltaTime);
            
            this.position = this.position.add(movement);
            this.lastMoveDirection = normalizedDirection;
            
            // Consume energy for movement
            this.energy = Math.max(0, this.energy - 10 * deltaTime);
            
            // Update velocity for smooth animation
            this.velocity = normalizedDirection.multiply(this.speed);
        }
    }

    renderEntity(renderer) {
        // Render player as an adorable bunny character
        const ctx = renderer.ctx;
        
        // Add subtle bounce animation when moving
        const time = Date.now() * 0.01;
        const bounceOffset = this.isMoving ? Math.sin(time * 0.5) * 2 : 0;
        
        // Save context for transformations
        ctx.save();
        
        // Apply bounce animation
        ctx.translate(0, bounceOffset);
        
        // Bunny body (main oval)
        ctx.fillStyle = '#F5F5DC'; // Beige bunny color
        ctx.beginPath();
        ctx.ellipse(0, 2, 12, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body outline
        ctx.strokeStyle = '#D2B48C';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Bunny head (circle above body)
        ctx.fillStyle = '#F5F5DC';
        ctx.beginPath();
        ctx.arc(0, -8, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#D2B48C';
        ctx.stroke();
        
        // Bunny ears - adjust based on facing direction
        let leftEarX = -6, leftEarY = -16;
        let rightEarX = 6, rightEarY = -16;
        
        // Slightly adjust ear positions based on direction for personality
        if (this.facingDirection === 'left') {
            leftEarX -= 1;
            rightEarX -= 1;
        } else if (this.facingDirection === 'right') {
            leftEarX += 1;
            rightEarX += 1;
        }
        
        // Left ear
        ctx.fillStyle = '#F5F5DC';
        ctx.beginPath();
        ctx.ellipse(leftEarX, leftEarY, 3, 8, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#D2B48C';
        ctx.stroke();
        
        // Left ear inner (pink)
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(leftEarX, leftEarY + 1, 1.5, 5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Right ear  
        ctx.fillStyle = '#F5F5DC';
        ctx.beginPath();
        ctx.ellipse(rightEarX, rightEarY, 3, 8, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#D2B48C';
        ctx.stroke();
        
        // Right ear inner (pink)
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(rightEarX, rightEarY + 1, 1.5, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes - adjust based on facing direction
        ctx.fillStyle = '#000000';
        if (this.facingDirection === 'left') {
            // Looking left - show side profile eyes
            ctx.beginPath();
            ctx.arc(-2, -10, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.facingDirection === 'right') {
            // Looking right - show side profile eyes  
            ctx.beginPath();
            ctx.arc(2, -10, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Looking up/down - show both eyes
            ctx.beginPath();
            ctx.arc(-3, -10, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(3, -10, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Eye shine (white highlights)
        ctx.fillStyle = '#FFFFFF';
        if (this.facingDirection === 'left') {
            ctx.beginPath();
            ctx.arc(-2.5, -10.5, 0.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.facingDirection === 'right') {
            ctx.beginPath();
            ctx.arc(1.5, -10.5, 0.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(-3.5, -10.5, 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(2.5, -10.5, 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Bunny nose - adjust based on facing direction
        ctx.fillStyle = '#FFB6C1';
        if (this.facingDirection === 'left') {
            ctx.beginPath();
            ctx.ellipse(-4, -6, 1, 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.facingDirection === 'right') {
            ctx.beginPath();
            ctx.ellipse(4, -6, 1, 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Front-facing triangular nose
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.lineTo(-1, -5);
            ctx.lineTo(1, -5);
            ctx.closePath();
            ctx.fill();
        }
        
        // Bunny mouth - simple line
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        if (this.facingDirection === 'up' || this.facingDirection === 'down') {
            // Front view - small curved mouth
            ctx.beginPath();
            ctx.arc(0, -4, 2, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
        
        // Bunny tail (fluffy white circle on back)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 12, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#D2B48C';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Paws/feet - small ovals at bottom
        ctx.fillStyle = '#F0E68C'; // Slightly different color for paws
        // Left paw
        ctx.beginPath();
        ctx.ellipse(-6, 14, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Right paw
        ctx.beginPath();
        ctx.ellipse(6, 14, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Paw outlines
        ctx.strokeStyle = '#D2B48C';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(-6, 14, 3, 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(6, 14, 3, 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Restore context
        ctx.restore();
        
        // Health bar (if damaged)
        if (this.health < this.maxHealth) {
            this.renderHealthBar(renderer);
        }
    }

    renderHealthBar(renderer) {
        const barWidth = this.width;
        const barHeight = 4;
        const barY = -this.height/2 - 10;
        
        // Background
        renderer.ctx.fillStyle = '#333333';
        renderer.ctx.fillRect(-barWidth/2, barY, barWidth, barHeight);
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.5 ? '#4ade80' : (healthPercent > 0.25 ? '#facc15' : '#ef4444');
        
        renderer.ctx.fillStyle = healthColor;
        renderer.ctx.fillRect(-barWidth/2, barY, barWidth * healthPercent, barHeight);
        
        // Border
        renderer.ctx.strokeStyle = '#ffffff';
        renderer.ctx.lineWidth = 1;
        renderer.ctx.strokeRect(-barWidth/2, barY, barWidth, barHeight);
    }

    // Player-specific methods
    takeDamage(amount) {
        const oldHealth = this.health;
        this.health = Math.max(0, this.health - amount);
        
        this.emit('healthChanged', {
            oldHealth: oldHealth,
            newHealth: this.health,
            damage: amount
        });
        
        if (this.health <= 0) {
            this.emit('playerDied');
        }
    }

    heal(amount) {
        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + amount);
        
        this.emit('healthChanged', {
            oldHealth: oldHealth,
            newHealth: this.health,
            healing: amount
        });
    }

    consumeEnergy(amount) {
        this.energy = Math.max(0, this.energy - amount);
        this.emit('energyChanged', this.energy);
    }

    restoreEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
        this.emit('energyChanged', this.energy);
    }

    // Interaction methods
    canInteractWith(entity) {
        const distance = this.distanceTo(entity);
        return distance <= this.interactionRange;
    }

    startInteraction(entity) {
        this.currentInteraction = entity;
        this.emit('interactionStarted', entity);
    }

    endInteraction() {
        const previousInteraction = this.currentInteraction;
        this.currentInteraction = null;
        this.emit('interactionEnded', previousInteraction);
    }

    // Utility methods
    getStats() {
        return {
            health: this.health,
            maxHealth: this.maxHealth,
            energy: this.energy,
            maxEnergy: this.maxEnergy,
            position: this.position.clone(),
            isMoving: this.isMoving,
            facingDirection: this.facingDirection
        };
    }

    setPosition(x, y) {
        this.position = new Vector2(x, y);
        this.emit('positionChanged', this.position);
    }

    teleport(position) {
        this.position = position.clone();
        this.velocity = Vector2.zero();
        this.emit('teleported', position);
    }

    // Serialization
    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            health: this.health,
            maxHealth: this.maxHealth,
            energy: this.energy,
            maxEnergy: this.maxEnergy,
            facingDirection: this.facingDirection,
            animationState: this.animationState
        };
    }

    deserialize(data) {
        super.deserialize(data);
        this.health = data.health || this.maxHealth;
        this.maxHealth = data.maxHealth || 100;
        this.energy = data.energy || this.maxEnergy;
        this.maxEnergy = data.maxEnergy || 100;
        this.facingDirection = data.facingDirection || 'down';
        this.animationState = data.animationState || 'idle';
    }
}