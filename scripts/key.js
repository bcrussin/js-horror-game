class Keys {
    static pressed = new Set();

    static press = (e = null) => {
        if (e.key != undefined) {
            this.pressed.add(e.key.toLowerCase());
            return;
        }

        this.pressed.add(e.toLowerCase());
    }

    static release = (e = null) => {
        if (e.key != undefined) {
            this.pressed.delete(e.key.toLowerCase());
            return;
        }

        this.pressed.delete(e.toLowerCase());
    }

    static isPressed = (e = null) => {
        if (e.key != undefined) {
            console.log(this.pressed.has(e));
            return this.pressed.has(e.toLowerCase());
        }

        return this.pressed.has(e.toLowerCase());
    }
}