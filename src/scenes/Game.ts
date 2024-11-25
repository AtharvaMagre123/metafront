import Phaser from "phaser";

export default class Game extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private faune!: Phaser.Physics.Arcade.Sprite;
  private players: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private playerTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private socket!: WebSocket;
  private playerId!: string;
  private localPlayerText!: Phaser.GameObjects.Text;

  constructor() {
    super("game");
  }

  preload() {
    // Preload handled in Preloader.ts

    this.cursors = this.input.keyboard!.createCursorKeys();
  }

    create() {
      // Load the tilemap
      const map = this.make.tilemap({ key: "office" });

      // Add the tilesets (ensure these match your Tiled tileset names)
      const tables = map.addTilesetImage("office", "object");
      const cc = map.addTilesetImage("office", "object");
      const floorTileset = map.addTilesetImage("floor", "floor");
      const wallsTileset = map.addTilesetImage("walls", "wall");

      // Create layers (ensure these match your Tiled layer names)
      const wallsLayer = map.createLayer("Walls", wallsTileset!);
      const floorLayer = map.createLayer("Floor", floorTileset!);
      const tableLayer = map.createLayer("Tables", tables!);
      const ccLayer = map.createLayer("CC", cc!);

      wallsLayer?.setCollisionByProperty({ collides: true });
      tableLayer?.setCollisionByProperty({ collides: true });
      ccLayer?.setCollisionByProperty({ collides: true });

      // debugDraw(wallsLayer, this);
      // debugDraw(tableLayer, this);

      this.faune = this.physics.add.sprite(250, 300, "faune", "walk-down-3.png");
      this.faune.body?.setSize(this.faune.width * 0.4, this.faune.height * 0.6);

      this.faune.setScale(1.7);

      this.localPlayerText = this.add.text(this.faune.x, this.faune.y - 40, 'You', {
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 4, y: 4 }
      }).setOrigin(0.5);
  

      this.anims.create({
        key: "faune-idle-down",
        frames: [{ key: "faune", frame: "walk-down-3.png" }],
      });

      this.anims.create({
        key: "faune-idle-up",
        frames: [{ key: "faune", frame: "walk-up-3.png" }],
      });

      this.anims.create({
        key: "faune-idle-side",
        frames: [{ key: "faune", frame: "walk-side-3.png" }],
      });

      this.anims.create({
        key: "faune-run-down",
        frames: this.anims.generateFrameNames("faune", {
          start: 1,
          end: 8,
          prefix: "run-down-",
          suffix: ".png",
        }),
        repeat: -1,
        frameRate: 12,
      });

      this.anims.create({
        key: "faune-run-up",
        frames: this.anims.generateFrameNames("faune", {
          start: 1,
          end: 8,
          prefix: "run-up-",
          suffix: ".png",
        }),
        repeat: -1,
        frameRate: 12,
      });

      this.anims.create({
        key: "faune-run-side",
        frames: this.anims.generateFrameNames("faune", {
          start: 1,
          end: 8,
          prefix: "run-side-",
          suffix: ".png",
        }),
        repeat: -1,
        frameRate: 15,
      });
      this.faune.anims.play("faune-idle-down");
      this.physics.add.collider(this.faune, wallsLayer!);
      this.physics.add.collider(this.faune, tableLayer!);
      this.physics.add.collider(this.faune, ccLayer!);

      this.cameras.main.startFollow(this.faune, true);


      //object interaction

      const whiteboard = this.physics.add.sprite(344, 100, "whiteboard").setInteractive();
      whiteboard.setScale(1);  
      this.physics.add.overlap(this.faune, whiteboard, () => {
        const interactText = this.add
          .text(whiteboard.x, whiteboard.y - 50, "Press E to interact", {
            fontSize: "12px",
            color: "green",
            backgroundColor: "#000000",
            padding: { x: 10, y: 5 },
          })
          .setOrigin(0.5);
  
        const interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        const handleInteraction = () => {
          interactText.destroy();
          interactKey.off("down", handleInteraction);
  
          // Render a whiteboard canvas
          const canvas = document.createElement("canvas");
          canvas.width = 400;
          canvas.height = 300;
          canvas.style.position = "absolute";
          canvas.style.top = "50%";
          canvas.style.left = "50%";
          canvas.style.transform = "translate(-50%, -50%)";
          canvas.style.border = "2px solid black";
          canvas.style.backgroundColor = "#ffffff";
          document.body.appendChild(canvas);
  
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#000000";
            ctx.font = "16px Arial";
            ctx.fillText("Sales Task List:", 10, 20);
            
            // Here are the 5 sales tasks written below each other
            const tasks = ["",
              "1. Finalize the sales pitch for product X.",
              "2. Contact potential leads via email.",
              "3. Follow up on last week's calls.",
              "4. Prepare a presentation for tomorrow's meeting.",
              "5. Update the CRM with the latest customer information."
            ];
  
            // Loop through and display each task
            tasks.forEach((task, index) => {
              ctx.fillText(task, 10, 20 + (index * 30)); // 30px space between tasks
            });
          }
  
          let drawing = false;
  
          // Handle drawing
          canvas.addEventListener("mousedown", () => (drawing = true));
          canvas.addEventListener("mouseup", () => (drawing = false));
          canvas.addEventListener("mousemove", (event) => {
            if (drawing && ctx) {
              const rect = canvas.getBoundingClientRect();
              ctx.fillStyle = "#000000";
              ctx.fillRect(event.clientX - rect.left, event.clientY - rect.top, 2, 2);
            }
          });
  
          // Add a "Save" button
          const saveButton = document.createElement("button");
          saveButton.textContent = "Save";
          saveButton.style.position = "absolute";
          saveButton.style.top = "calc(50% + 180px)";
          saveButton.style.left = "50%";
          saveButton.style.transform = "translateX(-50%)";
          document.body.appendChild(saveButton);
  
          const closeCanvas = () => {
            canvas.remove();
            saveButton.remove();
          };
  
          saveButton.addEventListener("click", () => {
            const imageData = canvas.toDataURL();
            closeCanvas();
  
            // Broadcast the canvas content to other players
            if (this.socket.readyState === WebSocket.OPEN) {
              this.socket.send(JSON.stringify({ type: "whiteboardMessage", data: imageData }));
            }
          });
  
          this.input.keyboard!.once("keydown-ESC", closeCanvas);
        };
  
        interactKey.on("down", handleInteraction);
      });

      const laptop = this.physics.add.sprite(410, 475, "laptop").setInteractive();
      laptop.setScale(1);
  
      this.physics.add.overlap(this.faune, laptop, () => {
        const interactText = this.add
          .text(laptop.x, laptop.y - 50, "Press E to interact", {
            fontSize: "12px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 10, y: 5 },
          })
          .setOrigin(0.5);
  
        const interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  
        const handleInteraction = () => {
          interactText.destroy();
          interactKey.off("down", handleInteraction);
  
          // Create a canvas for the laptop interaction
          const canvas = document.createElement("canvas");
          canvas.width = 1400;
          canvas.height = 700;
          canvas.style.position = "absolute";
          canvas.style.top = "50%";
          canvas.style.paddingTop = "30px";
          canvas.style.left = "50%";
          canvas.style.transform = "translate(-50%, -50%)";
          canvas.style.border = "2px solid green";
          canvas.style.backgroundColor = "#000000";
          document.body.appendChild(canvas);
  
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "green";
            ctx.font = "16px Arial";
           
          }
  
          // Sample Sales Tasks (You can modify these dynamically)
          const salesTasks = ["",
            "             Welcome to the Metaverse! 🌐✨","","",

"            Step into a world where the boundaries of reality and imagination blend seamlessly. In the Metaverse, you can explore new dimensions, connect with people across the globe, and ",
"create experiences like never before. Whether you're here for gaming, socializing, or building your own virtual universe, the possibilities are limitless.",

"        🔮 Discover new worlds, 🚀 Create, explore, and collaborate, 🤝Meet people from all over the world.",
"","",

"             Ready to embark on your journey? The Metaverse awaits—your adventure starts now!"
          ];
  
          salesTasks.forEach((task, index) => {
            if (ctx) {
              ctx.fillText(task, 10, 40 + index * 20);
            }
          });
  
          // Handle drawing on the canvas (optional)
          let drawing = false;
          canvas.addEventListener("mousedown", () => (drawing = true));
          canvas.addEventListener("mouseup", () => (drawing = false));
          canvas.addEventListener("mousemove", (event) => {
            if (drawing && ctx) {
              const rect = canvas.getBoundingClientRect();
              ctx.fillStyle = "#000000";
              ctx.fillRect(event.clientX - rect.left, event.clientY - rect.top, 2, 2);
            }
          });
  
          // Add a "Save" button
          const saveButton = document.createElement("button");
          saveButton.textContent = "Press Esc To Exit";
          saveButton.style.position = "absolute";
          saveButton.style.top = "calc(50% + 180px)";
          saveButton.style.left = "50%";
          saveButton.style.transform = "translateX(-50%)";
          saveButton.style.backgroundColor = "grey";
          document.body.appendChild(saveButton);
  
          const closeCanvas = () => {
            canvas.remove();
            saveButton.remove();
          };
  
          saveButton.addEventListener("click", () => {
            const imageData = canvas.toDataURL();
            closeCanvas();
  
            // Broadcast the sales task content to other players
            if (this.socket.readyState === WebSocket.OPEN) {
              this.socket.send(JSON.stringify({ type: "laptopMessage", data: imageData }));
            }
          });
  
          this.input.keyboard!.once("keydown-ESC", closeCanvas);

        };  
        interactKey.on("down", handleInteraction);
      });

  
      //Websocket Logic
      this.socket = new WebSocket("ws://localhost:3000");
      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
      
        switch (message.type) {
            case 'playerId':
                this.playerId = message.id;
                this.localPlayerText.setText(`playerID: ${message.id.slice(0, 8)}`);
                break;
              
            case 'playerJoined':
                if (message.id !== this.playerId) {
                    const newPlayer = this.physics.add.sprite(message.x, message.y, 'faune');
                    newPlayer.setScale(1.7);
                    this.players.set(message.id, newPlayer);

                    const playerText = this.add.text(message.x, message.y - 40, `playerID: ${message.id.slice(0, 8)}`, {
                      fontSize: '12px',
                      color: '#ffffff',
                      backgroundColor: '#000000',
                      padding: { x: 4, y: 4 }
                    }).setOrigin(0.5);
                    this.playerTexts.set(message.id, playerText);
                }
                break;
              
            case 'playerMoved':
                if (message.id !== this.playerId) {
                    const player = this.players.get(message.id);
                    const playerText = this.playerTexts.get(message.id);
                    if (player) {
                        player.setPosition(message.x, message.y);
                        player.anims.play(message.anim, true);
                        player.flipX = message.flipX;

                        if (playerText) {
                          playerText.setPosition(message.x, message.y - 40);
                        }
                    }
                }
                break;
              
            case 'playerLeft':
                const player = this.players.get(message.id);
                const playerText = this.playerTexts.get(message.id);
                if (player) {
                    player.destroy();
                    this.players.delete(message.id);
                }
                if (playerText) {
                  playerText.destroy();
                  this.playerTexts.delete(message.id);
                }
                break;
        }
      }
    }
  update(t: number, dt: number) {
    if (!this.cursors || !this.faune) return;

    const speed = 200;

    if (this.cursors.left?.isDown) {
      this.faune.anims.play("faune-run-side", true);
      this.faune.setVelocity(-speed, 0);
      this.faune.flipX = true;
    } else if (this.cursors.right?.isDown) {
      this.faune.anims.play("faune-run-side", true);
      this.faune.setVelocity(speed, 0);
      this.faune.flipX = false;
    } else if (this.cursors.up?.isDown) {
      this.faune.anims.play("faune-run-up", true);
      this.faune.setVelocity(0, -speed);
    } else if (this.cursors.down?.isDown) {
      this.faune.anims.play("faune-run-down", true);
      this.faune.setVelocity(0, speed);
    } else {
      const parts = this.faune.anims.currentAnim?.key.split("-") || [];
      parts[1] = "idle";
      this.faune.play(parts.join("-"));
      this.faune.setVelocity(0, 0);
    }

      // Update local player text position
      this.localPlayerText.setPosition(this.faune.x, this.faune.y - 40);

    //websocket logic
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
          type: 'move',
          x: this.faune.x,
          y: this.faune.y,
          anim: this.faune.anims.currentAnim ?.key,
          flipX: this.faune.flipX
      }));
  }
  }
}
