const DEBUG = false;

class Game{
  constructor(){
    this.canvas = document.getElementById("board");
    this.ctx = this.canvas.getContext("2d");
    this.menu = new Menu(this);

    this.hp_container = document.getElementById('life-points');

    this.asteroidsMinSize = 30;
    this.reset();

    window.onresize = () => {
      this.resize();
    }

    this.inputBuffer = [];
    // input manager
    window.addEventListener('keydown',(event) => {
      if(this.inputBuffer.indexOf(event.key) == -1){
        this.inputBuffer.push(event.key);
        //console.log(this.inputBuffer);
      }

      if(event.key == 'Shift'){
        if(this.running){
          this.stop();
          this.menu.open('Resume');
        } else {
          this.start();
        }
      }
    });

    window.addEventListener('keyup',(event) => {
      if(this.inputBuffer.indexOf(event.key) != -1){
        this.inputBuffer.splice(this.inputBuffer.indexOf(event.key), 1);
        //console.log(this.inputBuffer);
      }
    });

    this.requestId = window.requestAnimationFrame(this.update.bind(this));
    this.running = true;
  }

  endGame(){
    this.player = null;
    this.menu.open();
  }

  stop(){
    if(!this.running && this.requestId == null){
      console.log('Already stopped!')
      return;
    }
    window.cancelAnimationFrame(this.requestId);
    this.requestId = null;
    this.running = false;
    console.log('game stopped!');
  }

  start(){
    if(!this.running && this.requestId == null){
      this.requestId = requestAnimationFrame(this.update.bind(this));
      this.running = true;
      console.log('game started!');
      return;
    }
    console.log('failed to start');
  }

  resize(){
    this.canvas.width = (document.documentElement.clientWidth || document.body.clientWidth);
    this.canvas.height = (document.documentElement.clientHeight || document.body.clientHeight) - 25;
  }

  addAsteroid(){
    let asteroid = new Asteroid(this);
    // controllo che l'asteroide non sia stato creato troppo vicino al giocatore
    while(this.asteroids.length < this.asteroidsNumber){
      asteroid = new Asteroid(this);
      
      if(!this.player || Math.pow(asteroid.shapeObj.centerX - this.player.shapeObj.centerX, 2) + Math.pow(asteroid.shapeObj.centerY - this.player.shapeObj.centerY, 2) > Math.pow(this.safeRadius, 2)){
        this.asteroids.push(asteroid);
      }
    }

    this.updateBiggestAsteroid();
  }
  
  updateBiggestAsteroid(){
    if(this.asteroids.length <= 0){
      return;
    }

    let bigAsteroid = this.asteroids[0];
    for(let i = 1; i < this.asteroids.length; i++){
      if(this.asteroids[i].shapeObj.size > bigAsteroid.shapeObj.size){
        bigAsteroid.biggest = false;
        bigAsteroid = this.asteroids[i];
      }
    }
    bigAsteroid.biggest = true;
  }

  updateLifePoints(points){
    points = points != undefined ? points : this.player.hp;

    // add if needed
    while(points > this.hp_container.children.length){
      let hp = document.createElement('div');
      hp.classList = 'hp';

      this.hp_container.appendChild(hp);
    }
  
    // remove if needed
    while(points < this.hp_container.children.length){
      this.hp_container.lastChild.remove();
    }
  }

  reset(start){
    this.score = 0;
    document.querySelector('#score > .value').textContent = this.score;
    this.safeRadius = 150;

    this.level = 0;
    this.asteroidsNumber = 4;
    this.asteroids = [];

    this.explosions = [];
    this.pickUps = [];
    this.resize();
    
    if(start){
      this.player = new Player(this);

      // draw hp
      this.updateLifePoints();
    } else {
      this.player = null;
      this.updateLifePoints(0);
    }

    this.asteroids = [];
    this.addAsteroid();
    
    if(!this.menu.settings.FPS.value){
      document.getElementById('fps-counter').classList.add('hidden');
    }

    this.oldT = performance.now();
    this.buffer = [];
    this.deltaT = 0;
    this.time = 0;
  }

  increaseScore(points){
    this.score += points;
    document.querySelector('#score > .value').textContent = this.score;
  }
  
  increaseDifficulty(){
    this.level++;
    this.asteroidsNumber = 4+this.level*2;
    this.addAsteroid();
    this.pickUps.push(new PickUp(this));
  }

