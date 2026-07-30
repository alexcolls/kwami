varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
uniform vec3 _color1;
uniform vec3 _color2;
uniform vec3 _color3;
uniform vec3 lightPosition;
uniform vec3 specular_color;
uniform float shininess;
uniform float opacity;
uniform sampler2D backgroundTexture;
uniform bool useBackgroundTexture;
uniform float lightIntensity;

void main(){
  vec3 lightDir=normalize(lightPosition-vPosition);
  float nd=max(dot(normalize(vWorldNormal),lightDir),0.);
  float t=clamp(nd*4.,0.,3.999);
  float k0=floor(t);
  float k1=min(k0+1.,3.);
  float w=smoothstep(0.,.2,fract(t));
  vec3 b0=_color1*.3;
  vec3 b1=_color2;
  vec3 b2=mix(_color2,_color1,.6);
  vec3 b3=_color1;
  vec3 c0=mix(mix(mix(b0,b1,step(.5,k0)),b2,step(1.5,k0)),b3,step(2.5,k0));
  vec3 c1=mix(mix(mix(b0,b1,step(.5,k1)),b2,step(1.5,k1)),b3,step(2.5,k1));
  vec3 finalColor=mix(c0,c1,w);
  if(lightIntensity>0.){
    float normalizedIntensity=clamp(lightIntensity/2.5,0.,3.);
    float rim=pow(1.-max(dot(normalize(vWorldNormal),vViewDir),0.),2.);
    vec3 emissionColor=finalColor*(.4+rim*.6);
    finalColor=clamp(finalColor+emissionColor*normalizedIntensity,0.,1.);
  }
  float alpha=opacity;
  if(useBackgroundTexture){
    vec3 backgroundColor=texture2D(backgroundTexture,vUv).rgb;
    finalColor=backgroundColor;
  }
  gl_FragColor=vec4(finalColor,alpha);
}
