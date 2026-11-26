/* Shared shell pieces the generated pages do not include. */
(() => {
  const zh = () => !document.documentElement.lang.startsWith("en");
  const statusLabel = {
    pending: ["待審核", "Pending"],
    approved: ["已核准", "Approved"],
    declined: ["已拒絕", "Declined"]
  };

  function note() {
    const form = document.querySelector("#signin");
    if (!form || form.querySelector(".preview-note")) return;
    const copy = document.createElement("p");
    copy.className = "preview-note";
    copy.textContent = zh()
      ? "這是獨立預覽，資料是虛構的，不會寫入正式桃小巴。帳號 desk、admin.chen、driver.lin。密碼至少 1 個字即可。"
      : "Isolated preview with fictional records. Accounts: desk, admin.chen, driver.lin. Any password of at least 1 character.";
    const title = form.querySelector("h2");
    if (title) title.after(copy);
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

  function footer() {
    const shell = document.querySelector(".shell");
    if (!shell || shell.querySelector(".tb-footer")) return;
    const bar = document.createElement("footer");
    bar.className = "tb-footer";
    bar.textContent = zh() ? "桃小巴 · 預覽工作台 · 虛構資料，不連正式系統" : "TaoBus · Preview workspace · Fictional data only";
    shell.append(bar);
  }

  let selectedId = "";
  async function leaveBoard() {
    const module = document.querySelector('.workspace[data-module="leave"] .module-surface');
    if (!module || module.querySelector(".tb-leave-board") || module.dataset.leaveBoard === "loading") return;
    module.dataset.leaveBoard = "loading";
    let rows = [];
    try {
      const response = await fetch("/api/requests");
      if (!response.ok) return;
      rows = await response.json();
    } catch { return; }
    if (!module.isConnected) return;
    module.dataset.leaveBoard = "ready";
    const board = document.createElement("section");
    board.className = "tb-leave-board";
    const queue = document.createElement("div");
    queue.className = "tb-sheet";
    const title = document.createElement("h2");
    title.textContent = zh() ? "待處理申請" : "Requests awaiting action";
    title.style.marginTop = "0";
    queue.append(title);
    const list = document.createElement("ul");
    list.className = "tb-request-list";
    const detail = document.createElement("aside");
    detail.className = "tb-sheet";
    detail.setAttribute("aria-live", "polite");
    const pending = rows.filter((row) => row.status === "pending");
    const ordered = [...pending, ...rows.filter((row) => row.status !== "pending")];
    if (!selectedId || !ordered.some((row) => row.id === selectedId)) selectedId = (pending[0] || ordered[0] || {}).id || "";
    function paintDetail(row) {
      detail.replaceChildren();
      const heading = document.createElement("h2");
      heading.style.marginTop = "0";
      heading.textContent = row ? row.driver : (zh() ? "尚無申請" : "No requests");
      detail.append(heading);
      if (!row) return;
      const names = statusLabel[row.status] || [row.status, row.status];
      const badge = document.createElement("p");
      badge.className = "tb-status " + row.status;
      badge.textContent = zh() ? names[0] : names[1];
      const copy = document.createElement("p");
      copy.textContent = row.date + " – " + row.until + " · " + row.reason;
      detail.append(badge, copy);
      if (row.status === "pending") {
        const actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.gap = "8px";
        actions.style.justifyContent = "flex-end";
        for (const [key, label] of [["approved", zh() ? "核准" : "Approve"], ["declined", zh() ? "拒絕" : "Decline"]]) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = key === "approved" ? "tb-primary" : "tb-danger";
          button.textContent = label;
          button.onclick = async () => {
            button.disabled = true;
            const saved = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id, status: key }) });
            if (!saved.ok) { button.disabled = false; return; }
            selectedId = row.id;
            delete module.dataset.leaveBoard;
            board.remove();
            leaveBoard();
          };
          actions.append(button);
        }
        detail.append(actions);
      }
    }
    for (const row of ordered) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-pressed", String(row.id === selectedId));
      const names = statusLabel[row.status] || [row.status, row.status];
      button.textContent = row.driver + " · " + row.date + " · " + (zh() ? names[0] : names[1]);
      button.onclick = () => { selectedId = row.id; delete module.dataset.leaveBoard; board.remove(); leaveBoard(); };
      item.append(button);
      list.append(item);
    }
    if (!ordered.length) {
      const empty = document.createElement("p");
      empty.textContent = zh() ? "沒有休假申請。" : "No leave requests.";
      queue.append(empty);
    } else queue.append(list);
    paintDetail(ordered.find((row) => row.id === selectedId));
    board.append(queue, detail);
    module.prepend(board);
  }

  const run = () => { note(); dedupeHeadings(); footer(); leaveBoard(); };
  new MutationObserver(() => run()).observe(document.documentElement, { childList: true, subtree: true });
  run();
})();