  update(){
    if(!this.running){
      return;
    }


    this.deltaT++;
    if(this.deltaT >= 60){
      this.deltaT = 0;
      this.time++;
    }


    if(this.menu.settings.FPS.value){
      let time = performance.now();
      let updTime = time - this.oldT;
      this.buffer.push(updTime);
      while(this.buffer.length > 10){
        this.buffer.splice(0, 1);
      }
      this.oldT = time;
      if(this.deltaT%30 == 0){
        // update fps counter
        let fps = 0;
        for(let t of this.buffer){
          fps += t;
        }
        fps /= 10;
        fps = Math.round(1/fps*1000)
        document.getElementById('fps-counter').textContent = fps;


        // update player speed
        let speedOmeter = document.getElementById('speed');
        if(!speedOmeter){
          speedOmeter = document.createElement('div')
          speedOmeter.classList.add('speedOmeter');
          document.body.appendChild(speedOmeter);
        }
        speedOmeter.id = 'speed';

        if(this.player){
          let player = this.player;
          let speedX = player.speedX,
              speedY = player.speedY;
          console.log(player);
          speedOmeter.textContent = speedX.toFixed(2) + "\n" + speedY.toFixed(2);
        }
      }
      document.getElementById('fps-counter').classList.remove('hidden');
    } else {
      document.getElementById('fps-counter').classList.add('hidden');
    }

    if(this.player){
      // pickups
      for(let i = this.pickUps.length-1;i >= 0;i--){
        let pickUp = this.pickUps[i];
        pickUp.update();

        // remove if expired
        if(pickUp.TTL <= 0){
          this.pickUps.splice(i, 1);
        }
        
        // collision with player
        // use size as circle to check intersection
        let distX = pickUp.x-this.player.shapeObj.centerX;
        let distY = pickUp.y-this.player.shapeObj.centerY;
        let distR = pickUp.size/2 + this.player.shapeObj.size/2;
        if(distX*distX + distY*distY < distR*distR){
          this.player.pickUp(pickUp.type);
          this.pickUps.splice(i, 1);
        }
      }
      
      //player update
      this.player.update();
    }

    // asteroids update
    if(this.asteroids.length > 0){
      for(let i = this.asteroids.length-1; i >= 0; i--){
        if(this.asteroids[i])
          this.asteroids[i].update();

          if(!this.running){
            break;
          }
      }
    }

    // explosions update
    for(let i = this.explosions.length - 1; i >= 0; i--){
      this.explosions[i].update();
      if(this.explosions[i].end){
        this.explosions.splice(i, 1);
      }
    }

    
    this.draw();
    this.requestId = requestAnimationFrame(this.update.bind(this));
  }

  draw(){
    //this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for(let pickUp of this.pickUps){
      pickUp.draw(this.ctx);
    }
    
    if(this.player){
      this.player.draw(this.ctx);
    }
    this.asteroids.forEach(a => a.draw(this.ctx));
    this.explosions.forEach(exp => exp.draw(this.ctx));
  }

}

class Menu{
  constructor(game){
    this.game = game;
    this.container = document.getElementById('menu');
    
    // main page
    this.mainPage = document.createElement('div');
    this.start_btn_text = 'Start';
    this.createMainPage();
    // setting submenu
    this.settings_container = document.createElement('div');
    
    this.createSettings();
    
    this.pages = [this.mainPage, this.settings_container];
    this.avoidReset = false;

    this.open();
  }
  createMainPage(){
    this.mainPage.classList.add('menu', 'page');
    this.start_btn = document.createElement('div');
    this.start_btn.id = 'start';
    this.start_btn.classList.add('btn');
    this.start_btn.textContent = this.start_btn_text;
    this.start_btn.onclick = () => {
      if(!this.avoidReset){
        this.game.reset(true);
      } else {
        this.game.start();
      }
      this.close();
    }
    this.mainPage.appendChild(this.start_btn);

    this.setting_btn = document.createElement('div');
    this.setting_btn.id = 'settings',
    this.setting_btn.textContent = 'Settings';
    this.setting_btn.classList.add('btn');
    this.setting_btn.onclick = () => {
      this.goTo(2);
    }
    this.mainPage.appendChild(this.setting_btn);

    this.container.appendChild(this.mainPage);
  }
  createSettings(){
    this.container.appendChild(this.settings_container);
    this.settings_container.classList.add('hidden');
    this.settings_container.classList.add('settings', 'page');

    this.settings = {
      FPS: new Setting(this.game, this, 'FPS', 'checkbox', false),
    };
    
    for(let setting of Object.values(this.settings)){
      this.settings_container.appendChild(setting.elem);
    }

    let back_btn = document.createElement('div');
    back_btn.classList.add('btn', 'back', 'small');
    back_btn.textContent = 'back';
    this.settings_container.appendChild(back_btn);
    back_btn.onclick = () => this.goTo(1);
  }
  goTo(pageNumber){
    if(pageNumber > this.pages.length)
      return;
    for(let i = 0; i < this.pages.length; i++){
      this.pages[i].classList.add('hidden');
    }
    this.pages[pageNumber-1].classList.remove('hidden');
  }
  open(altText){
    if(altText){
      this.start_btn.textContent = altText;
      this.avoidReset = true;
    } else {
      this.start_btn.textContent = this.start_btn_text;
      this.avoidReset = false;
    }
    this.container.classList.remove('hidden');
  }
  close(){
    this.container.classList.add('hidden');
  }
}

