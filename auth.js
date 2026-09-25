
(function(){
  const SESSION_UNLOCK_KEY = "evana_site_unlocked_session_v1";
  const OLD_UNLOCK_KEY = "evana_site_unlocked_v1";
  const PASSWORD_HASH = "aea327498b0785870d08f3d8a3c6e216a523532b5849077f8b60876c58a92eb2";

  async function sha256(text){
    const bytes = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");
  }

  function unlock(){
    document.body.classList.remove("auth-locked");
    sessionStorage.setItem(SESSION_UNLOCK_KEY, "yes");
    const input = document.getElementById("sitePassword");
    if(input) input.value = "";
  }

  function lock(){
    sessionStorage.removeItem(SESSION_UNLOCK_KEY);
    localStorage.removeItem(OLD_UNLOCK_KEY);
    document.body.classList.add("auth-locked");
    const error = document.getElementById("authError");
    if(error) error.textContent = "";
    setTimeout(()=>document.getElementById("sitePassword")?.focus(), 30);
  }

  function init(){
    // Remove the old "stay unlocked forever" flag from V3.15.
    localStorage.removeItem(OLD_UNLOCK_KEY);

    if(sessionStorage.getItem(SESSION_UNLOCK_KEY)==="yes"){
      document.body.classList.remove("auth-locked");
    } else {
      document.body.classList.add("auth-locked");
      setTimeout(()=>document.getElementById("sitePassword")?.focus(), 30);
    }

    const form = document.getElementById("authForm");
    const input = document.getElementById("sitePassword");
    const error = document.getElementById("authError");

    if(form){
      form.addEventListener("submit", async e=>{
        e.preventDefault();
        const hash = await sha256(input?.value || "");
        if(hash === PASSWORD_HASH){
          if(error) error.textContent = "";
          unlock();
        } else {
          if(error) error.textContent = "Incorrect password.";
          if(input){ input.value = ""; input.focus(); }
        }
      });
    }

    document.querySelectorAll(".lock-site-btn").forEach(btn=>{
      btn.addEventListener("click", lock);
    });
  }

  window.addEventListener("DOMContentLoaded", init);
  window.EvanaAuth = { lock, unlock };
})();
