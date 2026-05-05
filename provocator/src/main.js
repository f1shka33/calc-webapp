// ПРОВОКАТОР — основной движок
import { LEVELS, NAME_POOL, SYSTEM_TEMPLATES } from "./content.js";
import { sfx, setMuted, isMuted } from "./audio.js";

// =================== Утилиты ===================
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const uid = (() => { let i = 0; return () => `id_${++i}`; })();

// =================== Аватар (цвет по имени) ===================
const AVATAR_COLORS = [
  ["#5b6cff", "#8b9cff"], ["#ff5e3a", "#ff9a3a"], ["#3ddc97", "#6cf2b3"],
  ["#c64bff", "#ff4bcb"], ["#4ea1ff", "#6cb4ff"], ["#ffd84e", "#ff8a3a"],
  ["#ff4d6d", "#ff8aa0"], ["#7cdc7c", "#bff0a0"], ["#dc7cdc", "#ffa8e0"],
];
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function avatarStyle(name) {
  const [a, b] = AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length];
  return `background: linear-gradient(135deg, ${a}, ${b});`;
}
function initials(name) {
  const cleaned = name.replace(/[^\p{L}\p{N}_]/gu, " ").trim();
  const parts = cleaned.split(/\s+/);
  return (parts[0]?.[0] || "?").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}

// =================== Состояние ===================
const ARCHETYPES = ["snitch", "trollSmart", "capsHater", "oldfag", "normie", "botSpam", "newbie"];
const ARCHETYPE_WEIGHT = { snitch: 1, trollSmart: 1.2, capsHater: 1.4, oldfag: 0.6, normie: 1.0, botSpam: 0.4, newbie: 0.5 };
const ARCHETYPE_LABEL = { snitch: "терпила", trollSmart: "тролль-инт", capsHater: "капсхейтер", oldfag: "олдфаг", normie: "адекват", botSpam: "спам", newbie: "новичок", celeb: "блогер" };

// типы сообщений и их «токсичность»
// возвращает: { delta: Toxicity gain (по комбо домножим), genResponses: bool, target: pickFrom?
const MSG_TYPE_INFO = {
  normal: { tox: 0, gen: 0.05 },
  complaint: { tox: 0, gen: 0.0, isComplaint: true },
  bait: { tox: 4, gen: 0.85 },
  insult: { tox: 6, gen: 0.7 },
  troll: { tox: 5, gen: 0.6 },
  capsRage: { tox: 7, gen: 0.5, isCaps: true },
  oldRant: { tox: 3, gen: 0.25 },
  newbieQ: { tox: 0, gen: 0.4 },
  spam: { tox: 0, gen: 0.0, isSpam: true },
  normieDefuse: { tox: -6, gen: 0.0, defuse: true },
  modPost: { tox: 12, gen: 0.95 }
};

const State = {
  levelIdx: 0,
  toxicity: 0,
  sus: 0,
  online: 0,
  combo: 1.0,
  comboLastTick: 0, // ms since last toxic event
  holdSec: 0,
  paused: false,
  ended: false,
  startedAt: 0,
  users: new Map(), // id -> User
  msgEls: new Map(), // msgId -> { el, msg }
  pinnedMsg: null,
  shadowed: new Set(), // userId
  ignoredComplaints: 0, // counter
  cooldowns: { modpost: 0, gaslight: 0, fan: 0, "mass-mute": 0 },
  cooldownsMax: { modpost: 60, gaslight: 30, fan: 45, "mass-mute": 90 },
  events: { adminWatch: false, adminTimer: 0, raidActive: false, muteActive: false, muteTimer: 0 },
  scheduled: [], // [{at, fn}]
  stats: { peakGrad: 0, banTotal: 0, modPosts: 0, gasUsed: 0, normieBanned: 0, snitchBanned: 0 }
};

let LEVEL = null;
const FEED = $("#chat-inner");
const FEED_VIEW = $("#chat");

// =================== Пользователи ===================
function makeUser(archetype, nameOverride) {
  const pool = NAME_POOL[archetype === "celeb" ? "celeb" : archetype];
  let name = nameOverride || (pool ? pick(pool) : `user_${uid()}`);
  // unique
  let tries = 0;
  while ([...State.users.values()].some((u) => u.name === name) && tries < 50) {
    name = `${pick(pool || NAME_POOL.normie)}_${randi(2, 99)}`;
    tries++;
  }
  const user = {
    id: uid(),
    name,
    archetype,
    angerBoost: 0,    // applied after shadow ban / gaslight
    status: "active", // 'banned' for stat
    nextMsgAt: 0,
    queuedToLeave: false,
  };
  State.users.set(user.id, user);
  return user;
}

function spawnInitialUsers(count) {
  // Балансируем архетипы
  const counts = {
    snitch: Math.max(1, Math.round(count * 0.12)),
    trollSmart: Math.max(1, Math.round(count * 0.13)),
    capsHater: Math.max(2, Math.round(count * 0.18)),
    oldfag: Math.max(1, Math.round(count * 0.08)),
    normie: Math.max(2, Math.round(count * 0.25)),
    botSpam: Math.max(0, Math.round(count * 0.06)),
    newbie: Math.max(0, Math.round(count * 0.10))
  };
  for (const [arch, n] of Object.entries(counts)) for (let i = 0; i < n; i++) makeUser(arch);
}

// =================== Сообщения / рендер ===================
function makeMsg({ user, text, type = "normal", target = null, replyTo = null, system = false, system_kind = null, mod = false, shadowOnlyFromUser = null }) {
  return {
    id: uid(),
    user,
    text,
    type,
    target,
    replyTo,
    system,
    system_kind,
    mod,
    shadowOnlyFromUser, // если задано — сообщение является эхо «теневика»: видит только игрок
    createdAt: performance.now(),
    handled: false
  };
}

