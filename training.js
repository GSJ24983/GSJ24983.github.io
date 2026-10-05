/* Training tab: anchor columns, clickable scenario moments, and the end-to-end example. */
(function(){
if(!document.getElementById('pillarsA'))return;
const PILLARS=[
 {k:'i',name:'Individual posture',q:'Mindset and values.',anchors:[
  {n:1,t:'Acts with integrity under pressure',say:"I can't commit to the 15th. Here are three ways we still hit the goal - which trade-off do you want to make?",w:'Commits to please, or refuses flatly.',s:'Says no with options, and raises issues before being asked.'},
  {n:2,t:"Embodies a learner's mindset",say:"I've seen something like this before, so let me check I'm not forcing that answer onto your problem. What's different here?",w:'Bluffs, defends, or reaches for the last solution.',s:'Surfaces their own gaps and biases first.'}]},
 {k:'b',name:'Boundary defining posture',q:'Limits, decision rights and handoffs.',anchors:[
  {n:3,t:'Strives for clarity and outcomes',say:"Before we add this, what should come out? That's your call, and I'll show you the impact of each option.",w:'Starts without agreement, and absorbs changes quietly.',s:'Re-contracts continuously, so the right owner decides.'},
  {n:7,t:'Challenges assumptions, reframes and holds a point of view',say:"I'll back this fully - it's your call. This one is different: it breaks the lending rules in two markets, so I have to escalate it.",w:'Executes as asked, or argues without evidence.',s:'Changes minds by reframing; knows which calls to hold.'},
  {n:8,t:'Converts insight into owned outcomes',say:"Go-live was step one. We said 40% of branches by week six and we're at 12%. Here's who owns closing that gap.",w:'Ships and moves on.',s:'Measures outcomes, sustains them, leaves the team stronger.'}]},
 {k:'r',name:'Collaboration posture',q:'Building and nurturing relations.',anchors:[
  {n:4,t:'Builds trust and psychological safety',say:"You're saying the plan won't hold. Walk me through what you're seeing - I'd rather change it now than find out in UAT.",w:'Defensive, with optimistic status reports.',s:'Shares bad news first; people bring problems early.'},
  {n:5,t:'Stays present and grounded under ambiguity',say:"I hear this isn't working for you. What's missing? Let's take the detail offline at 3 and I'll bring a revised version.",w:'Freezes, defends, or fills the silence.',s:'Names the tension and turns heat into a plan.'},
  {n:6,t:'Listens beyond the ask to uncover the need',say:"You mentioned you'll manage. How do you handle it today?",w:'Takes requests literally; treats silence as agreement.',s:'Catches the unsaid requirement before it becomes a problem.'}]}
];
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
const ICON={
 i:'<svg viewBox="0 0 120 120" role="img" aria-label="One person"><use href="#pm" x="33" y="8" width="54" height="104" fill="#211A2B"/></svg>',
 b:'<svg viewBox="0 0 120 120" role="img" aria-label="A person inside a solid circle"><circle cx="60" cy="58" r="52" fill="none" stroke="#2A1740" stroke-width="3"/><use href="#pm" x="33" y="10" width="54" height="98" fill="#211A2B"/></svg>',
 r:'<svg viewBox="0 0 200 120" role="img" aria-label="Two people in overlapping dashed circles"><circle cx="72" cy="58" r="52" fill="none" stroke="#2E6F63" stroke-width="3" stroke-dasharray="7 6"/><circle cx="128" cy="58" r="52" fill="none" stroke="#2E6F63" stroke-width="3" stroke-dasharray="7 6"/><use href="#pm" x="45" y="10" width="54" height="98" fill="#211A2B"/><use href="#pm" x="101" y="10" width="54" height="98" fill="#211A2B"/></svg>'};
document.getElementById('pillarsA').innerHTML=PILLARS.map(p=>`<div class="pcol"><div class="pic">${ICON[p.k]}</div><div class="pl ${p.k}"><div class="hd"><span class="k">Pillar</span><h3>${esc(p.name)}</h3><span class="q">${esc(p.q)}</span></div>${p.anchors.map(a=>`<details class="an"><summary><span class="num">${a.n}</span><span class="t">${esc(a.t)}</span><span class="chev" aria-hidden="true">&#9656;</span></summary><div class="body"><p class="say">&ldquo;${esc(a.say)}&rdquo;</p><div class="lv"><span class="w"><b>Weak</b> - ${esc(a.w)}</span><span class="s"><b>Strong</b> - ${esc(a.s)}</span></div></div></details>`).join('')}</div></div>`).join('');

const S={
 brief:{title:'Two days to sign-off',text:"You are the product analyst on a refunds release. The spec line reads: <em>'When a refund is approved, notify the customer.'</em> Ops has signed it. Tech has estimated it. Everyone is comfortable. You are not, and you cannot yet say why."},
 n1:{prompt:'Sign-off is Friday. What do you do with the discomfort?',choices:[
  {k:'A',label:'Let it go - it is one line and everyone has signed',sub:'Protect the date',tag:'Signed as-is',title:'Week three of production',text:'Refunds approve fine. Then a customer with no mobile number on file gets nothing, complains to the regulator, and the ticket lands back on your desk with a severity tag on it.',lesson:'A requirement everyone agrees on is not the same as a requirement everyone read the same way. Consensus hides ambiguity, it does not resolve it.'},
  {k:'B',label:'Ask ops for a concrete case: a refund last week and exactly what the customer received',sub:'Probe with a real example',tag:'Probed',good:true,title:'The example does the work',text:"Ops pulls a real refund. Turns out 'notify' means SMS, and about one in nine customers has no mobile number. Nobody had decided what those customers get. It was never a disagreement - it was a blank.",lesson:'Concrete cases surface gaps that abstract review never will. Ask what happened last Tuesday, not whether the requirement is clear.'},
  {k:'C',label:'Send the spec round again asking everyone to re-read carefully',sub:'Reconfirm in writing',tag:'Re-circulated',title:"Three replies, all 'looks fine'",text:"You get three thumbs-ups within the hour. Nobody read it again. The same line means SMS to ops, email to tech, and 'something automatic' to the sponsor, and the round trip cost you half a day.",lesson:'Re-reading the same words produces the same interpretation. Change the question, not the number of reviewers.'}]},
 n2:{prompt:'You have twenty minutes with ops. Which of these must be nailed down before Friday? Pick every one that matters.',options:[
  {label:'Which channel counts as a notification',sub:'SMS, email, in-app, or any of them'},
  {label:'What happens when the chosen channel is unavailable for that customer'},
  {label:'The wording of the notification message'},
  {label:'Who owns the decision when the channel fails'},
  {label:'Which font the message template uses'}],correct:[0,1,3],
  successNote:'Channel definition, the failure case, and the decision owner. Wording can be drafted later; it does not change the build.',missNote:'Before Friday you still need: '},
 n3:{speaker:'The delivery lead',question:'Fine - so write me the line. If two developers read it, I want them building the same thing.',criteria:[
  {label:"Names the specific channel rather than 'notify'",kw:['sms','email','text message','in-app','in app','push','whatsapp','e-mail','by email','via email'],coach:"name the channel that actually fires - 'notify' is the word that let two teams build two different things."},
  {label:'Handles the case where the channel is not available',kw:['no mobile','missing','unavailable','fallback','fall back','falls back','if the customer has no','absent','not on file','no number','without a mobile','no phone','cannot be reached','otherwise'],coach:'say what happens to the customer with no number on file - that is the one in nine who got silence in production.'},
  {label:'States who or what decides the fallback',kw:['ops','owner','owns','decides','decision','system','default','escalat','responsible','accountable','refunds team','support','routed to','flags it to'],coach:'name who or what makes the call when the channel fails - unowned edge cases get decided quietly by whoever is on shift at 6pm.'}],
  model:'When a refund is approved, the system sends the customer an SMS to the mobile number on file. If no mobile number is on file, it sends the same notification by email instead. If neither is available, the refund is flagged to the ops queue and ops owns the decision on how the customer is told.'},
 good:{title:'The blank cell had nowhere to hide',moral:'A good requirement is not one everyone agrees with. It is one nobody can misread.',verdict:'You shipped on Friday, and the one-in-nine customer got a defined outcome instead of silence. The same line became the test case, which is why QA found nothing in week three.',revealed:[['The probe','You asked for a real refund instead of asking whether the spec was clear.'],['The gap','You separated what mattered before Friday from what could wait.'],['The write-up','Channel, failure case and owner - all three in one line.']]},
 partial:{title:'Better, but still readable two ways',moral:'Ambiguity does not announce itself. It shows up as a support ticket in week three.',verdict:'Your line is sharper than the original, but a developer reading it still has a decision left to make - and they will make it quietly, at 6pm, without you.',revealed:[['What held','You found the gap before sign-off, which is most of the job.'],['What slipped','The written requirement left at least one thing to interpretation.']]}
};
const GRADE_NOTE="In a live session the trainer grades the written answer against this rubric (Weak 1 &middot; Competent 3 &middot; Strong 5), and grades are shown once the consequences have played out.";
const hdr=(l,r)=>`<div class="top"><span>${l}</span><span class="src2">${r||'Two days to sign-off &middot; anchor 7'}</span></div>`;
function vBrief(next,nextLabel){return `${hdr('Briefing')}<h4>${S.brief.title}</h4><p>${S.brief.text}</p><button class="cbtn" data-act="next">${nextLabel||'Continue &rarr;'}</button>`}
function vDecision(){return `${hdr('Decision point 1 of 3')}<p class="q">${S.n1.prompt}</p><div class="ch">${S.n1.choices.map((c,i)=>`<button data-act="pick" data-i="${i}" aria-pressed="false"><span class="k">${c.k}</span><span>${esc(c.label)}</span><span class="sub">${esc(c.sub)}</span></button>`).join('')}</div>`}
function outHtml(c){return `<div class="out ${c.good?'good':''}"><span class="tg">${c.k} &middot; ${esc(c.tag)}</span><h5>${esc(c.title)}</h5><p>${esc(c.text)}</p><p class="les">${esc(c.lesson)}</p></div>`}
function vConsequence(i,withTabs,next){const c=S.n1.choices[i];return `${hdr('Consequence')}${withTabs?`<div class="ctabs" role="tablist">${S.n1.choices.map((x,j)=>`<button role="tab" data-act="ctab" data-i="${j}" aria-selected="${j===i}">If you chose ${x.k}</button>`).join('')}</div>`:''}${outHtml(c)}${next?`<button class="cbtn" data-act="next">${c.good?'Continue &rarr;':'Rewind and choose again'}</button>`:''}`}
function vIntent(){return `${hdr('Intent node &middot; decision point 2 of 3')}<p class="q">${S.n2.prompt}</p><div class="ms">${S.n2.options.map((o,i)=>`<label data-i="${i}"><input type="checkbox" value="${i}"><span>${esc(o.label)}</span>${o.sub?`<span class="sub">${esc(o.sub)}</span>`:''}</label>`).join('')}</div><div class="row"><button class="cbtn" data-act="check">Check my picks</button></div><div data-slot="res" aria-live="polite"></div>`}
function vExpr(){return `${hdr('Expression node &middot; decision point 3 of 3')}<div class="say2"><b>${S.n3.speaker}:</b><span>&ldquo;${S.n3.question}&rdquo;</span></div><textarea placeholder="When a refund is approved..." aria-label="Write the requirement line"></textarea><div class="row"><button class="cbtn" data-act="grade">Grade my line</button><button class="cbtn ghost" data-act="model">Show a model answer</button></div><div data-slot="res" aria-live="polite"></div>`}
function gradeHtml(txt){const t=txt.toLowerCase();const hits=S.n3.criteria.map(c=>c.kw.some(k=>t.includes(k)));const n=hits.filter(Boolean).length;const lvl=n===3?5:n===2?3:1;
 return {n,html:`<div class="rub">${S.n3.criteria.map((c,i)=>`<div><span class="ic ${hits[i]?'y':'x'}">${hits[i]?'&#10003;':'&#10007;'}</span><span><b>${esc(c.label)}</b>${hits[i]?'':`<br>To fix it, ${esc(c.coach)}`}</span></div>`).join('')}</div><div class="score"><span class="${lvl===1?'on':''}">Weak 1</span><span class="${lvl===3?'on':''}">Competent 3</span><span class="${lvl===5?'on':''}">Strong 5</span></div>`}}
function vReinforce(kind){const e=S[kind||'good'];return `${hdr('Debrief &middot; reinforce judgement')}<h4>${esc(e.title)}</h4><p class="moral">${esc(e.moral)}</p><p>${esc(e.verdict)}</p><div class="rev">${e.revealed.map(r=>`<div><b>${esc(r[0])}</b><span>${esc(r[1])}</span></div>`).join('')}</div><p class="gnote">${GRADE_NOTE}</p>`}

/* shared behaviour inside a screen */
function wireIntent(root){root.querySelector('[data-act="check"]').onclick=()=>{const picked=[...root.querySelectorAll('.ms input')].filter(x=>x.checked).map(x=>+x.value);const miss=S.n2.correct.filter(i=>!picked.includes(i));
 root.querySelectorAll('.ms label').forEach(l=>{const i=+l.dataset.i,c=S.n2.correct.includes(i),p=picked.includes(i);l.className=c&&p?'ok':c?'miss':p?'wrong':''});
 const ok=miss.length===0&&picked.every(i=>S.n2.correct.includes(i));
 root.querySelector('[data-slot="res"]').innerHTML=`<div class="out ${ok?'good':''}"><span class="tg">${ok?'Spot on':'Not quite'}</span><p>${ok?S.n2.successNote:esc(S.n2.missNote+miss.map(i=>S.n2.options[i].label.toLowerCase()).join('; ')+(picked.some(i=>!S.n2.correct.includes(i))?'. And the wording or the font can wait - they do not change the build.':'.'))}</p></div>`;return ok}}
function wireExpr(root,onDone){const ta=root.querySelector('textarea');root.querySelector('[data-act="model"]').onclick=()=>{ta.value=S.n3.model;ta.focus()};
 root.querySelector('[data-act="grade"]').onclick=()=>{if(!ta.value.trim()){ta.focus();return}const g=gradeHtml(ta.value);root.querySelector('[data-slot="res"]').innerHTML=g.html+(onDone?`<button class="cbtn" data-act="fin">See the debrief &rarr;</button>`:`<p class="gnote">${GRADE_NOTE}</p>`);
  if(onDone)root.querySelector('[data-act="fin"]').onclick=()=>onDone(g.n===3?'good':'partial')}}

/* Brief tab: clickable cards open the real moment */
let conPick=1;
function openPeek(k){const isNode=k==='intent'||k==='expr';const wrap=document.getElementById(isNode?'peekB':'peekA'),other=document.getElementById(isNode?'peekA':'peekB');
 if(!wrap.hidden&&wrap.dataset.k===k){wrap.hidden=true;wrap.dataset.k='';document.querySelector(`.stc[data-k="${k}"]`).setAttribute('aria-expanded','false');return}
 other.hidden=true;other.dataset.k='';wrap.hidden=false;wrap.dataset.k=k;
 document.querySelectorAll('.stc').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.k===k)));
 const box=document.createElement('div');box.className='scr';
 if(k==='trig'){box.innerHTML=vBrief();box.querySelector('[data-act="next"]').onclick=()=>openPeek('dec')}
 if(k==='dec'){box.innerHTML=vDecision();box.querySelectorAll('[data-act="pick"]').forEach(b=>b.onclick=()=>{conPick=+b.dataset.i;openPeek('con')})}
 if(k==='con'){const draw=()=>{box.innerHTML=vConsequence(conPick,true);box.querySelectorAll('[data-act="ctab"]').forEach(b=>b.onclick=()=>{conPick=+b.dataset.i;draw()})};draw()}
 if(k==='rei'){box.innerHTML=vReinforce('good')}
 if(k==='intent'){box.innerHTML=vIntent();wireIntent(box)}
 if(k==='expr'){box.innerHTML=vExpr();wireExpr(box)}
 wrap.innerHTML='';wrap.appendChild(box);
 if(innerWidth<820)wrap.scrollIntoView({behavior:'smooth',block:'nearest'})}
