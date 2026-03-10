import{W as r,d as s,e as i,P as a,m as d}from"./index-CkvB7A1p.js";/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */const c=()=>{const t=window;t.addEventListener("statusTap",()=>{r(()=>{const n=document.elementFromPoint(t.innerWidth/2,t.innerHeight/2);if(!n)return;const e=s(n);e&&new Promise(o=>i(e,o)).then(()=>{a(async()=>{e.style.setProperty("--overflow","hidden"),await d(e,300),e.style.removeProperty("--overflow")})})})})};export{c as startStatusTap};