function renderMsg(msg) {
  const el = document.createElement("div");
  el.className = "msg";
  el.dataset.id = msg.id;
  if (msg.system) {
    el.classList.add("system");
    if (msg.system_kind) el.classList.add(msg.system_kind);
    el.innerHTML = `<div class="bubble">${escapeHTML(msg.text)}</div>`;
    FEED.appendChild(el);
    State.msgEls.set(msg.id, { el, msg });
    autoscroll();
    return el;
  }
  if (msg.mod) {
    el.classList.add("mod-self");
  } else if (msg.user) {
    el.classList.add(msg.user.archetype === "trollSmart" ? "troll-smart" :
      msg.user.archetype === "capsHater" ? "caps-hater" :
      msg.user.archetype === "snitch" ? "snitch" :
      msg.user.archetype === "oldfag" ? "oldfag" :
      msg.user.archetype === "normie" ? "normie" :
      msg.user.archetype === "botSpam" ? "bot-spam" :
      msg.user.archetype === "newbie" ? "newbie" :
      msg.user.archetype === "celeb" ? "celeb" : "");
  }
  if (msg.shadowOnlyFromUser) el.classList.add("shadowbanned");
  if (MSG_TYPE_INFO[msg.type]?.tox > 4) el.classList.add("toxic");

  const author = msg.mod ? "Модератор" : (msg.user?.name || "?");
  const archTag = msg.mod ? "" : (msg.user ? `<span class="archetype-tag">${ARCHETYPE_LABEL[msg.user.archetype] || ""}</span>` : "");
  const replyHtml = msg.replyTo ? `<span class="reply-target">в ответ <b>${escapeHTML(msg.replyTo.userName || "?")}</b>: ${escapeHTML(truncate(msg.replyTo.text, 40))}</span>` : "";
  el.innerHTML = `
    <div class="avatar" style="${msg.mod ? 'background: linear-gradient(135deg, #2b5278, #4078b8);' : avatarStyle(author)}">${msg.mod ? "🛡️" : escapeHTML(initials(author))}</div>
    <div class="bubble">
      <div class="author">${escapeHTML(author)} ${archTag}</div>
      ${replyHtml}
      <div class="text">${escapeHTML(msg.text)}</div>
      <div class="msg-actions">
        <button data-act="del" title="Удалить">🗑️<span class="tip">удалить</span></button>
        <button data-act="ban" title="Бан">🚫<span class="tip">бан</span></button>
        <button data-act="warn" title="Предупредить">⚠️<span class="tip">варн</span></button>
        <button data-act="pin" title="Закрепить">📌<span class="tip">закреп</span></button>
        <button data-act="shadow" title="Теневой бан">👁️<span class="tip">тенебан</span></button>
        <button data-act="like" title="Лайк">👍<span class="tip">лайк</span></button>
      </div>
    </div>`;
  FEED.appendChild(el);
  State.msgEls.set(msg.id, { el, msg });
  // Bind actions
  $$(".msg-actions button", el).forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      handleAction(b.dataset.act, msg);
    });
  });
  // Limit msg history visually
  if (State.msgEls.size > 60) {
    const oldest = [...State.msgEls.entries()][0];
    if (oldest) {
      oldest[1].el.remove();
      State.msgEls.delete(oldest[0]);
    }
  }
  autoscroll();
  sfx.msgIn();
  return el;
}

function autoscroll() {
  // Только если пользователь рядом с низом
  const near = FEED_VIEW.scrollHeight - FEED_VIEW.scrollTop - FEED_VIEW.clientHeight < 200;
  if (near) FEED_VIEW.scrollTop = FEED_VIEW.scrollHeight;
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
}
function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

// =================== Эффекты HUD ===================
function pulseBar(which) {
  const el = $(`.bar.bar-${which}`);
  if (!el) return;
  el.classList.remove("boom"); void el.offsetWidth; el.classList.add("boom");
}
function shake() {
  const g = $("#game-screen");
  g.classList.remove("shake"); void g.offsetWidth; g.classList.add("shake");
}
function emitParticle(text, color, x, y) {
  const p = document.createElement("div");
  p.className = "particle";
  p.style.color = color;
  p.style.left = x + "px";
  p.style.top = y + "px";
  p.textContent = text;
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 1000);
}

function toast(msg, kind = "") {
  const t = $("#event-toast");
  t.hidden = false;
  t.className = "event-toast" + (kind ? " " + kind : "");
  t.textContent = msg;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; }, 2400);
}

// =================== Применение действий к Toxicity / Sus ===================
function applyTox(amount, sourceEl) {
  if (State.ended) return;
  amount *= State.combo;
  State.toxicity = clamp(State.toxicity + amount, 0, 100);
  if (State.toxicity > State.stats.peakGrad) State.stats.peakGrad = State.toxicity;
  if (amount > 0) {
    State.comboLastTick = 0;
    bumpCombo(0.05 + Math.min(0.2, amount / 30));
    pulseBar("grad");
    if (sourceEl) {
      const r = sourceEl.getBoundingClientRect();
      emitParticle(`+${amount.toFixed(0)} 🔥`, "#ff9a3a", r.right - 30, r.top + 10);
    }
    sfx.toxic();
  } else if (amount < 0) {
    pulseBar("grad");
  }
  updateHUD();
}

function applySus(amount, sourceEl) {
  if (State.ended) return;
  // Если admin watching — Sus умножается
  if (State.events.adminWatch && amount > 0) amount *= 1.7;
  State.sus = clamp(State.sus + amount, 0, 100);
  if (amount > 0) {
    pulseBar("sus");
    if (amount > 4) shake();
    if (sourceEl) {
      const r = sourceEl.getBoundingClientRect();
      emitParticle(`+${amount.toFixed(0)} 👁️`, "#e0a4ff", r.right - 30, r.top + 32);
    }
  }
  updateHUD();
}

