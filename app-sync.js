
window.FB=(function(){
  var cfg={apiKey:"AIzaSyD6L-1ZpEosMsnOUoKy52gmOAmvPdiwoj0",authDomain:"heavensdoor-teen.firebaseapp.com",projectId:"heavensdoor-teen",storageBucket:"heavensdoor-teen.firebasestorage.app",messagingSenderId:"122338824909",appId:"1:122338824909:web:738ee265236ef485cdcf84"};
  var db=null,authed=false,waiters=[];
  try{ if(cfg.apiKey && typeof firebase!=='undefined'){ firebase.initializeApp(cfg); db=firebase.firestore();
    try{ db.enablePersistence({synchronizeTabs:true}).then(function(){console.log('[FB] offline cache on');}).catch(function(e){console.warn('[FB] offline cache off:',e&&e.code);}); }catch(e){ console.warn('[FB] persistence unsupported'); }
    firebase.auth().onAuthStateChanged(function(u){ if(u&&!authed){ authed=true; var w=waiters; waiters=[]; w.forEach(function(fn){ try{fn();}catch(e){console.error(e);} }); } }); firebase.auth().signInAnonymously().then(function(){ console.log('[FB] connected & signed in:',cfg.projectId); }).catch(function(e){ console.error('[FB] auth failed',e&&e.code); }); } }
  catch(e){ console.error('[FB] init failed',e); }
  return {
    enabled:function(){return !!db;},
    ready:function(cb){ if(!db){return;} if(authed){cb();} else {waiters.push(cb);} },
    save:function(col,id,data){return db?db.collection(col).doc(String(id)).set(data):Promise.resolve();},
    remove:function(col,id){return db?db.collection(col).doc(String(id)).delete():Promise.resolve();},
    load:function(col){return db?db.collection(col).get().then(function(s){return s.docs.map(function(d){return d.data();});}):Promise.resolve([]);},
    get:function(col,id){return db?db.collection(col).doc(String(id)).get().then(function(d){return d.exists?d.data():null;}):Promise.resolve(null);},
    watch:function(col,cb){ if(db) db.collection(col).onSnapshot(function(s){cb(s.docs.map(function(d){return d.data();}),!!(s.metadata&&s.metadata.fromCache));},function(err){ try{console.error('[FB] 읽기 실패(규칙 확인 필요):',col,err&&err.code);}catch(e){} try{if(err&&err.code==='permission-denied'&&window._fbWarnDenied)window._fbWarnDenied(col);}catch(e){} }); }
  };
})();
if(window.FB&&FB.enabled()){FB.ready(function(){FB.watch('diaries',function(arr){try{var _demo=(typeof diaryData!=='undefined'?diaryData:[]).filter(function(d){return d.demo;});diaryData=arr.concat(_demo);if(G&&G.id){try{renderDiaryList();}catch(e){}}}catch(e){console.error('[FB] diary sync',e);}});});}
function fbRefreshBoard(){ try{ if(typeof currentBoardCat==='undefined'||!currentBoardCat||!(G&&G.id))return; if(currentBoardCat==='activity'){ if(typeof renderDeptPosts==='function'){renderDeptPosts('choir');renderDeptPosts('liturgy');} return; } if(G.role==='teacher'){ if(typeof applyTeacherFilter==='function')applyTeacherFilter(); } else if(G.role==='student'){ renderBoardList(currentBoardCat,posts.filter(function(x){return x.cat===currentBoardCat&&(x.target==='all'||(x.target==='student'&&(x.grade==='all-s'||x.grade===G.gradeKey)));})); } else { if(currentBoardCat==='jabumo'&&!(G.isJabumo||G.isJabumoPresident)){ if(typeof _renderJabumoLocked==='function')_renderJabumoLocked(); } else { renderBoardList(currentBoardCat,posts.filter(function(x){return x.cat===currentBoardCat&&(currentBoardCat==='jabumo'||x.target==='all'||x.target==='parent');})); } } }catch(e){} }
var _fbDeniedSeen={};
function _fbWarnDenied(col){ if(_fbDeniedSeen[col])return; _fbDeniedSeen[col]=true; try{showToast('⚠️ \''+col+'\' 항목이 클라우드에 저장되지 않았어요. Firestore 보안 규칙에 이 컬렉션을 추가해야 해요.');}catch(e){} }
window._fbWarnDenied=_fbWarnDenied;
(function(){
  if(!(window.FB&&FB.enabled())){window._evReady=true;return;}
  FB.ready(function(){
  var specs=[
    {c:'members',g:function(){return pendingList;},s:function(v){pendingList=v;}},
    {c:'hymns',g:function(){return hymnData;},s:function(v){hymnData=v;}},
    {c:'liturgy',g:function(){return litData;},s:function(v){litData=v;}},
    {c:'posts',g:function(){return posts;},s:function(v){posts=v;},
      enc:function(p){
        var o=Object.assign({},p);
        if(p.images&&p.images.length){
          o.images=p.images.map(function(im,ix){
            if(typeof im==='string')im={src:im};
            if(!im.i){
              var nid='img'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
              var data=im.src||'';
              im.i=nid;
              if(data){IMGC[nid]=data;try{FB.save('images',nid,{id:nid,d:data});}catch(e){}}
              p.images[ix]=lazyImg(im);   /* 메모리에서도 base64 분리 → flush CPU/용량 절감 */
              try{ var _d=Object.getOwnPropertyDescriptor(p,'image');
                   if(_d&&_d.enumerable){ delete p.image;
                     Object.defineProperty(p,'image',{enumerable:false,configurable:true,get:function(){var f=p.images&&p.images[0];return f?(f.src||''):'';}}); } }catch(e){}
            }
            var q={i:im.i};
            if(im.comments&&im.comments.length)q.comments=im.comments;
            if(im.likes&&im.likes.length)q.likes=im.likes;
            return q;
          });
        }
        if(p.docs&&p.docs.length)o.docs=p.docs.map(function(d,ix){return encDoc(p.docs,ix);});
        delete o.image;
        return o;
      },
      dec:function(p){
        if(p.images&&p.images.length){
          p.images=p.images.map(function(im){
            if(im&&typeof im==='object'&&im.i&&!im.src)return lazyImg(im);
            return im;
          });
          if(!p.image){Object.defineProperty(p,'image',{enumerable:false,configurable:true,get:function(){var f=p.images&&p.images[0];return f?(f.src||''):'';}});}
        }
        return p;
      }},
    {c:'coupons',g:function(){return coupons;},s:function(v){coupons=v;}},
    {c:'events',g:function(){return calEvents;},s:function(v){calEvents=v;}},
    {c:'calResponses',g:function(){return calResponses;},s:function(v){calResponses=v;}},
    {c:'eventBanners',g:function(){return eventsData;},s:function(v){eventsData=v;},
      enc:function(e){var o=Object.assign({},e);delete o.image;return o;}},
    {c:'photos',g:function(){return photosData;},s:function(v){photosData=v;},
      enc:function(ph){var o=Object.assign({},ph);delete o.image;delete o.images;return o;}},
    {c:'reminders',g:function(){return reminderData;},s:function(v){reminderData=v;}},
    {c:'letters',g:function(){return letters;},s:function(v){letters=v;}},
    {c:'birthdayComments',g:function(){return birthdayComments;},s:function(v){birthdayComments=v;}},
    {c:'bdayLikes',g:function(){return bdayLikes;},s:function(v){bdayLikes=v;}},
    {c:'notifications',g:function(){return notifications;},s:function(v){notifications=v;try{updateNotifDot();}catch(e){}}},
    {c:'resources',g:function(){return resources;},s:function(v){resources=v;},
      enc:function(r){var o=Object.assign({},r);
        if(r.images&&r.images.length)o.images=r.images.map(function(im,ix){return encImg(r.images,ix);});
        if(r.docs&&r.docs.length)o.docs=r.docs.map(function(d,ix){return encDoc(r.docs,ix);});
        return o;},
      dec:function(r){
        if(r.images&&r.images.length)r.images=r.images.map(function(im){return (im&&typeof im==='object'&&im.i&&!im.src)?lazyImg(im):im;});
        return r;}}
  ];
  var prev={};
  function jid(x){return x&&x.id!=null?String(x.id):null;}
  function _isDemoId(id){ if(!id)return false; id=String(id); return /(^|-)demo\d*/i.test(id)||/^bc-d\d/.test(id)||id==='ev1'||id==='ev2'||id==='ph1'||id==='ph2'||id==='ph3'; }
  var _DEMO_SIDS={student1:1,student2:1,student3:1,student4:1,student5:1};
  var _DEMO_NAMES=/이도윤|김하늘|박시우|정예은|한지호/;
  function _isDemoCouponCloud(c){ return !!(c&&(c.demo||(c.studentId&&_DEMO_SIDS[c.studentId])||_DEMO_NAMES.test(c.studentName||''))); }
  function saveDoc(c,id,it){try{Promise.resolve(FB.save(c,id,it)).catch(function(e){console.warn('[FB] save fail',c,id,e&&e.code); if(e&&e.code==='permission-denied'){try{if(window._fbWarnDenied)window._fbWarnDenied(c);}catch(_){}}});}catch(e){}}
  function flush(){ if(!FB.enabled())return; specs.forEach(function(sp){ try{
    var arr=sp.g()||[]; var pp=prev[sp.c]||(prev[sp.c]={}); var now={};
    arr.forEach(function(it){ if(it&&it.demo)return; var id=jid(it); if(!id)return; var j; try{j=JSON.stringify(it);}catch(e){return;} now[id]=j; if(pp[id]!==j){ var pay=sp.enc?sp.enc(it):it; try{ if(JSON.stringify(pay).length>950000){ console.warn('[FB] doc too large',sp.c,id); showToast('⚠️ 저장 용량이 너무 커요. 내용을 줄여주세요'); pp[id]=j; return; } }catch(e){} saveDoc(sp.c,id,pay); try{pp[id]=JSON.stringify(it);}catch(e){pp[id]=j;} } });
    Object.keys(pp).forEach(function(id){ if(!(id in now)){ FB.remove(sp.c,id); delete pp[id]; } });
  }catch(e){console.error('[FB] flush',sp.c,e);} }); }
  setInterval(flush,400);
  window.flushSync=flush;
  var _rt=null;
  window.rerenderAll=function(){rerender();};
  function rerender(){ clearTimeout(_rt); _rt=setTimeout(function(){ if(!(G&&G.id))return; ['renderMembersList','renderAttendList','renderAdminGrid','renderAbsentAlerts','renderAttendStats','renderCouponList','renderCalendar','renderHomeNotices','renderStoryRow','renderReminderList','renderHomeReminders','renderEventBanner','renderHomeSchedule','initStamps','renderResourceList','renderPushNudgeBar','renderBdayComments','renderBdayLike','renderBdayBannerAuto','renderDiaryList','updateNotifDot','renderNotifList','renderTeacherWeek','renderHomeMinutes','renderMinutesHub','renderDeptWeekInfo','renderGradLetterEntry','_syncStudentCards','_syncDetailScreen','updatePendingUI','syncSessionFromRec','setMyProfile','paintTeacherHome','updateWeeklyBtn'].forEach(function(fn){ try{ if(typeof window[fn]==='function')window[fn](); }catch(e){} }); try{fbRefreshBoard();}catch(e){} }, 150); }
  specs.forEach(function(sp){ FB.watch(sp.c,function(cloud,fromCache){ try{
    cloud=(cloud||[]).filter(function(cd){var _id=jid(cd);return !_isDemoId(_id)&&!(sp.c==='coupons'&&_isDemoCouponCloud(cd));}); var local=sp.g()||[]; var pp=prev[sp.c]||(prev[sp.c]={}); var by={}; local.forEach(function(x){var id=jid(x); if(id)by[id]=x;});
    var demo=local.filter(function(x){return x&&x.demo;}); var cids={}; var out=[];
    cloud.forEach(function(cd){ var id=jid(cd); if(!id)return; if(sp.dec){try{cd=sp.dec(cd);}catch(e){}} cids[id]=1; var lc=by[id];
      if(!lc && (id in pp)){ if(fromCache){ out.push(cd); pp[id]=JSON.stringify(cd); return; } /* 이전에 동기화됐던 문서가 로컬에서 사라짐 = 이 기기에서 삭제함 → 클라우드에서도 삭제 (부활 방지). 단 캐시 스냅샷은 불완전할 수 있어 삭제로 간주하지 않음 */ try{FB.remove(sp.c,id);}catch(e){} delete pp[id]; return; }
      if(lc&&!lc.demo&&JSON.stringify(lc)!==pp[id]){ out.push(lc); } else { out.push(cd); pp[id]=JSON.stringify(cd); } });
    local.forEach(function(x){ if(!x||x.demo)return; var id=jid(x); if(!id||cids[id])return; if(id in pp){ if(JSON.stringify(x)!==pp[id]||fromCache)out.push(x); } else { out.push(x); } });
    sp.s(out.concat(demo));
    if(sp.c==='members'&&G&&G.id){ for(var i=0;i<out.length;i++){ if(out[i].id===G.id){ var _u=out[i]; if(!previewMode)currentLoginUser=_u; G.role=_u.role;G.name=_u.name;G.baptism=_u.baptism;if(_u.id===ADMIN.id&&appConfig&&appConfig.adminPos&&appConfig.adminPos.t&&(_u.teacherType||'')!==appConfig.adminPos.t){_u.teacherType=appConfig.adminPos.t;_u.gradeLabel=appConfig.adminPos.l||appConfig.adminPos.t;try{saveMemberNow(_u);}catch(e){}}G.type=_u.teacherType||'';G.gradeKey=_u.gradeKey||'';G.grade=_u.gradeLabel||'';G.isAdmin=_u.isAdmin||false;G.isJabumo=_u.isJabumo||false;G.isJabumoPresident=_u.isJabumoPresident||false;G.graduated=_u.graduated||false;G.birthMonth=_u.birthMonth||0;G.birthDay=_u.birthDay||0;G.feastMonth=_u.feastMonth||0;G.feastDay=_u.feastDay||0;G.attendTotal=_u.attendTotal||0;G.streak=_u.streak||0;G.history=_u.history||[];G.attendedWeeks=_u.attendedWeeks||[]; try{setMyProfile();}catch(e){} try{paintTeacherHome();}catch(e){} break; } } }
    if(sp.c==='members'){window._membersLoaded=true;try{ensureAdminMember();}catch(e){} try{if(typeof _tryRestoreSession==='function')_tryRestoreSession();}catch(e){} try{syncSessionFromRec();}catch(e){} try{checkPwVersion();}catch(e){} try{cleanOrphanCoupons();}catch(e){}}
    if(sp.c==='events'){window._evReady=true;try{ensureWeeklyEvents();}catch(e){}}
    try{cleanOrphanVac();}catch(e){}
    rerender();
  }catch(e){console.error('[FB] sync',sp.c,e);} }); });
  var _cfgPrev=null;window._cfgLoaded=false;
  var _assetPrev=null;
  function flushCfg(){ if(!FB.enabled())return; if(!window._cfgLoaded)return; try{ if(typeof appConfig==='undefined')return; var j=JSON.stringify(appConfig); if(j===_cfgPrev)return; appConfig._rev=(appConfig._rev||0)+1;
    var full=JSON.parse(JSON.stringify(appConfig)); _cfgPrev=JSON.stringify(appConfig);
    var big={id:'app',logo:full.logo||'',seasonImgs:full.seasonImgs||{}}; delete full.logo; delete full.seasonImgs;
    Promise.resolve(FB.save('settings','app',full)).catch(function(e){ console.warn('[FB] settings save fail',e&&e.code); _cfgPrev=null; });
    var bj=JSON.stringify(big);
    if(bj!==_assetPrev){ _assetPrev=bj; Promise.resolve(FB.save('assets','app',big)).catch(function(e){ console.warn('[FB] assets save fail',e&&e.code); _assetPrev=null; }); }
  }catch(e){} }
  FB.watch('assets',function(arr){ try{ if(!arr||!arr.length)return; var a=arr[0]; if(!a)return;
    if(a.logo)appConfig.logo=a.logo; if(a.seasonImgs)appConfig.seasonImgs=a.seasonImgs;
    _assetPrev=JSON.stringify({id:'app',logo:appConfig.logo||'',seasonImgs:appConfig.seasonImgs||{}});
    _cfgPrev=JSON.stringify(appConfig);
    try{applyAppConfig();}catch(e){}
  }catch(e){console.error('[FB] assets',e);} });
  window.flushCfg=flushCfg;
  setInterval(flushCfg,400);
  /* settings 스냅샷이 늦어도 기본값으로 클라우드를 덮어쓰지 않도록 보호. 10초 내 미도착 시에만 해제 */
  setTimeout(function(){ if(!window._cfgLoaded){ console.warn('[FB] settings snapshot timeout'); window._cfgLoaded=true; } },10000);
  FB.watch('settings',function(arr){ try{ if(!arr||!arr.length){window._cfgLoaded=true;return;} var cloud=arr[0]; window._cfgLoaded=true; if(_cfgPrev!==null && (cloud._rev||0) < (appConfig._rev||0))return; var localJ=JSON.stringify(appConfig); if(_cfgPrev!==null && localJ!==_cfgPrev && localJ!==JSON.stringify(cloud))return; var _qrPrev=appConfig.qr; Object.keys(cloud).forEach(function(k){ appConfig[k]=cloud[k]; }); try{if(appConfig.qr&&_qrPrev&&appConfig.qr.week===_qrPrev.week&&_qrPrev.resetUsed&&!appConfig.qr.resetUsed){appConfig.qr.resetUsed=true;}}catch(e){} try{if(appConfig.adminPos&&appConfig.adminPos.t&&!adminRec()){ADMIN.teacherType=appConfig.adminPos.t;ADMIN.type=appConfig.adminPos.t;ADMIN.gradeLabel=appConfig.adminPos.l||appConfig.adminPos.t;if(G&&G.id===ADMIN.id){G.type=ADMIN.teacherType;G.grade=ADMIN.gradeLabel;try{setMyProfile();}catch(e){}}}}catch(e){} try{syncSessionFromRec();}catch(e){} _cfgPrev=JSON.stringify(appConfig); try{applyAppConfig();}catch(e){} try{if(_seasonPreview==null)applySeason(appConfig.season||'ordinary');}catch(e){} try{loadThemeGreetInputs();}catch(e){} try{applyLogo();}catch(e){} try{if(appConfig.qr&&appConfig.qr.week===currentSaturday()){qrState={week:appConfig.qr.week,code:appConfig.qr.code||'',resetUsed:!!appConfig.qr.resetUsed};}if(G&&G.role==='teacher'){try{syncQRUI();}catch(e){}}}catch(e){} try{renderDeptWeekInfo();}catch(e){} try{if(typeof hideBootSplash==='function')setTimeout(hideBootSplash,80);}catch(e){} rerender(); }catch(e){console.error('[FB] settings sync',e);} });
  });
})();
function countUp(el,to){to=parseInt(to)||0;var from=parseInt((el.textContent||'').replace(/[^0-9]/g,''))||0;if(from===to){el.textContent=to;return;}var d=650,t0=null;function step(ts){if(!t0)t0=ts;var pr=Math.min(1,(ts-t0)/d);el.textContent=Math.round(from+(to-from)*(1-Math.pow(1-pr,3)));if(pr<1)requestAnimationFrame(step);}requestAnimationFrame(step);}
function populateDateSelects(){try{var now=new Date().getFullYear();function opts(from,to,down){var h='';if(down){for(var y=from;y>=to;y--)h+='<option value="'+y+'">'+y+'</option>';}else{for(var i=from;i<=to;i++)h+='<option value="'+i+'">'+i+'</option>';}return h;}function fill(id,label,inner){var el=document.getElementById(id);if(!el||el.options.length>1)return;el.innerHTML='<option value="0">'+label+'</option>'+inner;}var years=opts(now,1940,true),months=opts(1,12,false),days=opts(1,31,false);fill('reg-byear','년',years);fill('ms-byear','년',years);['reg-bmonth','ms-bmonth','reg-feast-month','ms-fmonth'].forEach(function(id){fill(id,'월',months);});['reg-bday','ms-bday','reg-feast-day','ms-fday'].forEach(function(id){fill(id,'일',days);});}catch(e){}}
(function(){try{if(typeof pendingList!=='undefined'){var n=new Date();for(var i=0;i<pendingList.length;i++){var u=pendingList[i];if(u&&u.demo&&u.role==='student'&&!u.birthMonth){u.birthMonth=n.getMonth()+1;u.birthDay=n.getDate();break;}}}}catch(e){}})();
function _tryRestoreSession(){try{
  if(G&&G.id)return;
  var sid=localStorage.getItem('hd-session-id');if(!sid)return;
  var u=pendingList.find(function(x){return x.id===sid&&x.approved&&!x.hidden;})||((sid===ADMIN.id&&!appConfig.adminSeeded)?ADMIN:null);
  if(!u)return;
  /* 비밀번호가 바뀌었으면(다른 기기에서 변경 포함) 자동 로그인 차단 */
  var saved=Number(localStorage.getItem('hd-session-pwv')||0);
  if(Number(u.pwv||0)!==saved){
    try{localStorage.removeItem('hd-session-id');localStorage.removeItem('hd-session-pwv');}catch(e){}
    try{showToast('비밀번호가 변경되어 다시 로그인해주세요');}catch(e){}
    return;
  }
  window._restoring=true;
  try{startSession(u);}catch(e){window._restoring=false;}
}catch(e){}}
/* 로그인 중에도 비밀번호가 바뀌면(다른 기기에서) 즉시 로그아웃 */
function checkPwVersion(){
  try{
    if(!(G&&G.id))return;
    var r=pendingList.find(function(x){return x.id===G.id;});
    if(!r)return;
    var saved=Number(localStorage.getItem('hd-session-pwv')||0);
    if(Number(r.pwv||0)!==saved){
      try{showToast('비밀번호가 변경되어 로그아웃합니다');}catch(e){}
      setTimeout(function(){try{doLogout();}catch(e){}},900);
    }
  }catch(e){}
}
function hideBootSplash(){var s=document.getElementById('boot-splash');if(!s||s._hiding)return;s._hiding=true;s.style.opacity='0';setTimeout(function(){s.style.display='none';},480);}
setTimeout(hideBootSplash,3500);
setTimeout(function(){if(!window._evReady){window._evReady=true;try{ensureWeeklyEvents();if(G&&G.id){renderCalendar();renderHomeSchedule();}}catch(e){}}},8000);
if(document.readyState!=='loading'){setTimeout(function(){if(!(window.FB&&FB.enabled()))hideBootSplash();},600);}else{document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){if(!(window.FB&&FB.enabled()))hideBootSplash();},600);});}
if(document.readyState!=='loading'){setTimeout(_tryRestoreSession,0);}else{document.addEventListener('DOMContentLoaded',function(){setTimeout(_tryRestoreSession,0);});}
if(document.readyState!=='loading')populateDateSelects();else document.addEventListener('DOMContentLoaded',populateDateSelects);
if(document.readyState!=='loading'){try{applyLogo();}catch(e){}}else{document.addEventListener('DOMContentLoaded',function(){try{applyLogo();}catch(e){}});}
try{if(typeof applySeason==='function')applySeason((typeof appConfig!=='undefined'&&appConfig.season)||'ordinary');}catch(e){}
(function(){var ORDER=['home','board','attend','diary','activity','teacher','admin','my'];var sx=0,sy=0,lx=0,ly=0,tracking=false;var SKIP='.tab-bar,.filter-row,.year-tabs,.story-row,.event-slides,.coupon-swipe,.wheel-col,.bday-slides,input,textarea,select';function visTabs(){return ORDER.filter(function(t){var el=document.getElementById('nav-'+t);return el&&el.offsetParent!==null;});}function curTab(){var a=document.querySelector('.nav-item.active');return(a&&a.id&&a.id.indexOf('nav-')===0)?a.id.slice(4):null;}function sStart(x,y,target){tracking=false;try{if(document.querySelector('.modal-overlay.open'))return;var nav=document.getElementById('bottom-nav');if(!nav||nav.style.display==='none')return;if(target&&target.closest&&target.closest(SKIP))return;if(!(target&&target.closest&&target.closest('.screen.active')))return;sx=x;sy=y;lx=x;ly=y;tracking=true;}catch(err){}}function sMove(x,y){if(tracking){lx=x;ly=y;}}function sEnd(){if(!tracking)return;tracking=false;try{var dx=lx-sx,dy=ly-sy;if(Math.abs(dx)<50||Math.abs(dx)<Math.abs(dy)*1.4)return;var vis=visTabs(),cur=curTab();if(!cur)return;var i=vis.indexOf(cur);if(i<0)return;var t=dx<0?vis[i+1]:vis[i-1];if(t)switchTab(t);}catch(err){}}document.addEventListener('touchstart',function(e){if(e.touches&&e.touches.length===1){var t=e.touches[0];sStart(t.clientX,t.clientY,e.target);}},{passive:true});document.addEventListener('touchmove',function(e){if(e.touches&&e.touches.length===1){var t=e.touches[0];sMove(t.clientX,t.clientY);}},{passive:true});document.addEventListener('touchend',function(){sEnd();},{passive:true});document.addEventListener('touchcancel',function(){sEnd();},{passive:true});document.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse')sStart(e.clientX,e.clientY,e.target);},{passive:true});document.addEventListener('pointermove',function(e){if(e.pointerType==='mouse')sMove(e.clientX,e.clientY);},{passive:true});document.addEventListener('pointerup',function(e){if(e.pointerType==='mouse')sEnd();},{passive:true});})();
var WHEELG={'reg-birth':{title:'생년월일',trg:'trg-reg-birth',cols:[{t:'y',sel:'reg-byear'},{t:'m',sel:'reg-bmonth'},{t:'d',sel:'reg-bday'}]},'reg-feast':{title:'축일',trg:'trg-reg-feast',cols:[{t:'m',sel:'reg-feast-month'},{t:'d',sel:'reg-feast-day'}]},'ms-birth':{title:'생년월일',trg:'trg-ms-birth',cols:[{t:'y',sel:'ms-byear'},{t:'m',sel:'ms-bmonth'},{t:'d',sel:'ms-bday'}]},'ms-feast':{title:'축일',trg:'trg-ms-feast',cols:[{t:'m',sel:'ms-fmonth'},{t:'d',sel:'ms-fday'}]},'reminder-time':{title:'알림 시간',trg:'trg-reminder-time',time:true,out:'reminder-time',ap:'rt-ampm',hr:'rt-hour',mn:'rt-min',cols:[{t:'ap',sel:'rt-ampm',loop:true},{t:'h12',sel:'rt-hour',loop:true},{t:'mn5',sel:'rt-min',loop:true}]},'event-time':{title:'시간',trg:'trg-cal-ev-time',time:true,out:'cal-ev-time',ap:'et-ampm',hr:'et-hour',mn:'et-min',cols:[{t:'ap',sel:'et-ampm',loop:true},{t:'h12',sel:'et-hour',loop:true},{t:'mn5',sel:'et-min',loop:true}]}};
function _setSel(id,v){var e=document.getElementById(id);if(e)e.value=String(v);}
function _timeSeed(g){var h=document.getElementById(g.hr);if(h&&h.value!=='')return;var n=new Date(),hh=n.getHours(),mm=Math.round(n.getMinutes()/5)*5;if(mm>=60){mm=0;hh=(hh+1)%24;}var ap=hh<12?0:1,h12=hh%12;if(h12===0)h12=12;_setSel(g.ap,ap);_setSel(g.hr,h12);_setSel(g.mn,mm);}
function _timeApply(g){
  var ap=parseInt((document.getElementById(g.ap)||{}).value)||0;
  var h12=parseInt((document.getElementById(g.hr)||{}).value)||12;
  var mm=parseInt((document.getElementById(g.mn)||{}).value)||0;
  var H=ap===1?(h12===12?12:h12+12):(h12===12?0:h12);
  var hh=(H<10?'0'+H:''+H),m2=(mm<10?'0'+mm:''+mm);
  var ti=document.getElementById(g.out);if(ti)ti.value=hh+':'+m2;
  var trg=document.getElementById(g.trg);if(trg){var v=trg.querySelector('.dt-val');if(v){v.textContent=(ap===1?'오후':'오전')+' '+h12+':'+m2;v.className='dt-val';}}
}
function _timeClear(g){[g.ap,g.hr,g.mn,g.out].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});var trg=document.getElementById(g.trg);if(trg){var v=trg.querySelector('.dt-val');if(v){v.textContent='선택 안 함';v.className='dt-val ph';}}}
function _timeSet(g,hhmm){if(!hhmm){_timeClear(g);return;}var p=String(hhmm).split(':'),H=parseInt(p[0])||0,mm=parseInt(p[1])||0;mm=Math.round(mm/5)*5;if(mm>=60){mm=0;H=(H+1)%24;}var ap=H<12?0:1,h12=H%12;if(h12===0)h12=12;_setSel(g.ap,ap);_setSel(g.hr,h12);_setSel(g.mn,mm);_timeApply(g);}
function clearReminderTime(){_timeClear(WHEELG['reminder-time']);}
function _setReminderTime(hhmm){_timeSet(WHEELG['reminder-time'],hhmm);}
function clearEventTime(){_timeClear(WHEELG['event-time']);}
function _setEventTime(hhmm){_timeSet(WHEELG['event-time'],hhmm);}
var _wheelCur=null;
function _wvals(t){var now=new Date().getFullYear(),a=[];if(t==='y'){for(var y=now;y>=1940;y--)a.push(y);}else if(t==='m'){for(var m=1;m<=12;m++)a.push(m);}else if(t==='ap'){a=[0,1];}else if(t==='h12'){for(var hh=1;hh<=12;hh++)a.push(hh);}else if(t==='mn5'){for(var mm=0;mm<60;mm+=5)a.push(mm);}else{for(var d=1;d<=31;d++)a.push(d);}return a;}
function _wlabel(t,v){if(t==='y')return v+'년';if(t==='m')return v+'월';if(t==='ap')return v===1?'오후':'오전';if(t==='h12')return v+'시';if(t==='mn5')return (v<10?'0'+v:v)+'분';return v+'일';}
function _buildCol(t,vals){var col=document.createElement('div');col.className='wheel-col';var h='<div class="wsp"></div>';for(var i=0;i<vals.length;i++)h+='<div class="wheel-item">'+_wlabel(t,vals[i])+'</div>';h+='<div class="wsp"></div>';col.innerHTML=h;return col;}
var _WLOOP_K=11,_WLOOP_C=5;   /* 값 목록을 11번 반복, 중앙(5번째) 블록에서 시작 */
function _buildColLoop(t,vals){var col=document.createElement('div');col.className='wheel-col';col._loop=true;col._len=vals.length;var h='<div class="wsp"></div>';for(var k=0;k<_WLOOP_K;k++){for(var i=0;i<vals.length;i++)h+='<div class="wheel-item">'+_wlabel(t,vals[i])+'</div>';}h+='<div class="wsp"></div>';col.innerHTML=h;return col;}
function _loopSettle(col){var len=col._len;if(!len)return;var ai=Math.round(col.scrollTop/44);var block=Math.floor(ai/len);if(block<2||block>_WLOOP_K-3){var vi=((ai%len)+len)%len;col.scrollTop=(_WLOOP_C*len+vi)*44;_highlight(col);}}
function _highlight(col){var idx=Math.round(col.scrollTop/44);var it=col.querySelectorAll('.wheel-item');for(var i=0;i<it.length;i++){if(i===idx)it[i].classList.add('wsel');else it[i].classList.remove('wsel');}}
function _daysIn(y,m){if(!m)return 31;return new Date(y||2000,m,0).getDate();}
function _wheelAttach(col,g,isYM){col.addEventListener('scroll',function(){if(col._raf)cancelAnimationFrame(col._raf);col._raf=requestAnimationFrame(function(){_highlight(col);});if(col._loop){clearTimeout(col._settle);col._settle=setTimeout(function(){_loopSettle(col);},110);}else if(isYM){clearTimeout(col._settle);col._settle=setTimeout(function(){_rebuildDays(g);},120);}});}
function _rebuildDays(g){var yi=-1,mi=-1,di=-1;g.cols.forEach(function(c,i){if(c.t==='y')yi=i;if(c.t==='m')mi=i;if(c.t==='d')di=i;});if(di<0||mi<0)return;var mCol=g._cols[mi],month=g._items[mi][Math.round(mCol.scrollTop/44)]||0;var year=2000;if(yi>=0){var yCol=g._cols[yi];year=g._items[yi][Math.round(yCol.scrollTop/44)]||2000;}var max=month?_daysIn(year,month):31;if(g._items[di].length===max)return;var dCol=g._cols[di];var curDay=g._items[di][Math.round(dCol.scrollTop/44)]||1;var nv=[];for(var d=1;d<=max;d++)nv.push(d);g._items[di]=nv;var nIdx=Math.min(curDay,max)-1;var nc=_buildCol('d',nv);dCol.parentNode.replaceChild(nc,dCol);g._cols[di]=nc;_wheelAttach(nc,g,false);setTimeout(function(){nc.scrollTop=nIdx*44;_highlight(nc);},10);}
function openWheel(key){var g=WHEELG[key];if(!g)return;_wheelCur=g;if(g.time){try{_timeSeed(g);}catch(e){}}var wrap=document.getElementById('wheel-cols');Array.prototype.slice.call(wrap.querySelectorAll('.wheel-col')).forEach(function(c){c.parentNode.removeChild(c);});document.getElementById('wheel-title').textContent=g.title;g._items=[];g._cols=[];g.cols.forEach(function(c,ci){var vals=_wvals(c.t);g._items[ci]=vals;var cur=parseInt((document.getElementById(c.sel)||{}).value)||0;var idx=vals.indexOf(cur);if(idx<0)idx=(c.t==='y'?Math.min(vals.length-1,14):0);var col,ai;if(c.loop){col=_buildColLoop(c.t,vals);ai=_WLOOP_C*vals.length+idx;}else{col=_buildCol(c.t,vals);ai=idx;}wrap.appendChild(col);g._cols[ci]=col;_wheelAttach(col,g,(c.t==='y'||c.t==='m'));(function(cc,ii){setTimeout(function(){cc.scrollTop=ii*44;_highlight(cc);},20);})(col,ai);});openModal('wheel-sheet');setTimeout(function(){_rebuildDays(g);},60);}
function wheelDone(){var g=_wheelCur;if(!g)return;g.cols.forEach(function(c,i){var col=g._cols[i];if(!col)return;var idx=Math.round(col.scrollTop/44);var vals=g._items[i];var v;if(col._loop){var len=vals.length;v=vals[((idx%len)+len)%len];}else{v=vals[Math.max(0,Math.min(vals.length-1,idx))];}var sel=document.getElementById(c.sel);if(sel)sel.value=String(v);});if(g.time){try{_timeApply(g);}catch(e){}}else{updateWheelTrigger(g);}closeModal('wheel-sheet');_wheelCur=null;}
function wheelClearTime(){try{clearReminderTime();}catch(e){}closeModal('wheel-sheet');_wheelCur=null;}
function wheelCancel(){closeModal('wheel-sheet');_wheelCur=null;}
function updateWheelTrigger(g){var trg=document.getElementById(g.trg);if(!trg)return;var val=trg.querySelector('.dt-val');var parts=[];g.cols.forEach(function(c){var v=parseInt((document.getElementById(c.sel)||{}).value)||0;if(v>0)parts.push(_wlabel(c.t,v));});if(parts.length){val.textContent=parts.join(' ');val.className='dt-val';}else{val.textContent='선택';val.className='dt-val ph';}}
document.addEventListener('click',function(e){try{var c=e.target.closest&&e.target.closest('.post-card[data-pid]');if(c&&!e.target.closest('button')){openPostDetail(c.getAttribute('data-pid'));}}catch(err){}});


