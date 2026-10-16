(()=>{
"use strict";
const API=(window.HR_CONFIG?.API_URL||"").replace(/\/$/,"");
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const page=document.body.dataset.page;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>new Intl.NumberFormat("fr-FR").format(Number(n)||0)+" $";
const statuses={available:"Disponible",reserved:"Réservé",sold:"Vendu"};
const img=url=>url&&/^https:\/\//i.test(url)?url:"assets/img/showroom.svg";
const token=()=>sessionStorage.getItem("hr_admin_token");
async function api(path,options={}){
 const headers={"Content-Type":"application/json",...(options.headers||{})};
 if(options.auth&&token())headers.Authorization="Bearer "+token();
 let r;
 try{r=await fetch(API+path,{method:options.method||"GET",headers,body:options.body===undefined?undefined:JSON.stringify(options.body)});}
 catch{throw Error("Impossible de joindre Cloudflare. Vérifiez SITE_ORIGIN et la connexion.");}
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(data.error||"Erreur HTTP "+r.status);
 return data;
}
function notice(message,error=false){
 const e=$("#status");if(e){e.textContent=message;e.className=error?"notice error":"notice";e.style.display=message?"block":"none";}
}
let siteSettings={};
const siteImage = value => typeof value === "string" && /^https:\/\/[^\s]+$/i.test(value) ? value : "";
function applyAppearance(){
 const logo=siteImage(siteSettings.site_logo_image);
 if(logo){ $$(".brand,.footer-brand").forEach(el=>{el.textContent="";const image=document.createElement("img");image.src=logo;image.alt="H&R Legacy";image.className="brand-image";el.append(image);}); }
 const hero=siteImage(siteSettings.site_hero_image);
 if(hero && $(".hero")) $(".hero").style.backgroundImage=`linear-gradient(90deg,rgba(14,23,33,.82),rgba(14,23,33,.25)),url("${hero.replace(/\"/g,"%22")}")`;
 const catalogue=siteImage(siteSettings.site_catalogue_image);
 if(catalogue && page==="catalogue" && $(".page-head")) {$(".page-head").classList.add("image-page-head");$(".page-head").style.backgroundImage=`linear-gradient(90deg,rgba(14,23,33,.83),rgba(14,23,33,.3)),url("${catalogue.replace(/\"/g,"%22")}")`;}
 const news=siteImage(siteSettings.site_news_image);
 if(news && page==="news" && $(".page-head")) {$(".page-head").classList.add("image-page-head");$(".page-head").style.backgroundImage=`linear-gradient(90deg,rgba(14,23,33,.83),rgba(14,23,33,.3)),url("${news.replace(/\"/g,"%22")}")`;}
}
// Notifications publiques : fermeture mémorisée pour chaque version publiée.
function notificationMarkup(n,preview=false){
 const title=esc(n.title||"Titre de la notification");
 const desc=esc(n.description||"Description de la notification");
 const url=siteImage(n.image_url);
 return `<div class="popup-content">${url?`<img class="popup-image" src="${esc(url)}" alt="" loading="lazy">`:""}<div class="popup-copy"><strong>${title}</strong><p>${desc}</p></div></div>${preview?"":'<button type="button" class="popup-close" aria-label="Fermer la notification">×</button>'}`;
}
async function publicNotification(){
 if(page==="admin")return;
 try{
  const notices=await api("/api/notification");
  if(!Array.isArray(notices)||!notices.length)return;
  const stack=document.createElement("div");stack.className="site-popup-stack";
  for(const n of notices.slice(0,3)){
   const key=`hrlegacy_notice_${n.id}_${n.updated_at}`;
   if(localStorage.getItem(key)==="closed")continue;
   const box=document.createElement("aside");box.className="site-popup site-popup-live";box.setAttribute("role","status");
   box.innerHTML=notificationMarkup(n);stack.append(box);
   box.querySelector(".popup-close").addEventListener("click",()=>{
    localStorage.setItem(key,"closed");box.remove();if(!stack.children.length)stack.remove();
   });
  }
  if(stack.children.length)document.body.append(stack);
 }catch(err){console.warn("Notifications indisponibles",err);}
}
function cropStyle(v){const x=Math.max(0,Math.min(100,Number(v.crop_x??50)||0));const y=Math.max(0,Math.min(100,Number(v.crop_y??50)||0));const z=Math.max(.5,Math.min(3,Number(v.crop_zoom??1)||1));return `transform:translate(${x-50}%,${y-50}%) scale(${z});object-position:center` ;}
function layout(){
 const current=(location.pathname.split('/').pop()||'index.html');
 const links=[['index.html','Accueil'],['catalogue.html','Catalogue'],['actualites.html','Actualités'],['admin.html','Administration']];
 const menu=links.map(([href,label])=>`<a href="${href}" class="${current===href?'is-active':''} ${href==='admin.html'?'nav-admin':''}" ${current===href?'aria-current="page"':''}>${label}</a>`).join('');
 $("#header").innerHTML=`<header class="site-header"><div class="container nav"><a class="brand" href="index.html">H&R <span>LEGACY</span></a><button type="button" class="mobile-menu-toggle" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="site-navigation"><span></span><span></span><span></span></button><nav id="site-navigation" class="nav-links" aria-label="Navigation principale">${menu}</nav></div></header>`;
 const menuButton=document.querySelector('.mobile-menu-toggle');
 const navigation=document.getElementById('site-navigation');
 if(menuButton && navigation){
   const closeMenu=()=>{menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Ouvrir le menu');navigation.classList.remove('mobile-open');};
   menuButton.addEventListener('click',()=>{const opened=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!opened));menuButton.setAttribute('aria-label',opened?'Ouvrir le menu':'Fermer le menu');navigation.classList.toggle('mobile-open',!opened);});
   navigation.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
   document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
   document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
 }


 const target=$("#footer");
 const html=`<footer class="site-footer"><div class="container footer-content"><div class="footer-identity"><a class="footer-brand" href="index.html">H&R LEGACY</a><p>Votre concession automobile à San Andreas.</p></div><nav class="footer-links" aria-label="Navigation de pied de page"><a href="index.html">Accueil</a><a href="catalogue.html">Catalogue</a><a href="actualites.html">Actualités</a></nav></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} H&R Legacy. Tous droits réservés.</span><span>San Andreas · Concession automobile</span></div></footer>`;
 if(target)target.innerHTML=html;
 else document.body.insertAdjacentHTML('beforeend',html);
}

function vehicleCard(v){
 const name=esc(v.brand+" "+v.model);
 return `<article class="card vehicle-card vehicle-card-simple">
   <button type="button" class="vehicle-card-media vehicle-open" data-vehicle-id="${Number(v.id)}" aria-label="Voir ${name}">
     <img class="card-image crop-render" style="${cropStyle(v)}" src="${esc(img(v.image_url))}" alt="${name}" loading="lazy">
   </button>
   <div class="card-body vehicle-card-body">
     <span class="vehicle-card-brand">${esc(v.brand)}</span>
     <h3>${esc(v.model)}</h3>
     <div class="vehicle-card-bottom">
       <strong class="vehicle-card-price">${money(v.price)}</strong>
       <button type="button" class="btn vehicle-card-action vehicle-open" data-vehicle-id="${Number(v.id)}">Voir le véhicule →</button>
     </div>
   </div>
 </article>`;
}
const modalMarkup='<div id="vehicle-modal" class="vehicle-modal" role="dialog" aria-modal="true" aria-labelledby="vehicle-modal-title" hidden><div class="vehicle-modal-dialog"><button type="button" id="vehicle-modal-close" class="vehicle-modal-close" aria-label="Fermer la fiche">×</button><div id="vehicle-modal-content"></div></div></div>';
function initVehicleModal(){
 const modal=$("#vehicle-modal");
 if(!modal)return;
 const close=()=>{modal.hidden=true;document.body.classList.remove("modal-open");};
 document.addEventListener("click",event=>{
   const opener=event.target.closest(".vehicle-open");
   if(opener){
     const v=vehicles.find(item=>Number(item.id)===Number(opener.dataset.vehicleId));
     if(!v)return;
     const seats=v.seats==null||v.seats===""?"Non renseigné":`${Number(v.seats)} place${Number(v.seats)>1?"s":""}`;
     const trunk=v.trunk_kg==null||v.trunk_kg===""?"Non renseigné":`${Number(v.trunk_kg)} kg`;
     $("#vehicle-modal-content").innerHTML=`<div class="modal-vehicle-image"><img class="crop-render" style="${cropStyle(v)}" src="${esc(img(v.image_url))}" alt="${esc(v.brand+" "+v.model)}"></div>
       <div class="modal-vehicle-info"><span class="vehicle-card-brand">${esc(v.brand)}</span><h2 id="vehicle-modal-title">${esc(v.model)}</h2>
       <span class="modal-vehicle-category">${esc(v.category)}</span>
       <div class="modal-vehicle-specs"><div><span>Nombre de places</span><strong>${seats}</strong></div><div><span>Capacité du coffre</span><strong>${trunk}</strong></div></div>
       <div class="modal-vehicle-price"><span>Prix du véhicule</span><strong>${money(v.price)}</strong></div>
       ${v.description?`<p class="modal-vehicle-description">${esc(v.description)}</p>`:""}</div>`;
     modal.hidden=false;document.body.classList.add("modal-open");$("#vehicle-modal-close").focus();
   }
   if(event.target===modal||event.target.closest("#vehicle-modal-close"))close();
 });
 document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!modal.hidden)close();});
}
function newsCard(n){return `<article class="card"><img src="${esc(img(n.image_url))}" alt="" loading="lazy"><div class="card-body"><h3>${esc(n.title)}</h3><p>${esc(n.content).slice(0,180)}${n.content.length>180?"…":""}</p><small>${esc(n.created_at||"")}</small></div></article>`;}
let vehicles=[],news=[],categories=[];
async function publicPage(){
 if(page==="home"||page==="index"){
   const [v,n]=await Promise.all([api("/api/vehicles"),api("/api/news")]);
   vehicles=v;
  if(!$("#vehicle-modal"))document.body.insertAdjacentHTML("beforeend",modalMarkup);
  initVehicleModal();
  $("#featured").innerHTML=(v.filter(x=>x.featured).length?v.filter(x=>x.featured):v).slice(0,3).map(vehicleCard).join("")||"<p>Aucun véhicule pour le moment.</p>";
   $("#latest").innerHTML=n.slice(0,3).map(newsCard).join("")||"<p>Pas encore d'actualités.</p>";
 }
 if(page==="catalogue"){
  const toggleFilters=$("#toggle-filters"),filtersPanel=$("#filters-panel");
  if(toggleFilters&&filtersPanel){
   toggleFilters.addEventListener("click",()=>{
    const opening=filtersPanel.hidden;
    filtersPanel.hidden=!opening;
    toggleFilters.setAttribute("aria-expanded",String(opening));
   });
  }

  vehicles=await api("/api/vehicles");
  initVehicleModal();
  const cats=(await api("/api/categories")).map(c=>c.name);
  $("#category").innerHTML='<option value="">Toutes les catégories</option>'+cats.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");
  const ids=["search","category","price-min","price-max","seats-filter","trunk-min","trunk-max"];
  const bound=(v,min,max)=>{
   const lo=$("#"+min)?.value ?? "",hi=max ? ($("#"+max)?.value ?? "") : "";
   return (lo===""||Number(v)>=Number(lo))&&(hi===""||Number(v)<=Number(hi));
  };
  const render=()=>{
   const q=$("#search").value.trim().toLowerCase(),c=$("#category").value;
   const rows=vehicles.filter(v=>(v.brand+" "+v.model).toLowerCase().includes(q)&&(!c||v.category===c)&&bound(v.price,"price-min","price-max")&&(!$("#seats-filter").value||Number(v.seats)===Number($("#seats-filter").value))&&bound(v.trunk_kg,"trunk-min","trunk-max"));
   $("#results").textContent=rows.length+" véhicule(s)";
   $("#vehicle-grid").innerHTML=rows.map(vehicleCard).join("")||"<p>Aucun véhicule ne correspond à ces filtres.</p>";
  };
  ids.forEach(id=>$("#"+id).addEventListener("input",render));
  $("#reset-filters").onclick=()=>{ids.forEach(id=>$("#"+id).value="");render();};
  render();
 }
 if(page==="vehicle"){
  const id=Number(new URLSearchParams(location.search).get("id"));
  const v=(await api("/api/vehicles")).find(x=>x.id===id);
  if(!v){notice("Véhicule introuvable.",true);return;}
  $("#detail").innerHTML=`<div class="panel"><img class="detail-image crop-render" style="${cropStyle(v)}" src="${esc(img(v.image_url))}" alt="${esc(v.brand+" "+v.model)}"></div><div class="panel"><span class="eyebrow">${esc(v.category)}</span><h1>${esc(v.brand)} ${esc(v.model)}</h1><h2>${money(v.price)}</h2><p>${esc(statuses[v.status]||v.status)}</p><p>${Number(v.seats)||0} places · Poids coffre : ${Number(v.trunk_kg)||0} kg</p><p style="white-space:pre-wrap">${esc(v.description)}</p></div>`;
 }
 if(page==="news"){
  const n=await api("/api/news");$("#news-grid").innerHTML=n.map(newsCard).join("")||"<p>Pas encore d'actualités.</p>";
 }

}
function setLogged(logged){$("#login-panel").classList.toggle("hidden",logged);$("#admin-panel").classList.toggle("hidden",!logged);}
function adminRows(){
 $("#count-v").textContent=vehicles.length;$("#count-n").textContent=news.length;
 const priceSort=$("#admin-vehicle-price-sort")?.value||"default";
 const listedVehicles=[...vehicles];
 if(priceSort==="asc")listedVehicles.sort((a,b)=>Number(a.price||0)-Number(b.price||0));
 if(priceSort==="desc")listedVehicles.sort((a,b)=>Number(b.price||0)-Number(a.price||0));
 $("#admin-vehicles").innerHTML=listedVehicles.map(v=>`<tr><td data-label="Modèle"><span class="vehicle-table-name">${esc([v.brand,v.model].filter(Boolean).join(" "))}</span><span class="vehicle-table-category">${esc(v.category||"Véhicule")}</span></td><td data-label="Prix"><strong class="vehicle-table-price">${money(v.price)}</strong></td><td data-label="Actions"><div class="vehicle-table-actions"><button class="btn outline small" data-edit-v="${v.id}" type="button">Modifier</button><button class="btn outline small vehicle-delete-btn" data-del-v="${v.id}" type="button">Supprimer</button></div></td></tr>`).join("");
 $("#admin-news").innerHTML=news.map(n=>`<tr><td>${esc(n.title)}</td><td>${n.published?"Publiée":"Brouillon"}</td><td><button class="btn outline small" data-edit-n="${n.id}">Modifier</button> <button class="btn outline small" data-del-n="${n.id}">Supprimer</button></td></tr>`).join("");
}
async function refreshCategories(){
 categories=await api("/api/categories");
 const chosen=$("#v-category").value;
 $("#v-category").innerHTML='<option value="">Choisir une catégorie</option>'+categories.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join("");
 if(categories.some(c=>c.name===chosen)) $("#v-category").value=chosen;
 const counts=Object.fromEntries(categories.map(c=>[c.name,vehicles.filter(v=>v.category===c.name).length]));
 $("#admin-categories").innerHTML=categories.map(c=>`<tr><td>${esc(c.name)}</td><td>${counts[c.name]}</td><td><button class="btn outline small" data-edit-cat="${c.id}">Renommer</button> <button class="btn outline small" data-del-cat="${c.id}">Supprimer</button></td></tr>`).join("");
}
async function refreshAdmin(){
 [vehicles,news]=await Promise.all([api("/api/vehicles"),api("/api/admin/news",{auth:true})]);adminRows();await refreshCategories();
}
 function updateCropPreview(){
  const preview=$("#v-crop-preview"),url=$("#v-image-url").value.trim();
  if(preview.dataset.currentUrl!==url){preview.src=img(url);preview.dataset.currentUrl=url;}
  preview.style.cssText=cropStyle({crop_x:$("#v-crop-x").value,crop_y:$("#v-crop-y").value,crop_zoom:$("#v-crop-zoom").value});
  $("#v-crop-zoom-value").textContent=Math.round(Number($("#v-crop-zoom").value)*100)+" %";
 }
