(function(){
"use strict";

const COR_ATUAL="#55651f",COR_ANTERIOR="#3a8fb7";

const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const nota=v=>{if(v===null||v===undefined)return null;v=Number(v);return isFinite(v)?Math.max(0,Math.min(100,v)):null};
const rotuloDe=d=>`${d.empresa}${d.ano===null||d.ano===undefined?"":" ("+d.ano+")"}`;

// Lê os dados que gerarPDF() guarda em "Palavras-chave" (ESGDATA:base64)
async function lerPDF(file){
  const txt=new TextDecoder("latin1").decode(await file.arrayBuffer());
  const m=txt.match(/ESGDATA:([A-Za-z0-9+/=]+)/);
  if(!m)throw new Error("sem dados");
  const bin=atob(m[1]);
  const d=JSON.parse(new TextDecoder().decode(Uint8Array.from(bin,c=>c.charCodeAt(0))));
  if(!d||typeof d.pilares!=="object"||d.pilares===null)throw new Error("dados incompletos");
  return d;
}

function svgGrafico(atual,ant){
  const ks=Object.keys(NAMES),W=640,H=320,L=40,R=24,T=28,B=40,pw=W-L-R,ph=H-T-B,pad=40;
  const X=k=>L+pad+(pw-2*pad)*k/(ks.length-1);
  const Y=v=>T+ph*(1-v/100);
  const pontos=d=>ks.map((p,k)=>[X(k),nota(d.pilares[p])])
    .filter(a=>a[1]!==null).map(([x,v])=>[x,Y(v),v]);

  const serie=(d,cor,rotulos)=>{
    const a=pontos(d);if(!a.length)return "";
    const linha=a.map(p=>`${p[0]},${p[1]}`).join(" ");
    const area=`${a[0][0]},${Y(0)} ${linha} ${a[a.length-1][0]},${Y(0)}`;
    return `<polygon points="${area}" fill="${cor}" fill-opacity=".3"/>`+
      `<polyline points="${linha}" fill="none" stroke="${cor}" stroke-width="2.5" stroke-linejoin="round"/>`+
      a.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${cor}"><title>${esc(rotuloDe(d))}: ${Math.round(p[2])}</title></circle>`).join("")+
      (rotulos?a.map(p=>`<text x="${p[0]}" y="${p[1]-10}" text-anchor="middle" font-size="12" font-weight="600" fill="${cor}">${Math.round(p[2])}</text>`).join(""):"");
  };

  const grade=[0,25,50,75,100].map(v=>
    `<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#d9dcc8"/>`+
    `<text x="${L-8}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="#6a7058">${v}</text>`).join("");
  const eixo=ks.map((p,k)=>
    `<text x="${X(k)}" y="${H-14}" text-anchor="middle" font-size="12" fill="#6a7058">${NAMES[p]}</text>`).join("");

  const resumo=ks.map(p=>{const v=nota(atual.pilares[p]);return `${NAMES[p]} ${v===null?"sem dados":Math.round(v)}`}).join(", ");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Nota por pilar. ${esc(resumo)}" style="max-width:100%;height:auto;display:block">`+
    grade+(ant?serie(ant,COR_ANTERIOR,false):"")+serie(atual,COR_ATUAL,true)+eixo+`</svg>`;
}

// Monta o gráfico (começo do relatório, acima das barras dos pilares), o botão
// "Comparar" (ao lado de "Gerar PDF") e a mensagem da comparação (fim do relatório).
function montarGrafico(atual){
  let box=$("grafico");
  if(!box){box=document.createElement("div");box.id="grafico";$("rbars").before(box)}
  let cmp=$("comparar");
  if(!cmp){cmp=document.createElement("div");cmp.id="comparar";($("fortes")||$("sugs")||$("tips")).after(cmp)}
  box.innerHTML="";cmp.innerHTML="";
  if(!atual)return; // sem respostas não há o que desenhar

  let ant=null;

  // gráfico (começo)
  const h=document.createElement("h3");h.className="qz-subtitulo";h.textContent="Gráfico dos pilares";
  const fig=document.createElement("div");
  const leg=document.createElement("p");leg.className="tip";
  box.append(h,fig,leg);

  // botão "Comparar": fica na linha dos botões, ao lado de "Gerar PDF"
  const inp=document.createElement("input");inp.type="file";inp.accept="application/pdf,.pdf";inp.hidden=true;inp.style.display="none";
  const pdf=$("pdf");
  let btn=$("btn-comparar");
  if(!btn){
    btn=document.createElement("button");btn.id="btn-comparar";btn.type="button";btn.textContent="Comparar";
    btn.title="Comparar com um diagnóstico anterior (PDF gerado por esta página)";
    if($("restart"))btn.className=$("restart").className; // mesmo visual do botão "Refazer questionário"
    if(pdf&&pdf.parentElement){
      let grupo=$("acoes-dir");
      if(!grupo){ // agrupa "Comparar" e "Gerar PDF" lado a lado, à direita
        grupo=document.createElement("div");grupo.id="acoes-dir";
        grupo.style.cssText="display:flex;gap:12px;flex-wrap:wrap;justify-content:flex-end";
        pdf.parentElement.style.flexWrap="wrap";
        pdf.before(grupo);grupo.append(pdf);
      }
      pdf.before(btn);
    }else cmp.append(btn);
  }
  btn.onclick=()=>inp.click();
  // mensagem acima dos botões (dica no início, depois o resultado da comparação)
  const msg=document.createElement("p");msg.className="tip";msg.setAttribute("role","status");
  msg.textContent="Para sobrepor um diagnóstico anterior ao gráfico, use o botão Comparar e escolha o PDF gerado por esta página.";
  cmp.append(inp,msg);

  const item=(cor,txt)=>{
    const s=document.createElement("span");s.style.cssText="display:inline-flex;align-items:center;gap:6px;margin-right:16px";
    const b=document.createElement("i");b.style.cssText=`width:10px;height:10px;border-radius:50%;background:${cor}`;
    s.append(b,txt);return s;
  };
  const desenhar=()=>{
    fig.innerHTML=svgGrafico(atual,ant);
    leg.innerHTML="";
    leg.append(item(COR_ATUAL,rotuloDe(atual)));
    if(ant)leg.append(item(COR_ANTERIOR,rotuloDe(ant)));
  };

  inp.onchange=async()=>{
    const f=inp.files[0];if(!f)return;
    try{
      ant=await lerPDF(f);
      msg.textContent=`Comparando com ${rotuloDe(ant)}. O gráfico no começo do relatório foi atualizado.`+
        (ant.v!==atual.v?` Atenção: esse PDF usa a versão ${ant.v} do questionário e este usa a ${atual.v}, então a comparação pode não ser exata.`:"");
    }catch(e){
      ant=null;
      msg.textContent="Não foi possível ler os dados desse PDF. Use um PDF gerado por este diagnóstico.";
    }
    inp.value=""; // permite escolher o mesmo arquivo outra vez
    desenhar();
    if(ant)box.scrollIntoView({behavior:"smooth",block:"start"}); // leva a pessoa ao gráfico
  };

  desenhar();
}

window.montarGrafico=montarGrafico;
})();