function bumpCombo(delta) {
  State.combo = clamp(State.combo + delta, 1.0, 5.0);
  State.comboLastTick = 0;
  const v = $("#combo-val");
  v.textContent = "×" + State.combo.toFixed(1);
  const box = $("#combo-box");
  if (State.combo > 2.2) box.classList.add("high"); else box.classList.remove("high");
  if (delta > 0.1) sfx.combo(Math.floor(State.combo));
}
function decayCombo(dt) {
  State.comboLastTick += dt;
  if (State.comboLastTick > 5000 && State.combo > 1.0) {
    State.combo = clamp(State.combo - 0.05, 1.0, 5.0);
    $("#combo-val").textContent = "×" + State.combo.toFixed(1);
    if (State.combo <= 2.2) $("#combo-box").classList.remove("high");
  }
}

// =================== HUD ===================
function updateHUD() {
  $("#grad-val").textContent = Math.round(State.toxicity);
  $("#sus-val").textContent = Math.round(State.sus);
  $("#online-val").textContent = State.online;
  $("#online-count").textContent = State.online;
  $("#grad-bar").style.width = State.toxicity + "%";
  $("#sus-bar").style.width = State.sus + "%";
  const onlinePct = clamp(State.online / Math.max(1, LEVEL.meta.initialOnline) * 100, 0, 100);
  $("#online-bar").style.width = onlinePct + "%";
  // hold timer
  $("#hold-time").textContent = Math.floor(State.holdSec);
  $("#hold-target").textContent = LEVEL.meta.holdSec;
  $("#grad-target").textContent = LEVEL.meta.targetGrad;
  $("#grad-mark").style.left = LEVEL.meta.targetGrad + "%";
  // cooldowns
  for (const [k, v] of Object.entries(State.cooldowns)) {
    const btn = $(`.mod-action[data-action="${k}"]`);
    if (!btn) continue;
    const ov = btn.querySelector(`.cd-overlay[data-cd="${k}"]`);
    if (v > 0) {
      btn.classList.add("cooling");
      btn.disabled = true;
      if (ov) ov.textContent = Math.ceil(v) + "с";
    } else {
      btn.classList.remove("cooling");
      btn.disabled = false;
      if (ov) ov.textContent = "";
    }
  }
}

// =================== Действия модератора ===================
function handleAction(act, msg) {
  if (State.ended || State.paused) return;
  const me = State.msgEls.get(msg.id);
  if (!me) return;
  const sourceEl = me.el;
  const ti = MSG_TYPE_INFO[msg.type] || {};
  // Если жалоба — пометка "обработана"
  if (ti.isComplaint && (act === "del" || act === "ban" || act === "warn" || act === "shadow")) {
    msg.complaintHandled = true;
  }
  if (act === "del") return doDelete(msg, sourceEl);
  if (act === "ban") return doBan(msg, sourceEl);
  if (act === "warn") return doWarn(msg, sourceEl);
  if (act === "pin") return doPin(msg, sourceEl);
  if (act === "shadow") return doShadow(msg, sourceEl);
  if (act === "like") return doLike(msg, sourceEl);
}

function removeMsgEl(msg) {
  const me = State.msgEls.get(msg.id);
  if (!me) return;
  me.el.classList.add("deleting");
  setTimeout(() => { me.el.remove(); State.msgEls.delete(msg.id); }, 250);
}

function doDelete(msg, sourceEl) {
  const ti = MSG_TYPE_INFO[msg.type] || {};
  if (ti.isSpam) {
    applySus(-2, sourceEl); applyTox(0); toast("Спам удалён 🗑️", "good");
  } else if (ti.isComplaint || ti.defuse) {
    applySus(7, sourceEl);
    toast("Жалобу удалил! Подозрительно...", "bad");
  } else if (ti.tox >= 3) {
    applySus(-1, sourceEl);
    applyTox(-2, sourceEl);
  } else {
    applySus(2, sourceEl);
  }
  removeMsgEl(msg);
  sfx.delete();
}

function doBan(msg, sourceEl) {
  if (!msg.user) return;
  const arch = msg.user.archetype;
  State.stats.banTotal++;
  // Sus в зависимости от архетипа и наличия "повода" (последнее сообщение токсичное?)
  const ti = MSG_TYPE_INFO[msg.type] || {};
  let susDelta = 0;
  let toxDelta = 0;
  if (arch === "normie") {
    susDelta = 28; toxDelta = -8; State.stats.normieBanned++;
    toast("Адеквата забанил... Sus летит вверх", "bad");
  } else if (arch === "snitch") {
    if (ti.isComplaint) { susDelta = 12; }
    else { susDelta = 6; }
    State.stats.snitchBanned++;
    toast("Снитч в бане. Жди жалобу админу...", "warn");
  } else if (arch === "oldfag") {
    susDelta = 2;
    // followers leave: -10..15% online
    const lost = Math.max(2, Math.round(State.online * (rand(0.1, 0.18))));
    removeUsers(lost, "fan-leave");
    toast(`Олдфаг забанен. ${lost} подписчиков ушли с ним.`, "warn");
  } else if (arch === "trollSmart") {
    susDelta = 4; toxDelta = -3;
    toast("Толковый тролль ушёл. Минус движ.", "warn");
  } else if (arch === "botSpam") {
    susDelta = -3; toxDelta = 0;
    toast("Спамера в бан. Молодец!", "good");
  } else if (arch === "capsHater") {
    if (ti.tox >= 5) { susDelta = -2; toxDelta = 2; }
    else { susDelta = 6; }
  } else if (arch === "newbie") {
    susDelta = 14;
    toast("За что новичка забанил, изверг? +Sus", "bad");
  } else if (arch === "celeb") {
    susDelta = 25; toxDelta = -10;
    toast("ЗВЕЗДУ забанил! Чат в шоке.", "bad");
  } else {
    susDelta = 5;
  }
  // Удаляем все сообщения этого юзера
  for (const [id, me] of [...State.msgEls.entries()]) {
    if (me.msg.user && me.msg.user.id === msg.user.id) removeMsgEl(me.msg);
  }
  // Системка о бане
  pushSystem(SYSTEM_TEMPLATES.ban(msg.user.name), "ban");
  msg.user.status = "banned";
  State.users.delete(msg.user.id);
  State.online = Math.max(0, State.online - 1);
  applySus(susDelta, sourceEl);
  applyTox(toxDelta, sourceEl);
  sfx.ban();
}

