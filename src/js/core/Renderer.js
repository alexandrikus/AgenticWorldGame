/**
 * Renderer - Handles 2D canvas rendering operations
 */
class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id '${canvasId}' not found`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Camera system
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1
        };
        
        // Rendering settings
        this.backgroundColor = '#2a4d3a';
        this.pixelRatio = window.devicePixelRatio || 1;
        
        this.setupCanvas();
    }

    setupCanvas() {
        // Handle high DPI displays
        this.canvas.width = this.width * this.pixelRatio;
        this.canvas.height = this.height * this.pixelRatio;
        this.ctx.scale(this.pixelRatio, this.pixelRatio);
        
        // Set canvas styling
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        // Enable image smoothing for better quality
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    clear() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.restore();
    }

    // Camera methods
    setCamera(x, y, zoom = 1) {
        this.camera.x = x;
        this.camera.y = y;
        this.camera.zoom = zoom;
    }

    applyCameraTransform() {
        this.ctx.save();
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
    }

    resetCameraTransform() {
        this.ctx.restore();
    }

    // World to screen coordinate conversion
    worldToScreen(worldPos) {
        return new Vector2(
            (worldPos.x - this.camera.x) * this.camera.zoom,
            (worldPos.y - this.camera.y) * this.camera.zoom
        );
    }

    screenToWorld(screenPos) {
        return new Vector2(
            screenPos.x / this.camera.zoom + this.camera.x,
            screenPos.y / this.camera.zoom + this.camera.y
        );
    }

    // Basic drawing primitives
    drawRect(position, width, height, color = '#ffffff', filled = true) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        
        if (filled) {
            this.ctx.fillRect(position.x, position.y, width, height);
        } else {
            this.ctx.strokeRect(position.x, position.y, width, height);
        }
        
        this.ctx.restore();
    }

    drawCircle(center, radius, color = '#ffffff', filled = true) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        
        if (filled) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    drawLine(start, end, color = '#ffffff', width = 1) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawText(text, position, options = {}) {
        const {
            font = '16px Arial',
            color = '#ffffff',
            align = 'left',
            baseline = 'top',
            maxWidth = null
        } = options;

        this.ctx.save();
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;

        if (maxWidth) {
            this.ctx.fillText(text, position.x, position.y, maxWidth);
        } else {
            this.ctx.fillText(text, position.x, position.y);
        }

        this.ctx.restore();
    }

    // Sprite/image drawing
    drawSprite(image, position, options = {}) {
        const {
            width = image.width,
            height = image.height,
            rotation = 0,
            alpha = 1,
            flipX = false,
            flipY = false
        } = options;

        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // Move to position and apply transformations
        this.ctx.translate(position.x + width/2, position.y + height/2);
        
        if (rotation !== 0) {
            this.ctx.rotate(rotation);
        }
        
        if (flipX || flipY) {
            this.ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        }
        
        // Draw the image centered
        this.ctx.drawImage(image, -width/2, -height/2, width, height);
        
        this.ctx.restore();
    }

    // Zone/area drawing
    drawZone(zone) {
        const zoneColor = this.getZoneColor(zone.type);
        const borderColor = this.getZoneBorderColor(zone.type);
        
        // Draw zone background
        this.drawRect(
            zone.position, 
            zone.width, 
            zone.height, 
            zoneColor, 
            true
        );
        
        // Draw zone border
        this.drawRect(
            zone.position, 
            zone.width, 
            zone.height, 
            borderColor, 
            false
        );
        
        // Draw zone label
        const centerX = zone.position.x + zone.width / 2;
        const centerY = zone.position.y + 20;
        
        this.drawText(zone.name, new Vector2(centerX, centerY), {
            font: '14px Arial',
            color: '#ffffff',
            align: 'center'
        });
    }

    getZoneColor(zoneType) {
        const zoneColors = {
            'library': '#4a4a6a',
            'townSquare': '#6a5a4a',
            'workshop': '#5a4a6a',
            'default': '#3a3a3a'
        };
        
        return zoneColors[zoneType] || zoneColors.default;
    }

    getZoneBorderColor(zoneType) {
        const borderColors = {
            'library': '#6a6a8a',
            'townSquare': '#8a7a6a',
            'workshop': '#7a6a8a',
            'default': '#5a5a5a'
        };
        
        return borderColors[zoneType] || borderColors.default;
    }

    // Grid drawing for development/debugging
    drawGrid(gridSize = 50, color = '#333333') {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;
        
        // Vertical lines
        for (let x = 0; x <= this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    // Utility methods
    measureText(text, font = '16px Arial') {
        this.ctx.save();
        this.ctx.font = font;
        const metrics = this.ctx.measureText(text);
        this.ctx.restore();
        return metrics;
    }

    isPointOnScreen(point) {
        return point.x >= 0 && point.x <= this.width && 
               point.y >= 0 && point.y <= this.height;
    }

    // Debug drawing methods
    drawDebugInfo(entities) {
        const debugText = [
            `Entities: ${entities.length}`,
            `Camera: (${this.camera.x.toFixed(1)}, ${this.camera.y.toFixed(1)})`,
            `Zoom: ${this.camera.zoom.toFixed(2)}`
        ];

        debugText.forEach((text, index) => {
            this.drawText(text, new Vector2(10, 10 + index * 20), {
                font: '12px monospace',
                color: '#ffffff'
            });
        });
    }
}