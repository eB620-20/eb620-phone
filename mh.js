/* ---------- 8t: Multi-Hose test (prototype: results stay on this phone, nothing is sent to the workbook yet) ---------- */
S.mh=lsGet('ebp_mh',null)||{loc:'',filter:'all',items:{}};
if(!S.mh.items)S.mh.items={};
S.mhOn=false;
function mhSave(){lsSet('ebp_mh',S.mh)}
function mhLocs(){
  var seen={},out=[];
  function add(a){a=String(a||'').trim();var k=locNorm(a);if(a&&!seen[k]){seen[k]=1;out.push(a)}}
  allTanks().forEach(function(t){if(t.row)add(t.v.A)});
  tduRows().forEach(function(t){add(t.v.A)});
  out.sort(natural);return out;
}
function mhHose(v,cols){var o={},ks=['V','W','X','Y'];ks.forEach(function(k,j){var x=v[cols?cols[j]:k];if(x!=null&&String(x).trim()!=='')o[k]=String(x).trim()});return o}
function mhHas(h){return !!(h.V||h.W||h.X||h.Y)}
function mhSig(h){return ['V','W','X','Y'].map(function(k){return norm(h[k])}).join('|')}
function mhItems(){
  var loc=S.mh.loc,out=[],groups={},order=[];
  if(!loc)return out;
  allTanks().forEach(function(t){
    if(!t.row||locNorm(t.v.A)!==locNorm(loc))return;
    if(!S.mh.all&&!isActive(t.v.F))return;
    var k=keyOf(t.v);if(!groups[k]){groups[k]=[];order.push(k)}groups[k].push(t)});
  order.forEach(function(k){
    var g=groups[k].slice().sort(function(a,b){return a.row-b.row}),subs={},so=[];
    g.forEach(function(t){var h=mhHose(t.v),s=mhSig(h);if(!subs[s]){subs[s]=[];so.push(s)}subs[s].push(t)});
    so.forEach(function(s,si){
      var ts=subs[s],v0=ts[0].v,h=mhHose(v0),tag='';
      if(g.length>1)tag=(ts.length===g.length?(g.length===2?'Twin':'Triple')+' - one hose':(g.length===2?'Twin':'Triple')+' - hose '+(si+1));
      out.push({id:'n:'+ts[0].row,kind:'n',unit:String(v0.D||''),co:String(v0.C||''),tag:tag,rows:ts.map(function(t){return t.row}),
        desc:[v0.AD,v0.AF,v0.AE].filter(Boolean).join(' - '),hose:h,has:mhHas(h)})})});
  tduList().forEach(function(t){
    if(locNorm(t.v.A)!==locNorm(loc))return;
    var ur=tduUnitRows(t.v),b=(ur[0]||t).v;
    if(!S.mh.all&&b.E&&!isActive(b.E))return;
    DUHOSE.forEach(function(c,i){
      var h=mhHose(b,c);
      if(!mhHas(h)&&i>0)return;
      out.push({id:'d:'+t.row+':'+i,kind:'d',unit:String(b.D||''),co:String(b.C||''),tag:'DU - '+DUHN[i].toLowerCase(),rows:ur.map(function(x){return x.row}),du:true,
        desc:[b.F,b.AM,b.AN].filter(Boolean).join(' - '),hose:h,has:mhHas(h)})})});
  out.sort(function(a,b){return natural(a.unit,b.unit)||(a.id<b.id?-1:1)});
  return out;
}
function mhS(id,mk){var o=S.mh.items[id];if(!o&&mk){o=S.mh.items[id]={res:'',np:0,cm:'',rb:0,nt:0,yr:'',ln:'',dia:'',mf:''}}return o||{res:'',np:0,cm:'',rb:0,nt:0,yr:'',ln:'',dia:'',mf:''}}
function mhCounts(items){var c={n:items.length,p:0,f:0,todo:0};items.forEach(function(it){var r=mhS(it.id).res;if(r==='P')c.p++;else if(r==='F')c.f++;else c.todo++});return c}
function mhSelHtml(c,cur,old,first,key){
  return '<select class="mhsel" data-mhf="'+key+'">'+f5opts(c,cur,old,first)+'</select>';
}
function mhCard(it){
  var o=mhS(it.id),cls=o.res==='P'?' p':o.res==='F'?' f':'',foc=S.mhFocus===it.id?' mhfocus':'',h=it.hose,id=esc(it.id);
  var info=[h.V&&('expires '+h.V),h.X&&(h.X+' ft'),h.W,h.Y].filter(Boolean).join(', ');
  var s='<div class="panel mhc'+cls+foc+'" id="mh_'+id.replace(/[^\w]/g,'_')+'"><div class="mhh"><span class="mhu">'+esc(it.unit||'?')+'</span><span class="mhco">'+esc(it.co)+'</span>'+(it.tag?'<span class="mhtag">'+esc(it.tag)+'</span>':'')+'</div>';
  if(it.desc)s+='<p class="count" style="margin:.1rem 0 .1rem">'+esc(it.desc)+'</p>';
  s+='<p class="mhfile">'+(info?'Hose on file: '+esc(info):'No hose on file for this tank. Fill in the hose below.')+'</p>';
  s+='<div class="chips"><button type="button" class="chip y'+(o.res==='P'?' on':'')+'" data-mhr="'+id+'" data-v="P">Pass</button><button type="button" class="chip n'+(o.res==='F'?' on':'')+'" data-mhr="'+id+'" data-v="F">Fail</button></div>';
  if(o.res==='F'||!it.has){
    s+='<div class="f2h" style="margin-top:.8rem">'+(it.has?'New hose':'Hose details')+'</div>';
    if(it.has)s+='<p class="count" style="margin:0 0 .3rem">Fill in only what is different from the old hose. A box left empty keeps the old hose\'s detail.</p>';
    s+='<div class="mhgrid"><div class="field"><label>Expiry year</label><input type="text" inputmode="numeric" maxlength="4" autocomplete="off" placeholder=" " data-mhf="yr|'+id+'" value="'+esc(o.yr)+'">'+(h.V?'<div class="hint">On file: '+esc(h.V)+'</div>':'')+'</div>';
    s+='<div class="field"><label>Length (ft)</label><input type="text" inputmode="decimal" autocomplete="off" placeholder=" " data-mhf="ln|'+id+'" value="'+esc(o.ln)+'">'+(h.X?'<div class="hint">On file: '+esc(h.X)+' ft</div>':'')+'</div></div>';
    s+='<div class="field" style="margin-top:.5rem"><label>Diameter</label>'+mhSelHtml('W',o.dia,h.W,it.has?null:'Choose','dia|'+id)+(h.W?'<div class="hint">On file: '+esc(h.W)+'</div>':'')+'</div>';
    s+='<div class="field" style="margin-top:.5rem"><label>Manufacturer</label>'+mhSelHtml('Y',o.mf,h.Y,it.has?null:'Choose','mf|'+id)+(h.Y?'<div class="hint">On file: '+esc(h.Y)+'</div>':'')+'</div>';
    if(o.res==='F')s+='<button type="button" class="chip s" style="display:block;width:100%;text-align:left;margin-top:.7rem'+(o.np?'':'')+'" data-mhnp="'+id+'">'+(o.np?'&#10003; ':'')+'New hose fitted and passed</button>';
  }
  if(o.nt||o.cm||o.rb){
    s+='<div class="field" style="margin-top:.7rem"><label>Note (optional, short)</label><input type="text" maxlength="'+F5CM+'" autocomplete="off" placeholder=" " data-mhf="cm|'+id+'" value="'+esc(o.cm)+'"></div>';
    s+='<button type="button" class="chip s'+(o.rb?' on':'')+'" style="display:block;width:100%;text-align:left;margin-top:.5rem" data-mhrb="'+id+'">'+(o.rb?'&#10003; ':'')+'Hose end valve rebuilt</button>';
  }else s+='<button type="button" class="lnk" style="margin-top:.5rem" data-mhnt="'+id+'">+ Add a note (for example: end valve rebuilt)</button>';
  return s+'</div>';
}
function renderMH(){
  var h='',m=S.mh;
  $('#tabs').hidden=true;$('#fab').hidden=true;
  $('#top').innerHTML='<button class="hbtn icon" id="mhBack" type="button" aria-label="Back">&#8249;</button><div class="grow"><h1>Multi-Hose test</h1><p>'+(m.loc?esc(m.loc):'Choose the location')+'</p></div><button class="hbtn solid" id="mhDone" type="button">Done</button>';
  h+='<div class="banner"><b>Prototype.</b> Pass / Fail and new-hose details are kept on this phone only. Sending them to the workbook for Form 5 comes after you approve these screens. Test gauge serial numbers stay in the workbook.</div>';
  if(!m.loc){
    var locs=mhLocs(),started=Object.keys(m.items).length;
    h+='<div class="panel"><h2>Which location?</h2><p>All the tanks and DUs at the location are listed with their hose on file. Go down the list as you test each hose.</p><div class="field"><select class="mhsel" id="mhLoc"><option value="">Choose a location</option>'+locs.map(function(a){return '<option value="'+esc(a)+'">'+esc(a)+'</option>'}).join('')+'</select></div></div>';
    $('#view').innerHTML=h;return;
  }
  var items=mhItems(),c=mhCounts(items),pct=c.n?Math.round((c.p+c.f)*100/c.n):0;
  h+='<div class="panel"><h2>'+esc(m.loc)+'</h2><p style="margin:0 0 .5rem"><b>'+(c.p+c.f)+'</b> of <b>'+c.n+'</b> hoses tested - <span style="color:var(--good);font-weight:700">'+c.p+' pass</span> - <span style="color:var(--bad);font-weight:700">'+c.f+' fail</span> - '+c.todo+' to do</p><div class="mhbar"><div style="width:'+pct+'%"></div></div><div class="row" style="margin-top:.7rem;display:flex;gap:.5rem"><button type="button" class="btn primary" style="flex:1" data-mhscan="1">Scan a QR label</button><button type="button" class="btn" style="flex:1" id="mhChange">Change location</button></div></div>';
  h+='<div class="chips" style="margin:0 0 .6rem">'+[['all','All ('+c.n+')'],['todo','To do ('+c.todo+')'],['F','Failed ('+c.f+')']].map(function(x){return '<button type="button" class="chip s'+(m.filter===x[0]?' on':'')+'" data-mhfilter="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</div>';
  var shown=items.filter(function(it){var r=mhS(it.id).res;return m.filter==='todo'?!r:m.filter==='F'?r==='F':true});
  if(!items.length)h+='<div class="panel"><p>No active tanks or DUs with a hose at '+esc(m.loc)+' in the list on this phone.</p></div>';
  else if(!shown.length)h+='<div class="panel"><p>'+(m.filter==='todo'?'Every hose has an answer.':'No failed hoses.')+'</p></div>';
  h+=shown.map(mhCard).join('');
  h+='<div class="panel"><button type="button" class="lnk" id="mhClear" style="color:var(--bad)">Clear all results for '+esc(m.loc)+'</button></div>';
  $('#view').innerHTML=h;
}
function mhBack(){S.mhOn=false;S.tab='tanks';window.scrollTo(0,0);render()}
function mhClick(t){
  var m=S.mh,y=window.scrollY;
  function again(){mhSave();renderMH();window.scrollTo(0,y)}
  if(t.closest('#mhBack')||t.closest('#mhDone')){mhBack();return}
  if(t.closest('[data-mhscan]')){S.mhScan=1;qrScan();return}
  if(t.closest('#mhChange')){m.loc='';m.filter='all';again();window.scrollTo(0,0);return}
  var fl=t.closest('[data-mhfilter]');if(fl){m.filter=fl.getAttribute('data-mhfilter');again();return}
  var r=t.closest('[data-mhr]');if(r){var o=mhS(r.getAttribute('data-mhr'),1),x=r.getAttribute('data-v');o.res=(o.res===x)?'':x;if(o.res!=='F')o.np=0;S.mhFocus='';again();return}
  var np=t.closest('[data-mhnp]');if(np){var o2=mhS(np.getAttribute('data-mhnp'),1);o2.np=o2.np?0:1;again();return}
  var rb=t.closest('[data-mhrb]');if(rb){var o3=mhS(rb.getAttribute('data-mhrb'),1);o3.rb=o3.rb?0:1;again();return}
  var nt=t.closest('[data-mhnt]');if(nt){var o4=mhS(nt.getAttribute('data-mhnt'),1);o4.nt=1;again();return}
  var cl=t.closest('#mhClear');if(cl){if(cl.getAttribute('data-armed')){var keep={};Object.keys(m.items).forEach(function(k){if(!mhItems().some(function(it){return it.id===k}))keep[k]=m.items[k]});m.items=keep;again();toast('Cleared for '+m.loc+'.')}else{cl.setAttribute('data-armed','1');cl.textContent='Tap again to clear every result for '+m.loc;setTimeout(function(){if(cl.isConnected){cl.removeAttribute('data-armed');cl.textContent='Clear all results for '+m.loc}},4000)}return}
}
function mhInput(el){
  var k=el.getAttribute('data-mhf');if(!k)return false;
  var p=k.split('|'),id=p.slice(1).join('|'),o=mhS(id,1);
  o[p[0]]=el.value;mhSave();return true;
}
/* a label scanned while the Multi-Hose list is open jumps to that hose instead of opening the tank */
function mhQr(qs){
  function qp(n){try{var mm=new RegExp('[?&]'+n+'=([^&#]*)').exec(qs);return mm?decodeURIComponent(mm[1].replace(/\+/g,' ')).trim():''}catch(e){return ''}}
  var q=qp('s'),u=qp('u'),qn=q.toLowerCase().replace(/\s+/g,''),items=mhItems(),hit=null;
  function same(x){return String(x||'').toLowerCase().replace(/\s+/g,'')===qn}
  var rows=[];
  if(q){allTanks().forEach(function(t){if(t.row&&same(t.v.AB))rows.push(t.row)});tduRows().forEach(function(t){if(t.row&&(same(t.v.AJ)||same(t.v.AK)))rows.push(t.row)})}
  items.forEach(function(it){if(hit)return;if(q&&it.rows.some(function(r){return rows.indexOf(r)>=0}))hit=it;else if(u&&norm(it.unit)===norm(u))hit=it});
  S.mhScan=0;
  if(!hit){toast('That label is not one of the tanks at '+S.mh.loc+'. Check the location, or the tank may not be active.');return}
  S.mh.filter='all';S.mhFocus=hit.id;renderMH();
  var el=document.getElementById('mh_'+hit.id.replace(/[^\w]/g,'_'));if(el)el.scrollIntoView({block:'center'});
  toast('Unit '+hit.unit+(hit.tag?' - '+hit.tag:'')+'. Pass or Fail.');
}
