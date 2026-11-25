/* Preview shell notes and duplicate-heading cleanup. */
(() => {
  const zh = () => !document.documentElement.lang.startsWith("en");
  function note() {
    const form = document.querySelector("#signin");
    if (!form || form.querySelector(".preview-note")) return;
    const copy = document.createElement("p");
    copy.className = "preview-note";
    copy.textContent = zh()
      ? "這是獨立預覽，資料是虛構的，不會寫入正式桃小巴。帳號 desk（管理員）、admin.chen（管理員）、driver.lin（駕駛林以安）。密碼任意填寫至少 1 個字。"
      : "Isolated preview with fictional records. It does not write to production. Accounts: desk and admin.chen (administrators), driver.lin (driver 林以安). Any password of at least 1 character.";
    const title = form.querySelector("h2");
    title.after(copy);
  }
  function dedupeHeadings() {
    const page = document.querySelector(".dispatch-header h1");
    if (!page) return;
    const title = page.textContent.trim();
    document.querySelectorAll(".module-surface header h3").forEach((heading) => {
      const same = heading.textContent.trim() === title;
      heading.classList.toggle("duplicate-title", same);
      if (same) heading.setAttribute("aria-hidden", "true");
      else heading.removeAttribute("aria-hidden");
    });
  }
  const run = () => { note(); dedupeHeadings(); };
  new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true });
  run();
})();
