import RhythmScene from './scenes/test1.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    backgroundColor: '#222',
    scene: [RhythmScene]
};

const game = new Phaser.Game(config);
