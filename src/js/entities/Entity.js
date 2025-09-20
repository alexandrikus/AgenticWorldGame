/**
 * Base Entity class - Foundation for all game objects
 */
class Entity extends EventEmitter {
    constructor(position = Vector2.zero()) {
        super();
        
        // Transform
        this.position = position.clone();
        this.previousPosition = position.clone();
        this.velocity = Vector2.zero();
        this.rotation = 0;
        this.scale = new Vector2(1, 1);
        
        // Physics
        this.speed = 100; // pixels per second
        this.friction = 0.8;
        this.collisionRadius = 20;
        
        // Rendering
        this.width = 40;
        this.height = 40;
        this.color = '#ffffff';
        this.visible = true;
        this.alpha = 1.0;
        
        // State
        this.active = true;
        this.id = this.generateId();
        this.type = 'entity';
        
        // Animation
        this.animationFrame = 0;
        this.animationSpeed = 5; // frames per second
        this.lastAnimationTime = 0;
    }

    generateId() {
        return 'entity_' + Math.random().toString(36).substring(2, 11);
    }

    update(deltaTime) {
        if (!this.active) return;
        
        // Store previous position
        this.previousPosition = this.position.clone();
        
        // Apply velocity
        this.position = this.position.add(this.velocity.multiply(deltaTime));
        
        // Apply friction
        this.velocity = this.velocity.multiply(this.friction);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Emit update event
        this.emit('update', deltaTime);
    }

    updateAnimation(deltaTime) {
        const currentTime = performance.now();
        
        if (currentTime - this.lastAnimationTime >= 1000 / this.animationSpeed) {
            this.animationFrame++;
            this.lastAnimationTime = currentTime;
            this.emit('animationFrame', this.animationFrame);
        }
    }

    render(renderer) {
        if (!this.visible) return;
        
        renderer.ctx.save();
        renderer.ctx.globalAlpha = this.alpha;
        
        // Apply transformations
        renderer.ctx.translate(this.position.x + this.width/2, this.position.y + this.height/2);
        renderer.ctx.rotate(this.rotation);
        renderer.ctx.scale(this.scale.x, this.scale.y);
        
        // Render the entity (override in subclasses)
        this.renderEntity(renderer);
        
        renderer.ctx.restore();
        
        // Render debug info if needed
        if (window.DEBUG_MODE) {
            this.renderDebug(renderer);
        }
    }

    renderEntity(renderer) {
        // Default rendering - simple rectangle
        renderer.ctx.fillStyle = this.color;
        renderer.ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    }

    renderDebug(renderer) {
        // Draw collision circle
        renderer.drawCircle(
            new Vector2(this.position.x + this.width/2, this.position.y + this.height/2),
            this.collisionRadius,
            '#ff0000',
            false
        );
        
        // Draw position text
        renderer.drawText(
            `${this.id}\n(${Math.round(this.position.x)}, ${Math.round(this.position.y)})`,
            new Vector2(this.position.x, this.position.y - 30),
            {
                font: '10px monospace',
                color: '#ffffff'
            }
        );
    }

    // Movement methods
    move(direction, deltaTime) {
        const movement = direction.multiply(this.speed * deltaTime);
        this.position = this.position.add(movement);
    }

    moveTo(targetPosition, deltaTime) {
        const direction = targetPosition.subtract(this.position).normalize();
        this.move(direction, deltaTime);
    }

    setVelocity(velocity) {
        this.velocity = velocity.clone();
    }

    addVelocity(velocity) {
        this.velocity = this.velocity.add(velocity);
    }

    // Collision detection
    getCollisionBounds() {
        const center = new Vector2(
            this.position.x + this.width/2,
            this.position.y + this.height/2
        );
        
        return {
            center: center,
            radius: this.collisionRadius,
            left: this.position.x,
            right: this.position.x + this.width,
            top: this.position.y,
            bottom: this.position.y + this.height
        };
    }

    isCollidingWith(other) {
        const thisBounds = this.getCollisionBounds();
        const otherBounds = other.getCollisionBounds();
        
        const distance = thisBounds.center.distance(otherBounds.center);
        return distance < (thisBounds.radius + otherBounds.radius);
    }

    isPointInside(point) {
        return point.x >= this.position.x && 
               point.x <= this.position.x + this.width &&
               point.y >= this.position.y && 
               point.y <= this.position.y + this.height;
    }

    // Utility methods
    getCenter() {
        return new Vector2(
            this.position.x + this.width/2,
            this.position.y + this.height/2
        );
    }

    distanceTo(other) {
        return this.getCenter().distance(other.getCenter());
    }

    lookAt(target) {
        const direction = target.subtract(this.getCenter());
        this.rotation = Math.atan2(direction.y, direction.x);
    }

    // State management
    activate() {
        this.active = true;
        this.emit('activated');
    }

    deactivate() {
        this.active = false;
        this.emit('deactivated');
    }

    destroy() {
        this.active = false;
        this.visible = false;
        this.emit('destroyed');
    }

    // Serialization for save/load
    serialize() {
        return {
            id: this.id,
            type: this.type,
            position: { x: this.position.x, y: this.position.y },
            rotation: this.rotation,
            scale: { x: this.scale.x, y: this.scale.y },
            active: this.active,
            visible: this.visible
        };
    }

    deserialize(data) {
        this.id = data.id;
        this.type = data.type;
        this.position = new Vector2(data.position.x, data.position.y);
        this.rotation = data.rotation;
        this.scale = new Vector2(data.scale.x, data.scale.y);
        this.active = data.active;
        this.visible = data.visible;
    }
}