class Setting{
  constructor(game, menu, name, valueType, initValue){
    this.game = game;
    this.menu = menu;

    this.name = name;
    this.valueType = valueType;
    this.value = initValue;
    this.elem = this.create();
  }
  create(){
    let elem = document.createElement('input');
    elem.setAttribute('type', this.valueType);
    // visual init value
    switch (this.valueType) {
      case 'checkbox':
        elem.checked = this.value
        break;
    
      default:
        break;
    }
    elem.setAttribute('id', this.name);
    elem.onchange = this.changeState;

    let label = document.createElement('label');
    label.setAttribute('for', this.name);
    label.classList.add('setting', 'small')
    label.textContent = this.name;
    label.appendChild(elem);
    return label;
  }
  changeState(e){
    let _this = game.menu.settings[Object.keys(game.menu.settings).filter(s => s == e.target.id.toUpperCase())[0]];
    switch(_this.valueType){
      case 'checkbox':
        _this.value = !_this.value;
    }
  }
}

class Player{
  constructor(game){
    this.game = game;

    // starting center position
    this.x = this.game.canvas.width/2;
    this.y = this.game.canvas.height/2;
    //this.speed = 0;
    this.speedX = 0;
    this.speedY = 0;
    this.accX = 0;
    this.accY = 0;
    this.baseAcc = 0.05;
    this.maxSpeed = 2;

    // player pointing direction
    this.angle = 0;
    // player angular speed
    this.aSpeed = 0;
    this.friction = 0.003;
    // angular acceleration
    this.aAcc = 0.05;

    this.fireRate = 1; //projectile/sec
    this.maxFireRate = 5;
    this.deltaT = 0;

    this.bullets = [];
    this.lastBullet = 0;
    this.lastMissile = 0;

    // homing missiles
    this.HMissileReady = true;
    this.HMissileCooldown = 10;
    this.HMissileCooldownTime = 0;

    this.hp = 3;
    this.maxHp = 5;
    this.immune = false;
    this.immuneTime = 3;
    this.immuneTimeLeft = 0;
    this.on = true;

    this.shape = [
      {x:this.x-10, y:this.y-10},
      {x:this.x+10, y:this.y},
      {x:this.x-10, y:this.y+10}
    ];

    this.shapeObj = new Shape(this.game, this, this.shape, 'white');

    this.thruster = new Thruster(this.game, this);
  }

  hit(){
    if(this.hp <= 0){
      new SimpleExplosion(this.game, this.shapeObj.centerX, this.shapeObj.centerY, 100);
      this.game.endGame();
      return;
    }
    this.hp--;
    this.immunity();
    this.game.updateLifePoints();
  }

  immunity(time){
    if(time){
      this.immuneTime = time;
    }
    this.immuneTimeLeft = this.immuneTime;
    this.immune = true;
  }

  pickUp(pickup){
    switch(pickup.text){
      case 'speed':
        // increase maxSpeed, acceleration, angular acceleration, max angular speed
        this.maxSpeed = this.maxSpeed*1.1 > 3 ? 3 : this.maxSpeed*1.1;
        this.baseAcc = this.baseAcc*1.1 > 0.1 ? 0.1 : this.baseAcc*1.1;
        this.aAcc = this.aAcc*1.1 > 0.2 ? 0.2 : this.aAcc*1.1;
        this.maxASpeed = this.maxASpeed*1.1 > 0.1 ? 0.1 : this.maxASpeed*1.1;
        break;
      case 'fireRate':
        this.fireRate = (this.fireRate+1)%this.maxFireRate == 0 ? this.maxFireRate : this.fireRate+1;
        break;
      case 'hp':
        this.hp = (this.hp+1)%this.maxHp == 0 ? this.maxHp : this.hp+1;
        this.game.updateLifePoints();
        break;
    }
  }

