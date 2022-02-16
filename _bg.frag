//This is a collection of some of the random shaders I created while learning glsl for the main liquid fragment shader.
//Most of these were exercises from https://thebookofshaders.com/. 
//Some of these are not written well at all, but together they create a nice test image.
//To read through all of this would be very confusing and I didn't bother to comment it properly.
//If you're interested in one effect in particular, you can ask me about it and I'll send you the standalone shader and explain it.


precision lowp float;

#define PI 3.14159265359

#define TWO_PI 6.28318530718

uniform vec2 u_resolution;
uniform float u_time;

float plot(vec2 st, float pct)
{
  return  smoothstep( pct-0.5, pct, st.y) -
          smoothstep( pct, pct+0.5, st.y);
}

float kynd03( float height, float x, float power)
{
    return height + pow(abs(sin(PI*x)), power);
}

vec2 brickTile(vec2 _st, float _zoom)
{
    vec2 initial_st = _st; 
    _st *= _zoom;
    
    float switcher = step(1.0, mod(u_time, 2.0));
    
	if (switcher == 1.0)
    {
        _st.x += step(1., 2.) *u_time;
        _st.x += step(1., mod(_st.y,2.0)) * -u_time*2.0;
    }
    else
	{
    	_st.y += step(1., 2.) *u_time;
    	_st.y += step(1., mod(_st.x,2.0)) * -u_time*2.0;
    }
    

    return fract(_st);
}

vec3 rgb2hsb( in vec3 c )
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz),
                 vec4(c.gb, K.xy),
                 step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r),
                 vec4(c.r, p.yzx),
                 step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)),
                d / (q.x + e),
                q.x);
}

vec3 hsb2rgb( in vec3 c )
{
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0,
                     0.0,
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix( vec3(1.0), rgb, c.y);
}

float smooth_circle (vec2 st, float size)
{
    return smoothstep(size, size-0.2, distance(st,vec2(0.5)));
}   

float random (vec2 st) 
{
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123+u_time);
}

