import { Scene, Input, Math as PhaserMath } from 'phaser';

export class Game extends Scene
{
    private keys!:
    {
        left: Phaser.Input.Keyboard.Key,
        right: Phaser.Input.Keyboard.Key,
        jump: Phaser.Input.Keyboard.Key
    }

    private restart!: Phaser.Input.Keyboard.Key;

    private king!: Phaser.GameObjects.Rectangle;
    private kingHealth!: number;
    private kingMaxHealth!: number;
    private healthBarBackground!: Phaser.GameObjects.Rectangle;
    private healthBar!: Phaser.GameObjects.Rectangle;
    private lastHazardDamageTime: number = 0;
    private gameOver: boolean = false;
    private swordHilt!: Phaser.GameObjects.Arc;
    private swordTip!: Phaser.GameObjects.Arc;
    private swordLine!: Phaser.GameObjects.Line;
    private swordLength: number = 100;
    private swordAngle: number = 0;
    private swordAngularVelocity: number = 0;
    private previousMouseX: number = 0;
    private previousMouseY: number = 0;

    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        
    }

    create ()
    {
        console.log('test');
        this.king = this.add.rectangle(200, 500, 40, 50, 0x4169e1)
        this.kingHealth = 100;
        this.kingMaxHealth = 100;
        //sword line hilt and blade


        this.swordHilt = this.add.circle(this.king.x + 30, this.king.y, 6, 0xff0000);
        this.swordTip = this.add.circle(this.king.x + 130, this.king.y, 6, 0xffff00);

        this.swordAngle = 0;
        this.swordLine = this.add.line(
            this.swordHilt.x,
            this.swordHilt.y,
            0, 0,
            this.swordTip.x - this.swordHilt.x,
            this.swordTip.y - this.swordHilt.y,
            0xffffff
        )

        this.swordLine.setOrigin(0, 0);

        const ground = this.add.rectangle(1500,700,3000, 100, 0x387a36)
        const platforms = this.physics.add.staticGroup()
        const platform1 = this.add.rectangle(400, 550, 200, 25, 0x8b5a2b)
        const platform2 = this.add.rectangle(630, 400 , 200, 25, 0x8b5a2b)
        platforms.add(platform1)
        platforms.add(platform2)
        this.physics.add.existing(this.king)
        const body = this.king.body as Phaser.Physics.Arcade.Body;

        body.setMaxVelocity(250, 600);
        body.setDragX(600);

        this.physics.add.existing(ground, true)
        this.physics.add.collider(this.king, ground)
        this.physics.add.collider(this.king, platform1)

        this.physics.add.collider(this.king, platform2, () => {

            // testing platform damage over time
            if (this.time.now - this.lastHazardDamageTime >= 1000) {
                this.kingHealth -= 10;
                this.kingHealth = Math.max(0, this.kingHealth);
                this.healthBar.setSize((this.kingHealth / this.kingMaxHealth) * 200, 25);
                this.lastHazardDamageTime = this.time.now;
            }
        });

        this.keys = {
            //movement keys + jump
            left: this.input.keyboard!.addKey('A'),
            right: this.input.keyboard!.addKey('D'),
            jump: this.input.keyboard!.addKey('W')
        }

        this.restart = this.input.keyboard!.addKey('R');

        //follow main dude
        this.cameras.main.setBounds(0, 0, 3000, 800);
        this.cameras.main.startFollow(this.king, true, 0.1, 0.1);
        // health bar bc
        this.healthBarBackground = this.add.rectangle(30,30,200,25,0x333333);
        this.healthBarBackground.setOrigin(0,0);
        this.healthBarBackground.setScrollFactor(0);
        // health bar
        this.healthBar = this.add.rectangle(30,30,200,25, 0x00ff00);
        this.healthBar.setOrigin(0,0);
        this.healthBar.setScrollFactor(0);

        this.previousMouseX = this.input.activePointer.x;
        this.previousMouseY = this.input.activePointer.y;

    }
    
    update (_time: number, delta: number)
    {

        if (this.gameOver) {
            if (Input.Keyboard.JustDown(this.restart)) {
                this.scene.restart();
                // restart methd
            }

            return;
        }

        if (this.kingHealth <= 0 && !this.gameOver)
        {
            //gameover checking

            this.gameOver = true;
            const body = this.king.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(0, 0);
            body.setAcceleration(0, 0);
            body.setEnable(false);

            this.add.text(512, 350, 'Game Over', { fontSize: '64px', color: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0);
        }

        const body = this.king.body as Phaser.Physics.Arcade.Body;

        if (Input.Keyboard.JustDown(this.keys.jump) && body.blocked.down)
        {
            // jump up
            body.setVelocityY(-450);
        }
        
        if (!this.keys.jump.isDown && body.velocity.y < 0) 
        {
            // early jump release
            body.setGravityY(1000);
        }
        else
        {
            // no gravity for normal realese
            body.setGravityY(0);
        }
        

        if (this.keys.left.isDown)
        {
            body.setAccelerationX(-250);
        }
        else if (this.keys.right.isDown)
        {
            body.setAccelerationX(250);
        }
        else {
            body.setAccelerationX(0);
        }

        // sword stuff below

        
        const pointer = this.input.activePointer;

        const deltaSeconds = Math.max(Math.min(delta / 1000, 0.05), 1 / 1000);
        const mouseDeltaX = pointer.x - this.previousMouseX;
        const mouseDeltaY = pointer.y - this.previousMouseY;
        const mouseSpeed = Math.hypot(mouseDeltaX, mouseDeltaY) / deltaSeconds;

        if (pointer.leftButtonDown()) {
            this.swordHilt.setPosition(this.king.x + 30, this.king.y);
            this.swordAngularVelocity = 0;

            const aimX = pointer.worldX - this.swordHilt.x;
            const aimY = pointer.worldY - this.swordHilt.y;

            if (aimX !== 0 || aimY !== 0) {
                this.swordAngle = Math.atan2(aimY, aimX);
            }
        } else {
            this.swordHilt.setPosition(pointer.worldX, pointer.worldY);

            if (mouseSpeed > 0) {
                const targetAngle = Math.atan2(mouseDeltaY, mouseDeltaX);
                const angleError = PhaserMath.Angle.Wrap(targetAngle - this.swordAngle);
                const speedFactor = PhaserMath.Clamp(mouseSpeed / 500, 0, 1);
                this.swordAngularVelocity += angleError * speedFactor * 24 * deltaSeconds;
            }

            this.swordAngularVelocity *= Math.exp(-4 * deltaSeconds);
            this.swordAngle = PhaserMath.Angle.Wrap(this.swordAngle + this.swordAngularVelocity * deltaSeconds);
        }

        const tipX = this.swordHilt.x + Math.cos(this.swordAngle) * this.swordLength;
        const tipY = this.swordHilt.y + Math.sin(this.swordAngle) * this.swordLength;

        this.swordTip.setPosition(tipX, tipY);
        this.swordLine.setPosition(this.swordHilt.x, this.swordHilt.y);
        this.swordLine.setTo(
            0, 0,
            Math.cos(this.swordAngle) * this.swordLength,
            Math.sin(this.swordAngle) * this.swordLength
        );

        // Save mouse position for the next frame
        this.previousMouseX = pointer.x;
        this.previousMouseY = pointer.y;

    }
}
