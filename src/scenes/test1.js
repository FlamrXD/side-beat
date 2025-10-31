// scenes/RhythmScene.js

class RhythmScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RhythmScene' });
        this.notes = [];
        this.lanes = [150, 250];
        this.hitZoneX = 100;
        this.scrollSpeed = 700;
        this.hitWindow = 50;
        this.score = 0;

        this.keysDown = {};
        this.keysJustPressed = {};
        this.keyMap = { 0: 'f', 1: 'j' };

        this.hitZones = []; // store lane graphics
    }

    preload() {
        this.load.audio('song', '../assets/Aeronautica/song.mp3');
        this.load.audio('hitsound', '../assets/osu-hit-sound.mp3');
        this.load.json('noteMap', '../assets/Aeronautica/note_map.json');
    }

    create() {
        print("Made by FlamerXD/Ketan Tayi for Mr. Six's music cycle")
        // --- Play song ---
        this.song = this.sound.add('song');
        this.song.play();

        const noteMap = this.cache.json.get('noteMap');

        // --- Create notes ---
        noteMap.forEach(data => {
            const isHold = data.hold && data.hold > 0;
            const color = isHold ? 0xff4444 : 0x00ff00;

            const graphics = this.add.graphics();
            graphics.fillStyle(color, 1);

            const width = isHold ? 20 + data.hold * this.scrollSpeed / 20 : 20;
            graphics.fillRect(0, 0, width, 40);

            graphics.x = this.game.config.width + 50;
            graphics.y = this.lanes[data.lane] - 20;

            graphics.time = parseFloat(data.time);
            graphics.lane = data.lane;
            graphics.hit = false;
            graphics.hold = isHold ? parseFloat(data.hold) : 0;
            graphics.holdProgress = 0;

            this.notes.push(graphics);
        });

        // --- Draw hit zones ---
        this.lanes.forEach((y, i) => {
            const g = this.add.graphics();
            g.lineStyle(4, 0xffff00);
            g.strokeRect(this.hitZoneX - this.hitWindow, y - 25, this.hitWindow * 2, 50);
            this.hitZones.push(g);
        });

        // --- Score Text ---
        this.scoreText = this.add.text(10, 10, "Score: 0", {
            font: "24px Arial",
            fill: "#ffffff"
        });

        // --- Keyboard input ---
        this.input.keyboard.on('keydown', event => {
            const key = event.key.toLowerCase();
            Object.values(this.keyMap).forEach(k => {
                if (key === k) this.keysDown[key] = true;
            });
        });
        this.input.keyboard.on('keyup', event => {
            const key = event.key.toLowerCase();
            Object.values(this.keyMap).forEach(k => {
                if (key === k) this.keysDown[key] = false;
            });
        });
    }

    update(time, delta) {
        const songTime = this.song.seek;

        // --- Update hit zones color based on keys pressed ---
        this.hitZones.forEach((g, i) => {
            g.clear();
            const key = this.keyMap[i];
            const color = this.keysDown[key] ? 0xffff00 : 0xffffff;
            g.lineStyle(4, color);
            g.strokeRect(this.hitZoneX - this.hitWindow, this.lanes[i] - 25, this.hitWindow * 2, 50);
        });

        this.notes.forEach(note => {
            if (!note.hit) {
                note.x = this.hitZoneX + (note.time - songTime) * this.scrollSpeed;

                const keyDown = this.keysDown[this.keyMap[note.lane]];

                if (note.hold > 0) {
                    // --- Hold note logic ---
                    if (Math.abs(note.x - this.hitZoneX) <= this.hitWindow) {
                        if (keyDown) {
                            note.holdProgress += delta / 1000;
                            note.clear();
                            note.fillStyle(0xff4444, 1);
                            const newWidth = Math.max(20, (note.hold - note.holdProgress) * this.scrollSpeed / 20);
                            note.fillRect(0, 0, newWidth, 40);

                            if (note.holdProgress >= note.hold) {
                                note.hit = true;
                                note.destroy();
                                this.score += 1;
                                this.scoreText.setText("Score: " + this.score);
                            }
                        } else if (note.holdProgress > 0) {
                            note.hit = true;
                            note.destroy();
                            console.log('Hold failed!');
                        }
                    } else if (note.x < this.hitZoneX - this.hitWindow - note.hold * this.scrollSpeed) {
                        note.hit = true;
                        note.destroy();
                        console.log('Miss!');
                    }
                } else {
                    // --- Normal note logic ---
                    if (note.x < this.hitZoneX - this.hitWindow) {
                        note.hit = true;
                        note.destroy();
                        console.log('Miss!');
                    } else if (keyDown && Math.abs(note.x - this.hitZoneX) <= this.hitWindow) {
                        note.hit = true;
                        note.destroy();
                        this.score += 1;
                        this.scoreText.setText("Score: " + this.score/1001*100 + "%");
                        this.hitsound = this.sound.add('hitsound');
                        this.hitsound.play();
                        console.log('Hit!');
                    }
                }
            }
        });
    }
}

// ✅ Explicit default export
export default RhythmScene;