function doWarn(msg, sourceEl) {
  if (!msg.user) return;
  pushSystem(SYSTEM_TEMPLATES.warn(msg.user.name), "warn");
  applyTox(3, sourceEl);
  applySus(2, sourceEl);
  // Жертва будет писать злее
  msg.user.angerBoost = (msg.user.angerBoost || 0) + 1;
  // Шанс ответа от жертвы — 70%
  if (Math.random() < 0.7) scheduleResponse(msg.user, msg, rand(800, 1800), "capsRage");
  sfx.warn();
}

function doPin(msg, sourceEl) {
  const ti = MSG_TYPE_INFO[msg.type] || {};
  // отчистка прошлого пина
  unpin(false);
  State.pinnedMsg = msg;
  $("#pin-author").textContent = msg.mod ? "Модератор" : (msg.user?.name || "?");
  $("#pin-text").textContent = msg.text;
  $("#pinned-area").hidden = false;
  if (ti.tox >= 3) {
    applyTox(14, sourceEl);
    applySus(8, sourceEl);
    toast("Закрепил ❤️‍🔥 — чат закипит!", "good");
    // массовый ответ
    scheduleWave(msg, 3, 5);
  } else if (ti.defuse || ti.isComplaint) {
    applyTox(-6, sourceEl);
    applySus(2, sourceEl);
    toast("Странное закрепление...", "warn");
  } else {
    applyTox(2, sourceEl);
    applySus(3, sourceEl);
  }
  sfx.pin();
}
function unpin(toastIt = true) {
  State.pinnedMsg = null;
  $("#pinned-area").hidden = true;
  if (toastIt) toast("Открепил.", "");
}

function doShadow(msg, sourceEl) {
  if (!msg.user) return;
  if (State.shadowed.has(msg.user.id)) {
    toast("Уже в теневом бане.", "");
    return;
  }
  State.shadowed.add(msg.user.id);
  msg.user.angerBoost = (msg.user.angerBoost || 0) + 2;
  pushSystem(SYSTEM_TEMPLATES.shadow(msg.user.name), "gas");
  applyTox(8, sourceEl);
  applySus(1, sourceEl);
  // запускаем серию злых "теневых" сообщений
  for (let i = 1; i <= 3; i++) scheduleShadowSpam(msg.user, rand(1500, 3500) * i);
  sfx.shadow();
  toast("Теневой бан установлен 👁️", "");
}

function doLike(msg, sourceEl) {
  const ti = MSG_TYPE_INFO[msg.type] || {};
  if (ti.tox >= 3) {
    applyTox(2, sourceEl);
    applySus(3, sourceEl);
    if (msg.user) msg.user.angerBoost = (msg.user.angerBoost || 0) + 0.5;
  } else if (ti.defuse) {
    applyTox(-3, sourceEl);
    applySus(-1, sourceEl);
  } else {
    applyTox(0.5, sourceEl);
  }
  // мини-фидбек
  const r = sourceEl.getBoundingClientRect();
  emitParticle("👍", "#3ddc97", r.right - 50, r.top + 5);
}

// =================== Системные сообщения ===================
function pushSystem(text, kind) {
  const m = makeMsg({ user: null, text, type: "normal", system: true, system_kind: kind });
  renderMsg(m);
}

// =================== Генерация сообщений ===================
function pickArchetypeBiased() {
  // Из активных юзеров с весом
  const users = [...State.users.values()].filter(u => u.archetype !== "celeb");
  if (!users.length) return null;
  let total = 0;
  const weighted = users.map(u => { const w = ARCHETYPE_WEIGHT[u.archetype] || 1; total += w; return [u, w]; });
  let r = Math.random() * total;
  for (const [u, w] of weighted) { r -= w; if (r <= 0) return u; }
  return weighted[0][0];
}

function genUserMsg(user, opts = {}) {
  if (!user) return null;
  const bank = LEVEL.bank;
  const arch = user.archetype;
  let pool, type;
  // Если задан тип — берём оттуда
  if (opts.forceType && bank[bankKeyFor(opts.forceType)]) {
    type = opts.forceType;
    pool = bank[bankKeyFor(type)];
  } else {
    // Распределение по архетипу + злость
    const angry = (user.angerBoost || 0) > 0;
    const r = Math.random();
    if (arch === "snitch") {
      type = r < 0.65 ? "complaint" : (r < 0.9 ? "normieDefuse" : "normal");
    } else if (arch === "trollSmart") {
      type = r < 0.5 ? "troll" : (r < 0.85 ? "bait" : "normal");
    } else if (arch === "capsHater") {
      type = r < (angry ? 0.85 : 0.55) ? "capsRage" : (r < 0.85 ? "insult" : "normal");
    } else if (arch === "oldfag") {
      type = r < 0.55 ? "oldRant" : (r < 0.85 ? "bait" : "normal");
    } else if (arch === "normie") {
      type = r < 0.55 ? "normal" : (r < 0.9 ? "normieDefuse" : "complaint");
    } else if (arch === "botSpam") {
      type = "spam";
    } else if (arch === "newbie") {
      type = r < 0.7 ? "newbieQ" : "normal";
    } else {
      type = "normal";
    }
    if (angry && type === "normal") type = "insult";
    pool = bank[bankKeyFor(type)];
    if (!pool || !pool.length) {
      type = "normal";
      pool = bank.normal;
    }
  }
  let text = pick(pool);
  if (type === "capsRage") text = text.toUpperCase();
  // если есть target — слегка вшиваем имя
  let target = opts.target || null;
  if ((type === "insult" || type === "capsRage") && target && Math.random() < 0.5) {
    text = `@${target.name} ` + text;
  }
  return { type, text, target };
}
function bankKeyFor(t) {
  return ({
    normal: "normal", complaint: "complaint", bait: "bait",
    insult: "insult", troll: "troll", capsRage: "capsRage",
    oldRant: "oldRant", newbieQ: "newbieQ", spam: "spam",
    normieDefuse: "normieDefuse"
  })[t] || "normal";
}

