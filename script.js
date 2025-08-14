// script.js — MIDNIGHT WebApp integration
(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const gate = document.getElementById("gate");
  const app = document.getElementById("root");
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

  const haptic = (t="impact")=>{
    try{ if(!tg?.HapticFeedback) return; if(t==="impact") tg.HapticFeedback.impactOccurred("medium"); if(t==="succ") tg.HapticFeedback.notificationOccurred("success"); if(t==="err") tg.HapticFeedback.notificationOccurred("error"); }catch(e){}
  };

  if(!tg){
    gate.querySelector(".notg").classList.remove("hidden");
    gate.classList.remove("hidden");
    return;
  }

  tg.ready();
  tg.expand && tg.expand();

  const user = tg.initDataUnsafe?.user;
  if(user){
    $("#user-chip").textContent = `@${user.username || user.first_name || "user"}`;
    $("#name").textContent = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    $("#uid").textContent = `ID: ${user.id}`;
  }

  app.classList.remove("hidden");
  app.classList.add("ready");
  gate.classList.add("hidden");

  const pages = ["deal","wallets","ref","profile","lang","help"];
  function show(p){
    pages.forEach(x => {
      const el = document.getElementById(`page-${x}`);
      if(el) el.classList.toggle("active", x===p);
    });
    $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.page===p));
    haptic("impact");
  }
  $$(".tab").forEach(t => t.addEventListener("click", ()=> show(t.dataset.page)));
  show("deal");

  const send = (payload) => {
    tg.sendData(JSON.stringify(payload));
    haptic("succ");
  };

  $("#create-deal").addEventListener("click", ()=>{
    const amount = parseFloat($("#amount").value || "0");
    const description = ($("#descr").value || "").trim();
    const method = $("#method").value;
    if(!(amount>0)){ haptic("err"); return tg.showPopup && tg.showPopup({title:"Ошибка", message:"Введите сумму >0", buttons:[{type:"close"}]}); }
    if(description.length<3){ haptic("err"); return tg.showPopup && tg.showPopup({title:"Ошибка", message:"Опишите сделку", buttons:[{type:"close"}]}); }
    send({action:"create_deal", amount, description, payment_method: method});
  });

  $("#save-ton").addEventListener("click", ()=> {
    const ton = ($("#ton").value || "").trim();
    if(ton.length<6){ haptic("err"); return tg.showPopup && tg.showPopup({title:"Ошибка", message:"TON некорректен", buttons:[{type:"close"}]}); }
    send({action:"set_wallet", kind:"ton", value: ton});
  });
  $("#save-card").addEventListener("click", ()=> {
    const card = ($("#card").value || "").trim();
    if(card.length<3){ haptic("err"); return tg.showPopup && tg.showPopup({title:"Ошибка", message:"Карта некорректна", buttons:[{type:"close"}]}); }
    send({action:"set_wallet", kind:"card", value: card});
  });

  $("#get-ref").addEventListener("click", ()=> send({action:"get_ref"}));
  $$("#page-lang .btn[data-lang]").forEach(b => b.addEventListener("click", ()=> send({action:"set_lang", lang: b.dataset.lang})));
  $("#close-app").addEventListener("click", ()=> tg.close && tg.close());
})();
