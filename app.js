//graphis variables
let clock  = new THREE.Clock( true );	
let phyKeyMemory = 0; // track key being played
let rotate = false; // track whether one of the graphics keys is rotated 
let rotationArray = [0, 0, 0, 0, 0 , 0, 0]; // track rotation for each key as a safety-net to reset the rotation
let myAxis = new THREE.Vector3(1, 0, 0); // set rotation-axis as world-axis

//audio variables
let shift = 1; //tracks the pitch-shift
let noise = new Tone.Noise("white").toDestination(); //create noise source and connect it to the sound output

noise.fadeIn = 0.5;
noise.fadeOut = 0.5;

let keyDown = false; //track whether a keyboard-key is pressed to increase/decrease the noiseFlowIncrease
let noiseFlowIncrease = 0; //tracks the turbulence used in the marbleShader when a key is pressed

let combFilter = new Tone.LowpassCombFilter({// make a combfilter to let the noise self resonate
    resonance: 0.99,
    dampening: 1500,
});

let vibrato = new Tone.Vibrato({
        frequency: 0,
        depth: 0,    
});

let autoFilter = new Tone.AutoFilter({
    baseFrequency: 3000,
    frequency: 2,
    depth: 0,
    octaves: 8,
    wet: 1, 
}).start();

let chorus = new Tone.Chorus({
    frequency: 4, 
    delayTime: 2.5, 
    depth: 0.5,
    feedback: 0.9,
    wet: 1,
}).start();

let distortion = new Tone.Distortion({
    distortion: 0.4,
    wet: 0,
});

let reverb = new Tone.Reverb({   
    preDelay:0,
    decay: 3,
    wet: 1.0, 
});

let crusher = new Tone.BitCrusher({
    bits: 8,
     wet: 0,
});
    

let limiter = new Tone.Limiter(-3);

//add all the fx to the master bus
Tone.Destination.chain(combFilter, vibrato, autoFilter, chorus, distortion, reverb, crusher,limiter);

//sound functions
function playNote(note){
    note *= shift; //multiplying the frequency changes the octave of the note
    combFilter.set(
    {   
        //the resonance is controlled via the speed of the delay: C3 equals 130.81 m/s, aka 1/130.81. 
        delayTime: 1 / note
    })
    noise.start();
}

function key (keycode, note, phyKey){
  if (event.code == keycode){
    phyKeyMemory = phyKey;
    playNote(note);

    if (noiseFlowIncrease < 0.21){ noiseFlowIncrease+= (0.21 - noise.fadeIn/10)}

    if (rotationArray[phyKey] < 10){
      DKeys[phyKey].rotateOnWorldAxis(myAxis, THREE.Math.degToRad(10));
      rotationArray[phyKey]+= 10;
    }
  }
}

document.addEventListener('keydown', async () => {
    await Tone.start()
    keyDown = true;

    if (event.code == "ShiftLeft"){
        shift += 1;
    }
    if (event.code == "CapsLock" && shift > 1){
        shift -= 1;
    }

    key("KeyQ", 73.42, 0);
    key("KeyW", 82.41, 1);
    key("KeyE", 92.50, 2);
    key("KeyR", 98.00, 3);
    key("KeyT", 110.00, 4);
    key("KeyY", 123.47, 5);
    key("KeyU", 138.59, 6);
    key("KeyI", 146.83, 0);
    key("KeyO", 164.81, 1);
    key("KeyP", 185.00, 2);
    key("BracketLeft", 196.00, 3);
    key("BracketRight", 220.00, 4);
    key("KeyA", 246.94, 5);
    key("KeyS", 277.18, 6);
    key("KeyD", 293.66, 0);
    key("KeyF", 329.63, 1);
    key("KeyG", 369.99, 2);
    key("KeyH", 392.00, 3);
    key("KeyJ", 440.00, 4);
    key("KeyK", 493.88, 5);
    key("KeyL", 554.37, 6);
    key("Semicolon", 587.33, 0);
    key("Quote", 659.25, 1);
    key("Backslash", 739.99, 2);
    key("IntlBackslash", 783.99, 3);
    key("KeyZ", 880.00, 4);
    key("KeyX", 987.77, 5);
    key("KeyC", 1108.73, 6);
    key("KeyV", 1174.66, 0);
    key("KeyB", 1318.51, 1);
    key("KeyN", 1479.98, 2);
    key("KeyM", 1567.98, 3);
    key("Comma", 1760.00, 4);
    key("Period", 1975.53, 5);
    key("Slash", 2217.46, 6);    
})