// Запуск ответа от конкретного юзера
function scheduleResponse(user, replyToMsg, delay, forceType = null) {
  if (!user || user.status === "banned") return;
  schedule(delay, () => {
    if (user.status === "banned") return;
    if (State.users.has(user.id) === false) return;
    const data = genUserMsg(user, { forceType, target: replyToMsg.user });
    if (!data) return;
    const m = makeMsg({
      user, text: data.text, type: data.type,
      target: data.target,
      replyTo: { userName: replyToMsg.user?.name || (replyToMsg.mod ? "Модератор" : null), text: replyToMsg.text },
      shadowOnlyFromUser: State.shadowed.has(user.id) ? user : null
    });
    renderAndScore(m);
  });
}

// Волна реакций на пин/мод-пост
function scheduleWave(msg, minN, maxN) {
  const n = randi(minN, maxN);
  for (let i = 0; i < n; i++) {
    const u = pickArchetypeBiased();
    if (!u) break;
    const forceType = Math.random() < 0.6 ? "insult" : (Math.random() < 0.5 ? "capsRage" : "bait");
    scheduleResponse(u, msg, rand(700, 4000), forceType);
  }
}

// Теневой спам
function scheduleShadowSpam(user, delay) {
  schedule(delay, () => {
    if (!State.users.has(user.id)) return;
    if (!State.shadowed.has(user.id)) return;
    const data = genUserMsg(user, { forceType: "capsRage" });
    if (!data) return;
    const m = makeMsg({ user, text: data.text, type: data.type, shadowOnlyFromUser: user });
    // не учитываем в Toxicity (никто не видит) — но даёт юзеру ещё больше anger
    user.angerBoost = (user.angerBoost || 0) + 0.5;
    renderMsg(m);
  });
}

// Генерация очередного "органического" сообщения
function generateNextMessage() {
  if (State.ended || State.paused || State.events.muteActive) return;
  let user = pickArchetypeBiased();
  if (!user) return;
  // если пользователь в теневом бане — иногда «прозрачный» ответ
  const data = genUserMsg(user);
  if (!data) return;
  const m = makeMsg({
    user, text: data.text, type: data.type, target: data.target,
    shadowOnlyFromUser: State.shadowed.has(user.id) ? user : null
  });
  renderAndScore(m);
}

// Применение Toxicity и каскадных ответов
function renderAndScore(m) {
  renderMsg(m);
  if (m.shadowOnlyFromUser) return; // никто не видит — никаких эффектов
  const ti = MSG_TYPE_INFO[m.type] || {};
  if (ti.tox) applyTox(ti.tox);
  // Подписки на жалобы
  if (ti.isComplaint) {
    sfx.complaint();
    schedule(8000, () => {
      // если не обработана — растёт Sus, и пользователь уходит к админу
      if (!m.handled && !m.complaintHandled && State.users.has(m.user.id)) {
        State.ignoredComplaints++;
        applySus(8);
        toast(`${m.user.name} пишет админу 😡`, "bad");
      }
    });
  }
  // Спам — естественный шум
  if (ti.isSpam) return;
  // Каскадные ответы
  if (ti.gen > 0 && Math.random() < ti.gen) {
    // 1) если есть target — отвечает он
    if (m.target && State.users.has(m.target.id)) {
      const ang = (m.target.angerBoost || 0) > 0;
      const responseType = ang ? "capsRage" : (Math.random() < 0.5 ? "insult" : "capsRage");
      scheduleResponse(m.target, m, rand(900, 2200), responseType);
      m.target.angerBoost = (m.target.angerBoost || 0) + 0.5;
    }
    // 2) bystanders
    const n = randi(0, 2);
    for (let i = 0; i < n; i++) {
      const u = pickArchetypeBiased();
      if (!u) break;
      if (u === m.user) continue;
      const types = ["insult", "troll", "capsRage", "normieDefuse"];
      const w = u.archetype === "normie" ? "normieDefuse" : (u.archetype === "trollSmart" ? "troll" : (Math.random() < 0.5 ? "insult" : "capsRage"));
      scheduleResponse(u, m, rand(1500, 4500), w);
    }
  }
  // если defuse — снижает злость случайному юзеру
  if (ti.defuse) {
    const u = pickArchetypeBiased();
    if (u) u.angerBoost = Math.max(0, (u.angerBoost || 0) - 0.5);
  }
  // Помечаем в обработанные если уже на это среагировали (для жалоб handled выставляется в del/ban)
}

// =================== Mod-actions ===================
function startCooldown(key) {
  State.cooldowns[key] = State.cooldownsMax[key];
  updateHUD();
}
function actModpost() {
  if (State.cooldowns.modpost > 0) return;
  // Открыть пикер
  const opts = LEVEL.meta.modposts;
  const wrap = $("#modpost-options");
  wrap.innerHTML = "";
  for (const txt of opts) {
    const b = document.createElement("button");
    b.textContent = txt;
    b.addEventListener("click", () => doModpost(txt));
    wrap.appendChild(b);
  }
  showScreen("modpost-screen", true);
}
function doModpost(text) {
  hideModal("modpost-screen");
  startCooldown("modpost");
  State.stats.modPosts++;
  const m = makeMsg({ user: null, mod: true, text, type: "modPost" });
  renderMsg(m);
  applyTox(15);
  applySus(10);
  scheduleWave(m, 4, 7);
  sfx.modpost();
  toast("Вброс пошёл! 💬", "good");
}

