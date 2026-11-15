// Procedural Earth: continents, oceans, ice, clouds, city lights and atmosphere, all from 3D noise.
// No texture download: everything is computed on the GPU, so it never shows seams.

// 3D simplex noise by Ian McEwan / Ashima Arts (MIT)
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){float s=0.0;float a=0.5;for(int i=0;i<6;i++){s+=a*snoise(p);p*=2.03;a*=0.5;}return s;}
`

const VERT = /* glsl */ `
varying vec3 vPos; varying vec3 vNormalW; varying vec3 vView;
void main(){
  vPos = normalize(position);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - w.xyz);
  gl_Position = projectionMatrix * viewMatrix * w;
}`

export const earthMaterial = {
  vertexShader: VERT,
  fragmentShader: /* glsl */ `
  uniform vec3 sunDir;
  varying vec3 vPos; varying vec3 vNormalW; varying vec3 vView;
  ${NOISE}
  void main(){
    vec3 p = vPos;
    float h = fbm(p * 1.6) + 0.3 * fbm(p * 5.0 + 3.1);
    float land = smoothstep(0.15, 0.19, h);
    vec3 ocean = mix(vec3(0.005, 0.03, 0.12), vec3(0.02, 0.2, 0.42), smoothstep(-0.45, 0.06, h));
    float dry = smoothstep(0.15, 0.6, fbm(p * 2.6 + 7.0) + (0.3 - abs(p.y)) * 0.5);
    vec3 green = mix(vec3(0.07, 0.2, 0.06), vec3(0.18, 0.3, 0.1), smoothstep(0.08, 0.4, h));
    vec3 desert = vec3(0.55, 0.43, 0.26);
    vec3 ground = mix(green, desert, dry);
    ground = mix(ground, vec3(0.42, 0.38, 0.33), smoothstep(0.45, 0.7, h));
    float ice = smoothstep(0.8, 0.9, abs(p.y) + 0.06 * fbm(p * 9.0));
    vec3 col = mix(ocean, ground, land);
    col = mix(col, vec3(0.9, 0.94, 1.0), ice);

    vec3 n = normalize(vNormalW);
    float d = dot(n, sunDir);
    float day = smoothstep(-0.12, 0.35, d);
    vec3 r = reflect(-sunDir, n);
    float spec = pow(max(dot(r, vView), 0.0), 40.0) * (1.0 - land) * (1.0 - ice) * day;
    float glow = exp(-pow(d * 5.0, 2.0));
    float city = land * (1.0 - ice) * smoothstep(0.55, 0.85, snoise(p * 70.0) * 0.5 + 0.5 + 0.3 * snoise(p * 9.0)) * smoothstep(0.08, -0.2, d);
    vec3 outc = col * (0.04 + 1.25 * day) + vec3(0.9, 0.75, 0.55) * spec * 0.9 + vec3(1.0, 0.45, 0.12) * glow * 0.18 + vec3(1.0, 0.72, 0.35) * city * 1.3;
    gl_FragColor = vec4(outc, 1.0);
  }`,
}

export const cloudMaterial = {
  vertexShader: VERT,
  fragmentShader: /* glsl */ `
  uniform vec3 sunDir; uniform float time;
  varying vec3 vPos; varying vec3 vNormalW; varying vec3 vView;
  ${NOISE}
  void main(){
    vec3 p = vPos;
    float c = fbm(p * 2.4 + vec3(time * 0.006, 0.0, time * 0.003));
    float swirl = fbm(p * 7.0 + c * 1.5);
    float a = smoothstep(0.12, 0.62, c + 0.35 * swirl);
    float d = dot(normalize(vNormalW), sunDir);
    float day = smoothstep(-0.1, 0.4, d);
    vec3 col = mix(vec3(1.0, 0.6, 0.35), vec3(1.0), smoothstep(0.0, 0.3, d)) * (0.03 + 1.1 * day);
    gl_FragColor = vec4(col, a * 0.8);
  }`,
}

export const atmosphereMaterial = {
  vertexShader: /* glsl */ `
  varying vec3 vNormalW; varying vec3 vView;
  void main(){
    vec4 w = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - w.xyz);
    gl_Position = projectionMatrix * viewMatrix * w;
  }`,
  fragmentShader: /* glsl */ `
  uniform vec3 sunDir;
  varying vec3 vNormalW; varying vec3 vView;
  void main(){
    vec3 n = normalize(vNormalW);
    float rim = pow(1.0 - abs(dot(n, vView)), 2.2);
    float d = dot(n, sunDir);
    float lit = smoothstep(-0.35, 0.3, d);
    vec3 col = mix(vec3(1.0, 0.5, 0.15), vec3(0.35, 0.65, 1.0), smoothstep(-0.05, 0.35, d));
    gl_FragColor = vec4(col * rim * lit * 1.6, rim * lit);
  }`,
}