void main() 
{
    vec2 st = gl_FragCoord.xy/u_resolution.xy;

    st*= 250.0; 

    vec3 color = vec3(0.0, 0.0, 0.0);

    if (st.y > 0.0 && st.y < 10.0)
    {
        if (st.x > 10.0)
        {
            st*=5.0;
        }
        else
        {
            st*=0.25;
        }
        vec2 ipos = floor(st);
        color = vec3(random(ipos));
        color.x = step(abs(cos(u_time)*0.1), color.x);
        color.y = step(.1+abs(sin(u_time))*0.1, color.y);
        color.z = 1.0;

    }

    else if ( st.y > 10.0 && st.y < 20.0)
    {
       st.x += u_time*5.0;
        st.x *=5.0;
        st.y *= 0.0;

        vec2 ipos = floor(st);
        color = vec3(random( ipos ));

    }

    else if (st.y > 20.0 && st.y < 22.0)
    {
        st.x -= u_time*20.0;
        st.x *=5.0;
        st.y *= 0.0;

        vec2 ipos = floor(st);
        color = vec3(random( ipos ));
    }
    
    else if(st.y > 22.0 && st.y < 70.0 && st.x < 20.0)
    {
        st *= 0.09;
        vec2 ipos = floor(st);
        vec2 fpos = fract(st);
        color = vec3(random(pow(ipos+5.0, fpos-5.)));
    }

    else if (st.y > 70.0 && st.x > 80.0)
    {
        st*=0.01;
        st-=0.5;

        for( float i = 0.0; i < 1.0; i+=0.1)
        {
            float pct = 0.0;
            pct += smooth_circle(st, fract(u_time/10.0+i));
            vec3 color1 = vec3(fract(pct*5.0));
            vec3 color2 = color1* rgb2hsb(vec3(0.0+i, 1.0, 1.0));
            color = rgb2hsb((random(vec2(st.x*0.000001)))*color +  color2)+random(st)*0.2;
            
        }
    }

    else if(st.y > 22.0 && st.y < 72.0 && st.x > 80.0)
    {
        st = brickTile(st,1.5);
        float pct = smooth_circle(st, 0.5);

    color = vec3(pct);
    }

    else if(st.y > 70.0 && st.x < 80.0)
    {
        //Water Color shader by Lewis Lepton
        //https://github.com/lewislepton/shadertutorialseries/blob/master/015_waterColor02/015_waterColor02.frag
        st/=5.0;
        float len;

        for (float i = 0.0; i < 12.0; i++)
        {
            len = length(vec2(st.x, st.y));

            st.x = st.x - 0.5*cos(st.y + sin(len*0.1)) + (u_time / 10.0);
            st.y = st.y + sin(st.x + 0.5*cos(len*0.1)) + (u_time / 10000.0);

            color = random(st)+vec3(cos(len*4.05), cos(len * 1.), cos(len * 2.2));
        }
    }

    else if(st.y > 20.0 && st.y < 70.0 && st.x < 40.0)
    {
        st*= 0.05;
        st.y += 2.0;
        
    float y01 = kynd03(-0.0, st.x, 0.2);
    float y02 = kynd03(-0.5, st.x, 0.2);
    float y03 = kynd03(-1.0, st.x, 0.2);
    float y04 = kynd03(-1.5, st.x, 0.2);
    float y05 = kynd03(-2.0, st.x, 0.2);
    float y06 = kynd03(-2.5, st.x, 0.2);
    float y07 = kynd03(-3.0, st.x, 0.2);
    float y08 = kynd03(-3.5, st.x, 0.2);

    st-=fract(u_time*0.5)*8.0;
    float pct = plot(st,y01);
    float pct02 = plot(st, y02);
    float pct03 = plot(st, y03);
    float pct04 = plot(st, y04);
    float pct05 = plot(st, y05);
    float pct06 = plot(st, y06);
    float pct07 = plot(st, y07);
 
    color = random( st )*0.5+(1.0-pct)*color+pct*vec3(1.0, 0.0157, 0.0157)+pct02*vec3(1.0, 0.5686, 0.0)+pct03*vec3(1.0, 0.9333, 0.0)+pct04*vec3(0.1686, 1.0, 0.0)
    +pct05*vec3(0.0, 0.4667, 1.0)+pct06*vec3(0.5176, 0.0, 1.0)+pct07*vec3(0.9686, 0.0, 1.0);
    }

    else if(st.y > 65.0)
    {
        st *= 0.0005;
        st.y+= u_time*0.00005;
        vec2 ipos = floor(st);
        vec2 fpos = fract(st);
        color = vec3(random(pow(ipos+5.0, fpos-5.)));
    }

    else if(st.y > 22.0 && st.y < 70.0 && st.x < 70.0)
    {  
        st*=2.0; 
       vec2 ipos = floor(st);
       color = vec3(random( ipos ));
    }

    else if (st.y > 40.0 && st.y < 70.0  && st.x > 70.0)
    { 
        st.x*=20.0;
        st.y += fract(u_time*0.001)*20000.0;
        vec2 ipos = floor(st);
        color = vec3(random( ipos ))*vec3(0.5, 0.9, 2.0);

    }
    else if(st.y > 22.0 && st.y < 40.0 && st.x > 70.0)
    {
        
        st.x-=71.5 + cos(u_time)*3.0;
        st.y-=27.5 + sin(u_time)*5.0;
        st/=10.0;
        vec2 toCenter = vec2(0.4)-st;
        float angle = atan(toCenter.y,toCenter.x)+u_time*5.0;
        float radius = length(toCenter)*2.0;

        color = random(st)*0.5+hsb2rgb(vec3((angle/TWO_PI),radius,1.0));
    }

    gl_FragColor = vec4(color,1.0);
}