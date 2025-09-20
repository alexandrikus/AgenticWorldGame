/**
 * Inp        // Configuration
        this.moveKeys = {
            'w': Vector2.up(),
            'a': Vector2.left(),
            's': Vector2.down(),
            'd': Vector2.right(),
            'ArrowUp': Vector2.up(),
            'ArrowLeft': Vector2.left(),
            'ArrowDown': Vector2.down(),
            'ArrowRight': Vector2.right()
        };
        
        // Action keys
        this.actionKeys = {
            'e': 'interact',
            'Enter': 'confirm',
            'Escape': 'cancel'
        };
        
        // Input state control
        this.isInputDisabled = false;
        
        this.setupEventListeners(); keyboard input and input state
 */
class InputManager extends EventEmitter {
    constructor() {
        super();
        
        // Input state
        this.keys = {};
        this.keyDownTime = {};
        
        // Movement configuration
        this.moveKeys = {
            'w': Vector2.up(),
            'a': Vector2.left(),
            's': Vector2.down(),
            'd': Vector2.right(),
            'ArrowUp': Vector2.up(),
            'ArrowLeft': Vector2.left(),
            'ArrowDown': Vector2.down(),
            'ArrowRight': Vector2.right()
        };
        
        // Action keys
        this.actionKeys = {
            'e': 'interact',
            'Enter': 'confirm',
            'Escape': 'cancel'
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        document.addEventListener('keyup', (event) => this.handleKeyUp(event));
        
        // Prevent default browser shortcuts that might interfere (only when input is enabled)
        document.addEventListener('keydown', (event) => {
            // Only prevent defaults for game controls when input is not disabled
            if (this.isInputDisabled) return;
            
            const key = event.key.toLowerCase();
            
            // Prevent WASD from scrolling
            if (['w', 'a', 's', 'd'].includes(key)) {
                event.preventDefault();
            }
            
            // Prevent space from scrolling when not in chat
            if (key === ' ') {
                event.preventDefault();
            }
        });
    }

    handleKeyDown(event) {
        // Skip input processing if disabled (e.g., when typing in chat)
        if (this.isInputDisabled) return;
        
        const key = event.key;
        const keyLower = key.toLowerCase();
        
        // Don't process if key is already down
        if (this.keys[keyLower]) return;
        
        // Set key state
        this.keys[keyLower] = true;
        this.keyDownTime[keyLower] = performance.now();
        
        // Emit key events
        this.emit('keyDown', key, keyLower);
        
        // Handle movement keys
        if (this.moveKeys[keyLower]) {
            this.emit('moveStart', this.moveKeys[keyLower], keyLower);
        }
        
        // Handle action keys
        if (this.actionKeys[keyLower]) {
            this.emit(this.actionKeys[keyLower]);
        }
        
        // Handle specific keys
        switch (keyLower) {
            case 'e':
                this.emit('interact');
                break;
            case 'escape':
                this.emit('escape');
                break;
            case 'enter':
                this.emit('enter');
                break;
        }
    }

    handleKeyUp(event) {
        const keyLower = event.key.toLowerCase();
        
        if (!this.keys[keyLower]) return;
        
        // Calculate how long key was held
        const holdTime = performance.now() - this.keyDownTime[keyLower];
        
        // Clear key state
        this.keys[keyLower] = false;
        delete this.keyDownTime[keyLower];
        
        // Emit key events
        this.emit('keyUp', event.key, keyLower, holdTime);
        
        // Handle movement keys
        if (this.moveKeys[keyLower]) {
            this.emit('moveEnd', this.moveKeys[keyLower], keyLower);
        }
    }

    // Get current movement vector based on pressed keys
    getMovementVector() {
        let movement = Vector2.zero();
        
        for (const [key, direction] of Object.entries(this.moveKeys)) {
            if (this.keys[key]) {
                movement = movement.add(direction);
            }
        }
        
        // Normalize diagonal movement
        if (movement.magnitude() > 1) {
            movement = movement.normalize();
        }
        
        return movement;
    }

    // Check if a specific key is currently pressed
    isKeyPressed(key) {
        return !!this.keys[key.toLowerCase()];
    }

    // Check if any movement key is pressed
    isMoving() {
        return Object.keys(this.moveKeys).some(key => this.keys[key]);
    }

    // Get how long a key has been held (in milliseconds)
    getKeyHoldTime(key) {
        const keyLower = key.toLowerCase();
        if (!this.keys[keyLower]) return 0;
        return performance.now() - this.keyDownTime[keyLower];
    }

    // Update method to be called each frame for continuous input
    update() {
        // Skip movement processing if input is disabled
        if (this.isInputDisabled) return;
        
        // Emit movement event if any movement keys are pressed
        if (this.isMoving()) {
            const movement = this.getMovementVector();
            this.emit('move', movement);
        }
    }

    // Utility methods
    clearAllKeys() {
        this.keys = {};
        this.keyDownTime = {};
    }

    // Add custom key binding
    addMoveKey(key, direction) {
        this.moveKeys[key.toLowerCase()] = direction;
    }

    addActionKey(key, action) {
        this.actionKeys[key.toLowerCase()] = action;
    }
}