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
  vec2 mcUv=norm.xy*.5+.5;
  float ang=atan(mcUv.y-.5,mcUv.x-.5)+norm.z*.8;
  vec3 rainbow=.5+.5*vec3(cos(ang),cos(ang+2.094),cos(ang+4.189));
  vec3 holo=mix(_color1,rainbow,.65);
  float fresnel=pow(1.-max(dot(norm,viewDir),0.),2.2);
  holo+=vec3(.45,.75,1.)*fresnel*.85;
  vec3 finalColor=clamp(holo,0.,1.);
  if(lightIntensity>0.){
    float normalizedIntensity=clamp(lightIntensity/2.5,0.,3.);
    float rim=pow(1.-max(dot(normalize(vNormal),viewDir),0.),2.);
    vec3 emissionColor=finalColor*(.4+rim*.6);
    finalColor=clamp(finalColor+emissionColor*normalizedIntensity,0.,1.);
  }
  float alpha=opacity*mix(.7,1.,fresnel);
  if(useBackgroundTexture){
    vec3 backgroundColor=texture2D(backgroundTexture,vUv).rgb;
    finalColor=backgroundColor;
  }
  gl_FragColor=vec4(finalColor,alpha);
}
