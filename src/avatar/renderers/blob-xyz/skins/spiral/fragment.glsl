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
  vec3 lightDir=normalize(lightPosition-vPosition);
  vec3 viewDir=normalize(-vPosition);
  vec3 reflectDir=reflect(-lightDir,vNormal);
  float spec=0.;
  if(shininess>0.){
    float adjustedShininess=max(1.,shininess);
    float specIntensity=shininess/200.;
    spec=pow(max(dot(viewDir,reflectDir),0.),adjustedShininess)*specIntensity;
  }
  vec3 specular=specular_color*spec;

  float angle=atan(vPosition.z,vPosition.x);
  float twist=angle+vPosition.y*4.5;
  float t=fract(twist/(2.*3.14159265359)*1.5);

  vec3 _color;
  if(t<1./3.){
    _color=mix(_color1,_color2,smoothstep(0.,1.,t*3.));
  }else if(t<2./3.){
    _color=mix(_color2,_color3,smoothstep(0.,1.,(t-1./3.)*3.));
  }else{
    _color=mix(_color3,_color1,smoothstep(0.,1.,(t-2./3.)*3.));
  }

  vec3 finalColor=clamp(_color+specular,0.,1.);

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
