// ======= Storage =======
const USERS_KEY = "katielle_users_v5";
const VIDEOS_KEY = "katielle_videos_v5";
const SESSION_KEY = "katielle_session_v5";

// ✅ Senha do ADM
const ADMIN_PASSWORD = "150423";

// ======= Tópicos fixos =======
const TOPIC_META = [
  { key:"start", title:"Primeiro comece aqui", hint:"Boas-vindas e organização da rotina." },
  { key:"stretchmob", title:"Alongamento e Mobilidade", hint:"Soltar, alinhar e melhorar o movimento." },
  { key:"lower", title:"Inferiores", hint:"Glúteos e pernas (força e definição)." },
  { key:"upper", title:"Superiores", hint:"Costas, peito, ombro, bíceps e tríceps." },
  { key:"abs", title:"Abdomen", hint:"Core forte para performance e postura." },
];

// ======= Vídeos padrão (sempre terá pelo menos 1) =======
const DEFAULT_VIDEOS = [
  { id:"s1", topic:"start", label:"Comece aqui", title:"Boas-vindas à Consultoria", desc:"Como usar a plataforma e montar a rotina.", youtubeId:"px9eEBAQlFo", featured:true }
];

// ======= Utils =======
const el = (id) => document.getElementById(id);
let searchText = "";

function normalize(s){
  return (s||"").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}
