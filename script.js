// script.js — TRACK AI bootstrap. Mounts the AI Track Evaluator and nothing else.
(function () {
  const tg = (window.Telegram && window.Telegram.WebApp) || null;
  try {
    if (tg) {
      tg.ready();
      tg.expand && tg.expand();
      const user = tg.initDataUnsafe && tg.initDataUnsafe.user;
      if (user) {
        const chip = document.getElementById("user-chip");
        if (chip) chip.textContent = "@" + (user.username || user.first_name || "user");
      }
    }
  } catch (e) { /* ignore */ }

  const root = document.getElementById("root");
  if (root) root.classList.add("ready");

  if (window.TrackAI && typeof window.TrackAI.mount === "function") {
    try { window.TrackAI.mount(document.getElementById("page-trackai")); }
    catch (e) { console.error("TrackAI mount failed:", e); }
  }
})();