  update(){
    this.deltaT++;
    if(this.deltaT >= 60){
      this.deltaT = 0;
      if(this.immuneTimeLeft > 0){
        this.immuneTimeLeft--;
      } else if (this.immune){
        this.immune = false;
      }
    }
    // manage inputs
    let inputs = this.game.inputBuffer;
    this.aSpeed = 0;
    this.accX = 0;
    this.accY = 0;
    for(let input of inputs){
      switch(input){
        case 'w':
          // forward
          this.accX = this.baseAcc*Math.cos(this.angle);
          this.accY = this.baseAcc*Math.sin(this.angle);
          this.thruster.activate();
          break;
        case 's':
          // forward
          this.accX = -(this.baseAcc*Math.cos(this.angle))/2;
          this.accY = -(this.baseAcc*Math.sin(this.angle))/2;
          break;
        case 'a':
          // rotate counteclock
          this.aSpeed -= this.aAcc;
          if(this.aSpeed < -this.maxASpeed){
            this.aSpeed = -this.maxASpeed
          }
          break;
        case 'd':
          // rotate clock
          this.aSpeed += this.aAcc;
          if(this.aSpeed > this.maxASpeed){
            this.aSpeed = this.maxASpeed
          }
          break;
        case ' ':
          if(performance.now()-this.lastBullet>600/this.fireRate){
            new Bullet(this.game, this, this.angle)
            this.lastBullet = performance.now();
          }
          break;
        case 'e':
          if(performance.now()-this.lastMissile>600){
            new HomingMissile(this.game, this, this.angle)
            this.lastMissile = performance.now();
          }
          break;
      }
    }
    let sign;
    sign = this.speedX > 0 ? 1 : -1;
    this.speedX += this.accX - sign*this.friction*this.speedX*this.speedX;
    sign = this.speedY > 0 ? 1 : -1;
    this.speedY += this.accY - sign*this.friction*this.speedY*this.speedY;
  
    
    this.angle += this.aSpeed;
    this.shapeObj.update(this.aSpeed, this.speedX, this.speedY);

    // update thruster
    this.thruster.update();


    // update bullets
    // destroy after set time
    for(let i = this.bullets.length - 1; i >= 0; i--){
      let bullet = this.bullets[i];
      bullet.update();
      if(this.bullets[i].TTL <= 0){
        this.bullets.splice(i, 1);
        return;
      }

      for(let j = this.game.asteroids.length-1; j >= 0; j--){
        let ast = this.game.asteroids[j];
        // collision with asteroid
        if(Math.pow(bullet.x-ast.shapeObj.centerX,2)+Math.pow(bullet.y-ast.shapeObj.centerY,2)<Math.pow(ast.shapeObj.size/2,2)){
          this.bullets.splice(i, 1);

          this.game.increaseScore(10);

          let shinkFactor = 0.75;
          if(ast.shapeObj.size*shinkFactor > this.game.asteroidsMinSize){
            // split asteroid when destroyed
            this.game.asteroids.push(new Asteroid(this.game, ast.shapeObj.size*shinkFactor, ast.shapeObj.centerX, ast.shapeObj.centerY));
            this.game.asteroids.push(new Asteroid(this.game, ast.shapeObj.size*shinkFactor, ast.shapeObj.centerX, ast.shapeObj.centerY));
          } else {
            new SimpleExplosion(this.game, ast.shapeObj.centerX,  ast.shapeObj.centerY);
            
            //this.game.asteroidsNumber++;
            //this.game.addAsteroid();
          }
          this.game.asteroids.splice(j, 1);
          this.game.updateBiggestAsteroid();

          // new level
          if(this.game.asteroids.length <= 0){
            this.game.increaseDifficulty();
          }


          return;
        }
      }
    }

    
  }

  draw(ctx){
    // draw smoke (first so it goes under)
    this.thruster.draw(ctx);

    // if player immune blink (faster as time left decrease)
    if(this.immune){
      // half second on, half second off
      let blinkTime = 6 - this.immuneTimeLeft; // state change/second
      if(this.deltaT%(60/blinkTime) == 0){
        this.on = !this.on;
      }
      if(this.on){
        this.shapeObj.draw(ctx);
      }

      // shield
      ctx.strokeStyle = 'lightblue';
      ctx.lineWidth = 3;
      ctx.globalAlpha = (this.immuneTimeLeft+1)/this.immuneTime;
      ctx.beginPath();
      ctx.arc(this.shapeObj.centerX, this.shapeObj.centerY, this.shapeObj.size*1.2, 0, 2*Math.PI);
      ctx.stroke();
      ctx.lineWidth = 2,
      ctx.globalAlpha = 1;

    } else {
      this.shapeObj.draw(ctx);
    }

    if(DEBUG){
      ctx.strokeStyle = 'blue';
      ctx.beginPath();
      ctx.arc(this.shapeObj.centerX, this.shapeObj.centerY, this.game.safeRadius, 0, Math.PI*2);
      ctx.stroke();
    }

    // draw bullet
    for(let bullet of this.bullets){
      bullet.draw(ctx);
    }

    
  }
}

// random ball on ship position that shrinks
class Thruster{
  constructor(game, obj, color, intensity){
    this.game = game;
    this.obj = obj;
    this.color = color;
    this.intensity = intensity == undefined ? 1 : intensity; // how intense is the effect

    this.particles = [];
  }
  activate(){
    this.particles.push(new Smoke(this.game, this.obj, this.color, this.intensity));
  }
  update(){
    for(let i = this.particles.length - 1; i >= 0; i--){
      this.particles[i].update();
      if(this.particles[i].size <= 0){
        this.particles.splice(i, 1);
      }
    }
  }
  draw(ctx){
    for(let particle of this.particles){
      particle.draw(ctx);
    }
  }
}

class Smoke{
  constructor(game, source, color, intensity){
    this.game = game;
    this.source = source;
    this.angle = this.source.angle + Math.random()/10 * (Math.random() > 0.5 ? 1 : -1);
    this.x = source.shapeObj.centerX - 15*Math.cos(this.angle);
    this.y = source.shapeObj.centerY - 15*Math.sin(this.angle);
    this.size = Math.random()*5;
    this.deltaT = 0;
    this.speed = Math.random()*2;
    this.color = color || [255, 0, 0];
    this.intensity = intensity;
  }
  update(){
    this.deltaT++;
    if(this.deltaT >= 20){
      this.deltaT = 0;
      // shrink
      this.size -= (1/this.intensity);
      this.size = this.size - 1/this.intensity < 0 ? 0 : this.size - 1/this.intensity;
    }

    // movement
    this.x += -this.speed*Math.cos(this.angle);
    this.y += -this.speed*Math.sin(this.angle);

    for(let i = 0; i < this.color.length; i++){
      if(this.color[i]<255){
        this.color[i] += 10;
      }
    }
  }
  draw(ctx){
    ctx.fillStyle = 'rgb('+this.color.join()+')';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 2*Math.PI);
    ctx.fill();
  }
}

