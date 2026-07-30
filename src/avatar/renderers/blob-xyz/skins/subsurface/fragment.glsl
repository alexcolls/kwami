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
  vec3 n=normalize(vWorldNormal);
  vec3 vd=normalize(vViewDir);
  float ndl=dot(n,lightDir);
  float wrap=clamp(ndl*.4+.6,0.,1.);
  float back=clamp(-ndl*.55+.52,0.,1.);
  vec3 warm=vec3(1.,.84,.74);
  vec3 base=_color1*wrap;
  vec3 thru=_color1*warm*back*.7;
  float edge=pow(1.-max(dot(n,vd),0.),2.2);
  vec3 transl=_color1*warm*edge*.45;
  vec3 finalColor=clamp(base+thru+transl,0.,1.);
  if(lightIntensity>0.){
    float normalizedIntensity=clamp(lightIntensity/2.5,0.,3.);
    float rim=pow(1.-max(dot(n,vd),0.),2.);
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
