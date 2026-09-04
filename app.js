
let G={role:'',type:'',grade:'',gradeKey:'',name:'',baptism:'',displayName:'',id:'',attendTotal:0,streak:0,isAdmin:false,isJabumo:false,childCount:1,regRole:'student',notifMode:'vibrate',birthMonth:0,birthDay:0,feastMonth:0,feastDay:0};
try{var _nm0=localStorage.getItem('hd-notif-mode');if(_nm0==='vibrate'||_nm0==='silent')G.notifMode=_nm0;}catch(e){}
try{_saveNotifModeIDB(G.notifMode);}catch(e){}
let pendingList=[];
let _plinkIdx=-1;
let calResponses=[];
let posts=[],diaryData=[],reminderData=[],birthdayComments=[],bdayLikes=[],currentPostId=null,notifications=[],letters=[];
let coupons=[];
let hymnData=[];   /* 주간 성가·전례: {id,date:'2026-07-04',label:'연중 제15주일',items:{입당:'814',...},note:''} */
let litData=[];    /* 주간 전례: {id,date,label,reading1,reading2,gospel,note} */
function pad2(n){return n<10?'0'+n:''+n;}
function toDateStr(d){return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());}
function getSaturdays(count){const dates=[];let d=new Date();d.setHours(0,0,0,0);const dow=d.getDay();const diff=dow===6?0:(dow+1)%7;d.setDate(d.getDate()-diff);for(let i=0;i<count;i++){dates.push(toDateStr(d));d.setDate(d.getDate()-7);}return dates;}
function getUpcomingSaturdays(count){const dates=[];let d=new Date();d.setHours(0,0,0,0);const dow=d.getDay();const diff=(6-dow+7)%7;d.setDate(d.getDate()+diff);for(let i=0;i<count;i++){dates.push(toDateStr(d));d.setDate(d.getDate()+7);}return dates;}
function currentSaturday(){return getUpcomingSaturdays(1)[0];}
function attendSat(){return getSaturdays(1)[0];}
function isVacationDate(dateStr){return vacationDates.includes(dateStr);}
function isEduVacation(dateStr){return eduVacationDates.includes(dateStr);}
function computeStreak(u){const weeks=getSaturdays(60).filter(d=>!isVacationDate(d));let streak=0;for(const w of weeks){if((u.attendedWeeks||[]).includes(w))streak++;else break;}return streak;}
function currentYM(){const n=new Date();return n.getFullYear()+'-'+pad2(n.getMonth()+1);}
function monthAttendCount(u){const ym=currentYM();return (u.attendedWeeks||[]).filter(w=>w.startsWith(ym)).reduce((s,w)=>s+((u.halfWeeks||[]).includes(w)?0.5:1),0);}
let eventsData=[];
let photosData=[];
let eventSlideTimer=null,eventSlideIdx=0,storyList=[],storyIdx=0,storyImgIdx=0,storyTimer=null,currentBoardCat='notice';
function purgeDemoData(){const ids=['teacher1','teacher2','teacher3','student1','student2','student3','student4','student5','parent1'];const idSet=new Set(ids);const demoNameRe=/이도윤|김하늘|박시우|정예은|한지호|김민준|박서연|이수진|정예은|최지훈/;const isDemoCoupon=function(c){return !!(c&&(c.demo||/(^|-)demo/i.test(String(c.id||''))||(c.studentId&&idSet.has(c.studentId))||demoNameRe.test(c.studentName||'')));};pendingList=pendingList.filter(u=>!u.demo&&!ids.includes(u.id));const _badCoupons=coupons.filter(isDemoCoupon).map(c=>c.id);if(window.FB&&FB.enabled()){FB.ready(function(){_badCoupons.forEach(function(cid){try{FB.remove('coupons',cid);}catch(e){}});['cp-demo1','cp-demo2','cp-demo3'].forEach(function(cid){try{FB.remove('coupons',cid);}catch(e){}});});}posts=posts.filter(p=>!p.demo);diaryData=diaryData.filter(d=>!d.demo);coupons=coupons.filter(c=>!isDemoCoupon(c));notifications=notifications.filter(n=>!n.demo);birthdayComments=birthdayComments.filter(c=>!c.demo);bdayLikes=bdayLikes.filter(k=>_lkId(k).indexOf('student1|')!==0);eventsData=eventsData.filter(e=>!['ev1','ev2'].includes(e.id));photosData=photosData.filter(p=>!['ph1','ph2','ph3'].includes(p.id));vacationDates=vacationDates.filter(d=>d!=='2026-05-02');if(window.FB&&FB.enabled()){FB.ready(function(){try{var _dc={coupons:['cp-demo1','cp-demo2','cp-demo3'],posts:['p-demo1','p-demo2','p-demo3','p-demo4','p-demo5'],diaries:['d-demo1','d-demo2'],birthdayComments:['bc-d1','bc-d2','bc-d3'],eventBanners:['ev1','ev2'],photos:['ph1','ph2','ph3']};Object.keys(_dc).forEach(function(c){_dc[c].forEach(function(id){try{FB.remove(c,id);}catch(e){}});});}catch(e){}});}}
const VAC_MSG_DEFAULT={eduTitle:'📖 {날짜} 교리방학 안내',eduBody:'이번 주는 교리방학으로 교리수업이 없습니다.\n부서활동은 오후 6시 40분부터 진행됩니다. 성당에서 만나요~ 🙏',fullTitle:'🏖️ {날짜} 주일학교 방학 안내',fullBody:'이번 주는 주일학교 방학(미사없음)으로 교리수업·부서활동·학생미사가 모두 없습니다.\n주일미사는 각자 꼭 봉헌해주세요 ⛪ 다음 주 토요일에 만나요! 😊'};
let appConfig={title:'하늘의문 중고등부 주일학교',color:'#5B9BD5',verse:'하느님은 사랑이십니다.',verseRef:'1요한 4,8',notionUrl:'',driveFolders:null,termStart:'',vacMsg:{...VAC_MSG_DEFAULT},bdayReward:'생일 축하 간식 세트 🎁'};
/* -- cloud-persisted state (settings): 방학일 / 졸업편지 공개 / 관리자 투표 -- */
(function(){
  function arrProp(name,key){Object.defineProperty(window,name,{configurable:true,get:function(){if(!appConfig[key])appConfig[key]=[];return appConfig[key];},set:function(v){appConfig[key]=v||[];}});}
  arrProp('vacationDates','vacDates');
  arrProp('eduVacationDates','eduVacDates');
  Object.defineProperty(window,'gradLetterOpen',{configurable:true,get:function(){return !!appConfig.gradLetterOpen;},set:function(v){appConfig.gradLetterOpen=!!v;}});
  Object.defineProperty(window,'adminVote',{configurable:true,get:function(){return appConfig.adminVote||null;},set:function(v){appConfig.adminVote=v||null;}});
})();
let previewMode=false,previewBackupUser=null,currentLoginUser=null;
function startPreview(role){if(!previewMode){previewBackupUser=currentLoginUser;previewMode=true;}const samples={student:{role:'student',name:'미리보기',baptism:'요셉',id:'preview-student',gradeKey:'m1',gradeLabel:'중1',attendTotal:5,streak:2,approved:true,birthMonth:0,birthDay:0,feastMonth:0,feastDay:0,children:[]},parent:{role:'parent',name:'미리보기',baptism:'안나',id:'preview-parent',children:[{name:'김하늘'}],approved:true,isJabumo:false,birthMonth:0,birthDay:0,feastMonth:0,feastDay:0},teacher:{role:'teacher',name:'미리보기',baptism:'베드로',id:'preview-teacher',teacherType:'m1',gradeLabel:'중1',approved:true,isAdmin:false,birthMonth:0,birthDay:0,feastMonth:0,feastDay:0}};const labels={student:'학생',parent:'학부모',teacher:'교사'};if(role==='student'){const real=pendingList.find(u=>u.approved&&u.role==='student'&&!u.hidden&&!u.graduated);if(real)samples.student=Object.assign({},real);}try{startSession(samples[role]);}catch(e){document.getElementById('bottom-nav').style.display='flex';goScreen('home');switchTab('home');showToast('미리보기 화면 전환 중 일부 요소를 불러오지 못했어요');}setPreviewBarVisible(true,'🔍 미리보기 모드: '+labels[role]+' 화면');}
function exitPreview(){previewMode=false;setPreviewBarVisible(false);if(previewBackupUser){startSession(previewBackupUser);switchTab('admin');showAdminTab('settings');}}
function setPreviewBarVisible(v,text){const bar=document.getElementById('preview-bar');if(bar)bar.style.display=v?'flex':'none';document.querySelectorAll('.app-header').forEach(h=>h.style.marginTop=v?'34px':'0');const t=document.getElementById('preview-bar-text');if(v&&t)t.textContent=text;}
function loadAppConfigForm(){try{loadThemeGreetInputs();}catch(e){}try{applyLogo();}catch(e){}document.getElementById('cfg-title').value=appConfig.title;document.getElementById('cfg-color').value=appConfig.color;document.getElementById('cfg-verse').value=appConfig.verse;document.getElementById('cfg-verse-ref').value=appConfig.verseRef;document.getElementById('cfg-notion-url').value=appConfig.notionUrl||'';try{renderDriveCfg();}catch(e){}const vm=appConfig.vacMsg||VAC_MSG_DEFAULT;document.getElementById('cfg-vac-edu-title').value=vm.eduTitle;document.getElementById('cfg-vac-edu-body').value=vm.eduBody;document.getElementById('cfg-vac-full-title').value=vm.fullTitle;document.getElementById('cfg-vac-full-body').value=vm.fullBody;document.getElementById('cfg-reward-bday').value=appConfig.bdayReward||BDAY_REWARD_DEFAULT;ATTEND_LEVELS.forEach(L=>{const el=document.getElementById('cfg-reward-'+L.n);if(el)el.value=L.r||'';});}
/* 오늘의 말씀: 수정 권한이 있으면 눌러서 바로 편집 */
function _canEditVerse(){return G.role==='teacher'&&(G.type==='principal'||G.isAdmin);}
function goEditVerse(){
  if(!_canEditVerse())return;
  switchTab('admin');showAdminTab('settings');
  setTimeout(function(){
    try{
      var head=Array.prototype.find.call(document.querySelectorAll('#admin-settings-tab .cfg-sec-head'),
        function(b){return (b.textContent||'').indexOf('오늘의 말씀')>=0;});
      if(head){
        var sec=head.parentElement;
        if(sec&&!sec.classList.contains('open'))sec.classList.add('open');
        sec.scrollIntoView({behavior:'smooth',block:'center'});
        var ta=document.getElementById('cfg-verse');if(ta)setTimeout(function(){ta.focus();},320);
      }
    }catch(e){}
  },220);
}
function updateWeeklyBtn(){
  var b=document.getElementById('weekly-bell');
  if(!b)return;
  var on=(typeof _isWeeklyWatcher==='function')&&_isWeeklyWatcher();
  b.style.display=on?'':'none';
  /* 이번 주 공지가 아직 없으면 빨간 점 */
  var d=document.getElementById('weekly-dot');
  if(d)d.style.display=(on&&typeof _wnPost==='function'&&!_wnPost(_wnSat()))?'block':'none';
}
function updateVerseEditUI(){try{updateWeeklyBtn();}catch(e){}
  var can=_canEditVerse();
  var c=document.getElementById('verse-card');
  if(c){c.style.cursor=can?'pointer':'';c.onclick=can?goEditVerse:null;}
}
/* ══ 주간공지 ══ */
var WN_TIME_DEFAULT='교리 18:00 | 부서활동 18:40 | 미사 19:30';
function _wnSat(){return currentSaturday();}
function _wnTitle(ds){var d=(ds||_wnSat()).split('-');return (+d[1])+'월 '+(+d[2])+'일 주간공지';}
function _wnId(ds){return 'wn-'+(ds||_wnSat());}
function _wnPost(ds){var id=_wnId(ds);return posts.find(function(p){return p.id===id;})||null;}
function _canWriteWeekly(){return G.role==='teacher'&&(G.type==='principal'||G.type==='admin');}
function _isWeeklyWatcher(){return G.role==='teacher'&&(G.type==='principal'||G.type==='admin'||G.isAdmin);}
function openWeeklyNotice(){
  if(!_isWeeklyWatcher()){showToast('교감·교무만 작성할 수 있어요');return;}
  var sat=_wnSat(), ex=_wnPost(sat);
  try{if(ex)loadAttachBuf('wn',ex);else resetAttachBuf('wn');}catch(e){}
  var mine=ex&&ex.authorId===G.id;
  var readOnly=!_canWriteWeekly()||(ex&&!mine);
  document.getElementById('wn-title').textContent='📢 '+_wnTitle(sat)+(ex?(mine?' (수정)':' (게시됨)'):'');
  var sb=document.getElementById('wn-submit');
  sb.textContent=ex?'수정하고 전체 알림 보내기':'게시하고 전체 알림 보내기';
  sb.style.display=readOnly?'none':'';
  var lock=document.getElementById('wn-lock');
  if(lock){
    lock.style.display=readOnly?'':'none';
    lock.innerHTML=!_canWriteWeekly()
      ? '🔒 주간공지는 <b>교감·교무</b>가 작성합니다'
      : (ex?('✅ <b>'+_esc(ex.authorName||'')+'</b> 님이 이미 올렸어요 · 수정은 작성자만 할 수 있어요'):'');
  }
  ['wn-lines','wn-time','wn-time-on'].forEach(function(id){var e=document.getElementById(id);if(e){e.disabled=readOnly;e.style.opacity=readOnly?'.6':'';}});
  var bar=document.getElementById('wn-fill-bar');if(bar)bar.style.display=readOnly?'none':'flex';
  var t=document.getElementById('wn-time');
  t.value=(appConfig&&appConfig.wnTime)||WN_TIME_DEFAULT;
  var ta=document.getElementById('wn-lines');
  if(ex){
    var parsed=_wnParse(ex.content||'');
    ta.value=parsed.lines.join('\n');
    document.getElementById('wn-time-on').checked=!!parsed.time;
    if(parsed.time)t.value=parsed.time;
  }else{
    ta.value='';
    document.getElementById('wn-time-on').checked=true;
    if(isVacationDate(sat)||isEduVacation(sat))wnFillVacation();
    else wnFillLast();
  }
  wnPreview();
  try{_resetSchedUI('wn');}catch(e){}
  var _wpu=document.getElementById('wn-popup-until');if(_wpu)_wpu.value=_defaultPopupUntil();
  openModal('weekly-notice-modal');
}
/* 저장된 공지 본문에서 안내 줄과 시간표를 되읽기 */
function _wnParse(txt){
  var lines=[],time='';
  String(txt||'').split(/\r?\n/).forEach(function(l){
    l=l.trim();if(!l)return;
    if(l.indexOf('- ')===0){time=l.slice(2).trim();return;}
    lines.push(l.replace(/^✔\s*/,''));
  });
  return {lines:lines,time:time};
}
function wnFillLast(){
  var prev=posts.filter(function(p){return p.id&&p.id.indexOf('wn-')===0&&p.id!==_wnId();})
    .sort(function(a,b){return (b.ts||0)-(a.ts||0)})[0];
  if(!prev){showToast('불러올 지난 공지가 없어요');return;}
  var pr=_wnParse(prev.content||'');
  document.getElementById('wn-lines').value=pr.lines.join('\n');
  if(pr.time)document.getElementById('wn-time').value=pr.time;
  wnPreview();
}
function wnFillVacation(){
  var sat=_wnSat(), edu=isEduVacation(sat);
  var vm=(appConfig&&appConfig.vacMsg)||{};
  var body=edu?'이번주는 교리방학입니다. 부서활동만 진행됩니다.':'이번주는 주일학교 방학입니다. 교리와 미사가 없습니다.';
  document.getElementById('wn-lines').value=body;
  document.getElementById('wn-time-on').checked=!edu;
  wnPreview();
}
function _wnBuild(){
  var lines=(document.getElementById('wn-lines').value||'').split(/\r?\n/)
    .map(function(l){return l.trim();}).filter(Boolean);
  var out=lines.map(function(l){return '✔ '+l;}).join('\n');
  if(document.getElementById('wn-time-on').checked){
    var t=(document.getElementById('wn-time').value||'').trim();
    if(t)out+=(out?'\n\n':'')+'- '+t;
  }
  return out;
}
function wnPreview(){
  var el=document.getElementById('wn-preview');if(!el)return;
  var b=_wnBuild();
  el.textContent=b||'안내를 입력하면 여기에 보여요';
  el.style.color=b?'var(--text)':'var(--text-light)';
}
function submitWeeklyNotice(){
  if(!_canWriteWeekly()){showToast('교감·교무만 올릴 수 있어요');return;}
  var _ex0=_wnPost(_wnSat());
  if(_ex0&&_ex0.authorId!==G.id){showToast('이미 다른 분이 올렸어요');return;}
  var body=_wnBuild();
  if(!body){showToast('안내 내용을 입력해주세요');return;}
  var sat=_wnSat(), id=_wnId(sat), title=_wnTitle(sat), ex=_wnPost(sat);
  var _wnPuEl=document.getElementById('wn-popup-until');var _wnPopupUntil=_wnPuEl&&_wnPuEl.value?_endOfDayMs(_wnPuEl.value):0;
  var n=(document.getElementById('wn-time').value||'').trim();
  if(n)appConfig.wnTime=n;
  var _wsdt=_schedDT('wn');if(_wsdt===false)return;
  if(_wsdt){
    if(ex){showToast('이미 게시된 주간공지는 예약할 수 없어요');return;}
    if(!confirm('⏰ '+_wsdt.date+' '+_wsdt.time+'에 "'+title+'"을(를) 예약 발송할까요?'))return;
    var _wimgs2=(attachBuf.wn&&attachBuf.wn.imgs?attachBuf.wn.imgs:[]).map(function(e){return bufSrc(e);}).filter(Boolean);
    var _wp={id:id,title:title,content:body,cat:'notice',target:'all',grade:'all',isImportant:true,popupUntil:_wnPopupUntil,authorId:G.id,authorName:G.displayName,comments:[],edited:false};
    if(_wimgs2.length){_wp.images=_wimgs2.map(function(s){return {src:s};});_wp.image=_wimgs2[0];}
    var _wnf={id:'nt-'+id,text:'📢 '+title+'이(가) 올라왔어요',forRole:'all',tap:{type:'post',postId:id}};
    _saveScheduledPost('weekly',_wp,_wnf,_wsdt);
    try{resetAttachBuf('wn');}catch(e){}try{_resetSchedUI('wn');}catch(e){}
    closeModal('weekly-notice-modal');
    showToast('⏰ 주간공지를 예약 발송으로 등록했어요 ('+_wsdt.date+' '+_wsdt.time+')');
    return;
  }
  if(!confirm('📣 전체(학생·학부모·교사)에게 알림이 갑니다.\n\n"'+title+'"을(를) '+(ex?'수정':'게시')+'할까요?'))return;
  var _wimgs=(attachBuf.wn&&attachBuf.wn.imgs?attachBuf.wn.imgs:[]).map(function(e){return bufSrc(e);}).filter(Boolean);
  if(ex){ ex.title=title; ex.content=body; ex.edited=true; ex.ts=Date.now(); ex.isImportant=true; ex.popupUntil=_wnPopupUntil; delete ex.popupDays; if(_wimgs.length){ex.images=_wimgs.map(function(s){return {src:s};});ex.image=_wimgs[0];}else{delete ex.images;ex.image='';} }
  else{
    var _np={id:id,ts:Date.now(),pushed:false,title:title,content:body,cat:'notice',target:'all',grade:'all',isImportant:true,popupUntil:_wnPopupUntil,
      date:_todayDot(),authorId:G.id,authorName:G.displayName,comments:[],edited:false};
    if(_wimgs.length){_np.images=_wimgs.map(function(s){return {src:s};});_np.image=_wimgs[0];}
    posts.unshift(_np);
  }
  try{
    notifications=notifications.filter(function(x){return x.id!=='nt-'+id;});
    notifications.unshift({pushed:false,id:'nt-'+id,text:'📢 '+title+'이(가) 올라왔어요',time:'방금',ts:Date.now(),
      readBy:[],forRole:'all',tap:{type:'post',postId:id}});
    updateNotifDot();
  }catch(e){}
  try{if(typeof flushSync==='function')flushSync();}catch(e){}
  try{resetAttachBuf('wn');}catch(e){}
  try{renderHomeNotices();}catch(e){}try{fbRefreshBoard();}catch(e){}try{updateWeeklyBtn();}catch(e){}
  closeModal('weekly-notice-modal');
  showToast(ex?'주간공지를 수정했어요':'주간공지를 올렸어요 · 전체 알림 발송');
}
/* 목요일 알림 — 그 주에 한 번만 */
function checkThursdayNotice(){
  try{
    if(!(G&&G.id))return;
    var n=new Date();
    if(n.getDay()!==4||n.getHours()<10)return;           /* 목요일 오전 10시 이후 */
    var sat=_wnSat();
    if(_wnPost(sat))return;                               /* 이미 올렸으면 안 보냄 */
    /* 교감·교무·관리자에게만 개별 발송 */
    var targets=pendingList.filter(function(u){
      return u.approved&&u.role==='teacher'&&!u.hidden&&(u.teacherType==='principal'||u.teacherType==='admin'||u.isAdmin);
    });
    var made=false;
    targets.forEach(function(u){
      var nid='nt-wnrem-'+sat+'-'+u.id;
      if(notifications.some(function(x){return x.id===nid;}))return;
      notifications.unshift({pushed:false,id:nid,text:'📢 <b>'+_wnTitle(sat)+'</b>를 올려주세요 (목요일)',
        time:'방금',ts:Date.now(),readBy:[],forTeacherId:u.id,tap:{type:'weekly-notice'}});
      made=true;
    });
    if(!made)return;
    updateNotifDot();

    try{if(typeof flushSync==='function')flushSync();}catch(e){}
  }catch(e){}
}
function applyAppConfig(){try{if(appConfig.levelRewards)ATTEND_LEVELS.forEach(function(L){if(appConfig.levelRewards[L.n])L.r=appConfig.levelRewards[L.n];});}catch(e){}const S=SEASONS[appConfig.season||'ordinary']||SEASONS.ordinary;const titleEl=document.getElementById('app-title-text');if(titleEl)titleEl.textContent=(S.pfx||'')+appConfig.title;if(!S.v['--primary'])document.documentElement.style.setProperty('--primary',appConfig.color);const verseEl=document.getElementById('weekly-verse');if(verseEl)verseEl.innerHTML='"'+appConfig.verse+'"<br><span style="font-size:11px;font-weight:400;color:var(--text-sub)">— '+appConfig.verseRef+'</span>';}
function saveAppConfig(){appConfig.title=(document.getElementById('cfg-title').value||'').trim()||appConfig.title;appConfig.color=document.getElementById('cfg-color').value||appConfig.color;appConfig.verse=(document.getElementById('cfg-verse').value||'').trim()||appConfig.verse;appConfig.verseRef=(document.getElementById('cfg-verse-ref').value||'').trim()||appConfig.verseRef;appConfig.notionUrl=(document.getElementById('cfg-notion-url').value||'').trim();try{collectDriveCfg();}catch(e){}appConfig.vacMsg={eduTitle:(document.getElementById('cfg-vac-edu-title').value||'').trim()||VAC_MSG_DEFAULT.eduTitle,eduBody:(document.getElementById('cfg-vac-edu-body').value||'').trim()||VAC_MSG_DEFAULT.eduBody,fullTitle:(document.getElementById('cfg-vac-full-title').value||'').trim()||VAC_MSG_DEFAULT.fullTitle,fullBody:(document.getElementById('cfg-vac-full-body').value||'').trim()||VAC_MSG_DEFAULT.fullBody};appConfig.bdayReward=(document.getElementById('cfg-reward-bday').value||'').trim()||BDAY_REWARD_DEFAULT;appConfig.levelRewards=appConfig.levelRewards||{};ATTEND_LEVELS.forEach(L=>{const el=document.getElementById('cfg-reward-'+L.n);if(el){const v=(el.value||'').trim();if(v){L.r=v;appConfig.levelRewards[L.n]=v;}}});applyAppConfig();renderResourceList();try{if(window.flushCfg)window.flushCfg();}catch(e){}showToast('앱 설정이 저장되었습니다');}
function startNewSchoolYear(term){if(!_autoPromote&&!(G.type==='principal'||G.type==='admin'||G.isAdmin)){showToast('교감·교무·관리자만 실행할 수 있어요');return;}if(!_autoPromote&&!confirm('새 학년도를 시작할까요?\n\n보관: 올해 출석·등급 기록 → 학생별 연혁\n진급: 전 학생 한 학년 승급, 고3은 졸업 처리\n새로 시작: 출석, 등급, 쿠폰, 결석·연락 기록, 방학 지정\n유지: 회원 계정, 게시물, 다이어리, 왕관 이력\n\n실행 후 되돌릴 수 없습니다.'))return false;if(!_autoPromote&&!confirm('새 학년도를 시작합니다. 마지막 확인입니다.'))return false;const yr=new Date().getFullYear();
  const _to=term?term.end:toDateStr(new Date());
  let _from=term?term.start:((appConfig&&appConfig.termStart)||'');
  if(!_from){ const _all=[];pendingList.forEach(x=>{(x.attendedWeeks||[]).forEach(w=>_all.push(w));});_all.sort();_from=_all[0]||_to; }
  const _term=(term?term.yr:(_from?_from.slice(0,4):String(yr)))+'학년도';try{appConfig.promoteBackup={yr:(term?term.yr+1:yr),at:_to,snap:pendingList.filter(function(u){return u.role==='student'||u.role==='teacher';}).map(function(u){return {id:u.id,role:u.role,gradeKey:u.gradeKey,gradeLabel:u.gradeLabel,graduated:!!u.graduated,teacherType:u.teacherType};})};}catch(e){}
  pendingList.filter(u=>u.role==='student').forEach(u=>{const t=u.attendTotal||0;if(t>0||(u.attendedWeeks||[]).length){let lv='🌱 씨앗';for(const L of ATTEND_LEVELS)if(t>=L.n)lv=L.l;u.history=u.history||[];u.history.push({year:yr,term:_term,from:_from,to:_to,grade:u.gradeLabel||'',attendTotal:t,level:lv,weeks:(u.attendedWeeks||[]).slice(),halfWeeks:(u.halfWeeks||[]).slice()});}u.attendedWeeks=[];u.halfWeeks=[];u.qrScanAt={};u.attendTotal=0;u.streak=0;u.earnedLevels=[];u.absentAckWeek=null;u.absentAckBy=null;u.lastContactAt=null;u.lastContactBy=null;if(!(_promoteExemptFrom&&u.joinedAt&&u.joinedAt>=_promoteExemptFrom)){if(u.gradeKey==='h'){const gy=((u.gradeLabel||'').match(/고(\d)/)||[])[1];if(gy==='3'){u.graduated=true;u.graduatedYear=yr;}else if(gy==='2')u.gradeLabel='고3';else if(gy==='1')u.gradeLabel='고2';}else if(u.gradeKey==='m3'){u.gradeKey='h';u.gradeLabel='고1';}else if(u.gradeKey==='m2'){u.gradeKey='m3';u.gradeLabel='중3';}else if(u.gradeKey==='m1'){u.gradeKey='m2';u.gradeLabel='중2';}}});try{appConfig.termStart=_to;}catch(e){}coupons=[];vacationDates=[];eduVacationDates=[];absentNotifiedKeys={};notifications=notifications.filter(n=>!n.absentUid&&!(n.tap&&(n.tap.type==='coupon'||n.tap.type==='coupon-admin')));updateNotifDot();renderAdminGrid(G.type==='principal'||G.type==='admin'||G.isAdmin);renderAttendList();renderAttendStats();renderAbsentAlerts();renderAdminCouponList();pendingList.filter(function(u){return u.role==='teacher'&&u.approved&&!(u.teacherType==='principal'||u.teacherType==='admin'||u.isAdmin);}).forEach(function(u){u.teacherType='etc';u.gradeLabel='기타';});try{if(typeof flushSync==='function')flushSync();}catch(e){}showToast('🎓 새 학년도 시작 · '+_term+' · 학생 진급·기록 보관, 교사 담당학년 초기화 완료');return true;}
function _gEsc(x){return String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function _gLatin(t){return /^[\sA-Za-z0-9.,!'"?&:;()\-]+$/.test(t||'');}
function applyThemeGreet(k){var d=SEASON_GREET[k]||null;var c=(typeof appConfig!=='undefined'&&appConfig.greets)?appConfig.greets[k]:null;var t=(c&&c.t)||(d&&d.t)||'';var sub=(c&&(c.sub!=null&&c.sub!==''))?c.sub:((c&&c.t)?'':((d&&d.sub)||''));var _ff=(typeof appConfig!=='undefined'&&appConfig.greetFont)||'gothic';var _fc=(_ff==='gothic')?'':' tg-f-'+_ff;var els=document.querySelectorAll('.theme-greet');for(var i=0;i<els.length;i++){var el=els[i];var tt=t,ss=sub;if(!tt&&el.id==='cfg-greet-preview'){tt='하늘의문 중고등부';ss='이 글씨체로 보여요';}if(!tt){el.style.display='none';el.innerHTML='';continue;}var _L=(tt||'').replace(/\s/g,'').length;var sc=_L<=8?' tg-s1':_L<=18?' tg-s2':_L<=34?' tg-s3':' tg-s4';el.style.display='block';el.innerHTML='<div class="tg-main'+sc+_fc+'">'+_gEsc(tt)+'</div>'+(ss?'<div class="tg-sub">'+_gEsc(ss)+'</div>':'');}}
function saveThemeGreet(){var k=(typeof appConfig!=='undefined'&&appConfig.season)||'ordinary';var t=(document.getElementById('cfg-greet-main').value||'').trim();var sub=(document.getElementById('cfg-greet-sub').value||'').trim();appConfig.greets=appConfig.greets||{};if(!t&&!sub){delete appConfig.greets[k];}else{appConfig.greets[k]={t:t,sub:sub};}try{applyThemeGreet(k);}catch(e){}showToast('로그인 인사 문구를 저장했어요');}
function loadThemeGreetInputs(){var k=(typeof appConfig!=='undefined'&&appConfig.season)||'ordinary';var mi=document.getElementById('cfg-greet-main'),si=document.getElementById('cfg-greet-sub');if(!mi||!si)return;var c=(appConfig.greets||{})[k];var d=SEASON_GREET[k];mi.value=c?(c.t||''):'';si.value=c?(c.sub||''):'';mi.placeholder=(d&&d.t)||'예: Merry Christmas!';si.placeholder=(d&&d.sub)||'부제 (선택)';var lbl=document.getElementById('cfg-greet-theme');if(lbl)lbl.textContent=(SEASONS[k]&&SEASONS[k].n)||k;var fsel=document.getElementById('cfg-greet-font');if(fsel)fsel.value=(appConfig.greetFont||'gothic');try{applyThemeGreet(k);}catch(e){}}
function setGreetFont(v){if(typeof appConfig==='undefined')return;appConfig.greetFont=v;var k=(_seasonPreview!=null?_seasonPreview:(appConfig.season||'ordinary'));try{applyThemeGreet(k);}catch(e){}showToast('글씨체를 바꿨어요');}
function applySeason(k,_pv){const S=SEASONS[k]||SEASONS.ordinary;const st=document.documentElement.style;SEASON_RESET.forEach(p=>st.removeProperty(p));Object.entries(S.v).forEach(([p,v])=>st.setProperty(p,v));if(!S.v['--primary'])st.setProperty('--primary',appConfig.color);if(!_pv)appConfig.season=k;
let se=document.getElementById('season-style');if(se)se.remove();
const img=(appConfig.seasonImgs||{})[k]||S.builtImg;
if(img||S.hero){se=document.createElement('style');se.id='season-style';const DARK_BANNER={advent:1,christmas:1,winterretreat:1};const isDk=DARK_BANNER[k];const ov=isDk?'linear-gradient(180deg,rgba(0,0,0,.24) 0%,rgba(0,0,0,.10) 45%,rgba(0,0,0,.36) 100%)':'linear-gradient(180deg,rgba(255,255,255,.07) 0%,rgba(255,255,255,0) 42%,rgba(0,0,0,.05) 100%)';const EDGE={advent:'#4F3B48',christmas:'#D7AA9E',lent:'#5C4426',easter:'#8FBB63',springpicnic:'#6BA858',summercamp:'#E1C177',winterretreat:'#FFFFFF'};const edgeC=EDGE[k]||S.hero;const bgv=img?`${ov},url(${img}) top/100% auto no-repeat,${edgeC}`:`${ov},${S.hero}`;const bfg=isDk?'#fff':'#1E1C28';const bbg=isDk?'rgba(255,255,255,.20)':'rgba(0,0,0,.05)';const bbd=isDk?'rgba(255,255,255,.36)':'rgba(0,0,0,.13)';const bsh=isDk?'0 1px 3px rgba(0,0,0,.55)':'0 1px 2px rgba(255,255,255,.5)';se.textContent=`.teacher-banner,.home-banner{background:${bgv}!important;color:${bfg}!important}.teacher-banner *,.home-banner *{text-shadow:${bsh}}.teacher-banner button,.home-banner button{color:${bfg}!important;background:${bbg}!important;border-color:${bbd}!important}.teacher-banner button svg,.home-banner button svg{stroke:${bfg}!important}`;document.head.appendChild(se);}
let deco=document.getElementById('season-deco');if(deco)deco.remove();
if(S.fall&&S.fall.length){deco=document.createElement('div');deco.id='season-deco';deco.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:4;overflow:hidden';
for(let i2=0;i2<(S.cnt||0);i2++){const e=document.createElement('span');e.textContent=S.fall[i2%S.fall.length];const dur=S.spd[0]+Math.random()*(S.spd[1]-S.spd[0]);e.style.cssText=`position:absolute;top:-6vh;left:${Math.random()*96}%;font-size:${11+Math.random()*11}px;opacity:${.45+Math.random()*.4};animation:sFall ${dur}s linear ${-Math.random()*dur}s infinite`;deco.appendChild(e);}
document.body.appendChild(deco);}
const b=document.getElementById('season-banner');if(b)b.remove();
document.body.style.background='';
const t=document.getElementById('app-title-text');if(t)t.textContent=(S.pfx||'')+appConfig.title;
document.querySelectorAll('.season-accent').forEach(n=>n.remove());const art=S.art||{};const acc=S.accents||[];const spots=[{sel:'#home-reminder-list',img:art.reminder,em:acc[0],pos:'right:12px;bottom:12px',size:64,rot:-3},{sel:'#weekly-verse',img:art.verse,em:acc[1],pos:'right:10px;bottom:6px',size:82,rot:0}];spots.forEach(sp=>{const t=document.querySelector(sp.sel);if(!t)return;if(!sp.img&&!sp.em)return;const span=document.createElement('span');span.className='season-accent';span.style.cssText=`position:absolute;${sp.pos};width:${sp.size}px;height:${sp.size}px;transform:rotate(${sp.rot}deg);opacity:.96;pointer-events:none;filter:drop-shadow(0 3px 6px rgba(0,0,0,.13));z-index:2`;if(sp.img){span.style.background=`url(${sp.img}) center/contain no-repeat`;}else{span.style.cssText+=`;font-size:${Math.round(sp.size*.5)}px;display:flex;align-items:flex-end;justify-content:flex-end`;span.textContent=sp.em;}if(getComputedStyle(t).position==='static')t.style.position='relative';t.appendChild(span);});
var _DKG={advent:['#F2EAFF','#CDB9EC','#B7A0DE'],christmas:['#FFEEDC','#EBC49E','#D8AE8C'],winterretreat:['#EDF4FF','#BDD3EE','#A6C1E0']};var _dg=_DKG[k];if(_dg){st.setProperty('--tg-main-c',_dg[0]);st.setProperty('--tg-sub-c',_dg[1]);st.setProperty('--tg-desc-c',_dg[2]);st.setProperty('--intro-logo-filter','brightness(0) invert(1)');}else{st.removeProperty('--tg-main-c');st.removeProperty('--tg-sub-c');st.removeProperty('--tg-desc-c');st.removeProperty('--intro-logo-filter');}
try{var _mtc=document.querySelector('meta[name="theme-color"]');if(_mtc)_mtc.setAttribute('content',(S.v&&S.v['--primary'])||appConfig.color||'#2FA595');}catch(e){}
st.setProperty('--intro-hero',S.hero||'linear-gradient(160deg,#E2F6F1 0%,#B4E7DD 50%,#8AD6C9 100%)');try{applyThemeGreet(k);}catch(e){}renderSeasonBtns(_pv?k:null);}
function uploadSeasonImg(inp){const f=inp.files&&inp.files[0];if(!f)return;compressImg(f,1080,0.7).then(function(data){if(!data){showToast('이미지를 불러오지 못했어요');return;}appConfig.seasonImgs=appConfig.seasonImgs||{};appConfig.seasonImgs[appConfig.season||'ordinary']=data;applySeason(appConfig.season||'ordinary');showToast('🖼️ 현재 시기 배경 그림이 적용되었어요');});inp.value='';}
function clearSeasonImg(){appConfig.seasonImgs=appConfig.seasonImgs||{};delete appConfig.seasonImgs[appConfig.season||'ordinary'];applySeason(appConfig.season||'ordinary');showToast('배경 그림을 제거했어요 (기본 배경 사용)');}
function currentLogo(){return (typeof appConfig!=='undefined'&&appConfig.logo)||LOGO_DEFAULT;}
function applyLogo(){var src=currentLogo();document.querySelectorAll('.app-logo-img').forEach(function(img){img.src=src;});var pv=document.getElementById('cfg-logo-preview');if(pv)pv.src=src;var rb=document.getElementById('cfg-logo-reset');if(rb)rb.style.display=(appConfig&&appConfig.logo)?'':'none';}
function uploadLogo(inp){var f=inp.files&&inp.files[0];if(!f){return;}compressImg(f,640,0.92,'image/png').then(function(data){if(!data){showToast('이미지를 불러오지 못했어요');return;}appConfig.logo=data;applyLogo();showToast('🖼️ 앱 로고가 변경되었어요');});inp.value='';}
function resetLogo(){if(appConfig)delete appConfig.logo;applyLogo();showToast('기본 로고로 되돌렸어요');}
function setSeason(k){if(!confirm((SEASONS[k]||{}).n+' 시기 테마로 변경할까요?\n앱 전체 색상이 바뀝니다.'))return;applySeason(k);try{loadThemeGreetInputs();}catch(e){}showToast('⛪ '+SEASONS[k].n+' 테마가 적용되었어요');}
var _seasonReal=null,_seasonPreview=null;
function _themeBar(show,k){var bar=document.getElementById('theme-preview-bar');if(!bar)return;if(show){var lb=document.getElementById('theme-preview-label');if(lb)lb.textContent='🎨 '+((SEASONS[k]||{}).n||'')+' 미리보기 중';bar.style.display='flex';}else{bar.style.display='none';}}
function previewSeason(k){if(k===(appConfig.season||'ordinary')&&_seasonPreview==null){return;}if(_seasonReal===null)_seasonReal=(appConfig.season||'ordinary');_seasonPreview=k;applySeason(k,true);_themeBar(true,k);}
function commitSeason(){var k=_seasonPreview;if(k==null)return;applySeason(k);_seasonReal=null;_seasonPreview=null;_themeBar(false);try{loadThemeGreetInputs();}catch(e){}showToast('⛪ '+SEASONS[k].n+' 테마가 적용되었어요');}
function cancelSeason(){var r=(_seasonReal!=null?_seasonReal:(appConfig.season||'ordinary'));_seasonReal=null;_seasonPreview=null;applySeason(r);_themeBar(false);}
function showThemeTab(k){document.getElementById('theme-litur').style.display=k==='litur'?'':'none';document.getElementById('theme-event').style.display=k==='event'?'':'none';}
function renderSeasonBtns(hl){const cur=hl||appConfig.season||'ordinary';const LIT=['ordinary','advent','christmas','lent','easter'];const EV=['springpicnic','summercamp','winterretreat'];const mkBtn=(k,o)=>`<button class="btn btn-sm ${k===cur?'':'btn-outline'}" style="${k===cur?'background:var(--primary);color:white;':''}" onclick="previewSeason('${k}')">${o.n}${k===cur?' ✓':''}</button>`;const e1=document.getElementById('season-btns');if(e1)e1.innerHTML=LIT.filter(k=>SEASONS[k]).map(k=>mkBtn(k,SEASONS[k])).join('');const e2=document.getElementById('event-btns');if(e2)e2.innerHTML=EV.filter(k=>SEASONS[k]).map(k=>mkBtn(k,SEASONS[k])).join('');}
function resetAppConfig(){appConfig={title:'하늘의문 중고등부 주일학교',color:'#5B9BD5',verse:'하느님은 사랑이십니다.',verseRef:'1요한 4,8',notionUrl:'',driveFolders:null,termStart:'',vacMsg:{...VAC_MSG_DEFAULT},bdayReward:BDAY_REWARD_DEFAULT};_driveDraft=null;loadAppConfigForm();applyAppConfig();showToast('기본값으로 되돌렸습니다');}
let calYear=new Date().getFullYear(),calMonth=new Date().getMonth(),bdaySlideIdx=0,bdaySlideTimer=null;
/* ⚠️ 관리자 비밀번호는 SHA-256 해시로만 보관합니다. 변경하려면 브라우저 콘솔에서
   await hashPw('jonghwa','새비밀번호') 를 실행해 나온 값을 아래 pwh에 넣으세요. */
let ADMIN={id:'jonghwa',pwh:'a7fc1580d1dded85140de34e684adf0103bc7489e41ea689722a5a048be0e4b2',name:'이종화',baptism:'스테파노',role:'teacher',type:'etc',isAdmin:true,displayName:'교사 이종화 스테파노',gradeLabel:'기타'};
const CAT_LABEL={notice:'공지',gallery:'갤러리',event:'이벤트',free:'자유',jabumo:'자부모회',activity:'부서활동'};
const GRADE_LABEL={m1:'중1',m2:'중2',m3:'중3',h:'고등','all-s':'전체',all:'전체'};
const GCOLOR={m1:'linear-gradient(135deg,#4A90D9,#6BB8FF)',m2:'linear-gradient(135deg,#2CC9B0,#5EE8D0)',m3:'linear-gradient(135deg,#F5A623,#FFD166)',h:'linear-gradient(135deg,#9B8FD4,#C4B8FF)'};
const ATTEND_LEVELS=[{n:1,l:'🌱 씨앗',r:'축하 스티커'},{n:5,l:'🌿 새싹',r:'간식 교환권'},{n:10,l:'🌸 꽃망울',r:'음료 교환권'},{n:20,l:'☀️ 햇살',r:'문화상품권 5천원'},{n:40,l:'👑 왕관',r:'문화상품권 1만원'}];
function crownCount(u){if(!u)return 0;let c=((u.history)||[]).filter(x=>(x.attendTotal||0)>=40).length;if((u.attendTotal||0)>=40)c++;return c;}
function crownMark(u){const c=crownCount(u);return c<=0?'':' '+'👑'.repeat(Math.min(c,5));}
function renderDiaryHistory(){const el=document.getElementById('diary-history');if(!el)return;if(G.role!=='student'){el.innerHTML='';return;}const yr=new Date().getFullYear();const t=G.attendTotal||0;let lv='🌱 씨앗';for(const L of ATTEND_LEVELS)if(t>=L.n)lv=L.l;const hist=(G.history||[]).slice();
if(!G.graduated){const cur=`<div class="card" style="margin-bottom:8px;cursor:pointer;border-left:4px solid var(--mint)" onclick="showHistoryWeeks(-1)"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:13px;font-weight:700">${yr}년 ${G.grade?'('+G.grade+')':''} <span class="chip chip-mint" style="margin-left:4px">진행 중</span></div><span class="chip chip-blue">${t>0?lv:'-'}</span></div><div style="font-size:11px;color:var(--text-light);margin-top:5px">출석 ${t}회${t>=40?' · 👑 왕관 달성!':''} · 눌러서 출석일 보기</div></div>`;el.innerHTML='<div style="font-size:13px;font-weight:800;margin-bottom:8px">📜 나의 연혁</div>'+cur+hist.slice().reverse().map((x,i)=>`<div class="card" style="margin-bottom:8px;cursor:pointer" onclick="showHistoryWeeks(${hist.length-1-i})"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:13px;font-weight:700">${x.year}년 ${x.grade?'('+x.grade+')':''}</div><span class="chip chip-blue">${x.level}</span></div><div style="font-size:11px;color:var(--text-light);margin-top:5px">출석 ${x.attendTotal}회${(x.attendTotal||0)>=40?' · 👑 왕관의 해!':''} · 눌러서 출석일 보기</div></div>`).join('')+'<div style="height:8px"></div>';return;}
const entries=[{year:yr,grade:G.grade||'',attendTotal:t,level:t>0?lv:'🌱 씨앗',weeks:G.attendedWeeks||[],cur:!G.graduated,idx:-1},...hist.slice().reverse().map((x,i)=>({...x,idx:hist.length-1-i}))];const totalAll=entries.reduce((s,x)=>s+(x.attendTotal||0),0);const crowns=entries.filter(x=>(x.attendTotal||0)>=40).length;
const summary=`<div style="background:linear-gradient(135deg,var(--lavender-light),var(--primary-light));border-radius:var(--radius-lg);padding:14px 10px;margin-bottom:14px;display:grid;grid-template-columns:repeat(3,1fr);text-align:center">${G.graduated?`<div style="grid-column:1/4;font-size:12px;font-weight:800;color:var(--primary-dark);margin-bottom:8px">🎓 ${G.name} ${G.baptism}의 주일학교 여정</div>`:''}<div><div style="font-size:20px;font-weight:800;color:var(--primary-dark)">${entries.length}</div><div style="font-size:10px;color:var(--text-sub)">함께한 해</div></div><div style="border-left:1px solid rgba(255,255,255,.6);border-right:1px solid rgba(255,255,255,.6)"><div style="font-size:20px;font-weight:800;color:var(--mint)">${totalAll}</div><div style="font-size:10px;color:var(--text-sub)">총 출석</div></div><div><div style="font-size:20px;font-weight:800">${crowns?'👑×'+crowns:'–'}</div><div style="font-size:10px;color:var(--text-sub)">왕관 달성</div></div></div>`;
el.innerHTML='<div style="font-size:13px;font-weight:800;margin-bottom:10px">📜 나의 신앙 발자취</div>'+summary+'<div style="position:relative;padding-left:28px"><div style="position:absolute;left:10px;top:12px;bottom:12px;width:2px;background:linear-gradient(var(--mint),var(--lavender))"></div>'+entries.map(x=>{const at=x.attendTotal||0;const pct=Math.min(100,Math.round(at/40*100));const emoji=(x.level||'🌱 씨앗').split(' ')[0];return `<div style="position:relative;margin-bottom:12px"><div style="position:absolute;left:-28px;top:12px;width:22px;height:22px;border-radius:50%;background:white;border:2px solid ${x.cur?'var(--mint)':'var(--lavender)'};display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 1px 4px rgba(0,0,0,.08)">${emoji}</div><div class="card" style="cursor:pointer${x.cur?';border:1.5px solid var(--mint)':''}" onclick="showHistoryWeeks(${x.idx})"><div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><div style="font-size:13px;font-weight:800">${x.year}년${x.grade?' · '+x.grade:''} ${x.cur?'<span class="chip chip-mint" style="font-size:9px">진행 중</span>':''}</div><span class="chip chip-blue" style="flex-shrink:0">${x.level}</span></div><div style="margin-top:9px;height:6px;background:var(--bg);border-radius:4px;overflow:hidden"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,var(--mint),var(--primary));border-radius:4px"></div></div><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-light);margin-top:5px"><span>출석 ${at}회</span><span>${at>=40?'👑 왕관 달성!':'👑까지 '+(40-at)+'회'}</span></div></div></div>`;}).join('')+'</div><div style="font-size:10px;color:var(--text-light);text-align:center;margin:2px 0 8px">카드를 누르면 그해의 출석 발자국을 볼 수 있어요 👣</div>';}
function showHistoryWeeks(idx){let x;if(idx===-1){const t=G.attendTotal||0;let lv='🌱 씨앗';for(const L of ATTEND_LEVELS)if(t>=L.n)lv=L.l;x={year:new Date().getFullYear(),grade:G.grade,attendTotal:t,level:lv,weeks:G.attendedWeeks||[]};}else{x=(G.history||[])[idx];}if(!x)return;const weeks=(x.weeks||[]).slice().sort();document.getElementById('hw-title').textContent='👣 '+x.year+'년의 발자취';const MN=['','1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];const byM={};weeks.forEach(w=>{const m=parseInt(w.slice(5,7));(byM[m]=byM[m]||[]).push(parseInt(w.slice(8)));});
const head=`<div style="background:linear-gradient(135deg,var(--mint-light),var(--primary-light));border-radius:var(--radius);padding:12px;text-align:center;margin-bottom:14px"><div style="font-size:13px;font-weight:800">${x.year}년 ${x.grade?'('+x.grade+')':''}</div><div style="font-size:11px;color:var(--text-sub);margin-top:4px">출석 <b>${x.attendTotal||0}회</b> · 최종 등급 <b>${x.level||'-'}</b>${(x.attendTotal||0)>=40?' · 👑 왕관의 해!':''}</div></div>`;
const body=weeks.length?Object.keys(byM).sort((a,b)=>a-b).map(m=>`<div style="margin-bottom:12px"><div style="font-size:12px;font-weight:800;color:var(--primary-dark);margin-bottom:6px">${MN[m]} <span style="font-weight:500;color:var(--text-light);font-size:10px">(${byM[m].length}회)</span></div><div style="display:flex;flex-wrap:wrap;gap:6px">${byM[m].map(d=>`<span style="width:34px;height:34px;border-radius:50%;background:var(--mint-light);color:#2D9E8F;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800">${d}</span>`).join('')}</div></div>`).join(''):'<div class="empty" style="padding:24px"><div class="empty-emoji" style="font-size:26px">👣</div><div class="empty-title" style="font-size:13px">아직 남겨진 발자국이 없어요</div></div>';
document.getElementById('hw-body').innerHTML=head+body;openModal('history-weeks-modal');}
/* adminVote -> appConfig (cloud) */
function adminHolder(){return pendingList.find(u=>u.role==='teacher'&&u.approved&&u.isAdmin)||(ADMIN.isAdmin?ADMIN:null);}
function eligibleVoters(){const h=adminHolder();return pendingList.filter(u=>u.role==='teacher'&&u.approved&&!u.hidden&&(!h||u.id!==h.id));}
function transferAdminTo(target,how){const h=adminHolder();pendingList.forEach(u=>{if(u.isAdmin)u.isAdmin=false;});ADMIN.isAdmin=false;target.isAdmin=true;if(G.id===target.id)G.isAdmin=true;else if(h&&G.id===h.id)G.isAdmin=false;notifications.unshift({id:'nt'+Date.now()+'gv',text:'🛡️ 관리자가 변경되었어요: '+target.name+' '+target.baptism+' 선생님 ('+how+')',time:'방금',ts:Date.now(),pushed:false,readBy:[],forRole:'teacher'});updateNotifDot();renderGovSection();renderAdminGrid(G.type==='principal'||G.type==='admin'||G.isAdmin);setMyProfile&&setMyProfile();}
function renderGovSection(){const el=document.getElementById('gov-section');if(!el)return;const h=adminHolder();const isMe=h&&G.id===h.id;let voteHtml='';if(adminVote){const cand=pendingList.find(u=>u.id===adminVote.candidateId);const elig=eligibleVoters();const need=Math.floor(elig.length/2)+1;const voted=adminVote.votes.includes(G.id);const canVote=!isMe&&!voted&&elig.some(u=>u.id===G.id);voteHtml=`<div style="background:var(--coral-light);border-radius:var(--radius);padding:14px;margin-bottom:8px"><div style="font-size:13px;font-weight:800;margin-bottom:4px">🗳️ 관리자 교체 투표 진행 중</div><div style="font-size:12px;color:var(--text-sub);line-height:1.6">후보: <b>${cand?cand.name+' '+cand.baptism:'?'}</b> · 발의: ${adminVote.proposerName}<br>찬성 <b>${adminVote.votes.length}</b> / 정족수 <b>${need}</b> (교사 ${elig.length}명 중 과반)</div><div style="display:flex;gap:8px;margin-top:10px">${canVote?`<button class="btn btn-sm" style="background:var(--coral);color:white;flex:1" onclick="castAdminVote()">✋ 찬성하기</button>`:voted?'<span class="chip chip-gray" style="align-self:center">✅ 찬성 완료</span>':''}${adminVote.proposerId===G.id?`<button class="btn btn-sm btn-outline" style="flex:1" onclick="withdrawAdminVote()">발의 철회</button>`:''}</div></div>`;}
el.innerHTML=voteHtml+`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px"><span style="font-size:11px;color:var(--text-light)">🛡️ 관리자: <b style="color:var(--text-sub)">${h?h.name+' '+h.baptism+(isMe?' (나)':''):'⚠️ 공석'}</b></span>${isMe?`<button onclick="openAdminTransfer()" style="background:none;border:none;color:var(--text-light);font-size:10px;cursor:pointer;font-family:inherit;padding:4px;text-decoration:underline">이임</button>`:(!adminVote?`<button onclick="openAdminVoteProposal()" style="background:none;border:none;color:var(--text-light);font-size:10px;cursor:pointer;font-family:inherit;padding:4px;text-decoration:underline">교체 발의</button>`:'')}</div>`;}
function teacherOptions(excludeId){return pendingList.filter(u=>u.role==='teacher'&&u.approved&&!u.hidden&&u.id!==excludeId).map(u=>`<option value="${u.id}">${u.name} ${u.baptism} (${u.gradeLabel||'교사'})</option>`).join('');}
function openJabumoTransfer(){if(!G.isJabumoPresident){showToast('현 회장만 이임할 수 있어요');return;}const sel=document.getElementById('jabumo-transfer-target');const list=pendingList.filter(u=>u.role==='parent'&&u.approved&&!u.hidden&&u.id!==G.id);if(!list.length){showToast('이임할 다른 학부모가 없어요');return;}sel.innerHTML='<option value="">선택</option>'+list.map(u=>`<option value="${u.id}">${u.name} ${u.baptism}${(u.children||[]).length?' ('+(u.children||[]).map(c=>c.name||c).join(', ')+')':''}</option>`).join('');openModal('jabumo-transfer-modal');}
function submitJabumoTransfer(){const tid=document.getElementById('jabumo-transfer-target').value;if(!tid){showToast('후임 학부모를 선택해주세요');return;}const t=pendingList.find(u=>u.id===tid);if(!t)return;if(!confirm(t.name+' '+t.baptism+' 님에게 회장직을 이임할까요?\n이임 후 되돌릴 수 없어요.'))return;const me=pendingList.find(u=>u.id===G.id);if(me)me.isJabumoPresident=false;pendingList.forEach(u=>{if(u.isJabumoPresident&&u.id!==tid)u.isJabumoPresident=false;});t.isJabumoPresident=true;t.isJabumo=true;G.isJabumoPresident=false;notifications.unshift({id:'nt'+Date.now()+'jt',text:'자부모회장이 이임되었어요: '+G.name+' → '+t.name+' 님',time:'방금',ts:Date.now(),pushed:false,readBy:[],hiddenBy:[],forRole:'teacher-parent'});updateNotifDot();closeModal('jabumo-transfer-modal');closeModal('jabumo-roster-modal');show('menu-jabumo-roster',false);show('fab-board',false);setMyProfile();const rb=document.getElementById('role-badge');if(rb)rb.textContent='학부모';showToast('회장직이 이임되었습니다');}
function openAdminTransfer(){const h=adminHolder();if(!h||G.id!==h.id){showToast('현 관리자만 이임할 수 있어요');return;}const sel=document.getElementById('gov-transfer-target');sel.innerHTML='<option value="">선택</option>'+teacherOptions(h.id);openModal('gov-transfer-modal');}
function submitAdminTransfer(){const tid=document.getElementById('gov-transfer-target').value;if(!tid){showToast('후임 교사를 선택해주세요');return;}const t=pendingList.find(u=>u.id===tid);if(!t)return;if(!confirm(t.name+' '+t.baptism+' 선생님에게 관리자를 이임할까요?\n이임 후 되돌릴 수 없어요.'))return;closeModal('gov-transfer-modal');transferAdminTo(t,'이임');showToast('🛡️ 관리자가 이임되었습니다');}
function openAdminVoteProposal(){if(adminVote){showToast('이미 진행 중인 투표가 있어요');return;}const h=adminHolder();if(h&&G.id===h.id){showToast('현 관리자는 발의할 수 없어요 (이임을 이용하세요)');return;}const sel=document.getElementById('gov-vote-candidate');sel.innerHTML='<option value="">선택</option>'+teacherOptions(h?h.id:'');openModal('gov-vote-modal');}
function submitAdminVoteProposal(){const cid=document.getElementById('gov-vote-candidate').value;if(!cid){showToast('후보를 선택해주세요');return;}adminVote={candidateId:cid,proposerId:G.id,proposerName:G.name+' '+G.baptism,votes:[G.id],startedAt:new Date().toLocaleDateString('ko-KR')};const cand=pendingList.find(u=>u.id===cid);notifications.unshift({id:'nt'+Date.now()+'vp',text:'🗳️ 관리자 교체 투표가 발의되었어요. 후보: '+(cand?cand.name+' '+cand.baptism:'?')+' · 관리 탭에서 투표해주세요',time:'방금',ts:Date.now(),pushed:false,readBy:[],forRole:'teacher',tap:{type:'gov'}});updateNotifDot();closeModal('gov-vote-modal');renderGovSection();checkAdminVoteResult();showToast('발의되었습니다. 모든 선생님께 알림이 전송됐어요');}
function castAdminVote(){if(!adminVote)return;const h=adminHolder();if(h&&G.id===h.id){showToast('현 관리자는 투표할 수 없어요');return;}if(adminVote.votes.includes(G.id)){showToast('이미 찬성했어요');return;}if(!eligibleVoters().some(u=>u.id===G.id)){showToast('투표 자격이 없어요');return;}adminVote.votes.push(G.id);renderGovSection();checkAdminVoteResult();}
function checkAdminVoteResult(){if(!adminVote)return;const elig=eligibleVoters();const need=Math.floor(elig.length/2)+1;if(adminVote.votes.length>=need){const cand=pendingList.find(u=>u.id===adminVote.candidateId);adminVote=null;if(cand){transferAdminTo(cand,'교사 과반 투표');showToast('🗳️ 과반 찬성! 관리자가 교체되었습니다');}}}
function withdrawAdminVote(){if(!adminVote||adminVote.proposerId!==G.id){showToast('발의자만 철회할 수 있어요');return;}adminVote=null;renderGovSection();showToast('발의가 철회되었어요');}
function openManualStudentModal(){const bm=document.getElementById('ms-bmonth'),bd=document.getElementById('ms-bday');if(bm&&bm.options.length===1){for(let i=1;i<=12;i++)bm.add(new Option(i+'월',i));for(let i=1;i<=31;i++)bd.add(new Option(i+'일',i));}['ms-name','ms-baptism'].forEach(i=>document.getElementById(i).value='');document.getElementById('ms-grade').value='';bm.value='0';bd.value='0';openModal('manual-student-modal');}
function submitManualStudent(){const name=(document.getElementById('ms-name').value||'').trim();const bap=(document.getElementById('ms-baptism').value||'').trim();const gv=document.getElementById('ms-grade').value;if(!name||!bap||!gv){showToast('이름·세례명·학년을 입력해주세요');return;}var _cohort,_gk,_gl;if(gv==='prep'){_cohort=_curSchoolYr()+1;_gk='m1';_gl='중1';}else{const p=gv.split('|');_gk=p[0];_gl=p[1];_cohort=_cohortFromLabel(_gl);}const u={id:'manual'+Date.now(),pwh:'',demo:false,manualReg:true,name,baptism:bap,phone:'',role:'student',cohort:_cohort,gradeOffset:0,gradeKey:_gk,gradeLabel:_gl,approved:true,joinedAt:toDateStr(new Date()),joinedTs:Date.now(),attendTotal:0,streak:0,attendedWeeks:[],halfWeeks:[],earnedLevels:[],birthYear:parseInt(document.getElementById('ms-byear').value)||0,birthMonth:parseInt(document.getElementById('ms-bmonth').value)||0,birthDay:parseInt(document.getElementById('ms-bday').value)||0,feastMonth:parseInt(document.getElementById('ms-fmonth').value)||0,feastDay:parseInt(document.getElementById('ms-fday').value)||0};try{applyStudentGrade(u);}catch(e){}pendingList.push(u);closeModal('manual-student-modal');renderStudentCards('all');renderAttendList();showToast('📵 '+name+' 학생이 등록되었어요. 출석관리에서 바로 체크할 수 있어요');}
function renderDetailCoupons(u){dedupeBdayCoupons();const el=document.getElementById('detail-coupon-list');if(!el)return;const hint=document.getElementById('detail-coupon-hint');if(hint)hint.textContent=u.manualReg?'📵 수동등록 학생 · 교사가 대신 확인·사용 처리':'';const mine=coupons.filter(c=>c.studentId===u.id);if(!mine.length){el.innerHTML='<div class="card" style="text-align:center;font-size:12px;color:var(--text-light);padding:16px">보유한 쿠폰이 없어요</div>';return;}el.innerHTML=mine.slice().reverse().map(c=>`<div class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:12px;font-weight:700">${c.badgeLabel} 쿠폰 <span style="font-size:11px;color:var(--text-light);font-weight:500">· 🎁 ${c.reward||'보상'}</span></div><span class="chip ${c.used?'chip-gray':'chip-coral'}">${c.used?'사용완료':'미사용'}</span></div><div style="font-size:10px;color:var(--text-light);margin-top:6px">발급 ${c.createdAt}${c.used&&c.usedAt?' · 사용 '+c.usedAt:''}${c.used?'':' · 인증번호 <b style="color:var(--primary-dark);letter-spacing:1px">'+c.code+'</b>'}</div>${c.used?'':`<div style="display:flex;gap:6px;margin-top:8px"><input class="form-input" type="text" inputmode="numeric" id="dcoupon-code-${c.id}" placeholder="인증번호 6자리" maxlength="6" style="flex:1;min-width:0"><button class="btn btn-sm" style="background:var(--primary);color:white;width:auto;padding:6px 12px;white-space:nowrap" onclick="useCouponByTeacher('${c.id}')">✅ 사용</button></div>`}</div>`).join('');}
function useCouponByTeacher(cid){const c=coupons.find(x=>x.id===cid);if(!c||c.used)return;const inp=document.getElementById('dcoupon-code-'+cid);const val=((inp&&inp.value)||'').trim();if(!val){showToast('인증번호를 입력해주세요');return;}if(val!==String(c.code)){showToast('❌ 인증번호가 일치하지 않아요');return;}c.used=true;c.usedAt=new Date().toLocaleDateString('ko-KR');saveCouponNow(c);const u=pendingList.find(x=>x.id===currentDetailStudentId);if(u)renderDetailCoupons(u);renderAdminCouponList();try{renderCouponList();}catch(e){}showToast('🎉 쿠폰이 사용 처리되었어요');}
function checkLevelCoupons(u){u.earnedLevels=u.earnedLevels||[];ATTEND_LEVELS.forEach(L=>{if(!L.r||(u.attendTotal||0)<L.n)return;if(coupons.some(c=>c.studentId===u.id&&c.badgeLabel===L.l)){if(!u.earnedLevels.includes(L.n))u.earnedLevels.push(L.n);return;}u.earnedLevels.push(L.n);generateCoupon(u,L);if(u.id===G.id)nudgePushOnReward();});}
function pushIsOn(){ try{ return ('Notification' in window) && Notification.permission==='granted'; }catch(e){ return false; } }
function nudgePushOnReward(){
  if(pushIsOn())return;
  try{
    var snooze=Number(localStorage.getItem('hd-push-snooze')||0);
    if(localStorage.getItem('hd-push-asked') && !(snooze && Date.now()>snooze)) return;  /* 이미 물어봤고 스누즈 중이면 조용히 */
  }catch(e){}
  var t=document.getElementById('push-optin-title'), d=document.getElementById('push-optin-desc');
  if(t)t.textContent='🎁 쿠폰이 도착했어요!';
  if(d)d.innerHTML='다음부터 쿠폰·공지·생일 소식을<br>휴대폰으로 바로 받아보실래요?';
  setTimeout(function(){ maybeAskPush(); }, 1200);
}

function _resetRegForm(){try{['reg-name','reg-baptism','reg-phone','reg-id','reg-pw'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});['reg-byear','reg-bmonth','reg-bday','reg-feast-month','reg-feast-day','reg-school','reg-grade-num','reg-position'].forEach(function(id){var e=document.getElementById(id);if(e)e.selectedIndex=0;});var jb=document.getElementById('reg-jabumo');if(jb)jb.checked=false;document.querySelectorAll('#children-list .child-row input').forEach(function(i){i.value='';});G.regRole='student';var tabs=document.querySelectorAll('#screen-register .role-tab');tabs.forEach(function(t,i){t.classList.toggle('active',i===0);});show('birth-wrap',true);show('student-extra',true);show('parent-extra',false);show('teacher-extra',false);var pb=document.getElementById('preview-box');if(pb)pb.style.display='none';}catch(e){}}
function _resetLoginForm(){try{['login-id','login-pw'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});}catch(e){}}
function goScreen(s){document.querySelectorAll('.screen,.auth-screen').forEach(el=>el.classList.remove('active'));const t=document.getElementById('screen-'+s);if(t)t.classList.add('active');if(s==='register')_resetRegForm();if(s==='login')_resetLoginForm();}
function goBack(){switchTab('home');}
function openExternalLink(url){try{const w=window.open(url,'_blank');if(!w){window.location.href=url;}}catch(e){window.location.href=url;}}
function openYoutube(){openExternalLink('https://youtube.com/channel/UCAPnfnpb9vi2eK5Mt7B_ovA?si=bKxZw0YMMGkhZNc6');}
function openInstagram(){openExternalLink('https://www.instagram.com/heavensdoor.teen?igsh=MWQ1M200eXhmeWl1aQ==');}
const COACH={student:{
home:[{e:'🕊️',t:'하늘의문에 온 걸 환영해요!',d:'아래 메뉴로 출석·다이어리·커뮤니티를 이용할 수 있어요. 각 화면에 처음 들어가면 사용법을 알려줄게요 😊'},{e:'🎁',t:'출석 보상',d:'토요일에 출석하면 도장이 쌓여요. 등급이 오르면 쿠폰도 받을 수 있어요!'},{sel:'notif-bell',e:'🔔',t:'알림',d:'새 소식·쿠폰·선생님 답장이 여기로 와요. 빨간 점이 뜨면 눌러서 확인해요!'},{sel:'bday-banner-section',e:'🎂',t:'생일·축일 배너',d:'이번 주 생일·축일인 친구를 확인하고 축하해줄 수 있어요.'},{sel:'home-student',e:'🌱',t:'출석 도장',d:'출석할 때마다 도장이 채워지고, 모이면 등급이 올라가요.'},{sel:'weekly-verse',e:'📖',t:'오늘의 말씀',d:'이번 주 복음과 함께 읽을 말씀을 여기서 볼 수 있어요.'},{sel:'event-banner-section',e:'📢',t:'이벤트 배너',d:'캠프·피정 등 부서 소식과 이벤트를 확인해요.'},{sel:'home-notices',e:'📌',t:'공지사항',d:'선생님이 올린 중요한 공지를 여기서 확인해요.'},{sel:'story-section',e:'📸',t:'사진 스토리',d:'부서 활동 사진을 구경할 수 있어요.'},{sel:'reward-section',e:'🏅',t:'등급표',d:'씨앗부터 왕관까지, 등급별 보상을 미리 볼 수 있어요.'}],
attend:[{e:'✅',t:'출석 체크',d:'토요일 모임에서 선생님이 만든 QR을 찍으면 출석 완료! 출석·반일·결석이 기록돼요.'},{e:'🌱',t:'꾸준히 참여해요',d:'출석이 쌓이면 등급(씨앗→왕관)이 올라가고, 등급을 달성하면 쿠폰이 생겨요.'}],
diary:[{e:'📖',t:'신앙 다이어리',d:'기도·묵상·오늘 하루의 마음을 자유롭게 기록해보세요.'},{e:'🔒',t:'공유 범위 선택',d:'🔒 나만 보기 · 👨‍🏫 학년 교사 · ✝️ 특정 교사 중에 고를 수 있어요. 선생님께 공유하면 답장을 받을 수 있어요.'}],
board:[{e:'💬',t:'커뮤니티(자유게시판)',d:'친구들과 소식을 나누고 이야기를 남기는 공간이에요.'},{e:'✏️',t:'글쓰기',d:'오른쪽 위 ✏️ 버튼으로 글을 써봐요. 서로 존중하는 말로 함께해요!'}],
my:[{e:'🙋',t:'MY',d:'내 정보와 활동, 도장·등급을 한눈에 볼 수 있어요.'},{e:'🎟️',t:'쿠폰함',d:'받은 쿠폰을 확인하고 인증번호로 사용할 수 있어요. 등급 달성으로 받은 쿠폰이 여기 모여요!'}]
},
parent:{home:[{e:'🕊️',t:'하늘의문에 오신 걸 환영해요!',d:'자녀의 신앙생활을 함께 응원하는 공간이에요. 각 화면에 처음 들어가면 사용법을 알려드릴게요 😊'},{sel:'notif-bell',e:'🔔',t:'알림',d:'공지·행사 등 새 소식이 여기로 와요. 빨간 점이 뜨면 눌러서 확인하세요.'},{sel:'bday-banner-section',e:'🎂',t:'생일·축일 배너',d:'이번 주 생일·축일인 학생을 확인할 수 있어요.'},{sel:'home-parent',e:'👧',t:'자녀 출석 현황',d:'우리 아이의 출석·등급을 한눈에 볼 수 있어요. (자녀 세례명이 등록돼 있어야 정확히 연동돼요)'},{sel:'weekly-verse',e:'📖',t:'오늘의 말씀',d:'이번 주 복음과 말씀을 함께 볼 수 있어요.'},{sel:'home-notices',e:'📌',t:'공지사항',d:'선생님이 올린 중요한 공지를 확인하세요.'}],board:[{e:'💬',t:'커뮤니티',d:'부서 소식과 학부모 소통 글을 볼 수 있어요. 위쪽 카테고리로 나눠서 확인할 수 있어요.'}],my:[{e:'🙋',t:'MY',d:'내 정보와 자녀 정보를 확인할 수 있어요.'}]},
teacher:{home:[{e:'🕊️',t:'환영합니다, 선생님!',d:'홈에서 소식을 보고, 관리 탭에서 학생·부서를 관리해요. 각 화면에 처음 들어가면 안내해드릴게요 🙏'},{sel:'notif-bell',e:'🔔',t:'알림',d:'가입 승인·연속 결석·쿠폰·다이어리 공유 알림이 여기로 와요.'},{sel:'teacher-schedule',e:'📅',t:'다가오는 일정',d:'가까운 모임·행사 일정을 홈에서 바로 확인해요.'},{sel:'home-reminder-list',e:'📌',t:'리마인더',d:'교사끼리 공유하는 메모예요. 할 일을 체크할 수 있어요.'},{sel:'weekly-verse',e:'📖',t:'오늘의 말씀',d:'이번 주 복음과 말씀을 확인해요.'},{sel:'home-notices',e:'📢',t:'공지사항',d:'중요 공지를 확인하고 관리할 수 있어요.'}],board:[{e:'💬',t:'커뮤니티',d:'학생·학부모와 소통하는 게시판이에요.'},{sel:'fab-board',e:'✏️',t:'글쓰기',d:'이 버튼으로 공지·소식을 올릴 수 있어요. 대상(학년·전체)도 정할 수 있어요.'}],activity:[{e:'🎵',t:'부서활동',d:'성가대·전례 등 부서 활동 자료와 일정을 관리하는 공간이에요.'}],teacher:[{e:'📚',t:'자료실',d:'교리·부서활동 자료를 올리고 함께 열람할 수 있어요.'}],admin:[{e:'🛠️',t:'관리',d:'학생과 부서 운영을 여기서 관리해요. 아래 메뉴를 하나씩 살펴볼까요?'},{sel:'admin-grid',e:'🧩',t:'관리 메뉴',d:'가입 승인·출석·회원·학생카드·다이어리·쿠폰·출석통계 등. 빨간 배지는 처리할 일이 있다는 표시예요!'},{sel:'gov-section',e:'🏛️',t:'운영 규칙',d:'교감·교무 등 직책과 운영 규칙을 확인·관리해요.'},{e:'📱',t:'출석 QR',d:'출석관리에서 토요일 QR을 만들면 학생이 찍어 출석해요. QR 생성은 교감·교무·관리자만 가능해요.'}],my:[{e:'🙋',t:'MY',d:'내 정보와 설정을 확인할 수 있어요.'}]}
};
let coachSteps=[],coachIdx=0,coachKey='';
function _coachSeen(k){try{return !!localStorage.getItem(k);}catch(e){return false;}}
function maybeCoach(tab){const r=G.role,set=COACH[r]&&COACH[r][tab];if(!set||!set.length)return;const key='coach-'+r+'-'+tab+'-'+(G.id||'');if(_coachSeen(key))return;if(document.querySelector('.modal-overlay.open'))return;coachSteps=set;coachIdx=0;coachKey=key;setTimeout(renderCoach,450);}
function _coachVisible(el){if(!el)return false;if(el.offsetParent===null)return false;const r=el.getBoundingClientRect();return r.width>4&&r.height>4;}
function _coachDots(id,sm){const dt=document.getElementById(id);if(dt)dt.innerHTML=coachSteps.map((_,i)=>'<div style="width:'+(sm?6:7)+'px;height:'+(sm?6:7)+'px;border-radius:50%;background:'+(i===coachIdx?'var(--primary)':'var(--border-light,#dcdce6)')+'"></div>').join('');}
function _coachAnim(el,cls){if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);}
function renderCoach(){const ov=document.getElementById('coach-overlay');if(!ov)return;const st=coachSteps[coachIdx];if(!st){coachClose();return;}ov.style.display='block';if(st.sel)renderCoachSpot(st);else renderCoachCard(st);}
function renderCoachCard(st){document.getElementById('coach-ring').style.display='none';document.getElementById('coach-tip').style.display='none';document.getElementById('coach-card-wrap').style.display='flex';document.getElementById('coach-emoji').textContent=st.e||'';document.getElementById('coach-title').textContent=st.t||'';document.getElementById('coach-desc').textContent=st.d||'';document.getElementById('coach-next').textContent=coachIdx>=coachSteps.length-1?'시작하기':'다음';_coachDots('coach-dots',false);_coachAnim(document.getElementById('coach-card-inner'),'coach-cardpop');}
function renderCoachSpot(st){const el=document.getElementById(st.sel);if(!_coachVisible(el)){coachIdx++;return renderCoach();}document.getElementById('coach-card-wrap').style.display='none';el.scrollIntoView({block:'center'});setTimeout(function(){if(!_coachVisible(el)){coachIdx++;return renderCoach();}const r=el.getBoundingClientRect(),p=8,vw=innerWidth,vh=innerHeight;const ring=document.getElementById('coach-ring');ring.style.display='block';ring.style.top=(r.top-p)+'px';ring.style.left=(r.left-p)+'px';ring.style.width=(r.width+2*p)+'px';ring.style.height=(r.height+2*p)+'px';const tip=document.getElementById('coach-tip');document.getElementById('coach-tip-emoji').textContent=st.e||'';document.getElementById('coach-tip-title').textContent=st.t||'';document.getElementById('coach-tip-desc').textContent=st.d||'';document.getElementById('coach-tip-next').textContent=coachIdx>=coachSteps.length-1?'시작하기':'다음';_coachDots('coach-tip-dots',true);tip.style.display='block';tip.style.visibility='hidden';const tw=tip.offsetWidth,th=tip.offsetHeight;let left=Math.min(Math.max(r.left+r.width/2-tw/2,10),vw-tw-10);const below=(vh-r.bottom)>(th+28);let top=below?(r.bottom+p+12):(r.top-p-12-th);top=Math.min(Math.max(top,10),vh-th-10);tip.style.left=left+'px';tip.style.top=top+'px';const arw=document.getElementById('coach-arrow');const ax=Math.min(Math.max(r.left+r.width/2-left-7,14),tw-28);arw.style.left=ax+'px';arw.style.top=below?'-7px':(th-8)+'px';tip.style.visibility='visible';_coachAnim(tip,'coach-pop');},240);}
function coachNext(){coachIdx++;if(coachIdx>=coachSteps.length)coachClose();else renderCoach();}
function coachSkip(){coachClose();}
function coachClose(){const ov=document.getElementById('coach-overlay');if(ov)ov.style.display='none';['coach-card-wrap','coach-ring','coach-tip'].forEach(function(id){const e=document.getElementById(id);if(e)e.style.display='none';});if(coachKey){try{localStorage.setItem(coachKey,'1');}catch(e){}}coachKey='';}
function switchTab(tab){if(tab==='activity'&&G.role==='student'&&G.graduated){openMyCard();return;}document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));const sc=document.getElementById('screen-'+tab);var _ord=['home','board','attend','diary','activity','teacher','admin','my','calendar'],_ni=_ord.indexOf(tab);var _dir=(window._tabIdx==null||_ni<0)?1:(_ni>=window._tabIdx?1:-1);if(_ni>=0)window._tabIdx=_ni;try{localStorage.setItem('hd-last-tab',tab);}catch(e){}if(sc){sc.style.setProperty('--sx',_dir>0?'26px':'-26px');sc.classList.remove('tab-enter');void sc.offsetWidth;sc.classList.add('active');sc.classList.add('tab-enter');setTimeout(function(){sc.classList.remove('tab-enter');},700);}document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));const nv=document.getElementById('nav-'+tab);if(nv)nv.classList.add('active');try{if(tab==='diary')renderDiaryList();if(tab==='calendar'){
      /* 들어가면 오늘 날짜가 선택된 상태로 — 바로 확인·추가 가능 */
      try{
        var _t=toDateStr(new Date());
        if(!selectedCalDate)selectedCalDate=_t;
        var _sd=selectedCalDate.slice(0,7), _cm=_t.slice(0,7);
        if(typeof calYear!=='undefined'&&typeof calMonth!=='undefined'){
          var _p=selectedCalDate.split('-');
          calYear=+_p[0];calMonth=+_p[1]-1;
        }
      }catch(e){}
      renderCalendar();
      try{renderCalDayEvents(selectedCalDate);}catch(e){}
    }if(tab==='activity')renderDeptInfo();if(tab==='home'){checkImportantNotices();try{updateVerseEditUI();}catch(e){}try{checkThursdayNotice();}catch(e){}renderHomeSchedule();try{renderTeacherWeek();}catch(e){}try{renderHomeMiniCal();}catch(e){}try{renderHomeMinutes();}catch(e){}applySeason(appConfig.season||'ordinary');try{renderBdayBannerAuto();}catch(e){}}if(tab==='teacher'){autoArchiveMinutes();renderResourceList();}}catch(e){console.error('switchTab render error:',e);}try{maybeCoach(tab);}catch(e){}}
function show(id,v){const e=document.getElementById(id);if(e)e.style.display=v?'':'none';}
function showToast(msg,dur=2200){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),dur);}
function openModal(id){const m=document.getElementById(id);if(m)m.classList.add('open');}
function closeModal(id){const m=document.getElementById(id);if(m)m.classList.remove('open');}
let currentImportantId=null;
function checkImportantNotices(){try{const _jt=(typeof _joinTs==='function')?_joinTs():0;const important=posts.filter(p=>p.isImportant&&(!_jt||!p.ts||p.ts>=_jt)&&(p.target==='all'||p.target===G.role)&&(p.target!=='student'||p.grade==='all-s'||p.grade===G.gradeKey)&&!(p.popupUntil&&Date.now()>p.popupUntil)&&!(p.popupDays&&p.ts&&Date.now()>p.ts+p.popupDays*86400000));for(const p of important){const key='dismissed-important-'+p.id+'-'+G.id;let dismissed=false;try{dismissed=!!localStorage.getItem(key);}catch(e){dismissed=false;}if(!dismissed){currentImportantId=p.id;document.getElementById('important-notice-title').textContent=p.title;document.getElementById('important-notice-content').textContent=p.content||'';openModal('important-notice-modal');break;}}}catch(e){console.error('checkImportantNotices error:',e);}}
function closeImportantNotice(){try{if(currentImportantId)localStorage.setItem('dismissed-important-'+currentImportantId+'-'+G.id,'1');}catch(e){console.error('important notice dismiss error:',e);}closeModal('important-notice-modal');}
let _notifReadSnap=null;
function openNotifModal(){
  /* 읽음은 개별 알림을 눌러서 볼 때만 처리 — 여는 것만으로는 읽음이 되지 않음 */
  _notifReadSnap=null;
  renderNotifList();openModal('notif-modal');
}
function gradGuard(){if(G.role==='student'&&G.graduated){showToast('🎓 졸업생 계정은 열람만 가능해요');return true;}return false;}
function checkNewCoupons(){if(G.role!=='student'||G.graduated)return;const fresh=coupons.filter(c=>c.studentId===G.id&&!c.used&&!c.seen);if(!fresh.length)return;const c=fresh[fresh.length-1];fresh.forEach(x=>x.seen=true);const from=c.manual&&c.issuedBy?c.issuedBy+' 선생님':(c.bdayKey?'하늘의문 중고등부':'선생님');document.getElementById('crm-title').innerHTML=from+'께서<br><b style="color:var(--primary-dark)">'+c.badgeLabel+' 쿠폰</b>을 보냈어요!'+(fresh.length>1?'<div style="font-size:11px;color:var(--text-light);font-weight:500;margin-top:4px">외 '+(fresh.length-1)+'개의 새 쿠폰이 있어요</div>':'');document.getElementById('crm-reward').textContent='🎁 '+(c.reward||'보상');document.getElementById('crm-date').textContent='발급일: '+c.createdAt;setTimeout(()=>openModal('coupon-received-modal'),800);}
function openCouponBox(){if(gradGuard())return;renderCouponList();openModal('coupon-modal');}
function renderCouponList(){dedupeBdayCoupons();const el=document.getElementById('coupon-list');if(!el)return;const mine=coupons.filter(c=>c.studentId===G.id);if(!mine.length){el.innerHTML='<div class="empty" style="padding:24px"><div class="empty-emoji" style="font-size:28px">🎟️</div><div class="empty-title" style="font-size:13px">아직 쿠폰이 없어요</div><div class="empty-desc">등급을 달성하면 쿠폰이 생겨요!</div></div>';return;}el.innerHTML=mine.map(c=>`<div class="card" style="margin-bottom:10px;${c.used?'opacity:.5':''}"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="font-size:14px;font-weight:800">${c.badgeLabel} 쿠폰</div><div style="font-size:12px;color:var(--primary-dark);font-weight:700;margin-top:2px">🎁 ${c.reward||'보상'}</div><span class="chip ${c.used?'chip-gray':'chip-coral'}">${c.used?'사용완료':'미사용'}</span></div><div style="font-size:11px;color:var(--text-light);margin-bottom:10px">발급일: ${c.createdAt}</div>${c.used?'':`<div style="display:flex;gap:8px"><input class="form-input" type="text" id="coupon-code-${c.id}" placeholder="인증번호 6자리 입력" maxlength="6" style="flex:1"><button class="btn btn-sm" style="background:var(--coral);color:white" onclick="redeemCoupon('${c.id}')">사용하기</button></div>`}</div>`).join('');}
/* 쿠폰 변경을 클라우드에 즉시 저장 — 동기화로 옛 값(미사용)이 되살아나는 것 방지 */
function saveCouponNow(c){
  try{
    if(!c||!c.id)return;
    if(!(window.FB&&FB.enabled()&&FB.save))return;
    FB.save('coupons',c.id,c);
    if(window.flushSync)window.flushSync();
  }catch(e){console.warn('[COUPON] 저장 실패',e);}
}
function redeemCoupon(cid){const c=coupons.find(c=>c.id===cid);if(!c)return;const input=document.getElementById('coupon-code-'+cid);const val=(input.value||'').trim();if(!val){showToast('인증번호를 입력해주세요');return;}if(val!==c.code){showToast('❌ 인증번호가 일치하지 않아요');return;}c.used=true;c.usedAt=new Date().toLocaleDateString('ko-KR');saveCouponNow(c);renderCouponList();try{renderAdminCouponList();}catch(e){}showToast('🎉 쿠폰이 사용되었습니다!');}
function selCatTab(btn){btn.closest('.tab-bar').querySelectorAll('.tab-btn').forEach(t=>t.classList.remove('active'));btn.classList.add('active');}
function showAttendTab(tab){try{if(typeof stopQRScan==='function')stopQRScan();}catch(e){}show('attend-scan-tab',tab==='scan');show('attend-history-tab',tab==='history');show('attend-rank-tab',tab==='rank');const bar=document.querySelector('#screen-attend .tab-bar');if(bar)bar.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.getAttribute('onclick').includes(`showAttendTab('${tab}')`)));if(tab==='history')renderAttendHistory();if(tab==='rank')renderAttendRank();}
function renderAttendRank(){
  var el=document.getElementById('attend-rank-list');if(!el)return;
  var studs=(pendingList||[]).filter(function(u){return u&&u.approved&&u.role==='student'&&!u.hidden&&!u.graduated;});
  studs.sort(function(a,b){return (b.attendTotal||0)-(a.attendTotal||0)||(b.streak||0)-(a.streak||0)||((a.name||'')>(b.name||'')?1:-1);});
  if(!studs.length){el.innerHTML='<div class="empty" style="padding:32px"><div class="empty-emoji" style="font-size:32px">🏆</div><div class="empty-title" style="font-size:13px">순위 정보가 없어요</div></div>';return;}
  var medal=['🥇','🥈','🥉'];var order=[1,0,2];
  var top='<div style="font-size:13px;font-weight:800;margin-bottom:12px">🏆 출석 TOP 3</div><div style="display:flex;gap:8px;justify-content:center;align-items:flex-end;margin-bottom:18px">';
  order.forEach(function(i){var u=studs[i];if(!u){top+='<div style="flex:1;max-width:100px"></div>';return;}var h=i===0?92:i===1?72:60;top+='<div style="flex:1;max-width:100px;text-align:center"><div style="font-size:22px">'+medal[i]+'</div><div style="background:linear-gradient(135deg,var(--mint),#3DAB99);color:#fff;border-radius:12px 12px 0 0;height:'+h+'px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding:7px 4px"><div style="font-size:12px;font-weight:800;line-height:1.2;word-break:keep-all">'+_esc(u.name||'')+'</div><div style="font-size:17px;font-weight:900;margin-top:2px">'+(u.attendTotal||0)+'</div></div></div>';});
  top+='</div>';
  var body='';
  if(G.role==='teacher'){
    body='<div style="font-size:11px;color:var(--text-light);margin-bottom:6px">전체 순위 (교사 전용)</div>'+studs.map(function(u,i){return '<div class="student-row"><div class="student-avatar" style="background:'+(i<3?'var(--mint)':'var(--border-light)')+';color:'+(i<3?'#fff':'var(--text-light)')+';font-size:13px;font-weight:800">'+(i+1)+'</div><div class="student-info"><div class="student-name">'+_esc(u.name||'')+' '+_esc(u.baptism||'')+'</div><div class="student-detail">'+_esc(u.gradeLabel||'')+' · 출석 '+(u.attendTotal||0)+'회</div></div></div>';}).join('');
  }else{
    var mine=-1;for(var k=0;k<studs.length;k++){if(studs[k].id===G.id){mine=k;break;}}
    if(mine>=0){body='<div class="card" style="background:linear-gradient(135deg,var(--mint-light),var(--primary-light));text-align:center;padding:18px"><div style="font-size:12px;color:var(--text-sub);font-weight:700">나의 현재 순위</div><div style="font-size:30px;font-weight:900;color:var(--primary);margin:4px 0">'+(mine+1)+'<span style="font-size:15px">등</span></div><div style="font-size:11px;color:var(--text-light)">전체 '+studs.length+'명 중 · 누적 출석 '+(G.attendTotal||0)+'회</div></div>';}
    else{body='<div class="empty" style="padding:24px"><div class="empty-title" style="font-size:13px">아직 순위에 없어요</div></div>';}
  }
  el.innerHTML=top+body;
}
function renderAttendHistory(){const att=(G.attendedWeeks||[]);const half=(G.halfWeeks||[]);const scans=G.qrScanAt||{};const totalEl=document.getElementById('hist-total');if(totalEl)totalEl.textContent=G.attendTotal||0;const monthEl=document.getElementById('hist-month');if(monthEl)monthEl.textContent=monthAttendCount(G);const streakEl=document.getElementById('hist-streak');if(streakEl)streakEl.textContent=G.streak||0;const listEl=document.getElementById('attend-history-list');if(!listEl)return;const all=Array.from(new Set(att.concat(Object.keys(scans)))).sort().reverse();if(!all.length){listEl.innerHTML='<div class="empty" style="padding:32px"><div class="empty-emoji" style="font-size:32px">📋</div><div class="empty-title" style="font-size:13px">출석 기록이 없어요</div></div>';return;}listEl.innerHTML=all.map(function(w){var attended=att.indexOf(w)>=0,isHalf=half.indexOf(w)>=0,scan=scans[w];var av,bg,nm,dt;if(attended){av=isHalf?'◐':'✓';bg='linear-gradient(135deg,var(--mint),#3DAB99)';nm=w+(isHalf?' · 반일':'');dt=scan?('📱 내 QR 인식 '+scan):'토요일 출석';}else{av='✕';bg='var(--coral)';nm=w+' · 결석 처리';dt=scan?('📱 내 QR 인식 '+scan+' · 기록 보존됨'):'결석';}return '<div class="student-row"><div class="student-avatar" style="background:'+bg+'">'+av+'</div><div class="student-info"><div class="student-name">'+nm+'</div><div class="student-detail">'+dt+'</div></div></div>';}).join('');}
function attendGuard(){if(gradGuard())return null;const sat=attendSat();if(isVacationDate(sat)){showToast('이번 주는 방학이라 출석체크를 진행하지 않아요');return null;}if(!qrState.code||qrState.week!==sat){showToast('아직 이번 주 QR이 생성되지 않았어요');return null;}G.attendedWeeks=G.attendedWeeks||[];if(G.attendedWeeks.includes(sat)){showToast('이미 이번 주 출석 처리되었어요');return null;}return sat;}
function openAttendCodeModal(){if(attendGuard()===null)return;const inp=document.getElementById('attend-code-input');if(inp)inp.value='';openModal('attend-code-modal');setTimeout(()=>{if(inp)inp.focus();},250);}
function submitAttendCode(){const inp=document.getElementById('attend-code-input');const v=(inp.value||'').trim();if(!v){showToast('인증코드를 입력해주세요');return;}if(v!==qrState.code){showToast('❌ 인증코드가 일치하지 않아요');return;}closeModal('attend-code-modal');doAttend();}
function doAttend(){const sat=attendGuard();if(sat===null)return;G.attendedWeeks.push(sat);const me=pendingList.find(u=>u.id===G.id);const now=new Date();const hm=pad2(now.getHours())+':'+pad2(now.getMinutes());if(me){me.attendedWeeks=(me.attendedWeeks||[]);if(!me.attendedWeeks.includes(sat))me.attendedWeeks.push(sat);me.qrScanAt=me.qrScanAt||{};me.qrScanAt[sat]=hm;me.attendTotal=calcAttendTotal(me);me.absentAckBy=null;me.streak=computeStreak(me);checkLevelCoupons(me);G.attendTotal=me.attendTotal;G.streak=me.streak;saveMemberNow(me);}else{G.attendTotal=(G.attendTotal||0)+1;G.streak=computeStreak(G);showToast('⚠️ 등록된 학생 계정이 아니라 교사 출석부에는 반영되지 않아요');}initStamps();showAttendTab('history');showToast('✅ 출석 완료! ('+hm+')');}
let _qrStream=null,_qrRAF=null,_qrScanning=false,_jsqrReady=false;
function loadJsQR(){
  return new Promise(function(res,rej){
    if(window.jsQR){res();return;}
    var sc=document.createElement('script');
    sc.src='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    sc.onload=function(){res();};
    sc.onerror=function(){rej(new Error('jsqr load fail'));};
    document.head.appendChild(sc);
  });
}
async function toggleQRScan(){
  if(_qrScanning){ stopQRScan(); return; }
  if(attendGuard()===null)return;                 // 방학·중복출석 등 사전 체크
  const btn=document.getElementById('qr-scan-btn');
  const idle=document.getElementById('qr-idle');
  const hint=document.getElementById('qr-hint');
  const video=document.getElementById('qr-video');
  try{
    if(hint)hint.textContent='카메라 준비 중…';
    await loadJsQR();
    _qrStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
    video.srcObject=_qrStream;
    video.style.display='block';
    if(idle)idle.style.display='none';
    await video.play();
    _qrScanning=true;
    if(btn)btn.innerHTML='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> 스캔 중지';
    _qrLoop();
  }catch(e){
    console.error('[QR]',e);
    if(idle)idle.style.display='flex';
    if(hint)hint.textContent='카메라를 열 수 없어요. 권한을 확인하거나 코드 입력을 이용하세요';
    showToast('카메라를 열 수 없어요. 알림/카메라 권한을 확인해주세요');
    stopQRScan();
  }
}
function stopQRScan(){
  _qrScanning=false;
  if(_qrRAF){cancelAnimationFrame(_qrRAF);_qrRAF=null;}
  try{ if(_qrStream){_qrStream.getTracks().forEach(function(t){t.stop();});} }catch(e){}
  _qrStream=null;
  var video=document.getElementById('qr-video');
  var idle=document.getElementById('qr-idle');
  var btn=document.getElementById('qr-scan-btn');
  if(video){video.style.display='none';try{video.srcObject=null;}catch(e){}}
  if(idle){idle.style.display='flex';var h=document.getElementById('qr-hint');if(h)h.textContent='아래 버튼을 눌러 카메라를 켜주세요';}
  if(btn)btn.innerHTML='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> 카메라로 스캔하기';
}
function _qrLoop(){
  if(!_qrScanning)return;
  var video=document.getElementById('qr-video');
  var canvas=document.getElementById('qr-canvas');
  if(video&&video.readyState===video.HAVE_ENOUGH_DATA&&window.jsQR){
    var w=video.videoWidth,h=video.videoHeight;
    if(w&&h){
      canvas.width=w;canvas.height=h;
      var ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(video,0,0,w,h);
      var img=ctx.getImageData(0,0,w,h);
      var res=window.jsQR(img.data,w,h,{inversionAttempts:'dontInvert'});
      if(res&&res.data){ onQRDetected(res.data); return; }
    }
  }
  _qrRAF=requestAnimationFrame(_qrLoop);
}
function onQRDetected(text){
  // 기대 형식: HD-ATTEND-{주}-{코드}
  var expected='HD-ATTEND-'+qrState.week+'-'+qrState.code;
  var ok = qrState.code && qrState.week && (text.trim()===expected);
  if(!ok){
    // 형식은 맞지만 다른 주/코드일 수 있음 → 안내 후 계속 스캔
    try{ if(navigator.vibrate)navigator.vibrate(60); }catch(e){}
    var hint=document.getElementById('qr-hint');
    showToast('❌ 유효한 출석 QR이 아니에요. 교사 QR을 다시 찍어주세요');
    _qrRAF=requestAnimationFrame(_qrLoop);    // 계속 시도
    return;
  }
  try{ if(navigator.vibrate)navigator.vibrate([80,40,80]); }catch(e){}
  stopQRScan();
  doAttend();
}
// 탭을 벗어나거나 화면 전환 시 카메라 정리
window.addEventListener('pagehide',function(){try{stopQRScan();}catch(e){}});
function selYear(btn){btn.closest('.year-tabs').querySelectorAll('.year-tab').forEach(t=>t.classList.remove('active'));btn.classList.add('active');}
let currentDetailStudentId=null;
let currentGradLetterSid=null;
function toggleGradLetterOpen(){if(!(G.role==='teacher'&&(G.type==='principal'||G.isAdmin))){showToast('교감·관리자만 열 수 있어요');return;}gradLetterOpen=!gradLetterOpen;if(gradLetterOpen){notifications.unshift({pushed:false,id:'nt'+Date.now()+'gl1',text:'💌 <b>졸업 축하 편지</b>가 열렸어요! 고3 학생들에게 마음을 전해보세요.',time:'방금',ts:Date.now(),readBy:[],hiddenBy:[],noPush:true,forTeacher:true,tap:{type:'grad-letter'}});notifications.unshift({pushed:false,id:'nt'+Date.now()+'gl2',text:'💌 <b>졸업 축하 편지</b>가 열렸어요! 고3 선배·친구에게 마음을 전해보세요.',time:'방금',ts:Date.now(),readBy:[],hiddenBy:[],noPush:true,forRole:'student',tap:{type:'grad-letter'}});updateNotifDot();showToast('💌 편지 쓰기를 열고 알림을 보냈어요');}else{showToast('편지 쓰기를 닫았어요');}renderGradLetterEntry();openGradLetters();}
function renderGradLetterEntry(){const el=document.getElementById('home-grad-letter-section');if(!el)return;const has=pendingList.some(u=>u.role==='student'&&u.approved&&!u.hidden&&(u.gradeLabel==='고3'||u.graduated)&&u.id!==G.id);const canWrite=gradLetterOpen&&!G.graduated&&has;el.innerHTML=canWrite?`<div onclick="openGradLetters()" style="cursor:pointer;display:flex;align-items:center;gap:14px;margin:10px 14px 0;padding:16px 18px;border-radius:var(--radius-lg);background:linear-gradient(135deg,#E8A0CC,#9B8FD4);color:#fff"><div style="flex:1"><div style="font-size:11px;opacity:.8;letter-spacing:1px">GRADUATION</div><div style="font-size:15px;font-weight:800;margin-top:2px">💌 졸업 축하 편지</div><div style="font-size:11.5px;opacity:.9;margin-top:3px">고3 선배에게 마음을 전해보세요</div></div><div style="font-size:18px;opacity:.9">›</div></div>`:'';el.style.display=canWrite?'':'none';}
function openGradLetters(){const list=pendingList.filter(u=>u.role==='student'&&u.approved&&!u.hidden&&(u.gradeLabel==='고3'||u.graduated)&&u.id!==G.id);const bar=document.getElementById('grad-letter-admin-bar');const canCtl=G.role==='teacher'&&(G.type==='principal'||G.isAdmin);if(bar)bar.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;background:${gradLetterOpen?'var(--mint-light)':'var(--bg)'};border:1px solid var(--border-light);border-radius:10px;padding:8px 12px"><span style="font-size:11px;font-weight:700;color:${gradLetterOpen?'#2D9E8F':'var(--text-light)'}">${gradLetterOpen?'💌 편지 쓰기 열림':'🔒 아직 열리지 않음'}</span>${canCtl?`<button class="btn btn-sm" style="background:${gradLetterOpen?'var(--coral-light)':'var(--lavender)'};color:${gradLetterOpen?'var(--coral)':'white'};padding:4px 12px;font-size:11px" onclick="toggleGradLetterOpen()">${gradLetterOpen?'닫기':'열기 · 알림 보내기'}</button>`:''}</div>`;const el=document.getElementById('grad-letter-students');if(!gradLetterOpen&&G.role!=='teacher'){if(el)el.innerHTML='<div class="empty" style="padding:24px"><div class="empty-emoji" style="font-size:28px">🔒</div><div class="empty-title" style="font-size:13px">아직 편지 쓰기가 열리지 않았어요</div></div>';openModal('grad-letter-modal');return;}if(el)el.innerHTML=list.length?list.map(u=>{const mine=letters.some(l=>l.studentId===u.id&&l.authorId===G.id);return `<div class="student-row" onclick="openGradLetterWrite('${u.id}')" style="cursor:pointer"><div class="student-avatar" style="background:linear-gradient(135deg,var(--primary),var(--lavender))">${u.name.charAt(0)}</div><div class="student-info"><div class="student-name">${u.name} ${u.baptism}${u.graduated?' <span class="chip chip-gray" style="font-size:9px">🎓 졸업</span>':''}</div><div class="student-detail">${u.gradeLabel||''}${mine?' · ✍️ 내 편지 있음':''}</div></div><div style="font-size:16px;flex-shrink:0">💌</div></div>`;}).join(''):'<div class="empty" style="padding:24px"><div class="empty-emoji" style="font-size:28px">🎓</div><div class="empty-title" style="font-size:13px">고3·졸업 학생이 없어요</div></div>';openModal('grad-letter-modal');}
function openGradLetterWrite(sid){currentGradLetterSid=sid;const u=pendingList.find(x=>x.id===sid);if(!u)return;const tt=document.getElementById('glw-title');if(tt)tt.textContent='💌 '+u.name+' '+u.baptism+'에게';const list=letters.filter(l=>l.studentId===sid&&l.authorId===G.id);const cc=document.getElementById('glw-compose-card');if(cc)cc.style.display='';const sb=document.getElementById('glw-save-btn');if(sb)sb.style.display='';const el=document.getElementById('glw-list');if(el)el.innerHTML=list.length?list.map(l=>`<div class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-size:12px;font-weight:700;color:var(--lavender)">💌 <span onclick="openProfileView('${l.authorId||''}')" style="cursor:pointer">${l.authorName}</span> <span class="chip ${l.authorRole==='teacher'?'chip-mint':'chip-blue'}" style="font-size:9px">${l.authorRole==='teacher'?'선생님':l.authorRole==='parent'?'학부모':'친구'}</span></span><span style="font-size:10px;color:var(--text-light)">${l.date||''}${l.authorId===G.id?' · 내 편지':''}</span></div><div style="font-size:12px;color:var(--text-sub);line-height:1.6;white-space:pre-wrap">${(l.text||'').replace(/</g,'&lt;')}</div>${l.authorId===G.id?`<div style="text-align:right;margin-top:6px"><button class="btn btn-sm" style="background:var(--coral-light);color:var(--coral);padding:4px 10px;font-size:11px" onclick="deleteGradLetter('${l.id}')">🗑 삭제</button></div>`:''}</div>`).join(''):'<div style="font-size:11px;color:var(--text-light);padding:2px 2px 10px">아직 내가 쓴 편지가 없어요. 첫 편지를 남겨보세요! (편지는 나만 볼 수 있어요)</div>';const ta=document.getElementById('glw-text');const mine=list.find(l=>l.authorId===G.id);if(ta)ta.value=mine?mine.text:'';openModal('grad-letter-write-modal');}
function deleteGradLetter(id){const i=letters.findIndex(l=>l.id===id&&l.authorId===G.id);if(i<0)return;if(!confirm('내 편지를 삭제할까요?'))return;letters.splice(i,1);openGradLetterWrite(currentGradLetterSid);openGradLetters();openModal('grad-letter-write-modal');showToast('편지를 삭제했어요');}
function saveGradLetter(){if(G.role==='student'&&G.graduated){showToast('졸업생은 편지를 쓸 수 없어요');return;}if(!gradLetterOpen){showToast('아직 편지 쓰기가 열리지 않았어요');return;}const sid=currentGradLetterSid;const u=pendingList.find(x=>x.id===sid);if(!u)return;const txt=(document.getElementById('glw-text').value||'').trim();if(!txt){showToast('편지 내용을 입력해주세요');return;}const date=new Date().toLocaleDateString('ko-KR');let l=letters.find(x=>x.studentId===sid&&x.authorId===G.id);if(l){l.text=txt;l.date=date;}else letters.push({id:'lt'+Date.now(),studentId:sid,authorId:G.id,authorName:G.displayName||(G.name+' '+G.baptism),authorRole:G.role,text:txt,date});openGradLetterWrite(sid);openGradLetters();openModal('grad-letter-write-modal');showToast('💌 편지가 저장되었어요');}
/* 부적절한 편지는 인쇄에서 제외 (원본은 남겨둠) */
function toggleLetterPrint(lid){
  if(G.role!=='teacher'){showToast('교사만 바꿀 수 있어요');return;}
  var l=letters.find(function(x){return x.id===lid;});if(!l)return;
  if(!l.excluded&&!confirm('이 편지를 인쇄물에서 뺄까요?\n\n편지는 지워지지 않고, 인쇄할 때만 빠집니다.'))return;
  l.excluded=!l.excluded;
  try{if(typeof flushSync==='function')flushSync();}catch(e){}
  var u=pendingList.find(function(x){return x.id===currentDetailStudentId;});
  if(u)renderDetailLetters(u);
  showToast(l.excluded?'인쇄에서 제외했어요':'다시 인쇄에 포함했어요');
}
function renderDetailLetters(u){const wrap=document.getElementById('detail-letter-wrap');if(!wrap)return;const show=G.role==='teacher'&&(u.graduated||u.gradeLabel==='고3');wrap.style.display=show?'':'none';if(!show)return;const list=letters.filter(l=>l.studentId===u.id);const cnt=document.getElementById('detail-letter-count');if(cnt)cnt.textContent=list.length?list.length+'명 작성':'아직 없음';const el=document.getElementById('detail-letter-list');if(el)el.innerHTML=list.length?list.map(l=>`<div class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-size:12px;font-weight:700;color:var(--lavender)">💌 <span onclick="openProfileView('${l.authorId||''}')" style="cursor:pointer">${l.authorName}</span> <span class="chip ${l.authorRole==='teacher'?'chip-mint':'chip-blue'}" style="font-size:9px">${l.authorRole==='teacher'?'선생님':l.authorRole==='parent'?'학부모':'친구'}</span></span><span style="font-size:10px;color:var(--text-light)">${l.date||''}${l.authorId===G.id?' · 내 편지':''}</span></div><div style="font-size:12px;color:${l.excluded?'var(--text-light)':'var(--text-sub)'};line-height:1.6;white-space:pre-wrap${l.excluded?';text-decoration:line-through':''}">${(l.text||'').replace(/</g,'&lt;')}</div><div style="text-align:right;margin-top:7px"><button onclick="toggleLetterPrint('${l.id}')" style="border:1px solid var(--border-light);background:${l.excluded?'var(--coral-light)':'var(--bg)'};color:${l.excluded?'#D95F50':'var(--text-sub)'};border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;font-family:inherit;cursor:pointer">${l.excluded?'🚫 인쇄 제외됨 · 되돌리기':'인쇄에서 빼기'}</button></div></div>`).join(''):'<div class="empty" style="padding:16px"><div class="empty-emoji" style="font-size:24px">💌</div><div class="empty-title" style="font-size:12px">아직 작성된 편지가 없어요</div></div>';const ta=document.getElementById('teacher-letter-input');const mine=list.find(l=>l.authorId===G.id);if(ta)ta.value=mine?mine.text:'';}
function saveTeacherLetter(){if(G.role!=='teacher'){showToast('교사만 편지를 남길 수 있어요');return;}const u=pendingList.find(x=>x.id===currentDetailStudentId);if(!u)return;const txt=(document.getElementById('teacher-letter-input').value||'').trim();if(!txt){showToast('편지 내용을 입력해주세요');return;}const date=new Date().toLocaleDateString('ko-KR');let l=letters.find(x=>x.studentId===u.id&&x.authorId===G.id);if(l){l.text=txt;l.date=date;l.edited=true;}else letters.push({id:'lt'+Date.now(),studentId:u.id,authorId:G.id,authorName:G.displayName||(G.name+' '+G.baptism),authorRole:'teacher',text:txt,date});renderDetailLetters(u);showToast('💌 편지가 저장되었어요');}
function saveMemo(){if(!currentDetailStudentId)return;const u=pendingList.find(u=>u.id===currentDetailStudentId);if(!u)return;u.memo=document.getElementById('teacher-memo').value;showToast('메모가 저장되었습니다');}

(function(){const d=new Date();const days=['일','월','화','수','목','금','토'];const el=document.getElementById('today-date');if(el)el.textContent=d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 ('+days[d.getDay()]+')'})();

function selRegRole(role,btn){G.regRole=role;document.querySelectorAll('#screen-register .role-tab').forEach(t=>t.classList.remove('active'));btn.classList.add('active');show('birth-wrap',role!=='parent');show('student-extra',role==='student');show('parent-extra',role==='parent');show('teacher-extra',role==='teacher');updatePreview();}
function updatePreview(){const name=(document.getElementById('reg-name')||{}).value||'';const baptism=(document.getElementById('reg-baptism')||{}).value||'';const box=document.getElementById('preview-box');const el=document.getElementById('preview-name');if(!box||!el)return;let out='';if(G.regRole==='student'){const s=(document.getElementById('reg-school')||{}).value||'';const gnR=((document.getElementById('reg-grade-num')||{}).value||'');const g=gnR.replace('학년','');const gl=gnR==='prep'?' (🌱 예비중1)':s==='middle'&&g?' (중'+g+')':s==='high'&&g?' (고'+g+')':'';if(name&&baptism)out=name+' '+baptism+gl;}else if(G.regRole==='teacher'){const pos=(document.getElementById('reg-position')||{}).value||'';const POS={m1:'(중1)',m2:'(중2)',m3:'(중3)',h:'(고등)',principal:'(교감)',admin:'(교무)',etc:'(기타)'};if(name&&baptism)out='교사 '+name+' '+baptism+(POS[pos]?' '+POS[pos]:'');}else{const children=[];document.querySelectorAll('#children-list .child-row').forEach(row=>{const inputs=row.querySelectorAll('input');const cn=(inputs[0]?.value||'').trim();if(cn)children.push(cn);});if(name&&baptism)out=name.charAt(0)+baptism+(children.length?' ('+children.join(', ')+')':'');}if(out){box.style.display='block';el.textContent=out;}else box.style.display='none';}
function addChild(){const list=document.getElementById('children-list');const id=G.childCount++;const row=document.createElement('div');row.className='child-row';row.id='child-'+id;row.innerHTML='<input class="form-input" type="text" placeholder="자녀 이름" oninput="updatePreview()" style="flex:1"><input class="form-input" type="text" placeholder="세례명" oninput="updatePreview()" style="flex:1"><button class="child-remove" style="display:flex" onclick="removeChild('+id+')">×</button>';list.appendChild(row);document.querySelector('#child-0 .child-remove').style.display='flex';updatePreview();}
function removeChild(i){const r=document.getElementById('child-'+i);if(r)r.remove();const rows=document.querySelectorAll('#children-list .child-row');if(rows.length===1)rows[0].querySelector('.child-remove').style.display='none';updatePreview();}

const PW_SALT='hnm!2026#salt';
async function sha256Hex(str){try{if(!(window.crypto&&window.crypto.subtle))return null;const b=new TextEncoder().encode(str);const h=await crypto.subtle.digest('SHA-256',b);return Array.from(new Uint8Array(h)).map(function(x){return x.toString(16).padStart(2,'0');}).join('');}catch(e){return null;}}
async function hashPw(id,pw){const h=await sha256Hex(PW_SALT+'|'+String(id||'').toLowerCase()+'|'+String(pw||''));return h||('plain:'+pw);}
window.hashPw=hashPw;
/* 아이디 입력칸: 한글·공백 등은 입력 즉시 걸러낸다 */
function onlyAsciiId(el){
  try{
    const before=el.value;
    const after=before.replace(/[^A-Za-z0-9._-]/g,'');
    if(before!==after){
      const pos=el.selectionStart-(before.length-after.length);
      el.value=after;
      try{el.setSelectionRange(Math.max(0,pos),Math.max(0,pos));}catch(e){}
      if(!window._idWarnAt||Date.now()-window._idWarnAt>2500){
        window._idWarnAt=Date.now();
        showToast('아이디는 영문·숫자만 사용할 수 있어요');
      }
    }
  }catch(e){}
}
function doRegister(){
  const name=(document.getElementById('reg-name').value||'').trim();
  const baptism=(document.getElementById('reg-baptism').value||'').trim();
  const phone=(document.getElementById('reg-phone').value||'').trim();
  const id=(document.getElementById('reg-id').value||'').trim();
  const pw=(document.getElementById('reg-pw').value||'').trim();
  if(!name||!baptism){showToast('이름과 세례명을 입력해주세요');return;}
  if(!phone){showToast('연락처를 입력해주세요');return;}
  if(!id||pw.length<6){showToast('아이디와 비밀번호(6자 이상)를 입력해주세요');return;}
  if(window.FB&&FB.enabled&&FB.enabled()&&!window._membersLoaded){showToast('회원 정보를 불러오는 중이에요. 잠시 후 다시 시도해주세요');return;}
  if(!/^[A-Za-z0-9._-]+$/.test(id)){showToast('아이디는 영문·숫자만 사용할 수 있어요 (한글·공백 불가)');return;}
  if(id.length<4||id.length>20){showToast('아이디는 4~20자로 입력해주세요');return;}
  if(!/[A-Za-z]/.test(id)){showToast('아이디에 영문을 1자 이상 포함해주세요');return;}
  if(id===ADMIN.id||pendingList.find(u=>u.id.toLowerCase()===id.toLowerCase())){showToast('이미 사용 중인 아이디예요');return;}
  if(window.FB&&FB.enabled&&FB.enabled()&&!doRegister._cloudOk){
    showToast('확인 중이에요…');
    FB.get('members',id).then(function(ex){
      if(ex){showToast('이미 사용 중인 아이디예요');return;}
      doRegister._cloudOk=true;try{doRegister();}finally{doRegister._cloudOk=false;}
    }).catch(function(){doRegister._cloudOk=true;try{doRegister();}finally{doRegister._cloudOk=false;}});
    return;
  }
  let by=parseInt(document.getElementById('reg-byear').value)||0,bm=parseInt(document.getElementById('reg-bmonth').value)||0,bd=parseInt(document.getElementById('reg-bday').value)||0;
  const fm=parseInt(document.getElementById('reg-feast-month').value)||0;
  const fd=parseInt(document.getElementById('reg-feast-day').value)||0;
  const user={name,baptism,phone,id,pwh:'',role:G.regRole,approved:false,joinedAt:toDateStr(new Date()),joinedTs:Date.now(),birthYear:by,birthMonth:bm,birthDay:bd,feastMonth:fm,feastDay:fd};
  if(G.regRole==='student'){const s=document.getElementById('reg-school').value;const gnR=document.getElementById('reg-grade-num').value||'';if(gnR==='prep'){user.cohort=_curSchoolYr()+1;}else{const g=gnR.replace('학년','');if(!s||!g){showToast('학교급과 학년을 선택해주세요');return;}user.cohort=_curSchoolYr()-(s==='middle'?(+g-1):(+g-1+3));}user.gradeOffset=0;try{applyStudentGrade(user);}catch(e){}user.attendTotal=0;user.streak=0;}
  else if(G.regRole==='parent'){const children=[];document.querySelectorAll('#children-list .child-row').forEach(row=>{const inputs=row.querySelectorAll('input');const cn=(inputs[0]?.value||'').trim();const cb=(inputs[1]?.value||'').trim();if(cn)children.push({name:cn,baptism:cb});});if(!children.length){showToast('자녀 이름을 입력해주세요');return;}if(children.some(c=>!c.baptism)){showToast('자녀 세례명도 입력해주세요(동명이인 구분용)');return;}user.children=children;user.isJabumo=false;}
  else{const pos=document.getElementById('reg-position').value;if(!pos){showToast('담당 구분을 선택해주세요');return;}if(pos==='principal'||pos==='admin'){const holder=pendingList.find(x=>x.role==='teacher'&&x.approved&&!x.hidden&&x.teacherType===pos);if(holder){showToast('❌ '+(pos==='principal'?'교감':'교무')+'은 이미 있어요 ('+holder.name+' 선생님). 다른 담당을 선택해주세요');return;}}user.teacherType=pos;const POS={m1:'중1',m2:'중2',m3:'중3',h:'고등',principal:'교감',admin:'교무',etc:'기타'};user.gradeLabel=POS[pos]||pos;}
  hashPw(id,pw).then(function(h){user.pwh=h;});
  pendingList.push(user);
  notifications.unshift({pushed:false,id:'nt'+Date.now()+'rg',text:'⏳ 새 가입 신청: <b>'+name+' '+baptism+'</b> ('+(user.role==='student'?'학생 · '+(user.gradeLabel||''):user.role==='parent'?'학부모':'교사 · '+(user.gradeLabel||''))+') · 승인이 필요해요.',time:'방금',ts:Date.now(),readBy:[],forTeacher:true,tap:{type:'pending'}});updateNotifDot();
  showToast('신청 완료! 교사 승인 후 로그인할 수 있어요 😊');
  setTimeout(()=>goScreen('intro'),2200);
}

/* ── 아이디·비밀번호 찾기 (본인 확인형 · pendingList 기반, 서버 불필요) ── */
function _digitsOnly(s){return String(s||'').replace(/\D/g,'');}
function _normEmail(e){return String(e||'').trim().toLowerCase();}
var _findFails=0,_rpUser=null;
function _findLocked(){try{var until=parseInt(localStorage.getItem('hd-find-lock')||'0',10);if(until&&Date.now()<until){showToast('시도가 많아요. 잠시 후 다시 시도해주세요');return true;}}catch(e){}return false;}
function _findFail(){_findFails++;if(_findFails>=5){try{localStorage.setItem('hd-find-lock',String(Date.now()+5*60*1000));}catch(e){}_findFails=0;}}
function _fillBirthSelects(){var m=document.getElementById('rp-bmonth'),d=document.getElementById('rp-bday');if(m&&m.options.length<=1){var h='<option value="0">월</option>';for(var i=1;i<=12;i++)h+='<option value="'+i+'">'+i+'월</option>';m.innerHTML=h;}if(d&&d.options.length<=1){var h2='<option value="0">일</option>';for(var j=1;j<=31;j++)h2+='<option value="'+j+'">'+j+'일</option>';d.innerHTML=h2;}}
function openFindId(){['fi-name','fi-phone'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});var r=document.getElementById('fi-result');if(r)r.innerHTML='';openModal('find-id-modal');}
function submitFindId(){
  if(_findLocked())return;
  if(!window._membersLoaded){showToast('잠시 후 다시 시도해주세요');return;}
  var name=(document.getElementById('fi-name').value||'').trim();
  var phone=_digitsOnly(document.getElementById('fi-phone').value);
  if(!name||!phone){showToast('이름과 연락처를 입력해주세요');return;}
  var hits=(pendingList||[]).filter(function(u){return u&&u.approved&&!u.hidden&&u.id&&u.id!==ADMIN.id&&u.name===name&&_digitsOnly(u.phone)===phone;});
  var r=document.getElementById('fi-result');if(!r)return;
  if(!hits.length){_findFail();r.innerHTML='<div style="background:var(--coral-light);color:#D95F50;border-radius:10px;padding:12px;font-size:13px;line-height:1.6">일치하는 계정을 찾지 못했어요.<br>가입 정보가 다르면 교사에게 문의해주세요.</div>';return;}
  _findFails=0;
  r.innerHTML='<div style="background:var(--primary-light);border-radius:10px;padding:12px;font-size:13px;color:var(--text);line-height:1.9">회원님의 아이디예요<br>'+hits.map(function(u){return '<b style="font-size:15px;color:var(--primary-dark)">'+_esc(u.id)+'</b>'+(u.role==='parent'?' (학부모)':u.role==='teacher'?' (교사)':' (학생)');}).join('<br>')+'</div>';
}
var WORKER_URL='https://heavensdoor-push.YOUR-SUBDOMAIN.workers.dev'; /* ← Cloudflare Worker 주소로 교체 */
function _workerReady(){return !!(WORKER_URL&&WORKER_URL.indexOf('YOUR-')<0);}
function openResetPw(){_fillBirthSelects();['rp-id','rp-name','rp-phone','rp-email','rp-new','rp-new2','rpe-id','rpe-code','rpe-new','rpe-new2'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});var m=document.getElementById('rp-bmonth'),d=document.getElementById('rp-bday');if(m)m.selectedIndex=0;if(d)d.selectedIndex=0;show('rp-choose',false);show('rp-email-step',false);show('rp-verify-step',true);show('rp-newpw-step',false);show('rpe-before-code',true);show('rpe-after-code',false);_rpUser=null;openModal('reset-pw-modal');}
function rpChooseSelf(){show('rp-choose',false);show('rp-email-step',false);show('rp-verify-step',true);show('rp-newpw-step',false);}
function rpChooseEmail(){if(!_workerReady()){showToast('이메일 재설정이 아직 설정되지 않았어요. 본인 확인으로 진행해주세요');rpChooseSelf();return;}show('rp-choose',false);show('rp-verify-step',false);show('rp-newpw-step',false);show('rp-email-step',true);show('rpe-before-code',true);show('rpe-after-code',false);}
async function rpSendCode(){
  if(!_workerReady()){rpChooseSelf();return;}
  var id=(document.getElementById('rpe-id').value||'').trim();
  if(!id){showToast('아이디를 입력해주세요');return;}
  showToast('코드를 보내는 중…');
  try{
    var r=await fetch(WORKER_URL.replace(/\/$/,'')+'/reset-send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id})});
    var j=await r.json();
    if(j&&j.noEmail){showToast('등록된 이메일이 없어요. 본인 확인으로 진행해주세요');rpChooseSelf();var rn=document.getElementById('rp-id');if(rn)rn.value=id;return;}
    if(!j||!j.ok){showToast('코드 발송에 실패했어요. 잠시 후 다시 시도해주세요');return;}
    var msg=document.getElementById('rpe-sent-msg');if(msg)msg.textContent='📧 '+(j.masked||'이메일')+' 로 인증코드를 보냈어요. 15분 안에 입력해주세요.';
    show('rpe-before-code',false);show('rpe-after-code',true);
  }catch(e){showToast('네트워크 오류예요. 잠시 후 다시 시도해주세요');}
}
async function rpConfirmCode(){
  if(!_workerReady())return;
  var id=(document.getElementById('rpe-id').value||'').trim();
  var code=(document.getElementById('rpe-code').value||'').trim();
  var n1=(document.getElementById('rpe-new').value||'').trim();
  var n2=(document.getElementById('rpe-new2').value||'').trim();
  if(code.length!==6){showToast('인증코드 6자리를 입력해주세요');return;}
  if(n1.length<6){showToast('새 비밀번호는 6자 이상이어야 해요');return;}
  if(n1!==n2){showToast('새 비밀번호가 서로 달라요');return;}
  try{
    var r=await fetch(WORKER_URL.replace(/\/$/,'')+'/reset-confirm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id,code:code,newPw:n1})});
    var j=await r.json();
    if(!j||!j.ok){var mm={'wrong-code':'인증코드가 올바르지 않아요','expired':'코드가 만료됐어요. 다시 받아주세요','too-many':'시도가 많아요. 다시 받아주세요','no-code':'먼저 코드를 받아주세요','no-member':'계정을 찾을 수 없어요'};showToast((j&&mm[j.error])||'재설정에 실패했어요');return;}
    closeModal('reset-pw-modal');
    var idEl=document.getElementById('login-id');if(idEl)idEl.value=id;
    var pwEl=document.getElementById('login-pw');if(pwEl)pwEl.value='';
    showToast('비밀번호가 재설정되었어요. 새 비밀번호로 로그인해주세요');
  }catch(e){showToast('네트워크 오류예요. 잠시 후 다시 시도해주세요');}
}
function verifyResetPw(){
  if(_findLocked())return;
  if(!window._membersLoaded){showToast('잠시 후 다시 시도해주세요');return;}
  var id=(document.getElementById('rp-id').value||'').trim();
  var name=(document.getElementById('rp-name').value||'').trim();
  var phone=_digitsOnly(document.getElementById('rp-phone').value);
  var bm=parseInt(document.getElementById('rp-bmonth').value||'0',10);
  var bd=parseInt(document.getElementById('rp-bday').value||'0',10);
  var email=(document.getElementById('rp-email')?(document.getElementById('rp-email').value||''):'').trim();
  if(!id||!name||!phone||!bm||!bd){showToast('모든 항목을 입력해주세요');return;}
  if(id===ADMIN.id){showToast('관리자 계정은 이 방법으로 재설정할 수 없어요');return;}
  var u=(pendingList||[]).find(function(x){return x&&x.approved&&!x.hidden&&x.id===id;});
  if(u&&u.email&&!email){showToast('가입 시 입력한 이메일을 입력해주세요');return;}
  var ok=u&&u.name===name&&_digitsOnly(u.phone)===phone&&(+u.birthMonth)===bm&&(+u.birthDay)===bd&&(!u.email||_normEmail(u.email)===_normEmail(email));
  if(!ok){_findFail();showToast('입력한 정보가 일치하지 않아요');return;}
  _findFails=0;_rpUser=u;show('rp-verify-step',false);show('rp-newpw-step',true);
}
async function submitResetPw(){
  if(!_rpUser){show('rp-verify-step',true);show('rp-newpw-step',false);return;}
  var n1=(document.getElementById('rp-new').value||'').trim();
  var n2=(document.getElementById('rp-new2').value||'').trim();
  if(n1.length<6){showToast('새 비밀번호는 6자 이상이어야 해요');return;}
  if(n1!==n2){showToast('새 비밀번호가 서로 달라요');return;}
  var u=_rpUser;
  try{
    u.pwh=await hashPw(u.id,n1);
    delete u.pw;delete u.mustChangePw;
    u.pwv=Number(u.pwv||0)+1;
    try{if(window.FB&&FB.enabled()&&FB.save)FB.save('members',u.id,u);}catch(e){}
    try{if(window.flushSync)window.flushSync();}catch(e){}
  }catch(e){showToast('재설정 중 오류가 발생했어요');return;}
  var uid=u.id;_rpUser=null;
  closeModal('reset-pw-modal');
  var idEl=document.getElementById('login-id');if(idEl)idEl.value=uid;
  var pwEl=document.getElementById('login-pw');if(pwEl)pwEl.value='';
  showToast('비밀번호가 재설정되었어요. 새 비밀번호로 로그인해주세요');
}
async function doLogin(){
  const id=(document.getElementById('login-id').value||'').trim();
  const pw=(document.getElementById('login-pw').value||'').trim();
  if(!id||!pw){showToast('아이디와 비밀번호를 입력해주세요');return;}
  const hp=await hashPw(id,pw);
  if(id===ADMIN.id){
    const rec=adminRec();
    if(rec){
      const okPw=(rec.pwh&&rec.pwh===hp)||(!rec.pwh&&hp===ADMIN.pwh);
      if(!okPw){showToast('아이디 또는 비밀번호가 올바르지 않아요');return;}
      if(rec.hidden){showToast('비활동(숨김) 처리된 계정이에요');return;}
      startSession(rec);return;
    }
    /* 회원 레코드가 없음 → 최초 설치이거나 관리자 부재 시 비상 복구 */
    const anyAdmin=pendingList.some(u=>u.approved&&u.role==='teacher'&&u.isAdmin);
    if(hp!==ADMIN.pwh){showToast('아이디 또는 비밀번호가 올바르지 않아요');return;}
    if(appConfig.adminSeeded&&anyAdmin){showToast('탈퇴한 계정이에요. 관리자에게 문의해주세요');return;}
    ensureAdminMember();
    startSession(adminRec()||ADMIN);return;
  }
  let u=pendingList.find(x=>x.id===id&&x.approved&&x.pwh&&x.pwh===hp);
  if(!u){ /* 평문 비밀번호 계정 자동 마이그레이션 */
    const lg=pendingList.find(x=>x.id===id&&x.approved&&!x.pwh&&x.pw&&x.pw===pw);
    if(lg){lg.pwh=hp;delete lg.pw;u=lg;}
  }
  if(u){if(u.hidden){showToast('비활동(숨김) 처리된 계정이에요. 관리자에게 문의해주세요');return;}startSession(u);return;}
  showToast('아이디 또는 비밀번호가 올바르지 않아요');
}

function startSession(u){
  if(!previewMode&&(u.id==='jonghwa'||u===ADMIN))purgeDemoData();
  if(!previewMode)currentLoginUser=u;
  G.role=u.role;G.name=u.name;G.baptism=u.baptism;G.id=u.id||'jonghwa';
  G.type=u.teacherType||u.type||'';G.gradeKey=u.gradeKey||'';G.grade=u.gradeLabel||'';
  /* 관리자 계정은 회원 문서가 없을 수 있어 저장해둔 직책을 우선 적용한다.
     (ADMIN 상수에는 teacherType이 없어 매번 '기타'로 돌아가던 문제) */
  try{
    if((u.id||'')===ADMIN.id&&typeof appConfig!=='undefined'&&appConfig.adminPos&&appConfig.adminPos.t){
      G.type=appConfig.adminPos.t;
      G.grade=appConfig.adminPos.l||G.grade;
      ADMIN.teacherType=G.type;ADMIN.type=G.type;ADMIN.gradeLabel=G.grade;
    }
  }catch(e){}
  G.isAdmin=u.isAdmin||false;G.isJabumo=u.isJabumo||false;G.isJabumoPresident=u.isJabumoPresident||false;G.graduated=u.graduated||false;
  G.birthMonth=u.birthMonth||0;G.birthDay=u.birthDay||0;
  G.feastMonth=u.feastMonth||0;G.feastDay=u.feastDay||0;
  G.attendTotal=u.attendTotal||0;G.streak=u.streak||0;G.history=u.history||[];G.attendedWeeks=u.attendedWeeks||[];G.halfWeeks=u.halfWeeks||[];G.qrScanAt=u.qrScanAt||{};if(u.avatar)G.avatar=u.avatar;G.statusMsg=u.statusMsg||'';
  document.getElementById('bottom-nav').style.display='flex';
  const isS=G.role==='student',isP=G.role==='parent',isT=G.role==='teacher';
  const isFull=isT&&(G.type==='principal'||G.type==='admin'||G.isAdmin);
  show('nav-attend',isS&&!G.graduated);show('nav-diary',isS&&!G.graduated);show('nav-board',!(isS&&G.graduated));if(isS&&G.graduated)setTimeout(()=>showToast('🎓 졸업생 열람 모드로 접속했어요'),400);show('nav-activity',isT||isS);const _al=document.getElementById('nav-activity-label'),_at=document.getElementById('activity-screen-title');const _grad=isS&&G.graduated;const _i1=document.getElementById('nav-activity-icon-dept'),_i2=document.getElementById('nav-activity-icon-grad');if(_i1)_i1.style.display=_grad?'none':'';if(_i2)_i2.style.display=_grad?'':'none';if(_al)_al.textContent=_grad?'활동카드':'부서활동';if(_at)_at.textContent=(isS&&G.graduated)?'활동카드':'부서활동';show('nav-teacher',isT);show('nav-admin',isT);if(isP){show('menu-jabumo-roster',!!G.isJabumoPresident);show('menu-jabumo-requests',!!G.isJabumoPresident);}
  show('home-student',isS);show('home-teacher',isT);show('home-parent',isP);
  show('event-banner-section',isS||isT||isP);show('reward-section',isS);
  show('board-teacher-top',isT);show('board-student-cats',isS);show('board-parent-cats',isP);
  show('fab-board',(isS&&!G.graduated)||isT);show('activity-write-btn',isT);
  if(isP)show('nav-jabumo-tab',true);
  show('my-stats-student',isS);show('menu-attend',isS);show('menu-badge',isS);show('menu-coupon',isS);show('menu-diary',isS);show('menu-mycard',isS);show('menu-posts',true);show('menu-resource',isT);
  show('my-posts-resource-tab',isT);show('my-posts-board-tab',isT);show('my-posts-activity-tab',isT);show('my-posts-jabumo-tab',isP);const allTabEl=document.getElementById('my-posts-all-tab');if(allTabEl)allTabEl.textContent=isS?'자유게시판':'전체';
  show('qr-manage-section',isT);if(isT)syncQRUI();show('cal-add-btn',isT);
  if(isS){const gl=G.grade||({m1:'중1',m2:'중2',m3:'중3',h:'고등부'}[G.gradeKey]||'');G.displayName=G.name+' '+G.baptism+(gl?' ('+gl+')':'');document.getElementById('role-badge').textContent=G.graduated?'졸업생':gl;const sn=document.getElementById('stamp-name');if(sn)sn.textContent=G.displayName+crownMark(G);const mad=document.getElementById('my-attend-detail');if(mad)mad.textContent='이번 달 '+monthAttendCount(G)+'회 출석';initStamps();filterBoardStudent(G.gradeKey);}
  else if(isP){const cs=(u.children||[]).map(c=>c.name||c).join(', ');G.displayName=G.name+' '+G.baptism+(cs?'('+cs+')':'')+' 학부모';document.getElementById('role-badge').textContent=G.isJabumoPresident?'학부모·자부모회장':'학부모';const phn=document.getElementById('parent-home-name');if(phn){phn.textContent=G.displayName+'님';phn.innerHTML=phn.innerHTML+'<br>안녕하세요 👋';}filterBoardParent();renderParentChildCards(u.children||[]);}
  else{const POS={m1:'중1 담당',m2:'중2 담당',m3:'중3 담당',h:'고등 담당',principal:'교감',admin:'교무',etc:'기타'};G.displayName='교사 '+G.name+' '+G.baptism;document.getElementById('role-badge').textContent=POS[G.type]||G.grade||'교사';const thn=document.getElementById('teacher-home-name');if(thn)thn.textContent=G.displayName+(G.grade?' T('+G.grade+')':' T')+' ✝️';const thd=document.getElementById('teacher-home-desc');if(thd)thd.textContent=isFull?(G.grade?G.grade+' 담당 · 전체 관리 권한이 있어요.':'전체 학년을 총괄합니다. 관리 탭에서 확인하세요.'):G.grade+' 담당 선생님, 오늘도 좋은 교리를 전해주세요 🙏';renderAdminGrid(isFull);renderGovSection();updatePendingUI();filterBoardTeacher();}
  setMyProfile();checkBirthday();checkNewCoupons();checkImportantNotices();renderHomeNotices();renderHomeSchedule();renderEventBanner();renderStoryRow();renderGradLetterEntry();checkAbsentNotifications();updateNotifDot();if(!previewMode){try{localStorage.setItem('hd-session-id',G.id);localStorage.setItem('hd-session-pwv',String((u&&u.pwv)||0));}catch(e){}}if(window._restoring){window._restoring=false;var lt='home';try{lt=localStorage.getItem('hd-last-tab')||'home';}catch(e){}goScreen(lt);switchTab(lt);}else{goScreen('home');switchTab('home');showToast('환영합니다, '+G.name+' '+G.baptism+'님 😊');}
try{initPush();_bindForeground();}catch(e){}try{setTimeout(cleanOrphanVac,1200);}catch(e){}try{checkForcedPwChange();}catch(e){}}

/* 헤더 배지 · 교사 홈 배너를 현재 세션 값으로 다시 그린다 */
function paintTeacherHome(){
  try{
    if(G.role!=='teacher')return;
    var POS={m1:'중1 담당',m2:'중2 담당',m3:'중3 담당',h:'고등 담당',principal:'교감',admin:'교무',etc:'기타'};
    G.displayName='교사 '+G.name+' '+G.baptism;
    var rb=document.getElementById('role-badge');
    if(rb)rb.textContent=POS[G.type]||G.grade||'교사';
    var thn=document.getElementById('teacher-home-name');
    if(thn)thn.textContent=G.displayName+(G.grade?' T('+G.grade+')':' T')+' ✝️';
    var isFull=G.type==='principal'||G.type==='admin'||G.isAdmin;
    var thd=document.getElementById('teacher-home-desc');
    if(thd)thd.textContent=isFull?(G.grade?G.grade+' 담당 · 전체 관리 권한이 있어요.':'전체 학년을 총괄합니다. 관리 탭에서 확인하세요.'):(G.grade||'담당')+' 담당 선생님, 오늘도 좋은 교리를 전해주세요 🙏';
  }catch(e){}
}
function setMyProfile(){try{updateVerseEditUI();}catch(e){}const AVT={student:'😊',parent:'👨‍👩‍👧',teacher:'✝️'};const POS={m1:'중1 담당',m2:'중2 담당',m3:'중3 담당',h:'고등 담당',principal:'교감',admin:'교무',etc:'기타 교사'};const roleLabel=G.role==='student'?(G.graduated?'🎓 졸업생':(G.grade||{m1:'중1',m2:'중2',m3:'중3',h:'고등부'}[G.gradeKey]||'')):G.role==='parent'?'':(POS[G.type]||'교사')+(G.isAdmin?' · 관리자':'');var _ma=document.getElementById('my-avatar');if(_ma){if(G.avatar){_ma.style.backgroundImage='url('+G.avatar+')';_ma.style.backgroundSize='cover';_ma.style.backgroundPosition='center';_ma.innerHTML='';}else{_ma.style.backgroundImage='';_ma.innerHTML='<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.92)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:auto"><circle cx="12" cy="9" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>';}}var _ms=document.getElementById('my-status');if(_ms)_ms.textContent=G.statusMsg||'';document.getElementById('my-name').textContent=G.displayName;document.getElementById('my-role').textContent=roleLabel;show('my-role',G.role!=='parent');show('menu-position',G.role==='teacher');const badgeEl=document.getElementById('my-name-badge');if(G.isJabumoPresident){if(badgeEl){badgeEl.textContent='자부모회장';badgeEl.style.color='var(--yellow)';}show('my-name-badge',true);}else if(G.role==='student'&&crownCount(G)>0){if(badgeEl){const c=crownCount(G);badgeEl.textContent='👑'.repeat(Math.min(c,5))+' 명예 왕관';badgeEl.style.color='var(--yellow)';}show('my-name-badge',true);}else{show('my-name-badge',false);}const mgh=document.getElementById('my-grade-hint');if(mgh)mgh.textContent=G.role==='student'?'학년·이름·세례명 변경은 교사 승인 필요':'이름·세례명 변경은 승인 필요';}
/* ── 본인 비밀번호 변경 ── */
let _pwForce=false;
function openPwChange(force){
  _pwForce=!!force;
  document.getElementById('pw-cur').value='';
  document.getElementById('pw-new').value='';
  document.getElementById('pw-new2').value='';
  document.getElementById('pw-force-msg').style.display=force?'block':'none';
  document.getElementById('pw-cur-wrap').style.display=force?'none':'block';
  openModal('pw-change-modal');
}
async function submitPwChange(){
  const me=pendingList.find(u=>u.id===G.id);
  if(!me){showToast('회원 정보를 찾을 수 없어요');return;}
  const cur=(document.getElementById('pw-cur').value||'').trim();
  const n1=(document.getElementById('pw-new').value||'').trim();
  const n2=(document.getElementById('pw-new2').value||'').trim();
  if(!_pwForce){
    if(!cur){showToast('현재 비밀번호를 입력해주세요');return;}
    const hc=await hashPw(G.id,cur);
    const ok=(me.pwh&&me.pwh===hc)||(!me.pwh&&me.pw&&me.pw===cur);
    if(!ok){showToast('현재 비밀번호가 올바르지 않아요');return;}
  }
  if(n1.length<6){showToast('새 비밀번호는 6자 이상이어야 해요');return;}
  if(n1!==n2){showToast('새 비밀번호가 서로 달라요');return;}
  me.pwh=await hashPw(G.id,n1);
  delete me.pw;
  delete me.mustChangePw;
  _pwForce=false;
  closeModal('pw-change-modal');
  showToast('🔑 비밀번호를 변경했어요');
}

/* ── 관리자·교감: 임시 비밀번호 발급 ── */
let _tempPw='';
function canResetPw(){return G.role==='teacher'&&(G.type==='principal'||G.type==='admin'||G.isAdmin);}
async function resetMemberPw(uid){
  if(!canResetPw()){showToast('교감·교무·관리자만 가능해요');return;}
  const u=pendingList.find(x=>x.id===uid);
  if(!u){showToast('회원을 찾을 수 없어요');return;}
  if(!confirm(u.name+' '+(u.baptism||'')+' 님의 비밀번호를 초기화할까요?\n임시 비밀번호가 발급되고 기존 비밀번호는 사용할 수 없어요.'))return;
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let t='';for(let i=0;i<8;i++)t+=chars[Math.floor(Math.random()*chars.length)];
  u.pwh=await hashPw(u.id,t);
  delete u.pw;
  u.mustChangePw=true;
  u.pwv=Number(u.pwv||0)+1;                     /* 그 회원의 모든 기기 자동 로그아웃 */
  _tempPw=t;
  notifications=notifications.filter(n=>n.id!=='nt-pwreset-'+u.id);
  notifications.unshift({id:'nt-pwreset-'+u.id,text:'🔑 비밀번호가 초기화되었어요. 선생님께 받은 임시 비밀번호로 로그인한 뒤 새 비밀번호를 설정해주세요.',time:'방금',ts:Date.now(),pushed:false,readBy:[],forStudentId:u.role==='student'?u.id:undefined,forTeacherId:u.role!=='student'?u.id:undefined});
  updateNotifDot();
  document.getElementById('pw-reset-who').textContent=u.name+' '+(u.baptism||'')+' ('+u.id+')';
  document.getElementById('pw-reset-code').textContent=t;
  closeModal('member-detail-modal');
  openModal('pw-reset-modal');
}
function copyTempPw(){
  try{navigator.clipboard.writeText(_tempPw);showToast('📋 복사했어요');}
  catch(e){showToast('임시 비밀번호: '+_tempPw);}
}
function _forceKickedLogout(msg){try{previewMode=false;setPreviewBarVisible(false);}catch(e){}try{localStorage.removeItem('hd-session-id');localStorage.removeItem('hd-last-tab');}catch(e){}try{currentLoginUser=null;}catch(e){}try{G.id='';G.role='';}catch(e){}try{var nav=document.getElementById('bottom-nav');if(nav)nav.style.display='none';}catch(e){}try{clearBdaySlide();}catch(e){}try{goScreen('intro');}catch(e){}try{showToast(msg||'로그아웃 되었습니다');}catch(e){}}
function doLogout(){previewMode=false;setPreviewBarVisible(false);try{localStorage.removeItem('hd-session-id');localStorage.removeItem('hd-last-tab');}catch(e){}document.getElementById('bottom-nav').style.display='none';clearBdaySlide();goScreen('intro');showToast('로그아웃 되었습니다');}

function stampPage(d){var _v=function(w){return isVacationDate(w)||isEduVacation(w);};var n=(G.attendedWeeks||[]).filter(function(w){return !_v(w);}).length;var pages=Math.max(1,Math.ceil(n/10));var p=(window._stampPage||pages)+d;if(p<1)p=1;if(p>pages)p=pages;window._stampPage=p;initStamps();}
function initStamps(){const t=G.attendTotal||0;var _nx=null;for(const L of ATTEND_LEVELS){if(t<L.n){_nx=L;break;}}var _pv=0;ATTEND_LEVELS.forEach(L=>{if(t>=L.n)_pv=L.n;});var _vacS=function(w){return isVacationDate(w)||isEduVacation(w);};
  var _halfSet={};(G.halfWeeks||[]).forEach(function(w){_halfSet[w]=1;});
  var _marks=(G.attendedWeeks||[]).filter(function(w){return !_vacS(w);}).sort().map(function(w){return _halfSet[w]?'half':'full';});
  const _pages=Math.max(1,Math.ceil(_marks.length/10));if(typeof window._stampPage!=='number'||window._stampPage>_pages||window._stampPage<1)window._stampPage=_pages;const _pg=window._stampPage;
  var _slice=_marks.slice((_pg-1)*10,(_pg-1)*10+10);
  const g=document.getElementById('stamp-dots');if(g)g.innerHTML=Array.from({length:10},(_,i)=>{var m=_slice[i];return '<div class="stamp-dot'+(m?' filled':'')+'"'+(m==='half'?' style="background:#F5C451;border-color:#F5C451" title="반일 출석"':'')+'></div>';}).join('');
  const _pgWrap=document.getElementById('stamp-pager');if(_pgWrap)_pgWrap.style.display=(_pages>1)?'flex':'none';const _pgTxt=document.getElementById('stamp-page-txt');if(_pgTxt)_pgTxt.textContent=_pg+'번째 판';const pf=document.getElementById('stamp-fill');if(pf)pf.style.width=(_nx?Math.min(100,Math.max(0,Math.round((t-_pv)/((_nx.n-_pv)||1)*100))):100)+'%';const pt=document.getElementById('stamp-prog-txt');if(pt)pt.textContent=(_nx?(t+'/'+_nx.n+'회'):'최고 등급 👑');const st=document.getElementById('stamp-total');if(st)countUp(st,t);const sm=document.getElementById('stamp-month');if(sm)sm.textContent=monthAttendCount(G);const ss=document.getElementById('stamp-streak');if(ss)ss.textContent=(G.streak||0);try{var _re=document.getElementById('stamp-rank');if(_re){if(G.role==='student'){var _st=(pendingList||[]).filter(function(u){return u&&u.approved&&u.role==='student'&&!u.hidden&&!u.graduated;});_st.sort(function(a,b){return (b.attendTotal||0)-(a.attendTotal||0)||(b.streak||0)-(a.streak||0)||((a.name||'')>(b.name||'')?1:-1);});var _mi=-1;for(var _k=0;_k<_st.length;_k++){if(_st[_k].id===G.id){_mi=_k;break;}}var _md=['🥇','🥈','🥉'];_re.textContent=(_mi>=0&&_mi<3&&(G.attendTotal||0)>0)?(_md[_mi]+' 나의 순위 '+(_mi+1)+'위'):'🏆 나의 순위 보기';_re.style.display='';}else{_re.style.display='none';}}}catch(e){}const mt=document.getElementById('my-total');if(mt)mt.textContent=t;let lv='🌱 씨앗';for(const L of ATTEND_LEVELS)if(t>=L.n)lv=L.l;const sl=document.getElementById('stamp-level');if(sl)sl.textContent=lv;const bi=document.getElementById('my-badge-icon');if(bi)bi.textContent=lv.split(' ')[0];ATTEND_LEVELS.forEach(L=>{const tier=document.getElementById('reward-tier-'+L.n);const icon=document.getElementById('reward-icon-'+L.n);const badge=document.getElementById('reward-badge-'+L.n);const achieved=t>=L.n;if(tier)tier.style.opacity=achieved?'1':'.6';if(icon)icon.style.filter=achieved?'none':'grayscale(1)';if(badge){if(achieved){badge.style.background='var(--yellow-light)';badge.style.color='#9A7200';badge.textContent='✅ 달성!';}else{badge.style.background='var(--bg)';badge.style.color='var(--text-light)';badge.textContent=L.n+'회';}}});}

function toggleCfgSec(btn){btn.parentElement.classList.toggle('open');}
const BDAY_REWARD_DEFAULT='생일 축하 간식 세트 🎁';
/* 세례명별 수호 성인 한 줄 소개 (없으면 기본 문구) */
const SAINTS={
 '베드로':'예수님께서 "너는 베드로다"라고 부르신 첫 교황. 열두 사도의 으뜸.',
 '바오로':'박해자에서 사도로 회심한 이방인의 사도. 신약 서간의 저자.',
 '요한':'예수님께서 사랑하신 제자. 요한복음과 요한 묵시록의 저자.',
 '야고보':'열두 사도의 한 사람. 스페인 산티아고 순례길의 주인공.',
 '안드레아':'베드로의 형제이자 예수님의 첫 제자. X자 십자가에서 순교.',
 '토마스':'"제 주님, 제 하느님!" 부활하신 예수님을 알아본 사도.',
 '마태오':'세리에서 사도가 된 마태오 복음사가.',
 '마르코':'마르코 복음의 저자. 베드로의 통역이자 제자.',
 '루카':'의사이자 화가였던 복음사가. 루카복음과 사도행전의 저자.',
 '스테파노':'교회의 첫 순교자. 돌에 맞아 죽으면서도 박해자를 위해 기도했습니다.',
 '필립보':'열두 사도의 한 사람. "와서 보시오"라고 친구를 초대한 사도.',
 '토마스아퀴나스':'중세 최고의 신학자. 『신학대전』의 저자.',
 '프란치스코':'가난을 신부로 삼은 아시시의 성인. 모든 피조물을 형제라 불렀습니다.',
 '안토니오':'잃어버린 물건을 찾아주는 성인으로 사랑받는 파도바의 설교가.',
 '아우구스티노':'방황 끝에 회심한 교부. "당신 안에 쉬기까지는 편안하지 않습니다."',
 '베네딕토':'서방 수도생활의 아버지. "기도하고 일하라(Ora et Labora)".',
 '이냐시오':'예수회의 창립자. 영신수련의 저자.',
 '도미니코':'설교자회(도미니코회)의 창립자.',
 '요셉':'성모 마리아의 배필이자 예수님의 양부. 노동자의 수호성인.',
 '미카엘':'하느님의 군대를 이끄는 대천사. "누가 하느님과 같으랴".',
 '가브리엘':'성모님께 예수님의 탄생을 알린 대천사.',
 '라파엘':'토빗을 인도한 치유의 대천사.',
 '마리아':'하느님의 어머니. 모든 성인의 모범.',
 '마리아막달레나':'부활의 첫 증인. "사도들의 사도".',
 '안나':'성모 마리아의 어머니. 할머니들의 수호성인.',
 '엘리사벳':'세례자 요한의 어머니. 성모님을 "복되신 분"이라 부른 첫 사람.',
 '데레사':'아빌라의 데레사 — 기도의 스승이자 교회학자.',
 '소화데레사':'"작은 길"의 성녀. 작은 일을 큰 사랑으로.',
 '체칠리아':'음악가와 성가대의 수호성인.',
 '아녜스':'어린 나이에 순교한 동정 순교자. 순결의 상징.',
 '루치아':'눈과 빛의 수호성녀. 이름 자체가 "빛"입니다.',
 '카타리나':'시에나의 카타리나 — 교황을 로마로 돌아오게 한 교회학자.',
 '클라라':'아시시의 클라라 — 프란치스코의 벗이자 가난한 자매회의 창립자.',
 '모니카':'아우구스티노의 어머니. 눈물의 기도로 아들을 회심시켰습니다.',
 '베로니카':'십자가의 길에서 예수님의 얼굴을 닦아드린 여인.',
 '헬레나':'예수님의 십자가를 찾아낸 콘스탄티누스 대제의 어머니.',
 '이레네':'평화라는 뜻의 이름을 가진 초기 교회의 순교 성녀.',
 '세실리아':'음악과 성가대의 수호성녀.',
 '유스티노':'철학자에서 그리스도인이 된 호교론자이자 순교자.',
 '라우렌시오':'가난한 이들이 교회의 참된 보물이라 말한 부제 순교자.',
 '김대건':'한국 최초의 사제이자 순교자. "이것이 나의 마지막 시간입니다."',
 '정하상':'한국 교회의 평신도 지도자이자 순교자.',
 '가롤로':'교회 개혁에 헌신한 밀라노의 대주교 카를로 보로메오.',
 '알로이시오':'젊은이들의 수호성인. 병자를 돌보다 23세에 선종했습니다.',
 '요한보스코':'청소년의 아버지. 살레시오회의 창립자.',
 '비오':'오상을 받은 20세기의 성인 피에트렐치나의 비오 신부.',
 '제라시모':'사자를 벗으로 삼았다고 전해지는 사막의 수도자.',
 '라파엘라':'가난한 이들을 위해 헌신한 성심의 성녀.',
 '릴리안':'하느님께 봉헌된 순결한 삶을 살아간 성녀.'
};
function saintBlurb(baptism){
  const key=String(baptism||'').replace(/\s/g,'');
  try{ if(appConfig&&appConfig.saintDesc&&appConfig.saintDesc[key]) return appConfig.saintDesc[key]; }catch(e){}
  if(SAINTS[key])return SAINTS[key];
  for(const k in SAINTS){ if(key&&(key.indexOf(k)>=0||k.indexOf(key)>=0))return SAINTS[k]; }
  return '오늘은 수호 성인의 날이에요. 성인의 삶을 본받아 하루를 살아가요 🙏';
}
function editSaintDesc(){
  if(!(G&&G.role==='teacher')){showToast('교사만 편집할 수 있어요');return;}
  var baptism=window._curSaintBaptism||'';
  var key=String(baptism||'').replace(/\s/g,'');
  if(!key)return;
  var cur=saintBlurb(baptism);
  var v=prompt('『'+baptism+'』 수호 성인 설명을 편집하세요.\n(비우고 확인하면 기본 설명으로 되돌아가요)',cur);
  if(v===null)return;
  if(!appConfig.saintDesc)appConfig.saintDesc={};
  var t=(v||'').trim();
  if(t)appConfig.saintDesc[key]=t; else delete appConfig.saintDesc[key];
  try{if(window.flushCfg)window.flushCfg();}catch(e){}
  try{document.getElementById('bday-saint-desc').textContent=saintBlurb(baptism);}catch(e){}
  showToast('✝️ 수호 성인 설명을 저장했어요');
}
function _codeFromKey(key){var h=0;key=String(key);for(var i=0;i<key.length;i++){h=(h*31+key.charCodeAt(i))>>>0;}return String(100000+(h%900000));}
function checkCelebrations(){try{checkBirthdayCoupons();}catch(e){}try{checkFeastCoupons();}catch(e){}}
function dedupeBdayCoupons(){var by={};(coupons||[]).forEach(function(c){if(!c||!c.bdayKey)return;var e=by[c.bdayKey];if(!e){by[c.bdayKey]=c;return;}var cs=(c.used?1:0),es=(e.used?1:0);if(cs>es||(cs===es&&String(c.id)<String(e.id)))by[c.bdayKey]=c;});coupons=coupons.filter(function(c){return !c||!c.bdayKey||by[c.bdayKey]===c;});}
function checkFeastCoupons(){ /* 축일 알림은 서버가 당일 오전 10시에 발송 */ }
function checkBirthdayCoupons(){dedupeBdayCoupons();const now=new Date();const m=now.getMonth()+1,d=now.getDate(),yr=now.getFullYear();let issued=false;pendingList.filter(u=>u.approved&&u.role==='student'&&!u.hidden&&!u.graduated&&+u.birthMonth===m&&+u.birthDay===d).forEach(u=>{const key=u.id+'-'+yr;const cid='cpbday-'+key;if(coupons.some(c=>c.id===cid||c.bdayKey===key))return;issued=true;const reward=appConfig.bdayReward||BDAY_REWARD_DEFAULT;const code=_codeFromKey(key);coupons.push({id:cid,studentId:u.id,studentName:u.name+' '+u.baptism,badgeLabel:'🎂 생일',reward,code,used:false,createdAt:now.toLocaleDateString('ko-KR'),bdayKey:key});notifications.unshift({pushed:false,id:'nt'+Date.now()+'bt'+u.id,text:`🎂 오늘은 ${u.name} ${u.baptism} 학생의 생일! 생일 쿠폰이 발급되었어요. 인증번호: ${code}`,time:'방금',ts:Date.now(),readBy:[],forTeacher:true,tap:{type:'coupon-admin'}});notifications.unshift({pushed:false,id:'nt'+Date.now()+'bs'+u.id,text:`🎂 생일 축하해요! <b>${reward}</b> 쿠폰이 도착했어요. 선생님께 확인받고 사용하세요!`,time:'방금',ts:Date.now(),readBy:[],forStudentId:u.id,tap:{type:'coupon'}});});if(issued){updateNotifDot();if(typeof renderAdminCouponList==='function')renderAdminCouponList();}}
function checkForcedPwChange(){
  try{
    const me=pendingList.find(u=>u.id===G.id);
    if(me&&me.mustChangePw){ setTimeout(function(){openPwChange(true);},800); }
  }catch(e){}
}
function checkBirthday(){checkCelebrations();const now=new Date();const m=now.getMonth()+1;const d=now.getDate();let dismissed=null;try{dismissed=localStorage.getItem(_bdayDismissKey());}catch(e){}if(!dismissed&&+G.birthMonth===m&&+G.birthDay===d){showBirthdayScreen('birth',{name:G.name,baptism:G.baptism},true,G.id);}else if(!dismissed&&+G.feastMonth===m&&+G.feastDay===d){showBirthdayScreen('feast',{name:G.name,baptism:G.baptism},true,G.id);}renderBdayBannerAuto();}
function renderBdayBannerAuto(){try{if(!(G&&G.id))return;const now=new Date();const m=now.getMonth()+1,d=now.getDate();const isToday=u=>((+u.birthMonth===m&&+u.birthDay===d)||(+u.feastMonth===m&&+u.feastDay===d));let list=[];if(isToday(G))list.push({id:G.id,name:G.name,baptism:G.baptism,birthMonth:G.birthMonth,birthDay:G.birthDay,feastMonth:G.feastMonth,feastDay:G.feastDay});pendingList.filter(u=>u.approved&&!u.hidden&&u.id!==G.id&&isToday(u)).forEach(u=>list.push(u));const section=document.getElementById('bday-banner-section');if(!list.length){if(section)section.style.display='none';return;}renderBdayBanner(list);}catch(e){}}
function startConfetti(){const c=document.querySelector('#birthday-screen .confetti')||document.querySelector('.confetti');if(!c)return;c.innerHTML='';const colors=['#FFD166','#FF7B6B','#4A90D9','#2CC9B0','#9B8FD4','#FFF'];for(let i=0;i<40;i++){const p=document.createElement('div');const sz=6+Math.random()*8;p.style.cssText=`position:absolute;top:-12px;left:${Math.random()*100}%;width:${sz}px;height:${sz*0.6}px;background:${colors[i%colors.length]};border-radius:2px;animation:fall${i%3} ${2.5+Math.random()*2.5}s linear ${Math.random()*2}s infinite`;c.appendChild(p);}}
function stopConfetti(){document.querySelectorAll('.confetti').forEach(c=>c.innerHTML='');}
let bdayTargetId=null,bdayMsgsOpen=false;
function showBirthdayScreen(type,person,isSelf,targetId){bdayTargetId=targetId||G.id;bdayMsgsOpen=false;const isBirth=type==='birth';const p=person||{name:G.name,baptism:G.baptism};document.getElementById('bday-emoji').textContent=isBirth?'🎂':'✝️';
  try{
    const sw=document.getElementById('bday-saint');
    if(sw){
      if(!isBirth&&p.baptism){
        document.getElementById('bday-saint-name').textContent='성 '+p.baptism;
        document.getElementById('bday-saint-desc').textContent=saintBlurb(p.baptism);
        window._curSaintBaptism=p.baptism;
        try{var _eb=document.getElementById('bday-saint-edit');if(_eb)_eb.style.display=(G&&G.role==='teacher')?'inline-flex':'none';}catch(e){}
        sw.style.display='block';
      }else sw.style.display='none';
    }
  }catch(e){}if(isSelf){document.getElementById('bday-main-msg').textContent=isBirth?'🎂 생일 축하합니다!':'✨ 축일 축하합니다!';document.getElementById('bday-sub-msg').textContent='중고등부 가족들이 축하해드려요!';}else{document.getElementById('bday-main-msg').textContent=isBirth?'🎉 오늘은 '+p.name+' '+p.baptism+'의 생일이에요!':'✨ 오늘은 '+p.name+' '+p.baptism+'의 축일이에요!';document.getElementById('bday-sub-msg').textContent=isBirth?'따뜻한 축하 메시지를 남겨주세요 🎁':'수호 성인의 날을 축하해주세요 🙏';}show('bday-dismiss-btn',!!isSelf);show('bday-input-row',!isSelf);const wrap=document.getElementById('bday-comments-wrap');const tog=document.getElementById('bday-msg-toggle');if(isSelf){if(wrap)wrap.style.display='none';if(tog){tog.style.display='inline-block';const n=birthdayComments.filter(c=>c.targetId===bdayTargetId).length;tog.textContent=n?'💌 축하 메시지 '+n+'개 모두 보기':'💌 아직 도착한 메시지가 없어요';}}else{if(wrap)wrap.style.display='block';if(tog)tog.style.display='none';}startConfetti();renderBdayComments();renderBdayLike();document.getElementById('birthday-fullscreen').classList.add('open');}
function toggleBdayMsgs(){bdayMsgsOpen=!bdayMsgsOpen;const wrap=document.getElementById('bday-comments-wrap');const tog=document.getElementById('bday-msg-toggle');if(wrap)wrap.style.display=bdayMsgsOpen?'block':'none';if(tog&&bdayMsgsOpen)tog.textContent='💌 메시지 접기';else if(tog){const n=birthdayComments.filter(c=>c.targetId===bdayTargetId).length;tog.textContent=n?'💌 축하 메시지 '+n+'개 모두 보기':'💌 아직 도착한 메시지가 없어요';}}
function closeBirthdayScreen(){document.getElementById('birthday-fullscreen').classList.remove('open');}
function _bdayDismissKey(){
  const n=new Date();
  return 'hd-bday-hide-'+(G&&G.id?G.id:'x')+'-'+n.getFullYear()+'-'+(n.getMonth()+1)+'-'+n.getDate();
}
function dismissBirthdayToday(){
  /* localStorage 사용 — sessionStorage 는 앱을 껐다 켜면 지워져서 다시 떴음 */
  try{localStorage.setItem(_bdayDismissKey(),'1');}catch(e){}
  closeBirthdayScreen();
  try{showToast('오늘은 다시 보이지 않아요');}catch(e){}
}
function renderBdayComments(){const wrap=document.getElementById('bday-comments-wrap');if(!wrap)return;const list=birthdayComments.filter(c=>c.targetId===bdayTargetId);try{const _tg=document.getElementById('bday-msg-toggle');if(_tg&&_tg.style.display!=='none'&&!bdayMsgsOpen)_tg.textContent=list.length?('💌 축하 메시지 '+list.length+'개 모두 보기'):'💌 아직 도착한 메시지가 없어요';}catch(e){}if(!list.length){wrap.innerHTML='<div style="font-size:13px;color:rgba(255,255,255,0.8);text-align:center">아직 축하 메시지가 없어요</div>';return;}wrap.innerHTML=list.map(c=>`<div style="margin-bottom:8px"><span style="color:white;font-weight:700;font-size:12px">${c.author}</span> <span style="color:rgba(255,255,255,0.9);font-size:12px">${c.text}</span></div>`).join('');}
function _lkId(x){return String((x&&x.id!=null)?x.id:x);}
function _hasLike(k){return bdayLikes.some(function(x){return _lkId(x)===k;});}
function renderBdayLike(){const btn=document.getElementById('bday-like-btn');if(!btn)return;const mine=bdayTargetId+'|'+G.id;const list=bdayLikes.filter(k=>_lkId(k).indexOf(bdayTargetId+'|')===0);const isSelf=bdayTargetId===G.id;btn.querySelector('.like-icon').textContent=isSelf?'❤️':(_hasLike(mine)?'❤️':'🤍');const cnt=btn.querySelector('.like-count');if(isSelf){cnt.style.display='';cnt.textContent=list.length;}else{cnt.style.display=_hasLike(mine)?'':'none';cnt.textContent=_hasLike(mine)?'꾹!':'';}}
function toggleBdayLike(){if(bdayTargetId===G.id){showToast('가족들에게 받은 하트예요 💕');return;}const k=bdayTargetId+'|'+G.id;const idx=bdayLikes.findIndex(function(x){return _lkId(x)===k;});if(idx>=0)bdayLikes.splice(idx,1);else bdayLikes.push({id:k,targetId:bdayTargetId,userId:G.id});renderBdayLike();try{var _bi=document.querySelector('#bday-like-btn .like-icon');if(_bi){_bi.classList.remove('pop-anim');void _bi.offsetWidth;_bi.classList.add('pop-anim');}}catch(e){}}
function submitBdayComment(){if(bdayTargetId===G.id)return;const inp=document.getElementById('bday-comment-input');const txt=(inp.value||'').trim();if(!txt)return;birthdayComments.push({id:'bc'+Date.now(),targetId:bdayTargetId,author:G.displayName,text:txt,time:'방금'});notifications.unshift({id:'nt'+Date.now(),text:'💌 '+G.displayName+'님이 축하 메시지를 남겼어요: "'+txt+'"',time:'방금',ts:Date.now(),pushed:false,readBy:[],forStudentId:bdayTargetId,tap:{type:'bday',targetId:bdayTargetId}});updateNotifDot();inp.value='';renderBdayComments();try{if(typeof flushSync==='function')flushSync();}catch(e){}showToast('축하 메시지를 전했어요 🎉');}
function openBdayFromBanner(uid){const now=new Date();const m=now.getMonth()+1,d=now.getDate();if(uid===G.id){const sb=G.birthMonth===m&&G.birthDay===d;showBirthdayScreen(sb?'birth':'feast',{name:G.name,baptism:G.baptism},true,G.id);return;}const u=pendingList.find(u=>u.id===uid);if(!u)return;const isBirth=u.birthMonth===m&&u.birthDay===d;showBirthdayScreen(isBirth?'birth':'feast',{name:u.name,baptism:u.baptism},false,u.id);}
function renderBdayBanner(list){const section=document.getElementById('bday-banner-section');const slides=document.getElementById('bday-slides');const dots=document.getElementById('bday-dots');if(!section||!slides)return;const m=new Date().getMonth()+1,d=new Date().getDate();slides.innerHTML=list.map(u=>{const isBirth=+u.birthMonth===m&&+u.birthDay===d;return `<div class="bday-slide bday-slide-other" onclick="openBdayFromBanner('${u.id}')" style="color:white;display:flex;align-items:center;gap:14px;min-width:100%;padding:16px 18px;cursor:pointer"><div style="font-size:36px">${isBirth?'🎂':'✝️'}</div><div style="flex:1"><div style="font-size:11px;opacity:.8;margin-bottom:2px">${isBirth?'🎂 생일':'✝️ 축일'}</div><div style="font-size:16px;font-weight:800">${u.name} ${u.baptism}</div><div style="font-size:12px;opacity:.85;margin-top:4px">오늘의 주인공을 축하해요!</div></div></div>`;}).join('');if(dots)dots.innerHTML=list.map((_,i)=>`<div class="bday-dot${i===0?' active':''}" onclick="goBdaySlide(${i})" style="cursor:pointer;padding:4px"></div>`).join('');section.style.display='block';bdaySlideIdx=0;bdaySlideTotal=list.length;const sl=document.getElementById('bday-slides');sl.style.transform='translateX(0)';if(list.length>1)initBdaySwipe(sl);}
function goBdaySlide(i){bdaySlideIdx=Math.max(0,Math.min(bdaySlideTotal-1,i));const sl=document.getElementById('bday-slides');if(sl)sl.style.transform=`translateX(-${bdaySlideIdx*100}%)`;document.querySelectorAll('.bday-dot').forEach((d,x)=>d.classList.toggle('active',x===bdaySlideIdx));}
function initBdaySwipe(sl){let sx=null,sy=null,moved=false;sl.style.transition='transform .25s';sl.ontouchstart=e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;moved=false;};sl.ontouchmove=e=>{if(sx===null)return;if(Math.abs(e.touches[0].clientX-sx)>10)moved=true;};sl.ontouchend=e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx;const dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){goBdaySlide(bdaySlideIdx+(dx<0?1:-1));if(sl._blockClick)clearTimeout(sl._blockClick);sl._swiped=true;sl._blockClick=setTimeout(()=>sl._swiped=false,300);}sx=null;};sl.addEventListener('click',e=>{if(sl._swiped){e.stopPropagation();e.preventDefault();}},true);}
let bdaySlideTotal=1;let currentDiaryDetailId=null;
function clearBdaySlide(){if(bdaySlideTimer){clearInterval(bdaySlideTimer);bdaySlideTimer=null;}}

function _canStudentSee(p,gk){if(!p)return false;if(p.cat==='event')return true;var t=p.target||'all';if(t==='all')return true;if(t==='student'){var g=p.grade;return g==='all'||g==='all-s'||!g||g===gk;}return false;}
function _canParentSee(p){if(!p)return false;if(p.cat==='event')return true;var t=p.target||'all';return t==='all'||t==='parent';}
function _resetBoardTab(sel){try{var tb=document.querySelector(sel+' .tab-btn');if(tb){document.querySelectorAll(sel+' .tab-btn').forEach(function(b){b.classList.remove('active');});tb.classList.add('active');}}catch(e){}}
function filterBoardStudent(gk){currentBoardCat='notice';show('fab-board',false);_resetBoardTab('#board-student-cats');renderBoardList('notice',posts.filter(p=>p.cat==='notice'&&_canStudentSee(p,gk)));}
function filterBoardParent(){currentBoardCat='notice';show('fab-board',false);_resetBoardTab('#board-parent-cats');renderBoardList('notice',posts.filter(p=>p.cat==='notice'&&_canParentSee(p)));}
function selParentCat(cat,btn){selCatTab(btn);currentBoardCat=cat;show('fab-board',cat==='jabumo'&&(G.isJabumo||G.isJabumoPresident));if(cat==='jabumo'){if(G.isJabumo||G.isJabumoPresident){renderBoardList('jabumo',posts.filter(p=>p.cat==='jabumo'));}else{_renderJabumoLocked();}return;}renderBoardList(cat,posts.filter(p=>p.cat===cat&&_canParentSee(p)));}
function _renderJabumoLocked(){var el=document.getElementById('post-list');if(!el)return;var pres=pendingList.find(function(u){return u.isJabumoPresident;});var me=pendingList.find(function(u){return u.id===G.id;});var requested=me&&me.jabumoRequested;el.innerHTML='<div class="card" style="text-align:center;padding:30px 20px"><div style="font-size:42px;margin-bottom:12px">🔒</div><div style="font-size:15px;font-weight:800;margin-bottom:8px">자부모회 회원 전용</div><div style="font-size:12.5px;color:var(--text-light);line-height:1.7;margin-bottom:20px">자부모회 게시판은 회원만 열람할 수 있어요.<br>'+(pres?('현 회장: <b>'+pres.name+' '+pres.baptism+'</b> 님'):'아직 자부모회장이 없어요')+'</div>'+(requested?'<div style="font-size:13px;font-weight:700;color:var(--primary-dark);background:var(--primary-light);border-radius:12px;padding:14px;line-height:1.6">✅ 가입 신청 완료<br><span style="font-size:11px;font-weight:500;color:var(--text-light)">회장님의 승인을 기다리고 있어요</span></div>':'<button class="btn btn-primary" style="width:100%" onclick="applyJabumo()">자부모회 가입 신청하기</button>')+'</div>';}
function applyJabumo(){var pres=pendingList.find(function(u){return u.isJabumoPresident;});var me=pendingList.find(function(u){return u.id===G.id;});if(!me)return;if(me.jabumoRequested){showToast('이미 신청했어요');return;}if(!pres){showToast('아직 자부모회장이 없어 신청할 수 없어요');return;}me.jabumoRequested=true;notifications.unshift({pushed:false,id:'nt'+Date.now()+'jbreq',text:'<b>'+G.name+' '+G.baptism+'</b> 학부모가 자부모회 가입을 신청했어요. 눌러서 승인해주세요.',time:'방금',ts:Date.now(),readBy:[],hiddenBy:[],forParentId:pres.id,tap:{type:'jabumo-req',uid:me.id}});updateNotifDot();try{if(typeof flushSync==='function')flushSync();}catch(e){}_renderJabumoLocked();showToast('자부모회 가입을 신청했어요');}
function _jabumoReqList(){return pendingList.filter(function(u){return u.role==='parent'&&u.jabumoRequested&&!u.isJabumo&&!u.hidden;});}
function openJabumoRequests(){if(!G.isJabumoPresident){showToast('자부모회장만 볼 수 있어요');return;}var el=document.getElementById('jabumo-requests-list');if(!el)return;var reqs=_jabumoReqList();if(!reqs.length){el.innerHTML='<div class="empty" style="padding:26px"><div class="empty-emoji">📭</div><div class="empty-title" style="font-size:13px">대기 중인 신청이 없어요</div></div>';}else{el.innerHTML=reqs.map(function(u){var kids=(u.children||[]).map(function(c){return c.name||c;}).join(', ');return '<div class="pending-card"><div class="pending-head"><span class="pending-name">'+u.name+' '+u.baptism+'</span><span class="chip chip-mint">학부모</span></div><div class="pending-info">'+(kids?'자녀: '+kids:'자녀 정보 없음')+'</div><div class="pending-actions"><button class="btn-approve" onclick="approveJabumoReq(\''+u.id+'\')">✅ 승인</button><button class="btn-reject" onclick="rejectJabumoReq(\''+u.id+'\')">❌ 거절</button></div></div>';}).join('');}openModal('jabumo-requests-modal');}
function approveJabumoReq(id){if(!G.isJabumoPresident)return;var u=pendingList.find(function(x){return x.id===id;});if(!u)return;u.isJabumo=true;u.jabumoRequested=false;notifications.unshift({pushed:false,id:'nt'+Date.now()+'jbok',text:'🎉 자부모회 가입이 승인되었어요! 이제 자부모회 게시판을 이용할 수 있어요.',time:'방금',ts:Date.now(),readBy:[],hiddenBy:[],forParentId:u.id,tap:{type:'jabumo-board'}});updateNotifDot();try{if(typeof flushSync==='function')flushSync();}catch(e){}openJabumoRequests();showToast('✅ '+u.name+' 학부모를 승인했어요');}
function rejectJabumoReq(id){if(!G.isJabumoPresident)return;var u=pendingList.find(function(x){return x.id===id;});if(!u)return;if(!confirm(u.name+' '+u.baptism+' 학부모의 가입 신청을 거절할까요?'))return;u.jabumoRequested=false;try{if(typeof flushSync==='function')flushSync();}catch(e){}openJabumoRequests();showToast('신청을 거절했어요');}
function filterBoardTeacher(){currentBoardCat='notice';_resetBoardTab('#board-teacher-top');renderBoardList('notice',posts.filter(p=>p.cat==='notice'));}
function selStudentCat(cat,btn){selCatTab(btn);currentBoardCat=cat;show('fab-board',cat==='free');renderBoardList(cat,posts.filter(p=>p.cat===cat&&_canStudentSee(p,G.gradeKey)));}
function selTeacherCat(cat,btn){selCatTab(btn);currentBoardCat=cat;teacherTargetFilter='all';teacherGradeFilter='all-s';show('board-target-filter',cat!=='jabumo'&&cat!=='event');show('board-grade-filter',false);const tf=document.getElementById('board-target-filter');if(tf)tf.querySelectorAll('.filter-chip').forEach((c,i)=>c.classList.toggle('active',i===0));renderBoardList(cat,posts.filter(p=>p.cat===cat));}
function renderBoardList(cat,arr){arr=sortPostsNewest(arr);if(cat==='gallery')renderGalleryGrid(arr);else renderPosts(arr);}
function renderGalleryGrid(arr){const el=document.getElementById('post-list');if(!el)return;if(!arr||!arr.length){el.innerHTML='<div class="empty"><div class="empty-emoji">🖼️</div><div class="empty-title">아직 사진이 없어요</div></div>';return;}el.innerHTML=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;background:var(--card)">${arr.map(p=>{const img0=(p.images&&p.images[0])||null;const cover=(img0&&img0.src)||p.image||'';const multi=p.images&&p.images.length>1;const clickAttr=p.photoId?`onclick="openStory('${p.photoId}')"`:'';return `<div ${clickAttr} style="position:relative;aspect-ratio:1;cursor:pointer;overflow:hidden;background:var(--border-light)">${cover?`<img src="${cover}" style="width:100%;height:100%;object-fit:cover;display:block">`:'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="opacity:.6"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>'}${multi?`<span style="position:absolute;top:7px;right:7px;width:15px;height:15px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M4 16V6a2 2 0 0 1 2-2h10"></path></svg></span>`:''}</div>`;}).join('')}</div>`;}
function goToBoardCat(cat){switchTab('board');if(G.role==='teacher'){const btn=document.querySelector(`#board-teacher-top .tab-btn[onclick*="selTeacherCat('${cat}'"]`);if(btn)selTeacherCat(cat,btn);}else if(G.role==='student'){const btn=document.querySelector(`#board-student-cats .tab-btn[onclick*="selStudentCat('${cat}'"]`);if(btn)selStudentCat(cat,btn);}else if(G.role==='parent'){const btn=document.querySelector(`#board-parent-cats .tab-btn[onclick*="selParentCat('${cat}'"]`);if(btn)selParentCat(cat,btn);}}
function openWriteModal(){if(gradGuard())return;if(currentBoardCat==='gallery'){if(G.role!=='teacher'){showToast('갤러리는 교사만 게시할 수 있어요');return;}var _gm=document.getElementById('gallery-write-modal');if(_gm)delete _gm.dataset.editId;var _gt0=document.getElementById('gallery-title');if(_gt0)_gt0.value='';var _gc0=document.getElementById('gallery-content');if(_gc0)_gc0.value='';var _gmt=document.getElementById('gallery-modal-title');if(_gmt)_gmt.textContent='🖼️ 갤러리 게시';var _gsb=document.getElementById('gallery-submit-btn');if(_gsb)_gsb.textContent='등록하기';const gt=document.getElementById('gallery-top');if(gt)gt.value='all';show('gallery-mid-wrap',false);const gm=document.getElementById('gallery-mid');if(gm)gm.innerHTML='<option value="">선택</option>';resetAttachBuf('gallery');openModal('gallery-write-modal');}else if(currentBoardCat==='event'){if(G.role!=='teacher'){showToast('이벤트는 교사만 게시할 수 있어요');return;}var _em=document.getElementById('event-write-modal');if(_em)delete _em.dataset.editId;['event-title','event-content','event-deadline','event-youtube'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});var _emt=document.getElementById('event-modal-title');if(_emt)_emt.textContent='🎉 이벤트 게시';var _esb=document.getElementById('event-submit-btn');if(_esb)_esb.textContent='등록하기';resetAttachBuf('event');openModal('event-write-modal');}else{if(G.role==='student'&&currentBoardCat!=='free'){showToast('학생은 자유게시판에만 글을 작성할 수 있어요');return;}var _wm=document.getElementById('write-modal');if(_wm)delete _wm.dataset.editId;['write-title','write-content'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});const lbl=document.getElementById('write-cat-label');if(lbl)lbl.textContent='카테고리: '+(CAT_LABEL[currentBoardCat]||currentBoardCat);const hint=document.getElementById('write-student-hint');if(hint)hint.textContent='📌 '+(CAT_LABEL[currentBoardCat]||currentBoardCat)+' 카테고리로 자동 등록됩니다';const isT=G.role==='teacher';show('write-teacher-cats',isT);show('write-student-cat',G.role==='student');if(!isT){var _sco=document.getElementById('write-student-scope');if(_sco){var _gl=GRADE_LABEL[G.gradeKey]||G.gradeLabel||'우리 학년';_sco.options[1].text='우리 학년만 ('+_gl+')';_sco.value='all-s';}}if(isT){const isFull=G.type==='principal'||G.type==='admin'||G.isAdmin;show('write-push-wrap',G.role==='teacher'&&currentBoardCat==='notice');var _pd=document.getElementById('write-popup-until');if(_pd)_pd.value=_defaultPopupUntil();const top=document.getElementById('write-top');if(top)top.value='';show('write-mid-wrap',false);const mid=document.getElementById('write-mid');if(mid)mid.innerHTML='<option value="">선택</option>';show('write-top-wrap',currentBoardCat!=='jabumo');}resetAttachBuf('write');try{_resetSchedUI('write');}catch(e){}openModal('write-modal');}}
function onGalleryTopChange(){const v=document.getElementById('gallery-top').value;show('gallery-mid-wrap',v!=='all');const mid=document.getElementById('gallery-mid');if(v==='student')mid.innerHTML='<option value="">선택</option><option value="all-s">전체</option><option value="m1">중1</option><option value="m2">중2</option><option value="m3">중3</option><option value="h">고등</option>';else if(v==='parent')mid.innerHTML='<option value="">선택</option><option value="all-p">전체</option>';}
let teacherTargetFilter='all',teacherGradeFilter='all-s';
function applyTeacherFilter(){const arr=posts.filter(p=>{if(p.cat!==currentBoardCat)return false;if(teacherTargetFilter!=='all'&&p.target!==teacherTargetFilter)return false;if(teacherTargetFilter==='student'&&teacherGradeFilter!=='all-s'&&p.grade!==teacherGradeFilter&&p.grade!=='all-s')return false;return true;});renderBoardList(currentBoardCat,arr);}
function selTeacherTarget(target,btn){btn.closest('.filter-row').querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));btn.classList.add('active');teacherTargetFilter=target;teacherGradeFilter='all-s';const gr=document.getElementById('board-grade-filter');if(gr){gr.style.display=target==='student'?'flex':'none';gr.querySelectorAll('.filter-chip').forEach((c,i)=>c.classList.toggle('active',i===0));}applyTeacherFilter();}
function selTeacherGrade(grade,btn){btn.closest('.filter-row').querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));btn.classList.add('active');teacherGradeFilter=grade;applyTeacherFilter();}

function compressImg(file,maxDim,quality,mime){maxDim=maxDim||1280;quality=quality||0.72;mime=mime||'image/jpeg';return new Promise(function(resolve){if(!file){resolve('');return;}function passthrough(){var r=new FileReader();r.onload=function(e){resolve(e.target.result);};r.onerror=function(){resolve('');};r.readAsDataURL(file);}if(!/^image\//.test(file.type||'')||/gif|svg/i.test(file.type||'')){passthrough();return;}function draw(src,w,h){try{var scale=Math.min(1,maxDim/Math.max(w,h));var cw=Math.max(1,Math.round(w*scale)),ch=Math.max(1,Math.round(h*scale));var cv=document.createElement('canvas');cv.width=cw;cv.height=ch;cv.getContext('2d').drawImage(src,0,0,cw,ch);var out=cv.toDataURL(mime,quality);resolve(out&&out.length>22?out:'');}catch(e){passthrough();}}function viaImg(){var url=URL.createObjectURL(file);var img=new Image();img.onload=function(){draw(img,img.naturalWidth||img.width,img.naturalHeight||img.height);URL.revokeObjectURL(url);};img.onerror=function(){URL.revokeObjectURL(url);passthrough();};img.src=url;}if(window.createImageBitmap){createImageBitmap(file,{imageOrientation:'from-image'}).then(function(bmp){draw(bmp,bmp.width,bmp.height);if(bmp.close)bmp.close();}).catch(function(){viaImg();});}else{viaImg();}});}
function readFilesAsDataURLs(files,maxDim,q){var fs=Array.from(files);if(fs.length>12){showToast('사진은 한 번에 12장까지 올릴 수 있어요');fs=fs.slice(0,12);}return Promise.all(fs.map(function(f){return compressImg(f,maxDim||900,q||0.55);}));}
function previewGalleryImages(input){const wrap=document.getElementById('gallery-img-preview');if(!wrap||!input.files||!input.files.length)return;readFilesAsDataURLs(input.files).then(imgs=>{wrap.innerHTML=imgs.map(src=>`<img src="${src}" style="flex-shrink:0;width:76px;height:76px;border-radius:10px;object-fit:cover">`).join('');});}
function previewMainImage(input,previewId){const wrap=document.getElementById(previewId);if(!wrap||!input.files||!input.files[0])return;const r=new FileReader();r.onload=e=>{wrap.innerHTML=`<img src="${e.target.result}" style="width:100%;border-radius:12px;aspect-ratio:4/5;object-fit:cover;display:block">`;};r.readAsDataURL(input.files[0]);}
function submitGalleryPost(){const modal=document.getElementById('gallery-write-modal');const editId=modal.dataset.editId;const title=(document.getElementById('gallery-title').value||'').trim()||'갤러리 사진';const content=(document.getElementById('gallery-content').value||'').trim();const target=document.getElementById('gallery-top')?.value||'all';let grade='all';if(target==='student'||target==='parent'){grade=document.getElementById('gallery-mid')?.value||'';if(!grade){showToast('하위 카테고리를 선택해주세요');return;}}const images=attachBuf.gallery.imgs.map(e=>typeof e==='object'?e:{src:e,comments:[],likes:[]});if(!images.length){showToast('사진을 추가해주세요');return;}if(_imgsTooBig(images))return;if(editId){const p=posts.find(p=>p.id===editId);if(p){p.title=title;p.content=content;p.target=target;p.grade=grade;p.edited=true;p.images=images;p.image=images[0].src;const ph=photosData.find(ph=>ph.id===p.photoId);if(ph){ph.title=title;ph.content=content;ph.images=images;ph.image=images[0].src;ph.target=target;ph.grade=grade;}}delete modal.dataset.editId;document.getElementById('gallery-modal-title').textContent='🖼️ 갤러리 게시';document.getElementById('gallery-submit-btn').textContent='등록하기';showToast('갤러리가 수정되었습니다');}else{const now=new Date();const date=now.getFullYear()+'.'+(now.getMonth()+1).toString().padStart(2,'0')+'.'+now.getDate().toString().padStart(2,'0');const phId='ph'+Date.now();posts.unshift({id:'p'+Date.now(),ts:Date.now(),pushed:false,title,content,cat:'gallery',target,grade,date,authorId:G.id,authorName:G.displayName,comments:[],edited:false,image:images[0].src,images,photoId:phId});photosData.unshift({id:phId,title,content,target,grade,date:now.getFullYear()+'-'+(now.getMonth()+1).toString().padStart(2,'0')+'-'+now.getDate().toString().padStart(2,'0'),image:images[0].src,images,readBy:[]});showToast('갤러리에 등록되었습니다!');}closeModal('gallery-write-modal');document.getElementById('gallery-title').value='';document.getElementById('gallery-content').value='';resetAttachBuf('gallery');document.getElementById('gallery-top').value='all';show('gallery-mid-wrap',false);document.getElementById('gallery-img-input').value='';if(G.role==='teacher')selTeacherCat('gallery',document.querySelector('#board-teacher-top .tab-btn.active')||document.querySelector('#board-teacher-top .tab-btn'));renderStoryRow();}
function _ytId(u){if(!u)return '';var m=String(u).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|[?&]v=)([\w-]{11})/);return m?m[1]:'';}
function openYoutubeVideo(id){if(!id)return;try{window.open('https://www.youtube.com/watch?v='+id,'_blank');}catch(e){location.href='https://www.youtube.com/watch?v='+id;}}
function submitEventPost(){const modal=document.getElementById('event-write-modal');const editId=modal.dataset.editId;const title=(document.getElementById('event-title').value||'').trim();if(!title){showToast('제목을 입력해주세요');return;}const deadline=document.getElementById('event-deadline').value;const content=(document.getElementById('event-content').value||'').trim();const yt=_ytId((document.getElementById('event-youtube')||{}).value||'');const img=attachBuf.event.imgs.length?bufSrc(attachBuf.event.imgs[0]):'';
  if(editId){
    const p=posts.find(p=>p.id===editId);
    /* 사진은 반드시 images 배열에 넣어야 클라우드 저장(enc)에서 살아남음 — image만 넣으면 flush 때 지워져 새로고침 시 사라짐 */
    /* 수정 창을 열 때 기존 사진이 버퍼에 실리므로, 버퍼가 비었으면 '사용자가 지운 것' */
    if(p){p.title=title;p.content=content;p.deadline=deadline;p.edited=true;p.youtube=yt;
      try{delete p.image;}catch(e){}
      if(img){p.images=[{src:img}];try{p.image=img;}catch(e){}}
      else{p.images=[];}}
    const ev=eventsData.find(e=>e.id===p?.eventId);
    if(ev){ev.title=title;ev.deadline=deadline;ev.image=img||'';ev.youtube=yt;}delete modal.dataset.editId;document.getElementById('event-modal-title').textContent='🎉 이벤트 게시';document.getElementById('event-submit-btn').textContent='등록하기';showToast('이벤트가 수정되었습니다');}else{const now=new Date();const date=now.getFullYear()+'.'+(now.getMonth()+1).toString().padStart(2,'0')+'.'+now.getDate().toString().padStart(2,'0');const evId='ev'+Date.now();posts.unshift({id:'p'+Date.now(),ts:Date.now(),pushed:false,title,content,cat:'event',target:'all',grade:'all',deadline,date,authorId:G.id,authorName:G.displayName,comments:[],edited:false,image:img,youtube:yt,eventId:evId});if(img)posts[0].images=[{src:img}];eventsData.unshift({id:evId,title,image:img,youtube:yt,deadline,target:'student'});showToast('이벤트가 등록되었습니다!');}closeModal('event-write-modal');document.getElementById('event-title').value='';document.getElementById('event-content').value='';document.getElementById('event-deadline').value='';var _yi=document.getElementById('event-youtube');if(_yi)_yi.value='';resetAttachBuf('event');document.getElementById('event-img-input').value='';if(G.role==='teacher')selTeacherCat('event',document.querySelector('#board-teacher-top .tab-btn.active')||document.querySelector('#board-teacher-top .tab-btn'));renderEventBanner();}
function getDday(deadline){const diff=Math.ceil((new Date(deadline)-new Date())/(1000*60*60*24));return diff>=0?diff:null;}
let eventActiveList=[];
const EP_THEMES=[
  ['#F09E54','#E0663F'],['#5AA9D6','#3D6FB4'],['#7FC29B','#3E8E7E'],
  ['#B08CD9','#7A5AA8'],['#EE8FA8','#C75B7A'],['#F2C14E','#DE8F3E'],
  ['#6FC3C7','#3A8891'],['#8FA4E0','#5B6BBF']
];
function _epTheme(id){let h=0;const s=String(id||'');for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return EP_THEMES[h%EP_THEMES.length];}
function _epEmoji(t){
  const x=String(t||'');
  const M=[['캠프','⛺'],['수련','⛺'],['피정','🕊️'],['성탄','🎄'],['대림','🕯️'],['부활','🐣'],['사순','✝️'],
    ['미사','⛪'],['봉사','🤝'],['소풍','🧺'],['여행','🚌'],['축제','🎊'],['대회','🏆'],['시험','📝'],
    ['모집','📣'],['신청','📝'],['모임','🙌'],['생일','🎂'],['졸업','🎓'],['입학','🌱'],['여름','☀️'],
    ['겨울','❄️'],['봄','🌸'],['가을','🍁'],['기도','🙏'],['성가','🎵'],['전례','🕯️'],['교리','📖'],['안내','📌']];
  for(const [k,v] of M){ if(x.indexOf(k)>=0) return v; }
  return '🎉';
}
function _epTitleSize(t){
  const n=String(t||'').replace(/\s/g,'').length;
  if(n<=6)return 34; if(n<=9)return 29; if(n<=13)return 25; if(n<=18)return 22; if(n<=26)return 18; return 16;
}
function buildEventPoster(e){
  const [c1,c2]=_epTheme(e.id);
  const sub=e.deadline?('~ '+String(e.deadline).replace(/-/g,'.').slice(5)+' 까지'):'하늘의문 중고등부';
  const fs=_epTitleSize(e.title);
  const CONF=['#FFE38A','#FFFFFF','#FFC7D9','#C7F0E0','#FFD9A8'];
  let h=0; const sd=String(e.id||''); for(let i=0;i<sd.length;i++)h=(h*33+sd.charCodeAt(i))>>>0;
  let conf='';
  for(let i=0;i<9;i++){
    h=(h*1103515245+12345)>>>0;
    const x=6+(h%88), y=5+((h>>7)%88), w=3+((h>>13)%4), rot=(h>>17)%360, col=CONF[(h>>5)%CONF.length];
    conf+=`<div class="ep-conf" style="left:${x}%;top:${y}%;width:${w}px;height:${w+3}px;background:${col};transform:rotate(${rot}deg)"></div>`;
  }
  return `<div class="event-poster" style="background:linear-gradient(140deg,${c1},${c2})">
    <div class="ep-blob" style="width:120px;height:120px;top:-42px;right:-34px"></div>
    <div class="ep-blob" style="width:70px;height:70px;bottom:-26px;left:-20px;background:rgba(255,255,255,.12)"></div>
    <div class="ep-ring" style="width:92px;height:92px;bottom:10px;right:-30px"></div>
    ${conf}
    <div class="ep-frame"></div>
    <div class="ep-notch" style="left:-8px"></div>
    <div class="ep-notch" style="right:-8px"></div>
    <div class="ep-tag">EVENT</div>
    <div class="ep-title" style="font-size:${fs}px">${e.title}</div>
    <div class="ep-rule"></div>
    <div class="ep-sub">${sub}</div>
  </div>`;
}
/* 끝난 이벤트를 배너에서 내리기 — 지우지 않고 보관함으로 */
function archiveEvent(id){
  var e=eventsData.find(function(x){return x.id===id;});if(!e)return;
  if(!confirm('"'+(e.title||'')+'"을(를) 내릴까요?\n\n삭제되지 않고 지난 이벤트에 보관돼요.'))return;
  e.archived=true;e.archivedAt=_minDateStr();
  try{if(typeof flushSync==='function')flushSync();}catch(e2){}
  try{closeModal('event-detail-modal');}catch(e2){}
  renderEventBanner();
  showToast('지난 이벤트로 내렸어요');
}
function unarchiveEvent(id){
  var e=eventsData.find(function(x){return x.id===id;});if(!e)return;
  delete e.archived;delete e.archivedAt;
  try{if(typeof flushSync==='function')flushSync();}catch(e2){}
  renderEventBanner();renderArchivedEvents();
  showToast('다시 올렸어요');
}
function openArchivedEvents(){renderArchivedEvents();openModal('event-archive-modal');}
function renderArchivedEvents(){
  var el=document.getElementById('event-archive-list');if(!el)return;
  var list=(eventsData||[]).filter(function(e){return e.archived;})
    .sort(function(a,b){return String(b.archivedAt||'').localeCompare(String(a.archivedAt||''));});
  var isT=G.role==='teacher';
  el.innerHTML=list.length?list.map(function(e){
    return '<div class="resource-card" style="align-items:center">'
      +'<div class="resource-info" style="cursor:pointer" onclick="closeModal(\'event-archive-modal\');openEventDetail(\''+e.id+'\')">'
      +'<div class="resource-title">'+_esc(e.title||'')+'</div>'
      +'<div class="resource-meta">'+(e.deadline?_esc(e.deadline)+' 마감':'')+(e.archivedAt?' · '+_esc(e.archivedAt)+' 내림':'')+'</div></div>'
      +(isT?'<button class="btn btn-sm btn-outline" style="width:auto;flex-shrink:0;padding:5px 10px;font-size:11px" onclick="unarchiveEvent(\''+e.id+'\')">다시 올리기</button>':'')
      +'</div>';
  }).join(''):'<div class="empty" style="padding:24px"><div class="empty-emoji" style="font-size:28px">📦</div><div class="empty-title" style="font-size:13px">보관된 이벤트가 없어요</div></div>';
}
function buildEventCardHtml(e){
  const dday=getDday(e.deadline);
  const _ec=eventCover(e);
  const ended=!!e.deadline&&dday==null;
  const badge=ended
    ? '<span class="event-dday" style="background:rgba(0,0,0,.55)">종료</span>'
    : (dday!=null?`<span class="event-dday">D-${dday}</span>`:'');
  const dim=ended?'filter:grayscale(.7);opacity:.75':'';
  const yid=e&&e.youtube?e.youtube:'';
  const clickAttr=yid?`onclick="openYoutubeVideo('${yid}')"`:`onclick="openEventDetail('${e.id}')"`;
  const play=yid?'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none"><div style="width:52px;height:52px;border-radius:50%;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center"><span style="color:#fff;font-size:22px;margin-left:3px">▶</span></div></div>':'';
  if(_ec){
    if(yid){
      const capBtn=(G&&G.role==='teacher')?`<span onclick="event.stopPropagation();archiveEvent('${e.id}')" style="margin-left:8px;font-size:11px;color:var(--coral);cursor:pointer;flex-shrink:0">📦 내리기</span>`:'';
      return `<div class="event-slide" ${clickAttr} style="${dim}"><div class="event-slide-img yt" style="position:relative"><img src="${_ec}">${play}${badge}</div><div class="event-yt-cap" style="display:flex;align-items:center"><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">▶ ${e.title}</span>${capBtn}</div></div>`;
    }
    return `<div class="event-slide" ${clickAttr} style="${dim}"><div class="event-slide-img" style="position:relative"><img src="${_ec}">${play}</div><div class="event-slide-info"><div class="event-slide-title">${e.title}</div>${badge}</div></div>`;
  }
  return `<div class="event-slide" ${clickAttr} style="${dim}">${buildEventPoster(e)}${badge?`<div class="event-slide-info" style="background:none;padding:10px">${badge}</div>`:''}</div>`;
}
function scrollToEventCard(wrap,domIdx,smooth){const cards=wrap.querySelectorAll('.event-slide');const c=cards[domIdx];if(!c)return;const left=c.offsetLeft-(wrap.clientWidth-c.clientWidth)/2;wrap.scrollTo({left,behavior:smooth?'smooth':'auto'});}
function getEventCenteredDomIdx(wrap){const cards=wrap.querySelectorAll('.event-slide');const center=wrap.scrollLeft+wrap.clientWidth/2;let closest=0,minDist=Infinity;cards.forEach((c,i)=>{const cCenter=c.offsetLeft+c.clientWidth/2;const dist=Math.abs(cCenter-center);if(dist<minDist){minDist=dist;closest=i;}});return closest;}
function onEventScrollSettled(wrap){const n=eventActiveList.length;if(n<2)return;const domIdx=getEventCenteredDomIdx(wrap);if(domIdx===0){scrollToEventCard(wrap,n,false);eventSlideIdx=n-1;}else if(domIdx===n+1){scrollToEventCard(wrap,1,false);eventSlideIdx=0;}else{eventSlideIdx=domIdx-1;}document.querySelectorAll('#event-dots .bday-dot').forEach((d,i)=>d.classList.toggle('active',i===eventSlideIdx));}
function advanceEventSlide(wrap){const domIdx=eventSlideIdx+2;scrollToEventCard(wrap,domIdx,true);}
function renderEventBanner(){
  try{
    var ab=document.getElementById('event-archive-btn');
    if(ab){var has=(eventsData||[]).some(function(e){return e.archived;});
      ab.style.display=(G.role==='teacher'&&has)?'block':'none';}
  }catch(e){}
  const wrap=document.getElementById('event-slides');const dotsEl=document.getElementById('event-dots');if(!wrap)return;clearEventSlide();const today=new Date();today.setHours(0,0,0,0);const D=86400000;
  const isLive=e=>!e.deadline||new Date(e.deadline)>=today;
  /* 진행 중인 것 먼저, 끝난 것은 30일까지 뒤에 (종료 표시) — 예전엔 마감되면 아예 안 보였음 */
  const live=eventsData.filter(e=>isLive(e)&&!e.archived);
  const ended=eventsData.filter(e=>!isLive(e)&&!e.archived&&(today-new Date(e.deadline))<=30*D);
  const active=live.concat(ended);
  eventActiveList=active;if(!active.length){wrap.innerHTML='<div style="color:var(--text-light);font-size:13px;padding:20px;text-align:center;width:100%">진행 중인 이벤트가 없어요</div>';if(dotsEl)dotsEl.innerHTML='';return;}eventSlideIdx=0;if(active.length===1){wrap.innerHTML=buildEventCardHtml(active[0]);if(dotsEl)dotsEl.innerHTML='';wrap.onscroll=null;return;}const renderList=[active[active.length-1],...active,active[0]];wrap.innerHTML=renderList.map(buildEventCardHtml).join('');if(dotsEl)dotsEl.innerHTML=active.map((_,i)=>`<div class="bday-dot${i===0?' active':''}"></div>`).join('');requestAnimationFrame(()=>scrollToEventCard(wrap,1,false));wrap.onscroll=()=>{clearTimeout(wrap._settleTimer);wrap._settleTimer=setTimeout(()=>onEventScrollSettled(wrap),120);};eventSlideTimer=setInterval(()=>advanceEventSlide(wrap),3000);}
function clearEventSlide(){if(eventSlideTimer){clearInterval(eventSlideTimer);eventSlideTimer=null;}}
function openEventDetail(id){const post=posts.find(p=>p.eventId===id);if(!post){showToast('이벤트 정보를 찾을 수 없어요');return;}const dday=getDday(post.deadline);document.getElementById('event-detail-img').innerHTML=post.image?`<img src="${post.image}" style="width:100%;height:auto;max-height:420px;object-fit:contain;border-radius:var(--radius-sm);background:var(--bg)">`:'';document.getElementById('event-detail-title').textContent=post.title;document.getElementById('event-detail-meta').textContent=post.authorName+' · '+post.date+(dday!=null?' · D-'+dday:'');document.getElementById('event-detail-content').textContent=post.content||'';
  try{
    var ev=eventsData.find(function(x){return x.id===id;});
    var box=document.getElementById('event-detail-actions');
    if(box){
      var isT=G.role==='teacher';
      var ended=!!(post.deadline&&dday==null);
      if(isT&&ev&&ev.archived){
        box.innerHTML='<button class="btn btn-sm btn-outline" style="width:100%" onclick="unarchiveEvent(\''+id+'\')">↑ 다시 올리기</button>';
      }else if(isT&&ev){
        box.innerHTML='<button class="btn btn-sm btn-outline" style="width:100%" onclick="archiveEvent(\''+id+'\')">📦 지난 이벤트로 내리기'+(ended?'':' <span style="font-weight:400;opacity:.7">(진행 중)</span>')+'</button>';
      }else box.innerHTML='';
    }
  }catch(e){}
  openModal('event-detail-modal');}
function pruneStoryPhotos(){/* 표시 제한은 renderStoryRow에서 처리. 실제 데이터는 삭제하지 않음 (저장공간 정리는 관리 > 앱 설정 > 저장공간에서) */}
function _canSeePhoto(ph){if(!ph)return false;if(G.role==='teacher')return true;var t=ph.target,g=ph.grade;if(t===undefined){var p=posts.find(function(x){return x.photoId===ph.id;});if(p){t=p.target;g=p.grade;}}var fake={cat:'gallery',target:t||'all',grade:g||'all'};return G.role==='parent'?_canParentSee(fake):_canStudentSee(fake,G.gradeKey);}
function renderStoryRow(){pruneStoryPhotos();const el=document.getElementById('story-row');if(!el)return;const visP=photosData.filter(_canSeePhoto);if(!visP.length){el.innerHTML='<div style="font-size:12px;color:var(--text-light);padding:10px 0">아직 사진이 없어요</div>';return;}const byDate=[...visP].sort((a,b)=>new Date(b.date)-new Date(a.date));let show=byDate;if(byDate.length>15){const excess=byDate.length-15;const drop=new Set();const seenOld=byDate.filter(p=>(p.readBy||[]).includes(G.id)).sort((a,b)=>new Date(a.date)-new Date(b.date));for(const p of seenOld){if(drop.size>=excess)break;drop.add(p.id);}if(drop.size<excess){const restOld=byDate.filter(p=>!drop.has(p.id)).sort((a,b)=>new Date(a.date)-new Date(b.date));for(const p of restOld){if(drop.size>=excess)break;drop.add(p.id);}}show=byDate.filter(p=>!drop.has(p.id));}el.innerHTML=show.map(p=>{const isRead=(p.readBy||[]).includes(G.id);const _cv=photoCover(p);const bg=_cv?`style="background-image:url('${_cv}');background-size:cover;background-position:center"`:'';return `<div class="story-item" onclick="openStory('${p.id}')"><div class="story-ring${isRead?' seen':''}"><div class="story-inner" ${bg}>${_cv?'':'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="opacity:.6"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'}</div></div><span style="font-size:10px;color:var(--text-sub);max-width:74px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.title}</span></div>`;}).join('');}
let storyPaused=false,currentStoryImgObj=null,currentStoryPost=null;
function openStory(id){storyList=[...photosData].sort((a,b)=>{const ar=(a.readBy||[]).includes(G.id),br=(b.readBy||[]).includes(G.id);if(ar!==br)return ar?1:-1;return new Date(b.date)-new Date(a.date);}).slice(0,10);storyIdx=storyList.findIndex(p=>p.id===id);if(storyIdx<0)storyIdx=0;storyImgIdx=0;openModal('story-viewer-modal');collapseStoryContent();showStorySlide();}
/* ══ 이미지 저장소: 사진 1장 = images 컬렉션 문서 1개. 앱 시작 시 받지 않고, 화면에 보일 때만 가져옴 ══ */
var IMGC={},IMGPEND={},_imgRT=null;
var FILEC={};
function saveDataUrl(dataUrl,name){
  try{
    const parts=String(dataUrl).split(',');
    const mime=(parts[0].match(/:(.*?);/)||[])[1]||'application/octet-stream';
    const bin=atob(parts[1]||'');
    const u8=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
    const blob=new Blob([u8],{type:mime});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=name||'file';a.rel='noopener';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},5000);
    showToast('\u2B07 '+(name||'파일')+' 저장했어요');
  }catch(e){console.warn('[FILE] download fail',e);try{window.open(dataUrl,'_blank');}catch(x){showToast('다운로드에 실패했어요');}}
}
function _dlDoc(d){_withDocData(d,function(data){saveDataUrl(data,d.name);});}
function _du2blob(durl){try{var a=durl.split(','),m=(a[0].match(/:(.*?);/)||[])[1]||'application/octet-stream',b=atob(a[1]),n=b.length,u=new Uint8Array(n);while(n--)u[n]=b.charCodeAt(n);return new Blob([u],{type:m});}catch(e){return null;}}
function _shareData(dataUrl,name){try{var blob=_du2blob(dataUrl);if(!blob){showToast('공유할 수 없어요');return;}var file=new File([blob],name||('file_'+Date.now()),{type:blob.type||'application/octet-stream'});if(navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file],title:name||'파일'}).catch(function(){});}else{saveDataUrl(dataUrl,name);showToast('공유를 지원하지 않는 기기예요 · 다운로드했어요');}}catch(e){try{saveDataUrl(dataUrl,name);}catch(x){showToast('공유에 실패했어요');}}}
function _shareDocData(d){if(!d)return;_withDocData(d,function(data){_shareData(data,d.name);});}
function sharePostDoc(pid,ix){var p=posts.find(function(x){return x.id===pid;});_shareDocData(p&&(p.docs||[])[ix]);}
function shareResDoc(rid,ix){var r=resources.find(function(x){return x.id===rid;});_shareDocData(r&&(r.docs||[])[ix]);}
function dlImg(src,name){if(!src)return;saveDataUrl(src,name||('image_'+Date.now()+'.jpg'));}
function shareImg(src,name){if(!src)return;_shareData(src,name||('image_'+Date.now()+'.jpg'));}
function _canShareFiles(){return !!(navigator.canShare&&navigator.share);}
function _svgEye(){return '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';}
function _svgDl(){return '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>';}
function _svgShare(){return '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 10.7l7.4-4.4M8.3 13.3l7.4 4.4"/></svg>';}
function _docBtns(kind,id,ix,d){var pv=_canPreview(d)?'<button class="ico-btn" title="미리보기" onclick="preview'+kind+'Doc(\''+id+'\','+ix+')">'+_svgEye()+'</button>':'';var dl='<button class="ico-btn" title="다운로드" onclick="download'+kind+'Doc(\''+id+'\','+ix+')">'+_svgDl()+'</button>';var sh=_canShareFiles()?'<button class="ico-btn" title="공유" onclick="share'+kind+'Doc(\''+id+'\','+ix+')">'+_svgShare()+'</button>':'';return '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">'+pv+dl+sh+'</div>';}
function _imgSrcRef(kind,id,ix){var arr;if(kind==='Post'){var p=posts.find(function(x){return x.id===id;});arr=p?(p.images&&p.images.length?p.images:(p.image?[{src:p.image}]:[])):[];}else{var r=resources.find(function(x){return x.id===id;});arr=r&&r.images||[];}var im=arr&&arr[ix];return im?_srcOf(im):'';}
function dlImgRef(kind,id,ix,name){var s=_imgSrcRef(kind,id,ix);if(!s){showToast('이미지를 찾을 수 없어요');return;}saveDataUrl(s,name||('image_'+Date.now()+'.jpg'));}
function shareImgRef(kind,id,ix,name){var s=_imgSrcRef(kind,id,ix);if(!s){showToast('이미지를 찾을 수 없어요');return;}_shareData(s,name||('image_'+Date.now()+'.jpg'));}
function _imgActions(kind,id,ix,name){var nm=(name||'image').replace(/'/g,"");var dl='<button class="ico-btn" title="다운로드" onclick="dlImgRef(\''+kind+'\',\''+id+'\','+ix+',\''+nm+'\')">'+_svgDl()+'</button>';var sh=_canShareFiles()?'<button class="ico-btn" title="공유" onclick="shareImgRef(\''+kind+'\',\''+id+'\','+ix+',\''+nm+'\')">'+_svgShare()+'</button>':'';return '<div style="display:flex;gap:8px;justify-content:flex-end;margin:4px 0 10px">'+dl+sh+'</div>';}
function downloadPostDoc(pid,ix){const p=posts.find(x=>x.id===pid);_dlDoc(p&&(p.docs||[])[ix]);}
function downloadResDoc(rid,ix){const r=resources.find(x=>x.id===rid);_dlDoc(r&&(r.docs||[])[ix]);}
function _docSizeLabel(d){const b=d&&d.size;if(!b)return '';return b>1048576?(b/1048576).toFixed(1)+'MB':Math.max(1,Math.round(b/1024))+'KB';}
function _docExt(n){const m=String(n||'').toLowerCase().match(/\.([a-z0-9]+)$/);return m?m[1]:'';}
function _canPreview(d){const e=_docExt(d&&d.name);return ['pdf','png','jpg','jpeg','gif','webp','txt'].indexOf(e)>=0;}
function _docIcon(d){const e=_docExt(d&&d.name);
  if(e==='pdf')return '📕';
  if(['png','jpg','jpeg','gif','webp'].indexOf(e)>=0)return '🖼️';
  if(['hwp','hwpx','doc','docx'].indexOf(e)>=0)return '📄';
  if(['xls','xlsx','csv'].indexOf(e)>=0)return '📊';
  if(['ppt','pptx'].indexOf(e)>=0)return '📈';
  if(['zip','7z','rar'].indexOf(e)>=0)return '🗜️';
  if(['mp3','m4a','wav'].indexOf(e)>=0)return '🎵';
  if(['mp4','mov','avi'].indexOf(e)>=0)return '🎬';
  return '📎';}
function _blobUrl(dataUrl){
  const parts=String(dataUrl).split(',');
  const mime=(parts[0].match(/:(.*?);/)||[])[1]||'application/octet-stream';
  const bin=atob(parts[1]||'');
  const u8=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([u8],{type:mime}));
}
const PDFJS_VER='3.11.174';
function loadPdfJs(){
  return new Promise(function(res,rej){
    if(window.pdfjsLib){res();return;}
    const sc=document.createElement('script');
    sc.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/'+PDFJS_VER+'/pdf.min.js';
    sc.onload=function(){
      try{window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/'+PDFJS_VER+'/pdf.worker.min.js';}catch(e){}
      res();
    };
    sc.onerror=function(){rej(new Error('pdfjs load fail'));};
    document.head.appendChild(sc);
  });
}
function _u8(dataUrl){
  const bin=atob(String(dataUrl).split(',')[1]||'');
  const u=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  return u;
}
async function _renderPdf(dataUrl,el){
  el.innerHTML='<div style="text-align:center;padding:40px 0;color:var(--text-light);font-size:13px">📕 문서를 여는 중…</div>';
  try{
    await loadPdfJs();
    const pdf=await window.pdfjsLib.getDocument({data:_u8(dataUrl)}).promise;
    el.innerHTML='';
    const info=document.createElement('div');
    info.style.cssText='font-size:11px;color:var(--text-light);text-align:center;margin-bottom:8px';
    info.textContent='총 '+pdf.numPages+'쪽';
    el.appendChild(info);
    const W=el.clientWidth||340;
    const DPR=Math.min(2,window.devicePixelRatio||1);
    for(let n=1;n<=pdf.numPages;n++){
      const page=await pdf.getPage(n);
      const v1=page.getViewport({scale:1});
      const vp=page.getViewport({scale:(W/v1.width)*DPR});
      const c=document.createElement('canvas');
      c.width=vp.width;c.height=vp.height;
      c.style.cssText='width:100%;display:block;margin-bottom:10px;border-radius:8px;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.08)';
      el.appendChild(c);
      await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
    }
  }catch(e){
    console.warn('[PDF]',e);
    el.innerHTML='<div style="text-align:center;padding:30px 12px;color:var(--text-light);font-size:13px">미리보기를 표시하지 못했어요.<br>아래 \'새 창에서 열기\' 또는 \'다운로드\'를 이용해주세요.</div>';
  }
}
function _showPreview(dataUrl,name){
  const el=document.getElementById('doc-preview-body');if(!el)return;
  const ext=_docExt(name);
  document.getElementById('doc-preview-title').textContent=name||'미리보기';
  let url='';
  try{url=_blobUrl(dataUrl);}catch(e){showToast('미리보기를 열 수 없어요');return;}
  const ob=document.getElementById('doc-preview-open');
  if(ob)ob.onclick=function(){window.open(url,'_blank');};
  const db=document.getElementById('doc-preview-dl');
  if(db)db.onclick=function(){saveDataUrl(dataUrl,name);};
  el.innerHTML='';
  openModal('doc-preview-modal');
  if(['png','jpg','jpeg','gif','webp'].indexOf(ext)>=0){
    el.innerHTML=`<img src="${url}" style="width:100%;border-radius:var(--radius-sm)">`;
  }else if(ext==='pdf'){
    setTimeout(function(){_renderPdf(dataUrl,el);},60);   /* 모달이 열려 폭이 잡힌 뒤 렌더 */
  }else if(ext==='txt'){
    let t='';try{t=new TextDecoder('utf-8').decode(_u8(dataUrl));}catch(e){t='';}
    el.innerHTML=`<pre style="white-space:pre-wrap;word-break:break-all;font-size:12px;line-height:1.7;background:var(--bg);padding:12px;border-radius:var(--radius-sm);max-height:65vh;overflow:auto"></pre>`;
    el.querySelector('pre').textContent=t;
  }else{
    el.innerHTML=`<div style="text-align:center;padding:30px 12px;color:var(--text-light);font-size:13px">이 형식은 미리보기를 지원하지 않아요.<br>다운로드해서 확인해주세요.</div>`;
  }
  setTimeout(function(){URL.revokeObjectURL(url);},180000);
}
function _withDocData(d,cb){
  if(!d){showToast('파일을 찾을 수 없어요');return;}
  if(d.data){cb(d.data);return;}
  if(!d.i){showToast('파일을 찾을 수 없어요');return;}
  if(FILEC[d.i]){cb(FILEC[d.i]);return;}
  if(!(window.FB&&FB.enabled()&&FB.get)){showToast('클라우드 연결이 필요해요');return;}
  showToast('📥 파일을 불러오는 중…');
  FB.get('files',d.i).then(function(f){
    if(!f){showToast('파일을 찾을 수 없어요');return;}
    if(f.d){FILEC[d.i]=f.d;cb(f.d);return;}
    const n=f.n||0;
    if(!n){showToast('파일을 찾을 수 없어요');return;}
    const ps=[];for(let k=0;k<n;k++)ps.push(FB.get('files',d.i+'_c'+k));
    Promise.all(ps).then(function(cs){
      const data=cs.map(function(c){return (c&&c.d)||'';}).join('');
      if(!data||cs.some(function(c){return !c;})){showToast('파일 일부를 불러오지 못했어요');return;}
      FILEC[d.i]=data;cb(data);
    }).catch(function(e){console.warn('[FILE]',e);showToast('파일을 불러오지 못했어요');});
  }).catch(function(e){console.warn('[FILE]',e);showToast('파일을 불러오지 못했어요');});
}
function previewPostDoc(pid,ix){const p=posts.find(x=>x.id===pid);const d=p&&(p.docs||[])[ix];_withDocData(d,function(data){_showPreview(data,d.name);});}
function previewResDoc(rid,ix){const r=resources.find(x=>x.id===rid);const d=r&&(r.docs||[])[ix];_withDocData(d,function(data){_showPreview(data,d.name);});}
var IMG_BLANK='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
function _imgRerenderSoon(){clearTimeout(_imgRT);_imgRT=setTimeout(function(){try{if(G&&G.id&&typeof rerenderAll==='function')rerenderAll();}catch(e){}},180);}
function imgGet(id){
  if(!id)return '';
  if(IMGC[id]!==undefined)return IMGC[id];
  if(!IMGPEND[id]){
    IMGPEND[id]=1;
    if(window.FB&&FB.enabled()&&FB.get){
      FB.get('images',id).then(function(d){IMGC[id]=(d&&d.d)||'';delete IMGPEND[id];_imgRerenderSoon();})
        .catch(function(e){console.warn('[IMG] load fail',id,e&&e.code);IMGC[id]='';delete IMGPEND[id];});
    } else { IMGC[id]=''; }
  }
  return IMG_BLANK;
}
/* src를 비열거(non-enumerable) getter로 정의 → JSON.stringify/Firestore 저장에서 자동 제외 */
function lazyImg(im){
  var o={i:im.i};
  if(im.comments)o.comments=im.comments;
  if(im.likes)o.likes=im.likes;
  Object.defineProperty(o,'src',{enumerable:false,configurable:true,get:function(){return imgGet(o.i);}});
  return o;
}
function encImg(arr,ix){
  var im=arr[ix];
  if(typeof im==='string')im={src:im};
  if(!im.i){
    var nid='img'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
    var data=im.src||'';
    im.i=nid;
    if(data){IMGC[nid]=data;try{FB.save('images',nid,{id:nid,d:data});}catch(e){}}
    arr[ix]=lazyImg(im);
  }
  var q={i:im.i};
  if(im.comments&&im.comments.length)q.comments=im.comments;
  if(im.likes&&im.likes.length)q.likes=im.likes;
  return q;
}
var FILE_CHUNK=700000;   /* Firestore 문서 1MB 한도 → 조각당 700KB */
function encDoc(arr,ix){
  var d=arr[ix];
  if(!d)return d;
  if(!d.i&&d.data){
    var fid='f'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
    var data=String(d.data);
    FILEC[fid]=data;
    var nm=d.name||'file', sz=d.size||0;
    var n=Math.max(1,Math.ceil(data.length/FILE_CHUNK));
    var _svFile=function(cid,obj){try{Promise.resolve(FB.save('files',cid,obj)).catch(function(e){console.warn('[FILE] save fail',cid,e&&e.code);if(e&&e.code==='permission-denied'){try{if(window._fbWarnDenied)window._fbWarnDenied('files');}catch(_){}}});}catch(e){console.warn('[FILE] save fail',e);}};
    try{
      if(n===1){
        _svFile(fid,{id:fid,name:nm,size:sz,n:1,d:data});
      }else{
        _svFile(fid,{id:fid,name:nm,size:sz,n:n});   /* 목록(매니페스트) */
        for(var k=0;k<n;k++){
          var cid=fid+'_c'+k;
          _svFile(cid,{id:cid,d:data.slice(k*FILE_CHUNK,(k+1)*FILE_CHUNK)});
        }
      }
    }catch(e){console.warn('[FILE] save fail',e);}
    arr[ix]={i:fid,name:nm,size:sz};
    d=arr[ix];
  }
  return {i:d.i,name:d.name||'file',size:d.size||0};
}
function _srcOf(im){return (im&&im.src)?im.src:(typeof im==='string'?im:'');}
/* 사진 댓글 수 — 새 저장소(imgComments) 우선, 옛 데이터(이미지 객체)도 지원 */
function photoCmtCount(p,idx){
  try{
    if(!p)return 0;
    var k=String(idx||0);
    if(p.imgComments&&p.imgComments[k])return p.imgComments[k].length;
    var im=(p.images||[])[idx||0];
    if(im&&typeof im==='object'&&im.comments)return im.comments.length;
    return 0;
  }catch(e){return 0;}
}
function photoPost(ph){try{return posts.find(function(x){return x.photoId===ph.id;});}catch(e){return null;}}
function photoImgs(ph){if(!ph)return [];var a=(ph.images&&ph.images.length)?ph.images.map(_srcOf):[];if(a.filter(Boolean).length)return a.filter(Boolean);var po=photoPost(ph);if(po&&po.images&&po.images.length)return po.images.map(_srcOf).filter(Boolean);if(ph.image)return [ph.image];if(po&&po.image)return [po.image];return [];}
function photoCover(ph){return photoImgs(ph)[0]||'';}
function eventCover(e){if(e&&e.image)return e.image;try{var po=posts.find(function(x){return x.eventId===e.id;});if(po){var pi=po.image||_srcOf((po.images||[])[0]);if(pi)return pi;}}catch(x){}var yid=(e&&e.youtube)||'';if(yid)return 'https://img.youtube.com/vi/'+yid+'/hqdefault.jpg';return '';}
function getStoryImgs(p){return photoImgs(p);}
function showStorySlide(){if(storyIdx<0||storyIdx>=storyList.length){closeStory();return;}const p=storyList[storyIdx];const imgs=getStoryImgs(p);if(storyImgIdx>=imgs.length){if(!p.readBy)p.readBy=[];if(!p.readBy.includes(G.id))p.readBy.push(G.id);renderStoryRow();storyIdx++;storyImgIdx=0;showStorySlide();return;}if(storyImgIdx<0){storyIdx--;if(storyIdx<0){closeStory();return;}storyImgIdx=getStoryImgs(storyList[storyIdx]).length-1;showStorySlide();return;}storyPaused=false;collapseStoryContent();closeStoryCommentSheet();currentStoryPost=p;const bar=document.getElementById('story-progress-bar');bar.innerHTML=imgs.map((_,i)=>`<div style="flex:1;height:2px;background:rgba(255,255,255,.35);border-radius:2px;overflow:hidden"><div class="story-prog-fill" style="height:100%;background:white;width:${i<storyImgIdx?'100%':'0%'}"></div></div>`).join('');const imgEl=document.getElementById('story-viewer-img-el');const fallback=document.getElementById('story-viewer-fallback');const cur=imgs[storyImgIdx];const curSrc=typeof cur==='object'?cur.src:cur;currentStoryImgObj=typeof cur==='object'?cur:null;try{refreshStoryLikeUI();renderStoryComments();refreshStoryOwnerBtns();}catch(e){}imgEl.style.opacity='0';setTimeout(()=>{if(curSrc){imgEl.src=curSrc;imgEl.style.display='';fallback.style.display='none';}else{imgEl.style.display='none';fallback.style.display='';}imgEl.style.opacity='1';},150);document.getElementById('story-viewer-title').textContent=p.title+(imgs.length>1?` (${storyImgIdx+1}/${imgs.length})`:'');document.getElementById('story-viewer-date').textContent=p.date;const arrow=document.getElementById('story-expand-arrow');if(arrow)arrow.style.display=p.content?'inline':'none';const likeBtn=document.getElementById('story-like-btn');if(likeBtn&&currentStoryImgObj){const liked=(currentStoryImgObj.likes||[]).includes(G.id);likeBtn.querySelector('.like-icon').innerHTML=_heartHTML(liked);likeBtn.querySelector('.like-count').textContent=(currentStoryImgObj.likes||[]).length;}renderStoryComments();document.getElementById('story-comment-input').value='';clearStoryTimer();const fills=bar.querySelectorAll('.story-prog-fill');if(fills[storyImgIdx]){requestAnimationFrame(()=>{fills[storyImgIdx].style.transition='width 3s linear';fills[storyImgIdx].style.width='100%';});}storyTimer=setTimeout(()=>storyTap(1),3000);}
function storyTap(dir){if(storyContentExpanded)return;storyImgIdx+=dir;showStorySlide();}
function clearStoryTimer(){if(storyTimer){clearTimeout(storyTimer);storyTimer=null;}}
function pauseStory(){storyPaused=true;clearStoryTimer();const bar=document.getElementById('story-progress-bar');const fills=bar.querySelectorAll('.story-prog-fill');if(fills[storyImgIdx]){const cs=getComputedStyle(fills[storyImgIdx]);fills[storyImgIdx].style.width=cs.width;fills[storyImgIdx].style.transition='none';}}
function resumeStory(){if(!storyPaused)return;storyPaused=false;clearStoryTimer();const bar=document.getElementById('story-progress-bar');const fills=bar.querySelectorAll('.story-prog-fill');const fill=fills[storyImgIdx];if(fill){requestAnimationFrame(()=>{fill.style.transition='width 3s linear';fill.style.width='100%';});}storyTimer=setTimeout(()=>storyTap(1),3000);}
let storyContentExpanded=false;
function toggleStoryContent(){if(storyContentExpanded)collapseStoryContent();else expandStoryContent();}
function expandStoryContent(){if(!currentStoryPost||!currentStoryPost.content)return;pauseStory();storyContentExpanded=true;document.getElementById('story-detail-content').textContent=currentStoryPost.content;const box=document.getElementById('story-content-expand');if(box)box.style.maxHeight='140px';const arrow=document.getElementById('story-expand-arrow');if(arrow)arrow.textContent='▼';const titleWrap=document.getElementById('story-title-wrap');if(titleWrap)titleWrap.style.transform='translateY(-2px)';}
function collapseStoryContent(){storyContentExpanded=false;const box=document.getElementById('story-content-expand');if(box)box.style.maxHeight='0';const arrow=document.getElementById('story-expand-arrow');if(arrow)arrow.textContent='▲';const titleWrap=document.getElementById('story-title-wrap');if(titleWrap)titleWrap.style.transform='translateY(0)';resumeStory();}
function renderStoryComments(){const el=document.getElementById('story-comment-list');if(!el)return;const comments=_storyCmtStore(false)||((currentStoryImgObj&&currentStoryImgObj.comments)||[]);const cnt=document.getElementById('story-comment-count');if(cnt)cnt.textContent=comments.length;if(!comments.length){el.innerHTML='<div style="text-align:center;padding:30px 0;color:rgba(255,255,255,.5);font-size:13px">아직 댓글이 없어요<br>첫 댓글을 남겨보세요 💬</div>';return;}el.innerHTML=comments.map((c,ix)=>{
    const mine=(c.authorId&&c.authorId===G.id)||(!c.authorId&&c.author===G.displayName);
    const canEdit=mine||G.role==='teacher';
    return `<div style="display:flex;gap:10px"><div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--lavender));display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:800;flex-shrink:0">${(c.author||'?').charAt(0)}</div><div style="flex:1;min-width:0"><div style="font-size:12px;color:white"><strong onclick="openProfileView('${c.authorId||''}')" style="cursor:pointer">${c.author}</strong> <span style="color:rgba(255,255,255,.8)">${c.text}</span></div><div style="display:flex;align-items:center;gap:8px;margin-top:2px"><span style="font-size:10px;color:rgba(255,255,255,.4)">${_timeAgo(c.ts,c.time)}${c.edited?' (수정됨)':''}</span>${canEdit?`<button onclick="editStoryComment(${ix})" style="background:none;border:none;color:rgba(255,255,255,.55);font-size:10px;cursor:pointer;padding:0;font-family:inherit">수정</button><button onclick="deleteStoryComment(${ix})" style="background:none;border:none;color:rgba(255,255,255,.55);font-size:10px;cursor:pointer;padding:0;font-family:inherit">삭제</button>`:''}</div></div></div>`;
  }).join('');el.scrollTop=el.scrollHeight;}
/* 갤러리 댓글 수정·삭제 — 작성자 본인 또는 교사 */
function _saveStoryPhoto(){
  const p=storyList&&storyList[storyIdx];
  if(!p)return;
  try{
    const orig=photosData.find(x=>x.id===p.id);
    if(orig&&orig!==p){ orig.imgComments=p.imgComments; orig.imgLikes=p.imgLikes; }
    if(window.FB&&FB.enabled()&&FB.save)FB.save('photos',p.id,(orig||p));
    if(window.flushSync)window.flushSync();
  }catch(e){console.warn('[STORY]',e);}
}
function _canEditCmt(c){
  if(!c)return false;
  if(G.role==='teacher')return true;
  return (c.authorId&&c.authorId===G.id)||(!c.authorId&&c.author===G.displayName);
}
function editStoryComment(ix){
  const list=_storyCmtStore(false); if(!list)return;
  const c=list[ix]; if(!c)return;
  if(!_canEditCmt(c)){showToast('수정 권한이 없어요');return;}
  const v=prompt('댓글 수정', c.text);
  if(v===null)return;
  const t=(v||'').trim();
  if(!t){showToast('내용을 입력해주세요');return;}
  c.text=t; c.edited=true;
  _saveStoryPhoto();
  renderStoryComments();
  showToast('댓글을 수정했어요');
}
function deleteStoryComment(ix){
  const list=_storyCmtStore(false); if(!list)return;
  const c=list[ix]; if(!c)return;
  if(!_canEditCmt(c)){showToast('삭제 권한이 없어요');return;}
  if(!confirm('이 댓글을 삭제할까요?'))return;
  list.splice(ix,1);
  _saveStoryPhoto();
  renderStoryComments();
  try{renderGalleryGrid&&renderGalleryGrid();}catch(e){}
  showToast('댓글을 삭제했어요');
}
function openStoryCommentSheet(){pauseStory();renderStoryComments();const sheet=document.getElementById('story-comment-sheet');if(sheet)sheet.style.transform='translateY(0)';}
function closeStoryCommentSheet(){const sheet=document.getElementById('story-comment-sheet');if(sheet)sheet.style.transform='translateY(100%)';const input=document.getElementById('story-comment-input');if(input)input.blur();resumeStory();}
/* 댓글은 사진 게시물(photosData) 안에 이미지 순번별로 저장한다.
   예전엔 이미지 객체에 붙였는데, 이미지가 문자열로 저장되면 댓글을 아예 못 달았다. */
function _storyCmtKey(){ return String(storyImgIdx||0); }
function _storyCmtStore(create){
  const p=storyList&&storyList[storyIdx];
  if(!p)return null;
  if(!p.imgComments){ if(!create)return null; p.imgComments={}; }
  const k=_storyCmtKey();
  if(!p.imgComments[k]){ if(!create)return null; p.imgComments[k]=[]; }
  return p.imgComments[k];
}
function submitStoryComment(){
  const input=document.getElementById('story-comment-input');
  const text=(input.value||'').trim();
  if(!text)return;
  const p=storyList&&storyList[storyIdx];
  if(!p){showToast('사진을 찾을 수 없어요');return;}
  const list=_storyCmtStore(true);
  if(!list){showToast('댓글을 저장할 수 없어요');return;}
  list.push({author:G.displayName,authorId:G.id,text:text,time:'방금',ts:Date.now()});
  input.value='';
  /* 원본 photosData 항목에도 반영 후 즉시 저장 */
  try{
    const orig=photosData.find(x=>x.id===p.id);
    if(orig&&orig!==p){ orig.imgComments=orig.imgComments||{}; orig.imgComments[_storyCmtKey()]=list; }
    if(window.FB&&FB.enabled()&&FB.save)FB.save('photos',p.id,(orig||p));
    if(window.flushSync)window.flushSync();
  }catch(e){console.warn('[STORY]',e);}
  renderStoryComments();
}
/* 갤러리 사진 수정·삭제 — 작성자 또는 교사만 */
function _curStoryPhoto(){ return (storyList&&storyList[storyIdx])||null; }
function canEditStory(){
  const ph=_curStoryPhoto(); if(!ph)return false;
  if(G.role==='teacher')return true;
  const po=photoPost(ph);
  const aid=(po&&po.authorId)||ph.authorId;
  return !!aid && aid===G.id;
}
function refreshStoryOwnerBtns(){
  const b=document.getElementById('story-more-btn');
  if(b)b.style.display=canEditStory()?'':'none';
}
/* 다른 게시물과 동일한 액션 시트 (수정하기 / 삭제하기 / 취소) */
function openStoryActions(){
  if(!canEditStory()){showToast('권한이 없어요');return;}
  pauseStory();
  openModal('story-action-modal');
}
function storyActionEdit(){ closeModal('story-action-modal'); editCurrentStory(); }
function storyActionDelete(){ closeModal('story-action-modal'); deleteCurrentStory(); }
function closeStoryActions(){ closeModal('story-action-modal'); try{resumeStory();}catch(e){} }
function editCurrentStory(){
  const ph=_curStoryPhoto(); if(!ph)return;
  if(!canEditStory()){showToast('수정 권한이 없어요');return;}
  const po=photoPost(ph);
  if(!po){showToast('원본 게시글을 찾을 수 없어요');return;}
  closeStory();
  setTimeout(function(){
    try{
      currentPostId=po.id;
      document.getElementById('gallery-title').value=po.title||'';
      document.getElementById('gallery-content').value=po.content||'';
      loadAttachBuf('gallery',po);
      document.getElementById('gallery-modal-title').textContent='🖼️ 갤러리 수정';
      document.getElementById('gallery-submit-btn').textContent='수정하기';
      document.getElementById('gallery-write-modal').dataset.editId=po.id;
      openModal('gallery-write-modal');
    }catch(e){console.warn('[STORY EDIT]',e);showToast('수정 화면을 열 수 없어요');}
  },250);
}
function deleteCurrentStory(){
  const ph=_curStoryPhoto(); if(!ph)return;
  if(!canEditStory()){showToast('삭제 권한이 없어요');return;}
  const id=ph.id;
  closeStory();
  setTimeout(function(){
    try{
      if(!confirm('"'+(ph.title||'제목 없음')+'" 사진을 삭제할까요?\n갤러리 게시글도 함께 삭제되며 되돌릴 수 없어요.'))return;
      const po=photoPost(ph);
      if(po&&po.images)po.images.forEach(im=>{if(im&&im.i){try{if(window.FB&&FB.enabled())FB.remove('images',im.i);}catch(e){}delete IMGC[im.i];}});
      if(po){ posts=posts.filter(p=>p.id!==po.id); try{if(window.FB&&FB.enabled())FB.remove('posts',po.id);}catch(e){} }
      photosData=photosData.filter(x=>x.id!==id);
      try{if(window.FB&&FB.enabled())FB.remove('photos',id);}catch(e){}
      try{if(window.flushSync)window.flushSync();}catch(e){}
      try{renderStoryRow();renderHomeNotices();renderGalleryGrid&&renderGalleryGrid();}catch(e){}
      showToast('🗑️ 삭제했어요');
    }catch(e){console.warn('[STORY DEL]',e);showToast('삭제 중 문제가 생겼어요');}
  },250);
}
function _storyLikeStore(create){
  const p=storyList&&storyList[storyIdx];
  if(!p)return null;
  if(!p.imgLikes){ if(!create)return null; p.imgLikes={}; }
  const k=_storyCmtKey();
  if(!p.imgLikes[k]){ if(!create)return null; p.imgLikes[k]=[]; }
  return p.imgLikes[k];
}
function toggleStoryLike(){
  const p=storyList&&storyList[storyIdx];
  if(!p){showToast('사진을 찾을 수 없어요');return;}
  const likes=_storyLikeStore(true);
  if(!likes)return;
  const i=likes.indexOf(G.id);
  if(i>=0)likes.splice(i,1); else likes.push(G.id);
  try{
    const orig=photosData.find(x=>x.id===p.id);
    if(orig&&orig!==p){ orig.imgLikes=orig.imgLikes||{}; orig.imgLikes[_storyCmtKey()]=likes; }
    if(window.FB&&FB.enabled()&&FB.save)FB.save('photos',p.id,(orig||p));
    if(window.flushSync)window.flushSync();
  }catch(e){console.warn('[STORY]',e);}
  refreshStoryLikeUI();
}
function _heartHTML(liked){return liked?'<svg viewBox="0 0 24 24" width="28" height="28" fill="#ed4956" style="display:block"><path d="M12 21.6C6.4 16 1 11.3 1 7.2 1 3.4 4.1 2 6.3 2c1.3 0 4.2.5 5.7 4.5C13.5 2.5 16.4 2 17.7 2c2.5 0 5.3 1.6 5.3 5.2 0 4.1-5.1 8.7-11 14.4z"/></svg>':'<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" style="display:block"><path d="M12 21.6C6.4 16 1 11.3 1 7.2 1 3.4 4.1 2 6.3 2c1.3 0 4.2.5 5.7 4.5C13.5 2.5 16.4 2 17.7 2c2.5 0 5.3 1.6 5.3 5.2 0 4.1-5.1 8.7-11 14.4z"/></svg>';}
function _cmtHTML(){return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l2-5.2a8.4 8.4 0 0 1-.9-3.8 8.4 8.4 0 0 1 8.4-8.4h.5a8.4 8.4 0 0 1 8 8z"/></svg>';}
function refreshStoryLikeUI(){
  const btn=document.getElementById('story-like-btn'); if(!btn)return;
  const likes=_storyLikeStore(false)||[];
  const liked=likes.indexOf(G.id)>=0;
  const ic=btn.querySelector('.like-icon'), ct=btn.querySelector('.like-count');
  if(ic)ic.innerHTML=_heartHTML(liked);
  if(ct)ct.textContent=likes.length;
}
function closeStory(){collapseStoryContent();closeStoryCommentSheet();clearStoryTimer();closeModal('story-viewer-modal');renderStoryRow();}
function renderPosts(arr){const el=document.getElementById('post-list');if(!arr||!arr.length){el.innerHTML='<div class="empty"><div class="empty-emoji">💬</div><div class="empty-title">게시물이 없어요</div></div>';return;}const canAdmin=G.role==='teacher'&&(G.type==='principal'||G.type==='admin'||G.isAdmin);el.innerHTML=arr.map(p=>{const isOwner=p.authorId===G.id;const moreBtn=(isOwner||canAdmin)?`<button class="post-more-btn" onclick="event.stopPropagation();openPostActions('${p.id}',${isOwner},${isOwner||canAdmin})">⋯</button>`:'';const catChip=p.cat?`<span class="chip chip-blue">${CAT_LABEL[p.cat]||p.cat}</span>`:'';const gradeChip=p.grade&&p.cat!=='jabumo'&&p.cat!=='event'&&G.role==='teacher'?`<span class="chip chip-mint">${GRADE_LABEL[p.grade]||p.grade}</span>`:'';const dday=p.deadline?getDday(p.deadline):null;let imgHtml='';if(p.images&&p.images.length>1){const pid='pg-'+p.id;imgHtml=`<div class="post-gallery-wrap" style="position:relative;margin:8px 0"><div class="post-gallery-scroll" id="${pid}" onscroll="onGalleryScroll('${p.id}')" style="display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:0;border-radius:var(--radius-sm)">${p.images.map(im=>`<img src="${typeof im==='object'?im.src:im}" style="flex:0 0 100%;width:100%;height:auto;max-height:420px;object-fit:contain;scroll-snap-align:start;background:var(--bg)">`).join('')}</div><div class="post-gallery-dots" id="${pid}-dots" style="display:flex;justify-content:center;gap:4px;margin-top:6px">${p.images.map((_,i)=>`<div class="bday-dot${i===0?' active':''}"></div>`).join('')}</div></div>`;}else if(p.image){imgHtml=`<img src="${p.image}" style="width:100%;height:auto;max-height:420px;object-fit:contain;border-radius:var(--radius-sm);margin:8px 0;background:var(--bg)">`;}if(p.cat==='gallery'){const img0=(p.images&&p.images[0])||null;const liked=!!(img0&&img0.likes&&img0.likes.includes(G.id));return `<div class="post-card" style="padding:0;overflow:hidden" data-cur-idx="0" id="pcard-${p.id}"><div style="display:flex;align-items:center;gap:8px;padding:12px 14px 6px"><div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--lavender));display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:800;flex-shrink:0">${(p.authorName||'?').charAt(0)}</div><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.authorName||'익명'}</div><div style="font-size:10px;color:var(--text-light)">${p.date}${p.edited?' · 수정됨':''}</div></div>${catChip}${gradeChip}${moreBtn}</div><div onclick="toggleGalleryContent('${p.id}')" style="padding:0 14px 6px;cursor:pointer"><div style="font-size:14px;font-weight:700">${p.title}</div>${p.content?`<div id="gc-${p.id}" style="display:none;font-size:12px;color:var(--text-sub);margin-top:6px;line-height:1.5;white-space:pre-wrap">${p.content}</div>`:''}</div><div style="position:relative">${imgHtml}<div style="position:absolute;right:8px;bottom:14px;display:flex;flex-direction:column;align-items:center;gap:16px;z-index:2"><button onclick="toggleImgLike('${p.id}')" class="story-like-btn" id="like-btn-${p.id}" style="background:none;border:none;cursor:pointer;color:white;display:flex;flex-direction:column;align-items:center;gap:2px;text-shadow:0 1px 4px rgba(0,0,0,.6)"><span class="like-icon">${_heartHTML(liked)}</span><span class="like-count" style="font-size:11px;font-weight:700">${(img0&&img0.likes?img0.likes.length:0)}</span></button><button onclick="openImgComments('${p.id}')" style="background:none;border:none;cursor:pointer;color:white;display:flex;flex-direction:column;align-items:center;gap:2px;text-shadow:0 1px 4px rgba(0,0,0,.6)"><span style="display:flex">${_cmtHTML()}</span><span class="comment-count" id="comment-count-${p.id}" style="font-size:11px;font-weight:700">${photoCmtCount(p,0)}</span></button></div></div></div>`;}return `<div class="post-card" data-pid="${p.id}" style="cursor:pointer"><div class="post-head"><div class="post-tags">${catChip}${gradeChip}${dday!=null?`<span class="chip chip-coral">D-${dday}</span>`:''}</div>${moreBtn}</div><div class="post-title">${p.title}</div><div class="post-meta"><span class="post-meta-chip">${p.authorName||'익명'}</span><span>${p.date}</span>${p.edited?'<span class="post-edited">(수정됨)</span>':''}</div>${imgHtml}${p.content?`<div class="post-preview">${p.content.slice(0,60)}${p.content.length>60?'...':''}</div>`:''}<div class="post-footer"><span class="post-stat">💬 ${(p.comments||[]).length}</span>${p.docs&&p.docs.length?`<span class="post-stat">📎 ${p.docs.length}</span>`:''}</div></div>`;}).join('');}
function toggleGalleryContent(id){const el=document.getElementById('gc-'+id);if(!el)return;el.style.display=(el.style.display==='none'||!el.style.display)?'block':'none';}
function getCurImg(pid){const p=posts.find(p=>p.id===pid);if(!p||!p.images||!p.images.length)return{p,img:null};const card=document.getElementById('pcard-'+pid);const idx=card?parseInt(card.dataset.curIdx||'0'):0;return{p,img:p.images[idx]||p.images[0]};}
function refreshImgButtons(pid){const{img}=getCurImg(pid);const likeBtn=document.getElementById('like-btn-'+pid);if(likeBtn&&img){const liked=(img.likes||[]).includes(G.id);likeBtn.querySelector('.like-icon').innerHTML=_heartHTML(liked);likeBtn.querySelector('.like-count').textContent=(img.likes||[]).length;}const cEl=document.getElementById('comment-count-'+pid);if(cEl){var _p=photosData.find(x=>x.id===pid);cEl.textContent=_p?photoCmtCount(_p,(window._curImgIdx&&window._curImgIdx[pid])||0):0;}}
function toggleImgLike(pid){const{img}=getCurImg(pid);if(!img)return;if(!img.likes)img.likes=[];const idx=img.likes.indexOf(G.id);if(idx>=0)img.likes.splice(idx,1);else img.likes.push(G.id);refreshImgButtons(pid);}
let currentCommentPostId=null;
function openImgComments(pid){currentCommentPostId=pid;renderPostComments();openModal('post-comment-modal');}
function renderPostComments(){const{img}=getCurImg(currentCommentPostId);const el=document.getElementById('post-comment-list');if(!el)return;const list=(img&&img.comments)||[];if(!list.length){el.innerHTML='<div class="empty" style="padding:24px"><div class="empty-emoji" style="font-size:28px">💬</div><div class="empty-title" style="font-size:13px">첫 댓글을 남겨보세요</div></div>';return;}el.innerHTML=list.map(c=>`<div style="display:flex;gap:10px"><div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--lavender));display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:800;flex-shrink:0">${(c.author||'?').charAt(0)}</div><div style="flex:1"><div style="font-size:12px"><strong onclick="openProfileView('${c.authorId||''}')" style="cursor:pointer">${c.author}</strong> <span style="color:var(--text-sub)">${c.text}</span></div><div style="font-size:10px;color:var(--text-light);margin-top:2px">${_timeAgo(c.ts,c.time)}</div></div></div>`).join('');}
function submitPostComment(){if(gradGuard())return;const input=document.getElementById('post-comment-input');const text=(input.value||'').trim();if(!text)return;const{img}=getCurImg(currentCommentPostId);if(!img){showToast('댓글을 남길 사진이 없어요');return;}if(!img.comments)img.comments=[];img.comments.push({author:G.displayName,authorId:G.id,text,time:'방금',ts:Date.now()});input.value='';renderPostComments();refreshImgButtons(currentCommentPostId);}
function onGalleryScroll(pid){const wrap=document.getElementById('pg-'+pid);const dots=document.getElementById('pg-'+pid+'-dots');const card=document.getElementById('pcard-'+pid);if(!wrap)return;const idx=Math.round(wrap.scrollLeft/wrap.clientWidth);if(dots)dots.querySelectorAll('.bday-dot').forEach((d,i)=>d.classList.toggle('active',i===idx));if(card)card.dataset.curIdx=idx;refreshImgButtons(pid);}

function openPostActions(id,canEdit,canDel){currentPostId=id;show('post-edit-btn',canEdit);openModal('post-action-modal');}
function editPost(){closeModal('post-action-modal');closeModal('post-detail-modal');const p=posts.find(p=>p.id===currentPostId);if(!p)return;if(p.cat==='gallery'){document.getElementById('gallery-title').value=p.title||'';document.getElementById('gallery-content').value=p.content||'';const gt=document.getElementById('gallery-top');if(gt)gt.value=p.target||'all';onGalleryTopChange();const gm=document.getElementById('gallery-mid');if(gm&&p.grade)gm.value=p.grade;loadAttachBuf('gallery',p);document.getElementById('gallery-modal-title').textContent='🖼️ 갤러리 수정';document.getElementById('gallery-submit-btn').textContent='수정하기';document.getElementById('gallery-write-modal').dataset.editId=currentPostId;openModal('gallery-write-modal');return;}if(p.cat==='event'){document.getElementById('event-title').value=p.title||'';document.getElementById('event-content').value=p.content||'';document.getElementById('event-deadline').value=p.deadline||'';var _ey=document.getElementById('event-youtube');if(_ey)_ey.value=p.youtube?('https://youtu.be/'+p.youtube):'';loadAttachBuf('event',p);document.getElementById('event-modal-title').textContent='🎉 이벤트 수정';document.getElementById('event-submit-btn').textContent='수정하기';document.getElementById('event-write-modal').dataset.editId=currentPostId;openModal('event-write-modal');return;}if(p.cat==='activity'){openActivityWrite();document.getElementById('aw-title').value=p.title||'';document.getElementById('aw-content').value=p.content||'';document.getElementById('aw-dept').value=p.dept||'choir';document.getElementById('aw-cat').value=p.subcat||'notice';loadAttachBuf('aw',p);document.getElementById('activity-write-modal').dataset.editId=currentPostId;return;}document.getElementById('write-title').value=p.title||'';document.getElementById('write-content').value=p.content||'';const lbl=document.getElementById('write-cat-label');if(lbl)lbl.textContent='카테고리: '+(CAT_LABEL[p.cat]||p.cat);const isT=G.role==='teacher';show('write-teacher-cats',isT);show('write-student-cat',G.role==='student');if(!isT){var _sco2=document.getElementById('write-student-scope');if(_sco2){var _gl2=GRADE_LABEL[G.gradeKey]||G.gradeLabel||'우리 학년';_sco2.options[1].text='우리 학년만 ('+_gl2+')';_sco2.value=(p.grade&&p.grade===G.gradeKey)?'mine':'all-s';}}if(isT){const isFull=G.type==='principal'||G.type==='admin'||G.isAdmin;show('write-push-wrap',G.role==='teacher'&&p.cat==='notice');var _pde=document.getElementById('write-popup-until');if(_pde)_pde.value=(p.popupUntil?_msToDateStr(p.popupUntil):(p.popupDays&&p.ts?_msToDateStr(p.ts+p.popupDays*86400000):_defaultPopupUntil()));show('write-top-wrap',p.cat!=='jabumo');const top=document.getElementById('write-top');if(top){top.value=p.target||'all';onWriteTopChange();}const mid=document.getElementById('write-mid');if(mid&&p.grade)mid.value=p.grade;}document.getElementById('write-modal').dataset.editId=currentPostId;loadAttachBuf('write',p);openModal('write-modal');}
function deletePost(){if(!currentPostId)return;if(!confirm('이 게시글을 삭제할까요?'))return;closeModal('post-action-modal');closeModal('post-detail-modal');const p=posts.find(x=>x.id===currentPostId);posts=posts.filter(x=>x.id!==currentPostId);if(p&&p.photoId&&typeof photosData!=='undefined'){photosData=photosData.filter(ph=>ph.id!==p.photoId);if(typeof renderStoryRow==='function')renderStoryRow();}
if(p&&p.eventId&&typeof eventsData!=='undefined'){eventsData=eventsData.filter(e=>e.id!==p.eventId);if(typeof renderEventBanner==='function')renderEventBanner();}
if(p&&p.cat==='activity'){renderDeptPosts('choir');renderDeptPosts('liturgy');}
else if(G.role==='teacher')applyTeacherFilter();
else if(G.role==='student')renderBoardList(currentBoardCat,posts.filter(x=>x.cat===currentBoardCat&&(x.target==='all'||(x.target==='student'&&(x.grade==='all-s'||x.grade===G.gradeKey)))));
else renderBoardList(currentBoardCat,posts.filter(x=>x.cat===currentBoardCat&&(currentBoardCat==='jabumo'||x.target==='all'||x.target==='parent')));
renderHomeNotices();showToast('게시글이 삭제되었습니다');}
function openPostActionsFromDetail(){const p=posts.find(x=>x.id===currentPostId);if(!p)return;const canAdmin=G.role==='teacher'&&(G.type==='principal'||G.type==='admin'||G.isAdmin);openPostActions(p.id,p.authorId===G.id,p.authorId===G.id||canAdmin);}
function postImgsHTML(p){const imgs=p.images?p.images.map(im=>typeof im==='object'?im.src:im):(p.image?[p.image]:[]);return imgs.length?`<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">${imgs.map((s,i)=>`<div><img src="${s}" onclick="openImgFull('${p.id}',${i})" style="width:100%;height:auto;max-height:420px;object-fit:contain;border-radius:var(--radius-sm);background:var(--bg);cursor:pointer">${_imgActions('Post',p.id,i,(p.title||'image'))}</div>`).join('')}</div>`:'';}
function postAttachHTML(p){let h='';const imgs=[];
if(imgs.length)h+=`<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">${imgs.map((s,i)=>`<img src="${s}" onclick="openImgFull('${p.id}',${i})" style="width:100%;height:auto;max-height:420px;object-fit:contain;border-radius:var(--radius-sm);background:var(--bg);cursor:pointer">`).join('')}</div>`;
if(p.docs&&p.docs.length)h+=`<div class="attach-label" style="margin-bottom:6px">📎 첨부파일 ${p.docs.length}개</div>`+p.docs.map((d,ix)=>`<div class="attach-file-item" style="flex-direction:column;align-items:stretch;gap:8px"><div style="display:flex;align-items:center;gap:6px"><span>${_docIcon(d)}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;color:var(--text)">${d.name}</span>${_docSizeLabel(d)?`<span style="color:var(--text-light);font-size:10px">${_docSizeLabel(d)}</span>`:''}</div>${_docBtns('Post',p.id,ix,d)}</div>`).join('');
return h;}
function renderPdComments(p){const cm=document.getElementById('pd-comments');if(!cm)return;const cs=p.comments||[];const canAdmin=G.role==='teacher'&&(G.type==='principal'||G.type==='admin'||G.isAdmin);const BT=(fn,ic)=>`<button onclick="${fn}" style="background:none;border:none;cursor:pointer;font-size:11px;padding:0 3px">${ic}</button>`;cm.innerHTML=`<div class="attach-label" style="border-top:1px solid var(--border-light);padding-top:12px;margin-bottom:8px">💬 댓글 ${cs.length}</div>`+cs.map((c,i)=>{const own=c.authorId===G.id;const btns=(own?BT(`editPostComment(${i})`,'✏️'):'')+((own||canAdmin)?BT(`deletePostComment(${i})`,'🗑️'):'');return `<div style="font-size:12px;margin-bottom:8px;display:flex;gap:8px"><div onclick="openProfileView('${c.authorId}')" style="cursor:pointer;flex-shrink:0">${_avatarById(c.authorId,c.author,30)}</div><div style="flex:1;min-width:0"><b onclick="openProfileView('${c.authorId}')" style="cursor:pointer;color:var(--primary-dark)">${c.author}</b> <span style="color:var(--text-light)">${_timeAgo(c.ts,c.time)}${c.edited?' (수정됨)':''}</span>${btns}<div style="margin-top:2px;color:var(--text-sub);white-space:pre-wrap">${c.text}</div></div></div>`;}).join('')+`<div style="display:flex;gap:6px;margin-top:8px"><input class="form-input" type="text" id="pd-comment-input" placeholder="댓글을 남겨보세요..." style="flex:1;padding:9px 10px;font-size:12px" onkeydown="if(event.key==='Enter')submitPostComment()"><button class="btn btn-sm" style="background:var(--primary);color:white;width:auto;flex-shrink:0" onclick="submitPostComment()">등록</button></div>`;}
function submitPostComment(){const p=posts.find(x=>x.id===currentPostId);if(!p)return;const inp=document.getElementById('pd-comment-input');const text=(inp.value||'').trim();if(!text)return;(p.comments=p.comments||[]).push({author:G.displayName,authorId:G.id,text,time:'방금',ts:Date.now()});renderPdComments(p);showToast('댓글을 남겼어요');}
function editPostComment(i){const p=posts.find(x=>x.id===currentPostId);if(!p||!p.comments||!p.comments[i])return;const t=prompt('댓글 수정',p.comments[i].text);if(t===null)return;const v=t.trim();if(!v)return;p.comments[i].text=v;p.comments[i].edited=true;renderPdComments(p);}
function deletePostComment(i){const p=posts.find(x=>x.id===currentPostId);if(!p||!p.comments)return;if(!confirm('이 댓글을 삭제할까요?'))return;p.comments.splice(i,1);renderPdComments(p);}
function openPostDetail(id){const p=posts.find(x=>x.id===id);if(!p)return;currentPostId=id;document.getElementById('pd-title').textContent=p.title;document.getElementById('pd-meta').innerHTML=(CAT_LABEL[p.cat]||p.cat)+' · <span onclick="openProfileView(\''+(p.authorId||'')+'\')" style="cursor:pointer;color:var(--primary-dark);font-weight:700">'+_esc(p.authorName||'익명')+'</span> · '+p.date+(p.edited?' (수정됨)':'');document.getElementById('pd-content').textContent=p.content||'';document.getElementById('pd-imgs').innerHTML=postImgsHTML(p);document.getElementById('pd-attach').innerHTML=postAttachHTML(p);
renderPdComments(p);
const canAdmin=G.role==='teacher'&&(G.type==='principal'||G.type==='admin'||G.isAdmin);show('pd-more',p.authorId===G.id||canAdmin);openModal('post-detail-modal');}
function openImgFull(pid,idx){const p=posts.find(x=>x.id===pid);if(!p)return;const imgs=p.images?p.images.map(im=>typeof im==='object'?im.src:im):(p.image?[p.image]:[]);if(!imgs[idx])return;document.getElementById('img-full-src').src=imgs[idx];openModal('img-full-modal');}

function onWriteTopChange(){const v=document.getElementById('write-top').value;show('write-mid-wrap',!!v&&v!=='all');const mid=document.getElementById('write-mid');if(v==='student')mid.innerHTML='<option value="">선택</option><option value="all-s">전체</option><option value="m1">중1</option><option value="m2">중2</option><option value="m3">중3</option><option value="h">고등</option>';else if(v==='parent')mid.innerHTML='<option value="">선택</option><option value="all-p">전체</option>';}
/* ── 공지 예약발송 (scheduledPosts 컬렉션 · Worker가 정시 발행) ── */
function _kstMs(date,time){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date);var t=/^(\d{1,2}):(\d{2})/.exec(time);if(!m||!t)return NaN;return Date.UTC(+m[1],+m[2]-1,+m[3],+t[1],+t[2])-9*3600*1000;}
function _endOfDayMs(dateStr){if(!dateStr)return 0;var t=new Date(dateStr+'T23:59:59');var ms=t.getTime();return isNaN(ms)?0:ms;}
function _msToDateStr(ms){if(!ms)return '';var d=new Date(ms);if(isNaN(d.getTime()))return '';var p=function(n){return (n<10?'0':'')+n;};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());}
function _defaultPopupUntil(){return _msToDateStr(Date.now()+7*86400000);}
function _schedDT(prefix){var on=document.getElementById(prefix+'-sched-on');if(!on||!on.checked)return null;var d=(document.getElementById(prefix+'-sched-date')||{}).value||'';var t=(document.getElementById(prefix+'-sched-time')||{}).value||'';if(!d||!t){showToast('예약 날짜와 시간을 입력해주세요');return false;}var ms=_kstMs(d,t);if(isNaN(ms)||ms<=Date.now()){showToast('예약 시간은 현재 이후로 설정해주세요');return false;}return {date:d,time:t,ms:ms};}
function _resetSchedUI(prefix){try{var on=document.getElementById(prefix+'-sched-on');if(on)on.checked=false;var f=document.getElementById(prefix+'-sched-fields');if(f)f.style.display='none';var d=document.getElementById(prefix+'-sched-date');if(d)d.value='';var t=document.getElementById(prefix+'-sched-time');if(t)t.value='';try{if(window.WHEELG&&WHEELG[prefix+'-sched-time']&&typeof _timeClear==='function')_timeClear(WHEELG[prefix+'-sched-time']);}catch(e){}}catch(e){}}
function _saveScheduledPost(kind,post,notif,dt){var id='sp'+Date.now()+Math.random().toString(36).slice(2,5);var doc={id:id,kind:kind,schedDate:dt.date,schedTime:dt.time,published:false,authorId:G.id,authorName:G.displayName,createdAt:Date.now(),post:post,notif:notif||null};try{if(window.FB&&FB.enabled()&&FB.save)FB.save('scheduledPosts',id,doc);}catch(e){}return id;}
function openSchedList(){var el=document.getElementById('sched-list-body');if(el)el.innerHTML='<div class="empty" style="padding:24px"><div class="empty-title" style="font-size:13px">불러오는 중…</div></div>';openModal('sched-list-modal');if(!(window.FB&&FB.enabled()&&FB.load)){if(el)el.innerHTML='<div class="empty" style="padding:24px"><div class="empty-title" style="font-size:13px">오프라인 상태예요</div></div>';return;}FB.load('scheduledPosts').then(function(arr){_renderSchedList(arr||[]);}).catch(function(){if(el)el.innerHTML='<div class="empty" style="padding:24px"><div class="empty-title" style="font-size:13px">불러오지 못했어요</div></div>';});}
function _renderSchedList(arr){var el=document.getElementById('sched-list-body');if(!el)return;var isFull=(G.type==='principal'||G.type==='admin'||G.isAdmin);var mine=arr.filter(function(s){return s&&!s.published&&(isFull||s.authorId===G.id);}).sort(function(a,b){return (_kstMs(a.schedDate,a.schedTime)||0)-(_kstMs(b.schedDate,b.schedTime)||0);});if(!mine.length){el.innerHTML='<div class="empty" style="padding:24px"><div class="empty-emoji" style="font-size:26px">📭</div><div class="empty-title" style="font-size:13px">예약된 공지가 없어요</div></div>';return;}el.innerHTML=mine.map(function(s){var due=_kstMs(s.schedDate,s.schedTime);var over=due&&due<=Date.now();var kindLbl=s.kind==='weekly'?'주간공지':'공지';var ttl=(s.post&&s.post.title)||'(제목 없음)';return '<div class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div style="min-width:0"><div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+_esc(ttl)+'</div><div style="font-size:11px;color:var(--text-light);margin-top:3px"><span class="chip chip-blue" style="font-size:9px">'+kindLbl+'</span> ⏰ '+s.schedDate+' '+s.schedTime+(over?' · <span style="color:var(--coral)">발송 대기중</span>':'')+'</div><div style="font-size:10px;color:var(--text-light);margin-top:2px">'+_esc(s.authorName||'')+'</div></div><button class="btn btn-sm" style="background:var(--coral-light);color:#D95F50;flex-shrink:0" onclick="cancelSchedPost(\''+s.id+'\')">취소</button></div></div>';}).join('');}
function cancelSchedPost(id){if(!confirm('이 예약을 취소할까요?'))return;try{if(window.FB&&FB.enabled()&&FB.remove)FB.remove('scheduledPosts',id);}catch(e){}showToast('예약을 취소했어요');setTimeout(openSchedList,300);}
function submitPost(){const modal=document.getElementById('write-modal');const editId=modal.dataset.editId;const title=(document.getElementById('write-title').value||'').trim();const content=(document.getElementById('write-content').value||'').trim();if(!title){showToast('제목을 입력해주세요');return;}let target='all',grade='all';if(currentBoardCat==='jabumo'){target='parent';}else if(G.role==='teacher'){target=document.getElementById('write-top')?.value||'';if(!target){showToast('중간 카테고리를 선택해주세요');return;}if(target==='student'||target==='parent'){grade=document.getElementById('write-mid')?.value||'';if(!grade){showToast('하위 카테고리를 선택해주세요');return;}}else{grade='all';}}else if(G.role==='student'){target='student';var _sc=document.getElementById('write-student-scope')?.value||'all-s';grade=(_sc==='mine')?(G.gradeKey||'all-s'):'all-s';}const _isNoticeCat=(editId?((posts.find(pp=>pp.id===editId)||{}).cat||currentBoardCat):currentBoardCat)==='notice';const _isNotice=_isNoticeCat&&G.role==='teacher';const _puEl=document.getElementById('write-popup-until');const _popupUntil=_puEl&&_puEl.value?_endOfDayMs(_puEl.value):0;const pushOn=_isNotice;const pushTarget=target;const isImportant=_isNotice;const _imgs=attachBuf.write.imgs.map(e=>bufSrc(e));const _docs=attachBuf.write.docs.slice();if(_imgs.length&&_imgsTooBig(_imgs.map(s=>({src:s}))))return;if(editId){const p=posts.find(p=>p.id===editId);if(p){p.title=title;p.content=content;p.edited=true;if(_imgs.length){p.images=_imgs.map(s=>({src:s}));p.image=_imgs[0];}else{delete p.images;p.image='';}if(_docs.length)p.docs=_docs;else delete p.docs;if(G.role==='teacher'){p.target=target;p.grade=grade;p.isImportant=isImportant;if(isImportant&&_popupUntil){p.popupUntil=_popupUntil;delete p.popupDays;}else{delete p.popupUntil;delete p.popupDays;}}}delete modal.dataset.editId;}else{const now=new Date();const date=now.getFullYear()+'.'+(now.getMonth()+1).toString().padStart(2,'0')+'.'+now.getDate().toString().padStart(2,'0');const newPost={id:'p'+Date.now(),title,content,cat:currentBoardCat,target,grade,date,authorId:G.id,authorName:G.displayName,comments:[],edited:false,isImportant};if(isImportant&&_popupUntil)newPost.popupUntil=_popupUntil;if(_imgs.length){newPost.images=_imgs.map(s=>({src:s}));newPost.image=_imgs[0];}if(_docs.length)newPost.docs=_docs;var _sdt=(G.role==='teacher')?_schedDT('write'):null;if(_sdt===false)return;if(_sdt){var _spt=pushOn?pushTarget:target;var _snf={id:'nt'+Date.now()+'sp',text:(isImportant?'🚨 [중요] ':'📢 ')+title,forTeacher:_spt==='all'||_spt==='teacher',forRole:_spt,tap:{type:'post',postId:newPost.id}};_saveScheduledPost('notice',newPost,_snf,_sdt);closeModal('write-modal');document.getElementById('write-title').value='';document.getElementById('write-content').value='';resetAttachBuf('write');try{_resetSchedUI('write');}catch(e){}if(document.getElementById('write-push'))document.getElementById('write-push').checked=false;if(document.getElementById('write-important'))document.getElementById('write-important').checked=false;show('write-push-target',false);showToast('⏰ '+_sdt.date+' '+_sdt.time+' 예약 발송으로 등록했어요');return;}posts.unshift(newPost);if(pushOn||isImportant){const pt=pushOn?pushTarget:target;notifications.unshift({pushed:false,id:'nt'+Date.now(),text:(isImportant?'🚨 [중요] ':'📢 ')+title,time:'방금',ts:Date.now(),readBy:[],forTeacher:pt==='all'||pt==='teacher',forRole:pt,tap:{type:'post',postId:newPost.id}});updateNotifDot();}}closeModal('write-modal');document.getElementById('write-title').value='';document.getElementById('write-content').value='';resetAttachBuf('write');if(document.getElementById('write-push'))document.getElementById('write-push').checked=false;if(document.getElementById('write-important'))document.getElementById('write-important').checked=false;show('write-push-target',false);if(G.role==='teacher')selTeacherCat(currentBoardCat,document.querySelector('#board-teacher-top .tab-btn.active')||document.querySelector('#board-teacher-top .tab-btn'));else if(G.role==='student')selStudentCat(currentBoardCat,document.querySelector('#board-student-cats .tab-btn.active')||document.querySelector('#board-student-cats .tab-btn'));else if(G.role==='parent')selParentCat(currentBoardCat,document.querySelector('#board-parent-cats .tab-btn.active')||document.querySelector('#board-parent-cats .tab-btn'));renderHomeNotices();checkImportantNotices();showToast('게시물이 등록되었습니다!'+(pushOn||isImportant?' 📢 알림 발송':''));}
let deptSubFilter={choir:'all',liturgy:'all'};
function openActivityWrite(){['aw-title','aw-content'].forEach(i=>document.getElementById(i).value='');document.getElementById('aw-img-input').value='';document.getElementById('aw-doc-input').value='';resetAttachBuf('aw');openModal('activity-write-modal');}
function renderDeptPosts(dept,sub){if(sub!==undefined)deptSubFilter[dept]=sub;const f=deptSubFilter[dept];const el=document.getElementById(dept+'-posts');if(!el)return;const arr=posts.filter(p=>p.cat==='activity'&&p.dept===dept&&(f==='all'||p.subcat===f));const emoji=dept==='choir'?'🎵':'✝️';if(!arr.length){el.innerHTML=`<div class="empty"><div class="empty-emoji">${emoji}</div><div class="empty-title">아직 게시물이 없어요</div></div>`;return;}const canAdmin=G.role==='teacher'&&(G.type==='principal'||G.type==='admin'||G.isAdmin);el.innerHTML=arr.map(p=>{const isOwner=p.authorId===G.id;const moreBtn=(isOwner||canAdmin)?`<button class="post-more-btn" onclick="event.stopPropagation();openPostActions('${p.id}',${isOwner},true)">⋯</button>`:'';const subChip=`<span class="chip chip-blue">${p.subcat==='notice'?'공지':dept==='choir'?'악보/자료':'전례자료'}</span>`;return `<div class="post-card" data-pid="${p.id}" style="cursor:pointer"><div class="post-head"><div class="post-tags">${subChip}</div>${moreBtn}</div><div class="post-title">${p.title}</div><div class="post-meta"><span class="post-meta-chip">${p.authorName||'익명'}</span><span>${p.date}</span>${p.edited?'<span class="post-edited">(수정됨)</span>':''}</div>${p.image?`<img src="${p.image}" style="width:100%;height:auto;max-height:420px;object-fit:contain;border-radius:var(--radius-sm);margin:8px 0;background:var(--bg)">`:''}${p.content?`<div class="post-preview">${p.content.slice(0,60)}${p.content.length>60?'...':''}</div>`:''}<div class="post-footer"><span class="post-stat">💬 ${(p.comments||[]).length}</span>${p.docs&&p.docs.length?`<span class="post-stat">📎 ${p.docs.length}</span>`:''}</div></div>`;}).join('');}
function submitActivityPost(){const title=(document.getElementById('aw-title').value||'').trim();if(!title){showToast('제목을 입력해주세요');return;}const dept=document.getElementById('aw-dept').value;const subcat=document.getElementById('aw-cat').value;const content=(document.getElementById('aw-content').value||'').trim();const imgs=attachBuf.aw.imgs.map(e=>bufSrc(e));const docs=attachBuf.aw.docs.slice();if(imgs.length&&_imgsTooBig(imgs.map(s=>({src:s}))))return;const modal=document.getElementById('activity-write-modal');const editId=modal.dataset.editId;if(editId){const p=posts.find(x=>x.id===editId);if(p){p.title=title;p.content=content;p.dept=dept;p.subcat=subcat;p.edited=true;if(imgs.length){p.images=imgs.map(s=>({src:s}));p.image=imgs[0];}else{delete p.images;p.image='';}if(docs.length)p.docs=docs;else delete p.docs;}delete modal.dataset.editId;}else{const now=new Date();const date=now.getFullYear()+'.'+(now.getMonth()+1).toString().padStart(2,'0')+'.'+now.getDate().toString().padStart(2,'0');const np={id:'p'+Date.now(),title,content,cat:'activity',isActivity:true,dept,subcat,target:'all',grade:'all',date,authorId:G.id,authorName:G.displayName,comments:[],edited:false};if(imgs.length){np.images=imgs.map(s=>({src:s}));np.image=imgs[0];}if(docs.length)np.docs=docs;posts.unshift(np);}closeModal('activity-write-modal');document.getElementById('aw-title').value='';document.getElementById('aw-content').value='';resetAttachBuf('aw');const btn=document.getElementById('dt-'+dept);if(btn)selDept(dept,btn);renderDeptPosts(dept);showToast(editId?'부서활동 게시물이 수정되었습니다':'부서활동 게시물이 등록되었습니다!');}
let resources=[],resourceCurCat='form',resourceCurYear=String(new Date().getFullYear()),currentMinutesId=null;
let currentResourceId=null;
function openResourceDetail(id){const r=resources.find(r=>r.id===id);if(!r)return;currentResourceId=id;const canEdit=r.authorId===G.id||G.type==='principal'||G.type==='admin'||G.isAdmin;show('rd-edit-btn',canEdit);show('rd-delete-btn',canEdit);document.getElementById('rd-title').textContent=r.title;document.getElementById('rd-meta').textContent=RESOURCE_CAT_LABEL[r.cat]+' · '+r.authorName+' · '+r.date;document.getElementById('rd-content').textContent=r.content||'';var _lk=document.getElementById('rd-link');if(_lk)_lk.innerHTML=r.link?('<a href="'+_esc(r.link)+'" class="btn btn-sm btn-primary" style="width:100%;text-decoration:none;display:flex;align-items:center;justify-content:center">'+_linkIcon(r.link)+' 문서 열기 ↗</a>'):'';document.getElementById('rd-images').innerHTML=(r.images||[]).map((im,ix)=>`<img src="${_srcOf(im)}" style="width:100%;border-radius:var(--radius-sm)">${_imgActions('Res',r.id,ix,(r.title||'image'))}`).join('');document.getElementById('rd-docs').innerHTML=(r.docs||[]).map((d,ix)=>`<div style="background:var(--bg);border-radius:var(--radius-sm);padding:12px 14px"><div style="display:flex;align-items:center;gap:8px;font-size:13px"><span>${_docIcon(d)}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600">${d.name}</span>${_docSizeLabel(d)?`<span style="color:var(--text-light);font-size:10px">${_docSizeLabel(d)}</span>`:''}</div>${_docBtns('Res',r.id,ix,d)}</div>`).join('');openModal('resource-detail-modal');}
function editResource(){const r=resources.find(r=>r.id===currentResourceId);if(!r)return;closeModal('resource-detail-modal');document.getElementById('rw-cat').value=r.cat;document.getElementById('rw-year').value=r.year;document.getElementById('rw-title').value=r.title;document.getElementById('rw-content').value=r.content||'';document.getElementById('rw-link').value=r.link||'';document.getElementById('rw-minutes-content').value='';loadAttachBuf('rw',r);onResourceCatChange();document.getElementById('rw-modal-title').textContent='📚 자료 수정';document.getElementById('resource-write-modal').dataset.editId=currentResourceId;openModal('resource-write-modal');}
function deleteResource(){if(!currentResourceId)return;resources=resources.filter(r=>r.id!==currentResourceId);closeModal('resource-detail-modal');renderResourceList();showToast('자료가 삭제되었습니다');}
const RESOURCE_CAT_LABEL={plan:'복음화계획서',form:'양식',doctrine:'교리',liturgy:'전례·성가',camp:'행사',minutes:'회의록',
  gospel:'복음교리',activity:'활동교리',choir:'성가',picnic:'봄소풍',retreat:'겨울피정',event:'행사',school:'주일학교',etc:'기타'}
/* 드라이브 폴더 = 자료의 본진. 한 탭에 폴더 여러 개를 묶을 수 있음 */
var DRIVE_DEFAULT={
  form:[
    {n:'각종 양식',      d:'회의록 양식 등', u:'https://drive.google.com/drive/folders/1W0korfdHiJy6HDfpCLnizH7ZyjfjtaTW'},
    {n:'주일학교 등록',  d:'등록 신청서 등', u:'https://drive.google.com/drive/folders/11j7kHxIgRGRw9azkuHNvucKNhvt6DMLo'}
  ],
  doctrine:[{n:'교리 관련 자료',d:'연도별 교안모음', u:'https://drive.google.com/drive/folders/168X9wdO1LtnSD9mFDr99dPjxV-MAPfWb'}],
  liturgy:[{n:'전례 관련 자료', d:'전례·성가 자료',  u:'https://drive.google.com/drive/folders/1NfzhlzHJs1bTiS04S9g0zDgHe0hwdci0'}],
  camp:[{n:'캠프·행사 자료',   d:'봄소풍·여름캠프·겨울피정·에파타', u:'https://drive.google.com/drive/folders/1t-XbmR44wwzLmffvoZtdmcM17F9O0jpt'}]
};
var RES_TABS=[{k:'form',l:'양식'},{k:'doctrine',l:'교리'},{k:'liturgy',l:'전례·성가'},{k:'camp',l:'행사'},{k:'plan',l:'복음화계획서'}];
/* 설정에서 관리 → appConfig에 저장. 없으면 기본값 사용 */
function driveFolders(cat){
  var cfg=(appConfig&&appConfig.driveFolders)||null;
  if(cfg&&cfg[cat])return cfg[cat];
  if(cfg)return [];
  return DRIVE_DEFAULT[cat]||[];
}
/* 모바일 경로 링크를 어디서나 열리는 표준 형식으로 정규화 */
/* ── 설정: 자료실 드라이브 폴더 추가/삭제 ── */
var _driveDraft=null;
function _driveDraftInit(){
  _driveDraft={};
  RES_TABS.forEach(function(t){
    _driveDraft[t.k]=driveFolders(t.k).map(function(f){return {n:f.n||'',d:f.d||'',u:f.u||''};});
  });
}
function renderDriveCfg(){
  var el=document.getElementById('cfg-drive-list');if(!el)return;
  if(!_driveDraft)_driveDraftInit();
  el.innerHTML=RES_TABS.map(function(t){
    var rows=(_driveDraft[t.k]||[]).map(function(f,i){
      return '<div style="background:var(--bg);border-radius:var(--radius-sm);padding:10px;margin-bottom:7px">'
        +'<div style="display:flex;gap:6px;margin-bottom:6px">'
          +'<input class="form-input" style="flex:1" placeholder="폴더 이름" value="'+_esc(f.n)+'" oninput="_dSet(\''+t.k+'\','+i+',\'n\',this.value)">'
          +'<button onclick="_dDel(\''+t.k+'\','+i+')" style="flex-shrink:0;width:34px;border:none;background:var(--coral-light);color:#D95F50;border-radius:9px;font-size:15px;cursor:pointer">×</button>'
        +'</div>'
        +'<input class="form-input" style="margin-bottom:6px" placeholder="설명 (예: 연도별 교안모음)" value="'+_esc(f.d)+'" oninput="_dSet(\''+t.k+'\','+i+',\'d\',this.value)">'
        +'<input class="form-input" placeholder="드라이브 폴더 링크" value="'+_esc(f.u)+'" oninput="_dSet(\''+t.k+'\','+i+',\'u\',this.value)">'
        +'</div>';
    }).join('');
    return '<div style="margin-bottom:14px">'
      +'<div style="font-size:12px;font-weight:800;color:var(--text-sub);margin-bottom:7px">'+t.l+' 탭</div>'
      +(rows||'<div style="font-size:11px;color:var(--text-light);padding:6px 0 8px">폴더가 없어요</div>')
      +'<button class="btn btn-sm btn-outline" style="width:100%" onclick="_dAdd(\''+t.k+'\')">＋ 폴더 추가</button>'
      +'</div>';
  }).join('');
}
function _dSet(k,i,f,v){if(!_driveDraft)return;if(_driveDraft[k]&&_driveDraft[k][i])_driveDraft[k][i][f]=v;}
function _dAdd(k){if(!_driveDraft)_driveDraftInit();(_driveDraft[k]=_driveDraft[k]||[]).push({n:'',d:'',u:''});renderDriveCfg();}
function _dDel(k,i){if(!_driveDraft||!_driveDraft[k])return;if(!confirm('이 폴더를 목록에서 뺄까요?'))return;_driveDraft[k].splice(i,1);renderDriveCfg();}
function collectDriveCfg(){
  if(!_driveDraft)return;
  var out={};
  RES_TABS.forEach(function(t){
    out[t.k]=(_driveDraft[t.k]||[]).filter(function(f){return (f.u||'').trim();})
      .map(function(f){return {n:(f.n||'').trim()||'폴더',d:(f.d||'').trim(),u:normDriveUrl(f.u)};});
  });
  appConfig.driveFolders=out;
  _driveDraft=null;
  try{renderResourceList();}catch(e){}
}
function normDriveUrl(u){
  u=String(u||'').trim();if(!u)return '';
  var m=u.split('?')[0].replace(/\/+$/,'').match(/folders\/([^/]+(?:\/[^/]+)*)$/);
  if(m){var parts=m[1].split('/');return 'https://drive.google.com/drive/folders/'+parts[parts.length-1];}
  return u;
}
/* 옛 분류를 새 4개로 접어줌 (기존 자료 그대로 살아있음) */
var CAT_MERGE={gospel:'doctrine',activity:'doctrine',choir:'liturgy',picnic:'camp',retreat:'camp',event:'camp',school:'form',etc:'form'};
function _catNorm(c){return CAT_MERGE[c]||c||'school';}
var OLD_CAT_NAME={choir:'성가',camp:'여름캠프',picnic:'봄소풍',retreat:'겨울피정'};
const RESOURCE_ICON={gospel:'📖',activity:'🎨',choir:'🎵',liturgy:'✝️',camp:'🏕️',picnic:'🌸',retreat:'🙏',minutes:'📝',etc:'📄'};
function onResourceCatChange(){const cat=document.getElementById('rw-cat').value;const isMinutes=false;show('rw-normal-fields',!isMinutes);show('rw-minutes-fields',isMinutes);document.getElementById('rw-modal-title').textContent=isMinutes?'📝 회의록 작성':'📚 자료 등록';}
function openResourceWriteModal(){var cat=resourceCurCat;if(cat==='minutes')cat='gospel';document.getElementById('rw-cat').value=cat;document.getElementById('rw-year').value=resourceCurYear;document.getElementById('rw-title').value='';document.getElementById('rw-content').value='';document.getElementById('rw-link').value='';document.getElementById('rw-minutes-content').value='';resetAttachBuf('rw');onResourceCatChange();openModal('resource-write-modal');}
/* 연도가 성격을 결정: 올해(LIVE_YEAR 이상)=독스로 살아있는 자료 / 지난해=파일 보관 */
var LIVE_YEAR=new Date().getFullYear();   /* 해가 바뀌면 자동으로 올라감 */
var RES_FIRST_YEAR=2023;
function _isLiveYear(y){return y!=='legacy'&&parseInt(y,10)>=LIVE_YEAR;}
function _isArchivedMinutes(r){return !!(r&&r.cat==='minutes'&&!r.deleted&&(r.archived||(r.year!=='legacy'&&parseInt(r.year,10)<LIVE_YEAR)));}
/* 연도 탭·연도 선택칸을 현재 연도에 맞춰 자동 생성 (27년이 되면 2027 탭이 저절로 생김) */
function renderYearTabs(){
  var years=[];for(var y=LIVE_YEAR;y>=RES_FIRST_YEAR;y--)years.push(String(y));
  var opts=years.map(function(y){return '<option value="'+y+'">'+(y==String(LIVE_YEAR)?'올해 ('+y+')':y+'년');}).join('')
    +'<option value="legacy">'+(RES_FIRST_YEAR-1)+'년 이전</option>';
  var sel=document.getElementById('res-year-sel');
  if(sel){sel.innerHTML=opts;sel.value=resourceCurYear;}
  var lb=document.getElementById('res-year-label');
  if(lb)lb.textContent=(resourceCurYear===String(LIVE_YEAR))?'올해 자료':(resourceCurYear==='legacy'?(RES_FIRST_YEAR-1)+'년 이전 보관':resourceCurYear+'년 보관');
  var sel=document.getElementById('rw-year');
  if(sel){var cur=sel.value;sel.innerHTML=years.map(function(y){return '<option value="'+y+'">'+y+'년</option>';}).join('')+'<option value="legacy">'+(RES_FIRST_YEAR-1)+'년 이전</option>';if(cur)sel.value=cur;}
}
/* 해가 바뀌면 지난해 회의록을 자동으로 보관(읽기 전용) 처리 */
function autoArchiveMinutes(){
  var ch=false;
  (resources||[]).forEach(function(r){
    if(!r||r.cat!=='minutes'||r.archived)return;
    var y=(r.year==='legacy')?0:parseInt(r.year,10);
    if(y&&y<LIVE_YEAR){r.archived=true;r.archivedAt=_minDateStr();ch=true;}
  });
  if(ch){try{if(typeof flushSync==='function')flushSync();}catch(e){}try{renderResourceList();}catch(e){}}
}
/* 지난 연도 회의록 전체를 인쇄/PDF로 내보내기 (백업·인계용) */
function exportMinutesYear(y){
  var year=y||(typeof minutesHubYear!=='undefined'?minutesHubYear:resourceCurYear);
  var list=(resources||[]).filter(function(r){return r.cat==='minutes'&&!r.deleted&&r.year===year;})
    .slice().sort(function(a,b){return String(a.date||'').localeCompare(String(b.date||''));});
  if(!list.length){showToast('내보낼 회의록이 없어요');return;}
  var body=list.map(function(r){
    var blocks=_minParse(r.content||''),n=0;
    var inner=blocks.map(function(b){
      if(b.t==='div')return '<hr>';
      var c=_mdInline(b.c);var im=(parseInt(b.ind,10)||0)*14;var sty=im?' style="margin-left:'+im+'px"':'';
      if(b.t==='h1')return '<h2>'+c+'</h2>';
      if(b.t==='h2')return '<h3>'+c+'</h3>';
      if(b.t==='h3')return '<h4>'+c+'</h4>';
      if(b.t==='ul')return '<div class="li"'+sty+'>• '+c+'</div>';
      if(b.t==='ol'){n++;return '<div class="li"'+sty+'>'+n+'. '+c+'</div>';}
      if(b.t==='todo')return '<div class="li"'+sty+'>'+(b.done?'\u2611':'\u2610')+' '+c+'</div>';
      if(b.t==='quote')return '<blockquote>'+c+'</blockquote>';
      if(b.t==='callout')return '<div class="callout">\uD83D\uDCA1 '+c+'</div>';
      return '<p>'+(c||'&nbsp;')+'</p>';
    }).join('');
    return '<section><h1>'+_esc(r.title)+'</h1><div class="meta">'+_esc(r.authorName||'')+' \u00B7 '+_esc(r.updatedAt||r.date||'')+'</div>'+inner+'</section>';
  }).join('');
  var html='<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>'+year+'년 회의록</title><style>'
    +'body{font-family:-apple-system,BlinkMacSystemFont,"Malgun Gothic","Apple SD Gothic Neo",sans-serif;color:#222;line-height:1.75;padding:28px;max-width:760px;margin:0 auto}'
    +'section{page-break-after:always;margin-bottom:34px}section:last-child{page-break-after:auto}'
    +'h1{font-size:20px;border-bottom:2px solid #333;padding-bottom:7px;margin-bottom:4px}'
    +'.meta{font-size:11px;color:#777;margin-bottom:14px}h2{font-size:17px}h3{font-size:15px}h4{font-size:13px}'
    +'.li{margin:3px 0 3px 8px;font-size:13px}p{font-size:13px;margin:6px 0}'
    +'.callout{background:#F3F0FF;border-radius:7px;padding:9px 11px;margin:7px 0;font-size:13px}code{background:#eee;border-radius:3px;padding:1px 4px}'
    +'blockquote{margin:8px 0;padding-left:11px;border-left:3px solid #ccc;color:#555;font-size:13px}'
    +'hr{border:none;border-top:1px solid #ddd;margin:12px 0}'
    +'.cover{font-size:12px;color:#666;margin-bottom:22px}'
    +'@media print{body{padding:0}}</style></head><body>'
    +'<div class="cover">\uD558\uB298\uC758\uBB38 \uC911\uACE0\uB4F1\uBD80 \u00B7 '+year+'\uB144 \uD68C\uC758\uB85D ('+list.length+'\uAC74)</div>'
    +body+'<script>window.onload=function(){setTimeout(function(){window.print();},350);}<\/script></body></html>';
  var w=window.open('','_blank');
  if(!w){showToast('팝업이 차단되었어요. 팝업 허용 후 다시 시도해주세요');return;}
  w.document.write(html);w.document.close();
}
function onAddResource(){ openResourceWriteModal(); }
/* ── 회의록 허브: 주제 분류 없이 연도별 목록만 ── */
var minutesHubYear=String(new Date().getFullYear());
var _mhTimer=null;
function closeMinutesHub(){clearInterval(_mhTimer);_mhTimer=null;closeModal('minutes-hub-modal');}
function openMinutesHub(){minutesHubYear=String(LIVE_YEAR);renderMinutesHub();clearInterval(_mhTimer);_mhTimer=setInterval(function(){try{if(document.getElementById('minutes-hub-modal').classList.contains('open'))renderMinutesHub();else{clearInterval(_mhTimer);_mhTimer=null;}}catch(e){}},3000);openModal('minutes-hub-modal');}
function selMinutesYear(y){minutesHubYear=y;renderMinutesHub();}
/* 회의 안건 → 항목 분리: 괄호 안 쉼표는 자르지 않음(예: "축하(생미사, 선물)"는 통째로 유지) */
function _agendaItems(agenda){var s=(agenda||'').replace(/\r/g,'');var out=[],buf='',depth=0;for(var i=0;i<s.length;i++){var c=s[i];if(c==='('||c==='（'||c==='['||c==='{')depth++;else if(c===')'||c==='）'||c===']'||c==='}')depth=Math.max(0,depth-1);if((c===','||c==='·'||c==='ㆍ'||c===';'||c==='\n')&&depth<=0){out.push(buf);buf='';continue;}buf+=c;}out.push(buf);return out.map(function(x){return x.trim();}).filter(Boolean);}
function _agendaBlocks(agenda){return _agendaItems(agenda).map(function(x){return '## '+x;}).join('\n');}
/* 안건을 회의록에 반영: 없으면 만들고, 손대지 않은 회의록이면 최신 안건으로 갱신(수동 수정본은 보존) */
function _syncAgendaToMinutes(ds){try{
  var r=litFor(ds);if(!r)return false;var ag=(r.agenda||'').trim();if(!ag)return false;
  var body=_agendaBlocks(ag);var d=ds.split('-');
  var mn=(resources||[]).find(function(x){return x&&x.cat==='minutes'&&!x.deleted&&x.mdate===ds;});
  if(!mn){resources.unshift({id:'rs'+Date.now()+Math.random().toString(36).slice(2,5),cat:'minutes',year:String(+d[0]),mdate:ds,title:(+d[1])+'월 '+(+d[2])+'일 회의록',content:body,agendaSync:ag,authorId:G.id,authorName:G.displayName,date:_minDateStr(),updatedAt:_minDateStr(),updatedBy:G.displayName});return true;}
  var cur=(mn.content||'').trim(),prev=_agendaBlocks(mn.agendaSync||'').trim();
  if((!cur||cur===prev)&&mn.content!==body){mn.content=body;mn.agendaSync=ag;return true;}
  return false;
}catch(e){return false;}}
function ensureWeeklyMinutes(){
  try{_hydrateYP();}catch(e){}
  try{
    if(G.role!=='teacher')return false;
    if(!_isLiveYear(minutesHubYear))return false;
    var yr=(typeof _curSchoolYr==='function')?_curSchoolYr():LIVE_YEAR;
    var st=(typeof _termStart==='function')?_termStart(yr):null;
    var en=(typeof _termEnd==='function')?_termEnd(yr):null;
    if(!st||!en)return false;
    var today=_today();
    var sats=(typeof _satsInRange==='function')?_satsInRange(st,en):[];
    var made=0;
    sats.forEach(function(ds){
      var ag=((litFor(ds)||{}).agenda||'').trim();
      if(isVacationDate(ds)&&!ag)return;        /* 방학 토요일 제외(단, 안건 있으면 회의록 생성) */
      var ex=(resources||[]).find(function(r){return r.cat==='minutes'&&!r.deleted&&r.mdate===ds;});
      var d=ds.split('-');
      var title=(+d[1])+'월 '+(+d[2])+'일 회의록';
      var body=ag?_agendaBlocks(ag):'';
      if(ex){
        if(ex.title!==title){ex.title=title;made++;}
        if(ag){var cur=(ex.content||'').trim(),prev=_agendaBlocks(ex.agendaSync||'').trim();if((!cur||cur===prev)&&ex.content!==body){ex.content=body;ex.agendaSync=ag;made++;}}
        return;
      }
      resources.unshift({id:'rs'+Date.now()+Math.random().toString(36).slice(2,5),cat:'minutes',year:String(+d[0]),mdate:ds,
        title:title,content:body,agendaSync:(ag||''),authorId:G.id,authorName:G.displayName,date:_minDateStr(),updatedAt:_minDateStr(),updatedBy:G.displayName});
      made++;
    });
    if(made){try{if(typeof flushSync==='function')flushSync();}catch(e){}}
    return made>0;
  }catch(e){return false;}
}
var _mLongT=null,_mLongFiredAt=0;
function _mLongStart(ev,id){_mLongEnd();_mLongT=setTimeout(function(){_mLongFiredAt=Date.now();try{if(navigator.vibrate)navigator.vibrate(28);}catch(e){}minSelStart(id);},500);}
function _mLongEnd(){try{clearTimeout(_mLongT);}catch(e){}_mLongT=null;}
function _mCardTap(id){if(Date.now()-_mLongFiredAt<700)return;if(_mSel)minSelToggle(id);else openMinutesViewer(id);}
var _mSel=null; /* 다중선택 모드 */
function minSelStart(id){
  if(!(G.role==='teacher'))return;
  if(!_mSel){_mSel={};try{history.pushState({mSel:1},'');window._mSelHist=true;}catch(e){}}
  if(id)_mSel[id]=1;
  renderMinutesHub();
}
function minSelToggle(id){
  if(!_mSel)return;
  if(_mSel[id])delete _mSel[id];else _mSel[id]=1;
  renderMinutesHub();
}
function minSelCancel(byPop){if(!_mSel)return;_mSel=null;renderMinutesHub();if(!byPop&&window._mSelHist){window._mSelHist=false;try{history.back();}catch(e){}}else{window._mSelHist=false;}}
window.addEventListener('popstate',function(){if(_mSel)minSelCancel(true);});
function minSelAll(){
  var list=(resources||[]).filter(function(r){return r.cat==='minutes'&&!r.deleted&&r.year===minutesHubYear;});
  _mSel={};list.forEach(function(r){_mSel[r.id]=1;});renderMinutesHub();
}
function minSelDelete(){
  var ids=Object.keys(_mSel||{});
  if(!ids.length){showToast('선택된 회의록이 없어요');return;}
  var mine=ids.filter(function(id){var r=(resources||[]).find(function(x){return x.id===id;});return r&&(_isFullAdmin()||r.authorId===G.id);});
  if(!mine.length){showToast('삭제 권한이 있는 회의록이 없어요');return;}
  appConfirm({icon:'trash',title:mine.length+'개를 휴지통으로 옮길까요?',desc:'휴지통에서 다시 복구할 수 있어요.'+(mine.length<ids.length?('\n권한이 없는 '+(ids.length-mine.length)+'개는 제외돼요.'):''),okText:'옮기기'}).then(function(ok){
    if(!ok)return;
    mine.forEach(function(id){var r=(resources||[]).find(function(x){return x.id===id;});if(r){r.deleted=true;r.deletedAt=Date.now();r.deletedBy=G.displayName;}});
    try{if(typeof flushSync==='function')flushSync();}catch(e){}
    _mSel=null;if(window._mSelHist){window._mSelHist=false;try{history.back();}catch(e){}}renderMinutesHub();renderResourceList();
    showToast(mine.length+'개를 휴지통으로 옮겼어요');
  });
}
function renderMinutesHub(){
  try{ensureWeeklyMinutes();}catch(e){}
  var years=[];for(var y=LIVE_YEAR;y>=RES_FIRST_YEAR;y--)years.push(String(y));
  var sel=document.getElementById('mh-year-sel');
  if(sel){sel.innerHTML=years.map(function(y){return '<option value="'+y+'">'+(y===String(LIVE_YEAR)?'올해 ('+y+')':y+'년');}).join('');sel.value=minutesHubYear;}
  var live=_isLiveYear(minutesHubYear);
  var list=(resources||[]).filter(function(r){return r.cat==='minutes'&&!r.deleted&&r.year===minutesHubYear;}).sort(function(a,b){return (a.mdate||a.date||'')<(b.mdate||b.date||'')?-1:1;});
  var el=document.getElementById('mh-list');if(!el)return;
  var html='';
  if(!live&&list.length)html+='<div style="background:var(--bg);border-radius:var(--radius-sm);padding:9px 11px;margin-bottom:9px;font-size:11px;color:var(--text-light)">🔒 '+minutesHubYear+'년 회의록은 보관되어 읽기 전용이에요.</div>';
  if(list.length)html+='<div style="display:flex;justify-content:flex-end;margin-bottom:8px"><button class="btn btn-sm btn-outline" style="width:auto" onclick="exportMinutesYear()">⬇ '+minutesHubYear+'년 전체 PDF</button></div>';
  var _n=_mSel?Object.keys(_mSel).length:0;
  html+=list.length?list.map(_resCard).join(''):_resEmpty('📝','회의록이 없어요',live?'＋ 새 회의록을 눌러 바로 시작해요':'이 해에는 작성된 회의록이 없어요');
  if(live&&appConfig.notionUrl){
    html+='<div style="margin-top:16px;padding-top:13px;border-top:1px dashed var(--border-light)"></div>'
      +_resSecLabel('📓 예전 노션 회의록 (열람용)')
      +embedCard('minutes','노션에서 보기',appConfig.notionUrl,400)
      +'<div style="font-size:10px;color:var(--text-light);text-align:center;margin-top:2px">이관이 끝나면 설정에서 노션 링크를 비워주세요.</div>';
  }
  if(_mSel)html+='<div style="height:66px"></div>';
  el.innerHTML=html;
  var sb=document.getElementById('mh-selbar');if(sb){sb.classList.toggle('show',!!_mSel);var cc=document.getElementById('mh-selcount');if(cc)cc.textContent=_n+'개 선택됨';}
  var nb=document.getElementById('mh-new-btn');if(nb)nb.style.display=_mSel?'none':(live?'block':'none');
}
/* ══ 회의록 발행 · 확인 ══ */
function _teacherRoster(){return (pendingList||[]).filter(function(t){return t.approved&&t.role==='teacher'&&!t.hidden;});}
function _isAcked(r,uid){return !!((r&&r.acks||[]).some(function(a){return a&&a.id===uid;}));}
function _unackedMinutes(){
  var yr=String(LIVE_YEAR);
  return (resources||[]).filter(function(r){return r.cat==='minutes'&&!r.deleted&&r.year===yr&&r.published&&!_isAcked(r,G.id);});
}
function publishMinutes(){
  var r=resources.find(function(x){return x.id===currentMinutesId;});if(!r)return;
  if(_minEditing){showToast('편집을 끝낸 뒤 발행해주세요');return;}
  if(!(r.content||'').trim()){showToast('내용이 비어 있어요');return;}
  var _n=_teacherRoster().length;if(!confirm('📣 푸시 알림을 보냅니다\n\n대상: 교사 전체 '+_n+'명\n내용: '+r.title+'\n\n발행할까요?'))return;
  r.published=true;r.publishedAt=_minDateStr();r.publishedBy=((G.name||'')+' '+(G.baptism||'')).trim();
  r.acks=r.acks||[];
  if(!_isAcked(r,G.id))r.acks.push({id:G.id,name:r.publishedBy,ts:Date.now()});  /* 작성자는 자동 확인 */
  try{
    notifications.unshift({id:'nt'+Date.now()+'mn',text:'📝 회의록이 올라왔어요: '+r.title+' — 확인해주세요',
      time:'방금',ts:Date.now(),pushed:false,readBy:[],forRole:'teacher',minutesId:r.id});
    updateNotifDot();
  }catch(e){}
  try{if(typeof flushSync==='function')flushSync();}catch(e){}
  _renderMinutesMeta(r);renderMinutesAck();_updateMinutesLockUI();
  try{renderMinutesHub();}catch(e){}try{renderHomeMinutes();}catch(e){}
  showToast('발행되었습니다 · 교사 전원에게 알림이 갔어요');
}
function ackMinutes(){
  var r=resources.find(function(x){return x.id===currentMinutesId;});if(!r)return;
  if(G.role!=='teacher'){showToast('교사만 확인할 수 있어요');return;}
  r.acks=r.acks||[];
  if(!_isAcked(r,G.id))r.acks.push({id:G.id,name:((G.name||'')+' '+(G.baptism||'')).trim(),ts:Date.now()});
  try{if(typeof flushSync==='function')flushSync();}catch(e){}
  renderMinutesAck();try{renderHomeMinutes();}catch(e){}try{renderMinutesHub();}catch(e){}
  showToast('확인했습니다 ✅');
}
function renderMinutesAck(){
  var el=document.getElementById('minutes-ack');if(!el)return;
  var r=resources.find(function(x){return x.id===currentMinutesId;});
  var pb=document.getElementById('minutes-publish-btn');
  if(!r){el.innerHTML='';if(pb)pb.style.display='none';return;}
  var canPub=!r.published&&!_isArchivedMinutes(r)&&G.role==='teacher';
  if(pb)pb.style.display=canPub?'':'none';
  if(!r.published){
    el.innerHTML=_isArchivedMinutes(r)?'':'<div style="font-size:11px;color:var(--text-light);text-align:center;padding:8px">아직 발행 전이에요 · 다 쓰신 뒤 📣 발행을 눌러주세요</div>';
    return;
  }
  var roster=_teacherRoster(), total=roster.length||0;
  var acks=r.acks||[], done=acks.length;
  var mine=_isAcked(r,G.id);
  var isOwner=(r.authorId===G.id)||G.type==='principal'||G.type==='admin'||G.isAdmin;
  var html='';
  if(!mine&&G.role==='teacher'){
    html+='<button class="btn btn-primary" style="width:100%" onclick="ackMinutes()">✅ 확인했습니다</button>';
  }else{
    html+='<div style="background:var(--mint-light);color:#2D9E8F;border-radius:var(--radius-sm);padding:9px;text-align:center;font-size:12px;font-weight:700">✅ 확인 완료</div>';
  }
  html+='<div style="font-size:11px;color:var(--text-sub);text-align:center;margin-top:8px">확인 '+done+' / '+total+'명</div>';
  if(isOwner&&total){
    var un=roster.filter(function(t){return !_isAcked(r,t.id);}).map(function(t){return t.name+' '+(t.baptism||'');});
    if(un.length)html+='<div style="font-size:11px;color:var(--coral);text-align:center;margin-top:4px">미확인: '+un.join(', ')+'</div>';
    else html+='<div style="font-size:11px;color:var(--text-light);text-align:center;margin-top:4px">모두 확인했어요 🎉</div>';
  }
  el.innerHTML=html;
}
/* 교사 홈: 최근 회의록 미리보기 (매주 쓰는 것이라 홈에 노출) */
function renderHomeMinutes(){
  var el=document.getElementById('home-minutes-list');if(!el)return;
  var al=document.getElementById('home-minutes-alert');
  if(G.role!=='teacher'){el.innerHTML='';if(al)al.innerHTML='';return;}
  if(al){
    var un=_unackedMinutes();
    al.innerHTML=un.length
      ? un.map(function(r){return '<div style="background:var(--coral);color:#fff;border-radius:var(--radius);padding:13px 15px;margin-bottom:9px;cursor:pointer" onclick="openMinutesViewer(\''+r.id+'\')">'
          +'<div style="font-size:13px;font-weight:800">📣 확인하지 않은 회의록이 있어요</div>'
          +'<div style="font-size:11px;opacity:.9;margin-top:3px">'+_esc(r.title)+' · 눌러서 확인하기 ›</div></div>';}).join('')
      : '';
  }
  var yr=String(LIVE_YEAR);
  /* 미확인은 위 배너에 이미 떠 있으니 목록에서는 빼고 2개만 */
  var _td=_today();
  var _base=(resources||[]).filter(function(r){
    return r.cat==='minutes'&&!r.deleted&&r.year===yr&&!(r.published&&!_isAcked(r,G.id));
  });
  var _up=_base.filter(function(r){return (r.mdate||'')>=_td;}).sort(function(a,b){return (a.mdate||'')<(b.mdate||'')?-1:1;});
  var _pastL=_base.filter(function(r){return (r.mdate||'')<_td;}).sort(function(a,b){return (a.mdate||'')>(b.mdate||'')?-1:1;});
  var list=_up.concat(_pastL).slice(0,2);
  var rows=list.map(function(r){
    var lk=(typeof _otherLock==='function')?_otherLock(r.id):null;
    var badge=lk?'<span style="color:var(--coral);font-weight:800">'+lk.name+' 작성 중</span> · ':'';
    var pv=_minPlainPreview(r.content||'');
    return '<div class="card" style="cursor:pointer;padding:12px 14px;margin-bottom:8px" onclick="openMinutesViewer(\''+r.id+'\')">'
      +'<div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:3px">'+_esc(r.title)+'</div>'
      +'<div style="font-size:11px;color:var(--text-light)">'+badge+_esc(r.updatedAt||r.date||'')+(pv?' · '+_esc(pv):'')+'</div></div>';
  }).join('');
  if(!list.length){
    rows=(al&&al.innerHTML)?'':'<div class="card" style="font-size:13px;color:var(--text-light);text-align:center;padding:18px">아직 올해 회의록이 없어요</div>';
  }
  el.innerHTML=rows;
}
/* 마크다운 기호를 뺀 순수 미리보기 */
function _minPlainPreview(t){
  var ln=String(t||'').split('\n').map(function(x){
    return x.replace(/^#{1,3}\s/,'').replace(/^[-*]\s\[[ xX]\]\s/,'').replace(/^[-*]\s/,'').replace(/^\d+\.\s/,'').replace(/^>\s?/,'').replace(/^---+$/,'');
  }).filter(function(x){return x.trim();});
  var j=ln.join(' ');return j.length>42?j.slice(0,42)+'...':j;
}
function newMinutesFromHub(){resourceCurYear=minutesHubYear;newMinutes();}
/* 노션처럼: 버튼 누르면 곧바로 새 회의록이 생기고 바로 편집 상태로 열림 (제출 모달 없음) */
function newMinutes(){
  if(!_isLiveYear(resourceCurYear)){showToast('새 회의록은 '+LIVE_YEAR+'년 탭에서 만들어주세요');return;}
  var n=new Date();
  var r={id:'rs'+Date.now(),cat:'minutes',year:resourceCurYear,title:(n.getMonth()+1)+'월 '+n.getDate()+'일 회의록',content:'',
         authorId:G.id,authorName:G.displayName,date:_minDateStr(),updatedAt:_minDateStr(),updatedBy:G.displayName};
  resources.unshift(r);
  try{if(typeof flushSync==='function')flushSync();}catch(e){}
  renderResourceList();try{renderMinutesHub();}catch(e){}try{renderHomeMinutes();}catch(e){}
  try{closeMinutesHub();}catch(e){}
  openMinutesViewer(r.id);
  startMinutesEdit();
}
function renameMinutes(){
  var r=resources.find(function(x){return x.id===currentMinutesId;});if(!r)return;
  var v=(document.getElementById('minutes-viewer-title').value||'').trim();
  if(!v){document.getElementById('minutes-viewer-title').value=r.title;return;}
  if(v===r.title)return;
  r.title=v;r.updatedAt=_minDateStr();r.updatedBy=G.displayName;
  try{if(typeof flushSync==='function')flushSync();}catch(e){}
  try{renderResourceList();}catch(e){}
}
function selResourceCat(cat,btn){_embedOpen={};selCatTab(btn);if(btn&&btn.scrollIntoView)btn.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});resourceCurCat=cat;renderResourceList();}
function selResourceYear(year,btn){if(btn)try{selYear(btn);}catch(e){}resourceCurYear=year;renderYearTabs();renderResourceList();}
/* ── 구글 독스 / 노션: 눌렀을 때만 로드 (자료실 진입 속도 개선) ── */
let _embedOpen={};                 /* {카테고리: true} — 펼친 상태 유지 */
function embedCard(key,label,url,h){
  const id='embed-'+key;
  if(_embedOpen[key]){
    return `<div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:12px;font-weight:700;color:var(--text-sub)">${label}</span>
        <span><a href="${url}" target="_blank" rel="noopener" style="font-size:11px;color:var(--primary);font-weight:700;text-decoration:none;margin-right:10px">새 창에서 열기 ↗</a><a href="javascript:void(0)" onclick="toggleEmbed('${key}')" style="font-size:11px;color:var(--text-light);font-weight:700;text-decoration:none">접기 ▴</a></span>
      </div>
      <div style="position:relative">
        <div id="${id}-load" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg);border-radius:var(--radius);font-size:12px;color:var(--text-light)">문서를 불러오는 중…</div>
        <iframe src="${url}" onload="const l=document.getElementById('${id}-load');if(l)l.style.display='none'" style="width:100%;height:${h}px;border:1px solid var(--border-light);border-radius:var(--radius);background:white"></iframe>
      </div>
    </div>`;
  }
  return `<div style="margin-bottom:14px;background:var(--bg);border:1px solid var(--border-light);border-radius:var(--radius);padding:14px">
    <div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:10px">${label}</div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-sm btn-primary" style="width:auto;flex:1" onclick="toggleEmbed('${key}')">📄 앱에서 열기</button>
      <a href="${url}" target="_blank" rel="noopener" class="btn btn-sm btn-outline" style="width:auto;flex:1;text-decoration:none;display:flex;align-items:center;justify-content:center">새 창에서 열기 ↗</a>
    </div>
    <div style="font-size:10px;color:var(--text-light);margin-top:8px;text-align:center">구글 문서는 불러오는 데 시간이 걸려요. 빠르게 보려면 '새 창에서 열기'를 눌러주세요.</div>
  </div>`;
}
function toggleEmbed(key){ _embedOpen[key]=!_embedOpen[key]; renderResourceList(); }

function _resCard(r){
  if(r.cat==='minutes'&&!r.deleted){
    const lk=(typeof _otherLock==='function')?_otherLock(r.id):null;
    var _dot='#C9CEd6', _tip='미발행';
    if(lk){_dot='#E5806B';_tip=lk.name+' 작성 중';}
    else if(r.published&&G.role==='teacher'&&!_isAcked(r,G.id)){_dot='#E5806B';_tip='미확인';}
    else if(r.published){_dot='#2D9E8F';_tip=(r.acks||[]).length+'명 확인';}
    else {_dot='#EBA23B';_tip='미발행';}
    var _past=!!(r.mdate&&r.mdate<_today());
    var _selMode=!!_mSel, _on=!!(_mSel&&_mSel[r.id]);
    var _click=`_mCardTap('${r.id}')`;
    var _mark=_selMode?`<span style="width:19px;height:19px;border-radius:50%;border:2px solid ${_on?'var(--primary)':'var(--border)'};background:${_on?'var(--primary)':'transparent'};color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${_on?'✓':''}</span>`:`<span title="${_tip}" style="width:7px;height:7px;border-radius:50%;background:${_dot};flex-shrink:0"></span>`;
    return `<div class="resource-card" style="${_past?'opacity:.6;':''}${_on?'background:var(--primary-light);':''}" onclick="${_click}" oncontextmenu="event.preventDefault();minSelStart('${r.id}');return false" ontouchstart="_mLongStart&&_mLongStart(event,'${r.id}')" ontouchend="_mLongEnd&&_mLongEnd()" ontouchmove="_mLongEnd&&_mLongEnd()"><div style="display:flex;align-items:center;gap:10px">${_mark}<div class="resource-info" style="min-width:0"><div class="resource-title">${r.title}</div><div class="resource-meta">${r.updatedAt||r.date}</div></div></div></div>`;
  }
  const oc=`<span class="post-meta-chip">${r.date||''}</span> `;
  return `<div class="resource-card" onclick="openResourceDetail('${r.id}')"><div class="resource-info"><div class="resource-title">${r.title}</div><div class="resource-meta">${oc}${r.authorName} · ${r.date}${(r.docs&&r.docs.length)?' · 📎 '+r.docs.length+'개':''}</div></div></div>`;
}

function _linkIcon(u){u=String(u||'');if(u.indexOf('/spreadsheets')>=0)return '📊';if(u.indexOf('/presentation')>=0)return '📽';if(u.indexOf('/forms')>=0)return '📋';if(u.indexOf('notion.')>=0)return '📓';return '📄';}
function _linkCard(r){
  var u=r.link||'';
  return '<div class="resource-card" style="align-items:center">'
    +'<a href="'+_esc(u)+'" style="flex:1;display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;min-width:0">'
    +'<span style="font-size:19px;flex-shrink:0">'+_linkIcon(u)+'</span>'
    +'<span style="min-width:0"><span class="resource-title" style="display:block">'+_esc(r.title)+'</span>'
    +'<span class="resource-meta" style="display:block">'+_esc(r.authorName||'')+' · '+_esc(r.date||'')+(r.content?' · '+_esc(r.content.slice(0,24)):'')+'</span></span></a>'
    +'<button class="btn btn-sm btn-outline" style="width:auto;flex-shrink:0;margin-left:8px;padding:5px 9px;font-size:11px" onclick="openResourceDetail(\''+r.id+'\')">⋯</button>'
    +'</div>';
}
function _resSecLabel(t){return '<div style="font-size:12px;font-weight:700;color:var(--text-sub);margin:4px 0 8px">'+t+'</div>';}
function _resEmpty(emoji,title,desc){return '<div class="empty"><div class="empty-emoji">'+emoji+'</div><div class="empty-title">'+title+'</div>'+(desc?'<div class="empty-desc">'+desc+'</div>':'')+'</div>';}
function _driveCard(f){
  /* 모든 카드 높이를 동일하게: 설명은 한 줄로 고정 */
  return '<a href="'+_esc(f.u)+'" class="drive-card">'
    +'<span class="dc-ico">📂</span>'
    +'<span class="dc-body">'
      +'<span class="dc-title">'+_esc(f.n)+'</span>'
      +'<span class="dc-desc">'+_esc(f.d||'')+'</span>'
      +'<span class="dc-foot">구글 드라이브에서 열기</span>'
    +'</span>'
    +'<span class="dc-arrow">›</span></a>';
}
function renderResourceList(){
  const el=document.getElementById('resource-list');if(!el)return;
  const cat=resourceCurCat;
  if(cat==='minutes'){ openMinutesHub(); resourceCurCat='form'; return; }

  const folders=driveFolders(cat);
  let html=folders.map(_driveCard).join('');

  /* 임시 공유 — 있을 때만 나타남 */
  const tmp=resources.filter(r=>_catNorm(r.cat)===cat&&r.cat!=='minutes')
    .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  if(tmp.length){
    html+='<div style="display:flex;align-items:baseline;gap:6px;margin:16px 0 8px">'
      +'<span style="font-size:12px;font-weight:800;color:var(--text-sub)">📎 임시 공유 · '+tmp.length+'개</span>'
      +'<span style="font-size:10px;color:var(--text-light)">오래된 건 드라이브로 옮겨주세요</span></div>'
      +tmp.map(r=>r.link?_linkCard(r):_resCard(r)).join('');
  }
  el.innerHTML=html;
}

function submitResource(){const modal=document.getElementById('resource-write-modal');const editId=modal.dataset.editId;const cat=document.getElementById('rw-cat').value;const year=document.getElementById('rw-year').value;const title=(document.getElementById('rw-title').value||'').trim();if(!title){showToast('제목을 입력해주세요');return;}const now=new Date();const date=now.getFullYear()+'.'+(now.getMonth()+1).toString().padStart(2,'0')+'.'+now.getDate().toString().padStart(2,'0');const finish=(images,docs)=>{if(cat==='minutes'){const content=(document.getElementById('rw-minutes-content').value||'').trim();if(editId){const r=resources.find(r=>r.id===editId);if(r){r.cat=cat;r.year=year;r.title=title;r.content=content;r.updatedAt=date;}}else{resources.unshift({id:'rs'+Date.now(),cat,year,title,content,authorId:G.id,authorName:G.displayName,date,updatedAt:date});}}else{const content=(document.getElementById('rw-content').value||'').trim();const link=(document.getElementById('rw-link').value||'').trim();if(editId){const r=resources.find(r=>r.id===editId);if(r){r.cat=cat;r.year=year;r.title=title;r.content=content;r.link=link;r.images=images;r.docs=docs;}}else{resources.unshift({id:'rs'+Date.now(),cat,year,title,content,link,images,docs,authorId:G.id,authorName:G.displayName,date});}}closeModal('resource-write-modal');delete modal.dataset.editId;document.getElementById('rw-title').value='';document.getElementById('rw-content').value='';document.getElementById('rw-link').value='';document.getElementById('rw-minutes-content').value='';resetAttachBuf('rw');document.getElementById('rw-img-input').value='';document.getElementById('rw-doc-input').value='';resourceCurCat=_catNorm(cat);resourceCurYear=year;document.querySelectorAll('#screen-teacher .tab-bar .tab-btn').forEach(b=>b.classList.toggle('active',b.textContent===RESOURCE_CAT_LABEL[resourceCurCat]));renderResourceList();document.getElementById('resource-list').scrollIntoView({behavior:'smooth',block:'start'});showToast(editId?'자료가 수정되었습니다':'자료가 등록되었습니다!');};if(cat==='minutes'){finish([],[]);return;}finish(attachBuf.rw.imgs.map(e=>bufSrc(e)),attachBuf.rw.docs.slice());}
/* ── 회의록: 자동저장 + 동시편집 소프트 락 + 라이브 반영 ── */
var _minutesLocks={};                 /* {minutesId:{id,uid,name,ts}} — minutesLocks 컬렉션 실시간 반영 */
var _minEditing=false;                /* 내가 지금 편집 중인지 */
var _minSaveTimer=null,_minHbTimer=null,_minLiveTimer=null,_minViewTimer=null;
var MIN_LOCK_TTL=25000;               /* 하트비트 25초 넘게 끊기면 락 만료로 간주 */
function _minFresh(l){return !!(l&&l.uid&&(Date.now()-(l.ts||0)<MIN_LOCK_TTL));}
function _otherLock(id){var l=_minutesLocks[id];return (_minFresh(l)&&l.uid!==G.id)?l:null;}
function _minDateStr(){var n=new Date();return n.getFullYear()+'.'+(n.getMonth()+1).toString().padStart(2,'0')+'.'+n.getDate().toString().padStart(2,'0');}
function _renderMinutesMeta(r){var by=r.updatedBy?(' · '+r.updatedBy):'';var pub=r.published?(' · 📣 '+(r.publishedAt||'')+' 발행'):'';document.getElementById('minutes-viewer-meta').textContent=r.authorName+' · 마지막 수정 '+(r.updatedAt||r.date)+by+pub;}
function _minModalOpen(){var m=document.getElementById('minutes-viewer-modal');return !!(m&&m.classList.contains('open'));}
/* ── 회의록 블록 에디터: 저장은 마크다운 텍스트(기존 회의록과 호환) ── */
var MIN_TYPES=[
  {t:'p',    ic:'¶',  nm:'텍스트',    ph:'입력하거나 / 를 눌러보세요'},
  {t:'h1',   ic:'H₁', nm:'제목 1',    ph:'제목 1'},
  {t:'h2',   ic:'H₂', nm:'제목 2',    ph:'제목 2'},
  {t:'h3',   ic:'H₃', nm:'제목 3',    ph:'제목 3'},
  {t:'ul',   ic:'•',  nm:'글머리 목록', ph:'목록'},
  {t:'ol',   ic:'1.', nm:'번호 목록',  ph:'목록'},
  {t:'todo', ic:'☑',  nm:'체크박스',   ph:'할 일'},
  {t:'quote',ic:'❝',  nm:'인용',      ph:'인용'},
  {t:'callout',ic:'💡',nm:'콜아웃',   ph:'강조할 내용'},
  {t:'div',  ic:'—',  nm:'구분선',    ph:''}
];
function _mt(t){for(var i=0;i<MIN_TYPES.length;i++)if(MIN_TYPES[i].t===t)return MIN_TYPES[i];return MIN_TYPES[0];}
function _minParse(text){
  var out=[],lines=String(text||'').split('\n');
  lines.forEach(function(raw){
    var ind=0,ln=raw;
    var lead=ln.match(/^( +)/);
    if(lead){ind=Math.min(4,Math.floor(lead[1].length/2));ln=ln.slice(lead[1].length);}
    var m;
    if(/^---+\s*$/.test(ln)){out.push({t:'div',c:'',ind:ind});return;}
    if((m=ln.match(/^!>\s?(.*)$/))){out.push({t:'callout',c:m[1],ind:ind});return;}
    if((m=ln.match(/^###\s(.*)$/))){out.push({t:'h3',c:m[1],ind:ind});return;}
    if((m=ln.match(/^##\s(.*)$/))){out.push({t:'h2',c:m[1],ind:ind});return;}
    if((m=ln.match(/^#\s(.*)$/))){out.push({t:'h1',c:m[1],ind:ind});return;}
    if((m=ln.match(/^[-*]\s\[([ xX])\]\s(.*)$/))){out.push({t:'todo',c:m[2],done:m[1].toLowerCase()==='x',ind:ind});return;}
    if((m=ln.match(/^\[([ xX])\]\s(.*)$/))){out.push({t:'todo',c:m[2],done:m[1].toLowerCase()==='x',ind:ind});return;}
    if((m=ln.match(/^[-*]\s(.*)$/))){out.push({t:'ul',c:m[1],ind:ind});return;}
    if((m=ln.match(/^\d+\.\s(.*)$/))){out.push({t:'ol',c:m[1],ind:ind});return;}
    if((m=ln.match(/^>\s?(.*)$/))){out.push({t:'quote',c:m[1],ind:ind});return;}
    out.push({t:'p',c:ln,ind:ind});
  });
  if(!out.length)out.push({t:'p',c:'',ind:0});
  return out;
}
function _inlineMd(n){
  if(n.nodeType===3)return n.nodeValue||'';
  var tag=(n.tagName||'').toLowerCase();
  if(tag==='br')return '';
  var inner=Array.prototype.map.call(n.childNodes,_inlineMd).join('');
  if(tag==='b'||tag==='strong')return inner?'**'+inner+'**':'';
  if(tag==='i'||tag==='em')return inner?'*'+inner+'*':'';
  if(tag==='s'||tag==='strike'||tag==='del')return inner?'~~'+inner+'~~':'';
  if(tag==='code')return inner?'`'+inner+'`':'';
  return inner;
}
function _blkMd(el){ return el?Array.prototype.map.call(el.childNodes,_inlineMd).join('').replace(/\n/g,' '):''; }
function _minSerialize(){
  var ed=document.getElementById('minutes-viewer-content');if(!ed)return '';
  var n=0;
  return Array.prototype.map.call(ed.querySelectorAll('.mb'),function(b){
    var t=b.dataset.t, c=_blkMd(b.querySelector('.mb-txt'));
    var pad=new Array((parseInt(b.dataset.ind,10)||0)+1).join('  ');
    if(t!=='ol')n=0;
    if(t==='h1')return pad+'# '+c;
    if(t==='h2')return pad+'## '+c;
    if(t==='h3')return pad+'### '+c;
    if(t==='ul')return pad+'- '+c;
    if(t==='ol'){n++;return pad+n+'. '+c;}
    if(t==='todo')return pad+'- ['+(b.classList.contains('done')?'x':' ')+'] '+c;
    if(t==='quote')return pad+'> '+c;
    if(t==='callout')return pad+'!> '+c;
    if(t==='div')return pad+'---';
    return pad+c;
  }).join('\n');
}
function _esc(x){return String(x||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function _mdInline(x){
  var v=_esc(x||'');
  v=v.replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>');
  v=v.replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<i>$2</i>');
  v=v.replace(/~~([^~]+)~~/g,'<s>$1</s>');
  v=v.replace(/`([^`]+)`/g,'<code>$1</code>');
  return v;
}
function _minBlockHtml(b,editable,idx){
  var d=_mt(b.t),mk='',ind=parseInt(b.ind,10)||0;
  var hd=editable?'<button class="mb-h" contenteditable="false" onclick="openBlockMenu(this)" tabindex="-1">⋮⋮</button>':'';
  var st=' style="margin-left:'+(ind*18)+'px"';
  if(b.t==='ul')mk='<span class="mb-mk">•</span>';
  else if(b.t==='ol')mk='<span class="mb-mk">'+(idx||1)+'.</span>';
  else if(b.t==='todo')mk='<input type="checkbox" class="mb-ck"'+(b.done?' checked':'')+(editable?'':' disabled')+' onclick="onMinToggle(this)">';
  else if(b.t==='callout')mk='<span class="mb-mk">💡</span>';
  if(b.t==='div')return '<div class="mb" data-t="div" data-ind="'+ind+'"'+st+'>'+hd+'<hr><span class="mb-txt" style="display:none"></span></div>';
  return '<div class="mb'+(b.t==='todo'&&b.done?' done':'')+'" data-t="'+b.t+'" data-ind="'+ind+'"'+st+'>'+hd+mk
    +'<div class="mb-txt" data-ph="'+_esc(d.ph)+'"'+(editable?' contenteditable="true"':'')+'>'+_mdInline(b.c)+'</div></div>';
}
function _minRender(blocks,editable){
  var ed=document.getElementById('minutes-viewer-content');if(!ed)return;
  var n=0;
  ed.innerHTML=blocks.map(function(b){ if(b.t==='ol')n++;else n=0; return _minBlockHtml(b,editable,n); }).join('');
  ed.oncopy=onMinutesCopy;
}
function _minRenumber(){
  var ed=document.getElementById('minutes-viewer-content');if(!ed)return;var n=0;
  Array.prototype.forEach.call(ed.querySelectorAll('.mb'),function(b){
    if(b.dataset.t==='ol'){n++;var m=b.querySelector('.mb-mk');if(m)m.textContent=n+'.';}else n=0;
  });
}
function _minCaretEnd(el){ if(!el)return; el.focus(); try{var r=document.createRange();r.selectNodeContents(el);r.collapse(false);var sel=getSelection();sel.removeAllRanges();sel.addRange(r);}catch(e){} }
function _minCurBlock(){ var sel=getSelection();if(!sel||!sel.anchorNode)return null;var n=sel.anchorNode;if(n.nodeType===3)n=n.parentNode;return n.closest?n.closest('.mb'):null; }
function _minAtStart(){ var sel=getSelection();return !!(sel&&sel.isCollapsed&&sel.anchorOffset===0); }
function _minSetType(blk,t){
  if(!blk)return;
  var txt=blk.querySelector('.mb-txt'), c=txt?txt.innerText:'';
  var tmp=document.createElement('div');
  tmp.innerHTML=_minBlockHtml({t:t,c:(t==='div'?'':c),done:false},true,1);
  var nb=tmp.firstChild;
  blk.parentNode.replaceChild(nb,blk);
  _minRenumber();
  if(t==='div'){ _minNewBlock(nb,'p'); } else { _minCaretEnd(nb.querySelector('.mb-txt')); }
  onMinutesInput();
}
function _minNewBlock(afterBlk,t){
  var tmp=document.createElement('div');
  tmp.innerHTML=_minBlockHtml({t:t||'p',c:'',done:false},true,1);
  var nb=tmp.firstChild;
  afterBlk.parentNode.insertBefore(nb,afterBlk.nextSibling);
  _minRenumber();_minCaretEnd(nb.querySelector('.mb-txt'));
  return nb;
}
function onMinToggle(cb){
  var blk=cb.closest('.mb');if(!blk)return;
  blk.classList.toggle('done',cb.checked);
  if(!_minEditing){ /* 보기 상태에서도 체크는 허용하되 락 확인 */ if(_otherLock(currentMinutesId)){cb.checked=!cb.checked;blk.classList.toggle('done',cb.checked);showToast((_otherLock(currentMinutesId).name||'다른 선생님')+' 작성 중이에요');return;} _saveMinutesNow(); return; }
  onMinutesInput();
}
function _minIndent(blk,d){
  var v=(parseInt(blk.dataset.ind,10)||0)+d;
  v=Math.max(0,Math.min(4,v));
  blk.dataset.ind=v;blk.style.marginLeft=(v*18)+'px';
  _minRenumber();onMinutesInput();
}
function _minBlocks(){var ed=document.getElementById('minutes-viewer-content');return ed?Array.prototype.slice.call(ed.querySelectorAll('.mb')):[];}
function _minCaretStart(el){if(!el)return;try{var r=document.createRange(),s=getSelection();r.selectNodeContents(el);r.collapse(true);s.removeAllRanges();s.addRange(r);el.focus();}catch(e){}}
function onMinKeydown(e){
  if(e.isComposing||e.keyCode===229)return;
  /* 방향키 위/아래로 줄 이동 */
  if(e.key==='ArrowUp'||e.key==='ArrowDown'){
    var _b=_minCurBlock();
    if(_b){
      var _sib=(e.key==='ArrowUp')?_b.previousElementSibling:_b.nextElementSibling;
      if(_sib){
        var _t=_sib.querySelector('.mb-txt');
        if(_t){e.preventDefault();(e.key==='ArrowUp')?_minCaretEnd(_t):_minCaretStart(_t);return;}
        /* 구분선 등 텍스트 없는 블록: 한 칸 더 */
        var _n2=(e.key==='ArrowUp')?_sib.previousElementSibling:_sib.nextElementSibling;
        var _t2=_n2&&_n2.querySelector('.mb-txt');
        if(_t2){e.preventDefault();(e.key==='ArrowUp')?_minCaretEnd(_t2):_minCaretStart(_t2);return;}
      }
    }
  }
  /* Delete 키: 줄 끝에서 다음 줄 합치기 / 다음이 구분선이면 삭제 */
  if(e.key==='Delete'){
    var b2=_minCurBlock(), tx2=b2&&b2.querySelector('.mb-txt');
    if(b2&&tx2){
      var sel2=getSelection();
      var atEnd=sel2&&sel2.isCollapsed&&(sel2.anchorOffset===(sel2.anchorNode&&sel2.anchorNode.textContent?sel2.anchorNode.textContent.length:0));
      var nx=b2.nextElementSibling;
      if(atEnd&&nx){
        var ntx=nx.querySelector('.mb-txt');
        e.preventDefault();
        if(!ntx){ nx.remove(); }            /* 구분선 삭제 */
        else { var cur=tx2.innerText||''; tx2.innerText=cur+(ntx.innerText||''); nx.remove(); _minCaretEnd(tx2); }
        _minRenumber(); onMinutesInput(); return;
      }
    }
  }
  if(_slashOpen&&(e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='Enter'||e.key==='Escape')){ _slashKey(e); return; }
  var blk=_minCurBlock();if(!blk)return;
  if(e.key==='Tab'){ e.preventDefault(); _minIndent(blk,e.shiftKey?-1:1); return; }
  if(e.ctrlKey||e.metaKey){
    var k=(e.key||'').toLowerCase();
    if(k==='b'||k==='i'||k==='u'){
      e.preventDefault();
      try{document.execCommand(k==='b'?'bold':k==='i'?'italic':'strikeThrough',false,null);}catch(err){}
      onMinutesInput();return;
    }
  }
  var txt=blk.querySelector('.mb-txt'), t=blk.dataset.t;
  /* ② 방향키 위/아래 줄 이동 */
  if(e.key==='ArrowUp'||e.key==='ArrowDown'){
    var sib=(e.key==='ArrowUp')?blk.previousElementSibling:blk.nextElementSibling;
    if(sib&&sib.classList&&sib.classList.contains('mb')){
      var stx=sib.querySelector('.mb-txt');
      if(stx){ e.preventDefault(); _minCaretEnd(stx); return; }
    }
    return;
  }
  /* ③ Delete: 줄 끝에서 다음 줄과 병합 / 빈 줄이면 현재 행 삭제 */
  if(e.key==='Delete'){
    var cur=txt?(txt.innerText||''):'';
    var sel=getSelection();
    var atEnd=!!(sel&&sel.isCollapsed&&sel.anchorOffset>=(sel.anchorNode&&sel.anchorNode.textContent?sel.anchorNode.textContent.length:0));
    var nx=blk.nextElementSibling;
    if(!cur.trim()&&nx){ e.preventDefault(); var ntx0=nx.querySelector('.mb-txt'); blk.remove(); _minRenumber(); if(ntx0)_minCaretEnd(ntx0); onMinutesInput(); return; }
    if(atEnd&&nx&&nx.classList&&nx.classList.contains('mb')){
      e.preventDefault();
      if(nx.dataset.t==='div'){ nx.remove(); _minRenumber(); onMinutesInput(); return; }
      var ntx=nx.querySelector('.mb-txt');
      if(txt&&ntx)txt.innerText=cur+(ntx.innerText||'');
      nx.remove(); _minRenumber();
      if(txt){var rg2=document.createRange(),sl2=getSelection();var nd=txt.firstChild||txt;var off2=Math.min(cur.length,(nd.textContent||'').length);if(nd.nodeType===3)rg2.setStart(nd,off2);else{rg2.selectNodeContents(txt);rg2.collapse(false);}rg2.collapse(true);sl2.removeAllRanges();sl2.addRange(rg2);}
      onMinutesInput(); return;
    }
    return;
  }
  if(e.key==='Enter'&&!e.shiftKey){
    e.preventDefault();
    var c=txt?txt.innerText:'';
    if((t==='ul'||t==='ol'||t==='todo')&&!c.trim()){ _minSetType(blk,'p'); return; }
    _minNewBlock(blk,(t==='ul'||t==='ol'||t==='todo')?t:'p');
    onMinutesInput();return;
  }
  if(e.key==='Backspace'&&_minAtStart()){
    var c2=txt?txt.innerText:'';
    if(t==='div'){ e.preventDefault(); var pv0=blk.previousElementSibling; blk.remove(); _minRenumber(); if(pv0){var p0=pv0.querySelector('.mb-txt');if(p0)_minCaretEnd(p0);} onMinutesInput(); return; }
    if(t!=='p'){ e.preventDefault();
      if(!c2.trim()&&blk.previousElementSibling){ /* 빈 줄이면 타입 변환 없이 바로 삭제·병합 */
        var _pv=blk.previousElementSibling, _pt=_pv.querySelector('.mb-txt');
        blk.remove(); _minRenumber();
        if(_pt){_pt.focus();_minCaretEnd(_pt);} onMinutesInput(); return;
      }
      _minSetType(blk,'p');
      var _cur=_minCurBlock(); var _ct=_cur&&_cur.querySelector('.mb-txt');
      if(_ct){_ct.focus();try{var r0=document.createRange(),s0=getSelection();r0.selectNodeContents(_ct);r0.collapse(true);s0.removeAllRanges();s0.addRange(r0);}catch(e2){}}
      return; }
    var prev=blk.previousElementSibling;
    if(prev&&prev.dataset&&prev.dataset.t==='div'){ e.preventDefault(); prev.remove(); _minRenumber(); onMinutesInput(); return; }
    if(prev){
      var ptx=prev.querySelector('.mb-txt'); if(!ptx)return;
      e.preventDefault();
      var plen=(ptx.innerText||'').length;
      if(c2)ptx.innerText=(ptx.innerText||'')+c2;   /* 내용 있으면 이전 문장에 붙임 */
      blk.remove(); _minRenumber();
      try{ ptx.focus();
        var rg=document.createRange(),sel2=getSelection();
        if(plen===0||!ptx.firstChild){ rg.selectNodeContents(ptx); rg.collapse(true); }
        else { var node=ptx.firstChild; var off=Math.min(plen,(node.textContent||'').length);
          if(node.nodeType===3){rg.setStart(node,off);rg.collapse(true);}
          else {rg.selectNodeContents(ptx);rg.collapse(false);} }
        sel2.removeAllRanges(); sel2.addRange(rg);
      }catch(err){ _minCaretEnd(ptx); }
      onMinutesInput(); return;
    }
  }
}
function onMinutesInputRaw(e){
  if(e&&e.isComposing)return;
  var blk=_minCurBlock();
  if(blk){
    var txt=blk.querySelector('.mb-txt'), c=txt?txt.innerText:'';
    var map=[[/^#\s/,'h1'],[/^##\s/,'h2'],[/^###\s/,'h3'],[/^[-*]\s/,'ul'],[/^\d+\.\s/,'ol'],[/^\[\]\s/,'todo'],[/^\[\s?\]\s/,'todo'],[/^>\s/,'quote'],[/^---$/,'div']];
    for(var i=map.length-1;i>=0;i--){
      if(blk.dataset.t==='p'&&map[i][0].test(c)){
        txt.innerText=c.replace(map[i][0],'');
        _minSetType(blk,map[i][1]);
        return;
      }
    }
    if(blk.dataset.t!=='div'&&_minAutoInline(txt))return;
    if(c==='/'&&!_slashOpen){ _minSlashOpen(blk); }
    else if(_slashOpen){ if(c.charAt(0)!=='/'){_minSlashClose();}else{_minSlashFilter(c.slice(1));} }
  }
  onMinutesInput();
}
/* 타이핑 중 **굵게** *기울임* ~~취소선~~ `코드` 자동 변환 */
function _minAutoInline(txt){
  if(!txt)return false;
  var md=_blkMd(txt);
  if(!/(\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`)/.test(md))return false;
  var html=_mdInline(md);
  if(html===txt.innerHTML)return false;
  txt.innerHTML=html;
  _minCaretEnd(txt);
  onMinutesInput();
  return true;
}
/* ── 블록 메뉴 (모바일에선 드래그보다 버튼이 정확함) ── */
var _bmBlk=null;
function openBlockMenu(btn){
  _bmBlk=btn.closest('.mb');if(!_bmBlk)return;
  var el=document.getElementById('min-blockmenu');if(!el)return;
  var items=[['⬆','위로 이동','bmMove(-1)'],['⬇','아래로 이동','bmMove(1)'],
             ['⧉','복제','bmDup()'],['⌫','삭제','bmDel()'],
             ['⇥','들여쓰기','bmInd(1)'],['⇤','내어쓰기','bmInd(-1)']];
  var html=items.map(function(i){return '<button onclick="'+i[2]+'"><span class="si">'+i[0]+'</span>'+i[1]+'</button>';}).join('')
    +'<div style="border-top:1px solid var(--border-light);margin:4px 0"></div>'
    +MIN_TYPES.map(function(d){return '<button onclick="bmType(\''+d.t+'\')"><span class="si">'+d.ic+'</span>'+d.nm+'</button>';}).join('');
  el.innerHTML=html;el.style.display='';
  var r=btn.getBoundingClientRect();
  el.style.top=Math.min(r.bottom+6,Math.max(60,window.innerHeight-300))+'px';
  el.style.left=Math.min(r.left,window.innerWidth-224)+'px';
}
function closeBlockMenu(){var el=document.getElementById('min-blockmenu');if(el)el.style.display='none';_bmBlk=null;}
function bmMove(d){if(!_bmBlk)return;var b=_bmBlk;if(d<0){var pv=b.previousElementSibling;if(pv)b.parentNode.insertBefore(b,pv);}else{var nx=b.nextElementSibling;if(nx)b.parentNode.insertBefore(nx,b);}_minRenumber();onMinutesInput();closeBlockMenu();}
function bmDup(){if(!_bmBlk)return;var cl=_bmBlk.cloneNode(true);_bmBlk.parentNode.insertBefore(cl,_bmBlk.nextSibling);_minRenumber();onMinutesInput();closeBlockMenu();}
function bmDel(){if(!_bmBlk)return;var ed=document.getElementById('minutes-viewer-content');if(ed&&ed.querySelectorAll('.mb').length<=1){closeBlockMenu();return;}_bmBlk.remove();_minRenumber();onMinutesInput();closeBlockMenu();}
function bmInd(d){if(!_bmBlk)return;_minIndent(_bmBlk,d);closeBlockMenu();}
function bmType(t){if(!_bmBlk)return;var b=_bmBlk;closeBlockMenu();_minSetType(b,t);}
/* ── / 메뉴 ── */
var _slashOpen=false,_slashBlk=null,_slashIdx=0,_slashItems=[];
function _minSlashOpen(blk){
  _slashOpen=true;_slashBlk=blk;_slashIdx=0;_minSlashFilter('');
  var el=document.getElementById('min-slash'),r=blk.getBoundingClientRect();
  el.style.display='';
  var top=r.bottom+6, maxT=window.innerHeight-260;
  el.style.top=Math.min(top,Math.max(60,maxT))+'px';
  el.style.left=Math.min(r.left,window.innerWidth-224)+'px';
}
function _minSlashFilter(q){
  q=(q||'').toLowerCase();
  _slashItems=MIN_TYPES.filter(function(d){return !q||d.nm.toLowerCase().indexOf(q)>=0||d.t.indexOf(q)>=0;});
  if(!_slashItems.length){_minSlashClose();return;}
  if(_slashIdx>=_slashItems.length)_slashIdx=0;
  var el=document.getElementById('min-slash');
  el.innerHTML=_slashItems.map(function(d,i){return '<button class="'+(i===_slashIdx?'on':'')+'" onmousedown="event.preventDefault()" onclick="_minSlashPick('+i+')"><span class="si">'+d.ic+'</span>'+d.nm+'</button>';}).join('');
}
function _minSlashPick(i){
  var d=_slashItems[i];if(!d||!_slashBlk){_minSlashClose();return;}
  var blk=_slashBlk,txt=blk.querySelector('.mb-txt');
  if(txt)txt.innerText='';
  _minSlashClose();
  _minSetType(blk,d.t);
}
function _slashKey(e){
  if(e.key==='Escape'){e.preventDefault();_minSlashClose();return;}
  if(e.key==='ArrowDown'){e.preventDefault();_slashIdx=(_slashIdx+1)%_slashItems.length;_minSlashFilter(_slashQ());return;}
  if(e.key==='ArrowUp'){e.preventDefault();_slashIdx=(_slashIdx-1+_slashItems.length)%_slashItems.length;_minSlashFilter(_slashQ());return;}
  if(e.key==='Enter'){e.preventDefault();_minSlashPick(_slashIdx);return;}
}
function _slashQ(){var t=_slashBlk&&_slashBlk.querySelector('.mb-txt');var c=t?t.innerText:'';return c.charAt(0)==='/'?c.slice(1):'';}
document.addEventListener('click',function(e){var el=document.getElementById('min-blockmenu');if(el&&el.style.display!=='none'&&!el.contains(e.target)&&!(e.target.classList&&e.target.classList.contains('mb-h')))closeBlockMenu();},true);
function _minSlashClose(){_slashOpen=false;_slashBlk=null;var el=document.getElementById('min-slash');if(el)el.style.display='none';}
/* 열어둔 채로도 남의 수정이 반영되게 — 2.5초마다 화면과 데이터를 대조 */
function _minViewSync(){
  try{
    if(!_minModalOpen()||_minEditing||!currentMinutesId)return;
    var r=resources.find(function(x){return x.id===currentMinutesId;});
    if(!r)return;
    var ed=document.getElementById('minutes-viewer-content');
    if(ed&&_minSerialize()!==(r.content||'')){
      var sc=ed.scrollTop;
      _minRender(_minParse(r.content),false);
      ed.scrollTop=sc;
      _renderMinutesMeta(r);
    }
    var ti=document.getElementById('minutes-viewer-title');
    if(ti&&document.activeElement!==ti&&ti.value!==r.title)ti.value=r.title;
    renderMinutesAck();          /* 확인 현황도 같이 갱신 */
    _updateMinutesLockUI();
  }catch(e){}
}
function openMinutesViewer(id){const r=resources.find(r=>r.id===id);if(!r)return;currentMinutesId=id;_minEditing=false;_minSlashClose();document.getElementById('minutes-viewer-title').value=r.title;_minRender(_minParse(r.content),false);_renderMinutesMeta(r);setMinutesEditing(false);_updateMinutesLockUI();renderMinutesAck();clearInterval(_minViewTimer);_minViewTimer=setInterval(_minViewSync,500);openModal('minutes-viewer-modal');}
function _bindHrClick(){try{var ed=document.getElementById('minutes-viewer-content');if(!ed)return;ed.querySelectorAll('.mb').forEach(function(b){if(b.querySelector('.mb-txt'))return;b.onclick=function(ev){if(!_minEditing)return;ev.stopPropagation();if(confirm('이 구분선을 삭제할까요?')){b.remove();_minRenumber();onMinutesInput();}};b.style.cursor=_minEditing?'pointer':'';});}catch(e){}}
function setMinutesEditing(editing){
  const ti=document.getElementById('minutes-viewer-title');
  if(ti){ti.readOnly=!editing;ti.style.borderBottom=editing?'1px dashed var(--border)':'none';}
  const ed=document.getElementById('minutes-viewer-content');
  if(ed){
    Array.prototype.forEach.call(ed.querySelectorAll('.mb-txt'),function(x){ if(editing)x.setAttribute('contenteditable','true'); else x.removeAttribute('contenteditable'); });
    Array.prototype.forEach.call(ed.querySelectorAll('.mb-ck'),function(x){x.disabled=false;});
    ed.onkeydown=editing?onMinKeydown:null;
    ed.oninput=editing?onMinutesInputRaw:null;
    ed.onpaste=editing?onMinutesPaste:null;
    try{_bindHrClick();}catch(e){}
    ed.oncompositionstart=editing?function(){window._minComposing=true;}:null;
    ed.oncompositionend=editing?function(){window._minComposing=false;try{onMinutesInput();}catch(e){}}:null;
  }
  if(!editing)_minSlashClose();
  show('minutes-edit-btn',!editing);show('minutes-save-btn',editing);
}
function onMinutesCopy(e){
  try{
    var sel=getSelection(); if(!sel||sel.rangeCount===0||sel.isCollapsed)return;
    var ed=document.getElementById('minutes-viewer-content'); if(!ed)return;
    var rng=sel.getRangeAt(0);
    if(!ed.contains(rng.commonAncestorContainer))return;
    var tmp=document.createElement('div'); tmp.appendChild(rng.cloneContents());
    Array.prototype.forEach.call(tmp.querySelectorAll('.mb-h'),function(x){x.remove();}); /* ⋮⋮ 편집 핸들 제거 */
    var txts=tmp.querySelectorAll('.mb-txt');
    var text;
    if(txts.length){
      text=Array.prototype.map.call(txts,function(x){
        var mb=x.closest?x.closest('.mb'):null, pre='';
        if(mb){
          var mk=mb.querySelector('.mb-mk');
          if(mk){pre=mk.textContent+' ';}
          else if(mb.querySelector('.mb-ck')){pre=mb.classList.contains('done')?'[x] ':'[ ] ';}
        }
        return (pre+(x.innerText||'')).replace(/\s*\n\s*/g,' ').replace(/\s+$/,'');
      }).join('\n');
    } else {
      text=(tmp.innerText||'').replace(/\r/g,'');
    }
    if(e.clipboardData){ e.clipboardData.setData('text/plain',text); e.preventDefault(); }
  }catch(err){}
}
function onMinutesPaste(e){
  try{
    var cd=e.clipboardData||window.clipboardData; if(!cd)return;
    var text=cd.getData('text/plain'); if(text==null)return;
    e.preventDefault();
    text=text.replace(/\r\n?/g,'\n');
    var lines=text.split('\n');
    if(lines.length>1&&lines[lines.length-1]==='')lines.pop(); /* 끝의 빈 줄 하나는 무시 */
    try{document.execCommand('insertText',false,lines[0]||'');}catch(err){}
    var blk=_minCurBlock();
    if(blk&&lines.length>1){
      for(var i=1;i<lines.length;i++){
        var nb=_minNewBlock(blk,'p');
        var txt=nb.querySelector('.mb-txt');
        if(txt)txt.textContent=lines[i];
        blk=nb;
      }
      _minCaretEnd(blk.querySelector('.mb-txt'));
    }
    onMinutesInput();
  }catch(err){}
}
function onMinutesInput(){if(!_minEditing)return;clearTimeout(_minSaveTimer);_minSaveTimer=setTimeout(_saveMinutesNow,250);}
function _saveMinutesNow(){if(window._minComposing)return;const r=resources.find(r=>r.id===currentMinutesId);if(!r)return;const v=_minSerialize();if(v===r.content)return;r.content=v;r.updatedAt=_minDateStr();r.updatedBy=G.displayName;r.updatedById=G.id;_renderMinutesMeta(r);try{if(typeof flushSync==='function')flushSync();}catch(e){}var b=document.getElementById('minutes-lock-banner');if(b&&_minEditing){b.textContent='✏️ 편집 중 · 자동 저장됨 ✓';}}
function _updateMinutesLockUI(){var b=document.getElementById('minutes-lock-banner');if(!b)return;var eb=document.getElementById('minutes-edit-btn');var other=_otherLock(currentMinutesId);var _ar=resources.find(function(x){return x.id===currentMinutesId;});if(_isArchivedMinutes(_ar)){b.style.display='';b.style.background='var(--bg)';b.style.color='var(--text-light)';b.textContent='🔒 보관된 회의록 · 읽기 전용';show('minutes-edit-btn',false);show('minutes-save-btn',false);return;}if(_minEditing){b.style.display='';b.style.background='var(--mint-light)';b.style.color='#2D9E8F';b.textContent='✏️ 편집 중 · 자동 저장되고 실시간으로 공유돼요';}else if(other){b.style.display='';b.style.background='var(--coral-light)';b.style.color='#D95F50';b.textContent='🔴 '+other.name+' 선생님이 실시간 편집 중 · 화면이 자동 갱신돼요';if(eb){eb.disabled=true;eb.style.opacity='.4';}}else{b.style.display='none';if(eb){eb.disabled=false;eb.style.opacity='';}}}
function startMinutesEdit(){var _r=resources.find(function(x){return x.id===currentMinutesId;});if(_isArchivedMinutes(_r)){showToast('보관된 지난해 회의록은 수정할 수 없어요');return;}var other=_otherLock(currentMinutesId);if(other){showToast(other.name+' 작성 중이에요');return;}_minEditing=true;setMinutesEditing(true);_writeLock();_updateMinutesLockUI();clearInterval(_minHbTimer);_minHbTimer=setInterval(_writeLock,8000);clearInterval(_minLiveTimer);_minLiveTimer=setInterval(function(){try{_saveMinutesNow();}catch(e){}},600);var ed=document.getElementById('minutes-viewer-content');var f=ed&&ed.querySelector('.mb-txt');if(f)_minCaretEnd(f);}
function stopMinutesEdit(){clearTimeout(_minSaveTimer);_saveMinutesNow();_minEditing=false;clearInterval(_minHbTimer);_minHbTimer=null;clearInterval(_minLiveTimer);_minLiveTimer=null;_releaseLock();setMinutesEditing(false);_updateMinutesLockUI();try{renderResourceList();}catch(e){}try{renderMinutesHub();}catch(e){}try{renderHomeMinutes();}catch(e){}showToast('저장되었습니다');}
function closeMinutesViewer(){clearInterval(_minViewTimer);_minViewTimer=null;if(_minEditing){stopMinutesEdit();}else{_releaseLock();}closeModal('minutes-viewer-modal');}
function saveMinutesEdit(){_saveMinutesNow();stopMinutesEdit();}   /* 옛 호출 호환 */
function _acResolve(v){closeModal('app-confirm-modal');var f=window.__acCb;window.__acCb=null;if(f)f(v);}
var _ACI={trash:'<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',warn:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',unlock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',info:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'};
function appConfirm(opt){return new Promise(function(res){var o=(typeof opt==='string')?{title:opt}:(opt||{});var g=function(id,v){var e=document.getElementById(id);if(e)e.textContent=v;};var _ie=document.getElementById('ac-icon');if(_ie)_ie.innerHTML='<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="'+(o.danger?'#E5806B':'var(--primary)')+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(_ACI[o.icon]||_ACI.info)+'</svg>';g('ac-title',o.title||'');g('ac-desc',o.desc||'');var ok=document.getElementById('ac-ok');if(ok){ok.textContent=o.okText||'확인';ok.style.background=o.danger?'var(--coral)':'';}window.__acCb=res;openModal('app-confirm-modal');});}
function _isFullAdmin(){return G.role==='teacher'&&(G.type==='principal'||G.type==='admin'||G.isAdmin);}
function deleteMinutes(){if(!currentMinutesId)return;var r=resources.find(x=>x.id===currentMinutesId);if(!r)return;if(!(_isFullAdmin()||r.authorId===G.id||r.createdById===G.id)){showToast('작성자 또는 교감·교무·관리자만 삭제할 수 있어요');return;}appConfirm({icon:'trash',title:'휴지통으로 옮길까요?',desc:(r.title||'회의록')+'\n휴지통에서 다시 복구할 수 있어요.',okText:'옮기기'}).then(function(ok){if(!ok)return;_doDeleteMinutes(r);});return;}
function _doDeleteMinutes(r){const id=currentMinutesId;_minEditing=false;clearInterval(_minHbTimer);_releaseLock();r.deleted=true;r.deletedAt=Date.now();r.deletedBy=G.displayName;closeModal('minutes-viewer-modal');renderResourceList();try{renderMinutesHub();}catch(e){}try{if(typeof flushSync==='function')flushSync();}catch(e){}showToast('휴지통으로 옮겼어요 · 복구 가능');}
function openMinutesTrash(){var el=document.getElementById('minutes-trash-body');if(!el)return;var list=(resources||[]).filter(function(r){return r&&r.cat==='minutes'&&r.deleted;}).sort(function(a,b){return (b.deletedAt||0)-(a.deletedAt||0);});if(!list.length){el.innerHTML='<div class="empty" style="padding:28px"><div class="empty-emoji" style="font-size:28px">🗑</div><div class="empty-title" style="font-size:13px">휴지통이 비어 있어요</div></div>';}else{el.innerHTML=list.map(function(r){var d=r.deletedAt?new Date(r.deletedAt):null;var ds=d?(d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0')):'';var over=r.deletedAt&&(Date.now()-r.deletedAt>30*86400000);return '<div class="card" style="margin-bottom:8px"><div style="font-size:13px;font-weight:700">'+_esc(r.title||'회의록')+'</div><div style="font-size:11px;color:var(--text-light);margin:3px 0 8px">'+ds+' · '+_esc(r.deletedBy||'')+(over?' · <span style="color:var(--coral)">30일 경과</span>':'')+'</div><div style="display:flex;gap:6px"><button class="btn btn-sm btn-primary" style="flex:1" onclick="restoreMinutes(\''+r.id+'\')">복구</button>'+(_isFullAdmin()?'<button class="btn btn-sm" style="flex:1;background:var(--coral-light);color:#D95F50" onclick="purgeMinutes(\''+r.id+'\')">영구 삭제</button>':'')+'</div></div>';}).join('');}openModal('minutes-trash-modal');}
function restoreMinutes(id){var r=resources.find(x=>x.id===id);if(!r)return;delete r.deleted;delete r.deletedAt;delete r.deletedBy;try{if(typeof flushSync==='function')flushSync();}catch(e){}try{renderMinutesHub();}catch(e){}renderResourceList();openMinutesTrash();showToast('복구했어요');}
function purgeMinutes(id){if(!_isFullAdmin()){showToast('교감·교무·관리자만 영구 삭제할 수 있어요');return;}var r=resources.find(x=>x.id===id);if(!r)return;appConfirm({icon:'warn',title:'영구 삭제할까요?',desc:(r.title||'회의록')+'\n삭제하면 복구할 수 없어요.',okText:'영구 삭제',danger:true}).then(function(ok){if(!ok)return;_doPurgeMinutes(id,r);});return;}
function _doPurgeMinutes(id,r){resources=resources.filter(x=>x.id!==id);try{if(window.FB&&FB.enabled()&&FB.remove)FB.remove('resources',id);}catch(e){}try{if(typeof flushSync==='function')flushSync();}catch(e){}openMinutesTrash();renderResourceList();showToast('영구 삭제했어요');}
function _writeLock(){var id=currentMinutesId;if(!id||!(window.FB&&FB.enabled()))return;try{var pr=FB.save('minutesLocks',id,{id:id,uid:G.id,name:((G.name||'')+' '+(G.baptism||'')).trim(),ts:Date.now()});if(pr&&pr.catch)pr.catch(function(){if(!window._lockWarned){window._lockWarned=true;showToast('⚠️ 편집 잠금 저장 실패 — Firestore 규칙에 minutesLocks 권한이 필요해요');}});}catch(e){}}
function _releaseLock(){var id=currentMinutesId;if(!id)return;var l=_minutesLocks[id];if(l&&l.uid&&l.uid!==G.id)return;/* 남의 락은 건드리지 않음 */try{if(window.FB&&FB.enabled())FB.remove('minutesLocks',id);}catch(e){}delete _minutesLocks[id];}
if(window.FB&&FB.enabled()){FB.ready(function(){
  FB.watch('minutesLocks',function(arr){var m={};(arr||[]).forEach(function(l){if(l&&l.id)m[l.id]=l;});_minutesLocks=m;if(_minModalOpen())_updateMinutesLockUI();try{if(typeof resourceCurCat!=='undefined'&&resourceCurCat==='minutes')renderResourceList();}catch(e){}});
  FB.watch('resources',function(cloud){try{autoArchiveMinutes();}catch(e){}try{renderMinutesHub();}catch(e){}try{renderHomeMinutes();}catch(e){}if(!_minModalOpen()||_minEditing||!currentMinutesId)return;var cd=(cloud||[]).find(function(x){return x&&x.id===currentMinutesId;});if(!cd)return;if(_minSerialize()!==(cd.content||'')){var _ed=document.getElementById('minutes-viewer-content');var _sc=_ed?_ed.scrollTop:0;_minRender(_minParse(cd.content),false);if(_ed)_ed.scrollTop=_sc;_renderMinutesMeta(cd);var _ti=document.getElementById('minutes-viewer-title');if(_ti&&_ti.value!==cd.title)_ti.value=cd.title;}});
});}
window.addEventListener('beforeunload',function(){try{if(currentMinutesId&&_minEditing)_releaseLock();}catch(e){}});
let attachBuf={write:{imgs:[],docs:[]},aw:{imgs:[],docs:[]},gallery:{imgs:[],docs:[]},event:{imgs:[],docs:[]},rw:{imgs:[],docs:[]},wn:{imgs:[],docs:[]}};
function bufSrc(e){return typeof e==='object'?e.src:e;}
function renderAttachBuf(pfx){const b=attachBuf[pfx];const ib=document.getElementById(pfx+'-img-preview');const db=document.getElementById(pfx+'-doc-preview');
if(ib)ib.innerHTML=b.imgs.map((s,i)=>`<div style="position:relative;flex-shrink:0"><img src="${bufSrc(s)}" class="attach-thumb"><button onclick="removeAttach('${pfx}','imgs',${i})" style="position:absolute;top:-5px;right:-5px;width:20px;height:20px;border-radius:50%;border:none;background:rgba(0,0,0,.65);color:white;font-size:11px;line-height:1;cursor:pointer">✕</button></div>`).join('');
if(db)db.innerHTML=b.docs.map((d,i)=>`<div class="attach-file-item">📎 <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.name}</span><button onclick="removeAttach('${pfx}','docs',${i})" style="border:none;background:none;color:var(--coral);font-weight:800;font-size:13px;cursor:pointer;padding:0 4px">✕</button></div>`).join('');}
function removeAttach(pfx,kind,i){attachBuf[pfx][kind].splice(i,1);renderAttachBuf(pfx);}
function resetAttachBuf(pfx){attachBuf[pfx]={imgs:[],docs:[]};renderAttachBuf(pfx);}
function loadAttachBuf(pfx,p){attachBuf[pfx].imgs=p.images?p.images.map(function(im){return _srcOf(im);}).filter(Boolean):(p.image?[p.image]:[]);attachBuf[pfx].docs=(p.docs||[]).slice();renderAttachBuf(pfx);}
function addAttachImgs(input,pfx){if(!input.files||!input.files.length)return;var _md=pfx==='gallery'?1160:1280,_q=pfx==='gallery'?0.6:0.72;readFilesAsDataURLs(input.files,_md,_q).then(srcs=>{if(pfx==='event')attachBuf[pfx].imgs=srcs.slice(0,1);else attachBuf[pfx].imgs=attachBuf[pfx].imgs.concat(srcs).slice(0,10);input.value='';renderAttachBuf(pfx);});}
function _docBytes(o){try{return new Blob([JSON.stringify(o)]).size;}catch(e){return (JSON.stringify(o)||'').length;}}
function _imgsTooBig(payload){var sz=_docBytes(payload);if(sz>980000){showToast('사진 용량이 너무 커요 ('+Math.round(sz/1024)+'KB). 사진 수를 줄이거나 더 작은 사진으로 올려주세요');return true;}return false;}
const DOC_MAX=10*1024*1024;   /* 파일 1개 최대 10MB (자동으로 여러 조각에 나눠 저장) */
function addAttachDocs(input,pfx){
  if(!input.files||!input.files.length)return;
  const files=Array.from(input.files);
  const ok=files.filter(f=>f.size<=DOC_MAX);
  const big=files.filter(f=>f.size>DOC_MAX);
  if(big.length)showToast('⚠️ '+big[0].name+(big.length>1?(' 외 '+(big.length-1)+'개'):'')+'는 10MB를 넘어 첨부할 수 없어요');
  if(!ok.length){input.value='';return;}
  if(ok.some(f=>f.size>3*1024*1024))showToast('📎 큰 파일은 저장에 시간이 조금 걸려요');
  Promise.all(ok.map(f=>new Promise(res=>{const r=new FileReader();r.onload=e=>res({name:f.name,size:f.size,data:e.target.result});r.readAsDataURL(f);})))
    .then(ds=>{attachBuf[pfx].docs=attachBuf[pfx].docs.concat(ds).slice(0,5);input.value='';renderAttachBuf(pfx);});
}
function previewImages(input,previewId){const wrap=document.getElementById(previewId);if(!wrap)return;wrap.innerHTML='';Array.from(input.files).slice(0,10).forEach(f=>{const r=new FileReader();r.onload=e=>{const img=document.createElement('img');img.src=e.target.result;img.className='attach-thumb';wrap.appendChild(img);};r.readAsDataURL(f);});}
function previewDocs(input,previewId){const wrap=document.getElementById(previewId);if(!wrap)return;wrap.innerHTML='';Array.from(input.files).slice(0,5).forEach(f=>{const div=document.createElement('div');div.className='attach-file-item';div.innerHTML='📎 '+f.name+' <span style="margin-left:auto;color:var(--text-light)">'+(f.size/1024/1024).toFixed(1)+'MB</span>';wrap.appendChild(div);});}
function _todayDot(){const n=new Date();return n.getFullYear()+'.'+String(n.getMonth()+1).padStart(2,'0')+'.'+String(n.getDate()).padStart(2,'0');}
function postTs(p){
  if(!p)return 0;
  if(p.ts)return Number(p.ts);
  const m=String(p.id||'').match(/(\d{13})/); if(m)return Number(m[1]);
  const d=String(p.date||'').replace(/\./g,'-'); const t=Date.parse(d); return isNaN(t)?0:t;
}
function sortPostsNewest(arr){return (arr||[]).slice().sort(function(a,b){return postTs(b)-postTs(a);});}
function renderPushNudgeBar(){
  var bar=document.getElementById('push-nudge-bar'); if(!bar)return;
  var show=false;
  try{
    if(!pushIsOn() && ('Notification' in window) && Notification.permission!=='denied'){
      var hide=Number(localStorage.getItem('hd-nudge-hide')||0);
      show = !(hide && Date.now()<hide);   /* 닫으면 3일간 숨김 */
    }
  }catch(e){}
  bar.style.display=show?'block':'none';
}
function openPushNudge(){ _resetOptinText(); openModal('push-optin-modal'); }
function dismissPushNudge(){ try{localStorage.setItem('hd-nudge-hide',String(Date.now()+3*86400000));}catch(e){} var b=document.getElementById('push-nudge-bar'); if(b)b.style.display='none'; }
/* 공지 종류 구분 — 주간공지 / 방학 / 일반 */
function noticeKind(p){
  var id=String(p&&p.id||'');
  if(id.indexOf('wn-')===0)return {k:'weekly',label:'주간',bg:'var(--primary-light)',fg:'var(--primary-dark)'};
  if(id.indexOf('vac-post-')===0)return {k:'vac',label:'방학',bg:'var(--yellow-light)',fg:'#B37A00'};
  if(p&&p.isImportant)return {k:'imp',label:'중요',bg:'var(--coral-light)',fg:'#D95F50'};
  return null;
}
function noticeChip(p){
  var k=noticeKind(p);if(!k)return '';
  return '<span style="display:inline-block;font-size:9.5px;font-weight:800;padding:2px 7px;border-radius:20px;background:'+k.bg+';color:'+k.fg+';margin-right:5px;vertical-align:1px">'+k.label+'</span>';
}
function renderHomeNotices(){const el=document.getElementById('home-notices');if(!el)return;const notices=sortPostsNewest(posts.filter(p=>p.cat==='notice'&&(G.role==='teacher'?true:G.role==='parent'?_canParentSee(p):_canStudentSee(p,G.gradeKey)))).slice(0,5);if(!notices.length){el.innerHTML='<div class="empty" style="padding:24px"><div class="empty-emoji" style="font-size:28px">📋</div><div class="empty-title" style="font-size:13px">아직 공지사항이 없어요</div></div>';return;}el.innerHTML=notices.map(p=>{const k=noticeKind(p);return `<div class="notice-item" onclick="openPostDetail('${p.id}')"${k?` style="border-left:3px solid ${k.fg};padding-left:9px"`:''}><div class="notice-unread"></div><div class="notice-info"><div class="notice-title">${noticeChip(p)}${p.title}</div><div class="notice-meta">${p.authorName} · ${p.date}</div></div></div>`;}).join('');}
function openChildAttend(sid){
  var u=pendingList.find(function(x){return x.id===sid;});
  if(!u){showToast('학생 정보를 찾을 수 없어요');return;}
  document.getElementById('ca-title').textContent='📅 '+u.name+' '+(u.baptism||'')+' 출석 현황';
  var start=u.joinedAt||'';try{if(appConfig&&appConfig.termStart&&appConfig.termStart>start)start=appConfig.termStart;}catch(e){}
  // 집계 시작(가입/학년도 시작) 이후 토요일만, 최신순
  var sats=getSaturdays(60).filter(function(d){return (!start||d>=start)&&d<=toDateStr(new Date());});
  var att=0,half=0,ab=0,vac=0;
  var rows=sats.map(function(d){
    var isVac=isVacationDate(d);
    var v=attendVal(u,d);
    var label,color,bg,icon;
    if(isVac){label='방학';color='var(--text-light)';bg='var(--bg)';icon='🏖️';vac++;}
    else if(v===1){label='출석';color='#2D9E8F';bg='var(--mint-light)';icon='○';att++;}
    else if(v===0.5){label='반일 출석';color='#C9A227';bg='var(--yellow-light)';icon='◐';half++;}
    else {label='결석';color='#D95F50';bg='var(--coral-light)';icon='✕';ab++;}
    var mm=parseInt(d.slice(5,7)),dd=parseInt(d.slice(8,10));
    return '<div style="display:flex;align-items:center;gap:12px;padding:11px 13px;border-radius:12px;background:'+bg+';margin-bottom:7px"><div style="width:30px;height:30px;border-radius:50%;background:'+color+';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex-shrink:0">'+icon+'</div><div style="flex:1"><div style="font-size:13px;font-weight:700">'+mm+'월 '+dd+'일</div></div><div style="font-size:12px;font-weight:700;color:'+color+'">'+label+'</div></div>';
  }).join('');
  var sm=document.getElementById('ca-summary');
  function box(n,l,c){return '<div style="flex:1;text-align:center;background:var(--card);border:1px solid var(--border-light);border-radius:12px;padding:11px 4px"><div style="font-size:20px;font-weight:800;color:'+c+'">'+n+'</div><div style="font-size:10px;color:var(--text-light);margin-top:2px">'+l+'</div></div>';}
  sm.innerHTML=box(att+(half?'.5':''),'출석','#2D9E8F')+box(ab,'결석','#D95F50')+box(vac,'방학','var(--text-light)');
  document.getElementById('ca-body').innerHTML=rows||'<div style="text-align:center;color:var(--text-light);font-size:12px;padding:20px">아직 출석 기록이 없어요</div>';
  openModal('child-attend-modal');
}
function renderParentChildCards(children){const el=document.getElementById('parent-child-cards');if(!el||!children.length)return;const students=pendingList.filter(u=>u.approved&&u.role==='student'&&!u.hidden&&!u.graduated);el.innerHTML=children.map(c=>{const nm=c.name||c;const cb=c.baptism||'';const linked=c.sid?students.find(s=>s.id===c.sid):null;const ambiguous=false;const statusText=linked?(linked.gradeLabel||''):'🔒 연결 대기';return `<div class="card" style="margin-bottom:8px${linked?';cursor:pointer':''}"${linked?` onclick="openChildAttend('${linked.id}')"`:''}><div style="display:flex;align-items:center;gap:12px${linked?';margin-bottom:12px':''}"><div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--lavender));display:flex;align-items:center;justify-content:center;color:white;font-weight:800">${nm.charAt(0)}</div><div><div style="font-size:14px;font-weight:700">${nm}${cb?' '+cb:''}</div><div style="font-size:11px;color:${ambiguous?'var(--coral)':'var(--text-light)'}">${statusText}</div></div></div>${linked?`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid var(--border-light);padding-top:10px"><div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--primary)">${linked.attendTotal||0}</div><div style="font-size:10px;color:var(--text-light)">누적</div></div><div style="text-align:center;border-left:1px solid var(--border-light);border-right:1px solid var(--border-light)"><div style="font-size:18px;font-weight:800;color:var(--mint)">${monthAttendCount(linked)}</div><div style="font-size:10px;color:var(--text-light)">이번 달</div></div><div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--yellow)">${linked.streak||0}</div><div style="font-size:10px;color:var(--text-light)">연속</div></div></div>`:ambiguous?`<div style="font-size:11px;color:var(--coral);margin-top:8px;line-height:1.6;background:var(--coral-light);padding:9px 11px;border-radius:8px">담당 선생님께 문의해주시면 연결해드립니다.</div>`:`<div style="font-size:11px;color:var(--text-light);margin-top:8px;line-height:1.6;background:var(--bg);padding:9px 11px;border-radius:8px">🔒 담당 선생님이 자녀 연결을 확인하면 정보가 표시돼요.</div>`}</div>`;}).join('');}

/* 알림이 실제로 뜨는지 바로 확인 */
function testNotif(){
  var el=document.getElementById('notif-test-result');
  var line=function(t){ if(el){el.style.display='block';el.innerHTML+=t+'<br>';} };
  if(el){el.style.display='block';el.innerHTML='<b>진단</b><br>';}
  try{
    line('· 알림 지원: '+(('Notification' in window)?'O':'X (브라우저 미지원)'));
    line('· 권한 상태: '+((window.Notification&&Notification.permission)||'-'));
    if(navigator.serviceWorker&&navigator.serviceWorker.getRegistration){
      navigator.serviceWorker.getRegistration().then(function(reg){
        line('· 서비스워커: '+(reg?'등록됨':'없음 (푸시 불가)'));
      }).catch(function(){ line('· 서비스워커: 확인 실패'); });
    }else line('· 서비스워커: 미지원');
    line('· 알림 모드: '+(G.notifMode==='silent'?'무음 (알림 안 뜸)':'진동'));
    if(G.notifMode==='silent'){ line('→ 무음이라 알림이 안 떠요. 진동으로 바꿔주세요.'); return; }
    if(window.Notification&&Notification.permission==='denied'){
      line('→ 권한이 차단됨. 브라우저 설정에서 이 사이트 알림을 허용해주세요.'); return;
    }
    pushLocalNotif('🔔 알림 테스트','이 알림이 보이면 정상이에요');
    line('→ 3초 안에 알림이 오면 정상입니다');
  }catch(e){ line('· 오류: '+e.message); }
}
function openNotifSetting(){
  var _isAdminT=(G.role==='teacher'&&(G.type==='principal'||G.type==='admin'||G.isAdmin));
  var rd=document.getElementById('notif-reset-devices');
  if(rd)rd.style.display=_isAdminT?'block':'none';
  var tb=document.getElementById('notif-test-btn');if(tb)tb.style.display=_isAdminT?'':'none';
  var tr=document.getElementById('notif-test-result');if(tr&&!_isAdminT)tr.style.display='none';
  var vb=document.getElementById('notif-vibrate-btn'),sl=document.getElementById('notif-silent-btn');
  if(vb)vb.classList.toggle('active',G.notifMode!=='silent');
  if(sl)sl.classList.toggle('active',G.notifMode==='silent');
  var lbl=document.getElementById('notif-setting-label');if(lbl)lbl.textContent=G.notifMode==='silent'?'무음':'진동';
  openModal('notif-setting-modal');
}
async function resetMyPushDevices(){
  if(!confirm('이 휴대폰의 알림 등록을 깨끗이 정리할까요?\n예전에 남은 유령 등록까지 모두 지우고, 지금 이 기기만 다시 등록해서 중복 알림을 없애요.'))return;
  showToast('🔄 정리하는 중…');
  try{
    // 0) 지금 이 기기의 '현재 토큰'을 먼저 알아둔다
    let curTok='';
    try{
      _msg=_msg||firebase.messaging();
      const reg=await fcmReg();
      curTok=await _msg.getToken({vapidKey:VAPID_KEY,serviceWorkerRegistration:reg})||'';
    }catch(e){console.warn('[RESET] getToken',e);}

    // 1) 모든 회원 문서에서 '이 기기 토큰'을 제거 (유령 등록 청소)
    if(curTok && window.FB && FB.enabled() && FB.save){
      for(const u of pendingList){
        const cur=u.fcm||[];
        if(cur.includes(curTok)){
          u.fcm=cur.filter(t=>t!==curTok);
          try{await FB.save('members',u.id,u);}catch(e){}
        }
      }
    }
    // adminFcm(레거시 저장소)은 통째로 비운다 — 이제 회원 문서 fcm만 사용
    appConfig.adminFcm=[];

    // 2) 이 기기 토큰을 폐기하고 완전히 새로 발급 (기존 H 토큰 무력화)
    let newTok='';
    try{
      _msg=_msg||firebase.messaging();
      const reg=await fcmReg();
      if(_msg&&_msg.deleteToken){ try{await _msg.deleteToken();}catch(e){} }
      newTok=await _msg.getToken({vapidKey:VAPID_KEY,serviceWorkerRegistration:reg})||'';
    }catch(e){console.warn('[RESET] regen',e);}

    // 3) 새 토큰을 '지금 로그인한 계정'에만 등록
    const me=_meRec();
    if(newTok){
      if(me){
        me.fcm=[newTok];
        if(window.FB&&FB.enabled()&&FB.save){try{await FB.save('members',me.id,me);}catch(e){}}
      } else {
        appConfig.adminFcm=[newTok];
      }
    } else if(me){
      me.fcm=[];
    }
    try{if(window.flushCfg)window.flushCfg();}catch(e){}

    showToast('✅ 정리 완료! 이제 이 기기로만, 한 번씩만 알림이 와요');
  }catch(e){ console.error('[RESET]',e); showToast('정리 중 문제가 생겼어요. 다시 시도해주세요'); }
}
function _saveNotifModeIDB(mode){
  try{
    var req=indexedDB.open('hd-prefs',1);
    req.onupgradeneeded=function(){try{req.result.createObjectStore('kv');}catch(e){}};
    req.onsuccess=function(){try{var db=req.result;var tx=db.transaction('kv','readwrite');tx.objectStore('kv').put(mode,'notifMode');}catch(e){}};
  }catch(e){}
}
function setNotifMode(mode){
  G.notifMode=mode;
  var vb=document.getElementById('notif-vibrate-btn'),sl=document.getElementById('notif-silent-btn');
  if(vb)vb.classList.toggle('active',mode==='vibrate');
  if(sl)sl.classList.toggle('active',mode==='silent');
  var lbl=document.getElementById('notif-setting-label');if(lbl)lbl.textContent=mode==='vibrate'?'진동':'무음';
  try{localStorage.setItem('hd-notif-mode',mode);}catch(e){}
  try{_saveNotifModeIDB(mode);}catch(e){}
  if(mode==='vibrate'){
    var ok=false;try{if(navigator.vibrate)ok=navigator.vibrate([0,120,60,120]);}catch(e){}
    showToast(ok?'📳 진동은 이렇게 울려요':'📳 진동 모드로 설정했어요 (이 기기는 진동을 지원하지 않아요)');
  }else{
    try{if(navigator.vibrate)navigator.vibrate(0);}catch(e){}
    showToast('🔇 무음 모드로 설정했어요');
  }
}
var _peAvatar=null;
function _timeAgo(ts,fallback){if(!ts)return fallback||'';var d=Date.now()-Number(ts);if(isNaN(d))return fallback||'';if(d<60000)return '방금';var m=Math.floor(d/60000);if(m<60)return m+'분 전';var h=Math.floor(m/60);if(h<24)return h+'시간 전';var day=Math.floor(h/24);if(day<7)return day+'일 전';var dt=new Date(Number(ts));var p2=function(n){return (n<10?'0':'')+n;};return dt.getFullYear()+'.'+p2(dt.getMonth()+1)+'.'+p2(dt.getDate());}
function _avatarHTML(u,sz){sz=sz||40;var base='width:'+sz+'px;height:'+sz+'px;min-width:'+sz+'px;min-height:'+sz+'px;flex-shrink:0;box-sizing:border-box;display:flex;align-items:center;justify-content:center;overflow:hidden;';var a=u&&u.avatar;if(a)return '<div class="student-avatar" style="'+base+'background-color:#4BAF9E;background-image:url(\''+a+'\');background-size:cover;background-position:center;background-repeat:no-repeat"></div>';var ic=Math.round(sz*0.56);return '<div class="student-avatar" style="'+base+'background-color:#4BAF9E;background-image:none"><svg width="'+ic+'" height="'+ic+'" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.94)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg></div>';}
function _avatarById(id,name,sz){var u=(pendingList||[]).find(function(x){return x.id===id;})||(id===G.id?G:null);return _avatarHTML({avatar:u&&u.avatar,name:(u&&u.name)||name},sz);}
function _resizeImg(file,cb){var r=new FileReader();r.onload=function(){var img=new Image();img.onload=function(){var mx=220,w=img.width,h=img.height;if(w>h){if(w>mx){h=Math.round(h*mx/w);w=mx;}}else{if(h>mx){w=Math.round(w*mx/h);h=mx;}}var c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);cb(c.toDataURL('image/jpeg',0.8));};img.src=r.result;};r.readAsDataURL(file);}
function onPickAvatar(inp){var f=inp.files&&inp.files[0];if(!f)return;_resizeImg(f,function(d){_peAvatar=d;var pv=document.getElementById('pe-avatar-preview');if(pv){pv.style.backgroundImage='url('+d+')';pv.textContent='';}});}
function clearAvatar(){_peAvatar='';var pv=document.getElementById('pe-avatar-preview');if(pv){pv.style.backgroundImage='';pv.innerHTML='<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.92)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>';}}
function openAvatarFull(src){if(!src)return;var im=document.getElementById('avatar-full-img');if(!im)return;im.src=src;openModal('avatar-full-modal');window._afOpen=true;try{history.pushState({af:1},'');window._afHist=true;}catch(e){}}
function _afClose(byPop){if(!window._afOpen)return;window._afOpen=false;closeModal('avatar-full-modal');try{var pv=document.getElementById('profile-view-modal');if(pv&&!pv.classList.contains('open'))openModal('profile-view-modal');}catch(e){}if(!byPop&&window._afHist){window._afHist=false;try{history.back();}catch(e){}}else{window._afHist=false;}}
function closeAvatarFull(){_afClose(false);}
window.addEventListener('popstate',function(){if(window._afOpen)_afClose(true);});

function openProfileView(uid){var u=(pendingList||[]).find(function(x){return x.id===uid;})||(uid===G.id?(_meRec()||G):null);if(!u)return;var av=document.getElementById('pv-avatar');if(av){av.onclick=u.avatar?function(ev){if(ev)ev.stopPropagation();openAvatarFull(u.avatar);}:null;av.style.cursor=u.avatar?'zoom-in':'default';if(u.avatar){av.style.backgroundImage="url('"+u.avatar+"')";av.innerHTML='';}else{av.style.backgroundImage='none';av.innerHTML='<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.92)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>';}}document.getElementById('pv-name').textContent=((u.name)||'')+' '+((u.baptism)||'');document.getElementById('pv-role').textContent=(u.role==='student'?((u.gradeLabel)||'학생'):u.role==='parent'?'학부모':'교사');var _pvs=document.getElementById('pv-status');if(_pvs){if(u.statusMsg){_pvs.textContent=u.statusMsg;_pvs.style.display='';}else{_pvs.textContent='';_pvs.style.display='none';}}openModal('profile-view-modal');}
function _peMode(mode){var t=document.getElementById('pe-modal-title');if(t)t.textContent=(mode==='pw')?'🔑 비밀번호 변경':'✏️ 프로필 설정';var ps=document.getElementById('pe-profile-sec');if(ps)ps.style.display=(mode==='pw')?'none':'';var ws=document.getElementById('pe-pw-sec');if(ws)ws.style.display=(mode==='pw')?'':'none';}
function openPwChange(){openProfileEdit();_peMode('pw');}
function openProfileEdit(){
  _peMode('profile');
  const me=_meRec()||G;
  const g=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v||'';};
  g('pe-name',me.name); g('pe-baptism',me.baptism); g('pe-status',me.statusMsg);
  g('pe-pw-cur',''); g('pe-pw-new',''); g('pe-pw-confirm','');
  _peAvatar=null;
  var pv=document.getElementById('pe-avatar-preview');
  if(pv){if(me.avatar){pv.style.backgroundImage='url('+me.avatar+')';pv.innerHTML='';}else{pv.style.backgroundImage='';pv.innerHTML='<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.92)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>';}}
  openModal('profile-edit-modal');
}
async function submitProfileEdit(){
  var me=_meRec();
  if(!me){ /* 관리자 등 회원문서가 아직 없으면 G 기준으로 생성 */
    me=Object.assign({},G,{id:G.id,name:G.name,baptism:G.baptism,role:G.role,approved:true});
    try{pendingList.push(me);}catch(e){}
  }
  var stEl=document.getElementById('pe-status');
  if(stEl){me.statusMsg=(stEl.value||'').trim();G.statusMsg=me.statusMsg;}
  if(_peAvatar!==null){ if(_peAvatar===''){me.avatar='';G.avatar='';} else {me.avatar=_peAvatar;G.avatar=_peAvatar;} }
  const cur=(document.getElementById('pe-pw-cur').value||'').trim();
  const n1=(document.getElementById('pe-pw-new').value||'').trim();
  const n2=(document.getElementById('pe-pw-confirm').value||'').trim();
  if(n1||n2||cur){
    if(!cur){showToast('현재 비밀번호를 입력해주세요');return;}
    const hc=await hashPw(G.id,cur);
    const ok=(me.pwh&&me.pwh===hc)||(!me.pwh&&me.pw&&me.pw===cur);
    if(!ok){showToast('현재 비밀번호가 일치하지 않아요');return;}
    if(n1.length<6){showToast('새 비밀번호는 6자 이상이어야 해요');return;}
    if(n1!==n2){showToast('새 비밀번호가 서로 달라요');return;}
    me.pwh=await hashPw(G.id,n1);delete me.pw;delete me.mustChangePw;me.pwv=Number(me.pwv||0)+1;
    try{localStorage.setItem('hd-session-pwv',String(me.pwv));}catch(e){}
  }
  G.avatar=me.avatar;G.statusMsg=me.statusMsg;
  try{if(G.id===ADMIN.id){ADMIN.avatar=me.avatar;ADMIN.statusMsg=me.statusMsg;}}catch(e){}
  try{if(window.FB&&FB.enabled()&&FB.save)FB.save('members',me.id,me);}catch(e){}
  try{if(window.flushSync)window.flushSync();}catch(e){}
  try{setMyProfile();}catch(e){}
  try{renderMembersList();}catch(e){}
  _peAvatar=null;
  closeModal('profile-edit-modal');
  showToast('저장되었어요')
}

function adminRec(){return pendingList.find(function(x){return x.id===ADMIN.id;})||null;}
function ensureAdminMember(){
  /* jonghwa 를 '진짜 회원'으로 승격 — 최초 1회만. 이후엔 탈퇴·이양 자유 */
  try{
    if(adminRec())return;
    /* 단, 지금 관리자 계정으로 로그인 중인데 문서가 없다면 복구한다.
       (문서가 없으면 직책이 매번 기본값으로 되돌아감) */
    var _loggedInAsAdmin=(typeof G!=='undefined'&&G&&G.id===ADMIN.id);
    if(appConfig.adminSeeded&&!_loggedInAsAdmin)return;
    pendingList.push({
      id:ADMIN.id,pwh:ADMIN.pwh,name:ADMIN.name,baptism:ADMIN.baptism,phone:'',
      role:'teacher',teacherType:(typeof G!=='undefined'&&G.id===ADMIN.id&&G.type)||(appConfig.adminPos&&appConfig.adminPos.t)||ADMIN.teacherType||ADMIN.type||'etc',
      gradeLabel:(typeof G!=='undefined'&&G.id===ADMIN.id&&G.grade)||(appConfig.adminPos&&appConfig.adminPos.l)||ADMIN.gradeLabel||'기타',
      approved:true,isAdmin:true,hidden:false,dept:[],
      fcm:(appConfig.adminFcm||[]).slice(0,5),
      joinedAt:new Date().toISOString().slice(0,10)
    });
    appConfig.adminSeeded=true;
    try{if(window.flushCfg)window.flushCfg();}catch(e){}
    console.log('[ADMIN] 관리자 계정을 정식 회원으로 등록했어요');
  }catch(e){console.warn('[ADMIN]',e);}
}
function _myTeacherRec(){return pendingList.find(function(x){return x.id===G.id;})||(G.id===ADMIN.id&&!adminRec()?ADMIN:null);}
/* 회원 문서가 갱신되면 로그인 중인 세션 정보(담당 학년·직책 등)를 그 값으로 다시 맞춘다.
   관리자 계정이 '기타 ↔ 중2' 로 왔다갔다 하던 문제 해결 */
function syncSessionFromRec(){
  try{
    if(!(G&&G.id))return;
    const r=pendingList.find(x=>x.id===G.id);
    if(!r){
      /* 내 계정이 회원 목록에서 사라짐 = 삭제됨 → 강제 로그아웃 (관리자 계정은 예외) */
      if(window._membersLoaded && !previewMode && G.id && G.id!==ADMIN.id){
        _forceKickedLogout('계정이 삭제되었어요. 관리자에게 문의해주세요.');
        return;
      }
      /* 관리자 계정에 회원 문서가 아직 없을 때 — 저장해둔 직책으로 맞춘다.
         이게 없으면 하드코딩된 '기타'가 계속 다시 나타난다. */
      if(G.id===ADMIN.id&&typeof appConfig!=='undefined'&&appConfig.adminPos&&appConfig.adminPos.t){
        const t=appConfig.adminPos.t, l=appConfig.adminPos.l||t;
        if(G.type!==t||G.grade!==l){
          G.type=t;G.grade=l;ADMIN.type=t;ADMIN.teacherType=t;ADMIN.gradeLabel=l;
          try{setMyProfile();}catch(e){}
        }
      }
      return;
    }
    if(r.hidden && !previewMode && G.id && G.id!==ADMIN.id){
      _forceKickedLogout('비활동(숨김) 처리된 계정이에요. 관리자에게 문의해주세요.');
      return;
    }
    let changed=false;
    const set=(k,v)=>{ if(v!==undefined && G[k]!==v){G[k]=v;changed=true;} };
    /* 관리자 계정은 설정(adminPos)과 회원 문서 두 곳에 직책이 남는다.
       한쪽만 저장된 경우 서로 맞춰서 '기타'로 되돌아가는 것을 막는다. */
    if(r.id===ADMIN.id&&typeof appConfig!=='undefined'&&appConfig.adminPos&&appConfig.adminPos.t){
      var ap=appConfig.adminPos;
      if((r.teacherType||'')!==ap.t){
        r.teacherType=ap.t; r.gradeLabel=ap.l||ap.t;
        try{saveMemberNow(r);}catch(e){}
        console.log('[SESSION] 관리자 직책 복구:',ap.t);
      }
    }
    set('role',r.role); set('name',r.name); set('baptism',r.baptism);
    set('type',r.teacherType||''); set('gradeKey',r.gradeKey||''); set('grade',r.gradeLabel||'');
    set('isAdmin',!!r.isAdmin); set('graduated',!!r.graduated);
    set('isJabumo',!!r.isJabumo); set('isJabumoPresident',!!r.isJabumoPresident);
    if(G.id===ADMIN.id){            /* 오래된 하드코딩 값이 다시 튀어나오지 않게 상수도 맞춰둔다 */
      ADMIN.teacherType=r.teacherType; ADMIN.type=r.teacherType; ADMIN.gradeLabel=r.gradeLabel;
      if(typeof appConfig!=='undefined')appConfig.adminPos={t:r.teacherType,l:r.gradeLabel};
    }
    if(changed){
      try{setMyProfile();}catch(e){}
      try{paintTeacherHome();}catch(e){}
      try{renderHomeHeader&&renderHomeHeader();}catch(e){}
      try{updateNotifDot();}catch(e){}
    }
  }catch(e){console.warn('[SESSION]',e);}
}
function _posHolder(pos,exceptId){return pendingList.find(function(x){return x.role==='teacher'&&x.approved&&!x.hidden&&x.teacherType===pos&&x.id!==exceptId;});}
function _applyMyRec(u){if(!adminRec()&&(u===ADMIN||u.id===ADMIN.id)){ADMIN.teacherType=u.teacherType;ADMIN.type=u.teacherType;ADMIN.gradeLabel=u.gradeLabel;if(typeof appConfig!=='undefined')appConfig.adminPos={t:u.teacherType,l:u.gradeLabel};}if(G.id===u.id){G.type=u.teacherType||'';G.grade=u.gradeLabel||'';const POS={m1:'중1 담당',m2:'중2 담당',m3:'중3 담당',h:'고등 담당',principal:'교감',admin:'교무',etc:'기타'};const isFull=G.type==='principal'||G.type==='admin'||G.isAdmin;const rb=document.getElementById('role-badge');if(rb)rb.textContent=POS[G.type]||G.grade||'교사';const thn=document.getElementById('teacher-home-name');if(thn)thn.textContent=G.displayName+(G.grade?' T('+G.grade+')':' T')+' ✝️';const thd=document.getElementById('teacher-home-desc');if(thd)thd.textContent=isFull?(G.grade?G.grade+' 담당 · 전체 관리 권한이 있어요.':'전체 학년을 총괄합니다. 관리 탭에서 확인하세요.'):G.grade+' 담당 선생님, 오늘도 좋은 교리를 전해주세요 🙏';show('cal-add-btn',true);try{filterBoardTeacher();}catch(e){}}try{setMyProfile();}catch(e){}try{renderAdminGrid(G.type==='principal'||G.type==='admin'||G.isAdmin);}catch(e){}try{renderGovSection();}catch(e){}try{updatePendingUI();}catch(e){}try{_renderPosStatus();}catch(e){}}
var POS_LBL={m1:'중1',m2:'중2',m3:'중3',h:'고등',principal:'교감',admin:'교무',etc:'기타'};
function _renderPosStatus(msg){var u=_myTeacherRec();var el=document.getElementById('tp-status');if(!el)return;if(msg){el.style.display='block';el.innerHTML='<div style="background:var(--mint-light);color:#2D9E8F;border-radius:10px;padding:11px 12px;font-size:12.5px;font-weight:700;margin-bottom:12px">✅ '+msg+'</div>';return;}var cur=(u&&u.teacherType)||G.type||'';var curHtml=cur?'<div style="background:var(--bg);border-radius:10px;padding:10px 12px;font-size:12px;margin-bottom:12px">지금 담당 · <b>'+(POS_LBL[cur]||cur)+'</b></div>':'';if(u&&u.posRequest){var lbl=POS_LBL[u.posRequest]||u.posRequest;el.style.display='block';el.innerHTML='<div style="background:var(--yellow-light);border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.6;margin-bottom:12px">⏳ <b>'+lbl+'</b> 요청 대기 중 · 현재 담당자 승인을 기다리고 있어요<br><button onclick="cancelMyPosReq()" style="margin-top:4px;background:none;border:none;color:var(--coral);font-weight:700;cursor:pointer;font-family:inherit;text-decoration:underline;padding:0">요청 취소</button></div>';}else{el.style.display=curHtml?'block':'none';el.innerHTML=curHtml;}}
function openMyPositionModal(){
  if(G.role!=='teacher')return;
  var u=_myTeacherRec();
  var sel=document.getElementById('tp-position');
  if(sel)sel.value=(u&&u.teacherType)||G.type||'etc';
  _renderPosStatus();
  try{renderPosDiag();}catch(e){}
  openModal('teacher-position-modal');
}
/* 저장 위치 진단 — 관리자에게만 보임 */
function renderPosDiag(){
  var el=document.getElementById('tp-diag');if(!el)return;
  if(!(G.isAdmin||G.type==='principal')){el.style.display='none';return;}
  var rec=pendingList.find(function(x){return x.id===G.id;});
  var ap=(appConfig&&appConfig.adminPos)||null;
  el.style.display='block';
  el.innerHTML='<b>저장 상태</b><br>'
    +'· 화면 값(G.type): <b>'+(G.type||'(없음)')+'</b> / grade: '+(G.grade||'(없음)')+'<br>'
    +'· 회원 문서: '+(rec?('있음 · teacherType=<b>'+(rec.teacherType||'(없음)')+'</b> · gradeLabel='+(rec.gradeLabel||'(없음)')):'<b>없음</b>')+'<br>'
    +'· 설정 저장값(adminPos): '+(ap?('t=<b>'+(ap.t||'(없음)')+'</b> · l='+(ap.l||'(없음)')):'<b>없음</b>')+'<br>'
    +'· 클라우드 연결: '+((window.FB&&FB.enabled&&FB.enabled())?'연결됨':'끊김')
    +' · 설정 로드: '+(window._cfgLoaded?'완료':'대기')
    +' · 회원 로드: '+(window._membersLoaded?'완료':'대기');
}
function saveMyPosition(){var u=_myTeacherRec();if(!u){showToast('계정 정보를 찾을 수 없어요');return;}var pos=document.getElementById('tp-position').value;if(pos===u.teacherType&&!u.posRequest){try{_renderPosStatus('이미 '+(POS_LBL[pos]||pos)+' 담당이에요');setTimeout(function(){try{_renderPosStatus();}catch(e){}},1600);}catch(e){}showToast('이미 '+(POS_LBL[pos]||pos)+' 담당이에요');return;}if(pos==='principal'||pos==='admin'){var holder=_posHolder(pos,u.id);if(holder){u.posRequest=pos;_applyMyRec(u);notifications.unshift({pushed:false,id:'nt'+Date.now()+'prq',text:'🙋 '+u.name+' '+u.baptism+' 선생님이 <b>'+POS_LBL[pos]+'</b> 직책을 요청했어요. 관리 › 가입 승인에서 수락할 수 있어요.',time:'방금',ts:Date.now(),readBy:[],forTeacherId:holder.id,tap:{type:'pending'}});updateNotifDot();showToast('📨 '+POS_LBL[pos]+' 요청을 보냈어요 · '+holder.name+' 선생님 승인 후 적용돼요');closeModal('teacher-position-modal');return;}}if(u.posRequest)delete u.posRequest;u.teacherType=pos;u.gradeLabel=POS_LBL[pos]||pos;_applyMyRec(u);try{if(G.id===ADMIN.id){appConfig.adminPos={t:pos,l:POS_LBL[pos]||pos};ADMIN.teacherType=pos;ADMIN.type=pos;ADMIN.gradeLabel=POS_LBL[pos]||pos;}}catch(e){}try{if(typeof saveMemberNow==='function'&&pendingList.indexOf(u)>=0)saveMemberNow(u);}catch(e){}try{if(typeof flushSync==='function')flushSync();}catch(e){}try{if(window.flushCfg)window.flushCfg();}catch(e){}try{setMyProfile();}catch(e){}try{renderMembersList();}catch(e){}try{_renderPosStatus((POS_LBL[pos]||pos)+'(으)로 저장되었어요');}catch(e){}try{renderPosDiag();}catch(e){}showToast('담당이 '+(POS_LBL[pos]||pos)+'(으)로 변경됐어요');setTimeout(function(){closeModal('teacher-position-modal');try{_renderPosStatus();}catch(e){}},1100);}
function cancelMyPosReq(){var u=_myTeacherRec();if(u&&u.posRequest){delete u.posRequest;_applyMyRec(u);showToast('요청을 취소했어요');}}
function _canApprovePos(pos){return G.type===pos||G.isAdmin;}
function approvePosReq(reqId){var req=pendingList.find(function(x){return x.id===reqId;});if(!req||!req.posRequest)return;var pos=req.posRequest;var lbl=POS_LBL[pos]||pos;if(!_canApprovePos(pos)){showToast('현재 '+lbl+' 또는 관리자만 승인할 수 있어요');return;}pendingList.forEach(function(x){if(x.role==='teacher'&&x.approved&&x.teacherType===pos&&x.id!==req.id){x.teacherType='etc';x.gradeLabel='기타';if(G.id===x.id){G.type='etc';G.grade='기타';}}});req.teacherType=pos;req.gradeLabel=lbl;delete req.posRequest;if(G.id===req.id){G.type=pos;G.grade=lbl;}notifications.unshift({pushed:false,id:'nt'+Date.now()+'pa',text:'✅ <b>'+lbl+'</b> 직책 요청이 수락되었어요! 이제 '+req.name+' 선생님이 '+lbl+'이에요.',time:'방금',ts:Date.now(),readBy:[],forTeacherId:req.id,tap:{type:'my'}});updateNotifDot();updatePendingUI();try{renderAdminGrid(G.type==='principal'||G.type==='admin'||G.isAdmin);}catch(e){}try{renderGovSection();}catch(e){}try{setMyProfile();}catch(e){}showToast('✅ '+req.name+' 선생님을 '+lbl+'으로 지정했어요');}
function rejectPosReq(reqId){var req=pendingList.find(function(x){return x.id===reqId;});if(!req||!req.posRequest)return;var lbl=POS_LBL[req.posRequest]||req.posRequest;if(!_canApprovePos(req.posRequest)){showToast('현재 '+lbl+' 또는 관리자만 처리할 수 있어요');return;}delete req.posRequest;notifications.unshift({pushed:false,id:'nt'+Date.now()+'prj',text:'❌ '+lbl+' 직책 요청이 거절되었어요.',time:'방금',ts:Date.now(),readBy:[],forTeacherId:req.id,tap:{type:'my'}});updateNotifDot();updatePendingUI();showToast('요청을 거절했어요');}

function renderAdminGrid(isFull){const el=document.getElementById('admin-grid');if(!el)return;isFull=(G.type==='principal'||G.type==='admin'||G.isAdmin);const isAdminUser=G.type==='principal'||G.isAdmin;const canApprove=G.type==='principal'||G.type==='admin'||G.isAdmin;show('admin-settings-tabbtn',isAdminUser);const students=pendingList.filter(u=>u.approved&&u.role==='student'&&!u.hidden&&!u.graduated&&(isFull||u.gradeKey===G.type));const absentCount=students.filter(u=>computeAbsentStreak(u)>=3).length;const items=[
    {icon:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/></svg>',title:'회원 관리',sub:'승인·역할·권한',badge:pendingList.filter(u=>!u.approved).length+pendingList.filter(u=>u.posRequest&&_canApprovePos(u.posRequest)).length,action:"showAdminTab('members')"},
    {icon:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z"/><path d="M13 7v10"/></svg>',title:'쿠폰 관리',sub:'인증번호·사용 현황',badge:coupons.filter(c=>!c.used).length,action:"showAdminTab('coupons')"},
    {icon:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',title:'출석 관리',sub:'오늘 출석 체크',action:"showAdminTab('attend')"},
    {icon:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',title:'출석 통계',sub:absentCount?('연속 결석 '+absentCount+'명'):'학년별 출석 현황',badge:absentCount,action:"showAdminTab('stats')"},
    {icon:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',title:'신앙 다이어리',sub:'공유된 다이어리·답장',action:"showAdminTab('diary')"},
    {icon:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h3M15 12h3M7 15.5c.4-1.1 1.5-1.8 2.9-1.8s2.5.7 2.9 1.8"/></svg>',title:'학생 카드',sub:'학생 상세 정보',action:"showAdminTab('students')"},
    ...((G.type==='principal'||G.isAdmin)?[{icon:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',title:'졸업 편지',sub:'고3에게 마음 전하기',action:"openGradLetters()"}]:[])
  ];
  if(isAdminUser)items.push({icon:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',title:'앱 설정',sub:'제목·컬러·말씀 수정',action:"showAdminTab('settings')"});const _AC={'회원 관리':'#5B8DEF','쿠폰 관리':'#E5806B','출석 관리':'#37B39B','출석 통계':'#7C6FF0','신앙 다이어리':'#EBA23B','학생 카드':'#5BB0A0','졸업 편지':'#E8709A','앱 설정':'#8A94A6'};el.innerHTML=items.map(it=>`<div class="admin-card" onclick="${it.action}"><div class="admin-card-icon" style="color:${_AC[it.title]||'var(--text)'}">${it.icon}</div><div class="admin-card-title">${it.title}</div><div class="admin-card-sub">${it.sub}</div>${it.badge?`<div class="admin-badge" style="background:var(--coral-light);color:var(--coral)">${it.badge}건</div>`:''}</div>`).join('');}
function toggleAttendCheck(){var w=document.getElementById('attend-check-wrap');if(!w)return;var open=w.style.display==='none';w.style.display=open?'':'none';var b=document.getElementById('attend-check-toggle');if(b)b.textContent=open?'🔼 출석 체크 닫기':'✅ 이번 주 출석 체크하기';if(open){try{renderAttendList();}catch(e){}}}
function showAdminTab(tab){try{if(tab==='main')renderAdminGrid(G.type==='principal'||G.type==='admin'||G.isAdmin);}catch(e){}['main','attend','members','students','diary','coupons','stats','settings'].forEach(t=>{const el=document.getElementById('admin-'+t+'-tab');if(el)el.style.display=t===tab?'':'none';});const bb=document.getElementById('admin-back-btn');if(bb)bb.style.display=tab==='main'?'none':'flex';const bar=document.querySelector('#screen-admin .tab-bar');if(bar)bar.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.getAttribute('onclick').includes(`showAdminTab('${tab}')`)));if(tab==='pending')updatePendingUI();if(tab==='attend')renderAttendList();if(tab==='members')renderMembersList();if(tab==='students')renderStudentCards('all');if(tab==='diary')renderAdminDiaryList();if(tab==='main')renderGovSection();if(tab==='settings')renderSeasonBtns();if(tab==='reminder')renderReminderList();if(tab==='coupons')renderAdminCouponList();if(tab==='settings')loadAppConfigForm();if(tab==='stats'){renderAttendStats();renderAbsentAlerts();}window.scrollTo(0,0);}
function renderAdminCouponList(){dedupeBdayCoupons();const el=document.getElementById('admin-coupon-list');if(!el)return;if(!coupons.length){el.innerHTML='<div class="empty" style="padding:28px"><div class="empty-emoji" style="font-size:28px">🎟️</div><div class="empty-title" style="font-size:13px">발급된 쿠폰이 없어요</div><div class="empty-desc">학생이 출석 등급을 달성하면 쿠폰이 생겨요</div></div>';return;}el.innerHTML=coupons.slice().reverse().map(c=>{const card=`<div class="card" style="margin-bottom:0"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:13px;font-weight:700">${c.studentName} <span style="font-size:11px;color:var(--text-light);font-weight:500">· ${c.badgeLabel} · 🎁 ${c.reward||'보상'}</span></div><span class="chip ${c.used?'chip-gray':'chip-coral'}">${c.used?'사용완료':'미사용'}</span></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><div style="font-size:11px;color:var(--text-light)">발급 ${c.createdAt}${c.manual&&c.issuedBy?' · '+c.issuedBy:''}${c.used&&c.usedAt?' · 사용 '+c.usedAt:''}</div><div style="font-size:15px;font-weight:800;letter-spacing:2px;color:var(--primary-dark)">${c.used?'· · · · · ·':c.code}</div></div>${c.used?'<div style="font-size:10px;color:var(--text-light);margin-top:6px">← 밀어서 삭제</div>':''}</div>`;
      /* 사용완료 쿠폰만 삭제 가능 — 미사용 쿠폰은 탈퇴 시에만 정리된다 */
      if(!c.used)return `<div style="margin-bottom:8px">${card}</div>`;
      return `<div style="position:relative;overflow:hidden;border-radius:var(--radius);margin-bottom:8px"><button onclick="deleteCoupon('${c.id}')" style="position:absolute;top:0;right:0;bottom:0;width:84px;border:none;background:var(--coral);color:white;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit">🗑 삭제</button><div class="coupon-swipe" data-cid="${c.id}" style="position:relative;transition:transform .2s;touch-action:pan-y;background:var(--card,white)">${card}</div></div>`;}).join('');initCouponSwipe(el);}
function initCouponSwipe(el){el.querySelectorAll('.coupon-swipe').forEach(item=>{let sx=0,cur=0,open=false,dragging=false;
item.addEventListener('pointerdown',e=>{sx=e.clientX;dragging=true;item.style.transition='none';item.setPointerCapture(e.pointerId);});
item.addEventListener('pointermove',e=>{if(!dragging)return;cur=Math.min(0,Math.max(-84,(open?-84:0)+(e.clientX-sx)));item.style.transform='translateX('+cur+'px)';});
const end=()=>{if(!dragging)return;dragging=false;item.style.transition='transform .2s';open=cur<-42;item.style.transform='translateX('+(open?-84:0)+'px)';};
item.addEventListener('pointerup',end);item.addEventListener('pointercancel',end);});}
function openCouponIssueModal(){if(G.role!=='teacher'){showToast('교사만 쿠폰을 발급할 수 있어요');return;}const sel=document.getElementById('ci-student');const students=pendingList.filter(u=>u.approved&&u.role==='student'&&!u.hidden&&!u.graduated).sort((a,b)=>a.name.localeCompare(b.name));if(!students.length){showToast('발급할 수 있는 학생이 없어요');return;}sel.innerHTML='<option value="">학생을 선택하세요</option>'+students.map(u=>`<option value="${u.id}">${u.name} ${u.baptism} (${u.gradeLabel||''})</option>`).join('');document.getElementById('ci-title').value='';document.getElementById('ci-reward').value='';openModal('coupon-issue-modal');}
function submitManualCoupon(){const sid=document.getElementById('ci-student').value;if(!sid){showToast('학생을 선택해주세요');return;}const title=(document.getElementById('ci-title').value||'').trim();if(!title){showToast('쿠폰 제목을 입력해주세요');return;}const reward=(document.getElementById('ci-reward').value||'').trim();if(!reward){showToast('상품을 입력해주세요');return;}const u=pendingList.find(x=>x.id===sid);if(!u)return;const now=new Date();const code=String(Math.floor(100000+Math.random()*900000));coupons.push({id:'cp'+Date.now()+Math.random().toString(36).slice(2,4),studentId:u.id,studentName:u.name+' '+u.baptism,badgeLabel:title,reward,code,used:false,createdAt:now.toLocaleDateString('ko-KR'),manual:true,issuedBy:G.displayName});notifications.unshift({pushed:false,id:'nt'+Date.now()+'ms',text:`🎉 선생님이 <b>[${title}]</b> 쿠폰을 보냈어요! 🎁 <b>${reward}</b> · 선생님께 확인받고 사용하세요!`,time:'방금',ts:Date.now(),readBy:[],forStudentId:u.id,tap:{type:'coupon'}});updateNotifDot();closeModal('coupon-issue-modal');renderAdminCouponList();renderAdminGrid(G.type==='principal'||G.type==='admin'||G.isAdmin);showToast('🎟️ '+u.name+' 학생에게 ['+title+'] 쿠폰을 발급했어요!');}
function deleteCoupon(cid){
  const c=coupons.find(x=>x.id===cid);
  if(!c)return;
  if(!c.used){showToast('아직 사용하지 않은 쿠폰은 삭제할 수 없어요');return;}
  if(!confirm(c.studentName+' 학생의 사용완료 쿠폰을 삭제할까요?'))return;
  coupons=coupons.filter(x=>x.id!==cid);
  try{if(window.FB&&FB.enabled()&&FB.remove)FB.remove('coupons',cid);}catch(e){}
  try{if(window.flushSync)window.flushSync();}catch(e){}
  renderAdminCouponList();renderAdminGrid(G.type==='principal'||G.type==='admin'||G.isAdmin);
  showToast('쿠폰이 삭제되었습니다');
}
function updatePendingUI(){const pending=pendingList.filter(u=>!u.approved);const posReqs=pendingList.filter(function(u){return u.posRequest&&(u.posRequest==='principal'||u.posRequest==='admin')&&_canApprovePos(u.posRequest);});const canApprove=G.type==='principal'||G.type==='admin'||G.isAdmin;const bar=document.getElementById('pending-notice-bar');const txt=document.getElementById('pending-notice-text');if(bar)bar.style.display=(pending.length&&canApprove)?'':'none';if(txt)txt.textContent=`가입 승인 대기 중인 신청이 ${pending.length}건 있어요`;const _pw=document.getElementById('pending-wrap');if(_pw)_pw.style.display=(canApprove&&(pending.length||posReqs.length))?'':'none';const el=document.getElementById('pending-list');if(!el)return;var posHtml=posReqs.map(function(u){var lbl=POS_LBL[u.posRequest]||u.posRequest;var h=_posHolder(u.posRequest,u.id);return '<div class="pending-card"><div class="pending-head"><span class="pending-name">'+u.name+' '+u.baptism+'</span><span class="chip chip-lavender">'+lbl+' 요청</span></div><div class="pending-info">현재 '+lbl+': '+(h?h.name+' 선생님':'없음')+' → '+u.name+' 선생님으로 이전</div><div class="pending-actions"><button class="btn-approve" onclick="approvePosReq(\''+u.id+'\')">✅ 수락</button><button class="btn-reject" onclick="rejectPosReq(\''+u.id+'\')">❌ 거절</button></div></div>';}).join('');if(!pending.length&&!posReqs.length){el.innerHTML='<div class="empty"><div class="empty-emoji">✅</div><div class="empty-title">대기 중인 신청이 없어요</div></div>';return;}el.innerHTML=posHtml+pending.map(u=>`<div class="pending-card"><div class="pending-head"><span class="pending-name">${u.name} ${u.baptism}</span><span class="chip chip-${u.role==='student'?'blue':u.role==='parent'?'mint':'lavender'}">${u.role==='student'?'학생':u.role==='parent'?'학부모':'교사'}</span></div><div class="pending-info">아이디: ${u.id} · ${u.gradeLabel||''}</div><div class="pending-actions"><button class="btn-approve" onclick="approve(${pendingList.indexOf(u)})">✅ 승인</button><button class="btn-reject" onclick="reject(${pendingList.indexOf(u)})">❌ 거절</button></div></div>`).join('');}
function mergeStudentRecords(fromId,toId){const from=pendingList.find(u=>u.id===fromId),to=pendingList.find(u=>u.id===toId);if(!from||!to)return false;const uq=a=>Array.from(new Set(a));to.attendedWeeks=uq([...(to.attendedWeeks||[]),...(from.attendedWeeks||[])]).sort();to.halfWeeks=uq([...(to.halfWeeks||[]),...(from.halfWeeks||[])]).sort();to.earnedLevels=uq([...(to.earnedLevels||[]),...(from.earnedLevels||[])]);to.qrScanAt=Object.assign({},from.qrScanAt||{},to.qrScanAt||{});if(from.history&&from.history.length)to.history=[...(from.history||[]),...(to.history||[])];if(!to.birthMonth&&from.birthMonth){to.birthMonth=from.birthMonth;to.birthDay=from.birthDay;}if(!to.memo&&from.memo)to.memo=from.memo;to.attendTotal=calcAttendTotal(to);if(typeof computeStreak==='function')to.streak=computeStreak(to);coupons.forEach(c=>{if(c.studentId===fromId){c.studentId=toId;c.studentName=to.name+' '+to.baptism;}});const i=pendingList.indexOf(from);if(i>=0)pendingList.splice(i,1);if(typeof renderAdminCouponList==='function')renderAdminCouponList();if(typeof renderAttendList==='function')renderAttendList();if(typeof renderStudentCards==='function')renderStudentCards('all');if(typeof renderMembersList==='function')renderMembersList();return true;}
function mergeManualPrompt(fromId){const from=pendingList.find(x=>x.id===fromId);if(!from)return;const cands=pendingList.filter(x=>x.approved&&x.role==='student'&&!x.manualReg&&!x.hidden&&x.id!==fromId&&x.name===from.name&&(!from.baptism||!x.baptism||x.baptism===from.baptism));if(!cands.length){showToast('이관할 가입 계정(동명)이 없어요. 학생이 먼저 회원가입해야 해요');return;}if(cands.length>1){showToast('⚠️ 동명 가입 계정이 여러 개예요. 세례명으로 구분 후 이용해주세요');return;}const to=cands[0];if(confirm('📦 '+from.name+' '+from.baptism+' (수동등록) 기록을\n가입 계정 ['+to.name+' '+to.baptism+' · '+(to.gradeLabel||'')+']으로 이관할까요?\n\n(수동 항목은 삭제됩니다)')){mergeStudentRecords(fromId,to.id);showToast('📦 기록을 가입 계정으로 이관했어요');}}
function openParentLink(idx){_plinkIdx=idx;var u=pendingList[idx];if(!u)return;var kids=u.children||[];var students=pendingList.filter(function(s){return s.approved&&s.role==='student'&&!s.hidden&&!s.graduated;});var opt=function(sel){return '<option value="">— 연결 안 함 —</option>'+students.map(function(s){return '<option value="'+s.id+'"'+(s.id===sel?' selected':'')+'>'+s.name+' '+s.baptism+' ('+(s.gradeLabel||'')+')</option>';}).join('');};var body=kids.map(function(c,i){var nm=(c.name||'')+(c.baptism?' '+c.baptism:'');var m=students.find(function(s){return s.name===(c.name||'')&&(!c.baptism||s.baptism===c.baptism);});var pre=c.sid||(m?m.id:'');return '<div style="margin-bottom:14px"><div style="font-size:12.5px;font-weight:700;margin-bottom:6px">입력한 자녀: <span style="color:var(--primary-dark)">'+nm+'</span></div><select class="form-input" id="plink-sel-'+i+'">'+opt(pre)+'</select></div>';}).join('');document.getElementById('plink-title').textContent=u.name+' '+u.baptism+' 학부모 · 자녀 연결';document.getElementById('plink-body').innerHTML=body||'<div style="font-size:12px;color:var(--text-light)">등록된 자녀 정보가 없어요</div>';openModal('parent-link-modal');}
function confirmParentLink(){var u=pendingList[_plinkIdx];if(!u)return;(u.children||[]).forEach(function(c,i){var sel=document.getElementById('plink-sel-'+i);c.sid=sel?sel.value:'';});u.approved=true;try{if(typeof flushSync==='function')flushSync();}catch(e){}closeModal('parent-link-modal');updatePendingUI();try{renderAdminGrid(G.type==='principal'||G.type==='admin'||G.isAdmin);}catch(e){}try{renderMembersList();}catch(e){}showToast('학부모 승인 및 자녀 연결 완료!');}
function approve(idx){if(!(G.type==='principal'||G.type==='admin'||G.isAdmin)){showToast('가입 승인은 교감·교무·관리자만 할 수 있어요');return;}const u=pendingList[idx];if(u.role==='parent'){openParentLink(idx);return;}if(u.role==='teacher'&&(u.teacherType==='principal'||u.teacherType==='admin')){const holder=pendingList.find(x=>x!==u&&x.role==='teacher'&&x.approved&&!x.hidden&&x.teacherType===u.teacherType);if(holder){const lbl=u.teacherType==='principal'?'교감':'교무';u.teacherType='etc';u.gradeLabel='기타';showToast('⚠️ '+lbl+'은 이미 '+holder.name+' 선생님이 맡고 있어 "기타"로 승인됐어요. 회원관리에서 조정 가능해요');}}u.approved=true;if(u.role==='student'){const mc=pendingList.filter(x=>x!==u&&x.manualReg&&x.role==='student'&&!x.hidden&&!x.graduated&&x.name===u.name&&(!u.baptism||!x.baptism||x.baptism===u.baptism));if(mc.length>=1){notifications.unshift({pushed:false,id:'nt'+Date.now()+'mg',text:'📦 <b>'+u.name+' '+u.baptism+'</b> 학생이 승인됐어요. 동명 수동등록 기록'+(mc.length>1?'('+mc.length+'건)':'')+'이 있어요 — [회원관리]에서 <b>📦 이관</b>으로 넘길 수 있어요.',time:'방금',ts:Date.now(),readBy:[],forTeacher:true,tap:{type:'members'}});updateNotifDot();}}updatePendingUI();renderAdminGrid(G.type==='principal'||G.type==='admin'||G.isAdmin);showToast('승인 완료!');}
function reject(idx){if(!(G.type==='principal'||G.type==='admin'||G.isAdmin)){showToast('가입 승인은 교감·교무·관리자만 할 수 있어요');return;}pendingList.splice(idx,1);updatePendingUI();showToast('거절 완료');}
function computeAbsentStreak(u){const today=toDateStr(new Date());const weeks=getSaturdays(60).filter(d=>d<=today&&!isVacationDate(d));const jn=u.joinedAt||null;let streak=0;for(const w of weeks){if(jn&&w<jn)break;if(!(u.attendedWeeks||[]).includes(w))streak++;else break;}return streak;}
let absentNotifiedKeys={};
function checkAbsentNotifications(){updateNotifDot();}
/* ══════════ FCM 푸시 알림 ══════════ */
/* ⚠️ Firebase 콘솔 > 프로젝트 설정 > 클라우드 메시징 > 웹 푸시 인증서 에서 발급받은 공개키를 넣으세요 */
const VAPID_KEY='BMaDgfzPUdsADq2ZrStHAwKGjEaZO9R8WvHclVB85U31rCb3eSMo54yIFNM0C5MUbJqUxp72UM5OIghV2mg_6zE';
let _msg=null;
function pushSupported(){return ('Notification' in window) && ('serviceWorker' in navigator) && typeof firebase!=='undefined' && firebase.messaging && firebase.messaging.isSupported && firebase.messaging.isSupported();}
function _meRec(){ return pendingList.find(u=>u.id===G.id) || null; }
/* FCM 전용 스코프에 서비스워커 등록 — 기존 sw.js(PWA 오프라인)와 공존 */
const FCM_SCOPE='firebase-cloud-messaging-push-scope';
async function fcmReg(){
  try{
    const regs=await navigator.serviceWorker.getRegistrations();
    const hit=regs.find(r=>String(r.scope||'').indexOf(FCM_SCOPE)>=0);
    if(hit)return hit;
    const reg=await navigator.serviceWorker.register('firebase-messaging-sw.js',{scope:FCM_SCOPE});
    await navigator.serviceWorker.ready;
    return reg;
  }catch(e){console.error('[FCM-SW]',e);return null;}
}
async function testLocalNotif(){
  try{
    if(!('Notification' in window)){showToast('이 브라우저는 알림을 지원하지 않아요');return;}
    if(Notification.permission!=='granted'){
      const p=await Notification.requestPermission();
      if(p!=='granted'){showToast('알림 권한이 필요해요');return;}
    }
    const reg=await fcmReg();
    if(!reg){showToast('서비스워커 등록 실패');return;}
    await reg.showNotification('하늘의문 중고등부',{
      body:'테스트 알림이에요. 이게 보이면 알림 수신은 정상입니다 🙌',
      icon:'icon-192.png',badge:'icon-192.png',vibrate:[200,100,200],tag:'test'
    });
    showToast('🔔 테스트 알림을 보냈어요. 알림창을 확인해주세요');
  }catch(e){
    console.error('[TEST]',e);
    showToast('테스트 실패: '+(e&&e.message||e));
  }
  renderPushStatus();
}
async function renderPushDiag(){
  const el=document.getElementById('push-diag');if(!el)return;
  const lines=[];
  try{
    lines.push('권한: '+(('Notification' in window)?Notification.permission:'미지원'));
    lines.push('설치(PWA): '+(window.matchMedia('(display-mode: standalone)').matches?'예':'아니오 — 홈화면 추가 필요'));
    const regs=await navigator.serviceWorker.getRegistrations();
    lines.push('서비스워커: '+(regs.map(r=>String((r.active||r.installing||r.waiting||{}).scriptURL||'').split('/').pop()).filter(Boolean).join(', ')||'없음'));
    lines.push('FCM 워커: '+(regs.some(r=>String(r.scope||'').indexOf(FCM_SCOPE)>=0)?'✅ 등록됨':'❌ 없음'));
    const me=_meRec();
    const toks=(me&&me.fcm)||appConfig.adminFcm||[];
    lines.push('내 토큰: '+(toks.length?(toks.length+'개 · '+String(toks[0]).slice(0,18)+'…'):'없음 ⚠️'));
  }catch(e){lines.push('진단 오류: '+e);}
  el.innerHTML=lines.join('<br>');
}
function renderPushStatus(){
  try{renderPushDiag();}catch(e){}
  const st=document.getElementById('push-status'), btn=document.getElementById('push-enable-btn');
  if(!st||!btn)return;
  if(VAPID_KEY.indexOf('__')===0){st.textContent='⚙️ 관리자 설정 필요 (VAPID 키 미등록)';st.style.color='var(--text-light)';btn.style.display='none';return;}
  if(!pushSupported()){st.textContent='⚠️ 이 브라우저에서는 지원되지 않아요';st.style.color='var(--text-light)';btn.style.display='none';return;}
  const perm=Notification.permission;
  const me=_meRec();
  const has=!!(me&&(me.fcm||[]).length) || (G.id===ADMIN.id && !me && (appConfig.adminFcm||[]).length);
  if(perm==='denied'){st.textContent='🚫 브라우저에서 알림이 차단되어 있어요. 사이트 설정에서 허용해주세요';st.style.color='#B0463A';btn.style.display='none';return;}
  if(perm==='granted'&&has){st.textContent='✅ 이 기기에서 푸시 알림을 받고 있어요';st.style.color='var(--primary)';btn.textContent='다시 등록하기';btn.style.display='';return;}
  st.textContent='🔕 아직 꺼져 있어요';st.style.color='var(--text-light)';btn.textContent='푸시 알림 켜기';btn.style.display='';
}
async function enablePush(){
  try{
    if(VAPID_KEY.indexOf('__')===0){showToast('관리자가 푸시 키를 등록해야 해요');return;}
    if(!pushSupported()){showToast('이 브라우저에서는 지원되지 않아요');return;}
    const perm=await Notification.requestPermission();
    if(perm!=='granted'){showToast('알림 권한이 필요해요');renderPushStatus();return;}
    const reg=await fcmReg();
    if(!reg){showToast('알림 서비스워커 등록에 실패했어요');return;}
    _msg=_msg||firebase.messaging();
    const token=await _msg.getToken({vapidKey:VAPID_KEY,serviceWorkerRegistration:reg});
    if(!token){showToast('토큰 발급에 실패했어요');return;}
    if(G.id===ADMIN.id&&!_meRec()){
      const a=(appConfig.adminFcm||[]).filter(t=>t!==token); a.unshift(token); appConfig.adminFcm=a.slice(0,5);
      try{if(window.flushCfg)window.flushCfg();}catch(e){}
    }else{
      const me=_meRec(); if(!me){showToast('회원 정보를 찾을 수 없어요');return;}
      const a=(me.fcm||[]).filter(t=>t!==token); a.unshift(token); me.fcm=a.slice(0,5);
    }
    _bindForeground();
    showToast('📲 푸시 알림을 켰어요!');renderPushStatus();
  }catch(e){console.error('[PUSH]',e);showToast('푸시 등록 실패: '+(e&&e.code||''));renderPushStatus();}
}
function _bindForeground(){
  try{
    if(!pushSupported())return;
    _msg=_msg||firebase.messaging();
    _msg.onMessage(function(p){
      const n=(p&&p.notification)||{};
      if(G.notifMode!=='silent'){try{if(navigator.vibrate)navigator.vibrate(200);}catch(e){}}
      showToast((n.title||'알림')+(n.body?' · '+n.body:''));
      updateNotifDot();
    });
  }catch(e){}
}
function initPush(){
  if(!pushSupported()||VAPID_KEY.indexOf('__')===0)return;
  if(Notification.permission==='granted'){ enablePush().catch(function(){}); return; }
  if(Notification.permission==='denied')return;
  /* 아직 동의 안 함 → 최초 1회, 또는 '나중에' 후 3일 경과 시 다시 한 번 */
  try{
    var snooze=Number(localStorage.getItem('hd-push-snooze')||0);
    if(localStorage.getItem('hd-push-asked') && !(snooze && Date.now()>snooze)) return;
  }catch(e){}
  setTimeout(function(){ maybeAskPush(); }, 1500);
}
function maybeAskPush(){
  try{ localStorage.setItem('hd-push-asked','1'); localStorage.removeItem('hd-push-snooze'); }catch(e){}
  var m=document.getElementById('push-optin-modal');
  if(m){ openModal('push-optin-modal'); }
  else { enablePush().catch(function(){}); }
}
async function acceptPushOptin(){
  closeModal('push-optin-modal');
  _resetOptinText();
  try{ await enablePush(); }catch(e){}
}
function _resetOptinText(){var t=document.getElementById('push-optin-title'),d=document.getElementById('push-optin-desc');if(t)t.textContent='알림을 놓치지 마세요!';if(d)d.innerHTML='알림을 켜지 않으면 <b>쿠폰·공지·생일 축하</b>를<br>제때 받지 못해요. 앱을 닫아둬도 바로 알려드릴게요 🎁';}
function declinePushOptin(){ closeModal('push-optin-modal'); _resetOptinText(); try{localStorage.setItem('hd-push-snooze',String(Date.now()+3*86400000));}catch(e){} }
/* 안드로이드 크롬은 new Notification() 을 막는다 → 서비스워커로 띄워야 함 */
function pushLocalNotif(title,body){
  if(G.notifMode==='silent')return;
  if(G.notifMode==='vibrate'){try{if(navigator.vibrate)navigator.vibrate([200,100,200]);}catch(e){}}
  try{
    if(!('Notification' in window))return;
    var opts={body:body,tag:'hd-'+Date.now()};
    if(G.notifMode==='vibrate')opts.vibrate=[200,100,200];
    var direct=function(){ try{new Notification(title,opts);}catch(e){} };
    var show=function(){
      /* 안드로이드 크롬은 new Notification()을 막으므로 서비스워커로 띄운다.
         단 ready는 워커가 없으면 영원히 대기하므로 getRegistration + 타임아웃으로 감싼다. */
      try{
        if(!navigator.serviceWorker||!navigator.serviceWorker.getRegistration){ direct(); return; }
        var done=false;
        var fallback=setTimeout(function(){ if(!done){done=true;direct();} },1200);
        navigator.serviceWorker.getRegistration().then(function(reg){
          if(done)return;
          if(reg&&reg.showNotification){
            done=true;clearTimeout(fallback);
            reg.showNotification(title,opts).catch(function(){direct();});
          }else{
            done=true;clearTimeout(fallback);direct();
          }
        }).catch(function(){ if(!done){done=true;clearTimeout(fallback);direct();} });
      }catch(e){ direct(); }
    };
    if(Notification.permission==='granted')show();
    else if(Notification.permission==='default'){
      Notification.requestPermission().then(function(p){if(p==='granted')show();});
    }
  }catch(e){}
}
/* 예정 시각에 정확히 울리도록 개별 타이머를 건다 (폴링만으로는 화면이 꺼지면 늦어짐) */
var _remTimers={};
function scheduleReminderAlarms(){
  try{
    var now=Date.now();
    (reminderData||[]).forEach(function(r){
      if(!r||r.done||!r.date||!r.time)return;
      if(!r.shared&&r.ownerId&&r.ownerId!==G.id)return;
      var due=new Date(r.date+'T'+r.time).getTime();
      if(isNaN(due))return;
      var wait=due-now;
      if(wait<0||wait>6*3600000)return;          /* 6시간 안쪽만 예약 */
      if(_remTimers[r.id])return;
      _remTimers[r.id]=setTimeout(function(){
        delete _remTimers[r.id];
        try{checkReminderAlarms();}catch(e){}
      },wait+400);
    });
  }catch(e){}
}
function checkReminderAlarms(){
  try{
    if(!(G&&G.id))return;
    var now=Date.now(), changed=false;
    (reminderData||[]).forEach(function(r){
      if(!r||r.done||!r.date||!r.time)return;
      if(!r.shared&&r.ownerId&&r.ownerId!==G.id)return;
      var due=new Date(r.date+'T'+r.time).getTime();
      if(isNaN(due)||now<due||now-due>86400000)return;
      /* 이 기기에서 이미 울렸는지는 따로 기록 — 클라우드 플래그와 분리해야 알림을 놓치지 않음 */
      var lk='hd-remfire-'+r.id;
      var fired=false;
      try{fired=!!localStorage.getItem(lk);}catch(e){}
      if(!fired){
        try{localStorage.setItem(lk,'1');}catch(e){}
        /* 앱을 보고 있을 때만 토스트. 닫혀 있으면 워커가 푸시를 보냄 (중복 방지) */
        if(!document.hidden){ try{showToast('⏰ '+r.content);}catch(e){} }
      }
      /* 알림 문서 생성·푸시는 워커가 맡는다 (앱이 꺼져 있어도 정시에 가도록).
         앱은 화면을 보고 있을 때 안내만 한다. */
    });
    if(changed){try{if(typeof flushSync==='function')flushSync();}catch(e){}}
  }catch(e){}
}
setInterval(function(){try{checkReminderAlarms();}catch(e){}try{scheduleReminderAlarms();}catch(e){}},15000);
setTimeout(scheduleReminderAlarms,5000);
/* 화면이 꺼져 있으면 브라우저가 타이머를 늦춘다 → 앱으로 돌아오는 즉시 한 번 더 확인 */
document.addEventListener('visibilitychange',function(){
  if(!document.hidden){try{checkReminderAlarms();}catch(e){}try{checkThursdayNotice();}catch(e){}}
});
window.addEventListener('focus',function(){try{checkReminderAlarms();}catch(e){}});
setInterval(function(){try{checkThursdayNotice();}catch(e){}},60000);
setTimeout(function(){try{checkThursdayNotice();}catch(e){}},6000);setTimeout(checkReminderAlarms,4000);
function absentLevel(n){if(n>=10)return 4;if(n>=8)return 3;if(n>=5)return 2;if(n>=3)return 1;return 0;}
function renderAbsentAlerts(){try{checkAbsentNotifications();}catch(e){}const el=document.getElementById('absent-alert-list');if(!el)return;const isFull=G.type==='principal'||G.type==='admin'||G.isAdmin;const students=pendingList.filter(u=>u.approved&&u.role==='student'&&!u.hidden&&!u.graduated&&(isFull||u.gradeKey===G.type));const flagged=students.map(u=>({u,n:computeAbsentStreak(u)})).filter(x=>x.n>=3).sort((a,b)=>b.n-a.n);if(!flagged.length){el.innerHTML='<div class="empty" style="padding:24px"><div class="empty-emoji" style="font-size:26px">✅</div><div class="empty-title" style="font-size:13px">3주 연속 결석 학생이 없어요</div></div>';return;}const LV={1:{label:'3주 연속',color:'var(--yellow)',bg:'var(--yellow-light)'},2:{label:'5주 연속',color:'#D95F50',bg:'var(--coral-light)'},3:{label:'8주 연속',color:'#D95F50',bg:'var(--coral-light)'},4:{label:'10주 이상',color:'white',bg:'var(--coral)'}};el.innerHTML=flagged.map(({u,n})=>{const lv=absentLevel(n);const L=LV[lv];const contacted=(u.lastContactAt?`📞 마지막 연락: ${u.lastContactAt}${u.lastContactBy?' ('+u.lastContactBy+')':''}`:'아직 연락 기록 없음')+(u.phone?' · '+u.phone:' · 연락처 미등록');const sat=currentSaturday();const isAcked=u.absentAckWeek===sat;const ack=isAcked?`<div style="font-size:11px;color:var(--mint);margin-top:4px">✅ ${u.absentAckBy} 확인함</div>`:'';return `<div class="card" style="margin-bottom:8px;border-left:4px solid ${L.color}"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:13px;font-weight:700;cursor:pointer" onclick="openStudentDetail('${u.id}')">${u.name} ${u.baptism} <span style="font-size:10px;color:var(--text-light)">(${u.gradeLabel||''})</span></div><span class="chip" style="background:${L.bg};color:${lv>=4?'white':'#9A5A00'}">${L.label} (${n}주)</span></div><div style="font-size:11px;color:var(--text-light);margin-top:6px">${contacted}</div>${ack}<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-sm btn-outline" style="flex:1" onclick="markAbsentContact('${u.id}')">📞 연락하기</button><button class="btn btn-sm" style="flex:1;background:${isAcked?'var(--border)':'var(--mint)'};color:${isAcked?'var(--text-sub)':'white'}" onclick="toggleAbsentAck('${u.id}')">${isAcked?'↩️ 확인 취소':'✅ 확인'}</button></div></div>`;}).join('');}
let currentContactId=null;
function markAbsentContact(uid){const u=pendingList.find(u=>u.id===uid);if(!u)return;if(!u.phone){showToast('등록된 연락처가 없어요');return;}currentContactId=uid;const num=u.phone.replace(/[^0-9+]/g,'');document.getElementById('contact-avatar').textContent=u.name.charAt(0);document.getElementById('contact-name').textContent=u.name+' '+u.baptism;document.getElementById('contact-phone').textContent=u.phone;document.getElementById('contact-tel-link').href='tel:'+num;openModal('contact-confirm-modal');}
function logContact(){const u=pendingList.find(u=>u.id===currentContactId);if(!u)return;const now=new Date();u.lastContactAt=now.getFullYear()+'.'+(now.getMonth()+1).toString().padStart(2,'0')+'.'+now.getDate().toString().padStart(2,'0');u.lastContactBy=G.displayName;}
function toggleAbsentAck(uid){const u=pendingList.find(u=>u.id===uid);if(!u)return;const sat=currentSaturday();if(u.absentAckWeek===sat){u.absentAckWeek=null;u.absentAckBy=null;delete absentNotifiedKeys[uid+'|'+sat];checkAbsentNotifications();}else{u.absentAckWeek=sat;u.absentAckBy=G.displayName;notifications=notifications.filter(n=>n.absentUid!==uid);updateNotifDot();}renderAbsentAlerts();}
function gradeStudents(gk){return pendingList.filter(u=>u.approved&&u.role==='student'&&!u.hidden&&!u.graduated&&u.gradeKey===gk);}
function attendVal(u,d){return (u.halfWeeks||[]).includes(d)?0.5:(u.attendedWeeks||[]).includes(d)?1:0;}
function classSessions(){const yr=String(new Date().getFullYear());const all=getSaturdays(60).filter(d=>d.startsWith(yr));const first=pendingList.filter(u=>u.approved&&u.role==='student'&&!u.hidden&&!u.graduated).flatMap(u=>u.attendedWeeks||[]).sort()[0];if(!first)return{sessions:[],vac:[]};const inR=all.filter(d=>d>=first);return{sessions:inR.filter(d=>!isVacationDate(d)).sort(),vac:inR.filter(d=>isVacationDate(d)).sort()};}
function poolRate(students,sessions){if(!students.length||!sessions.length)return null;let pts=0;students.forEach(u=>sessions.forEach(d=>pts+=attendVal(u,d)));return Math.round(pts/(students.length*sessions.length)*100);}
function renderAttendStats(){const {sessions}=classSessions();const vb=document.getElementById('stats-vac-badge');if(vb)vb.style.display=isVacationDate(currentSaturday())?'inline-block':'none';['m1','m2','m3','h'].forEach(gk=>{const el=document.getElementById('stat-'+gk+'-rate');if(!el)return;const r=poolRate(gradeStudents(gk),sessions);el.textContent=r===null?'-':r+'%';});}
const GLBL={m1:'중1',m2:'중2',m3:'중3',h:'고등'};
function showGradeStatDetail(gk){const students=gradeStudents(gk);if(!students.length){showToast(GLBL[gk]+' 학생이 없어요');return;}const {sessions,vac}=classSessions();if(!sessions.length){showToast('아직 출석 기록이 없어요');return;}const byM={};sessions.forEach(d=>{(byM[d.slice(0,7)]=byM[d.slice(0,7)]||[]).push(d);});const vacByM={};vac.forEach(d=>{vacByM[d.slice(0,7)]=(vacByM[d.slice(0,7)]||0)+1;});document.getElementById('stats-modal-title').textContent='📊 '+GLBL[gk]+' 월별 출석률';document.getElementById('stats-modal-body').innerHTML=`<div style="font-size:11px;color:var(--text-light);margin-bottom:10px">누적 평균 <b>${poolRate(students,sessions)}%</b> · 학생 ${students.length}명 · 반일출석은 0.5회로 계산 · 방학 주 제외</div>`+Object.keys(byM).sort().reverse().map(ym=>{const r=poolRate(students,byM[ym]);return `<div class="card" style="margin-bottom:8px;cursor:pointer" onclick="showMonthStatDetail('${gk}','${ym}')"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:13px;font-weight:700">${parseInt(ym.slice(5))}월 <span style="font-size:10px;font-weight:500;color:var(--text-light)">수업 ${byM[ym].length}회${vacByM[ym]?' · 🏖️ 방학 '+vacByM[ym]+'주':''}</span></div><span style="font-size:16px;font-weight:800;color:var(--primary)">${r}%</span></div><div style="height:5px;background:var(--border-light);border-radius:3px;margin-top:8px"><div style="height:100%;width:${r}%;background:linear-gradient(90deg,var(--primary),var(--mint));border-radius:3px"></div></div></div>`;}).join('');openModal('stats-modal');}
function showMonthStatDetail(gk,ym){const students=gradeStudents(gk);const {sessions}=classSessions();const mS=sessions.filter(d=>d.startsWith(ym)).sort();document.getElementById('stats-modal-title').innerHTML=`<button onclick="showGradeStatDetail('${gk}')" style="background:var(--bg);border:none;border-radius:8px;width:26px;height:26px;cursor:pointer;font-size:14px;color:var(--text-sub);margin-right:6px;vertical-align:-2px">‹</button>📊 ${GLBL[gk]} ${parseInt(ym.slice(5))}월`;document.getElementById('stats-modal-body').innerHTML=`<div style="font-size:11px;color:var(--text-light);margin-bottom:10px">수업일: ${mS.map(d=>parseInt(d.slice(8))+'일').join(', ')}</div>`+students.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(u=>{let pts=0;const days=mS.map(d=>{const v=attendVal(u,d);pts+=v;return v?parseInt(d.slice(8))+'일'+(v===0.5?'(반일)':''):null;}).filter(Boolean);const r=mS.length?Math.round(pts/mS.length*100):0;return `<div class="card" style="margin-bottom:8px;cursor:pointer" onclick="goStudentFromStats('${u.id}')"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div style="font-size:13px;font-weight:700;flex:1;min-width:0">${u.name} ${u.baptism}</div><span style="font-size:13px;font-weight:800;color:${r>=75?'var(--mint)':r>=50?'var(--yellow)':'var(--coral)'}">${pts}/${mS.length}회 (${r}%)</span><span style="color:var(--text-light);font-size:14px;flex-shrink:0">›</span></div><div style="font-size:11px;color:var(--text-sub);margin-top:5px">${days.length?'출석: '+days.join(', '):'출석 기록 없음'}</div></div>`;}).join('');}
/* 출석통계 → 학생카드로 이동 */
function goStudentFromStats(sid){
  try{closeModal('stats-modal');}catch(e){}
  setTimeout(function(){ try{openStudentDetail(sid);}catch(e){} },180);
}
function renderAttendList(){_gradeSync();const students=pendingList.filter(u=>u.approved&&u.role==='student'&&!u.hidden&&!u.graduated);const el=document.getElementById('attend-student-list');if(!el)return;const badge=document.getElementById('attend-scope-badge');const POS={m1:'중1',m2:'중2',m3:'중3',h:'고등',principal:'전체',admin:'전체'};if(badge)badge.textContent=POS[G.type]||'전체';const isFull=G.type==='principal'||G.type==='admin'||G.isAdmin;const mine=isFull?students:students.filter(u=>u.gradeKey===G.type);const sat=attendSat();const isVac=isVacationDate(sat);const info=document.getElementById('attend-week-info');if(info)info.textContent='이번 주 토요일: '+sat+(isVac?' (방학·출석 없음)':isEduVacation(sat)?' (📖 교리방학·출석 진행)':'');const vh=document.getElementById('vacation-hint');if(vh)vh.style.display=isFull?'block':'none';if(!mine.length){el.innerHTML='<div class="empty" style="padding:32px"><div class="empty-emoji" style="font-size:28px">🎒</div><div class="empty-title" style="font-size:13px">담당 학생이 없어요</div></div>';return;}el.innerHTML=mine.map(u=>{const st=attendStatus(u,sat);const qt=(u.qrScanAt||{})[sat];const SEG=(k,l)=>`<button style="font-size:10px;font-weight:700;padding:5px 0;flex:1;border:none;border-radius:7px;cursor:pointer;font-family:inherit;background:${st===k?(k==='full'?'var(--mint)':k==='half'?'var(--yellow)':'var(--coral)'):'var(--bg)'};color:${st===k?'white':'var(--text-light)'}" ${isVac?'disabled':''} onclick="setAttendStatus('${u.id}','${k}')">${l}</button>`;return `<div class="student-row${u.id===window._lastAttendUid?' just-set':''}" style="flex-wrap:wrap"><div class="student-avatar" style="background:linear-gradient(135deg,var(--primary),var(--lavender))">${u.name.charAt(0)}</div><div class="student-info" style="cursor:pointer" onclick="openStudentDetail('${u.id}')"><div class="student-name">${u.name} ${u.baptism} <span class="grade-${u.gradeKey}" style="margin-left:2px">${u.gradeLabel||''}</span></div><div class="student-detail">${u.manualReg?'📵 ':''}누적 출석 ${u.attendTotal||0}회 · 연속 ${u.streak||0}주${qt?' · 📱QR '+qt:''}</div></div>${isVac?'':`<div style="display:flex;gap:4px;width:100%;margin-top:8px">${SEG('full','출석')}${SEG('half','반일')}${SEG('absent','결석')}</div>`}</div>`;}).join('');}
let pendingVacDate=null;
function vacLabel(dateStr){const[y,m,d]=dateStr.split('-');return parseInt(m)+'월 '+parseInt(d)+'일 (토)';}
function setVacationDate(dateStr,on){const isFull=G.type==='principal'||G.type==='admin'||G.isAdmin;if(!isFull){showToast('방학 지정은 교감·교무·관리자만 가능해요');return;}
if(on){pendingVacDate=dateStr;document.getElementById('vac-type-date').textContent=vacLabel(dateStr);openModal('vac-type-modal');}
else{const label=vacLabel(dateStr);const type=isEduVacation(dateStr)?'교리방학':'방학';if(!confirm(label+' '+type+' 지정을 해제할까요?\n자동 등록된 공지·캘린더 일정도 함께 삭제됩니다.'))return;vacationDates=vacationDates.filter(d2=>d2!==dateStr);eduVacationDates=eduVacationDates.filter(d2=>d2!==dateStr);posts=posts.filter(p=>p.id!=='vac-post-'+dateStr);notifications=notifications.filter(n=>n.id!=='nt-vac-'+dateStr);calEvents=calEvents.filter(e=>e.id!=='vac-cal-'+dateStr);updateNotifDot();showToast(label+' '+type+' 지정이 해제되었어요');refreshAfterVacChange();}}
function applyVacation(type){const dateStr=pendingVacDate;if(!dateStr)return;closeModal('vac-type-modal');pendingVacDate=null;const[y,m,d]=dateStr.split('-');const label=vacLabel(dateStr);const vm=appConfig.vacMsg||VAC_MSG_DEFAULT;
const title=(type==='edu'?vm.eduTitle:vm.fullTitle).replaceAll('{날짜}',label);const body=(type==='edu'?vm.eduBody:vm.fullBody).replaceAll('{날짜}',label);
if(type==='edu'){if(!eduVacationDates.includes(dateStr))eduVacationDates.push(dateStr);}else{if(!vacationDates.includes(dateStr))vacationDates.push(dateStr);}
posts.unshift({id:'vac-post-'+dateStr,ts:Date.now(),pushed:false,title,content:body,cat:'notice',target:'all',grade:'all',date:_todayDot(),authorId:G.id,authorName:G.displayName,comments:[],edited:false,isImportant:true});
notifications.unshift({pushed:false,id:'nt-vac-'+dateStr,text:'🚨 [중요] '+title,time:'방금',ts:Date.now(),readBy:[],forRole:'all',tap:{type:'post'}});updateNotifDot();
calEvents.push({id:'vac-cal-'+dateStr,title:type==='edu'?'📖 교리방학 (부서활동 18:40)':'🏖️ 주일학교 방학(휴무)',date:dateStr,time:type==='edu'?'18:40':'',place:'',content:body,visibility:'shared',authorId:G.id,authorName:G.displayName,checkedBy:[],isRecurring:false,responses:{}});
showToast((type==='edu'?'📖 ':'🏖️ ')+label+' '+(type==='edu'?'교리방학':'방학')+' 지정 완료! 공지·캘린더 반영');refreshAfterVacChange();}
function _fcfg(){try{if(window.flushCfg)window.flushCfg();}catch(e){}}
function cleanOrphanVac(){
  /* appConfig(settings)가 아직 안 왔으면 실행 금지 — 유효한 방학 항목을 지울 수 있음 */
  if(window.FB&&FB.enabled()&&!window._cfgLoaded)return;
  const vac=(vacationDates||[]).concat(eduVacationDates||[]);
  const orphan=(id,pfx)=>{const d=String(id||'').slice(pfx.length);return /^\d{4}-\d{2}-\d{2}$/.test(d)&&vac.indexOf(d)<0;};
  const b1=calEvents.length,b2=posts.length,b3=notifications.length;
  calEvents=calEvents.filter(e=>!(String(e.id).indexOf('vac-cal-')===0&&orphan(e.id,'vac-cal-')));
  posts=posts.filter(p=>!(String(p.id).indexOf('vac-post-')===0&&orphan(p.id,'vac-post-')));
  notifications=notifications.filter(n=>!(String(n.id).indexOf('nt-vac-')===0&&orphan(n.id,'nt-vac-')));
  const n=(b1-calEvents.length)+(b2-posts.length)+(b3-notifications.length);
  if(n)console.log('[VAC] 고아 방학 항목 '+n+'건 정리');
  return n;
}
function refreshAfterVacChange(){_fcfg();pendingList.filter(u=>u.approved&&u.role==='student'&&!u.hidden&&!u.graduated).forEach(u=>{u.streak=computeStreak(u);});checkAbsentNotifications();renderHomeNotices();renderAttendList();if(typeof renderCalendar==='function'&&document.getElementById('screen-calendar').classList.contains('active'))renderCalendar();try{renderTeacherWeek();}catch(e){}try{_syncDetailScreen();}catch(e){}}
function attendStatus(u,d){return (u.halfWeeks||[]).includes(d)?'half':(u.attendedWeeks||[]).includes(d)?'full':'absent';}
/* 회원 정보를 클라우드에 즉시 저장 — 동기화가 옛 값으로 되돌리는 것을 막는다 */
function saveMemberNow(u){
  try{
    if(!u||!u.id)return;
    if(!(window.FB&&FB.enabled()&&FB.save))return;
    if(!u.halfWeeks)u.halfWeeks=[];
    FB.save('members',u.id,u);
    if(window.flushSync)window.flushSync();
  }catch(e){console.warn('[ATTEND] 저장 실패',e);}
}
function calcAttendTotal(u){var _vac=function(w){return isVacationDate(w)||isEduVacation(w);};var att=(u.attendedWeeks||[]).filter(function(w){return !_vac(w);});var half=(u.halfWeeks||[]).filter(function(w){return !_vac(w);});return att.length-0.5*half.length;}
/* 지난 날짜의 출석을 고칠 때 사용 (학생카드에서 칸 탭) */
function setAttendOn(uid,dateStr,st){
  const u=pendingList.find(u=>u.id===uid);if(!u)return;
  u.attendedWeeks=(u.attendedWeeks||[]).filter(d=>d!==dateStr);
  u.halfWeeks=(u.halfWeeks||[]).filter(d=>d!==dateStr);
  if(st==='full')u.attendedWeeks.push(dateStr);
  else if(st==='half'){u.attendedWeeks.push(dateStr);u.halfWeeks.push(dateStr);}
  u.attendedWeeks.sort();
  u.attendTotal=calcAttendTotal(u);
  if(st!=='absent'){u.absentAckBy=null;checkLevelCoupons(u);}
  u.streak=computeStreak(u);
  if(G.id===u.id){G.attendTotal=u.attendTotal;G.streak=u.streak;G.attendedWeeks=u.attendedWeeks;G.halfWeeks=u.halfWeeks;}
  try{saveMemberNow(u);}catch(e){}
  try{renderAttendList();}catch(e){}
  try{renderAttendStats();}catch(e){}
}
/* 길게 눌러 출석 변경 - 실수 방지 */
var _attPressTimer=null,_attPressEl=null;
function attPressStart(el,dateStr){
  if(G.role!=='teacher')return;
  if(isVacationDate(dateStr)||isEduVacation(dateStr))return;
  attPressCancel();
  _attPressEl=el; el.classList.add('att-pressing');
  _attPressTimer=setTimeout(function(){
    el.classList.remove('att-pressing'); el.classList.add('att-fired');
    setTimeout(function(){el.classList.remove('att-fired');},240);
    try{if(navigator.vibrate)navigator.vibrate(18);}catch(e){}
    _attPressTimer=null; _attPressEl=null;
    openAttendPick(dateStr);
  },600);
}
function attPressCancel(){
  if(_attPressTimer){clearTimeout(_attPressTimer);_attPressTimer=null;}
  if(_attPressEl){_attPressEl.classList.remove('att-pressing');_attPressEl=null;}
}
function openAttendPick(dateStr){
  var u=pendingList.find(function(x){return x.id===currentDetailStudentId;});if(!u)return;
  var d=dateStr.split('-'), cur=attendStatus(u,dateStr);
  var t=document.getElementById('att-pick-title');
  if(t)t.textContent=(+d[1])+'월 '+(+d[2])+'일 · '+u.name+' '+u.baptism;
  var box=document.getElementById('att-pick-btns');
  if(box){
    box.innerHTML=[['full','✅ 출석','var(--mint-light)','#2D9E8F'],
                   ['half','◐ 반일','var(--yellow-light)','#B37A00'],
                   ['absent','✕ 결석','var(--coral-light)','#D95F50']]
      .map(function(o){
        var on=cur===o[0];
        return '<button onclick="pickAttend(\''+dateStr+'\',\''+o[0]+'\')" style="width:100%;margin-bottom:8px;border:'+(on?'2px solid '+o[3]:'1px solid var(--border-light)')+';background:'+o[2]+';color:'+o[3]+';border-radius:12px;padding:14px;font-family:\'Noto Sans KR\',sans-serif;font-size:14px;font-weight:800;cursor:pointer">'+o[1]+(on?'  ·  지금':'')+'</button>';
      }).join('');
  }
  openModal('attend-pick-modal');
}
function pickAttend(dateStr,st){
  var u=pendingList.find(function(x){return x.id===currentDetailStudentId;});if(!u)return;
  if(attendStatus(u,dateStr)!==st){
    setAttendOn(u.id,dateStr,st);
    u.attendEdits=u.attendEdits||{};
    u.attendEdits[dateStr]={by:((G.name||'')+' '+(G.baptism||'')).trim(),at:_minDateStr()};
    showToast(st==='full'?'출석으로 변경했어요':(st==='half'?'반일로 변경했어요':'결석으로 변경했어요'));
  }
  closeModal('attend-pick-modal');
  renderDetailAttend();
}
function setAttendStatus(uid,st){const sat=attendSat();if(isVacationDate(sat)){showToast('이번 주는 방학이라 출석을 진행하지 않아요');return;}const u=pendingList.find(u=>u.id===uid);if(!u)return;u.attendedWeeks=(u.attendedWeeks||[]).filter(d=>d!==sat);u.halfWeeks=(u.halfWeeks||[]).filter(d=>d!==sat);if(st==='full')u.attendedWeeks.push(sat);else if(st==='half'){u.attendedWeeks.push(sat);u.halfWeeks.push(sat);}u.attendTotal=calcAttendTotal(u);if(st!=='absent'){u.absentAckBy=null;checkLevelCoupons(u);}u.streak=computeStreak(u);if(computeAbsentStreak(u)<3){notifications=notifications.filter(n=>n.absentUid!==u.id);}if(G.id===u.id){G.attendTotal=u.attendTotal;G.streak=u.streak;G.attendedWeeks=u.attendedWeeks;G.halfWeeks=u.halfWeeks;}saveMemberNow(u);checkAbsentNotifications();window._lastAttendUid=uid;renderAttendList();window._lastAttendUid=null;renderAbsentAlerts();renderAttendStats();renderAdminGrid(G.type==='principal'||G.type==='admin'||G.isAdmin);showToast(st==='full'?'✅ 출석 처리':st==='half'?'🌗 반일출석 처리':'결석 처리');}
function generateCoupon(u,level){const code=String(Math.floor(100000+Math.random()*900000));const coupon={id:'cp'+Date.now()+Math.random().toString(36).slice(2,4),studentId:u.id,studentName:u.name+' '+u.baptism,badgeLabel:level.l,reward:level.r||'',code,used:false,createdAt:new Date().toLocaleDateString('ko-KR')};coupons.push(coupon);notifications.unshift({pushed:false,id:'nt'+Date.now()+'t',text:`🎟️ ${u.name} ${u.baptism} 학생이 [${level.l}] 등급을 달성했어요! 인증번호: ${code}`,time:'방금',ts:Date.now(),readBy:[],forTeacher:true,tap:{type:'coupon-admin'}});notifications.unshift({pushed:false,id:'nt'+Date.now()+'s',text:`🎉 축하해요! <b>[${level.l}]</b> 등급 달성으로 <b>${level.r||'보상'}</b> 쿠폰이 발급되었어요. 선생님께 확인받고 사용하세요!`,time:'방금',ts:Date.now(),readBy:[],forStudentId:u.id,tap:{type:'coupon'}});if(u.manualReg)notifications.unshift({pushed:false,id:'nt'+Date.now()+'mr',text:'📵 '+u.name+' '+u.baptism+' 학생(수동등록)에게 새 쿠폰이 발급됐어요. 학생카드에서 확인 후 직접 전달해주세요!',time:'방금',ts:Date.now(),readBy:[],forRole:'teacher-grade-'+u.gradeKey,tap:{type:'diary-shared',sid:u.id}});updateNotifDot();showToast('🎉 '+level.l+' 달성! 쿠폰 인증번호가 선생님께 전송되었습니다');renderNotifList();}
function nRead(n){return !!(n&&(n.readBy||[]).indexOf(G.id)>=0);}
/* 알림 문구의 장식용 아이콘 제거 — 중요/경고/긴급 표시(🚨 🆘)만 남긴다.
   이미 저장된 알림에도 적용되도록 '보여줄 때' 걸러낸다. */
const _KEEP_ICONS=['\u{1F6A8}','\u{1F198}'];
function stripNotifIcons(t){
  try{
    return String(t==null?'':t)
      .replace(/[\u{1F000}-\u{1FAFF}\u{2200}-\u{2BFF}\u{FE0F}\u{20E3}\u{2122}\u{2139}]/gu,
        function(m){ return _KEEP_ICONS.indexOf(m)>=0 ? m : ''; })
      .replace(/[ \t]{2,}/g,' ')
      .replace(/^\s+/,'')
      .trim();
  }catch(e){ return String(t==null?'':t); }
}
function _notifNormalize(){var seen={};for(var i=0;i<notifications.length;i++){var n=notifications[i];if(!n)continue;var id=String(n.id||'');if(!id||seen[id]){n.id=(id||'nt')+'-'+Math.random().toString(36).slice(2,7);}seen[String(n.id)]=1;}if(notifications.length>300)notifications.splice(300);}
/* 가입 시점 — 그 이전에 만들어진 알림·공지는 보여주지 않는다 */
function _joinTs(){
  try{
    var r=pendingList.find(function(x){return x.id===G.id;});
    if(r&&r.joinedTs)return r.joinedTs;                    // 정밀 가입 시각 우선
    var j=(r&&r.joinedAt)||'';
    if(!j)return 0;
    var t=new Date(j+'T00:00:00').getTime();
    return isNaN(t)?0:t;
  }catch(e){return 0;}
}
function _notifTs(n){if(!n)return 0;if(n.ts)return n.ts;var m=String(n.id||'').match(/(\d{13})/);return m?Number(m[1]):0;}
function notifMatch(n){if(!n)return false;if((n.hiddenBy||[]).indexOf(G.id)>=0)return false;if(n.ts&&!n.keep&&(Date.now()-n.ts)>14*864e5)return false;
  var _jt=_joinTs();var _nt=_notifTs(n);if(_jt&&_nt&&_nt<_jt)return false;if(n.forParentId)return n.forParentId===G.id;if(n.forStudentId)return n.forStudentId===G.id;if(n.forTeacherId)return G.role==='teacher'&&n.forTeacherId===G.id;if(n.forRole){if(n.forRole==='all')return true;if(n.forRole==='teacher-parent')return G.role==='teacher'||G.role==='parent';if(n.forRole.indexOf('teacher-grade-')===0){const gk=n.forRole.slice(14);return G.role==='teacher'&&(G.type===gk||G.type==='principal'||G.type==='admin'||G.isAdmin);}return n.forRole===G.role;}return G.role==='teacher'&&!!n.forTeacher;}
function updateNotifDot(){_notifNormalize();const dot=document.getElementById('notif-dot');if(!dot)return;dot.style.display=notifications.some(n=>notifMatch(n)&&!nRead(n))?'block':'none';}
function renderNotifList(){const el=document.getElementById('notif-list');if(!el)return;const list=notifications.filter(notifMatch).sort(function(a,b){return _notifTs(b)-_notifTs(a);}).slice(0,30);const _snap=_notifReadSnap;const _wasRead=(n)=>_snap?_snap.has(n.id):nRead(n);const readCnt=notifications.filter(n=>notifMatch(n)&&_wasRead(n)).length;if(!list.length){el.innerHTML='<div class="empty" style="padding:28px"><div class="empty-emoji" style="font-size:28px">🔔</div><div class="empty-title" style="font-size:13px">알림이 없어요</div></div>';return;}el.innerHTML=(readCnt?`<div style="text-align:right;margin-bottom:4px"><button onclick="clearReadNotifs()" style="background:none;border:none;color:var(--text-light);font-size:11px;cursor:pointer;font-family:inherit;padding:4px">🧹 읽은 알림 지우기 (${readCnt})</button></div>`:'')+list.map(n=>`<div class="notif-item" style="display:flex;align-items:center;gap:8px;padding:12px 4px;border-bottom:1px solid var(--border-light)${_wasRead(n)?';opacity:.65':''}"><div style="flex:1;font-size:13px;line-height:1.5;cursor:pointer" onclick="${n.tap?`notifTap('${n.id}')`:`markOneRead('${n.id}')`}">${stripNotifIcons(n.text)}<div style="font-size:10px;color:var(--text-light);margin-top:3px">${n.ts?_relTime(n.ts):(n.time||'')}</div></div>${n.tap?'<div style="color:var(--text-light);font-size:14px;flex-shrink:0">›</div>':''}<button onclick="deleteNotif('${n.id}')" style="background:none;border:none;color:var(--text-light);font-size:13px;cursor:pointer;padding:6px;flex-shrink:0">✕</button></div>`).join('');updateNotifDot();}
/* 읽음 처리는 개별 알림을 눌러서 볼 때만 (markOneRead / notifTap) */
function deleteNotif(id){const n=notifications.find(x=>x.id===id);if(n){if(!n.hiddenBy)n.hiddenBy=[];if(n.hiddenBy.indexOf(G.id)<0)n.hiddenBy.push(G.id);}renderNotifList();updateNotifDot();}
function clearReadNotifs(){
  const snap=_notifReadSnap;
  let n0=0;
  notifications.forEach(function(n){
    const already = snap ? snap.has(n.id) : nRead(n);
    if(notifMatch(n)&&already){
      if(!n.hiddenBy)n.hiddenBy=[];
      if(n.hiddenBy.indexOf(G.id)<0){n.hiddenBy.push(G.id);n0++;}
    }
  });
  if(snap)snap.clear();
  try{if(n0&&typeof flushSync==='function')flushSync();}catch(e){}
  renderNotifList();updateNotifDot();
  showToast(n0?('읽은 알림 '+n0+'건을 정리했어요'):'정리할 읽은 알림이 없어요');
}
function _relTime(ts){if(!ts)return '';var s=Math.floor((Date.now()-ts)/1000);if(s<0)s=0;if(s<60)return '방금';var m=Math.floor(s/60);if(m<60)return m+'분 전';var h=Math.floor(m/60);if(h<24)return h+'시간 전';var d=Math.floor(h/24);if(d<7)return d+'일 전';var dt=new Date(ts);return (dt.getMonth()+1)+'월 '+dt.getDate()+'일';}
function markOneRead(id){var n=notifications.find(function(x){return x.id===id;});if(!n)return;if(!n.readBy)n.readBy=[];if(n.readBy.indexOf(G.id)<0){n.readBy.push(G.id);try{if(typeof flushSync==='function')flushSync();}catch(e){}}renderNotifList();updateNotifDot();}
function notifTap(id){const n=notifications.find(x=>x.id===id);if(!n||!n.tap)return;if(!n.readBy)n.readBy=[];if(n.readBy.indexOf(G.id)<0){n.readBy.push(G.id);try{if(typeof flushSync==='function')flushSync();}catch(e){}}updateNotifDot();closeModal('notif-modal');const t=n.tap;if(t.type==='absent'){if(G.role==='teacher'){switchTab('admin');showAdminTab('stats');}else showToast('교사만 볼 수 있는 알림이에요');}else if(t.type==='post'){switchTab('board');if(G.role==='teacher')filterBoardTeacher();else if(G.role==='student')filterBoardStudent(G.gradeKey);else filterBoardParent();if(t.postId){setTimeout(function(){try{openPostDetail(t.postId);}catch(e){}},250);}}else if(t.type==='coupon'){openCouponBox();}else if(t.type==='coupon-admin'){if(G.role==='teacher'){switchTab('admin');showAdminTab('coupons');}else showToast('교사만 볼 수 있는 알림이에요');}else if(t.type==='diary-shared'){if(G.role==='teacher')openStudentDetail(t.sid);else showToast('교사만 볼 수 있는 알림이에요');}else if(t.type==='diary-reply'){switchTab('diary');if(t.did){setTimeout(function(){try{openDiaryDetail(t.did);}catch(e){}},260);}}else if(t.type==='pending'){if(G.role==='teacher'){switchTab('admin');showAdminTab('members');}else showToast('교사만 볼 수 있는 알림이에요');}else if(t.type==='members'){if(G.role==='teacher'){switchTab('admin');showAdminTab('members');}else showToast('교사만 볼 수 있는 알림이에요');}else if(t.type==='weekly-notice'){if(G.role==='teacher'){openWeeklyNotice();}else{switchTab('board');if(G.role==='student')filterBoardStudent(G.gradeKey);else filterBoardParent();var _wid=t.postId||(typeof _wnId==='function'?_wnId():'');if(_wid)setTimeout(function(){try{openPostDetail(_wid);}catch(e){}},260);}}else if(t.type==='grad-letter'){openGradLetters();}else if(t.type==='cal-vote'){switchTab('calendar');if(t.date){const q=t.date.split('-');calYear=+q[0];calMonth=+q[1]-1;selectedCalDate=t.date;}renderCalendar();}else if(t.type==='bday'){if(t.targetId){try{openBdayFromBanner(t.targetId);}catch(e){switchTab('home');}}else switchTab('home');}else if(t.type==='attend'){if(G.role==='student'){switchTab('attend');try{showAttendTab('history');}catch(e){}}else switchTab('home');}else if(t.type==='my'){switchTab('my');}else if(t.type==='gov'){if(G.role==='teacher'){switchTab('admin');showAdminTab('settings');setTimeout(function(){try{var g=document.getElementById('gov-section');if(g)g.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){}},350);}}else if(t.type==='jabumo-board'){switchTab('board');setTimeout(function(){try{var b=document.querySelector('#board-parent-cats .tab-btn[onclick*="jabumo"]');if(b){b.style.display='';selParentCat('jabumo',b);}}catch(e){}},260);}else if(t.type==='jabumo-req'){if(!G.isJabumoPresident){showToast('자부모회장만 볼 수 있어요');return;}try{openJabumoRequests();}catch(e){}}}
let memberRoleFilter='all',memberGradeFilter='all-s';
function selMemberRole(role,btn){btn.closest('.filter-row').querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));btn.classList.add('active');memberRoleFilter=role;memberGradeFilter='all-s';const gr=document.getElementById('member-grade-filter');if(gr){gr.style.display=role==='student'?'flex':'none';gr.querySelectorAll('.filter-chip').forEach((c,i)=>c.classList.toggle('active',i===0));}renderMembersList();}
function selMemberGrade(g,btn){btn.closest('.filter-row').querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));btn.classList.add('active');memberGradeFilter=g;renderMembersList();}
function _fmtKB(n){return n>1048576?(n/1048576).toFixed(1)+' MB':(n/1024).toFixed(0)+' KB';}
function _bytesOf(o){try{return new Blob([JSON.stringify(o)]).size;}catch(e){try{return JSON.stringify(o).length;}catch(x){return 0;}}}
let _blobUsage=null;   /* {imgN,imgB,fileN,fileB} — '다시 계산' 시 Firestore에서 실측 */
function renderStorageStats(){
  const el=document.getElementById('storage-stats');if(!el)return;
  const cols=[['회원',pendingList],['게시글(본문)',posts],['자료실',resources],['쿠폰',coupons],['일정',calEvents],['이벤트 배너',eventsData],['갤러리 메타',photosData],['리마인더',reminderData],['편지',letters],['생일 댓글',birthdayComments],['생일 하트',bdayLikes],['알림',notifications]];
  let total=0;
  const rows=cols.map(([nm,arr])=>{const b=_bytesOf(arr||[]);total+=b;return {nm,b,n:(arr||[]).length};});
  const cfgB=_bytesOf(appConfig);total+=cfgB;
  rows.push({nm:'앱 설정·로고',b:cfgB,n:1});
  if(_blobUsage){
    rows.push({nm:'🖼️ 사진(원본)',b:_blobUsage.imgB,n:_blobUsage.imgN});
    rows.push({nm:'📎 첨부파일',b:_blobUsage.fileB,n:_blobUsage.fileN});
    total+=_blobUsage.imgB+_blobUsage.fileB;
  }
  rows.sort((a,b)=>b.b-a.b);
  const pct=(total/(1024*1024*1024)*100);
  const warn=pct>=50;
  const big=posts.filter(p=>_bytesOf(p)>900000);
  el.innerHTML='<div style="display:flex;justify-content:space-between;padding:8px 2px;border-bottom:2px solid var(--border-light);font-weight:800"><span>합계</span><span>'+_fmtKB(total)+(_blobUsage?'':' <span style="font-size:10px;color:var(--coral,#E0663F);font-weight:700">(사진 미포함)</span>')+'</span></div>'
    +rows.map(r=>'<div style="display:flex;justify-content:space-between;padding:7px 2px;border-bottom:1px solid var(--border-light)"><span style="color:var(--text-sub)">'+r.nm+' <span style="color:var(--text-light)">('+r.n+')</span></span><span style="font-weight:600">'+_fmtKB(r.b)+'</span></div>').join('')
    +(_blobUsage
       ? '<div style="margin-top:10px;padding:10px;background:'+(warn?'var(--coral-light)':'var(--bg)')+';border-radius:8px"><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:800;color:'+(warn?'#B0463A':'var(--text)')+'"><span>Firestore 무료 한도 1GB 중</span><span>'+pct.toFixed(1)+'% 사용</span></div><div style="height:7px;background:var(--border-light);border-radius:4px;margin-top:7px;overflow:hidden"><div style="height:100%;width:'+Math.min(100,pct).toFixed(1)+'%;background:'+(warn?'#E0663F':'var(--primary)')+'"></div></div>'+(pct>=50?'<div style="font-size:11px;margin-top:7px;font-weight:700">⚠️ 50%를 넘었어요. 저장소 이전을 준비하세요.</div>':'')+'</div>'
       : '<div style="font-size:11px;color:var(--text-light);margin-top:8px;line-height:1.6">위 숫자에는 <b>사진·첨부파일 원본이 빠져 있습니다.</b> 아래 \'다시 계산\'을 누르면 실제 사용량을 조회합니다.</div>')
    +(big.length?'<div style="margin-top:8px;padding:8px;background:var(--coral-light);border-radius:8px;color:#B0463A;font-weight:700">⚠️ 1MB를 넘어 저장에 실패할 수 있는 게시글 '+big.length+'건</div>':'');
}
async function recalcStorage(){
  const el=document.getElementById('storage-stats');
  if(!(window.FB&&FB.enabled()&&FB.load)){showToast('클라우드 연결이 필요해요');renderStorageStats();return;}
  if(el)el.innerHTML='<div style="text-align:center;padding:30px 0;color:var(--text-light);font-size:13px">📊 사진·첨부파일 용량을 조회하는 중…<br><span style="font-size:11px">사진이 많으면 조금 걸려요</span></div>';
  try{
    const [imgs,files]=await Promise.all([FB.load('images'),FB.load('files')]);
    const sum=a=>a.reduce((t,d)=>t+_bytesOf(d),0);
    _blobUsage={imgN:imgs.length,imgB:sum(imgs),fileN:files.filter(f=>String(f.id||'').indexOf('_c')<0).length,fileB:sum(files)};
  }catch(e){
    console.warn('[STORAGE]',e);_blobUsage=null;showToast('용량 조회에 실패했어요');
  }
  renderStorageStats();
}
function cleanupStorage(){
  if(!(G.type==='principal'||G.type==='admin'||G.isAdmin)){showToast('교감·교무·관리자만 가능해요');return;}
  if(!confirm('90일이 지난 알림과 만료된 이벤트 배너를 삭제합니다.\n사진과 게시글은 지우지 않습니다. 계속할까요?'))return;
  const now=Date.now(),D=86400000;let n=0;
  const nb=notifications.length;
  notifications=notifications.filter(x=>{const t=Number(String(x.id||'').replace(/\D/g,'').slice(0,13));return !(t&&now-t>90*D);});
  n+=nb-notifications.length;
  const oldEv=eventsData.filter(e=>e.deadline&&now-new Date(e.deadline).getTime()>30*D);
  oldEv.forEach(e=>{posts=posts.filter(p=>p.eventId!==e.id);});
  eventsData=eventsData.filter(e=>!oldEv.includes(e));n+=oldEv.length;
  renderStorageStats();try{renderEventBanner();renderHomeNotices();updateNotifDot();}catch(e){}
  showToast('🧹 '+n+'건을 정리했어요');
}
/* ── 사진 수동 삭제 ── */
function openPhotoCleanup(){
  if(!(G.type==='principal'||G.type==='admin'||G.isAdmin)){showToast('교감·교무·관리자만 가능해요');return;}
  renderPhotoCleanup();openModal('photo-cleanup-modal');
}
function renderPhotoCleanup(){
  const el=document.getElementById('photo-cleanup-list');if(!el)return;
  const list=[...photosData].sort((a,b)=>new Date(a.date)-new Date(b.date));
  if(!list.length){el.innerHTML='<div class="empty"><div class="empty-emoji">🖼️</div><div class="empty-title">갤러리 사진이 없어요</div></div>';return;}
  el.innerHTML='<div style="font-size:11px;color:var(--text-light);margin-bottom:8px">오래된 순으로 표시됩니다. 총 '+list.length+'건</div>'
   +list.map(ph=>{
      const po=photoPost(ph);const cnt=(po&&po.images)?po.images.length:1;const cov=photoCover(ph);
      return '<div style="display:flex;align-items:center;gap:10px;padding:9px 2px;border-bottom:1px solid var(--border-light)">'
       +'<div style="width:44px;height:44px;border-radius:10px;flex-shrink:0;background:var(--bg) '+(cov?"center/cover no-repeat url('"+cov+"')":'')+'"></div>'
       +'<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(ph.title||'제목 없음')+'</div>'
       +'<div style="font-size:11px;color:var(--text-light)">'+(ph.date||'')+' · 사진 '+cnt+'장</div></div>'
       +'<button class="btn btn-sm" style="width:auto;background:var(--coral-light);color:#B0463A;font-weight:700;flex-shrink:0" onclick="deletePhotoEntry(\''+ph.id+'\')">삭제</button></div>';
   }).join('');
}
function deletePhotoEntry(phId){
  const ph=photosData.find(x=>x.id===phId);if(!ph)return;
  if(!confirm('"'+(ph.title||'제목 없음')+'" 사진을 삭제할까요?\n갤러리 게시글도 함께 삭제되며 되돌릴 수 없어요.'))return;
  const po=photoPost(ph);
  if(po&&po.images)po.images.forEach(im=>{if(im&&im.i){try{if(window.FB&&FB.enabled())FB.remove('images',im.i);}catch(e){}delete IMGC[im.i];}});
  posts=posts.filter(p=>p.photoId!==phId);
  photosData=photosData.filter(x=>x.id!==phId);
  renderPhotoCleanup();renderStorageStats();
  try{renderStoryRow();renderHomeNotices();}catch(e){}
  showToast('🗑️ 삭제했어요');
}
function renderMembersList(){const el=document.getElementById('members-list');if(!el)return;let all=pendingList.filter(u=>u.approved);const total=all.length;if(memberRoleFilter!=='all')all=all.filter(u=>u.role===memberRoleFilter);if(memberRoleFilter==='student'&&memberGradeFilter!=='all-s')all=all.filter(u=>u.gradeKey===memberGradeFilter);const cEl=document.getElementById('members-count');if(cEl)cEl.textContent=(memberRoleFilter==='all'?'전체 ':'')+all.length+'명'+(memberRoleFilter==='all'?'':' / 전체 '+total+'명');if(!all.length){el.innerHTML='<div class="empty"><div class="empty-emoji">👥</div><div class="empty-title">해당하는 회원이 없어요</div></div>';return;}const canAdmin=G.type==='principal'||G.type==='admin'||G.isAdmin;const BTN=(bg,fg,fn,label)=>`<button style="font-size:10px;padding:4px 9px;background:${bg};color:${fg};border:none;border-radius:8px;cursor:pointer;font-weight:700;font-family:'Noto Sans KR',sans-serif;flex-shrink:0" onclick="${fn}">${label}</button>`;el.innerHTML=all.map(u=>{const isStu=u.role==='student';const status=u.graduated?' <span class="chip chip-gray" style="font-size:9px">🎓 졸업</span>':u.hidden?' <span class="chip chip-gray" style="font-size:9px">🙈 숨김</span>':'';let btns='';if(canAdmin){btns=BTN('var(--primary-light)','var(--primary-dark)',`openMemberEdit('${u.id}')`,'수정');if(isStu&&u.manualReg&&!u.graduated)btns+=BTN('var(--mint-light)','#2D9E8F',`mergeManualPrompt('${u.id}')`,'📦 이관');if(!u.graduated)btns+=BTN('var(--bg)','var(--text-sub)',`toggleHideMember('${u.id}')`,u.hidden?'숨김 해제':'숨김');btns+=BTN('var(--coral-light)','#D95F50',`removeMember('${u.id}')`,'삭제');}return `<div class="student-row" style="flex-wrap:wrap;cursor:pointer;${u.hidden||u.graduated?'opacity:.65':''}" onclick="openMemberDetail('${u.id}')"><div onclick="event.stopPropagation();openProfileView('${u.id}')" style="flex-shrink:0">${_avatarHTML(u,40)}</div><div class="student-info"><div class="student-name">${u.name} ${u.baptism}${status}</div><div class="student-detail">${u.role==='student'?'학생':u.role==='parent'?'학부모':'교사'} · ${u.gradeLabel||''} ${u.isAdmin?'· 관리자':''} ${u.isJabumoPresident?'· 자부모회장':''}</div></div><div style="display:flex;gap:4px;flex-shrink:0;margin-left:auto" onclick="event.stopPropagation()">${btns}</div></div>`;}).join('');}
function _mdRow(label,val){return val?`<div style="display:flex;justify-content:space-between;padding:9px 2px;border-bottom:1px solid var(--border-light)"><span style="font-size:12px;color:var(--text-light)">${label}</span><span style="font-size:13px;font-weight:600;color:var(--text);text-align:right">${val}</span></div>`:'';}
/* 동명이인일 때 교사가 자녀를 직접 지정 */
let _childLink={pid:null,ix:0};
function openChildLink(pid,ix){
  const p=pendingList.find(x=>x.id===pid);
  if(!p){showToast('학부모를 찾을 수 없어요');return;}
  const c=(p.children||[])[ix];
  if(!c){showToast('자녀 정보를 찾을 수 없어요');return;}
  _childLink={pid:pid,ix:ix};
  const nm=c.name||c, cb=c.baptism||'';
  const stu=pendingList.filter(x=>x.approved&&x.role==='student'&&!x.hidden&&!x.graduated);
  const ms=stu.filter(s=>s.name===nm&&(!cb||s.baptism===cb));
  const list=ms.length?ms:stu;
  document.getElementById('child-link-who').textContent=p.name+' '+(p.baptism||'')+' 학부모의 자녀: '+nm+(cb?' '+cb:'');
  document.getElementById('child-link-list').innerHTML=list.map(s=>{
    const sel=c.sid===s.id;
    return `<div onclick="pickChildLink('${s.id}')" style="display:flex;align-items:center;gap:10px;padding:11px 12px;border:2px solid ${sel?'var(--primary)':'var(--border-light)'};background:${sel?'var(--primary-light)':'var(--card,white)'};border-radius:10px;margin-bottom:8px;cursor:pointer">
      <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--lavender));display:flex;align-items:center;justify-content:center;color:white;font-weight:800;flex-shrink:0">${(s.name||'?').charAt(0)}</div>
      <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">${s.name} ${s.baptism||''}</div>
      <div style="font-size:11px;color:var(--text-light)">${s.gradeLabel||''} · 아이디 ${s.id} · 누적 ${s.attendTotal||0}회</div></div>
      ${sel?'<span style="color:var(--primary);font-weight:800">✓</span>':''}</div>`;
  }).join('')||'<div style="text-align:center;padding:24px;color:var(--text-light);font-size:13px">등록된 학생이 없어요</div>';
  closeModal('member-detail-modal');
  openModal('child-link-modal');
}
function pickChildLink(sid){
  const p=pendingList.find(x=>x.id===_childLink.pid);
  if(!p)return;
  const c=(p.children||[])[_childLink.ix];
  if(!c)return;
  c.sid=sid;
  const s=pendingList.find(x=>x.id===sid);
  try{if(window.FB&&FB.enabled()&&FB.save)FB.save('members',p.id,p);if(window.flushSync)window.flushSync();}catch(e){}
  closeModal('child-link-modal');
  showToast('✅ '+(s?s.name+' '+(s.baptism||''):'학생')+' 학생과 연결했어요');
  try{renderMembersList();}catch(e){}
}
function clearChildLink(){
  const p=pendingList.find(x=>x.id===_childLink.pid);
  if(!p)return;
  const c=(p.children||[])[_childLink.ix];
  if(!c)return;
  delete c.sid;
  try{if(window.FB&&FB.enabled()&&FB.save)FB.save('members',p.id,p);if(window.flushSync)window.flushSync();}catch(e){}
  closeModal('child-link-modal');
  showToast('연결을 해제했어요');
  try{renderMembersList();}catch(e){}
}
function openMemberDetail(uid){
  const u=pendingList.find(x=>x.id===uid);if(!u)return;
  const el=document.getElementById('member-detail-body');if(!el)return;
  const POS={m1:'중1 담당',m2:'중2 담당',m3:'중3 담당',h:'고등 담당',principal:'교감',admin:'교무',etc:'기타'};
  const roleTxt=u.role==='student'?'🎒 학생':u.role==='parent'?'👨‍👩‍👧 학부모':'👨‍🏫 교사';
  const md=(m,d)=>(m&&d)?(m+'월 '+d+'일'):'';
  let rows='';
  rows+=_mdRow('아이디',u.id);
  rows+=_mdRow('구분',roleTxt);
  rows+=_mdRow('세례명',u.baptism||'-');
  rows+=_mdRow('연락처',u.phone||'-');
  rows+=_mdRow('생년월일',md(u.birthMonth,u.birthDay)||'-');
  rows+=_mdRow('축일',md(u.feastMonth,u.feastDay)||'-');
  if(u.role==='student'){
    rows+=_mdRow('학년',u.gradeLabel||'-');
    rows+=_mdRow('누적 출석',(u.attendTotal||0)+'회');
    rows+=_mdRow('연속 출석',(computeStreak(u)||0)+'주');
    rows+=_mdRow('이번 달 출석',monthAttendCount(u)+'회');
    rows+=_mdRow('등록 방식',u.manualReg?'교사 직접등록':'본인 가입');
    if(u.graduated)rows+=_mdRow('졸업','🎓 '+(u.graduatedYear||'')+' 졸업');
  }else if(u.role==='teacher'){
    rows+=_mdRow('직책',POS[u.teacherType]||u.gradeLabel||'-');
    const dp=(u.dept||[]).map(d=>d==='choir'?'🎵 성가대':'🕯️ 전례부').join(', ');
    rows+=_mdRow('담당 부서',dp||'-');
    rows+=_mdRow('관리자',u.isAdmin?'🛡️ 관리자':'-');
    const evs=calEvents.filter(e=>e.isRecurring&&e.date>=toDateStr(new Date()));
    const noResp=evs.filter(e=>!_evResp(e)[u.id]).length;
    rows+=_mdRow('일정 미응답',noResp?('🗳️ '+noResp+'건'):'없음');
  }else{
    const _stu=pendingList.filter(x=>x.approved&&x.role==='student'&&!x.hidden&&!x.graduated);
    const _kids=(u.children||[]).map(function(c,ix){
      const nm=c.name||c, cb=c.baptism||'';
      const pin=c.sid?_stu.find(s=>s.id===c.sid):null;
      const ms=_stu.filter(s=>s.name===nm&&(!cb||s.baptism===cb));
      const ok=pin||(ms.length===1?ms[0]:null);
      const tag=pin?'<span style="color:var(--mint);font-weight:700">연결됨</span>'
               :ms.length>1?'<span style="color:var(--coral);font-weight:700">⚠️ '+ms.length+'명 중복</span>'
               :ok?'<span style="color:var(--mint);font-weight:700">연결됨</span>'
               :'<span style="color:var(--text-light)">미가입</span>';
      const btn=(ms.length>1||pin)?` <button onclick="openChildLink('${u.id}',${ix})" style="background:none;border:none;color:var(--primary);font-size:11px;font-weight:700;cursor:pointer;padding:0;font-family:inherit">지정</button>`:'';
      return nm+(cb?' '+cb:'')+' — '+tag+(ok&&ok.gradeLabel?' ('+ok.gradeLabel+')':'')+btn;
    });
    rows+=_mdRow('자녀',_kids.join('<br>')||'-');
    rows+=_mdRow('자부모회',u.isJabumo?'✅ 회원':'-');
    rows+=_mdRow('자부모회장',u.isJabumoPresident?'회장':'-');
  }
  rows+=_mdRow('상태',u.hidden?'🙈 숨김':'정상');
  const canAdmin=G.type==='principal'||G.type==='admin'||G.isAdmin;
  let acts='<div style="display:flex;gap:8px;margin-top:14px">';
  if(u.role==='student')acts+=`<button class="btn btn-outline btn-sm" style="flex:1" onclick="closeModal('member-detail-modal');openStudentDetail('${u.id}')">📋 학생 기록 보기</button>`;
  if(canAdmin)acts+=`<button class="btn btn-primary btn-sm" style="flex:1" onclick="closeModal('member-detail-modal');openMemberEdit('${u.id}')">✏️ 정보 수정</button>`;
  acts+='</div>';
  if(canResetPw()&&u.id!==G.id&&!u.manualReg)acts+=`<button class="btn btn-outline btn-sm" style="width:100%;margin-top:8px" onclick="resetMemberPw('${u.id}')">🔑 비밀번호 초기화</button>`;
  el.innerHTML=`<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px"><div class="student-avatar" style="width:52px;height:52px;font-size:20px;background:linear-gradient(135deg,var(--primary),var(--lavender))">${u.name.charAt(0)}</div><div><div style="font-size:17px;font-weight:800">${u.name} ${u.baptism||''}</div><div style="font-size:12px;color:var(--text-sub);margin-top:2px">${roleTxt} · ${u.gradeLabel||''}</div></div></div>${rows}${(u.role==='student'||canAdmin)?acts:''}`;
  openModal('member-detail-modal');
}
let currentEditMemberId=null;
function openJabumoRoster(){const el=document.getElementById('jabumo-roster-list');if(!el)return;const list=pendingList.filter(u=>u.approved&&u.role==='parent'&&!u.hidden&&u.isJabumo);if(!list.length){el.innerHTML='<div class="empty" style="padding:24px"><div class="empty-emoji" style="font-size:28px">👥</div><div class="empty-title" style="font-size:13px">등록된 자부모회원이 없어요</div></div>';}else{el.innerHTML=list.map(u=>{const kids=(u.children||[]).map(c=>c.name||c).join(', ');return `<div class="student-row"><div class="student-avatar" style="background:linear-gradient(135deg,var(--yellow),#FFA94D)">${u.name.charAt(0)}</div><div class="student-info"><div class="student-name">${u.name} ${u.baptism}${u.isJabumoPresident?' <span style="font-size:10px;font-weight:700;color:#9A7200;background:var(--yellow-light);padding:2px 6px;border-radius:8px;margin-left:4px">자부모회장</span>':''}</div><div class="student-detail">${kids?'자녀: '+kids+' · ':''}${u.phone||'연락처 미등록'}</div></div></div>`;}).join('');}if(G.isJabumoPresident){const el2=document.getElementById('jabumo-roster-list');el2.innerHTML+=`<div style="text-align:center;margin-top:14px;padding-top:10px;border-top:1px solid var(--border-light)"><button onclick="openJabumoTransfer()" style="background:none;border:none;color:var(--text-light);font-size:11px;cursor:pointer;font-family:inherit;padding:6px;text-decoration:underline">회장 이임하기</button></div>`;}openModal('jabumo-roster-modal');}
function openMemberEdit(uid){const u=pendingList.find(u=>u.id===uid);if(!u)return;currentEditMemberId=uid;document.getElementById('me-name').textContent=u.name+' '+u.baptism+' ('+(u.role==='student'?'학생':u.role==='parent'?'학부모':'교사')+')';show('me-student-wrap',u.role==='student');show('me-teacher-wrap',u.role==='teacher');show('me-parent-wrap',u.role==='parent');let mw=document.getElementById('me-manual-wrap');if(!mw){mw=document.createElement('div');mw.id='me-manual-wrap';document.getElementById('me-name').after(mw);}{const st='width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:var(--surface);color:var(--text)';mw.style.display='';mw.innerHTML=`<div style="font-size:11px;color:var(--text-light);margin:10px 0 4px">이름 · 세례명</div><div style="display:flex;gap:8px;margin-bottom:4px"><input id="me-mname" value="${(u.name||'').replace(/"/g,'&quot;')}" placeholder="이름" style="${st}"><input id="me-mbaptism" value="${(u.baptism||'').replace(/"/g,'&quot;')}" placeholder="세례명" style="${st}"></div>`;}if(u.role==='student'){document.getElementById('me-grade').value=u.gradeKey==='h'?('h'+(((u.gradeLabel||'').match(/고(\d)/)||[])[1]||'1')):(u.gradeKey||'m1');}else if(u.role==='teacher'){document.getElementById('me-position').value=u.teacherType||'etc';document.getElementById('me-admin-check').checked=!!u.isAdmin;const dept=u.dept||[];document.getElementById('me-dept-choir').checked=dept.includes('choir');document.getElementById('me-dept-liturgy').checked=dept.includes('liturgy');}else if(u.role==='parent'){document.getElementById('me-jabumo-check').checked=!!u.isJabumo;document.getElementById('me-president-check').checked=!!u.isJabumoPresident;}['me-bmonth','me-fmonth'].forEach(function(id){var el=document.getElementById(id);if(el&&el.options.length<=1){var h='<option value="0">월</option>';for(var i=1;i<=12;i++)h+='<option value="'+i+'">'+i+'</option>';el.innerHTML=h;}});['me-bday','me-fday'].forEach(function(id){var el=document.getElementById(id);if(el&&el.options.length<=1){var h='<option value="0">일</option>';for(var i=1;i<=31;i++)h+='<option value="'+i+'">'+i+'</option>';el.innerHTML=h;}});document.getElementById('me-bmonth').value=u.birthMonth||0;document.getElementById('me-bday').value=u.birthDay||0;document.getElementById('me-fmonth').value=u.feastMonth||0;document.getElementById('me-fday').value=u.feastDay||0;openModal('member-edit-modal');}
function saveMemberEdit(){const u=pendingList.find(u=>u.id===currentEditMemberId);if(!u)return;
  /* 이름·세례명은 모든 회원에 대해 교감·교무·관리자가 수정 가능 */
  {const _n=(document.getElementById('me-mname')||{}).value,_b=(document.getElementById('me-mbaptism')||{}).value;
   if(_n!==undefined){ if(_n&&_n.trim())u.name=_n.trim(); u.baptism=(_b||'').trim();
     coupons.forEach(c=>{if(c.studentId===u.id)c.studentName=u.name+' '+u.baptism;});
     if(G.id===u.id){G.name=u.name;G.baptism=u.baptism;try{setMyProfile();}catch(e){}}
     /* 처리된 변경 요청 표시 제거 */
     if(u.profReq)delete u.profReq;
   }}
  if(u.role==='student'){if(u.manualReg){const nn=(document.getElementById('me-mname')||{}).value,bb=(document.getElementById('me-mbaptism')||{}).value;if(nn&&nn.trim())u.name=nn.trim();u.baptism=(bb||'').trim();coupons.forEach(c=>{if(c.studentId===u.id)c.studentName=u.name+' '+u.baptism;});}const g=document.getElementById('me-grade').value;var _gidx=({m1:0,m2:1,m3:2,h1:3,h2:4,h3:5})[g];if(_gidx!=null){u.cohort=_curSchoolYr()-_gidx;u.gradeOffset=0;u.graduated=false;delete u.graduatedYear;}try{applyStudentGrade(u);}catch(e){}if(!u.cohort){if(g.charAt(0)==='h'){u.gradeKey='h';u.gradeLabel='고'+g.charAt(1);}else{u.gradeKey=g;u.gradeLabel={m1:'중1',m2:'중2',m3:'중3'}[g]||g;}}}else if(u.role==='teacher'){const pos=document.getElementById('me-position').value;if((pos==='principal'||pos==='admin')&&pos!==u.teacherType){const holder=pendingList.find(x=>x.role==='teacher'&&x.approved&&!x.hidden&&x.teacherType===pos&&x.id!==u.id);if(holder){const lbl=pos==='principal'?'교감':'교무';if(!confirm(lbl+'은 현재 '+holder.name+' '+holder.baptism+' 선생님입니다.\n\n'+u.name+' 선생님에게 '+lbl+' 직책을 이전할까요?\n(기존 '+holder.name+' 선생님은 "기타"로 자동 변경됩니다)'))return;holder.teacherType='etc';holder.gradeLabel='기타';notifications.unshift({id:'nt'+Date.now()+'pt',text:'👤 '+lbl+' 직책이 이전되었어요: '+holder.name+' → '+u.name+' 선생님',time:'방금',ts:Date.now(),pushed:false,readBy:[],forRole:'teacher'});updateNotifDot();}}
const wantAdmin=document.getElementById('me-admin-check').checked;if(wantAdmin!==!!u.isAdmin){showToast('🛡️ 관리자 권한은 여기서 변경할 수 없어요. 관리 탭의 이임 또는 교사 과반 투표를 이용하세요');document.getElementById('me-admin-check').checked=!!u.isAdmin;return;}
u.teacherType=pos;const POS={m1:'중1',m2:'중2',m3:'중3',h:'고등',principal:'교감',admin:'교무',etc:'기타'};u.gradeLabel=POS[pos]||pos;const dept=[];if(document.getElementById('me-dept-choir').checked)dept.push('choir');if(document.getElementById('me-dept-liturgy').checked)dept.push('liturgy');u.dept=dept;renderDeptInfo();}else if(u.role==='parent'){u.isJabumo=document.getElementById('me-jabumo-check').checked;const wantP=document.getElementById('me-president-check').checked;if(wantP!==!!u.isJabumoPresident){if(!(G.type==='principal'||G.type==='admin'||G.isAdmin)){showToast('자부모회장 변경은 교감·교무·관리자만 할 수 있어요');return;}if(wantP){const prev=pendingList.find(x=>x.role==='parent'&&x.isJabumoPresident&&x.id!==u.id);if(prev){prev.isJabumoPresident=false;notifications.unshift({id:'nt'+Date.now()+'jp',text:'자부모회장이 변경되었어요: '+prev.name+' → '+u.name,time:'방금',ts:Date.now(),pushed:false,readBy:[],hiddenBy:[],forRole:'teacher-parent'});}}u.isJabumoPresident=wantP;updateNotifDot();}}u.birthMonth=parseInt((document.getElementById('me-bmonth')||{}).value)||0;u.birthDay=parseInt((document.getElementById('me-bday')||{}).value)||0;u.feastMonth=parseInt((document.getElementById('me-fmonth')||{}).value)||0;u.feastDay=parseInt((document.getElementById('me-fday')||{}).value)||0;if(u.id===G.id){G.birthMonth=u.birthMonth;G.birthDay=u.birthDay;G.feastMonth=u.feastMonth;G.feastDay=u.feastDay;}closeModal('member-edit-modal');renderMembersList();try{renderBdayBannerAuto();}catch(e){}showToast('회원 정보가 수정되었습니다');}
function renderDeptInfo(){const teachers=pendingList.filter(u=>u.approved&&u.role==='teacher');const choirT=teachers.filter(u=>(u.dept||[]).includes('choir')).map(u=>u.name+' '+u.baptism);const liturgyT=teachers.filter(u=>(u.dept||[]).includes('liturgy')).map(u=>u.name+' '+u.baptism);const ci=document.getElementById('choir-info');if(ci)ci.textContent=choirT.length?'담당교사 '+choirT.join(', '):'담당교사 미정';const li=document.getElementById('liturgy-info');if(li)li.textContent=liturgyT.length?'담당교사 '+liturgyT.join(', '):'담당교사 미정';renderDeptPosts('choir');renderDeptPosts('liturgy');renderDeptWeekInfo();}
function renderDeptWeekInfo(){try{var canEdit=(typeof G!=='undefined'&&G.role==='teacher');var E=_gEsc;var monthBtn=function(){return canEdit?'<button onclick="openHymnPage()" style="background:var(--bg);border:1px solid var(--border-light);border-radius:8px;padding:4px 11px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;color:var(--text-sub)">✏️ 편집</button>':'';};
var editBtn=function(fn){return canEdit?'<button onclick="'+fn+'()" style="background:var(--bg);border:1px solid var(--border-light);border-radius:8px;padding:4px 11px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;color:var(--text-sub)">✏️ 편집</button>':'';};
/* 한 달치로 넣어둔 값이 있으면 그 주 것을 자동으로 사용 */
var _cw=(typeof appConfig!=='undefined'&&appConfig.choirWeek)||{};
var _sat=(typeof currentSaturday==='function')?currentSaturday():'';
var _hm=(typeof hymnFor==='function'&&_sat)?hymnFor(_sat):null;
var c=_cw;
if(_hm){var _it=_hm.items||{};
  c={title:_hm.label,ipdang:_it['입당'],bonghen:_it['봉헌'],seongche1:_it['성체1'],seongche2:_it['성체2'],pagyeon:_it['파견'],teuksong:_hm.teuksong,note:_hm.note};}
var cc=document.getElementById('choir-week-card');if(cc){var crows=[['입당',c.ipdang],['봉헌',c.bonghen],['성체1',c.seongche1],['성체2',c.seongche2],['파견',c.pagyeon]].filter(function(r){return r[1];});var cEmpty=!crows.length&&!c.teuksong&&!c.title&&!c.note;var h='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:'+((c.title||!cEmpty)?'12':'0')+'px"><div style="font-size:14px;font-weight:800;color:var(--primary-dark)">'+(c.title?E(c.title):'<span style=\'color:var(--text-sub);font-weight:700\'>🎵 이번 주 성가곡</span>')+'</div>'+monthBtn()+'</div>';if(cEmpty){h+='<div style="font-size:12px;color:var(--text-light);padding:4px 0">아직 등록된 성가곡이 없어요'+(canEdit?' · 편집을 눌러 입력하세요':'')+'</div>';}else{h+='<div style="display:flex;gap:4px">'+crows.map(function(r){return '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;text-align:center"><span style="font-size:12px;color:var(--text-sub);font-weight:700">'+r[0]+'</span><span style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+E(r[1])+'</span></div>';}).join('')+'</div>';if(c.teuksong)h+='<div style="margin-top:11px;padding-top:11px;border-top:1px dashed var(--border-light);font-size:13px"><span style="color:var(--coral);font-weight:800">특송</span> · '+E(c.teuksong)+'</div>';if(c.note)h+='<div style="margin-top:9px;font-size:13px;color:var(--coral);font-weight:800">'+E(c.note)+'</div>';}cc.innerHTML=h;}
var _lw=(typeof appConfig!=='undefined'&&appConfig.liturgyWeek)||{};
var _lm=(typeof litFor==='function'&&_sat)?litFor(_sat):null;
var l=_lm?{title:_lm.label,reading1:_lm.reading1,reading2:_lm.reading2,gospel:_lm.gospel,note:_lm.note}:_lw;
var lc=document.getElementById('liturgy-week-card');if(lc){var lrows=[['제1독서',l.reading1],['제2독서',l.reading2],['복음',l.gospel]].filter(function(r){return r[1];});var lEmpty=!lrows.length&&!l.note&&!l.title;var h2='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:'+((l.title||!lEmpty)?'12':'0')+'px"><div style="font-size:14px;font-weight:800;color:var(--primary-dark)">'+(l.title?E(l.title):'<span style=\'color:var(--text-sub);font-weight:700\'>✝️ 이번 주 독서</span>')+'</div>'+(canEdit?'<button onclick="openLitPage()" style="background:var(--bg);border:1px solid var(--border-light);border-radius:8px;padding:4px 11px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;color:var(--text-sub)">✏️ 편집</button>':'')+'</div>';if(lEmpty){h2+='<div style="font-size:12px;color:var(--text-light);padding:4px 0">아직 등록된 독서가 없어요'+(canEdit?' · 편집을 눌러 입력하세요':'')+'</div>';}else{h2+='<div style="display:flex;flex-direction:column;gap:9px">'+lrows.map(function(r){return '<div style="display:flex;gap:12px;font-size:13px;align-items:baseline"><span style="min-width:56px;color:var(--text-light);font-weight:700;font-size:12px">'+r[0]+'</span><span style="font-weight:600;flex:1">'+E(r[1])+'</span></div>';}).join('')+'</div>';if(l.note)h2+='<div style="margin-top:11px;padding-top:11px;border-top:1px dashed var(--border-light);font-size:12px;color:var(--text-sub)">📌 '+E(l.note)+'</div>';}lc.innerHTML=h2;}}catch(e){}}
function openChoirWeekEdit(){var c=(appConfig.choirWeek)||{};['title','ipdang','bonghen','seongche1','seongche2','pagyeon','teuksong'].forEach(function(k){var el=document.getElementById('cw-'+k);if(el)el.value=c[k]||'';});openModal('choir-week-modal');}
function saveChoirWeek(){var v=function(k){return (document.getElementById('cw-'+k)||{}).value||'';};appConfig.choirWeek={title:v('title').trim(),ipdang:v('ipdang').trim(),bonghen:v('bonghen').trim(),seongche1:v('seongche1').trim(),seongche2:v('seongche2').trim(),pagyeon:v('pagyeon').trim(),teuksong:v('teuksong').trim()};renderDeptWeekInfo();closeModal('choir-week-modal');try{if(window.flushCfg)window.flushCfg();}catch(e){}showToast('🎵 이번 주 성가곡이 저장되었어요');}
function openLiturgyWeekEdit(){var l=(appConfig.liturgyWeek)||{};['title','reading1','reading2','gospel','note'].forEach(function(k){var el=document.getElementById('lw-'+k);if(el)el.value=l[k]||'';});openModal('liturgy-week-modal');}
function saveLiturgyWeek(){var v=function(k){return (document.getElementById('lw-'+k)||{}).value||'';};appConfig.liturgyWeek={title:v('title').trim(),reading1:v('reading1').trim(),reading2:v('reading2').trim(),gospel:v('gospel').trim(),note:v('note').trim()};renderDeptWeekInfo();closeModal('liturgy-week-modal');try{if(window.flushCfg)window.flushCfg();}catch(e){}showToast('✝️ 이번 주 독서가 저장되었어요');}

function renderStudentCards(gf){_gradeSync();try{_lastStudentFilter=gf||'all';}catch(e){}const el=document.getElementById('student-card-list');if(!el)return;const isFull=G.type==='principal'||G.type==='admin'||G.isAdmin;const isGrade=['m1','m2','m3','h'].includes(G.type);const fb=document.getElementById('student-grade-filter');if(fb)fb.style.display=isFull?'':'none';if(!isFull&&!isGrade){el.innerHTML='<div class="empty"><div class="empty-emoji">🙅</div><div class="empty-title">해당사항이 없어요</div><div class="empty-desc">담당 학년이 지정된 교사와 교감·교무·관리자만 이용할 수 있어요</div></div>';return;}let students=pendingList.filter(u=>u.approved&&u.role==='student'&&!u.hidden&&!u.graduated);if(!isFull)students=students.filter(u=>u.gradeKey===G.type);else if(gf!=='all')students=students.filter(u=>u.gradeKey===gf);if(!students.length){el.innerHTML='<div class="empty"><div class="empty-emoji">👥</div><div class="empty-title">등록된 학생이 없어요</div></div>';return;}el.innerHTML=students.map(u=>{let lv='🌱';const t=u.attendTotal||0;for(const L of ATTEND_LEVELS)if(t>=L.n)lv=L.l.split(' ')[0];return `<div class="student-card-item" onclick="openStudentDetail('${u.id}')"><div class="student-card-avatar" style="background:${GCOLOR[u.gradeKey]||GCOLOR.m1}">${u.name.charAt(0)}</div><div class="student-card-info"><div class="student-card-name">${u.name} ${u.baptism}${crownMark(u)}</div><div class="student-card-sub">${u.gradeLabel||''}${u.manualReg?' · 📵 수동':''}</div></div><div class="student-card-stats"><div class="student-card-stat"><div class="student-card-stat-n">${t}</div><div class="student-card-stat-l">출석</div></div><div class="student-card-stat"><div class="student-card-stat-n">${lv}</div><div class="student-card-stat-l">등급</div></div></div></div>`;}).join('');}
function filterStudentCards(grade,btn){document.querySelectorAll('#student-grade-filter .tab-btn').forEach(t=>t.classList.remove('active'));btn.classList.add('active');renderStudentCards(grade);}
/* 앱 도입 전 기록을 직접 넣기 */
function openPastRecord(){
  var u=pendingList.find(function(x){return x.id===currentDetailStudentId;});if(!u)return;
  document.getElementById('pr-term').value='';
  document.getElementById('pr-grade').value='';
  document.getElementById('pr-count').value='';
  document.getElementById('pr-from').value='';
  document.getElementById('pr-to').value='';
  _prDates=null;renderPastDates();renderPastList();
  openModal('past-record-modal');
}
function renderPastList(){
  var el=document.getElementById('pr-list');if(!el)return;
  var u=pendingList.find(function(x){return x.id===currentDetailStudentId;});if(!u){el.innerHTML='';return;}
  var man=(u.history||[]).map(function(h,i){return {h:h,i:i};}).filter(function(x){return x.h.manual;});
  el.innerHTML=man.length?('<div style="font-size:11px;font-weight:700;color:var(--text-sub);margin-bottom:6px">직접 넣은 기록</div>'
    +man.map(function(x){
      return '<div style="display:flex;align-items:center;gap:8px;background:var(--bg);border-radius:9px;padding:8px 10px;margin-bottom:5px">'
        +'<span style="flex:1;font-size:12px;font-weight:700">'+_esc(x.h.term||'')+' · '+_esc(x.h.grade||'-')+' · '+(x.h.attendTotal||0)+'회</span>'
        +'<button onclick="delPastRecord('+x.i+')" style="border:none;background:var(--coral-light);color:#D95F50;border-radius:7px;width:26px;height:26px;font-size:14px;cursor:pointer">×</button></div>';
    }).join('')):'';
}
var _prDates=null;   /* {날짜: 'full'|'half'|'absent'} */
function loadPastDates(){
  var f=document.getElementById('pr-from').value, t=document.getElementById('pr-to').value;
  if(!f||!t){showToast('시작일과 종료일을 골라주세요');return;}
  if(f>t){showToast('시작일이 종료일보다 늦어요');return;}
  var d=new Date(f+'T12:00:00'), end=new Date(t+'T12:00:00'), list=[];
  while(d.getDay()!==6)d.setDate(d.getDate()+1);       /* 첫 토요일까지 */
  while(d<=end){ list.push(toDateStr(d)); d.setDate(d.getDate()+7); }
  if(!list.length){showToast('그 기간에 토요일이 없어요');return;}
  _prDates={}; list.forEach(function(w){_prDates[w]='full';});   /* 기본 출석, 눌러서 바꿈 */
  renderPastDates();
}
function renderPastDates(){
  var el=document.getElementById('pr-dates');if(!el)return;
  var cw=document.getElementById('pr-count-wrap');
  if(!_prDates){el.innerHTML='';if(cw)cw.style.display='';return;}
  if(cw)cw.style.display='none';
  var ks=Object.keys(_prDates).sort();
  var o=0,h=0,x=0;
  var cells=ks.map(function(w){
    var st=_prDates[w], d=w.split('-');
    var bg,fg,mk;
    if(st==='full'){bg='var(--mint-light)';fg='#2D9E8F';mk='○';o++;}
    else if(st==='half'){bg='var(--yellow-light)';fg='#B37A00';mk='◐';h++;}
    else{bg='var(--coral-light)';fg='#D95F50';mk='✕';x++;}
    return '<div style="text-align:center;cursor:pointer" onclick="cyclePastDate(\''+w+'\')">'
      +'<div style="background:'+bg+';color:'+fg+';border-radius:9px;padding:7px 0;font-size:14px;font-weight:800;line-height:1">'+mk+'</div>'
      +'<div style="font-size:9px;color:var(--text-light);margin-top:3px">'+(+d[1])+'/'+(+d[2])+'</div></div>';
  }).join('');
  el.innerHTML='<div style="font-size:11px;color:var(--text-light);margin-bottom:7px">칸을 눌러 출석 → 반출석 → 결석으로 바꿔주세요</div>'
    +'<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:8px">'+cells+'</div>'
    +'<div style="font-size:11px;color:var(--text-sub);text-align:center;margin-bottom:12px">○ '+o+' · ◐ '+h+' · ✕ '+x+' → 출석 <b>'+(o+h*0.5)+'회</b></div>';
}
function cyclePastDate(w){
  if(!_prDates)return;
  var c=_prDates[w];
  _prDates[w]=c==='full'?'half':(c==='half'?'absent':'full');
  renderPastDates();
}
function savePastRecord(){
  var u=pendingList.find(function(x){return x.id===currentDetailStudentId;});if(!u)return;
  var term=(document.getElementById('pr-term').value||'').trim();
  var grade=(document.getElementById('pr-grade').value||'').trim();
  var cnt=parseFloat(document.getElementById('pr-count').value||'0')||0;
  if(!term){showToast('학년도를 입력해주세요');return;}
  var wk=[],hw=[];
  if(_prDates){
    Object.keys(_prDates).sort().forEach(function(w){
      if(_prDates[w]==='full'){wk.push(w);}
      else if(_prDates[w]==='half'){wk.push(w);hw.push(w);}
    });
    cnt=wk.length-hw.length*0.5;
  }
  var lv='🌱 씨앗';
  try{for(var i=0;i<ATTEND_LEVELS.length;i++)if(cnt>=ATTEND_LEVELS[i].n)lv=ATTEND_LEVELS[i].l;}catch(e){}
  u.history=u.history||[];
  u.history.push({term:term,grade:grade,attendTotal:cnt,level:lv,weeks:wk,halfWeeks:hw,
    from:document.getElementById('pr-from').value||'',to:document.getElementById('pr-to').value||'',
    year:parseInt(term,10)||new Date().getFullYear(),manual:!wk.length});
  try{if(typeof flushSync==='function')flushSync();}catch(e){}
  document.getElementById('pr-term').value='';document.getElementById('pr-grade').value='';document.getElementById('pr-count').value='';
  _prDates=null;renderPastDates();
  var sel=document.getElementById('detail-attend-term');if(sel)delete sel.dataset.uid;
  renderPastList();renderDetailAttend();
  showToast('지난 기록을 추가했어요');
}
function delPastRecord(i){
  var u=pendingList.find(function(x){return x.id===currentDetailStudentId;});if(!u||!u.history)return;
  if(!confirm('이 기록을 지울까요?'))return;
  u.history.splice(i,1);
  try{if(typeof flushSync==='function')flushSync();}catch(e){}
  var sel=document.getElementById('detail-attend-term');if(sel)delete sel.dataset.uid;
  renderPastList();renderDetailAttend();
}
/* 학생카드 · 출석 기록 (학년도별) */
function _termLabel(h){
  if(h.term)return h.term;
  return (h.year?h.year+'학년도':'지난 기록');
}
function _termRange(h){
  var f=(h.from||'').replace(/-/g,'.').slice(2), t=(h.to||'').replace(/-/g,'.').slice(2);
  return (f&&t)?(f+' ~ '+t):'';
}
/* 학생카드가 열려 있을 때만 안전하게 갱신 */
/* 학생카드 목록: 지금 고른 학년 필터를 유지한 채 갱신 */
var _lastStudentFilter='all';
function _syncStudentCards(){
  try{
    var el=document.getElementById('student-card-list');
    if(!el||!el.offsetParent)return;
    renderStudentCards(_lastStudentFilter||'all');
  }catch(e){}
}
function _syncDetailScreen(){
  try{
    var sc=document.getElementById('screen-student-detail');
    if(!sc||!sc.classList.contains('active'))return;
    var u=pendingList.find(function(x){return x.id===currentDetailStudentId;});
    if(!u)return;
    renderDetailAttend();
    if(typeof renderDetailLetters==='function')renderDetailLetters(u);
    if(typeof renderDetailCoupons==='function')renderDetailCoupons(u);
  }catch(e){}
}
function renderDetailAttend(){
  var el=document.getElementById('detail-attend');if(!el)return;
  var u=pendingList.find(function(x){return x.id===currentDetailStudentId;});
  if(!u){el.innerHTML='';return;}
  var hist=(u.history||[]).slice().reverse();
  var sel=document.getElementById('detail-attend-term');
  var curLabel=((appConfig&&appConfig.termStart)?appConfig.termStart.slice(0,4):String(new Date().getFullYear()))+'학년도';
  if(sel&&!sel.dataset.uid){
    sel.innerHTML='<option value="now">'+curLabel+' (현재)</option>'
      +hist.map(function(h,i){return '<option value="'+i+'">'+_esc(_termLabel(h))+'</option>';}).join('');
    sel.dataset.uid=u.id;
  }
  var pick=sel?sel.value:'now';

  /* 지난 학년도 — 보관된 기록 그대로 */
  if(pick!=='now'){
    var h=hist[parseInt(pick,10)];
    if(!h){el.innerHTML='';return;}
    var wk=(h.weeks||[]).slice().sort().reverse(), hw=h.halfWeeks||[];
    el.innerHTML='<div class="card" style="padding:14px">'
      +'<div style="display:flex;gap:6px;margin-bottom:12px">'
        +'<div style="flex:1;text-align:center;background:var(--bg);border-radius:10px;padding:8px 2px"><div style="font-size:16px;font-weight:800">'+(h.attendTotal||0)+'</div><div style="font-size:10px;color:var(--text-light);margin-top:2px">출석</div></div>'
        +'<div style="flex:1;text-align:center;background:var(--bg);border-radius:10px;padding:8px 2px"><div style="font-size:13px;font-weight:800;color:var(--primary)">'+_esc(h.grade||'-')+'</div><div style="font-size:10px;color:var(--text-light);margin-top:2px">학년</div></div>'
        +'<div style="flex:1;text-align:center;background:var(--bg);border-radius:10px;padding:8px 2px"><div style="font-size:13px;font-weight:800">'+_esc(h.level||'-')+'</div><div style="font-size:10px;color:var(--text-light);margin-top:2px">등급</div></div>'
      +'</div>'
      +(h.manual?'<div style="font-size:11px;color:var(--text-light);text-align:center;padding:8px 0">앱 도입 전 기록 · 총 횟수만 보관돼요</div>':'')
      +(wk.length?'<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">'+wk.map(function(w){
          var d=w.split('-'),isH=hw.indexOf(w)>=0;
          return '<div style="text-align:center"><div style="background:'+(isH?'var(--yellow-light)':'var(--mint-light)')+';color:'+(isH?'#B37A00':'#2D9E8F')+';border-radius:9px;padding:7px 0;font-size:14px;font-weight:800;line-height:1">'+(isH?'◐':'○')+'</div><div style="font-size:9px;color:var(--text-light);margin-top:3px">'+(+d[1])+'/'+(+d[2])+'</div></div>';
        }).join('')+'</div>':'<div style="font-size:12px;color:var(--text-light);text-align:center;padding:10px 0">출석한 주가 없어요</div>')
      +(_termRange(h)?'<div style="font-size:10px;color:var(--text-light);text-align:center;margin-top:9px">'+_esc(_termRange(h))+' · 보관된 기록</div>':'')
      +'</div>';
    return;
  }

  /* 현재 학년도 */
  var weeks=getSaturdays(60);
  var att=u.attendedWeeks||[], half=u.halfWeeks||[];
  var term=(appConfig&&appConfig.termStart)||'';
  var start=[u.joinedAt||'',term].filter(Boolean).sort().pop()||'';   /* 가입일이 곧 시작점 */
  weeks=weeks.filter(function(w){return (!start||w>=start)&&w<=toDateStr(new Date());});
  var cnt={o:0,h:0,x:0,v:0};
  if(!weeks.length){
    el.innerHTML='<div class="card" style="padding:20px;text-align:center;font-size:12px;color:var(--text-light)">아직 출석 기록이 시작되지 않았어요'
      +(start?'<div style="font-size:11px;margin-top:5px">'+_esc(start)+'부터 집계돼요</div>':'')+'</div>';
    return;
  }
  var cells=weeks.map(function(w){
    var d=w.split('-'), lab=(+d[1])+'/'+(+d[2]);
    var vac=isVacationDate(w)||isEduVacation(w);
    var st,bg,fg,mark;
    if(vac){st='v';bg='var(--bg)';fg='var(--text-light)';mark='–';}
    else if(att.indexOf(w)>=0&&half.indexOf(w)>=0){st='h';bg='var(--yellow-light)';fg='#B37A00';mark='◐';}
    else if(att.indexOf(w)>=0){st='o';bg='var(--mint-light)';fg='#2D9E8F';mark='○';}
    else{st='x';bg='var(--coral-light)';fg='#D95F50';mark='✕';}
    cnt[st]++;
    var can=(G.role==='teacher'&&st!=='v');
    var ev=can?(' onpointerdown="attPressStart(this,\''+w+'\')" onpointerup="attPressCancel()" onpointerleave="attPressCancel()" onpointercancel="attPressCancel()" oncontextmenu="return false"'):'';
    var ed=(u.attendEdits||{})[w];
    return '<div style="text-align:center"><div class="att-cell"'+ev+' style="position:relative;background:'+bg+';color:'+fg+';border-radius:9px;padding:7px 0;font-size:14px;font-weight:800;line-height:1'+(can?';cursor:pointer':'')+'">'+mark
      +(ed?'<span style="position:absolute;top:1px;right:3px;font-size:8px;color:var(--text-light)">✎</span>':'')+'</div>'
      +'<div style="font-size:9px;color:var(--text-light);margin-top:3px">'+lab+'</div></div>';
  }).join('');
  var streak=(typeof computeStreak==='function')?computeStreak(u):0;
  var rate=(cnt.o+cnt.h+cnt.x)?Math.round((cnt.o+cnt.h*0.5)/(cnt.o+cnt.h+cnt.x)*100):0;
  el.innerHTML='<div class="card" style="padding:14px">'
    +'<div style="display:flex;gap:6px;margin-bottom:12px">'
      +'<div style="flex:1;text-align:center;background:var(--bg);border-radius:10px;padding:8px 2px"><div style="font-size:16px;font-weight:800;color:var(--text)">'+cnt.o+'</div><div style="font-size:10px;color:var(--text-light);margin-top:2px">출석</div></div>'
      +'<div style="flex:1;text-align:center;background:var(--bg);border-radius:10px;padding:8px 2px"><div style="font-size:16px;font-weight:800;color:var(--primary)">'+streak+'</div><div style="font-size:10px;color:var(--text-light);margin-top:2px">연속 주</div></div>'
      +'<div style="flex:1;text-align:center;background:var(--bg);border-radius:10px;padding:8px 2px"><div style="font-size:16px;font-weight:800;color:var(--text)">'+rate+'%</div><div style="font-size:10px;color:var(--text-light);margin-top:2px">출석률</div></div>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">'+cells+'</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:11px;font-size:10px;color:var(--text-light)">'
      +'<span>○ 출석 '+cnt.o+'</span><span>◐ 반출석 '+cnt.h+'</span><span>✕ 결석 '+cnt.x+'</span><span>– 방학 '+cnt.v+'</span>'
    +'</div>'
    +(G.role==='teacher'?'<div style="font-size:10px;color:var(--text-light);text-align:center;margin-top:9px">칸을 <b>길게 눌러</b> 출석·반일·결석을 고를 수 있어요</div>':'')
    +(start?'<div style="font-size:10px;color:var(--text-light);text-align:center;margin-top:4px">'+_esc(start)+'부터 집계</div>':'')
    +(function(){var e=u.attendEdits||{},ks=Object.keys(e).sort().reverse().slice(0,3);return ks.length?('<div style="border-top:1px dashed var(--border-light);margin-top:10px;padding-top:8px;font-size:10px;color:var(--text-light);line-height:1.7">✎ 수정 기록<br>'+ks.map(function(k){var d=k.split('-');return (+d[1])+'/'+(+d[2])+' · '+_esc(e[k].by||'')+' ('+_esc(e[k].at||'')+')';}).join('<br>')+'</div>'):'';})()
    +'</div>';
}
function openStudentDetail(sid){const u=pendingList.find(u=>u.id===sid);if(!u)return;currentDetailStudentId=sid;const GRADE={m1:'중1',m2:'중2',m3:'중3',h:'고등부'};const GCHIP={m1:'<span class="grade-m1">중1</span>',m2:'<span class="grade-m2">중2</span>',m3:'<span class="grade-m3">중3</span>',h:'<span class="grade-h">고등</span>'};document.getElementById('detail-student-name').textContent=u.name;document.getElementById('detail-avatar').textContent=u.name.charAt(0);document.getElementById('detail-name-full').textContent=u.name+' '+u.baptism+crownMark(u);document.getElementById('detail-grade-badge').innerHTML=GCHIP[u.gradeKey]||'';document.getElementById('detail-baptism').textContent=u.baptism||'-';document.getElementById('detail-birth').textContent=u.birthMonth&&u.birthDay?u.birthMonth+'월 '+u.birthDay+'일':'-';document.getElementById('detail-grade').textContent=u.gradeLabel||GRADE[u.gradeKey]||'-';const gradeTeachers=pendingList.filter(t=>t.approved&&t.role==='teacher'&&!t.hidden&&t.teacherType===u.gradeKey);const fullTeachers=pendingList.filter(t=>t.approved&&t.role==='teacher'&&!t.hidden&&(t.teacherType==='principal'));document.getElementById('detail-teacher').textContent=gradeTeachers.length?gradeTeachers.map(t=>t.name+' '+t.baptism).join(', '):(fullTeachers.length?fullTeachers.map(t=>t.name+' '+t.baptism).join(', '):'미지정');document.getElementById('teacher-memo').value=u.memo||'';const myDiaries=diaryData.filter(d=>d.studentId===u.id&&canViewDiary(d,u));const dEl=document.getElementById('detail-diary-list');if(dEl)dEl.innerHTML=myDiaries.length?myDiaries.map(d=>`<div class="diary-card"><div style="font-size:12px;font-weight:700;margin-bottom:4px">${d.title||'무제'}</div><div style="font-size:12px;color:var(--text-sub)">${d.content}</div>${(d.comments&&d.comments.length)?`<div style="margin-top:8px;padding-top:6px;border-top:1px solid var(--border-light);display:flex;flex-direction:column;gap:6px">${d.comments.map(c=>`<div style="font-size:11px;line-height:1.5"><strong onclick="openProfileView('${c.authorId||''}')" style="color:var(--primary-dark);cursor:pointer">${c.role==='student'?'🙋':'👨‍🏫'} ${c.author}</strong> <span style="color:var(--text-sub)">${c.text}</span></div>`).join('')}</div>`:''}<div style="display:flex;gap:6px;margin-top:8px"><input class="form-input" type="text" id="diary-reply-${d.id}" placeholder="답장 남기기..." style="flex:1;padding:8px 10px;font-size:12px" onkeydown="if(event.key==='Enter')submitDiaryReply('${d.id}','${u.id}')"><button class="btn btn-sm" style="background:var(--primary);color:white" onclick="submitDiaryReply('${d.id}','${u.id}')">전송</button></div></div>`).join(''):'<div class="empty" style="padding:24px"><div class="empty-emoji" style="font-size:28px">📖</div><div class="empty-title" style="font-size:13px">아직 다이어리가 없어요</div></div>';renderDetailCoupons(u);try{attPressCancel();var _s=document.getElementById('detail-attend-term');if(_s)delete _s.dataset.uid;renderDetailAttend();}catch(e){}goScreen('student-detail');}
function submitDiaryReply(did,sid){const input=document.getElementById('diary-reply-'+did);const text=(input.value||'').trim();if(!text)return;const d=diaryData.find(d=>d.id===did);if(!d)return;if(!d.comments)d.comments=[];d.comments.push({author:G.displayName,authorId:G.id,role:'teacher',text,time:'방금',ts:Date.now()});try{if(window.FB&&FB.enabled())FB.save('diaries',d.id,d);}catch(e){}notifications.unshift({pushed:false,id:'nt'+Date.now(),text:`💬 ${G.name} 선생님이 다이어리에 답장을 남겼어요`,time:'방금',ts:Date.now(),readBy:[],forStudentId:sid,tap:{type:'diary-reply',did:d.id}});updateNotifDot();input.value='';openStudentDetail(sid);showToast('답장을 남겼어요');}

let calEvents=[],selectedCalDate=toDateStr(new Date());   /* 일정 화면은 오늘이 선택된 상태로 시작 */
window._evReady=false;
/* ══ 주간 성가·전례 ══ */
var HYMN_ROWS=['입당','봉헌','성체1','성체2','파견'];
function hymnFor(dateStr){return (hymnData||[]).find(function(h){return h&&h.date===dateStr;})||null;}
function _hymnYear(){return (typeof calYear!=='undefined')?calYear:new Date().getFullYear();}
var hymnYear=new Date().getFullYear(), hymnMonth=new Date().getMonth();
/* 그 달의 토요일 목록 */
function hymnSatsOf(y,m){
  var out=[],d=new Date(y,m,1);
  while(d.getMonth()===m){ if(d.getDay()===6)out.push(y+'-'+pad2(m+1)+'-'+pad2(d.getDate())); d.setDate(d.getDate()+1); }
  return out;
}
function openHymnPage(){var n=new Date();hymnYear=n.getFullYear();hymnMonth=n.getMonth();renderHymnGrid();openModal('hymn-modal');}
function hymnMonthShift(d){hymnMonth+=d;if(hymnMonth>11){hymnMonth=0;hymnYear++;}else if(hymnMonth<0){hymnMonth=11;hymnYear--;}renderHymnGrid();}
function renderHymnGrid(){
  var lb=document.getElementById('hymn-month-label');
  if(lb)lb.textContent=hymnYear+'년 '+(hymnMonth+1)+'월';
  var el=document.getElementById('hymn-grid');if(!el)return;
  var sats=hymnSatsOf(hymnYear,hymnMonth);
  el.innerHTML=sats.map(function(ds){
    var h=(_hymnBuf&&_hymnBuf[ds])||hymnFor(ds)||{items:{},label:'',note:'',teuksong:''};
    var d=ds.split('-');
    return '<div class="card" style="padding:13px 14px;margin-bottom:10px">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">'
        +'<span style="font-size:14px;font-weight:800;flex-shrink:0">'+(+d[1])+'월 '+(+d[2])+'일</span>'
        +'<div style="flex:1;font-size:12px;padding:6px 9px;color:var(--text-sub);font-weight:700;background:var(--bg);border-radius:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(_dayLabel(ds)?_esc(_dayLabel(ds)):'<span style=\"color:var(--text-light);font-weight:400\">전례시기 (연간일정에서 입력)</span>')+'</div>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">'
      + HYMN_ROWS.map(function(k){
          return '<div><div style="font-size:10px;color:var(--text-light);text-align:center;margin-bottom:3px">'+k+'</div>'
            +'<input class="form-input" inputmode="numeric" style="text-align:center;padding:7px 2px;font-size:13px;font-weight:700" value="'+_esc(h.items[k]||'')+'" oninput="setHymn(\''+ds+'\',\''+k+'\',this.value)"></div>';
        }).join('')
      +'</div>'
      +'<div style="display:flex;gap:6px;margin-top:7px">'
        +'<input class="form-input" style="flex:1;font-size:12px;padding:6px 9px" placeholder="특송" value="'+_esc(h.teuksong||'')+'" oninput="setHymn(\''+ds+'\',\'teuksong\',this.value)">'
        +'<input class="form-input" style="flex:1;font-size:12px;padding:6px 9px" placeholder="비고 (예: 여름 캠프)" value="'+_esc(h.note||'')+'" oninput="setHymn(\''+ds+'\',\'note\',this.value)">'
      +'</div>'
      +'</div>';
  }).join('')||'<div class="empty" style="padding:24px"><div class="empty-title" style="font-size:13px">이 달에는 토요일이 없어요</div></div>';
}
var _hymnBuf=null;   /* 저장 전 임시 보관 */
function _hymnEntry(ds){
  if(!_hymnBuf)_hymnBuf={};
  if(!_hymnBuf[ds]){
    var o=hymnFor(ds);
    _hymnBuf[ds]=o?{label:o.label||'',items:Object.assign({},o.items||{}),note:o.note||'',teuksong:o.teuksong||''}
                  :{label:'',items:{},note:'',teuksong:''};
  }
  return _hymnBuf[ds];
}
function setHymn(ds,key,val){
  var h=_hymnEntry(ds);
  if(key==='label')h.label=val;
  else if(key==='note')h.note=val;
  else if(key==='teuksong')h.teuksong=val;
  else{if(val.trim())h.items[key]=val.trim();else delete h.items[key];}
  var b=document.getElementById('hymn-dirty');if(b)b.style.display='';
}
function _dayLabel(ds){
  if(_litBuf&&_litBuf[ds]&&_litBuf[ds].label)return _litBuf[ds].label;
  if(_hymnBuf&&_hymnBuf[ds]&&_hymnBuf[ds].label)return _hymnBuf[ds].label;
  var l=(typeof litFor==='function')?litFor(ds):null;if(l&&l.label)return l.label;
  var h=hymnFor(ds);if(h&&h.label)return h.label;
  return '';
}
function _propagateLabel(ds,label,toArr,idpfx,extra){
  var t=(toArr||[]).find(function(x){return x&&x.date===ds;});
  if(!t){if(!label)return;t=Object.assign({id:idpfx+ds,date:ds},extra||{});toArr.push(t);}
  t.label=label||'';
}
function saveHymnMonth(){
  if(_hymnBuf){
    Object.keys(_hymnBuf).forEach(function(ds){
      var b=_hymnBuf[ds], h=hymnFor(ds);
      if(!h){h={id:'hy'+ds,date:ds,items:{}};hymnData.push(h);}
      h.label=b.label||'';h.items=b.items;h.note=b.note;h.teuksong=b.teuksong;
    });
    _hymnBuf=null;
  }
  try{if(typeof flushSync==='function')flushSync();}catch(e){}
  try{renderDeptWeekInfo();}catch(e){}
  var d=document.getElementById('hymn-dirty');if(d)d.style.display='none';
  showToast('🎵 '+(hymnMonth+1)+'월 성가를 저장했어요');
}
function closeHymnPage(){
  if(_hymnBuf&&!confirm('저장하지 않은 내용이 있어요. 그냥 닫을까요?'))return;
  _hymnBuf=null;closeModal('hymn-modal');
}
/* 표를 이미지로 — 제목/머리글/본문을 깔끔한 격자로 */
function downloadHymnImage(){
  var sats=hymnSatsOf(hymnYear,hymnMonth);
  if(!sats.length){showToast('이 달에는 토요일이 없어요');return;}
  var cv=document.getElementById('hymn-canvas'),ctx=cv.getContext('2d');
  var S=2, F="'Noto Sans KR',-apple-system,sans-serif";
  var PAD=22, HEAD=54;                    /* 바깥 여백 / 제목 영역 */
  var LW=86, CW=132;                      /* 항목 열 / 주차 열 */
  var HR1=32, HR2=30, BR=40;              /* 주일명 / 날짜 / 본문 행 */
  var n=sats.length;
  var TW=LW+CW*n, TH=HR1+HR2+BR*HYMN_ROWS.length;
  var W=TW+PAD*2, H=HEAD+TH+PAD;
  cv.width=W*S; cv.height=H*S;
  ctx.setTransform(S,0,0,S,0,0);
  ctx.textAlign='center'; ctx.textBaseline='middle';

  /* 배경 */
  ctx.fillStyle='#FFFFFF'; ctx.fillRect(0,0,W,H);

  /* 제목 */
  ctx.fillStyle='#1A2340'; ctx.font='bold 20px '+F;
  ctx.fillText(hymnYear+'년 '+(hymnMonth+1)+'월 중고등부 미사 성가번호', W/2, PAD+13);
  ctx.strokeStyle='#2FA595'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.moveTo(W/2-46,PAD+32); ctx.lineTo(W/2+46,PAD+32); ctx.stroke();

  var X0=PAD, Y0=HEAD;
  var colX=function(i){return X0+LW+CW*i;};
  var rowY=function(i){return Y0+HR1+HR2+BR*i;};

  /* 머리글 배경 */
  ctx.fillStyle='#EAF5F3';
  ctx.fillRect(X0,Y0,TW,HR1+HR2);
  ctx.fillStyle='#F5F8FF';
  ctx.fillRect(X0,Y0+HR1+HR2,LW,BR*HYMN_ROWS.length);

  /* 머리글 글자 */
  sats.forEach(function(ds,i){
    var h=hymnFor(ds)||{items:{},label:'',note:''};
    var d=ds.split('-');
    ctx.fillStyle='#1E7D70'; ctx.font='bold 13px '+F;
    (function(){var _t=_dayLabel(ds)||h.label||'';if(!_t)return;var _fs=17,_mx=CW-14;ctx.font='700 '+_fs+'px "Noto Sans KR",sans-serif';while(ctx.measureText(_t).width>_mx&&_fs>10){_fs--;ctx.font='700 '+_fs+'px "Noto Sans KR",sans-serif';}if(ctx.measureText(_t).width>_mx){var _s=_t;while(_s.length>1&&ctx.measureText(_s+'…').width>_mx)_s=_s.slice(0,-1);_t=_s+'…';}ctx.fillText(_t, colX(i)+CW/2, Y0+HR1/2);})();
    ctx.fillStyle='#5A6A8A'; ctx.font='12px '+F;
    ctx.fillText((+d[1])+'월 '+(+d[2])+'일', colX(i)+CW/2, Y0+HR1+HR2/2);
  });

  /* 항목 이름 */
  ctx.fillStyle='#5A6A8A'; ctx.font='bold 13px '+F;
  HYMN_ROWS.forEach(function(k,r){ ctx.fillText(k, X0+LW/2, rowY(r)+BR/2); });

  /* 값 */
  sats.forEach(function(ds,i){
    var h=hymnFor(ds)||{items:{},label:'',note:''};
    var any=HYMN_ROWS.some(function(k){return h.items[k];});
    if(any){
      ctx.fillStyle='#1A2340'; ctx.font='bold 16px '+F;
      HYMN_ROWS.forEach(function(k,r){ if(h.items[k])ctx.fillText(h.items[k], colX(i)+CW/2, rowY(r)+BR/2); });
      if(h.teuksong){ ctx.fillStyle='#D95F50'; ctx.font='11px '+F;
        ctx.fillText('특송 '+h.teuksong, colX(i)+CW/2, rowY(HYMN_ROWS.length-1)+BR-9); }
    }else if(h.note){
      /* 캠프 등 — 본문 전체를 하나로 */
      ctx.fillStyle='#FFF7F5'; ctx.fillRect(colX(i),rowY(0),CW,BR*HYMN_ROWS.length);
      ctx.fillStyle='#D95F50'; ctx.font='bold 15px '+F;
      ctx.fillText(h.note, colX(i)+CW/2, rowY(0)+BR*HYMN_ROWS.length/2);
    }
  });

  /* 격자 */
  ctx.strokeStyle='#D7E0EE'; ctx.lineWidth=1;
  for(var r=1;r<HYMN_ROWS.length;r++){
    var y=rowY(r)+0.5;
    sats.forEach(function(ds,i){
      var h=hymnFor(ds)||{items:{}};
      var any=HYMN_ROWS.some(function(k){return h.items[k];});
      if(any){ctx.beginPath();ctx.moveTo(colX(i),y);ctx.lineTo(colX(i)+CW,y);ctx.stroke();}
    });
    ctx.beginPath();ctx.moveTo(X0,y);ctx.lineTo(X0+LW,y);ctx.stroke();
  }
  for(var c=0;c<=n;c++){ var x=colX(c)+0.5; ctx.beginPath();ctx.moveTo(x,Y0);ctx.lineTo(x,Y0+TH);ctx.stroke(); }
  ctx.beginPath();ctx.moveTo(X0+LW+0.5,Y0);ctx.lineTo(X0+LW+0.5,Y0+TH);ctx.stroke();

  /* 굵은 구분선 + 바깥 테두리 */
  ctx.strokeStyle='#9FB3C8'; ctx.lineWidth=1.4;
  [Y0+HR1, Y0+HR1+HR2].forEach(function(y){ ctx.beginPath();ctx.moveTo(X0,y+0.5);ctx.lineTo(X0+TW,y+0.5);ctx.stroke(); });
  ctx.strokeRect(X0+0.5,Y0+0.5,TW,TH);

  try{ showImgPreview(cv,hymnYear+'년 '+(hymnMonth+1)+'월 성가번호',hymnYear+'년_'+(hymnMonth+1)+'월_성가번호.png'); }
  catch(e){showToast('이미지를 만들지 못했어요');}
}
var _imgCv=null,_imgName='표.png';
function showImgPreview(cv,title,fname){
  _imgCv=cv;_imgName=fname;
  var im=document.getElementById('hymn-img');if(im)im.src=cv.toDataURL('image/png');
  var t=document.getElementById('hymn-img-title');if(t)t.textContent=title;
  var sb=document.getElementById('hymn-share-btn');
  if(sb)sb.style.display=(navigator.canShare&&navigator.share)?'':'none';
  openModal('hymn-img-modal');
}
function _hymnFileName(){return _imgName;}
function _hymnBlob(cb){
  var cv=_imgCv;
  if(!cv||!cv.width){showToast('먼저 표 보기를 눌러주세요');return;}
  try{ cv.toBlob(function(b){ b?cb(b):showToast('이미지를 만들지 못했어요'); },'image/png'); }
  catch(e){ showToast('이미지를 만들지 못했어요'); }
}
function saveHymnImage(){
  _hymnBlob(function(b){
    var url=URL.createObjectURL(b), a=document.createElement('a');
    a.href=url; a.download=_hymnFileName();
    document.body.appendChild(a); a.click();
    setTimeout(function(){URL.revokeObjectURL(url);a.remove();},1500);
    showToast('📥 저장했어요');
  });
}
function shareHymnImage(){
  _hymnBlob(function(b){
    try{
      var f=new File([b],_hymnFileName(),{type:'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[f]})){
        navigator.share({files:[f],title:hymnYear+'년 '+(hymnMonth+1)+'월 성가번호'}).catch(function(){});
      }else{ saveHymnImage(); }
    }catch(e){ saveHymnImage(); }
  });
}
/* ══ 전례: 한 달치 편집 + 이미지 ══ */
var LIT_ROWS=[['reading1','제1독서'],['reading2','제2독서'],['gospel','복음']];
var LIT_SERVE=[['comment','해설'],['read1','독서1'],['read2','독서2'],['pray1','보편지향기도1'],['pray2','보편지향기도2'],['pray3','보편지향기도3'],['pray4','보편지향기도4']];
function _litStudents(){return (pendingList||[]).filter(function(u){return u.approved&&u.role==='student'&&!u.hidden&&!u.graduated;}).sort(function(a,b){return (a.name||'').localeCompare(b.name||'');});}
function _litStuName(sid){var u=(pendingList||[]).find(function(x){return x.id===sid;});return u?(u.name+(u.baptism?' '+u.baptism:'')):'';}
function _litStuOptions(sel){return '<option value="">— 미배정 —</option>'+_litStudents().map(function(u){return '<option value="'+u.id+'"'+(u.id===sel?' selected':'')+'>'+_esc(u.name+' '+(u.baptism||''))+(u.gradeLabel?' ('+_esc(u.gradeLabel)+')':'')+'</option>';}).join('');}
function _litRolesOf(ds){var e=(_litBuf&&_litBuf[ds])||litFor(ds)||{};return e.roles||{};}
function _litRosterCount(ds){var r=_litRolesOf(ds);return LIT_SERVE.reduce(function(n,x){return n+(r[x[0]]?1:0);},0);}
var litYear=new Date().getFullYear(), litMonth=new Date().getMonth();
function litFor(ds){return (litData||[]).find(function(x){return x&&x.date===ds;})||null;}
function openLitPage(){var n=new Date();litYear=n.getFullYear();litMonth=n.getMonth();renderLitGrid();openModal('lit-modal');}
function litMonthShift(d){litMonth+=d;if(litMonth>11){litMonth=0;litYear++;}else if(litMonth<0){litMonth=11;litYear--;}renderLitGrid();}
function renderLitGrid(){try{renderLitLockUI();}catch(e){}try{_hydrateYP();}catch(e){}
  var lb=document.getElementById('lit-month-label');
  if(lb)lb.textContent=litYear+'년 '+(litMonth+1)+'월';
  var el=document.getElementById('lit-grid');if(!el)return;
  var sats=hymnSatsOf(litYear,litMonth);
  el.innerHTML=sats.map(function(ds){
    var h=(_litBuf&&_litBuf[ds])||litFor(ds)||{};
    var d=ds.split('-');
    return '<div class="card" style="padding:13px 14px;margin-bottom:10px">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">'
        +'<span style="font-size:14px;font-weight:800;flex-shrink:0">'+(+d[1])+'월 '+(+d[2])+'일</span>'
        +'<div style="flex:1;font-size:12px;padding:6px 9px;color:var(--text-sub);font-weight:700;background:var(--bg);border-radius:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(_dayLabel(ds)?_esc(_dayLabel(ds)):'<span style=\"color:var(--text-light);font-weight:400\">전례시기 (연간일정에서 입력)</span>')+'</div>'
      +'</div>'
      + LIT_ROWS.map(function(r){
          return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'
            +'<span style="font-size:11px;color:var(--text-light);font-weight:700;width:52px;flex-shrink:0">'+r[1]+'</span>'
            +'<input class="form-input" style="flex:1;font-size:12px;padding:6px 9px" placeholder="예: 이사 55,1-3" value="'+_esc(h[r[0]]||'')+'" oninput="setLit(\''+ds+'\',\''+r[0]+'\',this.value)"></div>';
        }).join('')
      +'<input class="form-input" style="margin-top:3px;font-size:12px;padding:6px 9px" placeholder="비고 (예: 여름 캠프)" value="'+_esc(h.note||'')+'" oninput="setLit(\''+ds+'\',\'note\',this.value)">'
      + _litRosterHtml(ds)
      +'</div>';
  }).join('')||'<div class="empty" style="padding:24px"><div class="empty-title" style="font-size:13px">이 달에는 토요일이 없어요</div></div>';
}
function _litBadgeHtml(n,tot){return n?'<span style="font-size:10px;font-weight:800;color:#fff;background:var(--primary);border-radius:9px;padding:1px 7px">'+n+'/'+tot+'</span>':'<span style="font-size:10px;font-weight:700;color:var(--text-light)">미배정</span>';}
function _litRosterHtml(ds){
  return '<button type="button" onclick="openLitRoster(\''+ds+'\')" style="display:flex;align-items:center;gap:7px;width:100%;margin-top:9px;padding:8px 10px;background:var(--bg);border:1px solid var(--border-light);border-radius:9px;cursor:pointer;font-family:inherit">'
    +'<span style="font-size:12px;font-weight:700;color:var(--text-sub)">👥 학생 배정</span>'
    +'<span id="litbadge-'+ds+'">'+_litBadgeHtml(_litRosterCount(ds),LIT_SERVE.length)+'</span>'
    +'<span style="margin-left:auto;font-size:13px;color:var(--text-light)">›</span>'
  +'</button>';
}
function openLitRoster(ds){
  var el=document.getElementById('lit-roster-body');if(!el)return;
  var d=ds.split('-');
  document.getElementById('lit-roster-title').textContent='👥 '+(+d[1])+'월 '+(+d[2])+'일 학생 배정';
  var roles=_litRolesOf(ds);
  el.innerHTML=LIT_SERVE.map(function(r){
    return '<div class="form-group" style="margin-bottom:10px"><label class="form-label" style="font-size:12px">'+r[1]+'</label>'
      +'<select class="form-select" onchange="setLitRole(\''+ds+'\',\''+r[0]+'\',this.value)">'+_litStuOptions(roles[r[0]]||'')+'</select></div>';
  }).join('')
  +'<button class="btn btn-primary" style="width:100%;margin-top:4px" onclick="sendLitNotify(\''+ds+'\')">📢 배정 학생에게 알림 보내기</button>';
  openModal('lit-roster-modal');
}
function _litRefreshBadge(ds){
  var el=document.getElementById('litbadge-'+ds);if(!el)return;
  el.innerHTML=_litBadgeHtml(_litRosterCount(ds),LIT_SERVE.length);
}
function setLitRole(ds,key,sid){
  var e=_litEntry(ds);
  if(!e.roles)e.roles={};
  if(sid)e.roles[key]=sid; else delete e.roles[key];
  var b=document.getElementById('lit-dirty');if(b)b.style.display='';
  _litRefreshBadge(ds);
}
function sendLitNotify(ds){
  /* 저장하지 않은 배정도 반영되도록 먼저 이 날짜를 litData에 커밋 */
  var buf=_litBuf&&_litBuf[ds];
  var h=litFor(ds);
  if(!h){h={id:'lt'+ds,date:ds};litData.push(h);}
  if(buf){h.label=buf.label;h.reading1=buf.reading1;h.reading2=buf.reading2;h.gospel=buf.gospel;h.note=buf.note;h.roles=Object.assign({},buf.roles||{});}
  var roles=h.roles||{};
  var assigned=LIT_SERVE.filter(function(r){return roles[r[0]];});
  if(!assigned.length){showToast('배정된 학생이 없어요');return;}
  /* 학생별로 맡은 역할을 모아서 1인 1알림 */
  var byStu={};
  assigned.forEach(function(r){var sid=roles[r[0]];(byStu[sid]=byStu[sid]||[]).push(r[1]);});
  var d=ds.split('-'), when=(+d[1])+'월 '+(+d[2])+'일';
  var cnt=0;
  Object.keys(byStu).forEach(function(sid){
    var u=(pendingList||[]).find(function(x){return x.id===sid;});
    if(!u)return;
    var roleTxt=byStu[sid].join(' · ');
    notifications.unshift({pushed:false,id:'nt'+Date.now()+'lit'+cnt+Math.random().toString(36).slice(2,5),
      text:'✝️ <b>'+when+'</b> 미사 전례 봉사 안내 — 이번 주 <b>'+_esc(roleTxt)+'</b>(을)를 맡았어요. 미리 준비해 주세요 🙏',
      time:'방금',ts:Date.now(),readBy:[],hiddenBy:[],forStudentId:sid,tap:{type:'attend'}});
    cnt++;
  });
  updateNotifDot();
  try{if(typeof flushSync==='function')flushSync();}catch(e){}
  var d2=document.getElementById('lit-dirty');
  if(!cnt){showToast('배정된 학생을 찾지 못했어요. 등록된 학생인지 확인해주세요');return;}
  showToast('📢 '+cnt+'명에게 전례 봉사 알림을 보냈어요');
}
var _litBuf=null;
function _litEntry(ds){
  if(!_litBuf)_litBuf={};
  if(!_litBuf[ds]){
    var o=litFor(ds)||{};
    _litBuf[ds]={label:o.label||'',reading1:o.reading1||'',reading2:o.reading2||'',gospel:o.gospel||'',note:o.note||'',roles:Object.assign({},o.roles||{})};
  }
  return _litBuf[ds];
}
function setLit(ds,key,val){
  _litEntry(ds)[key]=val;
  var b=document.getElementById('lit-dirty');if(b)b.style.display='';
}
function litLocked(){return appConfig.litLocked!==false;}
function toggleLitLock(){
  if(!_isFullAdmin()){showToast('교감·교무·관리자만 잠금을 바꿀 수 있어요');return;}
  var lock=litLocked();
  if(lock){
    appConfirm({icon:'unlock',title:'잠금을 해제할까요?',desc:'해제하면 연간계획을 편집·저장할 수 있어요.',okText:'해제'}).then(function(ok){if(!ok)return;appConfig.litLocked=false;showToast('🔓 잠금 해제됨 · 편집 가능');try{if(window.flushCfg)window.flushCfg();}catch(e){}try{renderLitLockUI();}catch(e){}try{renderYearPlan();}catch(e){}});return;
    appConfig.litLocked=false;showToast('🔓 잠금 해제됨 · 편집 가능');
  }else{ appConfig.litLocked=true;showToast('🔒 연간계획을 잠갔어요'); }
  try{if(window.flushCfg)window.flushCfg();}catch(e){}
  try{renderLitLockUI();}catch(e){}
  try{renderYearPlan();}catch(e){}
}
function renderLitLockUI(){var pb=document.getElementById('yp-paste-btn');if(pb)pb.style.display=_isFullAdmin()?'':'none';var t=document.getElementById('yp-lock-toggle');var lock=litLocked();if(t){t.style.display=_isFullAdmin()?'inline-flex':'none';t.setAttribute('aria-checked',lock?'false':'true');var sw=document.getElementById('yp-lock-switch');if(sw)sw.className='yp-switch'+(lock?'':' on');var lb=document.getElementById('yp-lock-label');if(lb)lb.textContent=lock?'잠금':'해제';}var n=document.getElementById('yp-lock-note');if(n)n.style.display=lock?'':'none';try{_ypDirtyUI();}catch(e){}}
function saveLitMonth(){
  if(!_isFullAdmin()){showToast('연간계획은 교감·교무·관리자만 수정할 수 있어요');return;}
  if(litLocked()){showToast('🔒 연간계획이 잠겨 있어요 · 잠금을 해제해주세요');return;}
  if(_litBuf){
    Object.keys(_litBuf).forEach(function(ds){
      var b=_litBuf[ds], h=litFor(ds);
      if(!h){h={id:'lt'+ds,date:ds};litData.push(h);}
      h.reading1=b.reading1;h.reading2=b.reading2;h.gospel=b.gospel;h.note=b.note;h.roles=Object.assign({},b.roles||{});
    });
    _litBuf=null;
  }
  try{if(typeof flushSync==='function')flushSync();}catch(e){}
  try{renderDeptWeekInfo();}catch(e){}
  var d=document.getElementById('lit-dirty');if(d)d.style.display='none';
  showToast('✝️ '+(litMonth+1)+'월 전례를 저장했어요');
}
function closeLitPage(){
  if(_litBuf&&!confirm('저장하지 않은 내용이 있어요. 그냥 닫을까요?'))return;
  _litBuf=null;closeModal('lit-modal');
}
/* 전례는 글이 길어 표보다 주별 목록이 읽기 좋음 */
function makeLitImage(){
  var sats=hymnSatsOf(litYear,litMonth);
  if(!sats.length){showToast('이 달에는 토요일이 없어요');return;}
  var cv=document.getElementById('lit-canvas'),ctx=cv.getContext('2d');
  var S=2,F="'Noto Sans KR',-apple-system,sans-serif";
  var W=560,PAD=24,HEAD=54,BLK=112,GAP=10;
  var H=HEAD+sats.length*(BLK+GAP)+PAD;
  cv.width=W*S;cv.height=H*S;ctx.setTransform(S,0,0,S,0,0);
  ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,W,H);
  ctx.textBaseline='middle';ctx.textAlign='center';
  ctx.fillStyle='#1A2340';ctx.font='bold 20px '+F;
  ctx.fillText(litYear+'년 '+(litMonth+1)+'월 중고등부 전례', W/2, PAD+13);
  ctx.strokeStyle='#2FA595';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(W/2-46,PAD+32);ctx.lineTo(W/2+46,PAD+32);ctx.stroke();
  var clip=function(t,max){t=String(t||'');if(ctx.measureText(t).width<=max)return t;
    while(t.length>1&&ctx.measureText(t+'…').width>max)t=t.slice(0,-1);return t+'…';};
  sats.forEach(function(ds,i){
    var h=litFor(ds)||{},d=ds.split('-');
    var y=HEAD+i*(BLK+GAP), x=PAD;
    ctx.fillStyle='#F7FAFF';ctx.fillRect(x,y,W-PAD*2,BLK);
    ctx.strokeStyle='#DDE5F5';ctx.lineWidth=1;ctx.strokeRect(x+0.5,y+0.5,W-PAD*2,BLK);
    ctx.fillStyle='#2FA595';ctx.fillRect(x,y,4,BLK);
    ctx.textAlign='left';
    ctx.fillStyle='#1A2340';ctx.font='bold 14px '+F;
    ctx.fillText((+d[1])+'월 '+(+d[2])+'일', x+18, y+21);
    if(h.label){ctx.fillStyle='#1E7D70';ctx.font='13px '+F;ctx.fillText(h.label, x+96, y+21);}
    var hasAny=LIT_ROWS.some(function(r){return h[r[0]];});
    if(hasAny){
      LIT_ROWS.forEach(function(r,ri){
        var ly=y+46+ri*24;
        ctx.fillStyle='#8A97B5';ctx.font='11px '+F;ctx.fillText(r[1], x+18, ly);
        ctx.fillStyle='#1A2340';ctx.font='13px '+F;
        ctx.fillText(clip(h[r[0]]||'-', W-PAD*2-96), x+80, ly);
      });
    }
    if(h.note){
      ctx.fillStyle='#D95F50';ctx.font='bold 14px '+F;
      if(hasAny)ctx.fillText(h.note, x+18, y+BLK-13);
      else{ctx.textAlign='center';ctx.fillText(h.note, W/2, y+BLK/2+8);ctx.textAlign='left';}
    }
  });
  try{ showImgPreview(cv, litYear+'년 '+(litMonth+1)+'월 전례', litYear+'년_'+(litMonth+1)+'월_전례.png'); }
  catch(e){showToast('이미지를 만들지 못했어요');}
}
function hymnCardHtml(dateStr,compact){
  var h=hymnFor(dateStr);if(!h)return '';
  var vals=HYMN_ROWS.filter(function(k){return h.items[k];});
  if(!vals.length&&!h.note)return '';
  if(compact){
    return '<div style="font-size:11px;color:var(--text-sub);margin-top:3px">🎵 '
      +(vals.length?vals.map(function(k){return k+' '+h.items[k];}).join(' · '):_esc(h.note))+'</div>';
  }
  return '<div class="card" style="margin-top:8px;padding:12px 14px">'
    +'<div style="font-size:12px;font-weight:800;margin-bottom:7px">🎵 성가'+(h.label?' <span style="font-weight:600;color:var(--text-light)">'+_esc(h.label)+'</span>':'')+'</div>'
    +(vals.length?'<div style="display:flex;flex-wrap:wrap;gap:6px">'+vals.map(function(k){
        return '<span style="background:var(--primary-light);color:var(--primary-dark);border-radius:8px;padding:4px 9px;font-size:12px;font-weight:700">'+k+' '+h.items[k]+'</span>';
      }).join('')+'</div>':'')
    +(h.note?'<div style="font-size:11px;color:var(--coral);margin-top:'+(vals.length?'7px':'0')+';font-weight:700">'+_esc(h.note)+'</div>':'')
    +'</div>';
}
/* 달력에 표시할 생일·축일 (학생·교사 모두) */
function bdayOn(dateStr){
  var d=dateStr.split('-'), m=+d[1], dd=+d[2];
  var list=(pendingList||[]).filter(function(u){return u.approved&&!u.hidden&&!u.graduated;});
  return {
    birth:list.filter(function(u){return +u.birthMonth===m&&+u.birthDay===dd;}),
    feast:list.filter(function(u){return +u.feastMonth===m&&+u.feastDay===dd;})
  };
}
function renderCalendar(){ensureWeeklyEvents();try{_gradeSync();}catch(e){}const el=document.getElementById('cal-days');const label=document.getElementById('cal-month-label');if(!el||!label)return;label.textContent=calYear+'년 '+(calMonth+1)+'월';const first=new Date(calYear,calMonth,1).getDay();const last=new Date(calYear,calMonth+1,0).getDate();const today=new Date();const ty=today.getFullYear(),tm=today.getMonth(),td=today.getDate();let html='';for(let i=0;i<first;i++)html+='<div></div>';for(let d=1;d<=last;d++){const isSun=(first+d-1)%7===0;const isToday=calYear===ty&&calMonth===tm&&d===td;const dateStr=calYear+'-'+pad2(calMonth+1)+'-'+pad2(d);const dayEvents=calEvents.filter(e=>e.date===dateStr&&(e.isRecurring||e.visibility!=='private'||e.authorId===G.id));const bf=bdayOn(dateStr);
    const dots=[];
    dayEvents.slice(0,3).forEach(e=>{dots.push(e.isRecurring?'var(--mint)':(e.visibility==='shared'?'var(--primary)':'var(--lavender)'));});
    if(bf.birth.length)dots.push('var(--coral)');
    if(bf.feast.length)dots.push('var(--gold)');
    if((reminderData||[]).some(function(r){return r.date===dateStr&&!r.done&&(r.shared||!r.ownerId||r.ownerId===G.id);}))dots.push('#F5A623');
    const extra=Math.max(0,dayEvents.length-3);
    const dotsHtml=dots.length?`<div style="display:flex;justify-content:center;gap:2px;margin-top:2px">${dots.map(c=>`<div style="width:5px;height:5px;border-radius:50%;background:${c}"></div>`).join('')}${extra?`<span style="font-size:8px;color:var(--text-light);line-height:5px">+${extra}</span>`:''}</div>`:'';html+=`<div class="cal-day${isToday?' today':''}${isSun?' sunday':''}${selectedCalDate===dateStr?' sel':''}" onclick="onCalDayClick('${dateStr}')"><span class="cal-day-num">${d}</span>${dotsHtml}</div>`;}el.innerHTML=html;if(selectedCalDate)renderCalDayEvents(selectedCalDate);}
function onCalDayClick(dateStr){selectedCalDate=dateStr;renderCalendar();renderCalDayEvents(dateStr);}
function renderCalDayEvents(dateStr){const el=document.getElementById('cal-event-list');if(!el)return;try{_hydrateYP();}catch(e){}const events=calEvents.filter(e=>e.date===dateStr&&(e.isRecurring||e.visibility!=='private'||e.authorId===G.id));const isFull=G.role==='teacher'&&(G.type==='principal'||G.type==='admin'||G.isAdmin);const isT=G.role==='teacher';const [y,m,d]=dateStr.split('-');const isSat=new Date(dateStr+'T12:00:00').getDay()===6;const isVac=isVacationDate(dateStr);const isEdu=isEduVacation(dateStr);const anyVac=isVac||isEdu;let html=`<div style="display:flex;align-items:center;justify-content:space-between;margin:10px 0 8px"><span style="font-size:13px;font-weight:800">${parseInt(m)}월 ${parseInt(d)}일 일정${isEdu?' <span class="chip chip-blue">📖 교리방학</span>':isVac?' <span class="chip chip-yellow">🏖️ 방학</span>':''}</span><span style="display:flex;gap:6px">${isFull&&isSat?`<button class="btn btn-sm" style="width:auto;background:${anyVac?'var(--bg)':'var(--yellow-light)'};color:${anyVac?'var(--text-sub)':'#9A6A00'};font-weight:700" onclick="setVacationDate('${dateStr}',${!anyVac})">${anyVac?'방학 해제':'🏖️ 방학 지정'}</button>`:''}</span></div>`;if(isSat){var _lp=litFor(dateStr)||{};var _ph=_dayLabel(dateStr);var _bits=[];if(_ph)_bits.push(['전례시기',_ph]);if(_lp.form)_bits.push(['교리',_lp.form]);if(_lp.progress)_bits.push(['진행',_lp.progress]);if(_bits.length){html+='<div '+(isT?'onclick="openYearPlan()" ':'')+'style="background:var(--primary-light);border-radius:10px;padding:10px 12px;margin-bottom:8px'+(isT?';cursor:pointer':'')+'"><div style="font-size:11px;font-weight:800;color:var(--primary-dark);margin-bottom:5px;display:flex;justify-content:space-between;align-items:center"><span>📋 연간 운영 계획</span>'+(isT?'<span style="font-weight:700;color:var(--primary)">전체 보기 ›</span>':'')+'</div>'+_bits.map(function(b){return '<div style="font-size:12px;display:flex;gap:6px;margin-top:2px"><span style="color:var(--text-light);width:52px;flex-shrink:0">'+b[0]+'</span><span style="font-weight:600;color:var(--text-sub)">'+_esc(b[1])+'</span></div>';}).join('')+'</div>';}}if(!events.length){html+='<div class="empty" style="padding:20px"><div class="empty-emoji" style="font-size:24px">📅</div><div class="empty-title" style="font-size:12px">등록된 일정이 없어요</div></div>';}else{html+=events.map(e=>{const teachers=getApprovedTeachers();const _R=_evResp(e);const yesCount=teachers.filter(t=>_R[t.id]==='yes').length;const noCount=teachers.filter(t=>_R[t.id]==='no').length;const noResp=teachers.filter(t=>!_R[t.id]);const myResp=_R[G.id];const isShared=e.visibility==='shared';const borderColor=e.isRecurring?'var(--mint)':(isShared?'var(--primary)':'var(--lavender)');const badge=e.isRecurring?'':(isShared?`<span class="chip chip-blue">👥 전체 공유</span>`:`<span class="chip chip-lavender">🔒 나만 보기</span>`);const _isPast=dateStr<toDateStr(new Date());
    let respHtml='';if((e.isRecurring||e.vote||e.visibility==='shared')&&G.role==='teacher'){respHtml=(_isPast?'':`<div style="display:flex;gap:6px;margin-top:10px">
        <button class="filter-chip${myResp==='yes'?' active':''}" onclick="setCalResponse('${e.id}','yes')">✅ 참석</button>
        <button class="filter-chip${myResp==='no'?' active':''}" onclick="setCalResponse('${e.id}','no')">❌ 불참</button>
      </div>`)+`<div style="display:flex;gap:6px;margin-top:9px">
        <button class="resp-cnt" onclick="openRespModal('${e.id}','yes')"><b>${yesCount}</b> ✅ 참석</button>
        <button class="resp-cnt" onclick="openRespModal('${e.id}','no')"><b>${noCount}</b> ❌ 불참</button>
        <button class="resp-cnt" onclick="openRespModal('${e.id}','none')"><b>${noResp.length}</b> ⏳ 미응답</button>
      </div>${(!_isPast&&isFull&&noResp.length)?`<button class="btn btn-sm" style="width:100%;margin-top:6px;background:var(--yellow-light);color:#9A6A00;font-weight:700" onclick="notifyUnrespondedTeachers()">🔔 미응답 ${noResp.length}명에게 투표 알림</button>`:''}`;}let checkHtml='';if(!e.isRecurring&&isShared){const checked=(e.checkedBy||[]).includes(G.id);checkHtml=`<div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:8px;border-top:1px solid var(--border-light)"><span style="font-size:10px;color:var(--text-light)">✅ 확인 ${((e.checkedBy||[]).length)}명</span><button class="btn btn-sm ${checked?'':'btn-outline'}" style="${checked?'background:var(--mint);color:white':''}" onclick="toggleCalCheck('${e.id}')">${checked?'✓ 확인함':'확인하기'}</button></div>`;}return `<div class="card" style="margin-bottom:8px;border-left:4px solid ${borderColor}"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div style="font-size:14px;font-weight:800">${e.title}</div>${badge?`<div style="margin-top:4px">${badge}</div>`:''}</div>${e.time?`<span style="font-size:11px;color:var(--text-light)">${e.time}</span>`:''}</div>${e.place?`<div style="font-size:11px;color:var(--text-sub);margin-top:4px">📍 ${e.place}</div>`:''}${e.content?`<div style="font-size:12px;color:var(--text-sub);margin-top:6px;line-height:1.5">${e.content}</div>`:''}${e.authorName&&!e.isRecurring?`<div style="font-size:10px;color:var(--text-light);margin-top:6px">작성자: ${e.authorName}${e.edited?' · 수정됨':''}</div>`:''}${canEditCal(e)?`<div style="display:flex;gap:6px;margin-top:8px"><button class="btn btn-sm btn-outline" style="width:auto;flex:1" onclick="openCalEditModal('${e.id}')">✏️ 수정</button><button class="btn btn-sm" style="width:auto;flex:1;background:var(--coral-light);color:#B0463A;font-weight:700" onclick="deleteCalEvent('${e.id}')">🗑️ 삭제</button></div>`:''}${respHtml}${checkHtml}</div>`;}).join('');}
  /* 그 날짜의 할 일도 함께 (일정 화면에서 추가한 게 바로 보이도록) */
  try{
    var _rms=(reminderData||[]).filter(function(r){
      return r.date===dateStr && (r.shared||!r.ownerId||r.ownerId===G.id);
    });
    if(_rms.length){
      html+='<div class="card" style="margin-top:8px;padding:12px 14px">'
        +'<div style="font-size:11px;font-weight:800;color:var(--text-sub);margin-bottom:8px">📌 할 일</div>'
        +_rms.map(function(r){
          return '<div style="display:flex;align-items:center;gap:10px;padding:5px 0'+(r.done?';opacity:.5':'')+'">'
            +'<input type="checkbox" '+(r.done?'checked':'')+' style="width:17px;height:17px;accent-color:var(--primary);flex-shrink:0" onchange="toggleReminder(\''+r.id+'\',this)">'
            +'<span style="flex:1;font-size:13px;font-weight:600;cursor:pointer'+(r.done?';text-decoration:line-through':'')+'" onclick="openReminderActions(\''+r.id+'\')">'+_esc(r.content||'')+'</span>'
            +(r.time?'<span style="font-size:11px;color:var(--text-light)">'+_esc(r.time)+'</span>':'')
            +'<button onclick="openReminderActions(\''+r.id+'\')" style="border:none;background:none;color:var(--text-light);font-size:15px;padding:2px 4px;cursor:pointer">⋯</button>'
            +'</div>';
        }).join('')
        +'</div>';
    }
  }catch(e){}
  try{
    var _bf=bdayOn(dateStr);
    if(_bf.birth.length||_bf.feast.length){
      var _chip=function(u,ic,bg,fg){return '<span style="display:inline-block;background:'+bg+';color:'+fg+';border-radius:20px;padding:4px 10px;font-size:12px;font-weight:700;margin:0 5px 5px 0">'+ic+' '+_esc(u.name+' '+(u.baptism||''))+'</span>';};
      html+='<div class="card" style="margin-top:8px;padding:12px 14px">'
        +(_bf.birth.length?('<div style="font-size:11px;font-weight:800;color:var(--text-sub);margin-bottom:6px">🎂 생일</div>'+_bf.birth.map(function(u){return _chip(u,'🎂','var(--coral-light)','#D95F50');}).join('')):'')
        +(_bf.feast.length?('<div style="font-size:11px;font-weight:800;color:var(--text-sub);margin:'+(_bf.birth.length?'8px':'0')+' 0 6px">✝️ 축일</div>'+_bf.feast.map(function(u){return _chip(u,'✝️','var(--gold-light)','#B37A00');}).join('')):'')
        +'</div>';
    }
  }catch(e){}
  const _d=dateStr.split('-');if(isT)html+='<button onclick="openCalAddModal(\''+dateStr+'\')" style="width:100%;margin-top:12px;border:1px dashed var(--border);background:var(--bg);border-radius:14px;padding:14px;font-family:\'Noto Sans KR\',sans-serif;font-size:13.5px;font-weight:700;color:var(--text-sub);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">'+(+_d[1])+'월 '+(+_d[2])+'일에 추가<span style="font-size:17px;line-height:1">＋</span></button>';el.innerHTML=html;}
let editingCalId=null;
function openCalAddModal(dateStr){editingCalId=null;const t=document.querySelector('#cal-event-modal .modal-title');if(t)t.textContent='📅 일정 등록';const b=document.getElementById('cal-ev-submit');if(b)b.textContent='등록하기';document.getElementById('cal-ev-title').value='';document.getElementById('cal-ev-date').value=dateStr||toDateStr(new Date());document.getElementById('cal-ev-time').value='';try{clearEventTime();}catch(e){}document.getElementById('cal-ev-place').value='';document.getElementById('cal-ev-content').value='';document.getElementById('cal-ev-visibility').value='shared';openModal('cal-event-modal');try{switchAddMode('event');}catch(e){}}
function canEditCal(e){ if(!e||e.isRecurring)return false; if(G.role!=='teacher')return false; return e.authorId===G.id || G.type==='principal' || G.type==='admin' || G.isAdmin; }
function openCalEditModal(eid){
  const e=calEvents.find(x=>x.id===eid); if(!e)return;
  if(!canEditCal(e)){showToast('작성자 또는 관리자만 수정할 수 있어요');return;}
  editingCalId=eid;
  const t=document.querySelector('#cal-event-modal .modal-title'); if(t)t.textContent='✏️ 일정 수정';
  const b=document.getElementById('cal-ev-submit'); if(b)b.textContent='수정 완료';
  document.getElementById('cal-ev-title').value=e.title||'';
  document.getElementById('cal-ev-date').value=e.date||'';
  document.getElementById('cal-ev-time').value=e.time||'';try{_setEventTime(e.time||'');}catch(x){}
  document.getElementById('cal-ev-place').value=e.place||'';
  document.getElementById('cal-ev-content').value=e.content||'';
  document.getElementById('cal-ev-visibility').value=e.visibility||'shared';
  openModal('cal-event-modal');
}
function deleteCalEvent(eid){
  const e=calEvents.find(x=>x.id===eid); if(!e)return;
  if(!canEditCal(e)){showToast('작성자 또는 관리자만 삭제할 수 있어요');return;}
  if(!confirm('"'+(e.title||'')+'" 일정을 삭제할까요?\n되돌릴 수 없어요.'))return;
  calEvents=calEvents.filter(x=>x.id!==eid);
  renderCalendar();try{renderHomeSchedule();}catch(x){}
  showToast('🗑️ 일정을 삭제했어요');
}
function submitCalEvent(){if(G.role!=='teacher'){showToast('교사만 일정을 등록할 수 있어요');return;}const title=(document.getElementById('cal-ev-title').value||'').trim();const date=document.getElementById('cal-ev-date').value;if(!title||!date){showToast('제목과 날짜를 입력해주세요');return;}const time=document.getElementById('cal-ev-time').value;const place=(document.getElementById('cal-ev-place').value||'').trim();const visibility=document.getElementById('cal-ev-visibility').value;const content=(document.getElementById('cal-ev-content').value||'').trim();const _vote=!!(document.getElementById('cal-ev-vote')||{}).checked;
  if(editingCalId){
    const e=calEvents.find(x=>x.id===editingCalId);
    if(!e||!canEditCal(e)){showToast('수정 권한이 없어요');editingCalId=null;return;}
    e.title=title;e.date=date;e.time=time;e.place=place;e.content=content;e.visibility=visibility;e.edited=true;
    editingCalId=null;closeModal('cal-event-modal');selectedCalDate=date;renderCalendar();
    try{renderHomeSchedule();}catch(x){}
    showToast('✏️ 일정을 수정했어요');return;
  }
  const _ceid='ce'+Date.now();calEvents.push({id:_ceid,title,date,time,place,content,visibility,authorId:G.id,authorName:G.displayName,checkedBy:[],isRecurring:false,responses:{},vote:_vote});if(visibility!=='private'){notifications.unshift({pushed:false,id:'nt-cal-'+_ceid,noPush:true,text:'📅 새 일정: <b>'+title+'</b>'+(date?(' ('+date+(time?' '+time:'')+')'):''),time:'방금',ts:Date.now(),readBy:[],hiddenBy:[],forTeacher:true,tap:{type:'cal-vote',date:date}});updateNotifDot();}closeModal('cal-event-modal');selectedCalDate=date;renderCalendar();try{renderHomeSchedule();}catch(x){}showToast('일정이 등록되었습니다!');}
function toggleCalCheck(eid){const e=calEvents.find(e=>e.id===eid);if(!e)return;if(!e.checkedBy)e.checkedBy=[];const idx=e.checkedBy.indexOf(G.id);if(idx>=0)e.checkedBy.splice(idx,1);else e.checkedBy.push(G.id);try{if(typeof flushSync==='function')flushSync();}catch(x){}renderCalDayEvents(selectedCalDate);}
function renderHomeMiniCal(){
  var el=document.getElementById('home-mini-cal');if(!el)return;
  try{ensureWeeklyEvents();}catch(e){}
  var n=new Date();var y=n.getFullYear(),m=n.getMonth();
  var first=new Date(y,m,1).getDay();var last=new Date(y,m+1,0).getDate();
  var td=n.getDate();
  var dow=['일','월','화','수','목','금','토'];
  var head=dow.map(function(w,i){return '<div style="text-align:center;font-size:10px;font-weight:700;color:'+(i===0?'#E5806B':i===6?'#5B8DEF':'var(--text-light)')+'">'+w+'</div>';}).join('');
  var cells='';
  for(var i=0;i<first;i++)cells+='<div></div>';
  for(var d=1;d<=last;d++){
    var ds=y+'-'+pad2(m+1)+'-'+pad2(d);
    var evs=(calEvents||[]).filter(function(e){return e.date===ds&&(e.isRecurring||e.visibility!=='private'||e.authorId===G.id);});
    var hasRem=(reminderData||[]).some(function(r){return r.date===ds&&!r.done&&(r.shared||!r.ownerId||r.ownerId===G.id);});
    var bf=(typeof bdayOn==='function')?bdayOn(ds):null;
    var col=(first+d-1)%7;var isSun=col===0,isSat=col===6;var isToday=(d===td);var isSel=(window._miniSel===ds);
    var dots='';
    if(evs.length)dots+='<span style="width:4px;height:4px;border-radius:50%;background:var(--mint)"></span>';
    if(hasRem)dots+='<span style="width:4px;height:4px;border-radius:50%;background:#F5A623"></span>';
    if(bf&&(bf.birth.length||bf.feast.length))dots+='<span style="width:4px;height:4px;border-radius:50%;background:#E5806B"></span>';
    cells+='<div onclick="_openCalDay(\''+ds+'\')" style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;border-radius:8px;'+(isToday?'background:var(--primary)':isSel?'background:var(--primary-light)':'')+'"><span style="font-size:12px;font-weight:'+(isToday?'800':'500')+';color:'+(isToday?'#fff':isSun?'#E5806B':isSat?'#5B8DEF':'var(--text)')+'">'+d+'</span><span style="display:flex;gap:2px;height:5px;margin-top:1px">'+dots+'</span></div>';
  }
  el.innerHTML='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;margin-bottom:3px">'+head+'</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px">'+cells+'</div>';
}
function _openCalDay(ds){
  window._miniSel=ds;try{renderHomeMiniCal();}catch(e){}
  var el=document.getElementById('home-cal-preview');if(!el)return;
  var evs=(calEvents||[]).filter(function(e){return e.date===ds&&(e.isRecurring||e.visibility!=='private'||e.authorId===G.id);});
  var rems=(reminderData||[]).filter(function(r){return r.date===ds&&!r.done&&(r.shared||!r.ownerId||r.ownerId===G.id);});
  var bf=(typeof bdayOn==='function')?bdayOn(ds):{birth:[],feast:[]};
  var q=ds.split('-');var dow=['일','월','화','수','목','금','토'][new Date(ds+'T12:00:00').getDay()];
  function row(color,txt){return '<div style="font-size:12px;padding:3px 0;display:flex;gap:7px;align-items:flex-start"><span style="width:5px;height:5px;border-radius:50%;background:'+color+';margin-top:6px;flex-shrink:0"></span><span style="line-height:1.5">'+txt+'</span></div>';}
  var rows='';
  evs.forEach(function(e){rows+=row('var(--mint)',_esc(e.title)+(e.time?' <span style="color:var(--text-light)">'+_esc(e.time)+'</span>':''));});
  rems.forEach(function(r){rows+=row('#F5A623',_esc(r.content));});
  (bf.birth||[]).forEach(function(u){rows+=row('#E5806B','🎂 '+_esc(u.name+' '+u.baptism)+' 생일');});
  (bf.feast||[]).forEach(function(u){rows+=row('#E5806B',_esc(u.name+' '+u.baptism)+' 축일');});
  if(!rows)rows='<div style="font-size:12px;color:var(--text-light);padding:3px 0">일정이 없어요</div>';
  el.innerHTML='<div style="border-top:1px solid var(--border-light);margin-top:10px;padding-top:8px"><div style="font-size:12px;font-weight:800;margin-bottom:5px">'+(+q[1])+'월 '+(+q[2])+'일 <span style="color:var(--text-light);font-weight:600">('+dow+')</span></div>'+rows+'</div>';
}
function renderHomeSchedule(){const el=document.getElementById('teacher-schedule');if(!el)return;ensureWeeklyEvents();const n=new Date();const t0=n.getFullYear()+'-'+pad2(n.getMonth()+1)+'-'+pad2(n.getDate());const sat=currentSaturday();const end=sat>=t0?sat:t0;const evs=calEvents.filter(e=>e.date>=t0&&e.date<=end&&(e.isRecurring||e.visibility!=='private'||e.authorId===G.id)).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);if(!evs.length){el.innerHTML='<div class="empty" style="padding:20px"><div class="empty-emoji" style="font-size:28px">📅</div><div class="empty-title" style="font-size:13px">이번 주 일정이 없어요</div></div>';return;}el.innerHTML=evs.map(e=>{const[y,m,d]=e.date.split('-');const dow=['일','월','화','수','목','금','토'][new Date(e.date+'T12:00:00').getDay()];return `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-light);cursor:pointer" onclick="switchTab('calendar');selectedCalDate='${e.date}';renderCalendar()"><span class="chip ${e.isRecurring?'chip-mint':'chip-blue'}" style="flex-shrink:0">${parseInt(m)}/${parseInt(d)} (${dow})</span><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.title}</div>${(e.time||e.place)?`<div style="font-size:11px;color:var(--text-light)">${e.time||''}${e.place?' · '+e.place:''}</div>`:''}</div></div>`;}).join('');}
function ensureWeeklyEvents(){if(!window._evReady)return;const sats=getUpcomingSaturdays(12);sats.forEach(d=>{if(!calEvents.some(e=>e.date===d&&e.isRecurring)){calEvents.push({id:'ce-week-'+d,title:'📌 주일학교',date:d,time:'',place:'',content:'매주 토요일 주일학교 모임입니다.',isRecurring:true,responses:{}});}});}
function getApprovedTeachers(){return pendingList.filter(u=>u.approved&&u.role==='teacher');}
function _evResp(e){var m=Object.assign({},(e&&e.responses)?e.responses:{});var eid=e&&e.id;if(eid){calResponses.forEach(function(r){if(r&&r.eid===eid){if(r.val)m[r.uid]=r.val;else delete m[r.uid];}});}return m;}
function setCalResponse(eid,val){const e=calEvents.find(e=>e.id===eid);const rid=eid+'|'+G.id;const rec=calResponses.find(r=>r&&r.id===rid);if(rec)rec.val=val;else calResponses.push({id:rid,eid:eid,uid:G.id,val:val});if(e){if(!e.responses)e.responses={};e.responses[G.id]=val;}try{if(typeof flushSync==='function')flushSync();}catch(x){}renderCalDayEvents(selectedCalDate);showToast(val==='yes'?'참석으로 응답했어요':'불참으로 응답했어요');}
function openRespModal(eid,kind){
  const e=calEvents.find(e=>e.id===eid);if(!e)return;
  const teachers=getApprovedTeachers();const R=_evResp(e);
  const cfg={yes:{t:'✅ 참석',c:'linear-gradient(135deg,var(--mint),var(--primary))',emp:'아직 참석 응답이 없어요',emo:'🙏'},
             no:{t:'❌ 불참',c:'linear-gradient(135deg,var(--coral),#FF6B54)',emp:'불참한 선생님이 없어요',emo:'🎉'},
             none:{t:'⏳ 미응답',c:'linear-gradient(135deg,var(--text-light),#8A97B5)',emp:'전원 응답 완료했어요',emo:'✅'}}[kind]||{};
  const list=teachers.filter(t=>kind==='none'?!R[t.id]:R[t.id]===kind);
  const d=new Date(e.date+'T12:00:00');
  const ti=document.getElementById('unresponded-title');
  if(ti)ti.textContent=cfg.t+' · '+(d.getMonth()+1)+'월 '+d.getDate()+'일';
  const el=document.getElementById('unresponded-list');
  if(el){
    el.innerHTML=list.length
      ? '<div style="font-size:11px;color:var(--text-light);margin-bottom:8px">'+list.length+'명</div>'
        +list.map(t=>`<div class="student-row"><div class="student-avatar" style="background:${cfg.c}">${t.name.charAt(0)}</div><div class="student-info"><div class="student-name">${t.name} ${t.baptism}</div><div class="student-detail">${t.gradeLabel||''}</div></div></div>`).join('')
      : `<div class="empty" style="padding:20px"><div class="empty-emoji" style="font-size:24px">${cfg.emo}</div><div class="empty-title" style="font-size:12px">${cfg.emp}</div></div>`;
  }
  openModal('unresponded-modal');
}
function openUnrespondedModal(eid){openRespModal(eid,'none');}
function notifyUnrespondedTeachers(){
  if(!(G.role==='teacher'&&(G.type==='principal'||G.type==='admin'||G.isAdmin))){showToast('교감·교무·관리자만 보낼 수 있어요');return;}
  ensureWeeklyEvents();
  const n=new Date();const today=toDateStr(n);
  /* 지금 달력에서 보고 있는 달 기준 — 7월에 8월 투표 알림도 보낼 수 있게 */
  const ty=(typeof calYear!=='undefined')?calYear:n.getFullYear();
  const tm=(typeof calMonth!=='undefined')?calMonth:n.getMonth();
  const ym=ty+'-'+pad2(tm+1);
  const evs=calEvents.filter(e=>(e.isRecurring||e.vote||e.visibility==='shared')&&e.date>today&&e.date.indexOf(ym)===0&&!(e.isRecurring&&isVacationDate(e.date))).sort((a,b)=>a.date<b.date?-1:1);
  if(!evs.length){showToast((tm+1)+'월에 남은 주일학교 일정이 없어요');return;}
  const teachers=pendingList.filter(u=>u.approved&&u.role==='teacher'&&!u.hidden);
  const targets=teachers.filter(t=>evs.some(e=>!_evResp(e)[t.id]));
  if(!targets.length){showToast((tm+1)+'월은 모든 선생님이 응답했어요 🎉');return;}
  const names=targets.map(t=>t.name+' '+(t.baptism||'')).join(', ');
  if(!confirm('📣 푸시 알림을 보냅니다\n\n대상: 미응답 '+targets.length+'명\n'+names+'\n\n내용: '+(tm+1)+'월 주일학교 참석 여부 요청\n\n보낼까요?'))return;
  let sent=0;
  teachers.forEach(t=>{
    const miss=evs.filter(e=>!_evResp(e)[t.id]);
    if(!miss.length)return;
    const label=miss.map(e=>{const q=e.date.split('-');return (+q[1])+'월 '+(+q[2])+'일';}).join(', ');
    const nid='nt'+Date.now()+'v'+Math.random().toString(36).slice(2,5);
    notifications.unshift({pushed:false,id:nid,text:'🗳️ '+(tm+1)+'월 주일학교 참석 여부를 아직 응답하지 않았어요: <b>'+label+'</b><br>눌러서 참석/불참을 알려주세요!',time:'방금',ts:Date.now(),readBy:[],hiddenBy:[],forTeacherId:t.id,tap:{type:'cal-vote',date:miss[0].date}});
    sent++;
  });
  updateNotifDot();
  try{if(typeof flushSync==='function')flushSync();}catch(e){}
  showToast(sent?('🔔 '+(tm+1)+'월 투표 알림을 '+sent+'명에게 보냈어요'):(tm+1)+'월은 모든 선생님이 응답했어요 🎉');
}
function changeMonth(dir){calMonth+=dir;if(calMonth>11){calMonth=0;calYear++;}else if(calMonth<0){calMonth=11;calYear--;}renderCalendar();}
var yearPlanYear=new Date().getFullYear();
function _canEditPlan(){return G.role==='teacher'&&(G.type==='principal'||G.type==='admin'||G.isAdmin)&&!litLocked();}
var _planViewYr=null;
var _autoPromote=false,_promoteExemptFrom='';
function _today(){return toDateStr(new Date());}
function undoLastPromotion(){if(!_canEditPlan()){showToast('교감·교무·관리자만 가능해요');return;}var b=appConfig&&appConfig.promoteBackup;if(!b){showToast('되돌릴 기록이 없어요');return;}if(!confirm('방금 새 학년도 처리(학생 진급·졸업, 교사 담당 초기화)를 되돌릴까요?\n\n처리 직전 상태로 복원됩니다.'))return;(b.snap||[]).forEach(function(s){var u=pendingList.find(function(x){return x.id===s.id;});if(!u)return;u.gradeKey=s.gradeKey;u.gradeLabel=s.gradeLabel;u.graduated=s.graduated;if(!s.graduated)delete u.graduatedYear;if(s.role==='teacher')u.teacherType=s.teacherType;});if(appConfig.promotedYears)appConfig.promotedYears=appConfig.promotedYears.filter(function(y){return y!==b.yr;});delete appConfig.promoteBackup;try{if(window.flushCfg)window.flushCfg();}catch(e){}try{if(typeof flushSync==='function')flushSync();}catch(e){}try{renderMembersList();}catch(e){}try{renderYearPlan();}catch(e){}showToast('↩️ 처리 직전 상태로 되돌렸어요');}
function _inAdaptation(){var r=appConfig&&appConfig.planReserve;return !!(r&&_today()<_termStart(r.yr));}
function reservePlanTerm(){if(!_canEditPlan())return;var yr=_planViewYr;if(!confirm('🌱 '+yr+'학년도를 예약할까요?\n\n· 지금부터 새 학년도 시작 전까지 출석이 중지됩니다\n· 이 기간에 새로 가입한 학생은 진급에서 제외됩니다(예비중1 보호)\n· 시작일이 되면 자동으로 학생 진급·기록 보관·교사 담당 초기화가 실행됩니다\n\n예약은 나중에 취소할 수 있어요.'))return;appConfig.planReserve={yr:yr,at:toDateStr(new Date())};var arr=_planTerms();if(!arr.find(function(x){return x.yr===yr;}))arr.push(_defTerm(yr));try{if(window.flushCfg)window.flushCfg();}catch(x){}renderYearPlan();showToast('🌱 '+yr+'학년도 예약됨 · 시작일에 자동 시작, 그때까지 출석 중지');}
function cancelReserve(){if(!_canEditPlan())return;delete appConfig.planReserve;try{if(window.flushCfg)window.flushCfg();}catch(x){}renderYearPlan();showToast('예약을 취소했어요');}
function _applyReserveIfDue(){try{var r=appConfig&&appConfig.planReserve;if(!r)return;if(!_canEditPlan())return;if(_today()<_termStart(r.yr))return;if(!appConfig.promotedYears)appConfig.promotedYears=[];if(appConfig.promotedYears.indexOf(r.yr)<0){var prev={yr:r.yr-1,start:_termStart(r.yr-1),end:_termEnd(r.yr-1)};_autoPromote=true;_promoteExemptFrom=r.at||'';var ok=false;try{ok=startNewSchoolYear(prev);}catch(e){}_autoPromote=false;_promoteExemptFrom='';if(ok)appConfig.promotedYears.push(r.yr);}var arr=_planTerms();var t=arr.find(function(x){return x.yr===r.yr;});if(!t){t=_defTerm(r.yr);arr.push(t);}t.locked=true;delete appConfig.planReserve;try{if(window.flushCfg)window.flushCfg();}catch(e){}try{if(typeof flushSync==='function')flushSync();}catch(e){}}catch(e){}}
function _curSchoolYr(){var t=toDateStr(new Date());var n=new Date();var base=n.getMonth()>=2?n.getFullYear():n.getFullYear()-1;for(var y=base-1;y<=base+1;y++){try{if(t>=_termStart(y)&&t<=_termEnd(y))return y;}catch(e){}}return base;}
var GRADE_ORDER=['중1','중2','중3','고1','고2','고3'];
function _gradeFromN(n){if(n<0)n=0;if(n>=6)return {gradeKey:'h',gradeLabel:'고3',graduated:true};return {gradeKey:(n<3?'m'+(n+1):'h'),gradeLabel:GRADE_ORDER[n],graduated:false};}
function studentN(u){return _curSchoolYr()-(u.cohort||0)+(u.gradeOffset||0);}
function applyStudentGrade(u){if(!u||u.role!=='student'||!u.cohort)return false;var g=_gradeFromN(studentN(u));var ch=false;if(u.gradeKey!==g.gradeKey){u.gradeKey=g.gradeKey;ch=true;}if(u.gradeLabel!==g.gradeLabel){u.gradeLabel=g.gradeLabel;ch=true;}if(!!u.graduated!==g.graduated){u.graduated=g.graduated;if(g.graduated&&!u.graduatedYear)u.graduatedYear=_curSchoolYr();ch=true;}return ch;}
function recomputeGrades(persist){var changed=false;(pendingList||[]).forEach(function(u){if(applyStudentGrade(u))changed=true;});if(changed&&persist&&_canEditPlan()){try{if(typeof flushSync==='function')flushSync();}catch(e){}}return changed;}
function _migrateCohorts(){if(!_canEditPlan())return;if(appConfig.cohortMigrated)return;var idx={'중1':0,'중2':1,'중3':2,'고1':3,'고2':4,'고3':5};var sy=_curSchoolYr();var ids=[];(pendingList||[]).forEach(function(u){if(u.role!=='student'||u.cohort)return;if(u.graduated){u.cohort=sy-6;u.gradeOffset=0;ids.push(u.id);return;}var gi=idx[u.gradeLabel];if(gi==null)return;u.cohort=sy-gi;u.gradeOffset=0;ids.push(u.id);});appConfig.cohortMigrated=true;appConfig.cohortBackup={at:_today(),ids:ids};try{if(window.flushCfg)window.flushCfg();}catch(e){}try{if(typeof flushSync==='function')flushSync();}catch(e){}}
function _cohortFromLabel(gl){var idx={'중1':0,'중2':1,'중3':2,'고1':3,'고2':4,'고3':5};return _curSchoolYr()-(idx[gl]||0);}
function _gradeLabelForYear(u,yr){if(!u.cohort)return u.gradeLabel||'';return _gradeFromN(yr-(u.cohort||0)+(u.gradeOffset||0)).gradeLabel;}
function _sealIfRolled(u){if(u.role!=='student')return false;var cur=_curSchoolYr();if(u.curTermYr==null){u.curTermYr=cur;return true;}if(u.curTermYr>=cur)return false;var t=u.attendTotal||0;if(t>0||(u.attendedWeeks||[]).length){var lv='🌱 씨앗';for(var i=0;i<ATTEND_LEVELS.length;i++)if(t>=ATTEND_LEVELS[i].n)lv=ATTEND_LEVELS[i].l;u.history=u.history||[];u.history.push({year:u.curTermYr,term:u.curTermYr+'학년도',grade:_gradeLabelForYear(u,u.curTermYr),attendTotal:t,level:lv,weeks:(u.attendedWeeks||[]).slice(),halfWeeks:(u.halfWeeks||[]).slice()});}u.attendedWeeks=[];u.halfWeeks=[];u.qrScanAt={};u.attendTotal=0;u.streak=0;u.earnedLevels=[];u.absentAckWeek=null;u.absentAckBy=null;u.lastContactAt=null;u.lastContactBy=null;u.curTermYr=cur;return true;}
function _gradeSync(){try{var admin=_canEditPlan();if(admin)_migrateCohorts();var ch=false;(pendingList||[]).forEach(function(u){if(u.role!=='student')return;if(admin&&_sealIfRolled(u))ch=true;if(applyStudentGrade(u))ch=true;var _nt=calcAttendTotal(u);if((u.attendTotal||0)!==_nt){u.attendTotal=_nt;if(G&&G.id===u.id)G.attendTotal=_nt;ch=true;}});if(ch&&admin){try{if(typeof flushSync==='function')flushSync();}catch(e){}}}catch(e){}}
function _planTerms(){if(!appConfig.planTerms){appConfig.planTerms=[];if(appConfig.planStart&&appConfig.planEnd){var y0=(+appConfig.planStart.slice(5,7)>=3?+appConfig.planStart.slice(0,4):+appConfig.planStart.slice(0,4)-1);appConfig.planTerms.push({yr:y0,start:appConfig.planStart,end:appConfig.planEnd,locked:true});}}return appConfig.planTerms;}
function _termOf(yr){return _planTerms().find(function(t){return t.yr===yr;})||null;}
function _planEnds(){if(!appConfig.planEnds)appConfig.planEnds={};return appConfig.planEnds;}
function _shiftDays(ds,n){var d=new Date(ds+'T00:00:00');d.setDate(d.getDate()+n);return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());}
function _termEnd(yr){return _planEnds()[yr]||((yr+1)+'-02-'+pad2(new Date(yr+1,2,0).getDate()));}
function _termStart(yr){var pe=_planEnds()[yr-1];return pe?_shiftDays(pe,1):(yr+'-03-01');}
function _defTerm(yr){return {yr:yr,start:_termStart(yr),end:_termEnd(yr),locked:false};}
function setTermEnd(yr,val){if(!_canEditPlan())return;if(!val||val<=_termStart(yr)){showToast('종료일을 시작일 이후로 정해주세요');return;}_planEnds()[yr]=val;try{if(window.flushCfg)window.flushCfg();}catch(e){}renderYearPlan();showToast('종료일 변경 · 다음 학년도 시작일이 자동 연결됩니다');}
function planNav(d){_planViewYr+=d;renderYearPlan();}
function _checkPlanEnd(){try{var terms=_planTerms(),td=toDateStr(new Date());for(var i=0;i<terms.length;i++){var t=terms[i];if(t.locked&&_termEnd(t.yr)<td&&!terms.some(function(x){return x.yr===t.yr+1;})){if(appConfig.planEndNotified===t.yr)return;appConfig.planEndNotified=t.yr;(pendingList||[]).filter(function(u){return u.approved&&u.role==='teacher'&&!u.hidden&&(u.teacherType==='principal'||u.teacherType==='admin'||u.isAdmin);}).forEach(function(u){notifications.unshift({pushed:false,id:'nt-planend-'+t.yr+'-'+u.id,text:'📋 <b>'+t.yr+'학년도 운영 기간이 끝났어요.</b> 일정 → 연간계획에서 새 학년도 계획을 시작해 주세요.',time:'방금',ts:Date.now(),readBy:[],forTeacherId:u.id});});try{if(window.flushCfg)window.flushCfg();}catch(e){}try{if(typeof flushSync==='function')flushSync();}catch(e){}updateNotifDot();return;}}}catch(e){}}
function openYearPlan(){if(G.role!=='teacher'){showToast('교사 전용이에요');return;}_ypBuf=null;_hydrateYP();_planTerms();_planViewYr=_curSchoolYr();renderYearPlan();try{renderLitLockUI();}catch(e){}openModal('yearplan-modal');}
function _satsInRange(s,e){var out=[];var d=new Date(s+'T00:00:00'),end=new Date(e+'T00:00:00');while(d<=end){if(d.getDay()===6)out.push(d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()));d.setDate(d.getDate()+1);}return out;}
function openPlanPaste(){
  if(!_isFullAdmin()){showToast('교감·교무·관리자만 입력할 수 있어요');return;}
  if(litLocked()){showToast('🔒 잠금을 먼저 해제해주세요 · 우측 상단');return;}
  var ta=document.getElementById('plan-paste-text');if(ta)ta.value='';
  var hint=document.getElementById('plan-paste-hint');
  if(hint)hint.innerHTML='엑셀 표를 <b>통째로 복사해서</b> 붙여넣으세요. 머리글(전례시기·운영구분·교리…)과 날짜를 자동으로 인식해 맞는 칸에 넣어드려요.';
  openModal('plan-paste-modal');
}
function _planRowCount(){try{var yr=_planViewYr==null?_curSchoolYr():_planViewYr;return (_satsInRange(_termStart(yr),_termEnd(yr))||[]).length;}catch(e){return 0;}}
function applyPlanPaste(){
  if(!_isFullAdmin()){showToast('권한이 없어요');return;}
  if(litLocked()){showToast('🔒 잠금을 먼저 해제해주세요');return;}
  var ta=document.getElementById('plan-paste-text');var raw=(ta&&ta.value||'').replace(/\r/g,'');
  if(!raw.trim()){showToast('붙여넣을 내용이 없어요');return;}
  var yr=_planViewYr==null?_curSchoolYr():_planViewYr;
  var rows=raw.split('\n').map(function(l){return l.split('\t');});
  var HEAD={'전례력':'label','전례시기':'label','운영구분':'optype','교리':'form','교안담당':'owner','교안 담당':'owner','교리내용':'detail','내용(전례부)':'liturgyTeam','전례부':'liturgyTeam','내용(성가대)':'choir','성가대':'choir','비고(교리 참고자료)':'note2','비고':'note2','회의 안건':'agenda','회의안건':'agenda'};
  /* ① 머리글 행에서 열 위치 + 날짜 열 파악 */
  var map=null,dcol=-1,start=0;
  for(var h=0;h<rows.length&&h<60;h++){
    var hit={},cnt=0,dc=-1;
    rows[h].forEach(function(c,ci){
      var t=(c||'').replace(/\s+/g,' ').trim();
      if(t==='날짜'){dc=ci;return;}
      var k=HEAD[t]||HEAD[t.replace(/\s/g,'')];
      if(k&&hit[k]===undefined){hit[k]=ci;cnt++;}
    });
    if(cnt>=3){map=hit;if(dc>=0)dcol=dc;start=h+1;break;}
  }
  /* ② 머리글에 '날짜'가 없으면 데이터에서 날짜 열 탐색 */
  if(dcol<0){
    var score={};
    for(var r0=start;r0<rows.length&&r0<start+25;r0++)
      for(var c0=0;c0<rows[r0].length&&c0<8;c0++)
        if(_pDate(rows[r0][c0],yr))score[c0]=(score[c0]||0)+1;
    var best=-1,bc=0;
    Object.keys(score).forEach(function(k){if(score[k]>bc){bc=score[k];best=+k;}});
    dcol=best;
  }
  if(dcol<0&&!map){showToast('표를 인식하지 못했어요 · 머리글 행 또는 날짜 열을 포함해 복사해주세요');return;}
  /* 머리글은 있는데 날짜 열을 못 찾은 경우: 머리글 기준 상대 위치로 추정 */
  if(dcol<0&&map){
    var _minc=Math.min.apply(null,Object.keys(map).map(function(k){return map[k];}));
    for(var _r=start;_r<rows.length&&_r<start+25;_r++){
      for(var _c=Math.max(0,_minc-4);_c<_minc;_c++){ if(_pDate(rows[_r][_c],yr)){dcol=_c;break;} }
      if(dcol>=0)break;
    }
  }
  var keys=['label','optype','form','owner','detail','liturgyTeam','choir','note2','agenda'];
  var sats=_satsInRange(_termStart(yr),_termEnd(yr))||[];
  var n=0,idx=0;
  for(var i2=start;i2<rows.length;i2++){
    var cols=rows[i2]; if(!cols.join('').trim())continue;
    var ds=(dcol>=0)?_pDate(cols[dcol],yr):null;
    if(!ds){ if(dcol>=0)continue; ds=sats[idx++]; }
    if(!ds)break;
    /* 저장 전 임시 보관(_ypBuf)에만 기록 — [저장]을 눌러야 실제 반영·영속 */
    if(!_ypBuf)_ypBuf={}; var rec=_ypBuf[ds]||(_ypBuf[ds]={});
    var wrote=false;
    if(map){ Object.keys(map).forEach(function(k){
        var ci=map[k], v=(cols[ci]||'').trim();
        if(!v&&cols[ci+1]!==undefined){                    /* 병합 셀 보정: 바로 옆 칸 확인 */
          var nx=(cols[ci+1]||'').trim();
          var taken=Object.keys(map).some(function(k2){return map[k2]===ci+1;});
          if(nx&&!taken)v=nx;
        }
        if(v){rec[k]=v;wrote=true;}
      }); }
    else { for(var k2=0;k2<keys.length;k2++){var v2=(cols[k2]||'').trim();if(v2){rec[keys[k2]]=v2;wrote=true;}} }
    if(!wrote)delete _ypBuf[ds]; else n++;
  }
  closeModal('plan-paste-modal'); renderYearPlan(); _ypDirtyUI();
  showToast(n?(n+'개 행을 불러왔어요 · 저장을 눌러 반영하세요'):'인식된 행이 없어요 · 머리글과 날짜 열을 함께 복사해주세요');
}
function _pDate(v,yr){
  v=String(v==null?'':v).replace(/\u00a0/g,' ').trim();
  if(!v)return null;
  var m=v.match(/(\d{4})\s*[-.\/]\s*(\d{1,2})\s*[-.\/]\s*(\d{1,2})/);   /* 2026. 1. 3. / 2026-01-03 */
  if(m)return m[1]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[3]).slice(-2);
  m=v.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);                              /* 1월 3일 */
  if(m){var a=+m[1],b=+m[2];return ((a>=3)?yr:(yr+1))+'-'+('0'+a).slice(-2)+'-'+('0'+b).slice(-2);}
  m=v.match(/^(\d{1,2})\s*[-.\/]\s*(\d{1,2})\.?$/);                        /* 1/3 · 1.3 */
  if(m){var c=+m[1],d=+m[2];return ((c>=3)?yr:(yr+1))+'-'+('0'+c).slice(-2)+'-'+('0'+d).slice(-2);}
  if(/^\d{5}$/.test(v)){                                                     /* 엑셀 일련번호 */
    var dt=new Date(Date.UTC(1899,11,30)+(+v)*86400000);
    return dt.getUTCFullYear()+'-'+('0'+(dt.getUTCMonth()+1)).slice(-2)+'-'+('0'+dt.getUTCDate()).slice(-2);
  }
  return null;
}
function renderYearPlan(){var edit=_canEditPlan();_hydrateYP();
  if(_planViewYr==null)_planViewYr=_curSchoolYr();
  var yr=_planViewYr,term=_termOf(yr);
  var locked=!!(term&&term.locked),editing=edit&&!locked;
  var dispStart=_termStart(yr),dispEnd=_termEnd(yr);
  var ended=term&&_today()>_termEnd(yr);
  var per=document.getElementById('yp-period');
  if(per){var fmt=function(x){var p=x.split('-');return p[0]+'.'+p[1]+'.'+p[2];};
    per.innerHTML='<div style="max-width:760px;margin:0 auto;display:flex;align-items:center;gap:6px;flex-wrap:wrap"><button onclick="planNav(-1)" style="background:none;border:none;font-size:16px;cursor:pointer;color:var(--text-sub);padding:0 4px">‹</button><span style="font-weight:800;font-size:13px;min-width:76px;text-align:center">'+yr+'학년도</span><button onclick="planNav(1)" style="background:none;border:none;font-size:16px;cursor:pointer;color:var(--text-sub);padding:0 4px">›</button>'
      +'<span style="font-size:12px;color:var(--text-sub)">'+fmt(dispStart)+' ~ '+fmt(dispEnd)+'</span>'
      +''
      +'</div>';
    }
  var thead=document.getElementById('yp-thead');
  if(thead)thead.innerHTML='<div style="display:flex;gap:6px;padding:9px 8px;font-size:11px;font-weight:800;color:var(--text-sub)"><span style="width:46px;flex-shrink:0">날짜</span><span style="flex:1.2">전례시기</span><span style="flex:.9">운영구분</span><span style="flex:1.2">교리</span><span style="flex:.9">교안담당</span><span style="flex:1.5">교리내용</span><span style="flex:1.2">전례부</span><span style="flex:1.2">성가대</span><span style="flex:1.2">비고</span><span style="flex:1.8">회의 안건</span></div>';
  var el=document.getElementById('yp-body');if(!el)return;var sats=_satsInRange(dispStart,dispEnd);
  var rows=sats.map(function(ds){var l=_ypView(ds);var d=ds.split('-');
    function cell(key,val,flex,ph){return edit?'<input value="'+_esc(val||'')+'" onchange="setPlanDraft(\''+ds+'\',\''+key+'\',this.value)" placeholder="'+ph+'" style="flex:'+flex+';min-width:0;font-size:12px;padding:6px 8px;border:1px solid var(--border-light);border-radius:6px;font-family:inherit;background:var(--card)">':'<span style="flex:'+flex+';font-size:12px;color:var(--text-sub);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:4px 0">'+_esc(val||'')+'</span>';}
    var mn=(resources||[]).find(function(r){return r.cat==='minutes'&&!r.deleted&&r.mdate===ds;});
    var mnCell=mn?'<button onclick="closeModal(\'yearplan-modal\');openMinutesViewer(\''+mn.id+'\')" style="width:30px;background:none;border:none;cursor:pointer;font-size:15px">📝</button>':(edit?'<button onclick="newMinutesForDate(\''+ds+'\')" style="width:30px;background:none;border:none;cursor:pointer;font-size:16px;color:var(--text-light)">＋</button>':'<span style="width:30px;display:inline-block"></span>');
    return '<div class="yp-row" style="display:flex;gap:6px;align-items:center;padding:7px 8px;border-bottom:1px solid var(--border-light)"><span style="width:46px;flex-shrink:0;font-size:12px;font-weight:700;color:var(--text-sub)">'+(+d[1])+'/'+(+d[2])+'</span>'+cell('label',l.label||_dayLabel(ds),'1.2','전례시기')+cell('optype',l.optype,'.9','운영구분')+cell('form',l.form,'1.2','교리')+cell('owner',l.owner,'.9','교안담당')+cell('detail',l.detail,'1.5','교리내용')+cell('liturgyTeam',l.liturgyTeam,'1.2','전례부')+cell('choir',l.choir,'1.2','성가대')+cell('note2',l.note2,'1.2','비고')+cell('agenda',l.agenda,'1.8','회의 안건')+'</div>';}).join('');
  el.innerHTML=rows;try{_ypDirtyUI();}catch(e){}}
function setPlan(ds,key,val){var r=litFor(ds);if(!r){r={id:'lt'+ds,date:ds};litData.push(r);}r[key]=(val||'').trim();
  if(key==='agenda'){try{var mn=(resources||[]).find(function(x){return x.cat==='minutes'&&!x.deleted&&x.mdate===ds;});if(mn&&r.agenda&&!(mn.content||'').trim()){mn.content=r.agenda.split(/[,\u00b7]/).map(function(x){return x.trim();}).filter(Boolean).map(function(x){return '## '+x;}).join('\n');try{renderMinutesHub();}catch(e){}}}catch(e){}}try{if(typeof flushSync==='function')flushSync();}catch(e){}}
function newMinutesForDate(ds){if(!_canEditPlan()){showToast('작성 권한이 없어요');return;}var d=ds.split('-');var r={id:'rs'+Date.now(),cat:'minutes',year:String(+d[0]),mdate:ds,title:(+d[1])+'월 '+(+d[2])+'일 회의록',content:'',authorId:G.id,authorName:G.displayName,date:_minDateStr(),updatedAt:_minDateStr(),updatedBy:G.displayName};resources.unshift(r);try{if(typeof flushSync==='function')flushSync();}catch(e){}try{renderYearPlan();}catch(e){}closeModal('yearplan-modal');openMinutesViewer(r.id);startMinutesEdit();}

/* ── 연간계획: 저장 전 임시 보관(_ypBuf) → [저장] 눌러야 반영 ── */
var YP_KEYS=['label','optype','form','owner','detail','liturgyTeam','choir','note2','agenda'];
var _ypBuf=null;   /* {date:{key:val,...}} 저장 전 변경분 */
/* 클라우드에 안전 저장된 appConfig.litPlan → litData로 복원(반복 호출 안전) */
function _hydrateYP(){try{var m=appConfig&&appConfig.litPlan;if(!m)return;Object.keys(m).forEach(function(ds){var rec=litFor(ds);if(!rec){rec={id:'lt'+ds,date:ds};litData.push(rec);}var src=m[ds]||{};YP_KEYS.forEach(function(k){if(src[k]!=null&&src[k]!=='')rec[k]=src[k];});});}catch(e){}}
/* 임시 보관분을 합쳐 화면에 보여줄 한 행 */
function _ypView(ds){var base=litFor(ds)||{};var b=_ypBuf&&_ypBuf[ds];return b?Object.assign({},base,b):base;}
function _ypDirty(){return !!(_ypBuf&&Object.keys(_ypBuf).length);}
function _ypDirtyUI(){var b=document.getElementById('yp-save-btn');if(!b)return;var dirty=_ypDirty();b.style.display=(_canEditPlan()&&_isFullAdmin())?'':'none';b.style.background=dirty?'var(--primary)':'var(--primary-light)';b.style.color=dirty?'#fff':'var(--primary-dark)';b.textContent='저장'+(dirty?' *':'');}
function setPlanDraft(ds,key,val){if(!_ypBuf)_ypBuf={};if(!_ypBuf[ds])_ypBuf[ds]={};_ypBuf[ds][key]=(val||'').trim();_ypDirtyUI();}
function savePlan(){
  if(!_isFullAdmin()){showToast('교감·교무·관리자만 저장할 수 있어요');return;}
  if(litLocked()){showToast('잠금을 먼저 해제해주세요');return;}
  if(!_ypDirty()){showToast('저장할 변경사항이 없어요');return;}
  if(!appConfig.litPlan)appConfig.litPlan={};
  var agendaDates=[];
  Object.keys(_ypBuf).forEach(function(ds){
    var rec=litFor(ds);if(!rec){rec={id:'lt'+ds,date:ds};litData.push(rec);}
    var chg=_ypBuf[ds];
    Object.keys(chg).forEach(function(k){rec[k]=chg[k];if(k==='agenda')agendaDates.push(ds);});
    /* 클라우드 저장용 미러(appConfig → flushCfg로 확실히 영속) */
    var store=appConfig.litPlan[ds]||(appConfig.litPlan[ds]={});
    YP_KEYS.forEach(function(k){var v=(rec[k]||'').trim();if(v)store[k]=v;else delete store[k];});
    if(!Object.keys(store).length)delete appConfig.litPlan[ds];
  });
  /* 회의 안건 → 회의록 자동 반영(없으면 생성, 손대지 않은 회의록은 최신 안건으로 갱신) */
  var mnChanged=false;
  agendaDates.forEach(function(ds){if(_syncAgendaToMinutes(ds))mnChanged=true;});
  if(mnChanged){try{if(typeof flushSync==='function')flushSync();}catch(e){}try{renderMinutesHub();}catch(e){}}
  _ypBuf=null;
  try{if(window.flushCfg)window.flushCfg();}catch(e){}
  try{if(typeof flushSync==='function')flushSync();}catch(e){}
  try{if(window.FB&&FB.enabled()&&FB.save){(litData||[]).forEach(function(r){if(r&&r.id&&r.date)FB.save('liturgy',r.id,r);});}}catch(e){}
  renderYearPlan();
  try{renderLitLockUI();}catch(e){}
  showToast('연간계획을 저장했어요');
}
function closeYearPlan(){
  if(_ypDirty()&&!confirm('저장하지 않은 변경사항이 있어요. 저장하지 않고 닫을까요?'))return;
  _ypBuf=null;closeModal('yearplan-modal');
}

let currentReminderId=null;
/* 일정 ↔ 리마인더 전환 (삼성 캘린더 방식) */
function rmQuickDate(kind){
  var el=document.getElementById('reminder-date');if(!el)return;
  if(kind===''){el.value='';try{clearReminderTime();}catch(e){}return;}
  var d=new Date();
  if(kind==='sat'){ el.value=currentSaturday(); return; }
  d.setDate(d.getDate()+(parseInt(kind,10)||0));
  el.value=toDateStr(d);
}
var addMode='event';
function switchAddMode(mode){
  addMode=(mode==='todo')?'todo':'event';
  var tr=document.getElementById('add-track');
  if(tr)tr.classList.toggle('to-todo',addMode==='todo');
  var se=document.getElementById('seg-event'),st=document.getElementById('seg-todo');
  if(se)se.classList.toggle('active',addMode==='event');
  if(st)st.classList.toggle('active',addMode==='todo');
  /* 입력한 날짜를 반대편으로 넘겨준다 */
  try{
    var ed=document.getElementById('cal-ev-date'), rd=document.getElementById('reminder-date');
    if(addMode==='todo'&&ed&&ed.value&&rd&&!rd.value)rd.value=ed.value;
    if(addMode==='event'&&rd&&rd.value&&ed&&!ed.value)ed.value=rd.value;
  }catch(e){}
  var b=document.getElementById('add-submit');
  if(b)b.textContent=(addMode==='todo')?'할 일 추가':'일정 등록';
  var t=document.getElementById('reminder-modal-title');
  if(t)t.textContent='추가';
}
function submitAdd(){ (addMode==='todo')?submitReminder():submitCalEvent(); }
function closeAddModal(){ closeModal('cal-event-modal'); }
function openTodoList(){
  openModal('todo-modal');
  setTimeout(function(){try{renderReminderList();}catch(e){}},60);
}
function openReminderWriteModal(preDate){const modal=document.getElementById('cal-event-modal');delete modal.dataset.editId;document.getElementById('reminder-modal-title').textContent='📌 할 일 추가';document.getElementById('reminder-submit-btn').textContent='추가하기';document.getElementById('reminder-content').value='';document.getElementById('reminder-date').value=(typeof preDate==='string'?preDate:'');var _rt9=document.getElementById('reminder-time');if(_rt9)_rt9.value='';try{clearReminderTime();}catch(e){}document.getElementById('reminder-shared').checked=false;openModal('cal-event-modal');try{switchAddMode('todo');}catch(e){}}
function submitReminder(){const modal=document.getElementById('cal-event-modal');const editId=modal.dataset.editId;const content=(document.getElementById('reminder-content').value||'').trim();if(!content){showToast('내용을 입력해주세요');return;}const date=document.getElementById('reminder-date').value;const time=(document.getElementById('reminder-time')||{}).value||'';const shared=document.getElementById('reminder-shared').checked;if(time&&!date){showToast('알림 시간을 쓰려면 날짜도 선택해주세요');return;}if(editId){const r=reminderData.find(r=>r.id===editId);if(r){var _chg=(r.date!==date||r.time!==time);r.content=content;r.date=date;r.time=time;r.shared=shared;if(_chg)r.notified=false;}delete modal.dataset.editId;showToast('리마인더가 수정되었습니다');}else{const _newRem={id:'r'+Date.now(),content,date,time,shared,done:false,completedBy:[],ownerId:G.id,notified:false};reminderData.unshift(_newRem);
showToast(time?'⏰ 리마인더 알림이 설정되었습니다':'리마인더가 추가되었습니다');}if(time){try{if('Notification'in window&&Notification.permission==='default')Notification.requestPermission();}catch(e){}}closeModal('cal-event-modal');document.getElementById('reminder-content').value='';
  try{if(typeof flushSync==='function')flushSync();}catch(e){}
  renderReminderList();renderHomeReminders();
  try{renderTeacherWeek();}catch(e){}
  try{if(selectedCalDate)renderCalDayEvents(selectedCalDate);}catch(e){}
  try{renderCalendar();}catch(e){}
  try{scheduleReminderAlarms();}catch(e){}
}
function openReminderActions(id){currentReminderId=id;openModal('reminder-action-modal');}
function editReminder(){closeModal('reminder-action-modal');const r=reminderData.find(r=>r.id===currentReminderId);if(!r)return;document.getElementById('reminder-modal-title').textContent='📌 리마인더 수정';document.getElementById('reminder-submit-btn').textContent='수정하기';document.getElementById('reminder-content').value=r.content||'';document.getElementById('reminder-date').value=r.date||'';var _rte=document.getElementById('reminder-time');if(_rte)_rte.value=r.time||'';try{_setReminderTime(r.time||'');}catch(e){}document.getElementById('reminder-shared').checked=!!r.shared;document.getElementById('cal-event-modal').dataset.editId=currentReminderId;openModal('cal-event-modal');try{switchAddMode('todo');}catch(e){}}
function deleteReminder(){
  closeModal('reminder-action-modal');
  if(!confirm('이 할 일을 삭제할까요?'))return;
  reminderData=reminderData.filter(r=>r.id!==currentReminderId);
  try{if(typeof flushSync==='function')flushSync();}catch(e){}
  renderReminderList();renderHomeReminders();
  try{renderTeacherWeek();}catch(e){}
  try{if(selectedCalDate){renderCalDayEvents(selectedCalDate);renderCalendar();}}catch(e){}
  showToast('삭제되었습니다');
}
function renderReminderList(){const el=document.getElementById('reminder-list');if(!el)return;if(!reminderData.length){el.innerHTML='<div class="empty"><div class="empty-emoji">📌</div><div class="empty-title">리마인더가 없어요</div></div>';return;}el.innerHTML=reminderData.map(r=>`<div class="card" style="margin-bottom:8px;display:flex;align-items:flex-start;gap:10px${r.done?';opacity:.5':''}"><input type="checkbox" ${r.done?'checked':''} style="width:18px;height:18px;accent-color:var(--primary);flex-shrink:0;margin-top:2px" onchange="toggleReminder('${r.id}',this)"><div style="flex:1"><div style="font-size:13px;font-weight:600${r.done?';text-decoration:line-through':''}">${r.content}</div><div style="font-size:10px;color:var(--text-light);margin-top:3px">${r.shared?'👥 교사 공유':'🔒 나만 보기'}${r.date?' · '+r.date:''}${r.time?' ⏰ '+r.time:''}</div></div><button class="post-more-btn" onclick="openReminderActions('${r.id}')">⋯</button></div>`).join('');}
function toggleReminder(id,cb){const r=reminderData.find(r=>r.id===id);if(!r)return;r.done=cb.checked;try{if(typeof flushSync==='function')flushSync();}catch(e){}renderReminderList();renderHomeReminders();try{renderTeacherWeek();}catch(e){}try{if(selectedCalDate){renderCalDayEvents(selectedCalDate);renderCalendar();}}catch(e){}}
/* 일정 화면의 ＋ : 일정과 할 일 중 고르기 */
function openCalAddChoice(){
  var d=(typeof selectedCalDate!=='undefined'&&selectedCalDate)?selectedCalDate:toDateStr(new Date());
  var el=document.getElementById('cal-add-choice');
  if(el)el.dataset.date=d;
  openModal('cal-add-choice');
}
function calAddPick(kind){
  var el=document.getElementById('cal-add-choice');
  var d=(el&&el.dataset.date)||toDateStr(new Date());
  closeModal('cal-add-choice');
  setTimeout(function(){ kind==='event'?openCalAddModal(d):openReminderWriteModal(d); },180);
}
/* 📅 이번 주 — 일정 + 리마인더를 한 곳에서 날짜순으로 */
var WK_DOW=['일','월','화','수','목','금','토'];
function _wkDay(dateStr,todayStr){
  var d=dateStr.split('-'), dow=WK_DOW[new Date(dateStr+'T12:00:00').getDay()];
  return '<div class="wk-day'+(dateStr===todayStr?' today':'')+'"><div class="d">'+parseInt(d[2],10)+'</div><div class="w">'+dow+'</div></div>';
}
function renderTeacherWeek(){
  var el=document.getElementById('teacher-week');if(!el)return;
  try{ensureWeeklyEvents();}catch(e){}
  var n=new Date();
  var today=n.getFullYear()+'-'+pad2(n.getMonth()+1)+'-'+pad2(n.getDate());
  var sat=currentSaturday(); var end=(sat>=today)?sat:today;

  var evs=(calEvents||[]).filter(function(e){
    return e.date>=today&&e.date<=end&&(e.isRecurring||e.visibility!=='private'||e.authorId===G.id);
  }).map(function(e){return {k:'ev',date:e.date,title:e.title,meta:[e.time,e.place].filter(Boolean).join(' · '),id:e.id};});

  var rms=(reminderData||[]).filter(function(r){return !r.done&&(r.shared||!r.ownerId||r.ownerId===G.id);});
  var dated=rms.filter(function(r){return r.date&&r.date<=end;})
    .map(function(r){return {k:'rm',date:r.date,title:r.content,meta:(r.date<today?'지난 할 일':(r.date===today?'오늘':(r.time||''))),id:r.id};});
  var undated=rms.filter(function(r){return !r.date;});
  var doneR=[];

  var items=evs.concat(dated).sort(function(a,b){
    if(a.date!==b.date)return a.date<b.date?-1:1;
    return a.k===b.k?0:(a.k==='rm'?-1:1);   /* 같은 날이면 할 일을 먼저 */
  });

  var html='';
  items.forEach(function(it){
    var isRm=it.k==='rm';
    html+='<div class="wk-row"'+(isRm?'':' onclick="switchTab(\'calendar\');selectedCalDate=\''+it.date+'\';renderCalendar()" style="cursor:pointer"')+'>'
      +_wkDay(it.date,today)
      +'<div class="wk-body"><div class="wk-title"><span class="wk-chip '+(isRm?'rm">할 일':'ev">일정')+'</span>'+_esc(it.title||'')+'</div>'
      +(it.meta?'<div class="wk-meta">'+_esc(it.meta)+'</div>':'')+'</div>'
      +(isRm?'<input type="checkbox" class="wk-cb" onchange="toggleReminder(\''+it.id+'\',this)">':'')
      +'</div>';
  });

  if(undated.length||doneR.length)html+='<div class="wk-sub">할 일 · 날짜 없음</div>';
  undated.forEach(function(r){
    html+='<div class="wk-row"><div class="wk-body" style="padding-left:2px"><div class="wk-title">'+_esc(r.content||'')+'</div></div>'
      +'<input type="checkbox" class="wk-cb" onchange="toggleReminder(\''+r.id+'\',this)"></div>';
  });
  doneR.forEach(function(r){
    html+='<div class="wk-row wk-done"><div class="wk-body" style="padding-left:2px"><div class="wk-title">'+_esc(r.content||'')+'</div></div>'
      +'<input type="checkbox" class="wk-cb" checked onchange="toggleReminder(\''+r.id+'\',this)"></div>';
  });

  if(!html)html='<div style="padding:22px;text-align:center"><div style="font-size:28px">📅</div><div style="font-size:13px;color:var(--text-light);margin-top:6px">이번 주는 일정도 할 일도 없어요</div></div>';
  el.innerHTML=html;
}
function renderHomeReminders(){const el=document.getElementById('home-reminder-list');if(!el)return;const active=reminderData.filter(r=>!r.done).slice(0,3);if(!active.length){el.innerHTML='<div class="card" style="font-size:13px;color:var(--text-light);text-align:center;padding:18px">등록된 리마인더가 없어요</div>';return;}el.innerHTML=active.map(r=>`<div class="card" style="margin-bottom:8px;display:flex;align-items:center;gap:10px"><input type="checkbox" onchange="toggleReminder('${r.id}',this)" style="width:18px;height:18px;accent-color:var(--primary);flex-shrink:0;cursor:pointer"><div style="flex:1"><div style="font-size:13px;font-weight:600">${r.content}</div>${r.date?`<div style="font-size:10px;color:var(--text-light);margin-top:2px">${r.date}</div>`:''}</div></div>`).join('');}

let qrState={week:'',code:'',resetUsed:false};
function qrImgUrl(size){return 'https://api.qrserver.com/v1/create-qr-code/?size='+size+'x'+size+'&margin=10&data='+encodeURIComponent('HD-ATTEND-'+qrState.week+'-'+qrState.code);}
function syncQRUI(){const sat=currentSaturday();if(qrState.week&&qrState.week!==sat)qrState={week:'',code:'',resetUsed:false};const isFull=G.type==='principal'||G.type==='admin'||G.isAdmin;const has=!!qrState.code;show('qr-code-display',has);show('qr-view-btn',has);const gb=document.getElementById('qr-generate-btn');if(gb)gb.style.display=(isFull&&!has)?'':'none';show('qr-reset-btn',isFull);const rb=document.getElementById('qr-reset-btn');if(rb){rb.style.opacity=(has&&!qrState.resetUsed)?'1':'.45';}const st=document.getElementById('qr-status-text');if(st)st.textContent=has?(isFull?'이번 주 QR이 생성되었습니다 · 모든 선생님과 공유 중':'교감·교무 선생님이 생성한 이번 주 QR이에요'):(isFull?'금요일~토요일에 QR을 생성할 수 있어요':'아직 이번 주 QR이 없어요. 교감·교무 선생님이 생성하면 여기에 공유됩니다');if(has){const img=document.getElementById('qr-img');if(img)img.src=qrImgUrl(300);const tx=document.getElementById('qr-code-text');if(tx)tx.textContent=qrState.code;const i2=document.getElementById('qr-img-full');if(i2)i2.src=qrImgUrl(480);const t2=document.getElementById('qr-code-text-full');if(t2)t2.textContent=qrState.code;const vd=document.getElementById('qr-valid-date');if(vd)vd.textContent='유효기간: '+sat+' (토) 당일';}}
function generateQR(){const isFull=G.type==='principal'||G.type==='admin'||G.isAdmin;if(!isFull){showToast('QR 생성은 교감·교무·관리자만 할 수 있어요');return;}if(isVacationDate(currentSaturday())){showToast('이번 주는 방학(미사없음)이라 출석 QR을 생성하지 않아요');return;}const dow=new Date().getDay();if(dow!==5&&dow!==6){showToast('금요일~토요일에만 QR을 생성할 수 있어요');return;}if(qrState.code){showToast('이미 이번 주 QR이 생성되었어요');return;}qrState.week=currentSaturday();qrState.code=String(Math.floor(100000+Math.random()*900000));try{appConfig.qr={week:qrState.week,code:qrState.code,resetUsed:!!qrState.resetUsed};}catch(e){}try{if(window.flushCfg)window.flushCfg();}catch(e){}syncQRUI();showToast('QR이 생성되었습니다! 모든 교사와 공유됩니다');}
function resetQR(){const isFull=G.type==='principal'||G.type==='admin'||G.isAdmin;if(!isFull){showToast('교감·교무·관리자만 초기화할 수 있어요');return;}if(!qrState.code){showToast('초기화할 QR이 없어요. 먼저 QR을 생성해주세요');return;}if(qrState.resetUsed){showToast('이번 주 초기화를 이미 사용했어요');return;}openModal('qr-reset-confirm-modal');}
function confirmResetQR(){closeModal('qr-reset-confirm-modal');qrState.code='';qrState.resetUsed=true;try{appConfig.qr={week:qrState.week||currentSaturday(),code:'',resetUsed:true};}catch(e){}try{if(window.flushCfg)window.flushCfg();}catch(e){}syncQRUI();showToast('QR이 초기화되었습니다. 새 QR을 생성할 수 있어요');}

function openDiaryWriteModal(){editingDiaryId=null;const tt=document.getElementById('diary-modal-title');if(tt)tt.textContent='📖 다이어리 작성';const sel=document.getElementById('diary-teacher-select');if(sel){const teachers=pendingList.filter(u=>u.approved&&u.role==='teacher');sel.innerHTML='<option value="">교사를 선택하세요</option>'+teachers.map(t=>{const POS={m1:'중1',m2:'중2',m3:'중3',h:'고등',principal:'교감',admin:'교무',etc:'기타'};return `<option value="${t.id}">${t.name} ${t.baptism} (${POS[t.teacherType]||t.teacherType})</option>`;}).join('');}document.getElementById('diary-title').value='';document.getElementById('diary-content').value='';const priv=document.querySelector('input[name="diary-scope"][value="private"]');if(priv)priv.checked=true;onScopeChange();openModal('diary-write-modal');}
function onScopeChange(){const scope=document.querySelector('input[name="diary-scope"]:checked')?.value||'private';show('specific-teacher-wrap',scope==='specific');document.querySelectorAll('#diary-scope-group label').forEach(l=>{l.style.borderColor='var(--border-light)';l.style.background='';});const checked=document.querySelector('input[name="diary-scope"]:checked');if(checked){const lbl=checked.closest('label');if(lbl){lbl.style.borderColor='var(--lavender)';lbl.style.background='var(--lavender-light)';}}}
function submitDiary(){if(gradGuard())return;const title=(document.getElementById('diary-title').value||'').trim();const content=(document.getElementById('diary-content').value||'').trim();const scope=document.querySelector('input[name="diary-scope"]:checked')?.value||'private';if(!content){showToast('내용을 입력해주세요');return;}let teacherId='',teacherName='';if(scope==='specific'){teacherId=document.getElementById('diary-teacher-select').value;if(!teacherId){showToast('교사를 선택해주세요');return;}const t=pendingList.find(u=>u.id===teacherId);teacherName=t?t.name+' '+t.baptism:'';}if(editingDiaryId){const d=diaryData.find(x=>x.id===editingDiaryId);if(d){d.title=title;d.content=content;d.scope=scope;d.teacherId=teacherId;d.teacherName=teacherName;d.edited=true;try{if(window.FB&&FB.enabled())FB.save('diaries',d.id,d);}catch(e){}}editingDiaryId=null;closeModal('diary-write-modal');document.getElementById('diary-title').value='';document.getElementById('diary-content').value='';renderDiaryList();showToast('다이어리가 수정되었습니다!');return;}const now=new Date();const date=now.getFullYear()+'.'+(now.getMonth()+1).toString().padStart(2,'0')+'.'+now.getDate().toString().padStart(2,'0');const _nd={id:'d'+Date.now(),studentId:G.id,studentGrade:G.gradeKey,title,content,scope,teacherId,teacherName,date,comments:[]};diaryData.unshift(_nd);try{if(window.FB&&FB.enabled())FB.save('diaries',_nd.id,_nd);}catch(e){}if(scope==='teacher'){notifications.unshift({pushed:false,id:'nt-diary-'+Date.now(),text:`📖 ${G.name} ${G.baptism} 학생이 신앙 다이어리를 공유했어요`,time:'방금',ts:Date.now(),readBy:[],hiddenBy:[],forRole:'teacher-grade-'+G.gradeKey,tap:{type:'diary-shared',sid:G.id}});}else if(scope==='specific'){notifications.unshift({pushed:false,id:'nt-diary-'+Date.now(),text:`📖 ${G.name} ${G.baptism} 학생이 신앙 다이어리를 공유했어요`,time:'방금',ts:Date.now(),readBy:[],hiddenBy:[],forTeacherId:teacherId,tap:{type:'diary-shared',sid:G.id}});}updateNotifDot();closeModal('diary-write-modal');document.getElementById('diary-title').value='';document.getElementById('diary-content').value='';renderDiaryList();showToast('다이어리가 저장되었습니다!');}
function renderAdminDiaryList(){const el=document.getElementById('admin-diary-list');if(!el)return;const list=diaryData.filter(d=>{if(d.scope==='private')return false;const stu=pendingList.find(u=>u.id===d.studentId);return stu&&canViewDiary(d,stu);});if(!list.length){el.innerHTML='<div class="empty"><div class="empty-emoji">📖</div><div class="empty-title">공유된 다이어리가 없어요</div><div class="empty-desc">학생이 선생님께 공유하면 여기에 표시돼요</div></div>';return;}const SCOPE={teacher:'👨‍🏫 학년교사',specific:'✝️ 특정교사'};el.innerHTML=list.map(d=>{const stu=pendingList.find(u=>u.id===d.studentId);const nm=stu?stu.name+' '+stu.baptism:'(알 수 없음)';const gl=stu?stu.gradeLabel||'':'';const n=(d.comments||[]).length;const prev=(d.content||'').slice(0,60);return `<div class="diary-card" style="margin-bottom:10px;cursor:pointer" onclick="openDiaryDetail('${d.id}')"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span style="font-size:12px;font-weight:800">🎒 ${nm} <span style="font-size:10px;color:var(--text-light);font-weight:500">(${gl})</span></span><span style="font-size:10px;color:var(--text-light)">${d.date||''}</span></div><div style="font-size:12px;font-weight:700;margin-bottom:3px">${d.title||'무제'}</div><div style="font-size:12px;color:var(--text-sub);line-height:1.6;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${prev}${(d.content||'').length>60?'...':''}</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><span style="font-size:10px;color:var(--lavender);font-weight:600">${SCOPE[d.scope]||''}${d.scope==='specific'&&d.teacherName?' ('+d.teacherName+')':''}</span><span style="font-size:11px;color:var(--text-light)">💬 ${n} · 자세히 보기 ›</span></div></div>`;}).join('');}
function canViewDiary(d,student){if(d.studentId===G.id)return true;if(d.scope==='private')return false;if(d.scope==='specific')return G.id===d.teacherId;if(d.scope==='teacher')return G.isAdmin||G.type==='principal'||G.type==='admin'||(G.role==='teacher'&&G.type===(student?student.gradeKey:d.studentGrade));return false;}
let editingDiaryId=null;
function editDiary(id){const d=diaryData.find(x=>x.id===id&&x.studentId===G.id);if(!d)return;openDiaryWriteModal();editingDiaryId=id;const tt=document.getElementById('diary-modal-title');if(tt)tt.textContent='✏️ 다이어리 수정';document.getElementById('diary-title').value=d.title||'';document.getElementById('diary-content').value=d.content||'';const r=document.querySelector(`input[name="diary-scope"][value="${d.scope}"]`);if(r){r.checked=true;r.dispatchEvent(new Event('change'));}if(d.scope==='specific'){const sel=document.getElementById('diary-teacher-select');if(sel)sel.value=d.teacherId||'';}openModal('diary-write-modal');}
function deleteDiary(id){const d=diaryData.find(x=>x.id===id&&x.studentId===G.id);if(!d)return;if(!confirm('이 다이어리를 삭제할까요?'+((d.comments||[]).length?'\n선생님의 답장도 함께 삭제됩니다.':'')))return;diaryData=diaryData.filter(x=>x.id!==id);try{if(window.FB&&FB.enabled())FB.remove('diaries',id);}catch(e){}renderDiaryList();showToast('다이어리가 삭제되었습니다');}
function renderDiaryList(){const el=document.getElementById('diary-list');if(!el)return;const mine=diaryData.filter(d=>d.studentId===G.id);if(!mine.length){el.innerHTML='<div class="empty"><div class="empty-emoji">📖</div><div class="empty-title">아직 기록이 없어요</div><div class="empty-desc">첫 번째 신앙 일기를 작성해보세요!</div></div>';return;}const SCOPE={private:'🔒 나만',teacher:'👨‍🏫 학년교사',specific:'✝️ 특정교사'};el.innerHTML=mine.map(d=>{const n=(d.comments||[]).length;const prev=(d.content||'').slice(0,60);return `<div class="diary-card" onclick="openDiaryDetail('${d.id}')" style="cursor:pointer"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="flex:1;min-width:0;font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.title||'무제'}</span><span style="font-size:10px;color:var(--text-light);white-space:nowrap;flex-shrink:0">${d.date}</span><button onclick="event.stopPropagation();editDiary('${d.id}')" title="수정" style="flex-shrink:0;background:none;border:none;cursor:pointer;font-size:13px;line-height:1;padding:4px;border-radius:6px">✏️</button><button onclick="event.stopPropagation();deleteDiary('${d.id}')" title="삭제" style="flex-shrink:0;background:none;border:none;cursor:pointer;font-size:13px;line-height:1;padding:4px;border-radius:6px">🗑️</button></div><p style="font-size:12px;color:var(--text-sub);line-height:1.6;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${prev}${(d.content||'').length>60?'...':''}</p><div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><span style="font-size:10px;color:var(--lavender);font-weight:600">${SCOPE[d.scope]||''}${d.scope==='specific'&&d.teacherName?' ('+d.teacherName+')':''}</span><span style="font-size:11px;color:var(--text-light)">💬 ${n} · 자세히 보기 ›</span></div></div>`;}).join('');}
function canEditDiaryCmt(c){
  if(!c)return false;
  if(c.authorId)return c.authorId===G.id||G.role==='teacher';
  return c.author===G.displayName||G.role==='teacher';   /* 옛 데이터 호환 */
}
function diaryThreadHTML(d){return (d.comments&&d.comments.length)?`<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border-light);display:flex;flex-direction:column;gap:8px">${d.comments.map((c,ix)=>{
  const ok=canEditDiaryCmt(c);
  return `<div style="font-size:12px;line-height:1.6"><strong onclick="openProfileView('${c.authorId||''}')" style="color:var(--primary-dark);cursor:pointer">${c.role==='student'?'🙋':'👨‍🏫'} ${c.author}</strong> <span style="font-size:10px;color:var(--text-light)">${_timeAgo(c.ts,c.time)}${c.edited?' (수정됨)':''}</span>${ok?` <button onclick="editDiaryComment(${ix})" style="background:none;border:none;color:var(--text-light);font-size:10px;cursor:pointer;padding:0 2px;font-family:inherit">수정</button><button onclick="deleteDiaryComment(${ix})" style="background:none;border:none;color:var(--text-light);font-size:10px;cursor:pointer;padding:0 2px;font-family:inherit">삭제</button>`:''}<div style="color:var(--text-sub)">${c.text}</div></div>`;
}).join('')}</div>`:'<div style="font-size:11px;color:var(--text-light);margin-top:12px;padding-top:10px;border-top:1px solid var(--border-light)">아직 댓글이 없어요</div>';}
/* 다이어리 댓글(답장) 수정·삭제 — 작성자 본인 또는 교사 */
function _saveDiaryNow(d){
  try{
    if(window.FB&&FB.enabled()&&FB.save)FB.save('diaries',d.id,d);
    if(window.flushSync)window.flushSync();
  }catch(e){console.warn('[DIARY]',e);}
}
function editDiaryComment(ix){
  const d=diaryData.find(x=>x.id===currentDiaryDetailId); if(!d)return;
  const c=(d.comments||[])[ix]; if(!c)return;
  if(!canEditDiaryCmt(c)){showToast('수정 권한이 없어요');return;}
  const v=prompt('댓글 수정',c.text);
  if(v===null)return;
  const t=(v||'').trim();
  if(!t){showToast('내용을 입력해주세요');return;}
  c.text=t; c.edited=true;
  _saveDiaryNow(d);
  renderDiaryDetailThread();
  try{if(document.getElementById('diary-list'))renderDiaryList();}catch(e){}
  try{if(document.getElementById('admin-diary-list'))renderAdminDiaryList();}catch(e){}
  showToast('댓글을 수정했어요');
}
function deleteDiaryComment(ix){
  const d=diaryData.find(x=>x.id===currentDiaryDetailId); if(!d)return;
  const c=(d.comments||[])[ix]; if(!c)return;
  if(!canEditDiaryCmt(c)){showToast('삭제 권한이 없어요');return;}
  if(!confirm('이 댓글을 삭제할까요?'))return;
  d.comments.splice(ix,1);
  _saveDiaryNow(d);
  renderDiaryDetailThread();
  try{if(document.getElementById('diary-list'))renderDiaryList();}catch(e){}
  try{if(document.getElementById('admin-diary-list'))renderAdminDiaryList();}catch(e){}
  showToast('댓글을 삭제했어요');
}
function openDiaryDetail(did){const d=diaryData.find(x=>x.id===did);if(!d)return;const isOwner=d.studentId===G.id;if(!isOwner){const stu=pendingList.find(u=>u.id===d.studentId);if(!canViewDiary(d,stu))return;}currentDiaryDetailId=did;const SCOPE={private:'🔒 나만 보기',teacher:'👨‍🏫 학년교사 공유',specific:'✝️ 특정교사 공유'};const stu=pendingList.find(u=>u.id===d.studentId);document.getElementById('dd-title').textContent=d.title||'무제';document.getElementById('dd-meta').innerHTML=`${isOwner?'':(stu?'🎒 '+stu.name+' '+stu.baptism+' · ':'')}${d.date||''} · ${SCOPE[d.scope]||''}${d.scope==='specific'&&d.teacherName?' ('+d.teacherName+')':''}`;document.getElementById('dd-content').textContent=d.content||'';renderDiaryDetailThread();openModal('diary-detail-modal');}
function renderDiaryDetailThread(){const d=diaryData.find(x=>x.id===currentDiaryDetailId);if(!d)return;document.getElementById('dd-thread').innerHTML=diaryThreadHTML(d);const canReply=(d.studentId===G.id&&d.scope!=='private')||G.role==='teacher';document.getElementById('dd-input-row').style.display=canReply?'flex':'none';}
function submitDiaryDetailReply(){const d=diaryData.find(x=>x.id===currentDiaryDetailId);if(!d)return;const inp=document.getElementById('dd-input');const text=(inp.value||'').trim();if(!text)return;inp.value='';const isOwner=d.studentId===G.id;(d.comments=d.comments||[]).push({author:G.displayName,authorId:G.id,role:isOwner?'student':'teacher',text,time:'방금',ts:Date.now()});try{if(window.FB&&FB.enabled())FB.save('diaries',d.id,d);}catch(e){}if(isOwner){if(d.scope==='specific'&&d.teacherId)notifications.unshift({pushed:false,id:'nt'+Date.now(),text:`💬 ${G.name} ${G.baptism} 학생이 다이어리 댓글을 남겼어요`,time:'방금',ts:Date.now(),readBy:[],forTeacherId:d.teacherId,tap:{type:'diary-shared',sid:G.id}});else if(d.scope==='teacher')notifications.unshift({pushed:false,id:'nt'+Date.now(),text:`💬 ${G.name} ${G.baptism} 학생이 다이어리 댓글을 남겼어요`,time:'방금',ts:Date.now(),readBy:[],forRole:'teacher-grade-'+G.gradeKey,tap:{type:'diary-shared',sid:G.id}});}else{notifications.unshift({pushed:false,id:'nt'+Date.now(),text:`💬 ${G.name} 선생님이 다이어리에 답장을 남겼어요`,time:'방금',ts:Date.now(),readBy:[],forStudentId:d.studentId,tap:{type:'diary-reply'}});}updateNotifDot();renderDiaryDetailThread();if(document.getElementById('diary-list'))renderDiaryList();if(document.getElementById('admin-diary-list'))renderAdminDiaryList();showToast('댓글을 남겼어요');}
function openMyCard(){const GRADE={m1:'중1',m2:'중2',m3:'중3',h:'고등부'};const GCHIP={m1:'<span class="grade-m1">중1</span>',m2:'<span class="grade-m2">중2</span>',m3:'<span class="grade-m3">중3</span>',h:'<span class="grade-h">고등</span>'};let lv='🌱 씨앗';const t=G.attendTotal||0;for(const L of ATTEND_LEVELS)if(t>=L.n)lv=L.l;const el=document.getElementById('mycard-content');if(!el)return;el.innerHTML=`<div style="background:linear-gradient(135deg,var(--mint-light),var(--primary-light));border-radius:var(--radius-lg);padding:18px;margin-bottom:14px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--lavender));display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:white">${G.name.charAt(0)}</div><div><div style="font-size:16px;font-weight:800">${G.displayName}${G.graduated?' <span class="chip chip-gray" style="font-size:9px;vertical-align:2px">🎓 졸업생</span>':''}</div><div style="margin-top:4px">${GCHIP[G.gradeKey]||''}</div></div></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"><div style="background:white;border-radius:10px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--primary)">${t}</div><div style="font-size:9px;color:var(--text-light)">누적 출석</div></div><div style="background:white;border-radius:10px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--mint)">${G.streak||0}</div><div style="font-size:9px;color:var(--text-light)">연속 출석</div></div><div style="background:white;border-radius:10px;padding:10px;text-align:center"><div style="font-size:20px">${lv.split(' ')[0]}</div><div style="font-size:9px;color:var(--text-light)">현재 등급</div></div></div></div><div class="card" style="margin-bottom:14px"><div style="display:flex;padding:9px 0;border-bottom:1px solid var(--border-light)"><div style="font-size:12px;color:var(--text-sub);width:76px">세례명</div><div style="font-size:13px;font-weight:600">${G.baptism}</div></div><div style="display:flex;padding:9px 0;border-bottom:1px solid var(--border-light)"><div style="font-size:12px;color:var(--text-sub);width:76px">학년</div><div style="font-size:13px;font-weight:600">${G.grade||GRADE[G.gradeKey]||'-'}</div></div><div style="display:flex;padding:9px 0"><div style="font-size:12px;color:var(--text-sub);width:76px">등급</div><div style="font-size:13px;font-weight:600">${lv}</div></div><div style="display:flex;padding:9px 0;border-top:1px solid var(--border-light)"><div style="font-size:12px;color:var(--text-sub);width:76px">담당교사</div><div style="font-size:13px;font-weight:600">${myTeacherNames(G.gradeKey)}</div></div></div><div id="diary-history"></div>`;renderDiaryHistory();openModal('mycard-modal');}
function openBadgeInfo(){const el=document.getElementById('badge-detail');if(!el)return;const t=G.attendTotal||0;let cur=null,next=null;for(const L of ATTEND_LEVELS){if(t>=L.n)cur=L;else if(!next)next=L;}el.innerHTML=`<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:8px 0">${ATTEND_LEVELS.map(L=>`<div style="text-align:center;${t>=L.n?'':'opacity:.4'}"><div style="font-size:28px;${t>=L.n?'':'filter:grayscale(1)'}">${L.l.split(' ')[0]}</div><div style="font-size:10px;font-weight:700;margin-top:4px">${L.l.split(' ')[1]}</div><div style="font-size:9px;color:${t>=L.n?'var(--mint)':'var(--text-light)'}">${t>=L.n?'달성!':L.n+'회'}</div></div>`).join('')}</div><div class="card" style="margin:8px 0;background:var(--primary-light)"><div style="font-size:13px;font-weight:800">${cur?cur.l:'등급 없음'} <span style="font-size:11px;font-weight:500;color:var(--text-sub)">· 누적 출석 ${t}회</span></div><div style="font-size:11px;color:var(--text-sub);margin-top:6px;line-height:1.6">토요일 주일학교에 출석하면 누적 1회(반일출석은 0.5회)가 쌓여요. 누적 횟수가 기준에 도달하면 등급이 올라가고 보상 쿠폰이 발급됩니다. 등급은 내려가지 않아요!</div>${next?`<div style="font-size:12px;font-weight:700;margin-top:8px;color:var(--primary-dark)">다음 등급 ${next.l}까지 <b>${next.n-t}회</b> 남았어요 (${next.n}회 달성 시)</div>`:'<div style="font-size:12px;font-weight:700;margin-top:8px;color:var(--primary-dark)">👑 최고 등급 달성! 내년에 왕관을 하나 더 모아보세요</div>'}</div><div style="font-size:12px;font-weight:800;margin:10px 0 6px">🎁 등급별 보상</div>${ATTEND_LEVELS.map(L=>`<div style="display:flex;justify-content:space-between;padding:8px 4px;border-bottom:1px solid var(--border-light);font-size:12px"><span style="font-weight:700;${t>=L.n?'':'opacity:.5'}">${L.l} <span style="font-weight:500;color:var(--text-light)">(${L.n}회)</span></span><span style="${t>=L.n?'color:var(--mint);font-weight:700':'color:var(--text-sub)'}">${L.r||'-'}</span></div>`).join('')}`;openModal('badge-modal');}
function toggleHideMember(uid){const u=pendingList.find(x=>x.id===uid);if(!u)return;if(u.isAdmin){showToast('🛡️ 관리자 계정은 숨길 수 없어요. 먼저 이임하세요');return;}u.hidden=!u.hidden;showToast(u.hidden?'🙈 숨김 처리되었어요 (목록·알림·통계 제외)':'👀 숨김이 해제되었어요');renderMembersList();}
function removeMember(uid){const u=pendingList.find(x=>x.id===uid);if(!u)return;if(u.isAdmin){showToast('🛡️ 관리자 계정은 삭제할 수 없어요. 먼저 이임하세요');return;}if(!confirm(u.name+' '+u.baptism+' 회원을 삭제할까요?\n계정과 모든 기록이 삭제되며 되돌릴 수 없습니다.\n\n※ 일시 중지는 삭제 대신 숨김을 사용하세요.'))return;if(!confirm('정말 삭제합니다. 마지막 확인입니다.'))return;purgeMemberData(uid);showToast('회원과 관련 기록이 모두 삭제되었습니다');renderMembersList();try{renderAdminCouponList();}catch(e){}}
/* 회원 삭제 시 그 사람의 흔적을 한 번에 정리 (쿠폰이 남아 처리 불가해지는 문제 방지) */
function purgeMemberData(uid){
  pendingList=pendingList.filter(x=>x.id!==uid);
  coupons=coupons.filter(c=>c.studentId!==uid);
  diaryData=diaryData.filter(d=>d.studentId!==uid&&d.authorId!==uid);
  letters=letters.filter(l=>l.studentId!==uid&&l.authorId!==uid);
  birthdayComments=birthdayComments.filter(b=>b.targetId!==uid&&b.authorId!==uid);
  bdayLikes=bdayLikes.filter(b=>b.targetId!==uid&&b.userId!==uid);
  reminderData=(reminderData||[]).filter(r=>r.ownerId!==uid);
  notifications=notifications.filter(n=>n.absentUid!==uid&&n.forStudentId!==uid&&n.forTeacherId!==uid);
  adminVote=adminVote&&(adminVote.candidateId===uid||adminVote.proposerId===uid)?null:adminVote;
  try{if(window.flushSync)window.flushSync();}catch(e){}
}
/* 이미 사라진 학생의 '고아 쿠폰' 자동 정리 */
function cleanOrphanCoupons(){
  /* 안전장치: 회원 목록이 아직 안 왔으면 실행 금지 (멀쩡한 쿠폰이 지워질 수 있음) */
  if(!pendingList.length)return 0;
  if(window.FB&&FB.enabled()&&!window._membersLoaded)return 0;
  const ids=new Set(pendingList.map(u=>u.id));
  ids.add(ADMIN.id);                       /* 관리자 계정 보호 */
  const before=coupons.length;
  coupons=coupons.filter(c=>!c.studentId||ids.has(c.studentId));
  const n=before-coupons.length;
  if(n){console.log('[COUPON] 고아 쿠폰 '+n+'건 정리');try{if(window.flushSync)window.flushSync();}catch(e){}}
  return n;
}
let printOptsUid=null;
function openPrintOptions(uid){const u=pendingList.find(x=>x.id===uid);if(!u)return;printOptsUid=uid;const el=document.getElementById('po-student');if(el)el.textContent='🎒 '+u.name+' '+u.baptism+' ('+(u.gradeLabel||'')+') 활동기록';const set=(id,v)=>{const c=document.getElementById(id);if(c)c.checked=v;};set('po-diary-teacher',true);set('po-diary-specific',false);set('po-diary-private',false);set('po-letters',!!u.graduated||u.gradeLabel==='고3');openModal('print-opts-modal');}
function doPrintStudentRecord(){const uid=printOptsUid;if(!uid)return;const gv=id=>{const c=document.getElementById(id);return c?c.checked:false;};const opts={diaryTeacher:gv('po-diary-teacher'),diarySpecific:gv('po-diary-specific'),diaryPrivate:gv('po-diary-private'),letters:gv('po-letters')};closeModal('print-opts-modal');printStudentRecord(uid,opts);}
function printStudentRecord(uid,opts){opts=opts||{diaryTeacher:true,diarySpecific:true,diaryPrivate:true,letters:true};const u=pendingList.find(x=>x.id===uid);if(!u)return;const grad=!!u.graduated;const hist=(u.history||[]).slice();const t=u.attendTotal||0;if(t>0||(u.attendedWeeks||[]).length){let lv='🌱 씨앗';for(const L of ATTEND_LEVELS)if(t>=L.n)lv=L.l;hist.push({year:new Date().getFullYear(),term:((appConfig&&appConfig.termStart)?appConfig.termStart.slice(0,4):String(new Date().getFullYear()))+'학년도 (진행 중)',from:(appConfig&&appConfig.termStart)||'',to:toDateStr(new Date()),grade:u.gradeLabel||'',attendTotal:t,level:lv,weeks:(u.attendedWeeks||[]).slice(),halfWeeks:(u.halfWeeks||[]).slice()});}const diaries=(grad||u.gradeLabel==='고3')?diaryData.filter(d=>d.studentId===uid&&(d.scope==='specific'?opts.diarySpecific:d.scope==='private'?opts.diaryPrivate:opts.diaryTeacher)):[];const myLetters=(opts.letters&&(grad||u.gradeLabel==='고3')&&typeof letters!=='undefined'?letters:[]).filter(l=>l.studentId===uid&&!l.excluded).sort((a,b)=>((a.authorRole==='teacher')?0:1)-((b.authorRole==='teacher')?0:1));const cc=(typeof crownCount==='function')?crownCount(u):0;const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;');const totalAttend=Math.round(hist.reduce((a,x)=>a+(x.attendTotal||0),0)*10)/10;const years=hist.length;let peakTotal=0;hist.forEach(x=>{if((x.attendTotal||0)>peakTotal)peakTotal=x.attendTotal||0;});let peakLv='🌱 씨앗';for(const L of ATTEND_LEVELS)if(peakTotal>=L.n)peakLv=L.l;const peakEmoji=peakLv.split(' ')[0];const peakName=peakLv.split(' ').slice(1).join(' ')||peakLv;const today=new Date().toLocaleDateString('ko-KR');const gradInfo=grad?(' \u00b7 '+(u.graduatedYear||'')+'년 졸업'):'';const _tl=x=>x.term?x.term:(x.year+'학년도');
const _tr=x=>(x.from&&x.to)?`<div style="font-size:9px;color:#888">${x.from.replace(/-/g,'.').slice(2)} ~ ${x.to.replace(/-/g,'.').slice(2)}</div>`:'';
const rows=hist.length?hist.slice().sort((a,b)=>String(a.from||a.year).localeCompare(String(b.from||b.year))).map(x=>`<tr><td>${esc(_tl(x))}${_tr(x)}</td><td>${x.grade||'-'}</td><td>${x.attendTotal}회</td><td>${x.level||'-'}</td></tr>`).join(''):'<tr><td colspan="4" style="text-align:center;color:#aba7c2">기록 없음</td></tr>';const diaryHtml=diaries.length?diaries.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).map(d=>{const reps=(d.comments||[]).filter(c=>c&&c.text).map(c=>`<div class="rep"><b>${c.role==='teacher'?'👨\u200d🏫 '+esc(c.author||'선생님'):'🙋 '+esc(c.author||'본인')}</b> ${esc(c.text)}</div>`).join('');return `<div class="diary"><div class="t">${esc(d.title||'무제')}<span class="dt">${d.date||''}</span></div><div class="c">${esc(d.content||'')}</div>${reps}</div>`;}).join(''):'<div class="empty">작성한 다이어리가 없습니다.</div>';const giftHtml=myLetters.length?`<div class="gift"><div class="orn">❦</div><h3>${esc(u.name)} ${esc(u.baptism)}에게</h3><div class="to">선생님과 친구들이 마음을 담아 전합니다</div>${myLetters.map(l=>`<div class="gl"><div class="q">“</div><div class="meta">${esc(l.date||'')}</div><div class="body">${esc(l.text||'')}</div><div class="sign">${esc(l.authorName)}<span class="role">${l.authorRole==='teacher'?'선생님':l.authorRole==='parent'?'학부모':'친구'}</span></div></div>`).join('')}<div class="orn" style="margin-top:2px">❧</div></div>`:'';const html=`<html><head><meta charset="utf-8"><title>${esc(u.name)} 활동기록</title><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Jua&family=Gowun+Dodum&family=Gowun+Batang:wght@400;700&family=Noto+Serif+KR:wght@400;500;700&family=Nanum+Myeongjo:wght@400;700;800&family=Gaegu:wght@400;700&family=Dancing+Script:wght@600;700&family=Nanum+Pen+Script&display=swap" rel="stylesheet"><style>@font-face{font-family:'OnglipJuRiSonPenji';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2405-2@1.0/Ownglyph_jooreeletter-Rg.woff2') format('woff2');font-weight:normal;font-display:swap}@page{margin:15mm}*{box-sizing:border-box}body{font-family:'Gowun Dodum','Noto Sans KR','Malgun Gothic',sans-serif;color:#2b2b33;margin:0;padding:26px 30px;line-height:1.55}.topbar{height:9px;background:linear-gradient(90deg,#7c6cf0,#b8a9f0 55%,#e6c672);border-radius:5px;margin-bottom:20px}.hd{display:flex;align-items:center;gap:16px;border-bottom:3px solid #7c6cf0;padding-bottom:14px}.hd .em{font-size:42px;line-height:1}.hd .org{font-size:11px;color:#9a96b4;letter-spacing:2px;font-weight:800}.hd .nm{font-family:'Jua','Gowun Dodum',sans-serif;font-size:26px;font-weight:400;margin-top:3px;letter-spacing:.5px}.hd .sub{font-size:12px;color:#79758e;margin-top:4px}.crown{margin-left:auto;text-align:right;font-size:12px;font-weight:700;color:#a07b00;background:#fff7e0;border:1px solid #f2e2ab;border-radius:10px;padding:8px 12px;line-height:1.5}.stats{display:flex;gap:10px;margin:18px 0 4px}.stat{flex:1;background:#f6f5fc;border:1px solid #eae7f7;border-radius:12px;padding:13px 8px;text-align:center}.stat .n{font-family:'Jua',sans-serif;font-size:23px;font-weight:400;color:#6b5bd2;line-height:1.15}.stat .l{font-size:11px;color:#8b87a4;margin-top:3px}h2{font-family:'Jua','Gowun Dodum',sans-serif;font-weight:400;font-size:15px;margin:24px 0 9px;color:#453f63;display:flex;align-items:center;gap:7px}h2::before{content:'';width:4px;height:15px;background:#7c6cf0;border-radius:2px}table{width:100%;border-collapse:separate;border-spacing:0;font-size:12px;border:1px solid #eae7f7;border-radius:10px;overflow:hidden}th{background:#7c6cf0;color:#fff;padding:8px 11px;text-align:left;font-weight:700}td{border-top:1px solid #eee9f8;padding:8px 11px}tr:nth-child(even) td{background:#faf9fe}.diary{border:1px solid #ece9f8;border-left:4px solid #b8a9f0;border-radius:10px;padding:12px 14px;margin:10px 0;break-inside:avoid}.diary .t{font-weight:800;font-size:13px;color:#332f4a}.diary .dt{font-size:10px;color:#aba7c2;font-weight:600;margin-left:6px}.diary .c{font-size:12px;color:#3d3a54;margin-top:6px;white-space:pre-wrap;line-height:1.7}.diary .rep{margin-top:8px;padding-top:7px;border-top:1px dashed #e6e3f2;font-size:11px;color:#5b5776;line-height:1.6}.diary .rep b{color:#6b5bd2;font-weight:700}.empty{font-size:12px;color:#aba7c2;padding:10px 2px}.gift{page-break-before:always;font-family:'Gowun Dodum','Noto Sans KR',sans-serif;padding-top:6px}.gift .orn{text-align:center;color:#c9a84c;font-size:17px;margin:10px 0 2px;letter-spacing:9px}.gift h3{font-family:'Noto Serif KR','Gowun Batang',serif;text-align:center;font-size:26px;color:#463a1e;margin:6px 0 2px;font-weight:800;letter-spacing:-.5px}.gift .to{text-align:center;font-size:13px;color:#a2905e;margin-bottom:24px;letter-spacing:.5px}.gl{position:relative;padding:34px 34px 26px;margin:0 0 20px;break-inside:avoid;background:#fffdf5;border:1px solid #ddcb9a;border-radius:10px;box-shadow:0 0 0 5px #fffdf5 inset,0 1px 2px rgba(160,140,80,.15)}.gl .q{position:absolute;top:10px;left:16px;font-size:30px;color:#e6d7ab;font-family:Georgia,serif;line-height:1}.gl .meta{position:absolute;top:12px;right:18px;font-size:10px;color:#b8a67a;letter-spacing:.3px}.gl .body{font-family:'OnglipJuRiSonPenji','Noto Serif KR','Gowun Batang',serif;font-weight:400;font-size:17px;line-height:34px;letter-spacing:.2px;color:#2e2b1e;white-space:pre-wrap;word-break:keep-all;background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 33px,#e9dcb6 33px,#e9dcb6 34px);background-size:100% 34px}.gl .sign{text-align:right;margin-top:18px;font-family:'OnglipJuRiSonPenji','Nanum Pen Script',cursive;font-size:19px;color:#7a6435;line-height:1.5}.gl .role{font-family:'Gowun Dodum',sans-serif;font-size:11px;color:#a2905e;margin-left:6px;vertical-align:3px}.ft{margin-top:28px;padding-top:12px;border-top:1px solid #eae7f7;display:flex;justify-content:space-between;font-size:11px;color:#9a96b4}@media print{.diary{break-inside:avoid}tr{break-inside:avoid}h2{break-after:avoid}}</style></head><body><div class="topbar"></div><div class="hd"><div class="em">${grad?'🎓':'📜'}</div><div><div class="org">하늘의문 중고등부</div><div class="nm">${esc(u.name)} ${esc(u.baptism)}</div><div class="sub">${esc(u.gradeLabel||'')}${gradInfo} \u00b7 발행일 ${today}</div></div>${cc?`<div class="crown">👑 왕관 ${cc}회<br>${'👑'.repeat(Math.min(cc,5))}</div>`:''}</div><div class="stats"><div class="stat"><div class="n">${totalAttend}</div><div class="l">📅 누적 출석(회)</div></div><div class="stat"><div class="n">${years}</div><div class="l">🌱 활동 연수</div></div><div class="stat"><div class="n">${peakEmoji}</div><div class="l">🏅 최고 등급 \u00b7 ${peakName}</div></div><div class="stat"><div class="n">${diaries.length}</div><div class="l">📖 신앙 다이어리</div></div></div><h2>📊 연도별 출석 \u00b7 등급</h2><table><tr><th>연도</th><th>학년</th><th>출석</th><th>최종 등급</th></tr>${rows}</table><h2>📖 신앙 다이어리</h2>${diaryHtml}<div class="ft"><span>🕊\ufe0f 하늘의문 중고등부 \u00b7 신앙 성장 기록</span><span>발행 ${today}</span></div>${giftHtml}<script>window.onload=()=>{(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>setTimeout(()=>window.print(),250));}<\/script></body></html>`;const w=window.open('','_blank');if(!w){showToast('팝업이 차단되었어요. 팝업 허용 후 다시 시도해주세요');return;}w.document.write(html);w.document.close();}
function myTeacherNames(gk){const ts=pendingList.filter(t=>t.approved&&t.role==='teacher'&&!t.hidden&&t.teacherType===gk);return ts.length?ts.map(t=>t.name+' '+t.baptism).join(', '):'미지정';}

function openMyPosts(){openModal('my-posts-modal');var isS=G.role==='student';var tab=document.getElementById('my-posts-all-tab');if(tab){document.querySelectorAll('#my-posts-modal .tab-btn').forEach(function(b){b.classList.remove('active');});tab.classList.add('active');}renderMyPosts('all');}
function openMyResourceDetail(rid){try{closeModal('my-posts-modal');}catch(e){}try{switchTab('resource');}catch(e){}setTimeout(function(){try{openResourceDetail(rid);}catch(e){}},250);}
function renderMyPosts(filter){const el=document.getElementById('my-posts-list');if(!el)return;let mine=posts.filter(p=>p.authorId===G.id);var myRes=[];try{myRes=(resources||[]).filter(function(r){return r.authorId===G.id;}).map(function(r){return {_res:true,resId:r.id,title:r.title,date:r.updatedAt||r.date||'',cat:r.cat,image:(r.images&&r.images[0]&&(r.images[0].src||r.images[0]))||''};});}catch(e){}if(filter==='board')mine=mine.filter(p=>!p.isActivity&&!p.isResource);else if(filter==='activity')mine=mine.filter(p=>p.isActivity);else if(filter==='resource')mine=myRes;else if(filter==='jabumo')mine=mine.filter(p=>p.cat==='jabumo');else mine=mine.concat(myRes);if(!mine.length){el.innerHTML='<div class="empty" style="padding:32px"><div class="empty-emoji" style="font-size:32px">📄</div><div class="empty-title" style="font-size:13px">작성한 게시물이 없어요</div></div>';return;}el.innerHTML=mine.map(p=>{var click=p._res?`openMyResourceDetail('${p.resId}')`:`openMyPostDetail('${p.id}')`;var catLbl=p._res?(RESOURCE_CAT_LABEL&&RESOURCE_CAT_LABEL[_catNorm?_catNorm(p.cat):p.cat]||'자료실'):(CAT_LABEL[p.cat]||'-');return `<div class="post-card" style="cursor:pointer" onclick="${click}">${p.image?`<img src="${p.image}" style="width:100%;height:auto;max-height:420px;object-fit:contain;border-radius:var(--radius-sm);margin-bottom:8px;background:var(--bg)">`:''}<div class="post-title">${p.title}</div><div class="post-meta"><span class="post-meta-chip">${catLbl}</span><span>${p.date}</span><span style="margin-left:auto;color:var(--primary);font-weight:700">보기 ›</span></div></div>`;}).join('');}
/* 내 게시물에서 글을 누르면 원래 있던 화면으로 이동한 뒤 상세를 연다 */
function openMyPostDetail(pid){
  const p=posts.find(x=>x.id===pid);
  if(!p){showToast('게시물을 찾을 수 없어요');return;}
  try{closeModal('my-posts-modal');}catch(e){}
  const go=()=>{ try{openPostDetail(pid);}catch(e){} };
  try{
    if(p.isActivity)      switchTab('activity');
    else if(p.isResource) switchTab('resource');
    else if(p.cat)        goToBoardCat(p.cat);      /* 해당 카테고리 탭까지 맞춰서 이동 */
    else                  switchTab('board');
  }catch(e){ try{switchTab('board');}catch(e2){} }
  setTimeout(go,220);   /* 화면 전환이 끝난 뒤 상세 열기 */
}

function selDept(dept,btn){document.querySelectorAll('.dept-tab').forEach(t=>{t.className='dept-tab';});btn.className='dept-tab active-'+dept;show('dept-choir',dept==='choir');show('dept-liturgy',dept==='liturgy');renderDeptPosts(dept);}
renderCalendar();