class Explosion{
  constructor(game, x, y){
    this.game = game;

    this.x = x;
    this.y = y;

    this.game.explosions.push(this);
    this.end = false;
  }
  update(){

  }
  draw(ctx){

  }
}

class SimpleExplosion extends Explosion{
  constructor(game, x, y, n){
    super(game, x, y);
    
    this.n = n || Math.random()*5+5;
    this.particles = [];
    for(let i = 0; i < this.n;i++){
      this.particles.push({
        x: this.x,
        y: this.y,
        speedX: (Math.random()*2+2) * (Math.random() > 0.5 ? 1 : -1),
        speedY: (Math.random()*2+2) * (Math.random() > 0.5 ? 1 : -1),
        color: 'rgb('+Math.random()*255+','+Math.random()*255+','+Math.random()*255+')'
      });
    }
  }
  update(){
    for(let i = this.particles.length - 1; i >= 0; i--){
      let particle = this.particles[i];
      particle.x += particle.speedX;
      particle.y += particle.speedY;


      if(particle.x < 0 || particle.x > this.game.canvas.width || particle.y < 0 || particle.y > this.game.canvas.height){
        this.particles.splice(i, 1);
      }
    }
    if(this.particles.length <= 0){
      this.end = true;
    }

    this.draw(this.game.ctx);
  }
  draw(ctx){
    this.particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI);
      ctx.fillStyle = p.color;
      ctx.closePath();
      ctx.fill();
    })
  }
}

class HomingMissileExplosion extends Explosion{
  constructor(game, x, y){
    super(game, x, y);

    this.radius = 0;
    this.maxRadius = 60;
    this.explosionSpeed = 50;

    this.deltaT = 0;
  }
  update(){
    this.deltaT++;
    if(this.deltaT >= this.explosionSpeed/60){
      this.radius++;
    }

    if(this.radius == this.maxRadius){
      this.end = true;
    }

    // check for collisions
    for(let i = 0; i < this.game.asteroids.length; i++){
      let asteroid = this.game.asteroids[i];

      let distX = asteroid.shapeObj.centerX-this.x;
      let distY = asteroid.shapeObj.centerY-this.y;
      let distR = asteroid.shapeObj.size/2 + this.radius;
      if(distX*distX + distY*distY < distR*distR){
        new SimpleExplosion(this.game, asteroid.shapeObj.centerX,  asteroid.shapeObj.centerY);
        
        this.game.asteroids.splice(i, 1);
        this.game.updateBiggestAsteroid();
        
        // new level
        if(this.game.asteroids.length <= 0){
          this.game.increaseDifficulty();
        }
      }
    }
  }
  draw(ctx){
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.strokeStyle = 'orange';
    ctx.stroke();
  }
}

class Bullet{
  constructor(game, player, angle){
    this.game = game;
    this.player = player;
    this.player.bullets.push(this);

    // spawn in front of ship
    this.angle = angle;
    this.x = player.shapeObj.centerX + 15*Math.cos(this.angle);
    this.y = player.shapeObj.centerY + 15*Math.sin(this.angle);
    this.length = 5;
    this.speed = 10;
    this.TTL = 2;
    this.deltaT = 0;
  }
  update(){
    this.deltaT++;
    if(this.deltaT >= 60){
      this.deltaT = 0;
      this.TTL--;
    }
    this.x += this.speed*Math.cos(this.angle);
    this.y += this.speed*Math.sin(this.angle);
    this.offX = this.length*Math.cos(this.angle);
    this.offY = this.length*Math.sin(this.angle);


    // out of playable area
    if(this.x < 0){
      this.x = this.game.canvas.width;
    }
    if(this.x > this.game.canvas.width){
      this.x = 0;
    }
    if(this.y < 0){
      this.y = this.game.canvas.height;
    }
    if(this.y > this.game.canvas.height){
      this.y = 0;
    }
  }
  draw(ctx){
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x+this.offX, this.y+this.offY);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

class HomingMissile extends Bullet{
  constructor(game, player){
    super(game, player);

    this.target = this.getTarget(); // shape to target

    let points = scaleShape(JSON.parse(JSON.stringify(this.player.shapeObj.shape)), .5)
    this.shapeObj = new Shape(this.game, this, points, 'red', 10);

    this.thruster = new Thruster(this.game, this, [0, 0, 255], 0.2);

    this.speedX = this.player.speedX;
    this.speedY = this.player.speedY;
    this.baseAcc = 0 //0.5;
    this.maxSpeed = 5;
    this.angle = this.player.angle;
    this.maxASpeed = 0.02;
    this.aSpeed = 0;
    this.accX = this.baseAcc*Math.cos(this.angle);
    this.accY = this.baseAcc*Math.sin(this.angle);

    this.TTL = 4; // how long before explosion if no collision
    this.fuel = 3; // how long to sprint forward
    this.igniteBoostAfter = 1; // let it rotate a bit before ignite booster
    this.timeToIgnite = 0;
    this.explosionDist = 30;

    this.deltaT = 0;
  }