/* ══════════════════════════════════════════════════════════
   휴대폰 '뒤로가기' 버튼 처리
   모달 → 하위탭 → 홈 순으로 한 단계씩 되돌아가고,
   홈에서 한 번 더 누르면 종료 확인 후 앱을 나갑니다.
   ══════════════════════════════════════════════════════════ */
(function(){
  var _seq=0, _ignore=false, _exitAt=0, _suppress=false;
  window._curTab='home';

  function navPush(tag){ _seq++; try{ history.pushState({app:_seq,tag:tag},''); }catch(e){} }
  function navBack(){ if(_seq>0){ _ignore=true; try{history.back();}catch(e){_ignore=false;} } }
  window._navPush=navPush;

  /* ── 열려 있는 오버레이 중 가장 위의 것 닫기 ── */
  function closeTopOverlay(){
    var bd=document.getElementById('birthday-fullscreen');
    if(bd&&bd.classList.contains('open')){ try{closeBirthdayScreen();}catch(e){bd.classList.remove('open');} return true; }
    var co=document.getElementById('coach-overlay');
    if(co&&co.classList.contains('open')){ try{skipCoach();}catch(e){co.classList.remove('open');} return true; }
    var open=Array.prototype.filter.call(document.querySelectorAll('.modal-overlay.open'),function(m){return m.offsetParent!==null||true;});
    if(open.length){
      var m=open[open.length-1];
      if(m.id==='story-viewer-modal'){ try{closeStory();}catch(e){m.classList.remove('open');} }
      else{ try{closeModal(m.id);}catch(e){m.classList.remove('open');} }
      return true;
    }
    var sd=document.getElementById('screen-student-detail');
    if(sd&&sd.classList.contains('active')){ try{switchTab(window._prevTab||'admin');}catch(e){} return true; }
    /* 관리 탭의 하위 메뉴에 있으면 관리 홈으로 */
    if(window._curTab==='admin' && window._adminSub && window._adminSub!=='main'){
      window._adminSub='main';
      try{ _sat('main'); }catch(e){}
      return true;
    }
    return false;
  }

  /* ── openModal / closeModal 래핑 ── */
  var _open=window.openModal, _close=window.closeModal;
  window.openModal=function(id){
    var m=document.getElementById(id);
    var wasOpen=m&&m.classList.contains('open');
    _open(id);
    if(!wasOpen)navPush('modal:'+id);
  };
  window.closeModal=function(id){
    var m=document.getElementById(id);
    var wasOpen=m&&m.classList.contains('open');
    _close(id);
    if(wasOpen&&!_suppress)navBack();   /* 뒤로가기로 닫는 중이면 히스토리를 또 되감지 않음 */
  };

  /* ── switchTab 래핑 ── */
  var _st=window.switchTab;
  window.switchTab=function(tab,fromNav){
    if(!fromNav && tab && tab!==window._curTab){
      if(tab==='home'){
        /* 하단바로 홈에 갈 때는 쌓아둔 항목을 정리 */
        if(window._curTab!=='home'){ window._curTab='home'; var r=_st('home'); navBack(); return r; }
      }else if(window._curTab==='home'){
        if(tab==='admin')window._adminSub='main';
        navPush('tab:'+tab);              /* 홈 → 하위탭: 한 단계 추가 */
      }else{
        try{ history.replaceState({app:_seq,tag:'tab:'+tab},''); }catch(e){}   /* 탭끼리 이동: 깊이 유지 */
      }
    }
    if(tab)window._curTab=tab;
    return _st(tab);
  };

  /* ── 관리 탭의 하위 메뉴도 한 단계로 취급 ── */
  window._adminSub='main';
  var _sat=window.showAdminTab;
  if(typeof _sat==='function'){
    window.showAdminTab=function(tab,fromNav){
      if(!fromNav && tab && tab!==window._adminSub){
        if(tab==='main'){
          if(window._adminSub!=='main'){ window._adminSub='main'; var r=_sat('main'); navBack(); return r; }
        }else if(window._adminSub==='main'){
          navPush('admin:'+tab);                       /* 관리 홈 → 하위 메뉴 */
        }else{
          try{ history.replaceState({app:_seq,tag:'admin:'+tab},''); }catch(e){}   /* 하위끼리 이동 */
        }
      }
      if(tab)window._adminSub=tab;
      return _sat(tab);
    };
  }

  /* ── 생일 전체화면도 히스토리에 등록 ── */
  var _bs=window.showBirthdayScreen;
  if(typeof _bs==='function'){
    window.showBirthdayScreen=function(){ var r=_bs.apply(null,arguments); navPush('bday'); return r; };
  }

  window.addEventListener('popstate', function(){
    if(_ignore){ _ignore=false; _seq=Math.max(0,_seq-1); return; }
    _seq=Math.max(0,_seq-1);

    _suppress=true;
    var consumed=false;
    try{ consumed=closeTopOverlay(); }catch(e){}
    _suppress=false;
    if(consumed)return;

    if(window._curTab && window._curTab!=='home'){
      window._curTab='home';
      try{ _st('home'); }catch(e){}
      return;
    }

    /* 홈(최상위)에서 뒤로가기 → 2.5초 안에 한 번 더 누르면 종료 */
    var now=Date.now();
    if(now-_exitAt<2500){ _ignore=true; try{ history.back(); }catch(e){ _ignore=false; } return; }
    _exitAt=now;
    try{ history.pushState({app:0,tag:'guard'},''); }catch(e){}
    try{ showToast('뒤로가기를 한 번 더 누르면 앱이 종료돼요'); }catch(e){}
  });

  /* 최상위에 '보호막' 항목을 하나 깔아둬서, 홈에서 실수로 바로 나가지 않게 함 */
  try{ history.replaceState({app:0,tag:'root'},''); history.pushState({app:0,tag:'guard'},''); }catch(e){}
})();
