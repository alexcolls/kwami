varying vec3 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUV;

void main(){
  vUv=position;
  vNormal=normalize(normalMatrix*normal);
  vPosition=position;
  vUV=uv;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}

