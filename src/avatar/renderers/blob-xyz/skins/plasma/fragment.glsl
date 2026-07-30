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
uniform float uTime;

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

  float t=uTime*.15;

  float p1=sin(vPosition.x*2.5+t*1.3)*cos(vPosition.y*2.8-t*.9)+sin(vPosition.z*2.2+t*1.1);
  float p2=cos(vPosition.y*3.1-t*1.5)*sin(vPosition.z*2.6+t*1.2)+cos(vPosition.x*2.9-t*.8);
  float p3=sin(vPosition.z*2.7+t*1.7)*cos(vPosition.x*3.0-t*1.4)+sin(vPosition.y*2.4+t*1.0);

  float w1=p1*.5+.5;
  float w2=p2*.5+.5;
  float w3=p3*.5+.5;
  float total=w1+w2+w3+.001;
  w1/=total;w2/=total;w3/=total;

  vec3 _color=_color1*w1+_color2*w2+_color3*w3;

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
