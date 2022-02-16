//Switch to mediump on mobile devices.
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_amplitude;
uniform float u_fbm_amplitude;
//Random function by Patricio Gonzalez Vivo @patriciogv
//https://thebookofshaders.com/10/
float random (in vec2 st) 
{
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// 2D noise function based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
// Adapted by Patricio Gonzalez Vivo @patriciogv
// https://thebookofshaders.com/11/
float noise (in vec2 st) 
{
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


//Fractal Brownian Motion (fbm) function, also known as fractal noise,
//based on Patricio Gonzalez Vivo @patriciogv
//https://thebookofshaders.com/13/
#define NUM_OCTAVES 6

float fbm ( in vec2 _st) 
{
    float value = 0.0;
    float amplitude = u_fbm_amplitude;

    vec2 shift = vec2(-u_time*u_amplitude*0.2, -u_time*u_amplitude*0.002);
    for (int i = 0; i < NUM_OCTAVES; ++i) 
    {
        value += amplitude * noise(_st);
        _st*=u_amplitude;
       _st += shift;
        amplitude *= 0.5;
    }
    return value;
}
//This is where the magic happens.
//Domain-Warping function based on this wonderful article by Inigo Quilez.
//https://www.iquilezles.org/www/articles/warp/warp.htm
//The idea is very simple: feed a fbm function with a fbm function, 
//which get's fed by a fbm function,
//which get's fed by a fbm functon...
//fbm(st+fmb(st+fmb(st+fmb...)))
//The results are fractals inside fractals, which are nice for clouds, marble our liquids.
float domain_warp( in vec2 st, out vec2 q, out vec2 w, out vec2 e, 
out vec2 r, out vec2 t, out vec2 s, out vec2 d, out vec2 g, out vec2 y) 
//I'm sending out the individual fractal levels, for a lack of a better word, to later use them to apply color.
{
    float a = 3.0+u_amplitude; //amplitude
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

    s = vec2( fbm( st + a*t + vec2(2.0442,099.29) ),
                   fbm( st + a*t + vec2(78.25,10.555)));

    d = vec2( fbm( st + a*s + vec2(55.442,32.2779) ),
                   fbm( st + a*s + vec2(16.250003,0.2988798555)));

    g = vec2( fbm( st + a*d + vec2(8.09,2.79) ),
                   fbm( st + a*d + vec2(1.725005,34.298879855)));

    y = vec2( fbm( st + a*g + vec2(7.99,2.559) ),
                   fbm( st + a*g + vec2(4.75,4.8751)));               
                   
    return fbm( st + 4.0*y );
}

void main() 
{
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;

    vec3 color = vec3(0.0);

    //Initializing the fractal levels
    vec2 q = vec2(0.0);
    vec2 w = vec2(0.0);
    vec2 e = vec2(0.0);
    vec2 r = vec2(0.0);
    vec2 t = vec2(0.0);
    vec2 s = vec2(0.0);
    vec2 d = vec2(0.0);
    vec2 g = vec2(0.0);
    vec2 y = vec2(0.0);

    //Some cosmetic adjustments of the coordinates.
    st.x*=0.8;
    st.x-=u_time*0.05;
    float zoom_out = 0.5;
    zoom_out+=smoothstep(0.0, 2.0, u_time*0.025)*2.0;
    st *= zoom_out;

    float f = domain_warp(st, q, w, e, r, t, s, d, g, y);

    color += f;
    
    //The way I applied the colors is quite random.
    color = mix(vec3(0.1255, 0.1059, 0.102), vec3(0.902, 0.102, 0.5686)*2.0, f);
    color = mix(color, vec3(1.0, 0.8588, 0.4667), dot(q.x, y.y));
    color = mix (color, vec3(0.0, 0.8, 1.0)*0.6, dot(w.y, y.x));
    //color = mix(color, vec3(0.8275, 0.1216, 0.2745)*0.5, smoothstep(1.0, 0.5, y.y));
    color = mix(color, vec3(0.8275, 0.1216, 0.2745)*0.1, smoothstep(1.0, 0., g.y));
    //color = mix(color, vec3(0.0314, 0.0118, 0.1412)*0.5, smoothstep(1.0, .5, y.y));
    color = mix (color, vec3(0.0118, 0.0039, 0.1137), smoothstep(1.0, u_amplitude*0.15, r.x));
    //color = mix (color, vec3(0.0, 0.0, 0.0), smoothstep(1.0, 0.35, s.x));

    gl_FragColor = vec4(color,1.0)*1.5;
   //gl_FragColor = vec4(vec3(f),1.0);
    
}