let pendingVehicleImage=null;
async function uploadVehicleImage(file){
 if(!file || !file.type.startsWith("image/"))throw Error("Choisis une image JPEG, PNG ou WebP.");
 if(file.size>5*1024*1024)throw Error("Image trop volumineuse (maximum 5 Mo).");
 const status=$("#v-upload-status");status.textContent="Envoi de l’image…";
 const headers={"Content-Type":file.type};if(token())headers.Authorization="Bearer "+token();
 try{
  const response=await fetch(API+"/api/admin/upload-vehicle-image",{method:"POST",headers,body:file});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.error||"Échec de l’envoi de l’image.");
  $("#v-image-url").value=data.url;pendingVehicleImage=null;updateCropPreview();
  status.textContent="Image importée ! Ajuste maintenant le cadrage.";
 }catch(e){status.textContent=e.message;throw e;}
}
function initVehicleUpload(){
 const zone=$("#v-image-drop"),input=$("#v-image-file"),status=$("#v-upload-status");if(!zone||!input)return;
 const handle=async file=>{try{await uploadVehicleImage(file);}catch(e){notice(e.message,true);}};
 input.addEventListener("change",()=>{if(input.files?.[0])handle(input.files[0]);input.value="";});
 zone.addEventListener("click",e=>{if(e.target!==input)input.click();});
 zone.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();input.click();}});
 for(const name of ["dragenter","dragover"]){zone.addEventListener(name,e=>{e.preventDefault();zone.classList.add("drag-over");});}
 for(const name of ["dragleave","drop"]){zone.addEventListener(name,e=>{e.preventDefault();zone.classList.remove("drag-over");});}
 zone.addEventListener("drop",e=>{const file=[...(e.dataTransfer?.files||[])].find(f=>f.type.startsWith("image/"));if(file)handle(file);else status.textContent="Dépose une image valide.";});
 document.addEventListener("paste",e=>{if(page!=="admin"||$("#admin-panel")?.hidden)return;const file=[...(e.clipboardData?.items||[])].find(i=>i.type.startsWith("image/"))?.getAsFile();if(file){e.preventDefault();handle(file);}});
}
function resetVehicle(){$("#vehicle-form").reset();$("#v-brand").value="H&R Legacy";$("#v-id").value="";$("#v-crop-x").value=50;$("#v-crop-y").value=50;$("#v-crop-zoom").value=1;updateCropPreview();$("#vehicle-form-title").textContent="Ajouter un véhicule";}
function resetNews(){$("#news-form").reset();$("#n-id").value="";$("#news-form-title").textContent="Ajouter une actualité";}
function refreshAppearanceForm(){
 const mapping={"a-logo":"site_logo_image","a-hero":"site_hero_image","a-catalogue":"site_catalogue_image","a-news":"site_news_image"};
 for(const [id,key] of Object.entries(mapping)){
   $("#"+id).value=siteSettings[key]||"";
   const preview=$("#preview-"+id.slice(2));
   if(preview){preview.src=siteImage(siteSettings[key])||"assets/img/showroom.svg";}
 }
}
let adminNotifications=[];
async function loadAdminNotifications(){
 adminNotifications=await api("/api/admin/notifications",{auth:true});
 const activeCount=adminNotifications.filter(n=>n.active).length;
 const counter=$("#notification-active-counter");if(counter)counter.textContent=`${activeCount}/3 notifications actives`;
 $("#admin-notifications").innerHTML=adminNotifications.map(n=>`<tr><td>${esc(n.title)}</td><td>${n.active?"Active":"Désactivée"}</td><td><button class="btn outline small" data-edit-notification="${n.id}">Modifier</button> <button class="btn outline small" data-delete-notification="${n.id}">Supprimer</button></td></tr>`).join("")||'<tr><td colspan="3">Aucune notification</td></tr>';
}
function updateNotificationPreview(){
 $("#notification-preview").innerHTML=notificationMarkup({title:$("#notification-title").value,description:$("#notification-description").value,image_url:$("#notification-image").value},true);
}
function resetNotificationForm(){
 $("#notification-form").reset();$("#notification-id").value="";$("#notification-active").checked=true;
 $("#notification-form-title").textContent="Créer une notification";updateNotificationPreview();
}
async function adminPage(){
 $("#admin-vehicle-price-sort")?.addEventListener("change",adminRows);
 $("#login-form").onsubmit=async e=>{e.preventDefault();try{
  const result=await api("/api/admin/login",{method:"POST",body:{code:$("#admin-code").value}});
  sessionStorage.setItem("hr_admin_token",result.token);$("#admin-code").value="";
  await refreshAdmin();await loadAdminNotifications();refreshAppearanceForm();setLogged(true);notice("");
 }catch(err){notice(err.message,true);}};
 $("#logout").onclick=async()=>{try{await api("/api/admin/logout",{method:"POST",auth:true});}catch{}sessionStorage.removeItem("hr_admin_token");setLogged(false);notice("Déconnecté.");};
 if(token()){try{await api("/api/admin/me",{auth:true});await refreshAdmin();await loadAdminNotifications();refreshAppearanceForm();setLogged(true);}catch{sessionStorage.removeItem("hr_admin_token");setLogged(false);}}
 ["notification-title","notification-description","notification-image"].forEach(id=>$("#"+id).addEventListener("input",updateNotificationPreview));
 $("#notification-reset").onclick=resetNotificationForm;
 $("#notification-form").onsubmit=async e=>{
  e.preventDefault();const id=$("#notification-id").value;
  const body={title:$("#notification-title").value,description:$("#notification-description").value,image_url:$("#notification-image").value,active:$("#notification-active").checked};
  try{await api("/api/admin/notifications"+(id?"/"+id:""),{method:id?"PUT":"POST",auth:true,body});await loadAdminNotifications();resetNotificationForm();notice("Notification enregistrée.");}catch(err){notice(err.message,true);}
 };
 $("#admin-notifications").onclick=async e=>{
  const b=e.target.closest("button");if(!b)return;
  const edit=b.dataset.editNotification,del=b.dataset.deleteNotification;
  if(edit){const n=adminNotifications.find(x=>x.id===Number(edit));if(!n)return;
   $("#notification-id").value=n.id;$("#notification-title").value=n.title;$("#notification-description").value=n.description;$("#notification-image").value=n.image_url||"";$("#notification-active").checked=!!n.active;$("#notification-form-title").textContent="Modifier la notification";updateNotificationPreview();$("#notification-form").scrollIntoView({behavior:"smooth"});
  }
  if(del&&confirm("Supprimer cette notification ?")){try{await api("/api/admin/notifications/"+del,{method:"DELETE",auth:true});await loadAdminNotifications();notice("Notification supprimée.");}catch(err){notice(err.message,true);}}
 };
 updateNotificationPreview();
 $$(".admin-tabs button").forEach(b=>b.onclick=()=>{$$(".admin-tabs button").forEach(x=>x.classList.toggle("active",x===b));$$("[data-pane]").forEach(p=>p.classList.toggle("hidden",p.dataset.pane!==b.dataset.tab));});
 $("#category-form").onsubmit=async e=>{
  e.preventDefault();const id=$("#cat-id").value;
  try{await api("/api/admin/categories"+(id?"/"+id:""),{method:id?"PUT":"POST",auth:true,body:{name:$("#cat-name").value}});$("#cat-id").value="";$("#cat-name").value="";await refreshAdmin();notice("Catégorie enregistrée.");}catch(err){notice(err.message,true);}
 };
 $("#reset-cat").onclick=()=>{$("#cat-id").value="";$("#cat-name").value="";};
 $("#admin-categories").onclick=async e=>{
  const b=e.target.closest("button");if(!b)return;
  if(b.dataset.editCat){const c=categories.find(c=>c.id===Number(b.dataset.editCat));if(c){$("#cat-id").value=c.id;$("#cat-name").value=c.name;$("#cat-name").focus();}}
  if(b.dataset.delCat){if(!confirm("Supprimer cette catégorie ?"))return;try{await api("/api/admin/categories/"+b.dataset.delCat,{method:"DELETE",auth:true});await refreshAdmin();notice("Catégorie supprimée.");}catch(err){notice(err.message,true);}}
 };
 $("#appearance-form").onsubmit=async e=>{
  e.preventDefault();const body={site_logo_image:$("#a-logo").value.trim(),site_hero_image:$("#a-hero").value.trim(),site_catalogue_image:$("#a-catalogue").value.trim(),site_news_image:$("#a-news").value.trim()};
  try{await api("/api/admin/site-settings",{method:"PUT",auth:true,body});siteSettings=body;refreshAppearanceForm();applyAppearance();notice("Apparence du site enregistrée.");}catch(err){notice(err.message,true);}
 };
 ["logo","hero","catalogue","news"].forEach(k=>$("#a-"+k).addEventListener("input",()=>{$("#preview-"+k).src=siteImage($("#a-"+k).value)||"assets/img/showroom.svg";}));

 ["v-image-url","v-crop-x","v-crop-y","v-crop-zoom"].forEach(id=>$("#"+id).addEventListener("input",updateCropPreview));
 const cropArea=$("#v-crop-area");let drag=null;
 cropArea.addEventListener("pointerdown",e=>{if(e.button!==0&&e.pointerType==="mouse")return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:Number($("#v-crop-x").value),startY:Number($("#v-crop-y").value)};cropArea.setPointerCapture(e.pointerId);cropArea.classList.add("dragging");});
 cropArea.addEventListener("pointermove",e=>{if(!drag||e.pointerId!==drag.id)return;const r=cropArea.getBoundingClientRect();const clamp=n=>Math.round(Math.max(0,Math.min(100,n)));$("#v-crop-x").value=clamp(drag.startX+(e.clientX-drag.x)/r.width*100);$("#v-crop-y").value=clamp(drag.startY+(e.clientY-drag.y)/r.height*100);updateCropPreview();});
 const endDrag=e=>{if(drag&&e.pointerId===drag.id){drag=null;cropArea.classList.remove("dragging");}};
 cropArea.addEventListener("pointerup",endDrag);cropArea.addEventListener("pointercancel",endDrag);
 $("#v-crop-reset").onclick=()=>{$("#v-crop-x").value=50;$("#v-crop-y").value=50;$("#v-crop-zoom").value=1;updateCropPreview();};
 updateCropPreview();initVehicleUpload();
 $("#reset-v").onclick=resetVehicle;$("#reset-n").onclick=resetNews;
 $("#vehicle-form").onsubmit=async e=>{e.preventDefault();const id=$("#v-id").value;
  const b={brand:$("#v-brand").value,model:$("#v-name").value,category:$("#v-category").value,price:Number($("#v-price").value),description:$("#v-description").value,image_url:$("#v-image-url").value,status:(id ? (vehicles.find(v=>String(v.id)===String(id))?.status || "available") : "available"),featured:$("#v-featured").checked,seats:Number($("#v-seats").value),trunk_kg:Number($("#v-trunk").value),crop_x:Number($("#v-crop-x").value),crop_y:Number($("#v-crop-y").value),crop_zoom:Number($("#v-crop-zoom").value)};
  try{await api("/api/admin/vehicles"+(id?"/"+id:""),{auth:true,method:id?"PUT":"POST",body:b});resetVehicle();await refreshAdmin();notice("Véhicule enregistré.");}catch(err){notice(err.message,true);}
 };
 $("#news-form").onsubmit=async e=>{e.preventDefault();const id=$("#n-id").value;
  try{await api("/api/admin/news"+(id?"/"+id:""),{auth:true,method:id?"PUT":"POST",body:{title:$("#n-title").value,content:$("#n-content").value,image_url:$("#n-image-url").value,published:$("#n-published").checked}});resetNews();await refreshAdmin();notice("Actualité enregistrée.");}catch(err){notice(err.message,true);}
 };
 $("#admin-panel").addEventListener("click",async e=>{
  const b=e.target.closest("button");if(!b)return;
  let id;
  if(id=b.dataset.editV){const v=vehicles.find(x=>x.id===Number(id));if(!v)return;$("#v-id").value=v.id;$("#v-name").value=v.model;$("#v-brand").value=v.brand;$("#v-category").value=v.category;$("#v-price").value=v.price;$("#v-seats").value=v.seats??0;$("#v-trunk").value=v.trunk_kg??0;$("#v-image-url").value=v.image_url||"";$("#v-crop-x").value=v.crop_x??50;$("#v-crop-y").value=v.crop_y??50;$("#v-crop-zoom").value=v.crop_zoom??1;updateCropPreview();$("#v-description").value=v.description||"";$("#v-featured").checked=!!v.featured;$("#vehicle-form-title").textContent="Modifier le véhicule";$("#vehicle-form").scrollIntoView({behavior:"smooth"});}
  if(id=b.dataset.editN){const n=news.find(x=>x.id===Number(id));if(!n)return;$("#n-id").value=n.id;$("#n-title").value=n.title;$("#n-content").value=n.content;$("#n-image-url").value=n.image_url||"";$("#n-published").checked=!!n.published;$("#news-form-title").textContent="Modifier l'actualité";$("#news-form").scrollIntoView({behavior:"smooth"});}
  if(id=b.dataset.delV){if(!confirm("Supprimer ce véhicule ?"))return;try{await api("/api/admin/vehicles/"+id,{auth:true,method:"DELETE"});await refreshAdmin();}catch(err){notice(err.message,true);}}
  if(id=b.dataset.delN){if(!confirm("Supprimer cette actualité ?"))return;try{await api("/api/admin/news/"+id,{auth:true,method:"DELETE"});await refreshAdmin();}catch(err){notice(err.message,true);}}
 });
}
document.addEventListener("DOMContentLoaded",async()=>{layout();try{siteSettings=await api("/api/site-settings");applyAppearance();if(page==="admin")await adminPage();else {await publicPage();await publicNotification();}}catch(err){notice(err.message,true);}});
})();
