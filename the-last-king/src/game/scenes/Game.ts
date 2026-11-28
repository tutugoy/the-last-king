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
    private sword!: Phaser.GameObjects.Image;
    private swordHiltMaxDistance: number = 50;
    private swordAngle: number = 0;
    private swordAngularVelocity: number = 0;

    private secondaryMode: boolean = false;
    private secondaryHiltOffsetX: number = 0;
    private secondaryHiltOffsetY: number = 0;
    private tertiaryMode: boolean = false;
    private tertiaryHiltOffsetX: number = 0;
    private tertiaryHiltOffsetY: number = 0;
    private tertiaryPointerAngle: number = 0;
    private tertiaryHandoffUntil: number = 0;
    private lastSecondaryModeTime: number = Number.NEGATIVE_INFINITY;

    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.image('sword', '/assets/characters/king/sword.png');
    }

    create ()
    {
        this.secondaryMode = false;
        this.tertiaryMode = false;
        this.lastSecondaryModeTime = Number.NEGATIVE_INFINITY;
        console.log('test');
        this.king = this.add.rectangle(200, 500, 40, 50, 0x4169e1)
        this.kingHealth = 100;
        this.kingMaxHealth = 100;
        // The sprite's bottom center is its hilt.
        this.sword = this.add.image(this.king.x + 30, this.king.y, 'sword');
        this.sword.setOrigin(0.5, 1);
        this.swordAngle = 0;

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

        this.input.mouse?.disableContextMenu();

    }
    
    update (time: number, delta: number)
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

        const mouseOffsetX = pointer.worldX - this.king.x;
        const mouseOffsetY = pointer.worldY - this.king.y;
        const mouseDistance = Math.hypot(mouseOffsetX, mouseOffsetY);
        const pointerAngle = Math.atan2(mouseOffsetY, mouseOffsetX);
        const leftButtonDown = pointer.leftButtonDown();

        if (pointer.rightButtonDown()) {
            if (!this.tertiaryMode) {
                this.tertiaryMode = true;
                const transitioningFromSecondary = this.secondaryMode
                    || time - this.lastSecondaryModeTime <= 200;
                this.tertiaryHandoffUntil = transitioningFromSecondary ? time + 200 : time;
                this.tertiaryHiltOffsetX = this.sword.x - this.king.x;
                this.tertiaryHiltOffsetY = this.sword.y - this.king.y;
                this.tertiaryPointerAngle = pointerAngle;
                this.swordAngularVelocity = 0;
            }

            this.secondaryMode = false;

            if (time < this.tertiaryHandoffUntil) {
                if (mouseDistance > 0) {
                    this.tertiaryPointerAngle = pointerAngle;
                }
            } else if (mouseDistance > 0) {
                const angleDelta = PhaserMath.Angle.Wrap(
                    pointerAngle - this.tertiaryPointerAngle
                );
                const cos = Math.cos(angleDelta);
                const sin = Math.sin(angleDelta);
                const rotatedOffsetX = this.tertiaryHiltOffsetX * cos
                    - this.tertiaryHiltOffsetY * sin;
                const rotatedOffsetY = this.tertiaryHiltOffsetX * sin
                    + this.tertiaryHiltOffsetY * cos;

                this.tertiaryHiltOffsetX = rotatedOffsetX;
                this.tertiaryHiltOffsetY = rotatedOffsetY;
                this.tertiaryPointerAngle = pointerAngle;
                this.swordAngle = PhaserMath.Angle.Wrap(this.swordAngle + angleDelta);
            }

            this.sword.setPosition(
                this.king.x + this.tertiaryHiltOffsetX,
                this.king.y + this.tertiaryHiltOffsetY
            );
        } else {
            this.tertiaryMode = false;

            if (leftButtonDown) {
                if (!this.secondaryMode) {
                    this.secondaryMode = true;
                    this.swordAngularVelocity = 0;
                    this.secondaryHiltOffsetX = this.sword.x - this.king.x;
                    this.secondaryHiltOffsetY = this.sword.y - this.king.y;
                }

                this.lastSecondaryModeTime = time;
                this.sword.setPosition(
                    this.king.x + this.secondaryHiltOffsetX,
                    this.king.y + this.secondaryHiltOffsetY
                );
            } else {
                this.secondaryMode = false;

                const hiltDistance = Math.min(mouseDistance, this.swordHiltMaxDistance);

                if (mouseDistance > 0) {
                    this.sword.setPosition(
                        this.king.x + (mouseOffsetX / mouseDistance) * hiltDistance,
                        this.king.y + (mouseOffsetY / mouseDistance) * hiltDistance
                    );
                } else {
                    this.sword.setPosition(this.king.x, this.king.y);
                }
            }

            const aimX = pointer.worldX - this.sword.x;
            const aimY = pointer.worldY - this.sword.y;
            const hasAim = this.secondaryMode
                ? aimX !== 0 || aimY !== 0
                : mouseDistance > 0;

            if (hasAim) {
                const targetAngle = this.secondaryMode
                    ? Math.atan2(aimY, aimX)
                    : pointerAngle;
                const angleError = PhaserMath.Angle.Wrap(targetAngle - this.swordAngle);

                this.swordAngularVelocity += (
                    angleError * 175 - this.swordAngularVelocity * 20
                ) * deltaSeconds;

                this.swordAngle = PhaserMath.Angle.Wrap(
                    this.swordAngle + this.swordAngularVelocity * deltaSeconds
                );
            }
        }

        this.sword.setRotation(this.swordAngle + Math.PI / 2);

    }
}
