'use strict';
(function(){
const button=document.getElementById('print');
const status=document.getElementById('print-status');
const link=document.getElementById('print-page');
let timer;
let printObserved=false;
const embedded=window.self!==window.top;
function message(text){status.textContent=text;}
if(embedded)message('埋め込み表示では印刷が制限されることがあります。開かない場合は印刷専用ページをご利用ください。');
function printSnapshot(){
const poster=document.getElementById('poster');
return [...poster.querySelectorAll('.poster-month')].map(month=>({
 heading:month.querySelector('h3').textContent,
 dates:[...month.querySelectorAll('.dates span')].map(date=>date.textContent),
 columns:Number(month.querySelector('.dates').style.getPropertyValue('--date-columns')),
 units:Number(month.querySelector('.dates').style.getPropertyValue('--date-units'))
}));
}
if(link)link.addEventListener('click',function(event){
const months=printSnapshot();
if(months.length!==3){event.preventDefault();message('張り紙を読み込めませんでした。ページを再読み込みしてください。');return;}
this.href='print.html#'+encodeURIComponent(JSON.stringify(months));
});
if(document.body.classList.contains('standalone')){
try{
const months=JSON.parse(decodeURIComponent(location.hash.slice(1)));
if(!Array.isArray(months)||months.length!==3)throw Error('invalid');
const blocks=months.map(month=>{
if(!/^\d{1,2}月$/.test(month.heading)||!Array.isArray(month.dates)||month.dates.length<1||month.dates.length>4||month.dates.some(d=>typeof d!=='string'||d.length>30)||month.columns!==(month.dates.length===4?2:month.dates.length)||!Number.isFinite(month.units)||month.units<=0||month.units>150)throw Error('invalid');
const block=document.createElement('section');block.className='poster-month';
const heading=document.createElement('h3');heading.textContent=month.heading;
const dates=document.createElement('div');dates.className='dates';dates.style.setProperty('--date-columns',month.columns);dates.style.setProperty('--date-units',month.units);
month.dates.forEach(text=>{const date=document.createElement('span');date.textContent=text;dates.append(date);});block.append(heading,dates);return block;
});
document.getElementById('poster-months').replaceChildren(...blocks);
}catch{button.disabled=true;message('張り紙を読み込めませんでした。元のアプリから「印刷専用ページを別タブで開く」を押してください。');}
}
if(typeof window.print!=='function'){button.disabled=true;message('この環境では印刷機能を利用できません。Safariで開き、共有メニューの「プリント」をお試しください。');return;}
window.addEventListener('beforeprint',()=>{printObserved=true;clearTimeout(timer);message('印刷を開始しました。用紙はA4・縦を選択してください。');});
window.addEventListener('afterprint',()=>{printObserved=true;clearTimeout(timer);message('印刷画面を閉じました。');});
button.addEventListener('click',function(){
message('印刷画面を開いています。開かない場合は印刷専用ページ、またはSafariの共有メニューの「プリント」をご利用ください。');
clearTimeout(timer);
// Call synchronously in the trusted tap/click event. No await, popup or timer before print.
printObserved=false;
try{window.print();}catch{message('この表示環境では印刷を実行できません。印刷専用ページをSafariで開くか、共有メニューの「プリント」をご利用ください。');return;}
// Browsers can silently ignore print in a sandbox and expose no reliable success result.
if(!printObserved)timer=setTimeout(()=>message('印刷画面が開かない場合、この表示環境では印刷が制限されている可能性があります。印刷専用ページをSafariで開くか、共有メニューの「プリント」をご利用ください。'),2000);
});
})();