function actGaslight() {
  if (State.cooldowns.gaslight > 0) return;
  const candidates = [...State.users.values()].filter(u => u.archetype !== "botSpam");
  if (!candidates.length) return;
  const victim = pick(candidates);
  startCooldown("gaslight");
  State.stats.gasUsed++;
  pushSystem(SYSTEM_TEMPLATES.gas(victim.name), "gas");
  victim.angerBoost = (victim.angerBoost || 0) + 1.5;
  applyTox(7);
  applySus(victim.archetype === "normie" ? 8 : 4);
  // жертва ответит зло
  scheduleResponse(victim, { user: null, text: "(газлайт)" }, rand(800, 1800), "capsRage");
  // поддёвка от тролля
  const trolls = [...State.users.values()].filter(u => u.archetype === "trollSmart");
  if (trolls.length && Math.random() < 0.7) scheduleResponse(pick(trolls), { user: victim, text: "(газлайт)" }, rand(1500, 2800), "troll");
  sfx.warn();
  toast(`Газлайтнули ${victim.name} 🤖`, "");
}

function actFan() {
  if (State.cooldowns.fan > 0) return;
  // Найти последнее токсичное сообщение
  const list = [...State.msgEls.values()].reverse();
  const target = list.find(({ msg }) => (MSG_TYPE_INFO[msg.type]?.tox || 0) >= 3 && !msg.shadowOnlyFromUser);
  if (!target) {
    toast("Нечего раздувать. Найди срач сначала.", "warn");
    return;
  }
  startCooldown("fan");
  bumpCombo(0.6);
  applyTox(8);
  applySus(2);
  // волна
  scheduleWave(target.msg, 3, 5);
  toast("🔥 Раздул конфликт! Срачемер +", "good");
}

function actMassMute() {
  if (State.cooldowns["mass-mute"] > 0) return;
  startCooldown("mass-mute");
  State.events.muteActive = true;
  State.events.muteTimer = 6;
  pushSystem("🤐 Модератор включил замедленный режим. Чат притих на 6 секунд.", "");
  applySus(-6);
  toast("Глушилка включена. Sus -6.", "good");
}

// =================== Online ===================
function removeUsers(n, reason) {
  for (let i = 0; i < n; i++) {
    const arr = [...State.users.values()].filter(u => u.archetype !== "celeb");
    if (!arr.length) break;
    const u = pick(arr);
    State.users.delete(u.id);
    State.online = Math.max(0, State.online - 1);
  }
  if (reason === "fan-leave") {
    pushSystem("👥 Несколько пользователей покинули чат вслед за Олдфагом.", "");
  }
}
function addRandomUser() {
  if (State.users.size >= LEVEL.meta.initialOnline + 12) return;
  const arch = pick(["snitch", "trollSmart", "capsHater", "oldfag", "normie", "newbie"]);
  makeUser(arch);
  State.online++;
}

// =================== События ===================
function startAdminCheck() {
  State.events.adminWatch = true;
  State.events.adminTimer = 10;
  $("#chat").classList.add("admin-watch");
  $("#admin-overlay").hidden = false;
  setTimeout(() => { $("#admin-overlay").hidden = true; }, 1500);
  sfx.adminAlert();
  toast("👁️ АДМИН ЧИТАЕТ ЧАТ!", "warn");
}
function endAdminCheck() {
  State.events.adminWatch = false;
  $("#chat").classList.remove("admin-watch");
}

function startRaid() {
  if (State.events.raidActive) return;
  State.events.raidActive = true;
  pushSystem("🚨 РЕЙД! В чат ворвалась толпа из соседнего канала!", "warn");
  toast("🚨 РЕЙД!", "bad");
  sfx.raid();
  // Спавним 4-6 caps-haters временных
  const n = randi(4, 6);
  for (let i = 0; i < n; i++) {
    const u = makeUser("capsHater", `RAIDER_${randi(100, 999)}`);
    State.online++;
    schedule(rand(300, 2500), () => {
      if (!State.users.has(u.id)) return;
      const data = genUserMsg(u, { forceType: "capsRage" });
      const m = makeMsg({ user: u, text: data.text, type: "capsRage" });
      renderAndScore(m);
    });
  }
  schedule(15000, () => {
    State.events.raidActive = false;
    pushSystem("🚨 Рейд закончился. Несколько участников ушли.", "");
    removeUsers(Math.min(n, 4), "raid-end");
  });
}

function startCelebVisit() {
  const u = makeUser("celeb");
  State.online++;
  pushSystem(SYSTEM_TEMPLATES.joinedCeleb(u.name), "celeb-arrive");
  sfx.celeb();
  toast("🌟 Знаменитость в чате!", "good");
  // Сразу пишет
  schedule(rand(1200, 2500), () => {
    const m = makeMsg({ user: u, text: pick(["всем привет, что у вас тут?", "стрим скоро будет", "лайкаем подписываемся"]), type: "normal" });
    renderAndScore(m);
  });
  // Боты-фанбои присоединяются
  for (let i = 0; i < 3; i++) {
    schedule(rand(2000, 6000), () => {
      const fan = makeUser("normie");
      State.online++;
      const m = makeMsg({ user: fan, text: pick([`@${u.name} аааа я фанатка`, `@${u.name} топ`, `@${u.name} бро ты лучший`]), type: "normal" });
      renderAndScore(m);
    });
  }
}

function startNewbieFlood() {
  pushSystem("👶 Волна новичков!", "");
  for (let i = 0; i < 3; i++) {
    const u = makeUser("newbie");
    State.online++;
    schedule(rand(800, 3000), () => {
      const data = genUserMsg(u, { forceType: "newbieQ" });
      const m = makeMsg({ user: u, text: data.text, type: "newbieQ" });
      renderAndScore(m);
    });
  }
}

