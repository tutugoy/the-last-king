import { Scene, Input } from 'phaser';

export class Game extends Scene
{
    private keys!:
    {
        left: Phaser.Input.Keyboard.Key,
        right: Phaser.Input.Keyboard.Key,
        jump: Phaser.Input.Keyboard.Key
    }

    private king!: Phaser.GameObjects.Rectangle;

    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        
    }

    create ()
    {
        console.log('Game scene started!');
        this.king = this.add.rectangle(200, 500, 40, 50, 0x4169e1)
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
        this.physics.add.collider(this.king, platforms)

        this.keys = {
            left: this.input.keyboard!.addKey('A'),
            right: this.input.keyboard!.addKey('D'),
            jump: this.input.keyboard!.addKey('W')
        }
        this.cameras.main.setBounds(0, 0, 3000, 800);
        this.cameras.main.startFollow(this.king, true, 0.1, 0.1);
    }
    
    update ()
    {
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
    }
}
