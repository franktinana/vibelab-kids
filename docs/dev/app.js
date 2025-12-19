function cacheBust(p){return `${p}?v=${Date.now()}`}

async function loadText(id, path){
  const el=document.getElementById(id);
  try{
    const res=await fetch(cacheBust(path));
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    el.textContent=await res.text();
  }catch(e){
    el.textContent=`Failed to load ${path}\n${String(e)}`;
  }
}

function flash(btn, ok){
  const orig=btn.textContent;
  btn.textContent=ok?"COPIED!":"ERROR";
  if(ok){
    btn.style.background="#10b981";
    btn.style.color="#fff";
    btn.style.borderColor="#10b981";
  }
  setTimeout(()=>{btn.textContent=orig;btn.style.background="";btn.style.color="";btn.style.borderColor="";},1500);
}

async function copyById(id, btn){
  const el=document.getElementById(id);
  const text=el?.textContent||"";
  try{
    await navigator.clipboard.writeText(text);
    flash(btn,true);
  }catch{
    try{
      const ta=document.createElement("textarea");
      ta.value=text;
      ta.style.position="fixed";
      ta.style.left="-9999px";
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      const ok=document.execCommand("copy");
      document.body.removeChild(ta);
      flash(btn,ok);
    }catch{flash(btn,false)}
  }
}
window.copyById=copyById;

loadText("devPrompt","../assets/DEV_CONTEXT_PROMPT.md");
loadText("manifest","../assets/TINMAN_MANIFEST.md");
