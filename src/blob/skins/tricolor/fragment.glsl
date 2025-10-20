varying vec3 vNormal;
varying vec3 vPosition;
uniform vec3 _color1;
uniform vec3 _color2;
uniform vec3 _color3;
uniform vec3 lightPosition;
uniform vec3 specular_color;
uniform float shininess;

void main(){
  vec3 lightDir=normalize(lightPosition-vPosition);
  vec3 viewDir=normalize(-vPosition);
  vec3 reflectDir=reflect(-lightDir,vNormal);
  float spec=pow(max(dot(viewDir,reflectDir),0.),shininess);
  vec3 specular=specular_color*spec;
  float angle=atan(vPosition.y,vPosition.x);
  float hue=angle/(2.*3.14159265359)+.5;// Normalize the angle to [0, 1]
  vec3 _color;
  if(hue<1./3.){
    _color=mix(_color1,_color2,3.*hue);
  }else if(hue<2./3.){
    _color=mix(_color2,_color3,3.*(hue-1./3.));
  }else{
    _color=mix(_color3,_color1,3.*(hue-2./3.));
  }
  gl_FragColor=vec4(_color+specular,1.);
}

