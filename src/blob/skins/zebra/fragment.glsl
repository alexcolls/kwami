varying vec3 vNormal;
varying vec3 vPosition;
uniform vec3 lightPosition;
uniform vec3 specular_color;
uniform float shininess;

float zebraStripes(float x,float frequency,float width){
  return smoothstep(.5-width*.5,.5+width*.5,mod(x*frequency+.5,1.));
}

void main(){
  vec3 lightDir=normalize(lightPosition-vPosition);
  vec3 viewDir=normalize(-vPosition);
  vec3 reflectDir=reflect(-lightDir,vNormal);
  float spec=pow(max(dot(viewDir,reflectDir),0.),shininess);
  vec3 specular=specular_color*spec;
  float stripeIntensity=zebraStripes(vPosition.x,5.,.1);
  vec3 color=mix(vec3(1.),vec3(0.),stripeIntensity);
  vec3 finalColor=color+specular;
  gl_FragColor=vec4(finalColor,1.);
}

