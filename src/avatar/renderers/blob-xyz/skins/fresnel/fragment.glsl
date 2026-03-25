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
  vec3 viewDir=normalize(vViewDir);
  vec3 norm=normalize(vWorldNormal);
  vec3 reflectDir=reflect(-lightDir,norm);

  float fresnel=1.-max(dot(norm,viewDir),0.);
  float fresnelPow=pow(fresnel,2.5);

  vec3 coreColor=_color1*.6+_color2*.4;
  vec3 rimColor=_color2*.4+_color3*.6;
  vec3 glowColor=_color3*.5+_color1*.5;

  vec3 _color=mix(coreColor,rimColor,fresnelPow);
  _color+=glowColor*pow(fresnel,4.)*.5;

  float spec=0.;
  if(shininess>0.){
    float adjustedShininess=max(1.,shininess);
    float specIntensity=shininess/200.;
    spec=pow(max(dot(viewDir,reflectDir),0.),adjustedShininess)*specIntensity;
  }
  vec3 specular=specular_color*spec;

  vec3 finalColor=clamp(_color+specular,0.,1.);

  if(lightIntensity>0.){
    float normalizedIntensity=clamp(lightIntensity/2.5,0.,3.);
    float rim=pow(fresnel,2.);
    vec3 emissionColor=finalColor*(.4+rim*.6);
    finalColor=clamp(finalColor+emissionColor*normalizedIntensity,0.,1.);
  }

  float alpha=mix(opacity*.35,opacity,fresnelPow);

  if(useBackgroundTexture){
    vec3 backgroundColor=texture2D(backgroundTexture,vUv).rgb;
    finalColor=backgroundColor;
  }

  gl_FragColor=vec4(finalColor,alpha);
}
