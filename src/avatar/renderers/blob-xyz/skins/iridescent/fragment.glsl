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

  float angle=dot(norm,lightDir)*.5+.5;

  float shift=fresnel*3.+angle*2.;

  float w1=.5+.5*cos(shift*6.28318);
  float w2=.5+.5*cos(shift*6.28318+2.094);
  float w3=.5+.5*cos(shift*6.28318+4.189);
  float total=w1+w2+w3+.001;
  w1/=total;w2/=total;w3/=total;

  vec3 _color=_color1*w1+_color2*w2+_color3*w3;

  float edgeShift=pow(fresnel,1.5);
  _color=mix(_color,_color.gbr,edgeShift*.4);

  float spec=0.;
  if(shininess>0.){
    float adjustedShininess=max(1.,shininess);
    float specIntensity=shininess/200.;
    spec=pow(max(dot(viewDir,reflectDir),0.),adjustedShininess)*specIntensity;
  }
  vec3 specular=specular_color*spec*1.3;

  vec3 finalColor=clamp(_color+specular,0.,1.);

  if(lightIntensity>0.){
    float normalizedIntensity=clamp(lightIntensity/2.5,0.,3.);
    float rim=pow(fresnel,2.);
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
