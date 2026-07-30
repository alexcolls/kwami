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
  float deep=length(mcUv-vec2(.45,.42))*1.6;
  float innerGlow=exp(-deep*2.2)*.45;
  vec3 deepCol=_color1*.32;
  vec3 brightCol=_color1*vec3(.85,1.05,.92);
  vec3 stone=mix(deepCol,brightCol,pow(max(norm.z,0.),1.4)*.55+.25);
  stone+=vec3(.15,.35,.22)*innerGlow;
  float fresnel=pow(1.-max(dot(norm,viewDir),0.),2.8);
  stone+=vec3(.5,.75,.65)*fresnel*.35;
  vec3 lightDir=normalize(lightPosition-vPosition);
  vec3 reflectDir=reflect(-lightDir,norm);
  float spec=0.;
  if(shininess>0.){
    float adj=max(1.,shininess*.2);
    spec=pow(max(dot(viewDir,reflectDir),0.),adj)*(shininess/350.);
  }
  vec3 finalColor=clamp(stone+specular_color*spec,0.,1.);
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
