  // V0.4 — physical landing extensions in the kit's measured stair coordinate system.
  // Both treads and new landings participate in the same walking raycast.
  function buildStairLandings(root) {
    [-1, 1].forEach(function (side) {
      var vertices = [], indices = [], radius = 11.35, width = 1.8;
      var a0 = -0.56, a1 = -0.345, steps = 16;
      for (var i = 0; i <= steps; i++) {
        var a = a0 + (a1 - a0) * i / steps;
        [radius - width / 2, radius + width / 2].forEach(function (r) {
          vertices.push(side * r * Math.cos(a), 0, 36 + r * Math.sin(a));
        });
        if (i < steps) { var k = 2 * i; indices.push(k, k+1, k+2, k+1, k+3, k+2); }
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.setIndex(indices);
      // Set the actual winding based on its normal rather than assuming mirror orientation.
      geo.computeVertexNormals();
      if (geo.attributes.normal.getY(0) < 0) {
        for (var k = 0; k < indices.length; k += 3) { var tmp = indices[k+1]; indices[k+1] = indices[k+2]; indices[k+2] = tmp; }
        geo.setIndex(indices); geo.computeVertexNormals();
      }
      var mat = M.floor.clone(); mat.side = THREE.DoubleSide;
      var mesh = new THREE.Mesh(geo, mat); mesh.name = 'V04_Upper_Stair_Landing_' + side;
      root.add(mesh); walk.push(mesh);
      // A solid-looking bronze edge and low-profile rails, kept outside walking width.
      [radius-width/2, radius+width/2].forEach(function (r) {
        var pts = []; for (var j=0;j<=12;j++) { var a=a0+(a1-a0)*j/12; pts.push(new THREE.Vector3(side*r*Math.cos(a),1.0,36+r*Math.sin(a))); }
        var curve = new THREE.CatmullRomCurve3(pts);
        root.add(new THREE.Mesh(new THREE.TubeGeometry(curve,12,0.035,6,false),M.bronze));
        [a0+0.02,a1-0.02].forEach(function(a){var post=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,1,6),M.steel);post.position.set(side*r*Math.cos(a),0.5,36+r*Math.sin(a));root.add(post);});
      });
      // Light both approaches, not just the corridor center.
      [0, LOW].forEach(function (y) {
        var l = new THREE.PointLight(0xffc78a, 3.5, 12, 1.8);
        l.position.set(side * 11.35, y + 2.5, 36); root.add(l);
      });
    });
  }

  // An opaque, depth-tested viewport surface. No hyperspace particles or exterior
  // tunnel geometry exist anywhere else in the atrium scene. Bridge/room effects
  // remain untouched. Sync with the existing ship-wide wf-warp schedule.
  function buildSkylightView(root) {
    var uniforms = { clock: {value:0}, warp: {value:0} };
    var material = new THREE.ShaderMaterial({
      uniforms:uniforms, side:THREE.DoubleSide, depthTest:true, depthWrite:true,
      transparent:false, toneMapped:false, fog:false,
      vertexShader:'varying vec2 uv0; void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:[
        'uniform float clock; uniform float warp; varying vec2 uv0;',
        'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'void main(){',
        'vec2 s=uv0*vec2(80.,700.);vec2 id=floor(s);vec2 f=fract(s)-.5;',
        'float star=step(.983,h(id))*(1.-smoothstep(.025,.16,length(f)));',
        'vec3 quiet=vec3(.009,.014,.034)+star*vec3(.72,.83,1.);',
        'float lane=floor(uv0.x*100.);float n=h(vec2(lane,4.));',
        'float z=fract(uv0.y*(3.+n*8.)-clock*(1.3+n*2.5)+n*31.);',
        'float line=pow(max(0.,1.-abs(fract(uv0.x*100.)-.5)*2.),5.);',
        'float tail=pow(max(0.,1.-z),5.);',
        'vec3 fast=vec3(.012,.025,.065)+line*tail*vec3(.24,.52,1.)*(.4+n*1.2);',
        'gl_FragColor=vec4(mix(quiet,fast,warp),1.);}'
      ].join('\n')
    });
    // Existing ceiling cutout spans x ±2.05, z −17.55 to +18.05.
    var pane = new THREE.Mesh(new THREE.PlaneGeometry(4.1,35.6),material);
    pane.rotation.x = -Math.PI/2; pane.position.set(0,3.29,0.25);
    pane.name='V04_Skylight_Only'; root.add(pane);
    var last=null, nextCheck=-1, target=0, current=0, soundCheck=-1;
    function scheduled(){
      var now=Date.now(),w=null;
      try{w=JSON.parse(localStorage.getItem('wf-warp')||'null');}catch(e){}
      if(!w){w={until:0,next:now+(4+Math.random()*8)*60000};try{localStorage.setItem('wf-warp',JSON.stringify(w));}catch(e){}}
      if(now>w.next){w={until:now+75000,next:now+(7+Math.random()*6)*60000,at:now};try{localStorage.setItem('wf-warp',JSON.stringify(w));}catch(e){}}
      return now<w.until?1:0;
    }
    current=target=scheduled(); uniforms.warp.value=current;
    return {update:function(t){
      var dt=last===null?0:Math.min(.1,Math.max(0,t-last));last=t;
      if(Math.floor(t)!==nextCheck){nextCheck=Math.floor(t);target=scheduled();}
      current+=Math.sign(target-current)*Math.min(Math.abs(target-current),dt/2.5);
      uniforms.clock.value=t;uniforms.warp.value=current;
      if(window.WF_SOUND&&Math.floor(t*4)!==soundCheck){soundCheck=Math.floor(t*4);WF_SOUND.warp(current);}
    }};
  }