function uid(){
  return "v_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}
function getObj(key){
  try{ return JSON.parse(localStorage.getItem(key)) || null; }catch{ return null; }
}
function setObj(key, val){
  localStorage.setItem(key, JSON.stringify(val));
}
function getUsers(){ return getObj(USERS_KEY) || {}; }
function setUsers(u){ setObj(USERS_KEY, u); }

function getVideos(){
  let v = getObj(VIDEOS_KEY);
  if(!v || !Array.isArray(v) || v.length === 0){
    v = DEFAULT_VIDEOS;
    setObj(VIDEOS_KEY, v);
  }
  // ✅ garante que sempre exista 1 featured
  if(!v.some(x => x.featured)){
    v[0].featured = true;
    setObj(VIDEOS_KEY, v);
  }
  return v;
}
function setVideos(v){
  if(!Array.isArray(v) || v.length === 0){
    v = DEFAULT_VIDEOS;
  }
  // ✅ garante que sempre exista 1 featured
  if(!v.some(x => x.featured)){
    v[0].featured = true;
  }
  setObj(VIDEOS_KEY, v);
}

function planToMonths(plan){
  if (plan === "3m") return 3;
  if (plan === "6m") return 6;
  if (plan === "1y") return 12;
  return 3;
}
function addMonths(date, months){
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d;
}
function formatDateBR(dt){
  const d = new Date(dt);
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
function isExpired(expiresAt){
  return Date.now() > new Date(expiresAt).getTime();
}
function extractYoutubeId(input){
  const t = (input||"").trim();
  if(!t) return "";
  if(t.includes("youtu.be/")){
    return t.split("youtu.be/")[1].split(/[?&]/)[0];
  }
  if(t.includes("youtube.com")){
    const m = t.match(/[?&]v=([^?&]+)/);
    if(m && m[1]) return m[1];
    const shorts = t.match(/shorts\/([^?&]+)/);
    if(shorts && shorts[1]) return shorts[1];
  }
  return t;
}

// ======= Abas =======
function setTab(which){
  const isLogin = which === "login";
  const isReg = which === "register";
  const isAdm = which === "admin";

  el("tabLogin").classList.toggle("active", isLogin);
  el("tabRegister").classList.toggle("active", isReg);
  el("tabAdmin").classList.toggle("active", isAdm);

  el("loginForm").classList.toggle("hidden", !isLogin);
  el("registerForm").classList.toggle("hidden", !isReg);
  el("adminForm").classList.toggle("hidden", !isAdm);

  el("loginMsg").textContent = "";
  el("regMsg").textContent = "";
  el("adminMsg").textContent = "";

  if(isAdm) adminLock();
}

el("tabLogin").addEventListener("click", ()=> setTab("login"));
el("tabRegister").addEventListener("click", ()=> setTab("register"));
el("tabAdmin").addEventListener("click", ()=> setTab("admin"));

// ======= Plataforma: Cards / Modal =======
function makeCard(v, topicTitle){
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="thumb"><span class="badge">${v.label || "Aula"}</span></div>
    <div class="meta">
      <p class="title">${v.title}</p>
      <p class="desc">${v.desc || ""}<br><span class="muted small">${topicTitle}</span></p>
    </div>
  `;
  card.addEventListener("click", ()=> openVideo(v, topicTitle));
  return card;
}

function openVideo(v, topicTitle){
  const id = v.youtubeId;
  if(!id){ alert("Vídeo sem youtubeId válido."); return; }

  el("modalTitle").textContent = v.title;
  el("modalSub").textContent = topicTitle;

  el("player").innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
      title="${(v.title||"Aula").replaceAll('"','')}"
    ></iframe>
  `;
  el("modal").classList.add("open");
}
function closeVideo(){
  el("modal").classList.remove("open");
  el("player").innerHTML = "";
}

/* ✅ NOVO: row com setas (Netflix-like) */
function scrollRow(rowEl, dir){
  const amount = Math.max(280, rowEl.clientWidth * 0.85);
  rowEl.scrollBy({ left: dir * amount, behavior: "smooth" });
}
function buildRow(topic, list){
  const section = document.createElement("section");
  section.className = "section";
  section.id = topic.key;

  section.innerHTML = `
    <div class="section-head">
      <div>
        <h3>${topic.title}</h3>
        <p>${topic.hint || ""}</p>
      </div>
    </div>
  `;

  if(!list.length){
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Nenhuma aula cadastrada neste tópico.";
    section.appendChild(empty);
    return section;
  }

  const wrap = document.createElement("div");
  wrap.className = "row-wrap";

  const left = document.createElement("button");
  left.className = "nav left btn";
  left.type = "button";
  left.textContent = "◀";

  const right = document.createElement("button");
  right.className = "nav right btn";
  right.type = "button";
  right.textContent = "▶";

  const row = document.createElement("div");
  row.className = "row";

  list.forEach(v => row.appendChild(makeCard(v, topic.title)));

  left.addEventListener("click", ()=> scrollRow(row, -1));
  right.addEventListener("click", ()=> scrollRow(row, +1));

  wrap.appendChild(left);
  wrap.appendChild(row);
  wrap.appendChild(right);

  section.appendChild(wrap);
  return section;
}

function renderPlatform(){
  const container = el("modules");
  container.innerHTML = "";
  const q = normalize(searchText);
  const vids = getVideos();

  TOPIC_META.forEach(topic => {
    const listAll = vids.filter(v => v.topic === topic.key);
    const list = listAll.filter(v => {
      const hay = normalize([v.title, v.desc, v.label, topic.title].join(" "));
      return q ? hay.includes(q) : true;
    });

    if(q && list.length === 0) return;

    container.appendChild(buildRow(topic, list));
  });
}

function updateAccessInfo(){
  const session = getObj(SESSION_KEY);
  if(!session){ el("accessInfo").textContent = "—"; return; }
  const users = getUsers();
  const u = users[session.username];
  if(!u){ el("accessInfo").textContent = "—"; return; }

  const status = isExpired(u.expiresAt) ? "VENCIDO" : "ATIVO";
  el("accessInfo").textContent = `Aluno(a): ${u.name} • Acesso: ${status} • Expira em: ${formatDateBR(u.expiresAt)}`;
}

// ======= Login / Logout =======
function goPlatform(session){
  setObj(SESSION_KEY, session);
  el("loginScreen").classList.add("hidden");
  el("platformScreen").classList.remove("hidden");
  updateAccessInfo();
  renderPlatform();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function goLogin(){
  localStorage.removeItem(SESSION_KEY);
  el("platformScreen").classList.add("hidden");
  el("loginScreen").classList.remove("hidden");
  closeVideo();
  setTab("login");
}

el("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = el("loginUser").value.trim().toLowerCase();
  const password = el("loginPass").value;

  const users = getUsers();
  const u = users[username];

  if(!u){ el("loginMsg").textContent = "Usuário não encontrado. Cadastre no modo Admin."; return; }
  if(u.password !== password){ el("loginMsg").textContent = "Senha incorreta."; return; }
  if(isExpired(u.expiresAt)){ el("loginMsg").textContent = `Acesso vencido em ${formatDateBR(u.expiresAt)}.`; return; }

  goPlatform({ username });
});

el("logoutBtn").addEventListener("click", goLogin);

el("searchInput").addEventListener("input", (e)=> {
  searchText = e.target.value;
  renderPlatform();
});

el("playFeatured").addEventListener("click", ()=> {
  const vids = getVideos();
  const featured = vids.find(v => v.featured) || vids[0];
  const topicTitle = TOPIC_META.find(t=>t.key===featured.topic)?.title || "Aula";
  openVideo(featured, topicTitle);
});

el("scrollTopics").addEventListener("click", ()=> {
  el("topicsAnchor").scrollIntoView({ behavior:"smooth" });
});

/* ✅ NOVO: scroll com offset para rodapé fixo */
function scrollToSectionWithOffset(target){
  if(!target) return;
  const fixedFooter = document.querySelector(".footer-nav");
  const footerH = fixedFooter ? fixedFooter.getBoundingClientRect().height : 0;
  const topbarH = document.querySelector(".topbar")?.getBoundingClientRect().height || 0;
  const y = target.getBoundingClientRect().top + window.scrollY - topbarH - 12;
  window.scrollTo({ top: y, behavior: "smooth" });
}

document.querySelectorAll(".fbtn").forEach(btn => {
  btn.addEventListener("click", ()=> {
    const id = btn.dataset.go;
    const target = document.getElementById(id);
    scrollToSectionWithOffset(target);
  });
});

// Modal
el("closeModal").addEventListener("click", closeVideo);
el("modal").addEventListener("click", (e)=>{ if(e.target.id==="modal") closeVideo(); });
document.addEventListener("keydown", (e)=>{ if(e.key==="Escape") closeVideo(); });

// ======= Cadastro de alunos =======
el("registerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = el("regName").value.trim();
  const username = el("regUser").value.trim().toLowerCase();
  const password = el("regPass").value;
  const plan = el("regPlan").value;

  const users = getUsers();
  if(users[username]){
    el("regMsg").textContent = "Já existe esse usuário. Escolha outro login.";
    return;
  }

  const months = planToMonths(plan);
  const now = new Date();
  const expires = addMonths(now, months);
  const planLabel = plan === "3m" ? "3 meses" : plan === "6m" ? "6 meses" : "1 ano";

  users[username] = {
    name, username, password,
    plan, planLabel,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString()
  };
  setUsers(users);

  el("regMsg").textContent = `Cadastrado! Usuário: ${username} • Expira em ${formatDateBR(expires)}.`;
  el("regName").value = ""; el("regUser").value = ""; el("regPass").value = ""; el("regPlan").value = "3m";
});

el("listUsersBtn").addEventListener("click", ()=> {
  const users = getUsers();
  const keys = Object.keys(users);
  if(!keys.length) { alert("Nenhum aluno cadastrado."); return; }
  const lines = keys.map(k => {
    const u = users[k];
    return `${u.name} | ${u.username} | expira: ${formatDateBR(u.expiresAt)} (${u.planLabel})`;
  });
  alert(lines.join("\n"));
});

el("wipeUsersBtn").addEventListener("click", ()=> {
  if(!confirm("Apagar TODOS os alunos cadastrados?")) return;
  setUsers({});
  alert("Alunos apagados.");
});

// ======= ADMIN VÍDEOS (REAL) =======
let adminUnlocked = false;

function adminLock(){
  adminUnlocked = false;
  el("adminPanel").classList.add("hidden");
  el("adminMsg").textContent = "";
  el("adminPass").value = "";
  clearVideoForm();
}

function adminUnlock(){
  adminUnlocked = true;
  el("adminPanel").classList.remove("hidden");
  el("adminMsg").textContent = "Painel liberado. Você pode adicionar/editar/apagar vídeos.";
  renderAdminList();
}

el("adminEnter").addEventListener("click", ()=> {
  const pass = el("adminPass").value;
  if(pass !== ADMIN_PASSWORD){
    el("adminMsg").textContent = "Senha do ADM incorreta.";
    adminLock();
    return;
  }
  adminUnlock();
});

el("adminExit").addEventListener("click", adminLock);

function renderAdminList(){
  const list = el("adminList");
  list.innerHTML = "";

  const vids = getVideos();
  const sorted = [...vids].sort((a,b)=>{
    if(a.topic !== b.topic) return a.topic.localeCompare(b.topic);
    return (a.title||"").localeCompare(b.title||"");
  });

  sorted.forEach(v => {
    const topicTitle = TOPIC_META.find(t=>t.key===v.topic)?.title || v.topic;

    const item = document.createElement("div");
    item.className = "admin-item";
    item.innerHTML = `
      <div class="top">
        <div>
          <div class="name">${v.title}</div>
          <div class="meta">${topicTitle} • ${v.label || "Aula"} • youtubeId: ${v.youtubeId || "-"}</div>
        </div>
        <div class="admin-actions">
          <button class="btn" type="button" data-edit="${v.id}">Editar</button>
          <button class="btn danger" type="button" data-del="${v.id}">Apagar</button>
          <button class="btn" type="button" data-feat="${v.id}">Destaque</button>
        </div>
      </div>
    `;

    item.querySelector("[data-edit]").addEventListener("click", ()=> loadVideoToForm(v.id));
    item.querySelector("[data-del]").addEventListener("click", ()=> {
      if(!confirm("Apagar este vídeo?")) return;
      const kept = getVideos().filter(x => x.id !== v.id);
      setVideos(kept);
      renderAdminList();
      renderPlatform();
    });

    // ✅ NOVO: definir destaque
    item.querySelector("[data-feat]").addEventListener("click", ()=> {
      const all = getVideos().map(x => ({ ...x, featured: x.id === v.id }));
      setVideos(all);
      el("adminMsg").textContent = `Destaque definido: ${v.title}`;
      renderAdminList();
      renderPlatform();
    });

    list.appendChild(item);
  });
}

function loadVideoToForm(id){
  const v = getVideos().find(x => x.id === id);
  if(!v) return;

  el("videoId").value = v.id;
  el("videoTopic").value = v.topic;
  el("videoLabel").value = v.label || "";
  el("videoTitle").value = v.title || "";
  el("videoDesc").value = v.desc || "";
  el("videoYT").value = v.youtubeId || "";

  el("adminMsg").textContent = "Editando: " + v.title;
}

function clearVideoForm(){
  el("videoId").value = "";
  el("videoTopic").value = "start";
  el("videoLabel").value = "";
  el("videoTitle").value = "";
  el("videoDesc").value = "";
  el("videoYT").value = "";
}

el("saveVideoBtn").addEventListener("click", ()=> {
  if(!adminUnlocked){
    el("adminMsg").textContent = "Entre no painel ADM primeiro.";
    return;
  }

  const id = el("videoId").value || uid();
  const topic = el("videoTopic").value;
  const label = el("videoLabel").value.trim();
  const title = el("videoTitle").value.trim();
  const desc = el("videoDesc").value.trim();
  const youtubeId = extractYoutubeId(el("videoYT").value);

  if(!title || !youtubeId){
    el("adminMsg").textContent = "Preencha pelo menos Título e YouTube ID.";
    return;
  }

  const vids = getVideos();
  const idx = vids.findIndex(v => v.id === id);

  const payload = { id, topic, label, title, desc, youtubeId };

  if(idx >= 0){
    vids[idx] = { ...vids[idx], ...payload };
  } else {
    vids.push(payload);
  }

  setVideos(vids);
  renderAdminList();
  renderPlatform();
  clearVideoForm();
  el("adminMsg").textContent = "Salvo com sucesso!";
});

el("clearVideoBtn").addEventListener("click", ()=> {
  clearVideoForm();
  el("adminMsg").textContent = "Formulário limpo.";
});

el("exportVideosBtn").addEventListener("click", ()=> {
  if(!adminUnlocked){ el("adminMsg").textContent = "Entre no painel ADM primeiro."; return; }
  el("videosJson").value = JSON.stringify(getVideos(), null, 2);
  el("adminMsg").textContent = "Exportado! Copie o JSON para backup.";
});

el("importVideosBtn").addEventListener("click", ()=> {
  if(!adminUnlocked){ el("adminMsg").textContent = "Entre no painel ADM primeiro."; return; }
  try{
    const txt = el("videosJson").value.trim();
    if(!txt) { el("adminMsg").textContent = "Cole o JSON no campo abaixo."; return; }
    const parsed = JSON.parse(txt);
    if(!Array.isArray(parsed)) throw new Error("JSON precisa ser uma lista (array).");
    setVideos(parsed);
    el("adminMsg").textContent = "Importado com sucesso!";
    renderAdminList();
    renderPlatform();
  }catch(err){
    el("adminMsg").textContent = "Erro ao importar: " + err.message;
  }
});

// ======= Init =======
el("year").textContent = new Date().getFullYear();
setTab("login");
adminLock();

const session = getObj(SESSION_KEY);
if(session?.username){
  const u = getUsers()[session.username];
  if(u && !isExpired(u.expiresAt)){
    goPlatform({ username: session.username });
  }
}
