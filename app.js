(() => {
  const canvas = document.querySelector('.cloud-canvas');
  const indicator = document.querySelector('#current-scene');
  const intro = document.querySelector('.intro');
  const photoScenes = [...document.querySelectorAll('.photograph')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gl, program, buffer, frame = 0, running = false, lastTime = 0, scrollProgress = 0;

  const vertex = `attribute vec2 position; varying vec2 uv; void main(){ uv=position*.5+.5; gl_Position=vec4(position,0.,1.); }`;
  const fragment = `precision highp float; varying vec2 uv; uniform vec2 resolution; uniform float time; uniform float progress;
    float h(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
    float n(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float fbm(vec3 p){float v=0.,a=.52;for(int i=0;i<4;i++){v+=a*n(p);p*=2.03;a*=.49;}return v;}
    void main(){vec2 q=(gl_FragCoord.xy-.5*resolution)/resolution.y;float advance=progress*2.25;vec3 ro=vec3(0.,0.,-advance);vec3 rd=normalize(vec3(q*1.12,1.));vec3 col=mix(vec3(.27,.39,.48),vec3(.52,.64,.70),smoothstep(-.45,.55,q.y));float trans=1.;
      for(int i=0;i<50;i++){float t=.12+float(i)*.115;vec3 p=ro+rd*t;p.xy*=1.15+max(p.z,0.)*.10;p.x+=time*.006;p.z+=time*.045;float low=fbm(p*1.35+vec3(0.,0.,.3));float shape=fbm(p*3.7+vec3(.4,0.,0.));float density=smoothstep(.39,.59,low*.72+shape*.38-.10);density*=smoothstep(-1.25,-.12,p.y)*(1.-smoothstep(.72,1.65,p.y));float a=density*.15;float light=clamp(.48+low*.56-p.y*.10,0.,1.);vec3 cloud=mix(vec3(.30,.40,.47),vec3(.94,.96,.97),light);col+=trans*a*cloud;trans*=1.-a;}
      col=mix(col,vec3(.66,.73,.77),.06+smoothstep(.2,1.,q.y)*.035);gl_FragColor=vec4(col,1.);}`;

  function shader(type, source) { const s=gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s); if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(s));return null;}return s; }
  function initClouds() {
    if(reducedMotion || !canvas) return;
    const sectionTwo=document.querySelector('#scene-2');if(sectionTwo)sectionTwo.style.removeProperty('--cloud-backdrop');
    canvas.style.display='block';
    gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
    if(!gl)return;
    if(gl.isContextLost()){const ext=gl.getExtension('WEBGL_lose_context');if(ext)ext.restoreContext();return;}
    const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs)return;
    program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){console.warn(gl.getProgramInfoLog(program));return;}
    buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    gl.useProgram(program);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    resize();running=true;frame=requestAnimationFrame(render);
  }
  function resize(){if(!gl||!running)return;const dpr=Math.min(devicePixelRatio||1,innerWidth<700?1:1.35);const w=Math.round(canvas.clientWidth*dpr),hgt=Math.round(canvas.clientHeight*dpr);if(canvas.width!==w||canvas.height!==hgt){canvas.width=w;canvas.height=hgt;gl.viewport(0,0,w,hgt);}}
  function render(now){if(!running)return;if(now-lastTime>30){lastTime=now;gl.useProgram(program);gl.uniform2f(gl.getUniformLocation(program,'resolution'),canvas.width,canvas.height);gl.uniform1f(gl.getUniformLocation(program,'time'),now*.001);gl.uniform1f(gl.getUniformLocation(program,'progress'),scrollProgress);gl.drawArrays(gl.TRIANGLES,0,6);}frame=requestAnimationFrame(render);}
  function captureCloudBackdrop(){if(!gl||!program||!buffer||gl.isContextLost()||!gl.getProgramParameter(program,gl.LINK_STATUS))return;gl.useProgram(program);gl.uniform2f(gl.getUniformLocation(program,'resolution'),canvas.width,canvas.height);gl.uniform1f(gl.getUniformLocation(program,'time'),performance.now()*.001);gl.uniform1f(gl.getUniformLocation(program,'progress'),1);gl.drawArrays(gl.TRIANGLES,0,6);const destination=document.querySelector('#scene-2');if(destination)destination.style.setProperty('--cloud-backdrop',`url("${canvas.toDataURL('image/png')}")`);}
  function release(){if(running){running=false;cancelAnimationFrame(frame);}if(gl&&!gl.isContextLost()){captureCloudBackdrop();const ext=gl.getExtension('WEBGL_lose_context');if(ext)ext.loseContext();}canvas.style.display='none';gl=null;}
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();running=false;cancelAnimationFrame(frame);});
  canvas.addEventListener('webglcontextrestored',()=>{const bounds=intro.getBoundingClientRect();if(bounds.bottom>0&&bounds.top<innerHeight)initClouds();});
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.target===intro){if(entry.isIntersecting){if(!running)initClouds();}else if(entry.boundingClientRect.bottom<=0){release();}}else if(entry.isIntersecting){entry.target.classList.add('is-settled');const n=Number(entry.target.dataset.scene);indicator.textContent=String(n).padStart(2,'0');}}},{threshold:.58});
  observer.observe(intro);photoScenes.forEach(s=>{observer.observe(s);const image=s.querySelector('.scene-image'),placeholder=s.querySelector('.image-placeholder');if(!image)return;if(image.complete&&image.naturalWidth){if(placeholder)placeholder.classList.add('is-hidden');}else image.addEventListener('load',()=>{if(placeholder)placeholder.classList.add('is-hidden');},{once:true});image.addEventListener('error',()=>{image.style.display='none';},{once:true});});
  const venueScene=document.querySelector('#scene-7');if(venueScene)observer.observe(venueScene);
  function updateProgress(){const height=Math.max(1,intro.offsetHeight);scrollProgress=Math.max(0,Math.min(1,scrollY/height));const viewport=innerHeight||height;for(const scene of photoScenes){const top=scene.getBoundingClientRect().top;const progress=Math.max(0,Math.min(1,(viewport-top)/viewport));let scale=1.08-progress*.08,y=(1-progress)*1.2,blur=0;
      if(scene.dataset.scene==='2'&&top<0){const exit=Math.max(0,Math.min(1,-top/viewport));scale=1+exit*.065;y=-exit*1.1;}
      if(scene.dataset.scene==='3'){scale=1.16-progress*.16;y=(1-progress)*2.5;blur=(1-progress)*1.6;}
      scene.style.setProperty('--image-scale',scale.toFixed(4));scene.style.setProperty('--image-y',`${y.toFixed(3)}%`);scene.style.setProperty('--image-blur',`${blur.toFixed(2)}px`);}}
  addEventListener('scroll',updateProgress,{passive:true});addEventListener('resize',resize,{passive:true});updateProgress();
})();
