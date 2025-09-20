/**
 * Player class - Represents the player character
 */
class Player extends Entity {
    constructor(position = Vector2.zero()) {
        super(position);
        
        // Player specific properties
        this.type = 'player';
        this.speed = 200; // pixels per second
        this.color = '#4a90e2';
        this.name = 'Player';
        
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
        // Set collision radius
        this.collisionRadius = 15;
        
        // Set visual properties
        this.width = 30;
        this.height = 30;
        
        console.log('Player created at:', this.position.toString());
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
        // Render player as a circle with directional indicator
        const center = new Vector2(0, 0); // Already translated to center
        
        // Main body
        renderer.ctx.fillStyle = this.color;
        renderer.ctx.beginPath();
        renderer.ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
        renderer.ctx.fill();
        
        // Border
        renderer.ctx.strokeStyle = '#357abd';
        renderer.ctx.lineWidth = 2;
        renderer.ctx.stroke();
        
        // Directional indicator (small dot)
        const indicatorDistance = this.width/3;
        let indicatorPos = Vector2.zero();
        
        switch (this.facingDirection) {
            case 'up':
                indicatorPos = new Vector2(0, -indicatorDistance);
                break;
            case 'down':
                indicatorPos = new Vector2(0, indicatorDistance);
                break;
            case 'left':
                indicatorPos = new Vector2(-indicatorDistance, 0);
                break;
            case 'right':
                indicatorPos = new Vector2(indicatorDistance, 0);
                break;
        }
        
        renderer.ctx.fillStyle = '#ffffff';
        renderer.ctx.beginPath();
        renderer.ctx.arc(indicatorPos.x, indicatorPos.y, 3, 0, Math.PI * 2);
        renderer.ctx.fill();
        
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