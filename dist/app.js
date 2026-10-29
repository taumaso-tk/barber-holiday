'use strict';
const H=Holiday,$=id=>document.getElementById(id),initial=H.today(),storageKey='barber-holidays-v1';
let saved={};let storageAvailable=true;
try{saved=JSON.parse(localStorage.getItem(storageKey)||'{}')||{};}catch{storageAvailable=false;}
if(typeof saved!=='object'||Array.isArray(saved))saved={};
function validDates(list){return Array.isArray(list)&&list.length>=1&&list.length<=4&&list.every(d=>typeof d==='string'&&H.parse(d));}
let overrides={};for(const [key,value] of Object.entries(saved.overrides||{})){if(validDates(value))overrides[key]=value;}
const year=$('year'),month=$('month');
for(let y=1900;y<=2200;y++){year.add(new Option(`${y}年`,y));}
for(let m=1;m<=12;m++)month.add(new Option(`${m}月`,m));
year.value=Number.isInteger(saved.year)&&saved.year>=1900&&saved.year<=2200?saved.year:initial.year;month.value=Number.isInteger(saved.month)&&saved.month>=1&&saved.month<=12?saved.month:initial.month;
function keyFor(v){return `${v.year}-${v.month}`;}
function listFor(v){return overrides[keyFor(v)]||H.holiday(v.year,v.month);}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({year:+year.value,month:+month.value,overrides}));storageAvailable=true;}catch{storageAvailable=false;} $('status').textContent=storageAvailable?'変更内容は自動保存されます。':'このブラウザでは保存できません。画面を閉じる前に印刷してください。';}
function months(){return Array.from({length:3},(_,i)=>H.month(+year.value,+month.value,i));}
// Reserve enough width for each date, including manually edited dates in another month.
// The same unit budget is used for the screen preview and the A4 print stylesheet.
function posterDateLayout(labels){
const columns=labels.length===4?2:labels.length;
const widths=labels.map(label=>Array.from(label).reduce((sum,char)=>sum+(/[0-9]/.test(char)?0.7:1.1),0));
const units=Array.from({length:columns},(_,column)=>Math.max(...widths.filter((_,i)=>i%columns===column))).reduce((sum,width)=>sum+width,0)+0.45*(columns-1);
return {columns,units:units+0.5};
}
function paintPoster(){const values=months();const sharedUnits=Math.max(posterDateLayout(['28日（月）','29日（火）','30日（水）']).units,...values.map(v=>posterDateLayout(listFor(v).map(d=>H.label(d,v.month))).units));$('period').textContent=`${values[0].year}年${values[0].month}月 → ${values[2].year}年${values[2].month}月`;$('poster-months').replaceChildren(...values.map(v=>{const block=document.createElement('section');block.className='poster-month';const h=document.createElement('h3');h.textContent=`${v.month}月`;const dates=document.createElement('div');const list=[...listFor(v)].sort();dates.className='dates';const layout=posterDateLayout(list.map(d=>H.label(d,v.month)));dates.style.setProperty('--date-columns',layout.columns);dates.style.setProperty('--date-units',sharedUnits);list.forEach(d=>{const el=document.createElement('span');el.textContent=H.label(d,v.month);dates.append(el);});block.append(h,dates);return block;}));document.title=`連休のお知らせ_${values[0].year}年${values[0].month}月から`;}
function renderEditors(openKey){$('editors').replaceChildren(...months().map(v=>{const key=keyFor(v),list=listFor(v);const details=document.createElement('details');details.open=openKey===key;const summary=document.createElement('summary');summary.textContent=`${v.year}年${v.month}月`;const brief=document.createElement('small');brief.textContent=list.map(d=>H.label(d,v.month)).join('・')+(overrides[key]?' ［修正済み］':'');summary.append(brief);details.append(summary);
list.forEach((d,i)=>{const row=document.createElement('div');row.className='date-row';const input=document.createElement('input');input.type='date';input.min='1900-01-01';input.max='2201-12-31';input.value=d;input.setAttribute('aria-label',`${v.year}年${v.month}月の休業日${i+1}`);input.addEventListener('change',()=>{if(!H.parse(input.value)||!input.checkValidity()){input.value=d;$('status').textContent='有効な日付を選んでください。';return;}const updated=[...listFor(v)];if(updated.some((value,j)=>j!==i&&value===input.value)){input.value=d;$('status').textContent='同じ日付がすでにあります。';return;}updated[i]=input.value;overrides[key]=updated;refresh(key);});const remove=document.createElement('button');remove.type='button';remove.className='remove';remove.textContent='−';remove.setAttribute('aria-label',`休業日${i+1}を削除`);remove.disabled=list.length===1;remove.onclick=()=>{overrides[key]=list.filter((_,j)=>i!==j);refresh(key);};row.append(input,remove);details.append(row);});
const actions=document.createElement('div');actions.className='editor-actions';const add=document.createElement('button');add.className='secondary';add.textContent='＋ 日付を追加';add.disabled=list.length>=4;add.onclick=()=>{const latest=[...list].sort().at(-1);const next=H.parse(latest);do{next.setUTCDate(next.getUTCDate()+1);}while(list.includes(H.iso(next.getUTCFullYear(),next.getUTCMonth()+1,next.getUTCDate())));overrides[key]=[...list,H.iso(next.getUTCFullYear(),next.getUTCMonth()+1,next.getUTCDate())];refresh(key);};const reset=document.createElement('button');reset.className='secondary';reset.textContent='自動計算に戻す';reset.disabled=!overrides[key];reset.onclick=()=>{delete overrides[key];refresh(key);};actions.append(add,reset);const note=document.createElement('p');note.className='hint';note.textContent='1〜4日を指定できます。曜日は自動で反映されます。';details.append(actions,note);return details;}));}
function refresh(openKey){paintPoster();renderEditors(openKey);persist();}
year.onchange=()=>refresh();month.onchange=()=>refresh();refresh();