  getTarget(){
    let biggest;
    for(let asteroid of this.game.asteroids){
      if(asteroid.biggest){
        biggest = asteroid;
      }
    }
    return biggest;
  }

  explode(){
    this.TTL = 0;
    new HomingMissileExplosion(this.game, this.shapeObj.centerX, this.shapeObj.centerY);
  }

  update(){
    if(this.TTL <= 0){
      return;
    }

    this.deltaT++;
    if(this.deltaT >= 60){
      this.deltaT = 0;
      this.TTL--;
      this.fuel--;

      if(this.TTL <= 0){
        this.explode();
        return;
      }

    }
    // wait before ingnite booster
    this.timeToIgnite++;
    if(this.timeToIgnite/60 >= this.igniteBoostAfter){
      this.baseAcc = 0.3;
    }

    this.aSpeed = 0;
    if(this.target){
      // need to aim for where the object will be
      let timeInFuture = 1;
      let futureTargetX = this.target.shapeObj.centerX + (this.target.shapeObj.obj.speedX*timeInFuture*60);
      let futureTargetY = this.target.shapeObj.centerY + (this.target.shapeObj.obj.speedY*timeInFuture*60);

      //this.targetX = this.target.shapeObj.centerX;
      //this.targetY = this.target.shapeObj.centerY;

      this.targetX = futureTargetX;
      this.targetY = futureTargetY;

      // rotazione verso l'obiettivo
      // calcolo segmento che unisce con l'obiettivo
      let distX = this.targetX-this.shapeObj.centerX;
      let distY = this.targetY-this.shapeObj.centerY;
      //let a = Math.atan2(this.targetY, this.targetX);
      let a = Math.atan2(distY, distX); // angle relative to 0
      let aShift = a - this.angle;  // angle relative to obj angle
      if(aShift  < 0){
        aShift += Math.PI*2;
      } 

      // aggiornamento componenti velocità
      if(this.fuel > 0){

        // rotation
        if(aShift < Math.PI){
          // rotate right
          this.aSpeed = 0.05;
        } else {
          // rotate left
          this.aSpeed = -0.05;
        }

        this.thruster.activate();
        
        this.accX = this.baseAcc*Math.cos(this.angle);
        this.accY = this.baseAcc*Math.sin(this.angle);
        // speed update
        this.speedX += this.accX;
        if(this.speedX > this.maxSpeed){
          this.speedX = this.maxSpeed;
        }
        if(this.speedX < -this.maxSpeed){
          this.speedX = -this.maxSpeed
        }
        this.speedY += this.accY;
        if(this.speedY > this.maxSpeed){
          this.speedY = this.maxSpeed;
        }
        if(this.speedY < -this.maxSpeed){
          this.speedY = -this.maxSpeed
        }
        
        this.angle += this.aSpeed;
        
        // move into fuel check
        //this.angle += this.aSpeed;
        if(this.angle >= Math.PI*2){
          this.angle -= Math.PI*2;
        } else if (this.angle < -Math.PI*2){
          this.angle += Math.PI*2;
        }
      }

      // check for collisions
      for(let i = 0; i < this.game.asteroids.length; i++){
        let asteroid = this.game.asteroids[i];


        let distX = asteroid.shapeObj.centerX-this.shapeObj.centerX;
        let distY = asteroid.shapeObj.centerY-this.shapeObj.centerY;
        let distR = asteroid.shapeObj.size/2 + this.explosionDist;
        if(distX*distX + distY*distY < distR*distR){
          new SimpleExplosion(this.game, asteroid.shapeObj.centerX,  asteroid.shapeObj.centerY);
          
          this.game.asteroids.splice(i, 1);
          this.game.updateBiggestAsteroid();
          
          // new level
          if(this.game.asteroids.length <= 0){
            this.game.increaseDifficulty();
          }

          this.explode();
          return;
        }
      }
    }


    
    this.thruster.update();

    //this.speedX = 0;
    //this.speedY = 0;
    this.shapeObj.update(this.aSpeed, this.speedX, this.speedY);
  }

