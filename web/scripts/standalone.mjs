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
// M4: bundle the reviewed PDF into the offline HTML as base64, never fetch remotely.
const guidePath=path.join(dist,'bank360-guide.pdf');
if(!fs.existsSync(guidePath))throw Error('M4 PDF missing from compiled static assets');
const guideBytes=fs.readFileSync(guidePath);
if(guideBytes.subarray(0,5).toString('ascii')!=='%PDF-')throw Error('Invalid M4 PDF header');
const pdfB64=guideBytes.toString('base64');
if(!html.includes('</body>'))throw Error('Cannot embed PDF: missing closing body');
html=html.replace('</body>',`<script type="application/octet-stream" id="bank360-guide-embedded">${pdfB64}</script></body>`);
if(scriptCount!==1||styleCount!==1)throw Error(`Expected one JS and CSS asset, got ${scriptCount}/${styleCount}`);
if(/(?:src|href)="\.\/assets\//.test(html))throw Error('External build assets still present');
const out=path.join(dist,'BANK-360-B5-APERCU-LOCAL.html');
fs.writeFileSync(out,html);
console.log('Offline self-contained B5 preview created:',out,'bytes',fs.statSync(out).size);
