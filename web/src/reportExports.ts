/* C6: dependency-free, offline, real CSV/XLSX exports.
   XLSX is a valid uncompressed OOXML ZIP; no fictitious report sizes/records. */
export type ReportCell=string|number|null;
export type ReportRow=Record<string,ReportCell>;
export type ExportFormat='csv'|'xlsx';
export interface ReportDataset { name:string; columns:string[]; rows:ReportRow[]; }
const encoder=new TextEncoder();
const xml=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&apos;");
const safeCsv=(value:ReportCell)=>{
 let text=String(value??'');
 if(typeof value==='string'&&/^[\s]*[=+@\t\r]/.test(text))text="'"+text;
 return '"'+text.replaceAll('"','""')+'"';
};
export function makeCsv(dataset:ReportDataset):Blob{
 const body=[dataset.columns.map(safeCsv).join(','),...dataset.rows.map(row=>dataset.columns.map(k=>safeCsv(row[k])).join(','))].join('\r\n');
 return new Blob(['\uFEFF'+body+'\r\n'],{type:'text/csv;charset=utf-8'});
}
function crc32(b:Uint8Array):number{
 let crc=0xffffffff;
 for(const byte of b){crc^=byte;for(let j=0;j<8;j++)crc=(crc&1)?(crc>>>1)^0xedb88320:(crc>>>1);}
 return (crc^0xffffffff)>>>0;
}
function zipStored(files:{name:string;data:string}[]):Uint8Array{
 const chunks:Uint8Array[]=[];const directory:Uint8Array[]=[];let offset=0;
 const u16=(v:DataView,i:number,n:number)=>v.setUint16(i,n,true);
 const u32=(v:DataView,i:number,n:number)=>v.setUint32(i,n>>>0,true);
 for(const file of files){
  const name=encoder.encode(file.name),data=encoder.encode(file.data),crc=crc32(data);
  const lh=new Uint8Array(30+name.length),ld=new DataView(lh.buffer);
  u32(ld,0,0x04034b50);u16(ld,4,20);u16(ld,6,0x0800);
  u32(ld,14,crc);u32(ld,18,data.length);u32(ld,22,data.length);u16(ld,26,name.length);
  lh.set(name,30);chunks.push(lh,data);
  const ch=new Uint8Array(46+name.length),cd=new DataView(ch.buffer);
  u32(cd,0,0x02014b50);u16(cd,4,20);u16(cd,6,20);u16(cd,8,0x0800);
  u32(cd,16,crc);u32(cd,20,data.length);u32(cd,24,data.length);u16(cd,28,name.length);u32(cd,42,offset);
  ch.set(name,46);directory.push(ch);
  offset+=lh.length+data.length;
 }
 const directorySize=directory.reduce((n,c)=>n+c.length,0),end=new Uint8Array(22),ed=new DataView(end.buffer);
 u32(ed,0,0x06054b50);u16(ed,8,files.length);u16(ed,10,files.length);u32(ed,12,directorySize);u32(ed,16,offset);
 const total=offset+directorySize+end.length,output=new Uint8Array(total);let cursor=0;
 for(const part of [...chunks,...directory,end]){output.set(part,cursor);cursor+=part.length;}
 return output;
}
function xlsxColumn(index:number):string{
 let col='',n=index+1;while(n>0){n--;col=String.fromCharCode(65+n%26)+col;n=Math.floor(n/26);}
 return col;
}
function cell(v:ReportCell,r:number,c:number):string{
 const ref=xlsxColumn(c)+r;
 if(typeof v==='number'&&Number.isFinite(v))return '<c r="'+ref+'"><v>'+v+'</v></c>';
 return '<c r="'+ref+'" t="inlineStr"><is><t xml:space="preserve">'+xml(String(v??''))+'</t></is></c>';
}
export function makeXlsx(dataset:ReportDataset):Blob{
 const lines=[dataset.columns,...dataset.rows.map(row=>dataset.columns.map(col=>row[col]))];
 const sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  +'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
  +lines.map((values,i)=>'<row r="'+(i+1)+'">'+values.map((value,j)=>cell(value,i+1,j)).join('')+'</row>').join('')
  +'</sheetData></worksheet>';
 const files=[
  {name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
   +'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
   +'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
   +'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'},
  {name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
   +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
  {name:'xl/workbook.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
   +'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Données agrégées" sheetId="1" r:id="rId1"/></sheets></workbook>'},
  {name:'xl/_rels/workbook.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
   +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'},
  {name:'xl/worksheets/sheet1.xml',data:sheet}
 ];
 const bytes=zipStored(files);
 return new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
export function exportReport(dataset:ReportDataset,format:ExportFormat):void{
 const file=format==='csv'?makeCsv(dataset):makeXlsx(dataset);
 const url=URL.createObjectURL(file),link=document.createElement('a');
 link.href=url;link.download=dataset.name+'.'+format;
 document.body.appendChild(link);link.click();link.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
