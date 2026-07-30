varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main(){
  vNormal=normalize(normalMatrix*normal);
  vPosition=position;
  vUv=uv;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}
