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
  float n=max(dot(normalize(vWorldNormal),lightDir),0.);
  float cell=6.;
  vec2 g=mod(gl_FragCoord.xy,cell)-.5*cell;
  float d=length(g);
  float thresh=mix(cell*.48,cell*.1,n);
  float dotMask=step(d,thresh);
  vec3 finalColor=mix(_color2,_color1,dotMask);
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