document.addEventListener('keyup', async () => {
  noise.stop();
  keyDown = false;
  
  for (let i = 0; i < 7; i++){
    if (rotationArray[i] > 9){
      DKeys[i].rotateOnWorldAxis(myAxis, THREE.Math.degToRad(-10));
      rotationArray[i]-= 10;
    }
  }
  rotate = false;
})



// 3d scene setup
let scene = new THREE.Scene();

// CAMERA
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 12);

// RENDERER
let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

// make sure the scene adjusts to the browser window size
window.addEventListener('resize', () => {
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// CONTROLS FOR NAVIGATION
let controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enabled = false;

//shader uniforms
let uniforms = {
    u_resolution: { value: { x: window.innerWidth, y: window.innerHeight } },
    u_time: { value: 0.0 },
    u_noiseflow: {value : 0.0},
    u_resonance: {value : 0.99},
    u_dampening: {value: 3.},
    u_vibrato_frequency : {value : 0},
    u_vibrato_depth : {value : 0},
    u_filter_wet :{value :0.1},
    u_filter_frequency: {value: 2.5},
    u_LFO_frequency: {value: 0},
    u_LFO_depth: {value: 0},
    u_LFO_octaves: {value: 0.5},
    u_crush_wet: {value:0},
    u_crush_bits:{value:0},
    u_reverb_wet:{value:1},
    u_decay:{value: 10},
    u_drive:{value:0},
    u_drive_wet:{value:0},
    u_chorus_wet:{value:0},
    u_chorus_feedback:{value: 0},
    u_chorus_time:{value: 0},
    u_chorus_depth:{value:2.1},
    u_chorus_frequency: {value:1.35},
  }

//simple vertex passthrough shader
let vShader = `
  varying vec2 v_uv;
  void main() {
     v_uv = uv;
     gl_Position = projectionMatrix * modelViewMatrix *    vec4(position, 1.0);
}`

//for a explanation of basic concept behind the fragment shaders, 
//check out this article https://www.iquilezles.org/www/articles/warp/warp.htm
//DISCLAIMER: I reused this algorithm form my final tbag project...
//Check out my tbag submission for a commented version
let marbleShader =`
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_noiseflow;
uniform float u_resonance;
uniform float u_dampening;
uniform float u_vibrato_frequency;
uniform float u_vibrato_depth;
uniform float u_chorus_wet;
uniform float u_crush_wet;
uniform float u_crush_bits;

float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

#define OCTAVES 6
float fbm (in vec2 st) {
    // Initial values
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    vec2 shift = vec2(cos(u_time*u_vibrato_frequency)*(20.0*u_vibrato_depth), 
    u_noiseflow + sin(u_time*u_vibrato_frequency)*(20.0*u_vibrato_depth));
    // Loop of octaves
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st);
        st *= 2.0+(10.0*(1.0-u_resonance));
        st += shift;
        amplitude *= .5;
    }
    return value;
}

float pattern( in vec2 st, out vec2 q, out vec2 r)
{
    q = vec2( fbm( st + vec2(0.0,0.0) ),
                   fbm( st + vec2(5.2,1.3) ) );

    r = vec2( fbm( st + 4.0*q + vec2(1.7,9.2) ),
                   fbm( st + 4.0*q + vec2(8.3,2.8) ) );

    return fbm( st + 4.0*r );
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec2 q = vec2(0);
    vec2 r = vec2(0); 
    st.x *= u_resolution.x/u_resolution.y;

    //st.x *= sin(u_time);

    st += fract(st*u_crush_wet)*u_crush_bits*0.1;

    vec3 color = vec3(0.0);
    color += pattern(st*10.0, q, r);

    color = mix(color, vec3(0.0, u_chorus_wet, u_chorus_wet), r.y);

    gl_FragColor = vec4(color*u_dampening,1.0);
}`

let woodShader =`
// Author @patriciogv - 2015
// http://patriciogonzalezvivo.com


precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_filter_wet;
uniform float u_filter_frequency;
uniform float u_LFO_frequency;
uniform float u_LFO_depth;
uniform float u_LFO_octaves;
uniform float u_chorus_feedback;
uniform float u_crush_wet;
uniform float u_crush_bits;

float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 7

float fbm ( in vec2 _st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(0, u_time*u_filter_wet);
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(_st);
        _st*=1.7 - u_chorus_feedback;
        _st += shift;
        a *= 0.5;
    }
    return v;
}

float pattern( in vec2 st, out vec2 q, out vec2 w, out vec2 e, 
out vec2 r, out vec2 t)
{
    float a = 70.9;
    q = vec2( fbm( st + vec2(0.0,0.0) ),
                   fbm( st + vec2(5.2,1.3) ) );

    w = vec2( fbm( st + 2.0*q + vec2(1.7,9.2) ),
                   fbm( st + a*q + vec2(8.3,2.8) ) );

    e = vec2( fbm( st + 0.5*w + vec2(0.7,12.249)),
                   fbm( st + 0.4*w + vec2(40.9,3.15) ) );

    r = vec2( fbm( st + 7.5989*e - vec2(4.02, 2.29)),
                   fbm( st + a*e + vec2(25.3,1.555) ) );

    t = vec2( fbm( st + a*r + vec2(4.027,2.29) ),
                   fbm( st + a*r + vec2(3.25,1.555)));
                                   
    return fbm( st + .0*t );
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;
    vec3 color = vec3(0.0);
    vec2 q = vec2(0.0);
    vec2 w = vec2(0.0);
    vec2 e = vec2(0.0);
    vec2 r = vec2(0.0);
    vec2 t = vec2(0.0);

   //st.x-=u_time*0.02
    st.y*=u_LFO_octaves;
    st *= 3.5 + u_chorus_feedback*20.0;
   //st.y+=u_time*0.2;

   st += fract(st*u_crush_wet)*u_crush_bits*0.1;

    float f = pattern(st, q, w, e, r, t);

    color += f;

 
    color = mix(vec3(0.1255, 0.1059, 0.102), vec3(0.0, 0.0, 0.0)*2.0, f);
    //color = mix(color, vec3(0.0, 0.0, 0.0), dot(q.x, y.y));
    color = mix (color, vec3(0.4392, 0.2471+u_chorus_feedback/2.0, 0.2078)*1., dot(w.y, t.x));
   // color = mix (color, vec3(0.2196, 0.0431, 1.0)*0.6, dot(w.y, y.x));

    //color = mix(color, vec3(0.0275, 0.0275, 0.0275), smoothstep(0.6, 0., r.x));

    //color = mix (color, vec3(0.9451, 0.5216, 0.2196), smoothstep(1.0, 0.01, t.x));

    //color = mix(color, vec3(0.0275, 0.0275, 0.0275), smoothstep(1.0, bu_chorus_feedack, t.x));

    //color = mix(color, vec3(0.8275, 0.1216, 0.2745)*0.5, smoothstep(1.0, 0.5, y.y));

    //color = mix(color, vec3(0.0275, 0.0275, 0.0235)*0.5, smoothstep(1.0, .5, y.y));
    //color = mix (color, vec3(0.0, 0.0, 0.0), smoothstep(1.0, 0.05, s.x));

    gl_FragColor = vec4(color,1.0)*((1.0+u_filter_frequency)*(1.0+abs(sin(u_time*u_LFO_frequency)*u_LFO_depth)));
}`

let bgShader = `
// Author @patriciogv - 2015
// http://patriciogonzalezvivo.com


precision mediump float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_crush_wet;
uniform float u_crush_bits;
uniform float u_reverb_wet;
uniform float u_decay;
uniform float u_drive;
uniform float u_drive_wet;
uniform float u_chorus_time;
uniform float u_chorus_depth;
uniform float u_chorus_frequency;


float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

#define OCTAVES 7
float fbm (in vec2 st) {
    // Initial values
    float value = .0;
    float amplitude = 0.5 + u_drive_wet;
    float frequency = 0.;
    vec2 shift = vec2(u_drive*1000000.0, -u_time*(u_reverb_wet/2.0));
    //
    // Loop of octaves
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st);
        st *= u_chorus_depth;
        st+=shift;
        amplitude *= .5;
    }
    return value;
}

float pattern( in vec2 st, out vec2 q, out vec2 w, out vec2 e, out vec2 r, out vec2 t)
{
    float a = 0.9 + (u_decay/2.5);
    q = vec2( fbm( st + vec2(0.0,0.0) ),
                   fbm( st + vec2(5.20 ,1.3) ) );

    w = vec2( fbm( st + 2.0*q + vec2(1.701,9.2)),
                   fbm( st + a*q + vec2(8.3003,2.8) ) );

    e = vec2( fbm( st + 0.5*w + vec2(0.7,12.249)),
                   fbm( st + 0.4*w + vec2(40.9,3.15) ) );

    r = vec2( fbm( st + 7.5989*e - vec2(4.02,2.29)),
                   fbm( st + a*e + vec2(25.3,1.555) ) );

    t = vec2( fbm( st + a*r + vec2(4.02,2.29) ),
                   fbm( st + a*r + vec2(3.25,1.555)));


    return fbm( st + 4.0*t );
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;
    vec2 onePixel = vec2(1.0 / u_resolution.x, 1.0 / u_resolution.y); 

    vec3 color = vec3(0.0);
    vec2 q = vec2(0.0);
    vec2 w = vec2(0.0);
    vec2 e = vec2(0.0);
    vec2 r = vec2(0.0);
    vec2 t = vec2(0.0);

    //st.x+=u_time*0.1;

    //st+=u_time*0.0001;

    st.y+= step(u_chorus_frequency, st.x)-step(u_chorus_frequency+0.1, st.x);
    st *= 3.0;
    st.y*=1.;

    st += fract(st*u_crush_wet)*u_crush_bits;

    st.y-=u_time*0.05;

    float f = pattern(st, q, w, e, r, t);

    //st+=100000000.0;

    color += f;

    //color -= vec3(pattern (st-0.5, q, w, e, r, t));
 
    color = mix(vec3(0.1255, 0.1059, 0.102), vec3(0.7059-u_chorus_time/10.0, 0.0941, 0.451+u_chorus_time/20.0)*2.0, f);
    color = mix(color, vec3(1.0, 0.8588, 0.4667), dot(q.x, t.y));
    color = mix (color, vec3(0.0, 0.8, 1.0)*0.6, dot(w.y, t.x));
    color = mix (color, vec3(0.0275, 0.0275, 0.0275), smoothstep(1.0, 0.15, t.y));
    //color = mix (color, vec3(0.0118, 0.0039, 0.1137), smoothstep(1.0, 0.2, r.x));

    gl_FragColor = vec4(color,1.0)*2.3;
}
`;

//create materials
let marbleMaterial = new THREE.ShaderMaterial({
    vertexShader: vShader,
    fragmentShader: marbleShader,
    uniforms
  });

let woodMaterial = new THREE.ShaderMaterial({
    vertexShader: vShader,
    fragmentShader: woodShader,
    uniforms
  });

let bgMaterial = new THREE.ShaderMaterial({
    vertexShader: vShader,
    fragmentShader: bgShader,
    uniforms
});

//create keys
let whiteKeyGeo = new THREE.BoxGeometry(3, 1.5, 15, 32, 32, 32);
let whiteKeyArray = [];

for (let i = 0; i < 7; i++){
    whiteKeyArray[i]= new THREE.Mesh(whiteKeyGeo, marbleMaterial);
    whiteKeyArray[i].position.set(-13.5+(4.5*i), 0, -1);
    scene.add(whiteKeyArray[i]);
};

let blackKeyGeo = new THREE.BoxGeometry(2, 1.5, 13, 32, 32, 32);
let blackKeyArray =[];


for (let i = 0; i < 6; i++){
    if(i == 2){i++}; //skip key between E and F
    blackKeyArray[i]= new THREE.Mesh(blackKeyGeo, woodMaterial);
    blackKeyArray[i].position.set(-11.25+(4.5*i), 1.2, -2.5);
    scene.add(blackKeyArray[i]);
};

//assign playable keys in D major
let DKeys = [whiteKeyArray[1], whiteKeyArray[2], blackKeyArray[3], 
whiteKeyArray[4], whiteKeyArray[5], whiteKeyArray[6], blackKeyArray[0]];

//add background
let quad = new THREE.Mesh( new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight, 1, 1 ), bgMaterial );
    scene.add( quad );

function animate() {
    requestAnimationFrame(animate);

    uniforms.u_noiseflow.value += noiseFlowIncrease; //update the marbleShader turbulence

    uniforms.u_time.value = clock.getElapsedTime();
    if (noiseFlowIncrease > 0 && keyDown == false)
    {
        noiseFlowIncrease-= (0.0035 - noise.fadeOut/1000); //decrease the noiseflow when no note is played
    }
    if(noiseFlowIncrease < 0){ noiseFlowIncrease = 0}
    renderer.render(scene, camera);
}
animate();

let parameters = {};

// GUI
function createGUI() {
    let gui = new dat.GUI({ width: 300 ,hideable: false});

    // default parameter settings
    parameters = 
    {
        Attack: noise.fadeIn,
        Release: noise.fadeOut,

        Resonance: combFilter.get().resonance,
        Dampening: combFilter.get().dampening,

        "Vibrato Frequency": vibrato.get().frequency,
        "Vibrato Depth": vibrato.get().depth,

        "Filter Frequency": autoFilter.get().baseFrequency,
        "LFO Frequency" : autoFilter.get().frequency,
        "LFO Depth": autoFilter.get().depth,
        "LFO Octaves": autoFilter.get().octaves,
        "Filter Dry/Wet" : autoFilter.get().wet,

        "Chorus Frequency": chorus.get().frequency,
        "Chorus Depth" : chorus.get().depth,
        "Chorus Delay Time" : chorus.get().delayTime,
        "Chorus Feedback" : chorus.get().feedback,
        "Chorus Dry/Wet" : chorus.get().wet,

        "Drive": distortion.get().distortion,
        "Distortion Dry/Wet": distortion.get().wet,

        "Predelay": reverb.get().preDelay,
        "Decay": reverb.get().decay,
        "Reverb Dry/Wet": reverb.get().wet,

        "Bitdepth": crusher.get().bits,
        "Bitcrusher Dry/Wet": crusher.get().wet,
    };

    gui.open();

    let noiseFolder = gui.addFolder("Noise");
    noiseFolder.add(parameters, "Attack", 0, 1.5).onChange((val) => {
        noise.fadeIn = val;
    });
    noiseFolder.add(parameters, "Release", 0, 1.5).onChange((val) => {
        noise.fadeOut = val;
    });
    noiseFolder.open();

    let combFilterFolder = gui.addFolder("Comb Filter");
    combFilterFolder.add(parameters, "Resonance", 0, 0.99).onChange((val) => {
        combFilter.set({resonance : val});
        uniforms.u_resonance.value = val;
    });
    combFilterFolder.add(parameters, "Dampening", 1, 2000).onChange((val) => {
        combFilter.set({dampening : val});
        uniforms.u_dampening.value = val/500;
    });
    combFilterFolder.open();

    let vibratoFolder = gui.addFolder("Vibrato");
    vibratoFolder.add(parameters, "Vibrato Frequency", 0, 10).onChange((val) => {
        vibrato.set({frequency : val});
        uniforms.u_vibrato_frequency.value = val;
    });
    vibratoFolder.add(parameters, "Vibrato Depth", 0, 1).onChange((val) => {
        vibrato.set({depth : val});
        uniforms.u_vibrato_depth.value = val;
    });

    let autoFilterFolder = gui.addFolder("Auto Filter");
    autoFilterFolder.add(parameters, "Filter Frequency", 0, 10000).onChange((val) => {
        autoFilter.set({baseFrequency : val});
        uniforms.u_filter_frequency.value = val/2000;
    });
    autoFilterFolder.add(parameters, "LFO Frequency", 0, 10).onChange((val) => {
        autoFilter.set({frequency : val});
        uniforms.u_LFO_frequency.value = val*2.0;
    });
    autoFilterFolder.add(parameters, "LFO Depth", 0, 1).onChange((val) => {
        autoFilter.set({depth : val});
        uniforms.u_LFO_depth.value = val*2.0;
    });
    autoFilterFolder.add(parameters, "LFO Octaves", 0, 10).onChange((val) => {
        autoFilter.set({octaves : val});
        uniforms.u_LFO_octaves.value = 1.0+val/2;
    });
    autoFilterFolder.add(parameters, "Filter Dry/Wet", 0, 1).onChange((val) => {
        autoFilter.set({wet : val});
        uniforms.u_filter_wet.value = val/10;
    });

    let chorusFolder = gui.addFolder("Chorus");
    chorusFolder.add(parameters, "Chorus Frequency", 0, 10).onChange((val) => {
        chorus.set({frequency: val});
        uniforms.u_chorus_frequency.value = -0.1 + val/5;
    });
    chorusFolder.add(parameters, "Chorus Depth", 0, 1).onChange((val) => {
        chorus.set({depth: val});
        uniforms.u_chorus_depth.value = val*2.0+0.5;
    });
    chorusFolder.add(parameters, "Chorus Delay Time", 0, 5).onChange((val) => {
        chorus.set({delayTime: val});
        uniforms.u_chorus_time.value= val;
    });
    chorusFolder.add(parameters, "Chorus Feedback", 0, 0.99).onChange((val) => {
        chorus.set({feedback: val});
        uniforms.u_chorus_feedback.value = val;
    });
    chorusFolder.add(parameters, "Chorus Dry/Wet", 0, 1).onChange((val) => {
        chorus.set({wet: val});
        uniforms.u_chorus_wet.value = val/2;
    });

    let distortionFolder = gui.addFolder("Distortion");
    distortionFolder.add(parameters, "Drive", 0, 1).onChange((val) => {
        distortion.set({distortion: val});
        uniforms.u_drive.value = val;
    });
    distortionFolder.add(parameters, "Distortion Dry/Wet", 0, 1).onChange((val) => {
        distortion.set({wet: val});
        uniforms.u_drive_wet.value = val;
    });

    let reverbFolder = gui.addFolder("Reverb");
    reverbFolder.add(parameters, "Decay", 0, 30).onChange((val) => {
        reverb.set({decay: val});
        uniforms.u_decay.value = val;
    });
    reverbFolder.add(parameters, "Reverb Dry/Wet", 0, 1).onChange((val) => {
        reverb.set({wet: val});
        uniforms.u_reverb_wet.value = val;
    });
    reverbFolder.open();

    let bitFolder = gui.addFolder("Bitcrusher")
    bitFolder.add(parameters, "Bitdepth", 1, 16).onChange((val) => {
        crusher.set({bits: val});
        uniforms.u_crush_bits.value = (16-val);
    });
    bitFolder.add(parameters, "Bitcrusher Dry/Wet", 0, 1).onChange((val) => {
        crusher.set({wet: val});
        uniforms.u_crush_wet.value = val*16;
    });
}
createGUI();
