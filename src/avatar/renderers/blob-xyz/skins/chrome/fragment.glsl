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
  float radial=length(mcUv-vec2(.5,.5))*1.8;
  float facing=pow(max(norm.z,0.),.2);
  float metal=pow(clamp(facing*(1.-radial*.85),0.,1.),.4);
  vec3 dark=vec3(.015,.015,.02)*_color1;
  vec3 bright=vec3(.98,.99,1.)*_color1;
  vec3 chrome=mix(dark,bright,metal);
  chrome=pow(chrome,vec3(.85));
  vec3 lightDir=normalize(lightPosition-vPosition);
  vec3 reflectDir=reflect(-lightDir,norm);
  float spec=pow(max(dot(viewDir,reflectDir),0.),max(shininess*.35,96.));
  vec3 finalColor=clamp(chrome+specular_color*spec*1.4,0.,1.);
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
