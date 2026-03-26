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
  vec3 norm=normalize(vWorldNormal);
  vec3 viewDir=normalize(vViewDir);
  vec2 mcu=norm.xy*.5+.5;
  float qu=floor(mcu.x*2.);
  float qv=floor(mcu.y*2.);
  float nz=max(norm.z,0.);
  float band=floor(qu*.5+qv*.5+nz*2.99);
  band=clamp(band,0.,2.);
  vec3 sh=_color1*.28;
  vec3 mid=_color1*.58;
  vec3 hi=_color1;
  vec3 finalColor=band<.5?sh:(band<1.5?mid:hi);
  finalColor=clamp(finalColor,0.,1.);
  if(lightIntensity>0.){
    float normalizedIntensity=clamp(lightIntensity/2.5,0.,3.);
    float rim=pow(1.-max(dot(normalize(vNormal),viewDir),0.),2.);
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
