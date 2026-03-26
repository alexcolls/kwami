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
  float sh=max(1.,shininess*2.);
  float spec=pow(NdotH,sh)*(shininess/120.+.15);
  vec3 diff=_color1*NdotL+_color1*.08;
  vec3 finalColor=clamp(diff+specular_color*spec,0.,1.);
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
