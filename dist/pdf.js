(function(root){
'use strict';
// One A4 page containing a 300 dpi image. No browser print engine or external service.
function createPdf(jpeg,width,height){
const encode=text=>new TextEncoder().encode(text);const chunks=[];const offsets=[0];let length=0;
function add(value){const bytes=typeof value==='string'?encode(value):value;chunks.push(bytes);length+=bytes.length;}
function object(id,body){offsets[id]=length;add(`${id} 0 obj\n`);add(body);add('\nendobj\n');}
add('%PDF-1.4\n% Generated poster\n');
object(1,'<< /Type /Catalog /Pages 2 0 R >>');
object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
object(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.27559 841.88976] /Resources << /XObject << /Poster 4 0 R >> >> /Contents 5 0 R >>');
offsets[4]=length;add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);add(jpeg);add('\nendstream\nendobj\n');
const content='q\n595.27559 0 0 841.88976 0 0 cm\n/Poster Do\nQ\n';object(5,`<< /Length ${encode(content).length} >>\nstream\n${content}endstream`);
const xref=length;add('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
const output=new Uint8Array(length);let cursor=0;for(const chunk of chunks){output.set(chunk,cursor);cursor+=chunk.length;}return output;
}
function rowPlan(dates){return dates.length===4?[dates.slice(0,2),dates.slice(2)]:[dates];}
function renderPoster(ctx,months){
const width=2480,height=3508,usable=width-360;
ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle='#000';ctx.textAlign='center';ctx.textBaseline='middle';
const family='-apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif';
function font(size){ctx.font=`900 ${size}px ${family}`;}
function fit(text,maxSize,available){font(maxSize);return Math.min(maxSize,maxSize*available/Math.max(ctx.measureText(text).width,1));}
function line(text,y,size){font(size);ctx.fillText(text,width/2,y);}
line('連休のお知らせ',360,fit('連休のお知らせ',215,usable));
const gap=36;
// Use one shared size for every month, based on a full three-date row.
// Keep that baseline even when all selected months have only two days.
const referenceRows=[['28日（月）','29日（火）','30日（水）'],...months.flatMap(month=>rowPlan(month.dates))];
let sharedSize=220;
referenceRows.forEach(row=>{font(220);const total=row.reduce((sum,text)=>sum+ctx.measureText(text).width,0);sharedSize=Math.min(sharedSize,220*(usable-gap*(row.length-1))/Math.max(total,1));});
sharedSize=Math.floor(sharedSize*0.98);
months.forEach((month,index)=>{
const top=690+index*770;line(month.heading,top,230);
const rows=rowPlan(month.dates),size=sharedSize;font(size);
rows.forEach((row,rowIndex)=>{
const widths=row.map(text=>ctx.measureText(text).width);const total=widths.reduce((sum,w)=>sum+w,0)+gap*(row.length-1);let x=(width-total)/2;
row.forEach((text,i)=>{ctx.fillText(text,x+widths[i]/2,top+255+rowIndex*245);x+=widths[i]+gap;});
});
});
line('ご迷惑をおかけいたしますが、',3120,105);line('よろしくお願いいたします。',3300,105);
}
const api={createPdf,rowPlan,renderPoster};if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}root.PosterPdf=api;
const button=document.getElementById('create-pdf');if(!button)return;
const status=document.getElementById('pdf-status'),actions=document.getElementById('pdf-actions'),open=document.getElementById('open-pdf'),save=document.getElementById('save-pdf');let currentUrl;
function clear(){if(currentUrl){URL.revokeObjectURL(currentUrl);currentUrl=null;}actions.hidden=true;status.textContent='';}
const poster=document.getElementById('poster-months');new MutationObserver(clear).observe(poster,{childList:true,subtree:true,characterData:true});
button.addEventListener('click',function(){
clear();try{
const months=[...poster.querySelectorAll('.poster-month')].map(month=>({heading:month.querySelector('h3').textContent,dates:[...month.querySelectorAll('.dates span')].map(date=>date.textContent)}));
if(months.length!==3||months.some(month=>month.dates.length<1||month.dates.length>4))throw Error('poster');
const canvas=document.createElement('canvas');canvas.width=2480;canvas.height=3508;const ctx=canvas.getContext('2d');if(!ctx)throw Error('canvas');renderPoster(ctx,months);
const data=canvas.toDataURL('image/jpeg',0.98);if(!data.startsWith('data:image/jpeg;base64,'))throw Error('image');const bytes=Uint8Array.from(atob(data.split(',')[1]),char=>char.charCodeAt(0));
const pdf=createPdf(bytes,canvas.width,canvas.height);canvas.width=canvas.height=0;
currentUrl=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));open.href=save.href=currentUrl;save.download=`連休のお知らせ_${document.getElementById('year').value}年${document.getElementById('month').value}月から.pdf`;actions.hidden=false;
status.textContent='A4縦1枚のPDFを作成しました。URL・日付などのブラウザのヘッダー／フッターは含みません。';
}catch{status.textContent='この環境ではPDFを生成できませんでした。Safariでアプリを直接開き、再度お試しください。';}
});
})(globalThis);
