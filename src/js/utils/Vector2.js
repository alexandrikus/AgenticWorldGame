/**
 * 2D Vector utility class for position and movement calculations
 */
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // Static factory methods
    static zero() {
        return new Vector2(0, 0);
    }

    static one() {
        return new Vector2(1, 1);
    }

    static up() {
        return new Vector2(0, -1);
    }

    static down() {
        return new Vector2(0, 1);
    }

    static left() {
        return new Vector2(-1, 0);
    }

    static right() {
        return new Vector2(1, 0);
    }

    // Basic operations
    add(vector) {
        return new Vector2(this.x + vector.x, this.y + vector.y);
    }

    subtract(vector) {
        return new Vector2(this.x - vector.x, this.y - vector.y);
    }

    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    divide(scalar) {
        return new Vector2(this.x / scalar, this.y / scalar);
    }

    // Vector operations
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector2(0, 0);
        return this.divide(mag);
    }

    distance(vector) {
        return this.subtract(vector).magnitude();
    }

    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    // Utility methods
    clone() {
        return new Vector2(this.x, this.y);
    }

    equals(vector) {
        return this.x === vector.x && this.y === vector.y;
    }

    toString() {
        return `Vector2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }

    // Lerp (linear interpolation)
    lerp(vector, t) {
        return new Vector2(
            this.x + (vector.x - this.x) * t,
            this.y + (vector.y - this.y) * t
        );
    }
}