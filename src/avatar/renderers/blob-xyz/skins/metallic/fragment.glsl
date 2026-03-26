varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
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
  vec3 norm=normalize(vNormal);
  vec3 lightDir=normalize(lightPosition-vPosition);
  vec3 viewDir=normalize(-vPosition);
  vec3 halfVec=normalize(lightDir+viewDir);
  float NdotL=max(dot(norm,lightDir),0.);
  float NdotH=max(dot(norm,halfVec),0.);
  float NdotV=max(dot(norm,viewDir),0.);
  float sp=max(1.,shininess*.9);
  float spec=pow(NdotH,sp)*(shininess/90.+.2);
  vec3 specTint=_color1*spec;
  float fr=pow(1.-NdotV,3.2);
  vec3 refl=reflect(-viewDir,norm);
  float g=refl.y*.5+.5;
  vec3 envLo=_color1*.25;
  vec3 envHi=_color1*.95+vec3(.04,.05,.06);
  vec3 envGrad=mix(envLo,envHi,g);
  vec3 finalColor=_color1*NdotL*.18+specTint+envGrad*fr*.55;
  finalColor=clamp(finalColor,0.,1.);
  if(lightIntensity>0.){
    float normalizedIntensity=clamp(lightIntensity/2.5,0.,3.);
    float rim=pow(1.-max(dot(norm,viewDir),0.),2.);
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
