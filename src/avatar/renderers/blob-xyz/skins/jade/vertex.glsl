varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main(){
  vNormal=normalize(normalMatrix*normal);
  vPosition=position;
  vUv=uv;
  vec4 worldPos=modelViewMatrix*vec4(position,1.);
  vWorldNormal=normalize(normalMatrix*normal);
  vViewDir=normalize(-worldPos.xyz);
  gl_Position=projectionMatrix*worldPos;
}