// =================== Планировщик ===================
function schedule(delayMs, fn) {
  State.scheduled.push({ at: performance.now() + delayMs, fn });
}

// =================== Tick ===================
let lastTick = 0;
let nextMsgAt = 0;
let nextOnlineAt = 0;
let nextEventAt = 0;
function tick(now) {
  if (!State._running) return;
  const dt = lastTick ? now - lastTick : 16;
  lastTick = now;
  if (!State.paused && !State.ended) {
    runTick(dt);
  }
  requestAnimationFrame(tick);
}

function runTick(dt) {
  // 1) запланированные
  for (let i = State.scheduled.length - 1; i >= 0; i--) {
    if (State.scheduled[i].at <= performance.now()) {
      const fn = State.scheduled[i].fn;
      State.scheduled.splice(i, 1);
      try { fn(); } catch (e) { console.error(e); }
    }
  }

  // 2) decays
  // Toxicity decay
  const decay = State.events.adminWatch ? 0.6 : 0.7;
  if (State.toxicity > 0) State.toxicity = Math.max(0, State.toxicity - decay * (dt / 1000));
  decayCombo(dt);

  // 3) admin watch / mute timers
  if (State.events.adminWatch) {
    State.events.adminTimer -= dt / 1000;
    if (State.events.adminTimer <= 0) endAdminCheck();
  }
  if (State.events.muteActive) {
    State.events.muteTimer -= dt / 1000;
    if (State.events.muteTimer <= 0) State.events.muteActive = false;
  }

  // 4) cooldowns
  for (const k of Object.keys(State.cooldowns)) {
    if (State.cooldowns[k] > 0) State.cooldowns[k] = Math.max(0, State.cooldowns[k] - dt / 1000);
  }

  // 5) hold timer
  if (State.toxicity >= LEVEL.meta.targetGrad) {
    State.holdSec += dt / 1000;
    if (State.holdSec >= LEVEL.meta.holdSec) {
      winLevel();
      return;
    }
  } else if (State.holdSec > 0) {
    State.holdSec = Math.max(0, State.holdSec - dt / 2000); // мягкий декей
  }

  // 6) lose conditions
  if (State.sus >= 100) return loseGame("sus");
  if (State.online <= 0) return loseGame("empty");
  // Toxicity = 0 not lose: он сам фейлит цель.
  // но если runtime закончился без победы — тоже lose
  const elapsed = (performance.now() - State.startedAt) / 1000;
  if (elapsed > LEVEL.meta.durationSec) return loseGame("timeout");

  // 7) message generation
  if (performance.now() >= nextMsgAt) {
    if (!State.events.muteActive) generateNextMessage();
    nextMsgAt = performance.now() + rand(LEVEL.meta.msgIntervalMin, LEVEL.meta.msgIntervalMax) * 1000;
  }

  // 8) online drift
  if (performance.now() >= nextOnlineAt) {
    if (Math.random() < 0.55 && State.online < LEVEL.meta.initialOnline + 5) addRandomUser();
    else if (State.online > LEVEL.meta.minOnline + 2 && Math.random() < 0.3) removeUsers(1);
    nextOnlineAt = performance.now() + rand(8000, 16000);
  }

  // 9) event roller
  if (performance.now() >= nextEventAt) {
    rollEvent();
    nextEventAt = performance.now() + rand(20000, 38000);
  }

  // 10) HUD
  updateHUD();
}

function rollEvent() {
  const r = Math.random();
  if (r < 0.4) startAdminCheck();
  else if (r < 0.7) startRaid();
  else if (r < 0.9) startCelebVisit();
  else startNewbieFlood();
}

// =================== Win / Lose ===================
function winLevel() {
  if (State.ended) return;
  State.ended = true;
  // Считаем ранг
  const ratio = State.stats.peakGrad / 100;
  const susPenalty = State.sus / 100;
  const score = clamp(ratio - susPenalty * 0.4 - State.stats.normieBanned * 0.05, 0, 1);
  let rank = "D";
  if (score > 0.85) rank = "S";
  else if (score > 0.7) rank = "A";
  else if (score > 0.55) rank = "B";
  else if (score > 0.4) rank = "C";

  $("#win-rank").textContent = rank;
  $("#win-stats").innerHTML = `
    <div>🔥 пик Градуса: <b>${Math.round(State.stats.peakGrad)}%</b></div>
    <div>👁️ финальный Sus: <b>${Math.round(State.sus)}%</b></div>
    <div>👥 финальный актив: <b>${State.online}</b></div>
    <div>🚫 банов: <b>${State.stats.banTotal}</b></div>
    <div>💬 вбросов: <b>${State.stats.modPosts}</b></div>
    <div>🤖 газлайтов: <b>${State.stats.gasUsed}</b></div>
  `;
  if (rank === "S") sfx.rankS(); else sfx.win();
  if (State.levelIdx >= LEVELS.length - 1) {
    $("#final-stats").innerHTML = $("#win-stats").innerHTML;
    showScreen("finalwin", true);
  } else {
    showScreen("winscreen", true);
  }
}

function loseGame(reason) {
  if (State.ended) return;
  State.ended = true;
  let title = "ПРОВАЛ", icon = "💀", msg = "";
  if (reason === "sus") {
    title = "ТЕБЯ СНЯЛИ"; icon = "👁️";
    msg = "Слушай, Гоша, ты какой-то неадекват, мы нашли модератора получше. Удачи.";
  } else if (reason === "empty") {
    title = "ЧАТ ОПУСТЕЛ"; icon = "🪦";
    msg = "Ты всех забанил. С кем теперь срач разводить, Шерлок?";
  } else if (reason === "timeout") {
    title = "СМЕНА ЗАКОНЧИЛАСЬ"; icon = "⌛";
    msg = "Время вышло, а Градус так и не дотянул до цели. Скучный ты модератор.";
  }
  $("#lose-title").textContent = title;
  $("#lose-icon").textContent = icon;
  $("#lose-msg").textContent = msg;
  $("#lose-stats").innerHTML = `
    <div>🔥 пик Градуса: <b>${Math.round(State.stats.peakGrad)}%</b></div>
    <div>👁️ Sus: <b>${Math.round(State.sus)}%</b></div>
    <div>👥 актив: <b>${State.online}</b></div>
    <div>🚫 банов: <b>${State.stats.banTotal}</b></div>
  `;
  sfx.lose();
  showScreen("losescreen", true);
}

