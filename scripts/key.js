class Key {
    static pressed = new Set();

    static press = (e = null) => {
        if (e.key != undefined) {
            this.pressed.add(e.key);
            return;
        }

        this.pressed.add(e);
    }

    static release = (e = null) => {
        if (e.key != undefined) {
            this.pressed.delete(e.key);
            return;
        }

        this.pressed.delete(e);
    }

    static isPressed = (e = null) => {
        if (e.key != undefined) {
            console.log(this.pressed.has(e));
            return this.pressed.has(e);
        }

        return this.pressed.has(e);
    }
}