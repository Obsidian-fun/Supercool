
const canvas = document.querySelector('#canvas1');
const ctx = canvas.getContext('2d'); // ctx stands for context
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.fillStyle = 'white';
ctx.strokeStyle = 'white';
//ctx.fillStyle = 'white';
//ctx.fillRect(50,50,50,100) // Cordinates: x from cavas, y from canvas, width and height

class Particle {
  constructor(effect){
    this.effect = effect;
    this.radius = 5; // to make sure circles stay in border, (next line)
    this.x = this.radius + Math.random() * (this.effect.width - this.radius * 2);
    this.y = this.radius + Math.random() * (this.effect.height - this.radius * 2);
    this.vx = 1*Math.random() - 0.5; // Velocity in x-direction
    this.vy = 1*Math.random() - 0.5; // Velocity in y-direction
    }
    /* Performancewise, you should not override canvas state over and over again, this is why it is better to use fillStyle
    before the Particle class */
 
  draw(context){ // to draw out particle, arc method only defines path, to render it we need fill method.
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI*2);
      context.fill();
      //context.stroke();
    }
  update() {
    this.x += this.vx;
    this.y -= this.vy;
    if(this.x > ( this.effect.width - this.radius ) || this.x <= this.radius) { this.vx *= -1; }
    if(this.y > ( this.effect.height - this.radius ) || this.y <= this.radius) { this.vy *= -1; }
  }
}

class Effect {
  constructor(canvas, context){
    this.canvas = canvas;
    this.context = context;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.particles = [];
    this.numberOfParticles = 250;
    this.createParticles();
  
    this.mouse = {
      x:0,
      y:0,
      pressed: false,
      radius:150
    }

    window.addEventListener('resize', e=> {
      console.log(e.target.window.innerWidth);
      this.resize(e.target.window.innerWidth, e.target.window.innerHeight);
    })

    window.addEventListener('mousemove', e => {
      this.mouse.x = e.x;
      this.mouse.y = e.y;
      const maxDistance = 100;
      console.log(this.mouse.x, this.mouse.y);
      const G = 9.861;
    });

  }
  createParticles() {
    for(let i=0; i<this.numberOfParticles; i++) {
      this.particles.push(new Particle(this)); // from class Particle line 11.
    }
  }
  handleParticles(context) {
    this.connectParticles(context);
    this.particles.forEach(particle => {
      particle.draw(context);
      particle.update();                                             
    });                                                    //        b  
                                                           //       /||
  }                                                        //   D  / |dy
   connectParticles(context) {                             //     /  ||    distance = D
    const maxDistance = 100;                               //    /___|↓
    for(let a=0; a<this.particles.length; a++) {           //   a<-dx->
       for(let b=a; b<this.particles.length; b++) {
          const dx = this.particles[a].x - this.particles[b].x;
          const dy = this.particles[a].y - this.particles[b].y;
          const distance = Math.hypot(dx, dy); // Pythagorus theorem to find out hypotenuse.
          if ( distance < maxDistance) {
            context.save();
            const opacity = 1 - (distance/maxDistance);
            context.globalAlpha = opacity;
            context.beginPath();
            context.moveTo(this.particles[a].x, this.particles[a].y);
            context.lineTo(this.particles[b].x, this.particles[b].y);
            context.stroke();
            context.restore();
          }
       }
    }
  }
  resize(width, height){
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
    this.context.fillStyle = 'white';
    this.context.strokeStyle = 'white';
  }
}

const effect = new Effect(canvas, ctx); // goes into constructor variable into class Particle on line 12. Canvas is from line 2 to for class Effect on line 13.
//console.log(effect);

function animate() {
  ctx.clearRect(0 , 0, canvas.width, canvas.height);
  effect.handleParticles(ctx);
  requestAnimationFrame(animate);
}
animate();



