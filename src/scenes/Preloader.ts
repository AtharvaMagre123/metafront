import Phaser from "phaser";

export default class Preloader extends Phaser.Scene {
  constructor() {
    super("preloader");
  }

  preload() {
    this.load.image("object", "tiles/objects.png");
    this.load.image("floor", "tiles/gota.png");
    this.load.image("wall", "tiles/walls.png");
    this.load.tilemapTiledJSON("office", "tiles/office.json");
    this.load.atlas('faune','character/fauna.png','character/fauna.json')

    this.load.image("laptop", "assets/laptop.png");
    this.load.image("whiteboard", "assets/whiteboard.png");
  }

  create() {
    // Your existing preload code...
    this.scene.start("game");
  }
}
