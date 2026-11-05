/* Minimal safe, no-dependency renderer for tutor Markdown-like text.
   All user/model text enters as textContent (never unsanitized innerHTML). */
export function renderTutorAnswer(raw){
 const result=document.createElement("div");result.className="nabd-tutor-answer";
 const text=String(raw||"").slice(0,15000).replace(/\r\n?/g,"\n");
 let list=null,kind="";
 function inline(container,source){
   const regex=/\*\*([^*\n]{1,350})\*\*/g;let last=0,m;
   while((m=regex.exec(source))){
    if(m.index>last)container.append(document.createTextNode(source.slice(last,m.index)));
    const strong=document.createElement("strong");strong.textContent=m[1];container.append(strong);last=regex.lastIndex;
   }
   if(last<source.length)container.append(document.createTextNode(source.slice(last)));
 }
 for(const line of text.split("\n")){
  const v=line.trim();
  if(!v){list=null;kind="";continue;}
  const heading=v.match(/^#{1,5}\s+(.+)$/);
  if(heading){
   list=null;kind="";
   const h=document.createElement(heading[0].startsWith("# ")?"h3":"h4");
   inline(h,heading[1]);result.append(h);continue;
  }
  const bullet=v.match(/^(?:[-*•]\s+|[0-9]{1,2}[.)]\s+)(.+)$/);
  if(bullet){
   const next=/^[0-9]/.test(v)?"ol":"ul";
   if(!list||kind!==next){kind=next;list=document.createElement(next);result.append(list);}
   const li=document.createElement("li");inline(li,bullet[1]);list.append(li);continue;
  }
  list=null;kind="";
  const paragraph=document.createElement("p");inline(paragraph,v);result.append(paragraph);
 }
 return result;
}
