const USERS_KEY = "katielle_users_prod";
const SESSION_KEY = "katielle_session_prod";

// 🔐 SENHA DO ADM (ALTERADA)
const ADMIN_PASSWORD = "150423";

// Utils
const el = id => document.getElementById(id);

function getUsers(){
  return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
}
function setUsers(u){
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}
function setSession(s){
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}
function getSession(){
  return JSON.parse(localStorage.getItem(SESSION_KEY));
}
function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}
function addMonths(date, m){
  const d = new Date(date);
  d.setMonth(d.getMonth() + m);
  return d;
}
function isExpired(dt){
  return Date.now() > new Date(dt).getTime();
}
function fmt(dt){
  const d = new Date(dt);
  return d.toLocaleDateString("pt-BR");
}

// Tabs
function switchTab(t){
  ["login","register","admin"].forEach(k=>{
    el("tab"+k.charAt(0).toUpperCase()+k.slice(1)).classList.toggle("active", t===k);
    el(k+"Form").classList.toggle("hidden", t!==k);
  });
}

// Login
el("loginForm").addEventListener("submit", e=>{
  e.preventDefault();
  const u = el("loginUser").value.toLowerCase();
  const p = el("loginPass").value;
  const users = getUsers();

  if(!users[u] || users[u].pass !== p){
    el("loginMsg").textContent = "Usuário ou senha inválidos.";
    return;
  }
  if(isExpired(users[u].exp)){
    el("loginMsg").textContent = "Acesso expirado em "+fmt(users[u].exp);
    return;
  }

  setSession({u});
  el("loginScreen").classList.add("hidden");
  el("platformScreen").classList.remove("hidden");
});

// Cadastro
el("registerForm").addEventListener("submit", e=>{
  e.preventDefault();
  const users = getUsers();
  const u = el("regUser").value.toLowerCase();
  if(users[u]){
    el("regMsg").textContent = "Usuário já existe.";
    return;
  }

  const months = el("regPlan").value==="6m"?6:el("regPlan").value==="1y"?12:3;
  users[u] = {
    name: el("regName").value,
    pass: el("regPass").value,
    exp: addMonths(new Date(), months)
  };
  setUsers(users);
  el("regMsg").textContent = "Aluno cadastrado com sucesso.";
  e.target.reset();
});

// Admin
el("adminEnter").addEventListener("click", ()=>{
  if(el("adminPass").value !== ADMIN_PASSWORD){
    el("adminMsg").textContent = "Senha incorreta.";
    return;
  }
  switchTab("register");
});

// Logout
el("logoutBtn").addEventListener("click", ()=>{
  clearSession();
  location.reload();
});

// Tabs click
el("tabLogin").onclick=()=>switchTab("login");
el("tabRegister").onclick=()=>switchTab("register");
el("tabAdmin").onclick=()=>switchTab("admin");

// Init
el("year").textContent = new Date().getFullYear();
switchTab("login");
