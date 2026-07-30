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
  float warmGrad=smoothstep(.2,.8,mcUv.x*.45+mcUv.y*.35+norm.z*.2);
  vec3 warm=vec3(1.,.88,.72);
  vec3 cool=vec3(.72,.78,.88);
  vec3 matcapTone=mix(cool,warm,warmGrad);
  vec3 earthy=vec3(.58,.42,.32);
  vec3 base=_color1*matcapTone;
  base=mix(base,base*earthy+vec3(.08,.05,.03),.22);
  float soft=pow(max(norm.z,0.),1.8)*.35+.65;
  vec3 lightDir=normalize(lightPosition-vPosition);
  vec3 reflectDir=reflect(-lightDir,norm);
  float spec=0.;
  if(shininess>0.){
    float s=max(1.,shininess*.08);
    spec=pow(max(dot(viewDir,reflectDir),0.),s)*(shininess/800.);
  }
  vec3 finalColor=clamp(base*soft+specular_color*spec,0.,1.);
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
