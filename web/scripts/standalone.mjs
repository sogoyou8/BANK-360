import fs from 'node:fs';
import path from 'node:path';
const dist=path.resolve(import.meta.dirname,'../dist');
let html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const rewrite=(url)=>path.join(dist,url.replace(/^\.\//,''));
let scriptCount=0,styleCount=0;
html=html.replace(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g,(_,src)=>{
 const data=fs.readFileSync(rewrite(src),'utf8').replaceAll('</script','<\\/script');scriptCount++;
 return `<script type="module">\n${data}\n</script>`;
});
html=html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,(_,href)=>{
 const css=fs.readFileSync(rewrite(href),'utf8').replaceAll('</style','<\\/style');styleCount++;
 return `<style>\n${css}\n</style>`;
});
if(scriptCount!==1||styleCount!==1)throw Error(`Expected one JS and CSS asset, got ${scriptCount}/${styleCount}`);
if(/(?:src|href)="\.\/assets\//.test(html))throw Error('External build assets still present');
const out=path.join(dist,'BANK-360-B5-APERCU-LOCAL.html');
fs.writeFileSync(out,html);
console.log('Offline self-contained B5 preview created:',out,'bytes',fs.statSync(out).size);
