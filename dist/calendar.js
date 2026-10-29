(function(root){
'use strict';
const pad=n=>String(n).padStart(2,'0');
function iso(y,m,d){return `${y}-${pad(m)}-${pad(d)}`;}
function parse(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null; const [y,m,d]=value.split('-').map(Number); const date=new Date(Date.UTC(y,m-1,d));return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?date:null;}
function month(y,m,offset=0){const date=new Date(Date.UTC(y,m-1+offset,1));return {year:date.getUTCFullYear(),month:date.getUTCMonth()+1};}
function holiday(y,m){const weekday=new Date(Date.UTC(y,m-1,1)).getUTCDay();const start=15+(8-weekday)%7;const count=m===8?4:[1,4,10].includes(m)?3:2;return Array.from({length:count},(_,i)=>iso(y,m,start+i));}
function label(value,monthNumber){const date=parse(value);if(!date)return '';return `${date.getUTCMonth()+1===monthNumber?'':`${date.getUTCMonth()+1}月`}${date.getUTCDate()}日（${'日月火水木金土'[date.getUTCDay()]}）`;}
function today(now=new Date()){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',year:'numeric',month:'numeric'}).formatToParts(now);return {year:Number(parts.find(p=>p.type==='year').value),month:Number(parts.find(p=>p.type==='month').value)};}
const api={iso,parse,month,holiday,label,today};if(typeof module!=='undefined')module.exports=api;else root.Holiday=api;
})(globalThis);