document.querySelectorAll('.stc').forEach(b=>b.addEventListener('click',()=>openPeek(b.dataset.k)));

/* Show me tab: the scenario end to end */
const STEPS=['Briefing','Your first move','The gap','Write it down','Debrief'];
function play(stage,arg){const p=document.getElementById('player');const box=document.createElement('div');box.className='scr';
 const idx={brief:0,n1:1,con:1,n2:2,n3:3,end:4}[stage];
 const prog=`<div class="prog">${STEPS.map((s,i)=>`<span class="${i===idx?'on':i<idx?'done':''}">${s}</span>`).join('')}</div>`;
 if(stage==='brief'){box.innerHTML=prog+vBrief();box.querySelector('[data-act="next"]').onclick=()=>play('n1')}
 if(stage==='n1'){box.innerHTML=prog+vDecision();box.querySelectorAll('[data-act="pick"]').forEach(b=>b.onclick=()=>play('con',+b.dataset.i))}
 if(stage==='con'){box.innerHTML=prog+vConsequence(arg,false,true);box.querySelector('[data-act="next"]').onclick=()=>play(S.n1.choices[arg].good?'n2':'n1')}
 if(stage==='n2'){box.innerHTML=prog+vIntent();const btn=box.querySelector('[data-act="check"]');wireIntent(box);const chk=btn.onclick;btn.onclick=()=>{chk();if(!box.querySelector('[data-act="go"]')){const g=document.createElement('button');g.className='cbtn';g.dataset.act='go';g.innerHTML='Continue &rarr;';g.onclick=()=>play('n3');box.appendChild(g)}}}
 if(stage==='n3'){box.innerHTML=prog+vExpr();wireExpr(box,k=>play('end',k))}
 if(stage==='end'){box.innerHTML=prog+vReinforce(arg)+`<div class="row"><button class="cbtn ghost" data-act="again">Play again</button></div>`;box.querySelector('[data-act="again"]').onclick=()=>play('brief')}
 p.innerHTML='';p.appendChild(box);if(stage!=='brief')p.scrollIntoView({behavior:'smooth',block:'nearest'})}

/* tabs, dialog, width */
const tB=document.getElementById('tBrief'),tS=document.getElementById('tShow'),pB=document.getElementById('pBrief'),pS=document.getElementById('pShow');
function tab(show){tB.setAttribute('aria-selected',String(!show));tS.setAttribute('aria-selected',String(show));pB.hidden=show;pS.hidden=!show;if(show&&!document.getElementById('player').firstChild)play('brief')}
tB.onclick=()=>tab(false);tS.onclick=()=>tab(true);
})();
