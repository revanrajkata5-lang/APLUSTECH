document.addEventListener('DOMContentLoaded', function(){
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Nav scroll state ---------- */
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', ()=>{
    header.classList.toggle('scrolled', window.scrollY > 40);
  });
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', ()=> navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> navLinks.classList.remove('open')));

  /* ---------- Premium 3D logo entrance ---------- */
  gsap.to('#logoBrand', {
    opacity:1, scale:1, rotateY:0, duration:1.1, ease:'back.out(1.6)', delay:0.15
  });

  /* ---------- Hero text reveal (letter/word stagger) ---------- */
  const tl = gsap.timeline({defaults:{ease:'power4.out'}});
  tl.to('#heroEyebrow',{opacity:1,duration:.6},0.1)
    .to('.hero h1 .line span',{y:'0%',duration:1,stagger:0.12},0.2)
    .to('#heroSub',{opacity:1,y:0,duration:.8},0.9)
    .to('#heroBtns',{opacity:1,y:0,duration:.8},1.05)
    .to('#scrollCue',{opacity:1,duration:.6},1.3)
    .to('#hero-canvas',{opacity:1,duration:1.2},0.3);

  /* ---------- Scroll-triggered reveals for sections ----------
     NOTE: these use scrub instead of toggleActions/duration. With
     toggleActions the tween always plays its own fixed duration
     (0.9–1.1s) whenever a trigger point is crossed — so scrolling
     back up fast (past several triggers) queues up a stack of
     still-finishing animations and the page visibly lags behind
     the scrollbar. Scrub locks each tween's progress directly to
     scroll position instead, so reverse-scrolling is instant and
     never falls behind, no matter how fast you scroll. The small
     scrub number (0.35) just adds a touch of smoothing so it
     doesn't feel mechanically linear. */
  gsap.utils.toArray('.reveal').forEach((el)=>{
    gsap.fromTo(el,
      {opacity:0, y:36},
      {
        opacity:1, y:0, ease:'none',
        scrollTrigger:{
          trigger:el, start:'top 85%', end:'top 40%',
          scrub:0.35
        }
      }
    );
  });

  /* ---------- 3D directional reveals (left / right, staggered) ---------- */
  const groupByParent = (nodes)=>{
    const map = new Map();
    nodes.forEach(el=>{
      const parent = el.parentElement;
      if(!map.has(parent)) map.set(parent, []);
      map.get(parent).push(el);
    });
    return map;
  };

  ['.reveal-l','.reveal-r'].forEach(sel=>{
    const nodes = gsap.utils.toArray(sel);
    const byParent = groupByParent(nodes);
    byParent.forEach((els)=>{
      // Stagger is faked with a per-index scroll-position offset
      // (rather than a time-based stagger) so it still works with
      // scrub — each card's window starts/ends a little later than
      // the one before it, in scroll terms, not clock terms.
      els.forEach((el,i)=>{
        const offset = i*3;
        gsap.fromTo(el,
          {opacity:0},
          {
            opacity:1, x:0, y:0, z:0, rotateY:0, scale:1, ease:'none',
            scrollTrigger:{
              trigger:els[0],
              start:`top ${88-offset}%`,
              end:`top ${35-offset}%`,
              scrub:0.35
            }
          }
        );
      });
    });
  });

  /* ---------- Mouse-tracked 3D tilt on cards ---------- */
  const tiltEls = document.querySelectorAll('.tilt-3d');
  const isFinePointer = window.matchMedia('(pointer:fine)').matches;
  if(isFinePointer && !reduceMotionCheck()){
    tiltEls.forEach(el=>{
      const strength = 10;
      const xTo = gsap.quickTo(el, 'rotationY', {duration:0.4, ease:'power3.out'});
      const yTo = gsap.quickTo(el, 'rotationX', {duration:0.4, ease:'power3.out'});
      const liftTo = gsap.quickTo(el, 'y', {duration:0.4, ease:'power3.out'});
      el.addEventListener('mousemove',(e)=>{
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left)/r.width - 0.5;
        const py = (e.clientY - r.top)/r.height - 0.5;
        xTo(px*strength);
        yTo(-py*strength);
        liftTo(-4);
      });
      el.addEventListener('mouseleave', ()=>{
        xTo(0); yTo(0); liftTo(0);
      });
    });
  }
  function reduceMotionCheck(){
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------- Premium 3D tilt for the logo mark itself ---------- */
  const logoBrandEl = document.getElementById('logoBrand');
  const logoImgEl = document.getElementById('logoImg');
  if(logoBrandEl && logoImgEl){
    if(isFinePointer && !reduceMotionCheck()){
      const logoRotY = gsap.quickTo(logoImgEl, 'rotationY', {duration:0.35, ease:'power3.out'});
      const logoRotX = gsap.quickTo(logoImgEl, 'rotationX', {duration:0.35, ease:'power3.out'});
      const logoScale = gsap.quickTo(logoImgEl, 'scale', {duration:0.35, ease:'power3.out'});
      logoBrandEl.addEventListener('mousemove', (e)=>{
        const r = logoBrandEl.getBoundingClientRect();
        const px = (e.clientX - r.left)/r.width - 0.5;
        const py = (e.clientY - r.top)/r.height - 0.5;
        logoRotY(px*22);
        logoRotX(-py*22);
        logoScale(1.08);
      });
      logoBrandEl.addEventListener('mouseleave', ()=>{
        logoRotY(0); logoRotX(0); logoScale(1);
      });
    } else if(!reduceMotionCheck()){
      // touch devices: a slow, gentle idle sway instead of mouse tilt
      gsap.to(logoImgEl, {
        rotationY:8, rotationX:-4, duration:2.6, ease:'sine.inOut',
        repeat:-1, yoyo:true, transformPerspective:600
      });
    }
  }

  /* ---------- Counter animation on trust bar ---------- */
  gsap.utils.toArray('.trust-num').forEach((el)=>{
    const target = parseInt(el.dataset.count,10);
    const suffix = el.dataset.suffix || '';
    ScrollTrigger.create({
      trigger:el, start:'top 90%', once:true,
      onEnter:()=>{
        let obj = {val:0};
        gsap.to(obj,{val:target,duration:1.6,ease:'power2.out',
          onUpdate:()=>{ el.textContent = Math.round(obj.val)+suffix; }
        });
      }
    });
  });

  /* ---------- Quote calculator ---------- */
  const opts = document.querySelectorAll('.calc-opt');
  const resultEl = document.getElementById('calcResult');
  const noteEl = document.getElementById('calcNote');
  let total = 0;
  opts.forEach(opt=>{
    opt.addEventListener('click', ()=>{
      opt.classList.toggle('active');
      total = 0;
      let names = [];
      opts.forEach(o=>{
        if(o.classList.contains('active')){
          total += parseInt(o.dataset.price,10);
          names.push(o.dataset.name);
        }
      });
      const low = total, high = Math.round(total*1.35);
      gsap.to({}, {duration:0.3, onUpdate:function(){
        resultEl.textContent = total === 0 ? '$0' : `$${low.toLocaleString()}–$${high.toLocaleString()}`;
      }});
      noteEl.textContent = names.length ? names.join(' + ') : 'Select services to see your estimate';
    });
  });

  /* ---------- Three.js 3D node network hero ---------- */
  const canvas = document.getElementById('hero-canvas');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0,0,26);
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const group = new THREE.Group();
  scene.add(group);

  // 4 "country" hub nodes + surrounding cluster nodes
  const hubColors = [0x0541BB, 0x7EA0F0, 0x4C74E0, 0x0541BB];
  const hubs = [];
  const hubPositions = [
    new THREE.Vector3(9,4,-2),
    new THREE.Vector3(-8,5,3),
    new THREE.Vector3(-6,-6,-1),
    new THREE.Vector3(7,-5,2)
  ];
  hubPositions.forEach((pos,i)=>{
    const geo = new THREE.SphereGeometry(0.35,20,20);
    const mat = new THREE.MeshBasicMaterial({color: hubColors[i]});
    const mesh = new THREE.Mesh(geo,mat);
    mesh.position.copy(pos);
    group.add(mesh);
    hubs.push(mesh);

    const glowGeo = new THREE.SphereGeometry(0.7,16,16);
    const glowMat = new THREE.MeshBasicMaterial({color: hubColors[i], transparent:true, opacity:0.12});
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(pos);
    group.add(glow);
  });

  // scattered small nodes
  const smallNodes = [];
  const nodeGeo = new THREE.SphereGeometry(0.09,10,10);
  const nodeMat = new THREE.MeshBasicMaterial({color:0xB7C4EA, transparent:true, opacity:0.55});
  for(let i=0;i<70;i++){
    const mesh = new THREE.Mesh(nodeGeo, nodeMat);
    mesh.position.set(
      (Math.random()-0.5)*36,
      (Math.random()-0.5)*24,
      (Math.random()-0.5)*14
    );
    group.add(mesh);
    smallNodes.push(mesh);
  }

  // connecting lines between hubs (arcs)
  function createArc(p1,p2,color){
    const mid = p1.clone().lerp(p2,0.5);
    mid.z += 6;
    const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    const points = curve.getPoints(40);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({color, transparent:true, opacity:0.35});
    return new THREE.Line(geo, mat);
  }
  for(let i=0;i<hubPositions.length;i++){
    for(let j=i+1;j<hubPositions.length;j++){
      group.add(createArc(hubPositions[i], hubPositions[j], 0x0541BB));
    }
  }

  // faint connecting lines from small nodes to nearest hub
  smallNodes.forEach(n=>{
    let nearest = hubPositions[0], minD = Infinity;
    hubPositions.forEach(h=>{
      const d = n.position.distanceTo(h);
      if(d<minD){minD=d; nearest=h;}
    });
    if(minD < 14){
      const geo = new THREE.BufferGeometry().setFromPoints([n.position, nearest]);
      const mat = new THREE.LineBasicMaterial({color:0x2647A0, transparent:true, opacity:0.5});
      group.add(new THREE.Line(geo,mat));
    }
  });

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e)=>{
    mouseX = (e.clientX / window.innerWidth - 0.5);
    mouseY = (e.clientY / window.innerHeight - 0.5);
  });

  let reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animate(t){
    requestAnimationFrame(animate);
    if(!reduceMotion){
      group.rotation.y += 0.0009;
      group.rotation.x = mouseY*0.15;
      group.rotation.y += mouseX*0.0006;
      hubs.forEach((h,i)=>{
        const s = 1 + Math.sin(t*0.0015 + i)*0.15;
        h.scale.set(s,s,s);
      });
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ---------- WhatsApp FAB ---------- */
  document.getElementById('waFab').addEventListener('click', ()=>{
    window.open('https://wa.me/', '_blank');
  });

  /* ---------- Hero "two paths" summary modal ---------- */
  const pathContent = {
    marketing: {
      tag: 'Get Found',
      title: 'Marketing Services',
      sub: 'Visibility, leads and rankings — everything that gets your business found and chosen on Google.',
      items: [
        'Google Business Profile & SEO',
        'Website Design & Development',
        'Meta & Google Ads Management',
        'YouTube Ads & Bulk SMS'
      ],
      targetId: 'pillar-marketing'
    },
    it: {
      tag: 'Get Built',
      title: 'IT Solutions',
      sub: 'Custom software and apps built around how your business actually runs, not a generic template.',
      items: [
        'App Development (Android/iOS)',
        'Billing & Custom Software',
        'Geofencing Solutions',
        'WhatsApp Business Automation'
      ],
      targetId: 'pillar-it'
    }
  };

  const pathModalOverlay = document.getElementById('pathModalOverlay');
  const pathModal = document.getElementById('pathModal');
  const pathModalTag = document.getElementById('pathModalTag');
  const pathModalTitle = document.getElementById('pathModalTitle');
  const pathModalSub = document.getElementById('pathModalSub');
  const pathModalList = document.getElementById('pathModalList');
  const pathModalCta = document.getElementById('pathModalCta');
  const pathModalClose = document.getElementById('pathModalClose');
  let activePath = null;
  let lastFocused = null;

  function openPathModal(key){
    const data = pathContent[key];
    if(!data) return;
    activePath = key;
    pathModalTag.textContent = data.tag;
    pathModalTitle.textContent = data.title;
    pathModalSub.textContent = data.sub;
    pathModalList.innerHTML = data.items.map(i => `<li>${i} <span>&rarr;</span></li>`).join('');
    pathModalCta.textContent = key === 'marketing' ? 'Explore Marketing' : 'Explore IT Solutions';
    lastFocused = document.activeElement;
    pathModalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    pathModalClose.focus();
  }

  function closePathModal(){
    pathModalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    if(lastFocused) lastFocused.focus();
  }

  function goToActivePillar(){
    const data = pathContent[activePath];
    closePathModal();
    if(!data) return;
    const target = document.getElementById(data.targetId);
    if(!target) return;
    // let the close animation clear before scrolling
    setTimeout(()=>{
      target.scrollIntoView({behavior:'smooth', block:'center'});
      target.classList.remove('pillar-highlight');
      // force reflow so the animation can retrigger if clicked again
      void target.offsetWidth;
      target.classList.add('pillar-highlight');
      setTimeout(()=> target.classList.remove('pillar-highlight'), 3600);
    }, 200);
  }

  document.querySelectorAll('[data-path]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      openPathModal(btn.getAttribute('data-path'));
    });
  });

  pathModalCta.addEventListener('click', goToActivePillar);
  pathModalClose.addEventListener('click', closePathModal);
  pathModalOverlay.addEventListener('click', (e)=>{
    if(e.target === pathModalOverlay) closePathModal();
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && pathModalOverlay.classList.contains('open')) closePathModal();
  });
});
