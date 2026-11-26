import { Scene, Input } from 'phaser';

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

        this.swordLine = this.add.line(0, 0, 0, 0, 100, 0, 0xffffff);
        this.swordLine.setOrigin(0, 0);

        this.swordHilt = this.add.circle(225, 500, 6, 0xff0000);
        this.swordTip = this.add.circle(325, 500, 6, 0xffff00);

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
            if (this.time.now - this.lastHazardDamageTime >= 1000) {
                this.kingHealth -= 10;
                this.kingHealth = Math.max(0, this.kingHealth);
                this.healthBar.setSize((this.kingHealth / this.kingMaxHealth) * 200, 25);
                this.lastHazardDamageTime = this.time.now;
            }
        });

        this.keys = {
            left: this.input.keyboard!.addKey('A'),
            right: this.input.keyboard!.addKey('D'),
            jump: this.input.keyboard!.addKey('W')
        }

        this.restart = this.input.keyboard!.addKey('R');

        this.cameras.main.setBounds(0, 0, 3000, 800);
        this.cameras.main.startFollow(this.king, true, 0.1, 0.1);

        this.healthBarBackground = this.add.rectangle(30,30,200,25,0x333333);
        this.healthBarBackground.setOrigin(0,0);
        this.healthBarBackground.setScrollFactor(0);

        this.healthBar = this.add.rectangle(30,30,200,25, 0x00ff00);
        this.healthBar.setOrigin(0,0);
        this.healthBar.setScrollFactor(0);
    }
    
    update ()
    {

        if (this.gameOver) {
            if (Input.Keyboard.JustDown(this.restart)) {
                this.scene.restart();
                return;
            }
        }

        if (this.kingHealth <= 0 && !this.gameOver)
        {
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
            body.setVelocityY(-450);
        }
        
        if (!this.keys.jump.isDown && body.velocity.y < 0) 
        {
            body.setGravityY(1000);
        }
        else
        {
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

        const pointer = this.input.activePointer;

        const hiltX = pointer.worldX;
        const hiltY = pointer.worldY;

        const tipX = hiltX + 100;
        const tipY = hiltY;

        this.swordHilt.setPosition(hiltX, hiltY);
        this.swordTip.setPosition(tipX, tipY);

    this.swordLine.setPosition(hiltX, hiltY);
    this.swordLine.setTo(0, 0, tipX - hiltX, tipY - hiltY);



    }
}