  draw(ctx){
    if(this.TTL <= 0){
      return;
    }
    this.thruster.draw(ctx);
    this.shapeObj.draw(ctx);

    if(DEBUG){
      // draw aim point
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(this.targetX, this.targetY, 5, 0, Math.PI*2);
      ctx.fill();
    }
  }
}

class Asteroid{
  constructor(game, size, x, y){
    this.game = game;

    this.x = x || Math.random()*this.game.canvas.width;
    this.y = y || Math.random()*this.game.canvas.height;
    if(size && size < this.game.asteroidsMinSize){
      size = this.game.asteroidsMinSize;
    }
    this.size = size|| Math.random()*20+60;
    this.sides = Math.floor(this.size/10)+1;
    this.speedY = (Math.random() > 0.5 ? 1 : -1) * 1/this.size * 25 * (Math.random()+0.5);
    this.speedX = (Math.random() > 0.5 ? 1 : -1) * 1/this.size * 25 * (Math.random()+0.5);
    this.aSpeed = Math.random() * 6 * 0.005;

    this.points = [];
    this.generate();
    this.shapeObj = new Shape(this.game, this, this.points, 'white', this.size);
    this.biggest = false;
  }
  generate(){
    // takes points on a circle
    let angle = 0;
    this.points.push({x: this.x + this.size/2 * Math.cos(angle), y: this.y + this.size/2 * Math.sin(angle)});
    for(let i = 0; i < this.sides-1; i++){
      angle+= (2 * Math.PI / this.sides);
      if(angle > 2 * Math.PI){
        break;
      }
      this.points.push({x: this.points[i].x + this.size/2 * Math.cos(angle), y: this.points[i].y + this.size/2 * Math.sin(angle)});
    }
  }
  update(){
    this.shapeObj.update(this.aSpeed, this.speedX, this.speedY);

    // collision with ship
    if(this.game.player && !this.game.player.immune){
      if(collisionCheckSAT(this.shapeObj, this.game.player.shapeObj)){
        this.game.player.hit();
        //this.game.stop();
        return;
      }
    }
  }
  draw(ctx){
    this.shapeObj.draw(ctx);
  }
}

function scaleShape(points, scale){
  // shape center coords
  let centerX = 0;
  for(let point of points){
    centerX += point.x;
  }
  centerX /= points.length;

  let centerY = 0;
  for(let point of points){
    centerY += point.y;
  }
  centerY /= points.length;

  for(let i = 0; i < points.length; i++){
    let x = points[i].x;
    let y = points[i].y;

    // move reltive to axis origin
    let xc = x - centerX;
    let yc = y - centerY;

    let len = Math.sqrt(xc*xc + yc*yc)

    // angle relative to axis
    let a = Math.atan2(yc, xc);
    a = a < 0 ? a + Math.PI*2 : a;
    // scale vector
    let scx = len*scale*Math.cos(a);
    let scy = len*scale*Math.sin(a);
    // move again relative to its center
    points[i].x = scx + centerX;
    points[i].y = scy + centerY;
  }

  return points;
}

class Shape{
  constructor(game, obj, points, color, size){
    this.game = game;
    this.shape = points;
    this.color = color;
    this.aSpeed = 0;
    this.speedX = 0;
    this.speedY = 0;
    this.size = size || 20;
    this.obj = obj;

    this.centerX = 0;
    for(let point of this.shape){
      this.centerX += point.x;
    }
    this.centerX /= this.shape.length;

    this.centerY = 0;
    for(let point of this.shape){
      this.centerY += point.y;
    }
    this.centerY /= this.shape.length;
  }
  // torna un array di vettori (definiti da due punti) perpendicolari ai lati della figura
  getAxis(){
    let axis = [];
    for(let i = 0; i < this.shape.length; i++){
      // get consecutive points
      let p1 = this.shape[i];
      let p2 = this.shape[i + 1 == this.shape.length ? 0 : i + 1];

      // get edge vector
      let edge = {
        x: p2.x - p1.x,
        y: p2.y - p1.y
      };

      // get normal vector
      let perp = {
        x: edge.x,
        y: -edge.y
      };
      
      let norm = Math.sqrt(perp.x*perp.x + perp.y*perp.y);
      let normal = {
        x: perp.x/norm,
        y: perp.y/norm
      }
      
      axis.push(normal);
    }
    return axis;
  }
  // proietta la figura su un asse definito dal due punti
  project(axis){
    // edge this.shape[i].x + this.shape[i+1==this.shape.length?0:i+1].x
    //let min = axis.x * this.shape[0].x + axis.y * this.shape[0].y;
    let min = axis.x * this.shape[0].x + axis.y * this.shape[0].y;
    let max = min;

    // iterate on shape points
    // get coords in the new axis
    // save min and max accordingly
    for(let i = 1; i < this.shape.length; i++){
      let p = axis.x * this.shape[i].x + axis.y * this.shape[i].y;

      if(p < min){
        min = p;
      } else if(p > max){
        max = p;
      }
    }

    // return the points of the projection on the desired axis
    // assume it's used with calculations on same axis
    let projection = {
      min: min,
      max: max
    };

    return projection;
  }
  // translate 
  move(deltaX, deltaY){
    for(let point of this.shape){
      point.x += deltaX;
      point.y += deltaY;
    }
  }