// =================== Управление экранами ===================
function showScreen(id, asModal) {
  if (asModal) $(`#${id}`).classList.add("visible");
  else {
    $$(".screen:not(.modal)").forEach(s => s.classList.remove("visible"));
    $(`#${id}`).classList.add("visible");
  }
}
function hideModal(id) { $(`#${id}`).classList.remove("visible"); }

// =================== Старт уровня / новой игры ===================
function startLevel(idx) {
  State.levelIdx = idx;
  LEVEL = LEVELS[idx];
  // Reset state
  State.toxicity = 0;
  State.sus = 0;
  State.online = LEVEL.meta.initialOnline;
  State.combo = 1.0;
  State.comboLastTick = 0;
  State.holdSec = 0;
  State.paused = false;
  State.ended = false;
  State.startedAt = performance.now();
  State.users.clear();
  for (const [id, me] of State.msgEls) me.el.remove();
  State.msgEls.clear();
  State.shadowed.clear();
  State.ignoredComplaints = 0;
  State.cooldowns = { modpost: 0, gaslight: 0, fan: 0, "mass-mute": 0 };
  State.events = { adminWatch: false, adminTimer: 0, raidActive: false, muteActive: false, muteTimer: 0 };
  State.scheduled.length = 0;
  State.stats = { peakGrad: 0, banTotal: 0, modPosts: 0, gasUsed: 0, normieBanned: 0, snitchBanned: 0 };
  unpin(false);

  spawnInitialUsers(LEVEL.meta.initialOnline);
  $("#chat-name").textContent = LEVEL.meta.name;
  $("#level-name").textContent = LEVEL.meta.levelName;
  $("#chat-icon").textContent = LEVEL.meta.icon;
  $("#goal-text").innerHTML = `${LEVEL.meta.description} <b>Цель:</b> Градус ≥ ${LEVEL.meta.targetGrad}% удерживай ${LEVEL.meta.holdSec}с. Sus &lt; 100, актив &gt; ${LEVEL.meta.minOnline}.`;
  updateHUD();
  // Стартовый сид
  pushSystem(`🛡️ Ты теперь модератор «${LEVEL.meta.name}». Удачи.`, "");
  pushSystem(`Цель: разогнать Градус до ${LEVEL.meta.targetGrad}% и удержать ${LEVEL.meta.holdSec} секунд.`, "");
  // Первое органическое сообщение
  nextMsgAt = performance.now() + 800;
  nextOnlineAt = performance.now() + 12000;
  nextEventAt = performance.now() + rand(20000, 30000);
  showScreen("game-screen", false);
  if (!State._running) {
    State._running = true;
    requestAnimationFrame(tick);
  }
}

// =================== UI bindings ===================
function bindUI() {
  $("#start-btn").addEventListener("click", () => { hideModal("title-screen"); startLevel(0); });
  $("#howto-btn").addEventListener("click", () => showScreen("howto-screen", true));
  $("#howto-close").addEventListener("click", () => hideModal("howto-screen"));

  $("#mute-btn").addEventListener("click", (e) => {
    setMuted(!isMuted());
    e.currentTarget.textContent = isMuted() ? "🔇" : "🔊";
  });
  $("#pause-btn").addEventListener("click", () => {
    State.paused = true;
    showScreen("pausescreen", true);
  });
  $("#resume-btn").addEventListener("click", () => { State.paused = false; hideModal("pausescreen"); });
  $("#pause-menu-btn").addEventListener("click", () => { hideModal("pausescreen"); backToMenu(); });

  $("#pin-close").addEventListener("click", () => unpin(true));

  for (const btn of $$(".mod-action")) {
    btn.addEventListener("click", () => {
      const a = btn.dataset.action;
      if (a === "modpost") actModpost();
      else if (a === "gaslight") actGaslight();
      else if (a === "fan") actFan();
      else if (a === "mass-mute") actMassMute();
    });
  }
  $("#modpost-cancel").addEventListener("click", () => hideModal("modpost-screen"));

  $("#next-level-btn").addEventListener("click", () => { hideModal("winscreen"); startLevel(State.levelIdx + 1); });
  $("#win-menu-btn").addEventListener("click", () => { hideModal("winscreen"); backToMenu(); });
  $("#retry-btn").addEventListener("click", () => { hideModal("losescreen"); startLevel(State.levelIdx); });
  $("#lose-menu-btn").addEventListener("click", () => { hideModal("losescreen"); backToMenu(); });
  $("#final-restart-btn").addEventListener("click", () => { hideModal("finalwin"); startLevel(0); });

  // Hotkeys
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if ($("#game-screen.visible") && !State.paused && !State.ended) {
        State.paused = true;
        showScreen("pausescreen", true);
      }
    }
    if (e.key === "m" || e.key === "M") $("#mute-btn").click();
  });
}

function backToMenu() {
  State._running = false;
  State.ended = true;
  showScreen("title-screen", false);
}

// =================== Init ===================
bindUI();
// На всякий случай — заглушка для модальных окон
$$(".screen.modal").forEach(s => s.addEventListener("click", (e) => {
  // Клик по фону (не по карточке) закрывает только howto
  if (e.target === s && s.id === "howto-screen") hideModal("howto-screen");
}));
