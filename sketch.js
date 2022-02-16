let canvas;
let bgTexture;
let mainShader;
let bgShader;

let amplitude;
let level = 0.4;
let newLevel = 0.5;
let soundFile;

let radius = 1;
let vertexDistortion = 0;
let maxTurbulence = 0.0; 
let colorKick = 0.65;
let unKick = false;

function preload() 
{
  
  mainShader = loadShader("_distortion.vert", "_liquid.frag");
  bgShader = loadShader("_vertex_passthrough.vert", "_bg.frag");

  soundFile = loadSound("saedis' theme.mp3");
  //Vocal samples taken from "Ayn Rand and Slavoj Žižek read "Barbie Girl" by Aqua" by Vocal Synthesis:
  //https://www.youtube.com/watch?v=h56WLqdD-7I&t=24s
}

function setup() 
{
  imageMode(CENTER);
  canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  //turn off depth buffer
  setAttributes('depth', false);
  noStroke();

  //To use the bgShader as a background to draw ontop, I'm creating an additional p5.Renderer object to put the background shader into.
  //Unfortunately, this technique eats lots of performance, which is why I reduce the resolution so much. 
  //And it also suits the look of a oldschool testimage.
  //On some devices, it might look really shitty though.
  bgTexture = createGraphics(width/5, height/5, WEBGL);

  amplitude = new p5.Amplitude(0.99);//The value inside the brackets adds some smoothing.

  soundFile.play();
  frameRate(60);
  getAudioContext().resume();
}

function draw() 
{
  background(0);
  //Assigning the bgShader to the bgTexture render object.
  bgTexture.shader(bgShader);

  //Drawing a rectangle in bgTexture to have pixels for the fragment shader.
  bgTexture.rect(0, 0, width, height);

  //To add extra smoothing, I'm only sampling the sound level every ten frames and interpolate between the new and old value.
  if(frameCount % 10 == 0)
  {
    newLevel = pow(amplitude.getLevel()*10.0, 2.0); 
  }

  if (newLevel != level)
  {
    level = lerp(level, newLevel, 0.0025);
  }


  //Antialiasing
  smooth();
  
  //Preparing the uniforms for the distorion.vert shader. It's a bit archaic, please move along.
  let scaleValue = sin(frameCount*0.004);

  let animationValue = sin(frameCount*0.02);

  let animationMax = cos(frameCount*0.001);
  let animationMin = cos(frameCount*0.0001);

  let animationValueMapped = map(animationValue, -1, 1, 
    map(animationMax, -1, 1, 0.1, 2), 
    map(animationMin, -1, 1, -0.1, -2));

  //Background shader uniforms
  //u_resolution and u_time are glsl built in variables, 
  //so you also run the shaders standalone as long as you adjust the other uniforms.
  bgShader.setUniform('u_resolution', [width, height]);
  bgShader.setUniform('u_time', frameCount * 0.03);     

  //Main vertex shader uniforms
  mainShader.setUniform("u_scale", map(scaleValue, -1, 1, -0.9, 0.7));
  mainShader.setUniform("u_time_vertex", animationValueMapped);
  mainShader.setUniform("u_amplitude", map(level, 0, 3.5, 1, maxTurbulence));
  mainShader.setUniform("u_vertex_amplitude",level*vertexDistortion);
  mainShader.setUniform("u_fbm_amplitude", colorKick);

  //Main fragment shader uniforms
  mainShader.setUniform('u_resolution', [width, height]);
  mainShader.setUniform('u_time', frameCount * 0.07);

  //Turbulence increase in the beginning.
  if(maxTurbulence < 4)
  {
    maxTurbulence+=0.001;
  }
  //Short color glitch near the end.
  else if (millis() > 115000 )
  {
    maxTurbulence = 7;
  }
  else if (millis() > 115010)
  {
    maxTurbulence = 3.0;
  }

  //Adding a splash of blue at the right moment.
  if (millis() > 49000 && colorKick < 0.8 && unKick == false)
  {
    colorKick += 0.001;
  }
  else if(millis() > 57000 && colorKick > 0.65)
  {
    colorKick -= 0.0005;

    unKick = true;
  }

  //switching on the mainShader
  shader(mainShader);

  //Switching to the second part of the animation.
  if (millis() < 105000)
  //if (millis() < 0)
  {
    rect(-width/2, -height/2, width, height); 
  }
  else
  {
     //Drawing the bgTexture as an image.
    image(bgTexture, -width/2.0, -height/2.0, width, height);
    sphere(width/(radius), 100, 100);
    radius+=0.03;
    if (vertexDistortion < 10.0)
    {
      vertexDistortion+=0.01;
    }
  }

  //print(frameRate());
  //print(level);
  //print(millis());

}

//function windowResized() 
//{
//  resizeCanvas(windowWidth, windowHeight);

//}