  update(aSpeed, speedX, speedY){
    this.aSpeed = aSpeed;
    this.speedX = speedX;
    this.speedY = speedY;


    this.rotatedShape = JSON.parse(JSON.stringify(this.shape));
    // center of geometry
    this.centerX = 0;
    for(let point of this.rotatedShape){
      this.centerX += point.x;
    }
    this.centerX /= this.rotatedShape.length;

    this.centerY = 0;
    for(let point of this.rotatedShape){
      this.centerY += point.y;
    }
    this.centerY /= this.rotatedShape.length;
    
    for(let i = 0; i < this.rotatedShape.length; i++){
      let newPoint = this.rotatedShape[i];
      let oldPoint = this.shape[i];

      
      // shift center from origin
      let shiftedOldX = oldPoint.x - this.centerX;
      let shiftedOldY = oldPoint.y - this.centerY;
      
      // rotation
      let shiftedNewX= shiftedOldX*Math.cos(this.aSpeed)-shiftedOldY*Math.sin(this.aSpeed);
      let shiftedNewY = shiftedOldX*Math.sin(this.aSpeed)+shiftedOldY*Math.cos(this.aSpeed);
      
      // shift center to origin
      newPoint.x = shiftedNewX + this.centerX;
      newPoint.y = shiftedNewY + this.centerY;
      
      // movement
      newPoint.x += this.speedX;
      newPoint.y += this.speedY;
    }
    
    // update shape to draw and for next iteration
    this.shape = JSON.parse(JSON.stringify(this.rotatedShape));


    // out of map
    if(this.centerX - this.size > this.game.canvas.width){
      this.move(-this.game.canvas.width - this.size, 0);
    }
    if(this.centerX + this.size < 0){
      this.move(this.game.canvas.width + this.size, 0);
    }

    if(this.centerY - this.size > this.game.canvas.height){
      this.move(0, -this.game.canvas.height - this.size);
    }
    if(this.centerY + this.size < 0){
      this.move(0, this.game.canvas.height + this.size);
    }

  }

  draw(ctx){
    ctx.beginPath();
    ctx.moveTo(this.shape[0].x, this.shape[0].y)
    for(let i = 1; i < this.shape.length; i++){
      ctx.lineTo(this.shape[i].x, this.shape[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = this.color;
    if(this.game.player && this.game.player.HMissileReady){
      // highlight biggest asteroid
      if(this.obj.biggest && DEBUG){
        ctx.strokeStyle = 'red';
      }
    }
    ctx.lineWidth = 2;
    ctx.stroke();

    if(DEBUG){
      // obj center point
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, 2, 0, Math.PI*2);
      ctx.fill();

      // obj bullet collision
      ctx.strokeStyle = 'orange';
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.size/2, 0, Math.PI*2);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

class PickUp{
  constructor(game){
    this.game = game;

    this.size = 15;
    this.x = Math.random()*(this.game.canvas.width-this.size*2)+this.size;
    this.y = Math.random()*(this.game.canvas.height-this.size*2)+this.size;

    this.types = [
      {
        text: 'fireRate',
        simbol: 'F',
        color: 'lime'
      },
      {
        text: 'speed',
        simbol: 'S',
        color: 'lightBlue'
      },
      {
        text: 'hp',
        simbol: 'H',
        color: 'red'
      }
    ]

    this.type = this.types[Math.floor(Math.random()*this.types.length)];
    // increase/decrease on relative type
    //this.increase = Math.random() > 0.5 ? true : false;
    this.deltaT = 0;
    this.TTL_start = Math.round(Math.random()*5+10);
    this.TTL = this.TTL_start;

    this.on = true;
  }
  update(){
    this.deltaT++;
    if(this.deltaT>=60){
      this.deltaT = 0;
      this.TTL--;
    }
  }
  draw(ctx){
    let blinkTime = 6 - this.TTL; // state change/second
    if(this.TTL < 5 && this.deltaT%(60/blinkTime) == 0){
      this.on = !this.on;
    }
    if(this.on){
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.type.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 12, 0, 2*Math.PI);
      ctx.stroke();
  
      ctx.font = '20px Arial bold';
      ctx.fillStyle = this.type.color;
      ctx.textAlign = "center";
      ctx.fillText(this.type.simbol, this.x, this.y+6);
    }
  }
}

let game = new Game();

// check collision with SAT
function collisionCheckSAT(shapeA, shapeB){
  // find axis for test
  let shape1 = shapeA;
  let shape2 = shapeB;
  let axis1 = shape1.getAxis();
  let axis2 = shape2.getAxis();

  //axis 1 loop
  for(let i = 0; i < axis1.length; i++){
    let p1 = shape1.project(axis1[i]);
    let p2 = shape2.project(axis1[i]);

    // check overlap
    if(!(p1.min < p2.max && p2.min < p1.max)){
      return false;
    }
  }

  //axis 1 loop
  for(let i = 0; i < axis2.length; i++){
    let p1 = shape1.project(axis2[i]);
    let p2 = shape2.project(axis2[i]);

    // check overlap
    if(!(p1.min < p2.max && p2.min < p1.max)){
      return false;
    }
  }

  // collision found
  return true;
}