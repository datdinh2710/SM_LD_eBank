const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const loanContractNumber = (card) =>
  card.querySelector(".no b")?.textContent.trim() ||
  card.querySelector(".no")?.textContent.replace(/^.*:\s*/, "").trim() ||
  "";
const PAYMENT_ACCOUNTS = [
  { id: "123456789", number: "123456789", balance: "31,232,661" },
  { id: "66668888", number: "66668888", balance: "131,754,158" },
  { id: "080819888", number: "080819888", balance: "322,008,028" },
];
const CUSTOMER_PROFILE = {
  name: "Nguyen Minh Ngoc",
  identityNumber: "000088001234",
  address: "25 Trần Hưng Đạo, Phường Hoàn Kiếm, TP. Hà Nội.",
  phone: "0988 888 888",
};
const formatInterestRate = (rate) =>
  `${Number.parseFloat(String(rate).replace(",", ".")).toFixed(2)}%`;
const REG_MIN_LOAN_AMOUNTS = {
  thechap: 100000000,
  tinchap: 10000000,
};

let historyStack = ["home"],
  toastTimer;
let caseOverridesTab = null;
let loanNavEnabled = false;
function syncMainTabbar() {
  const navHome = $("#nav-home");
  const navLoan = $("#nav-loan");
  const navQr = $("#nav-qr");
  $("#phone").classList.toggle("loan-utilities", loanNavEnabled);
  $("#nav-home-label").textContent = loanNavEnabled
    ? "Khám phá\nsản phẩm"
    : "Trang chủ";
  $("#nav-loan-label").textContent = loanNavEnabled
    ? "Quản lý\nkhoản vay"
    : "Vay";
  $("#nav-terms-label").textContent = loanNavEnabled
    ? "Tài liệu\n& Biểu phí"
    : "Ưu đãi";
  $("#nav-calc-label").textContent = loanNavEnabled
    ? "Công cụ\ntính lãi"
    : "Tìm kiếm";
  navHome.dataset.go = loanNavEnabled ? "loan" : "home";
  navLoan.dataset.go = loanNavEnabled ? "profile" : "loan";
  navQr.hidden = loanNavEnabled;
}
function navigateTo(id, push = true) {
  if (id === "home") {
    historyStack = ["home"];
    render("home");
    return;
  }
  const cur = historyStack[historyStack.length - 1];
  if (id === cur) return;
  if (push) historyStack.push(id);
  render(id);
}
function goBack() {
  if (window.closeCloseAccountSheet && window.closeCloseAccountSheet()) return;
  if (window.closeIncFeeAccountSheet && window.closeIncFeeAccountSheet()) return;
  if (window.closeOdInterestAccountSheet && window.closeOdInterestAccountSheet()) return;
  if (window.closeOdPayDaySheet && window.closeOdPayDaySheet()) return;
  if (window.closeOdTerms && window.closeOdTerms()) return;
  const cs = document.getElementById("contractSheet");
  if (cs && cs.classList.contains("on")) {
    if (window.closeContractSheet) window.closeContractSheet();
    return;
  }
  if (historyStack.length < 2) {
    if (historyStack[0] !== "home") {
      historyStack = ["home"];
      render("home");
      return;
    }
    toast("Đây là màn hình đầu tiên của mock-up");
    return;
  }
  historyStack.pop();
  render(historyStack[historyStack.length - 1]);
}
function render(id) {
  if (id === "home") loanNavEnabled = false;
  syncMainTabbar();
  $$(".screen").forEach((s) =>
    s.classList.toggle(
      "on",
      s.id === id || (id === "repay-schedule" && s.id === "detail"),
    ),
  );
  const sc = $("#" + id);
  if (sc) sc.scrollTop = 0;
  $("#nav-home").classList.toggle(
    "cur",
    loanNavEnabled ? id === "loan" : id === "home",
  );
  $("#nav-loan").classList.toggle(
    "cur",
    loanNavEnabled ? id === "profile" : false,
  );
  $("#nav-terms").classList.toggle("cur", id === "terms");
  $("#nav-calc").classList.toggle("cur", id === "calc");
  $("#phone").classList.toggle(
    "detail",
    id === "detail" || id === "repay-schedule",
  );
  $("#phone").classList.toggle(
    "nonav",
    id.startsWith("od-") ||
      id === "prepay-loan" ||
      id === "prepay-confirm" ||
      id === "prepay-success" ||
      id === "repay-schedule" ||
      id === "doc-preview" ||
      id === "loan-demand" ||
      id === "confirm-loan" ||
      id === "regform" ||
      id === "reg-confirm" ||
      id === "regdone" ||
      id === "od-inc-success" ||
      id === "od-close-success" ||
      id === "repay-schedule" ||
      id === "biometric" || // Xác thực sinh trắc học
      id === "otp" || // Xác nhận soft OTP
      id === "final-success", // Đăng ký thành công
  );
}
function setTab(n) {
  const p = $("#profile");
  p.classList.toggle("t1", n === "1");
  p.classList.toggle("t2", n === "2");
  $$(".tabs button").forEach((b) =>
    b.classList.toggle("on", b.dataset.tab === n),
  );
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("on"), 1800);
}
document.addEventListener("click", async (event) => {
  const copyButton = event.target.closest(".hb-copy");
  if (!copyButton) return;
  const accountNumber = copyButton
    .closest(".home-balance-card")
    .querySelector(".hb-acc").textContent.trim();
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(accountNumber);
    } else {
      const field = document.createElement("textarea");
      field.value = accountNumber;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      if (!copied) throw new Error("Clipboard copy command was rejected");
    }
    toast("Đã sao chép số tài khoản");
  } catch (error) {
    console.error("Không thể sao chép số tài khoản:", error);
    toast("Không thể sao chép số tài khoản");
  }
});
(() => {
  const carousel = $("#homeAccountCarousel");
  const template = carousel.querySelector(".home-balance-card");
  const pager = carousel.querySelector(".hb-pager");
  const cards = PAYMENT_ACCOUNTS.map((account, index) => {
    const card = index === 0 ? template : template.cloneNode(true);
    card.dataset.accountIndex = index;
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", "Tài khoản " + account.number);
    card.querySelector(".hb-acc").textContent = account.number;
    const amount = card.querySelector(".hb-amount b");
    amount.textContent = account.balance;
    amount.dataset.visibleAmount = account.balance;
    card.querySelector(".hb-star").hidden = index !== 0;
    if (index > 0) carousel.insertBefore(card, pager);
    return card;
  });
  let hidden = false, active = 0, dx = 0, x0 = 0, down = false, moved = false;

  function paint() {
    const width = carousel.clientWidth;
    if (!width) return;
    const step = width * 0.385;
    cards.forEach((card, index) => {
      const position = index - active + dx / step;
      const distance = Math.abs(position);
      const bounded = Math.max(-2, Math.min(2, position));
      card.style.transform = "translateX(" + position * step + "px) translateZ(" +
        -Math.min(distance, 2) * 80 + "px) rotateY(" + -bounded * 30 +
        "deg) scale(" + (1 - Math.min(distance, 2) * 0.07) + ")";
      card.style.opacity = distance < 1 ? 1 - distance * 0.15 : Math.max(0, 0.85 - (distance - 1));
      card.style.zIndex = Math.round(100 - distance * 10);
      card.style.setProperty("--dim", Math.min(distance, 1) * 0.4);
      card.style.pointerEvents = distance > 1.5 ? "none" : "auto";
    });
    [...pager.children].forEach((dot, index) => {
      const selected = index === active;
      dot.classList.toggle("on", selected);
      dot.setAttribute("aria-current", String(selected));
    });
    pager.setAttribute("aria-label", "Thẻ tài khoản " + (active + 1) + " trên " + cards.length);
  }
  function go(index) {
    active = Math.max(0, Math.min(cards.length - 1, index));
    dx = 0;
    paint();
  }
  carousel.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    down = true; moved = false; x0 = event.clientX;
    carousel.classList.add("drag");
  });
  window.addEventListener("pointermove", (event) => {
    if (!down) return;
    const distance = event.clientX - x0;
    if (Math.abs(distance) > 6) moved = true;
    const atEdge = (active === 0 && distance > 0) || (active === cards.length - 1 && distance < 0);
    dx = atEdge ? distance * 0.35 : distance;
    paint();
  });
  const endDrag = () => {
    if (!down) return;
    down = false; carousel.classList.remove("drag");
    go(active + (dx < -40 ? 1 : dx > 40 ? -1 : 0));
    setTimeout(() => { moved = false; }, 60);
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
  carousel.addEventListener("click", (event) => {
    const card = event.target.closest(".home-balance-card");
    const side = card && cards.indexOf(card) !== active;
    if (moved || side) {
      event.stopPropagation(); event.preventDefault();
      if (!moved && side) go(cards.indexOf(card));
    }
  }, true);
  pager.addEventListener("click", (event) => {
    const dot = event.target.closest("button");
    if (dot) go([...pager.children].indexOf(dot));
  });
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") go(active + 1);
    if (event.key === "ArrowLeft") go(active - 1);
  });
  window.addEventListener("resize", paint);
  paint();
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".hb-eye")) return;
    hidden = !hidden;
    cards.forEach((card) => {
      const amount = card.querySelector(".hb-amount b");
      amount.textContent = hidden ? "••••••••" : amount.dataset.visibleAmount;
      const eye = card.querySelector(".hb-eye");
      eye.setAttribute("aria-pressed", String(hidden));
      eye.setAttribute("aria-label", hidden ? "Hiện số dư" : "Ẩn số dư");
      eye.innerHTML = hidden
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7S18.5 19 12 19 2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="m3 3 18 18"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
    });
  });
})();
/* --- Nút "Theo dõi kết quả" ở màn Đăng ký thành công --- */
(() => {
  const trackBtn = document.getElementById("final-track");
  if (!trackBtn) return;
  trackBtn.addEventListener("click", () => {
    loanNavEnabled = true;
    caseOverridesTab = "1"; // giữ tab "Hồ sơ vay" cho các lần vào sau
    historyStack = ["loan", "profile"];
    setTab("1");
    render("profile");
  });
})();
document.addEventListener("click", (e) => {
  /* ---- Chặn tabbar khi ở Home: chỉ "Vay" hoạt động, và mở modal ---- */
  if ($("#home").classList.contains("on")) {
    const navClick = e.target.closest(".tabbar button");
    if (navClick) {
      e.preventDefault();
      e.stopPropagation();
      if (navClick.id === "nav-loan") {
        openCaseModal();
      }
      return;
    }
  }

  const removeAsset = e.target.closest("[data-remove-asset]");
  if (removeAsset) {
    e.preventDefault();
    const field = document.querySelector('[data-pick="asset"]');
    const values = JSON.parse(field.dataset.val || "[]");
    values.splice(+removeAsset.dataset.removeAsset, 1);
    renderAssetChips(values);
    return;
  }
  const el = e.target.closest(
    "[data-go],[data-back],[data-soon],[data-tab],[data-choose],[data-pick],[data-submit],[data-reg-next],[data-select],.acc-h",
  );
  if (!el) return;
  if (el.dataset.go) {
    const id = el.dataset.go;
    if (id === "loan-demand") {
      if (el.hasAttribute("data-borrow-more")) {
        if (!startBorrowMoreDemand()) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      } else {
        setBorrowMoreMode(false);
      }
    }
    if (el.dataset.select) handleSavingsSelect(el.dataset.select);
    if (id === "contract") {
      e.preventDefault();
      e.stopPropagation();
      if (window.openContractSheet) window.openContractSheet();
      return;
    }
    navigateTo(id);
    if (id === "profile") setTab(caseOverridesTab || "1");
  } else if ("back" in el.dataset) goBack();
  else if (el.dataset.tab) setTab(el.dataset.tab);
  else if (el.dataset.choose)
    startReg(el.dataset.choose, el.dataset.loanType);
  else if (el.dataset.pick) openFieldPick(el.dataset.pick);
  else if (el.dataset.regNext) continueReg();
  else if (el.dataset.submit) submitReg();
  else if (el.dataset.soon) toast(el.dataset.soon);
  else if (el.dataset.select) handleSavingsSelect(el.dataset.select);
  else if (el.classList.contains("acc-h"))
    el.parentElement.classList.toggle("open");
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const field = e.target.closest('[data-pick="asset"]');
  if (!field || e.target.closest("[data-remove-asset]")) return;
  e.preventDefault();
  openFieldPick("asset");
});
/* ===== Điều khoản & biểu phí + Công cụ tính lãi ===== */
(() => {
  const f = (n) => Math.round(n).toLocaleString("en-US");
  // Danh mục văn bản: sắp xếp theo Ngày đăng tải mới nhất → cũ nhất.
  // Ngày trong mock-up là dữ liệu mẫu để minh họa cách hiển thị/sắp xếp.
  const DOCS = [
    {
      t: "Biểu phí tín dụng",
      c: "fee",
      d: "08/10/2026",
      url: "https://cloud-cdn.seabank.com.vn/seabank-web/20260422%20Bieu%20phi%20tin%20dung.pdf",
      sort: "2026-10-08",
      k: ["biểu phí", "bieu phi", "phí tín dụng", "phi tin dung", "fee"],
    },
    {
      t: "Biểu lãi suất cơ sở áp dụng cho Khách hàng cá nhân",
      c: "rate",
      d: "01/10/2026",
      url: "https://cloud-cdn.seabank.com.vn/seabank-web/TH%C3%94NG%20B%C3%81O%20L%C3%83I%20SU%E1%BA%A4T%20C%C6%A0%20S%E1%BB%9E_08.10.2026.pdf",
      sort: "2026-10-01",
      k: [
        "biểu lãi suất",
        "bieu lai suat",
        "lãi suất cơ sở",
        "lai suat co so",
        "lãi suất",
        "lai suat",
        "rate",
      ],
    },
    {
      t: "Điều khoản và điều kiện cho vay theo hạn mức thấu chi không tài sản bảo đảm online dành cho Khách hàng cá nhân",
      c: "terms",
      d: "25/09/2026",
      url: "https://cloud-cdn.seabank.com.vn/seabank-web/%C4%90i%E1%BB%81u%20kho%E1%BA%A3n%20%C4%91i%E1%BB%81u%20ki%E1%BB%87n%20cho%20vay%20th%E1%BA%A5u%20chi%20kh%C3%B4ng%20TSB%C4%90%20online%20d%C3%A0nh%20cho%20KHCN%20-%202026.pdf",
      sort: "2026-09-25",
      k: [
        "điều",
        "dieu",
        "điều khoản",
        "dieu khoan",
        "điều kiện",
        "dieu kien",
        "thấu chi",
        "thau chi",
        "không tài sản bảo đảm",
        "online",
        "terms",
        "condition",
      ],
    },
    {
      t: "Điều khoản và điều kiện cho vay tiêu dùng online bảo đảm bằng Tiền gửi tiết kiệm cá nhân",
      c: "terms",
      d: "20/09/2026",
      url: "https://cloud-cdn.seabank.com.vn/seabank-web/07.%20Ban%20Dieu%20khoan%20Dieu%20kien%20SeAValue%20Online.pdf",
      sort: "2026-09-20",
      k: [
        "điều",
        "dieu",
        "điều khoản",
        "dieu khoan",
        "điều kiện",
        "dieu kien",
        "cho vay tiêu dùng",
        "cho vay tieu dung",
        "tiền gửi tiết kiệm",
        "tien gui tiet kiem",
        "online",
        "terms",
        "condition",
      ],
    },
    {
      t: "Điều kiện giao dịch chung về cho vay có tài sản bảo đảm áp dụng cho Khách hàng cá nhân",
      c: "terms",
      d: "12/09/2026",
      url: "https://cloud-cdn.seabank.com.vn/seabank-web/Dieu%20kien%20giao%20dich%20chung%20cho%20vay%20co%20TSBD.pdf",
      sort: "2026-09-12",
      k: [
        "điều",
        "dieu",
        "điều kiện",
        "dieu kien",
        "giao dịch chung",
        "giao dich chung",
        "tài sản bảo đảm",
        "tai san bao dam",
        "khách hàng cá nhân",
        "khach hang ca nhan",
        "terms",
        "condition",
      ],
    },
    {
      t: "Điều kiện và giao dịch chung về cho vay không có tài sản bảo đảm áp dụng cho Khách hàng cá nhân",
      c: "terms",
      d: "05/09/2026",
      url: "https://cloud-cdn.seabank.com.vn/seabank-web/2.%20TnC%20cho%20vay%20khong%20TSBD%20doi%20voi%20KHCN%20tai%20SeABank.pdf",
      sort: "2026-09-05",
      k: [
        "điều",
        "dieu",
        "điều kiện",
        "dieu kien",
        "giao dịch chung",
        "giao dich chung",
        "không có tài sản bảo đảm",
        "khong co tai san bao dam",
        "khách hàng cá nhân",
        "khach hang ca nhan",
        "terms",
        "condition",
      ],
    },
  ].sort((a, b) => b.sort.localeCompare(a.sort));
  let applied = new Set(["all"]);

  const norm = (s) =>
    String(s ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[Đđ]/g, "d")
      .toLowerCase()
      .trim();

  const boxes = $$("#sheet input"),
    all = boxes[0];
  const chips = $$(".doc-filter");

  function drawDocs() {
    const rawQ = $("#q").value || "";
    const q = norm(rawQ);

    const l = DOCS.filter((doc) => {
      const inCategory = applied.has("all") || applied.has(doc.c);
      if (!inCategory) return false;
      if (!q) return true;

      const haystack = [doc.t, ...(doc.k || [])].map(norm).join(" ");
      return haystack.includes(q);
    });

    $("#docs").innerHTML = l.length
      ? l
          .map(
            (doc) =>
              `<a class="doc" href="${doc.url}" target="_blank" rel="noopener noreferrer"><span class="di"><svg><use href="#i-pdf"/></svg></span><span class="dt"><b>${doc.t}</b><small>Cập nhật ngày: ${doc.d}</small></span><svg class="dc"><use href="#more"/></svg></a>`,
          )
          .join("")
      : '<p class="empty">Không tìm thấy văn bản phù hợp</p>';

    $("#openFilter").style.color = applied.has("all") ? "" : "var(--red)";
    chips.forEach((chip) => {
      const selected =
        (chip.dataset.docFilter === "all" && applied.has("all")) ||
        (applied.size === 1 && applied.has(chip.dataset.docFilter));
      chip.classList.toggle("on", selected);
      chip.setAttribute("aria-pressed", String(selected));
    });
  }
  const sheet = (on) => {
    $("#scrim").classList.toggle("on", on);
    $("#sheet").classList.toggle("on", on);
  };
  boxes.forEach((b) =>
    b.addEventListener("change", () => {
      if (b === all) {
        boxes.forEach((x) => (x.checked = x === all));
      } else {
        all.checked = !boxes.some((x) => x !== all && x.checked);
      }
    }),
  );
  $("#openFilter").onclick = () => {
    boxes.forEach((b) => (b.checked = applied.has(b.value)));
    sheet(true);
  };
  $("#closeFilter").onclick = () => sheet(false);
  $("#scrim").onclick = () => {
    sheet(false);
    if (typeof closePickSheet === "function") closePickSheet();
  };
  $("#saveFilter").onclick = () => {
    applied = new Set(boxes.filter((b) => b.checked).map((b) => b.value));
    drawDocs();
    sheet(false);
  };
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      applied = new Set([chip.dataset.docFilter]);
      drawDocs();
    });
  });
  $("#q").oninput = drawDocs;
  drawDocs();
  $("#docs").addEventListener("click", (event) => {
    const link = event.target.closest("a.doc");
    if (!link) return;

    event.preventDefault();
    $("#doc-preview-title").textContent =
      link.querySelector(".dt b")?.textContent || "Tài liệu";
    $("#doc-preview-frame").src = link.href;
    $("#doc-open-external").href = link.href;
    navigateTo("doc-preview");
  });
  const sched = (P, n, r) => {
    const pp = P / n,
      o = [];
    for (let k = 1; k <= n; k++) {
      const b = P - (k - 1) * pp,
        i = (b * r) / 1200;
      o.push({ k, b, pp, i, t: pp + i, e: b - pp });
    }
    return o;
  };
  const annu = (P, n, r) => {
    const i = r / 1200,
      A = i ? (P * i) / (1 - Math.pow(1 + i, -n)) : P / n,
      o = [];
    let b = P;
    for (let k = 1; k <= n; k++) {
      const li = b * i,
        pp = A - li,
        e = k === n ? 0 : b - pp;
      o.push({ k, b, pp, i: li, t: A, e });
      b = e;
    }
    return o;
  };
  const z = (v) => f(Math.abs(v) < 0.5 ? 0 : v);
  const row = (k, b, g, l, t) =>
    `<div class="tr"><span>${k}</span><span>${b}</span><span>${g}</span><span>${l}</span><span>${t}</span></div>`;
  function reset() {
    $("#rM").textContent = $("#rT").textContent = $("#rI").textContent = "0";
    $("#tb").innerHTML = Array.from({ length: 10 }, (_, i) =>
      row(i, "-", "-", "-", "-"),
    ).join("");
    $("#cap").hidden = true;
  }
  const vals = () => ({
    P: +$("#cP").value.replace(/\D/g, ""),
    n: +$("#cN").value.replace(/\D/g, ""),
    r: parseFloat($("#cR").value.replace(",", ".")),
  });
  function calc(m) {
    const { P, n, r } = vals();
    if (!(P > 0 && n > 0 && r >= 0)) return reset(); // chưa nhập đủ: kết quả về 0
    const d = m === "dec" ? sched(P, n, r) : annu(P, n, r),
      sum = (k) => d.reduce((a, x) => a + x[k], 0);
    $("#rM").textContent = f(sum("t") / d.length);
    $("#rT").textContent = f(sum("t"));
    $("#rI").textContent = f(sum("i"));
    $("#tb").innerHTML =
      row(0, f(P), "-", "-", "-") +
      d.map((x) => row(x.k, z(x.e), z(x.pp), z(x.i), z(x.t))).join("");
    $("#cap").textContent =
      m === "dec"
        ? "Dư nợ giảm dần: gốc trả đều mỗi kỳ, lãi tính trên dư nợ còn lại."
        : "Niên kim cố định: số tiền gốc + lãi trả đều mỗi kỳ trong suốt vòng đời khoản vay.";
    $("#cap").hidden = false;
  }
  const digits = (v, max) =>
    v.replace(/\D/g, "").replace(/^0+/, "").slice(0, max);
  function rateFmt(v) {
    v = v.replace(/,/g, ".").replace(/[^\d.]/g, "");
    const i = v.indexOf(".");
    let a = (i < 0 ? v : v.slice(0, i)).replace(/^0+(?=\d)/, "").slice(0, 2);
    if (i < 0) return a;
    return (
      (a || "0") +
      "." +
      v
        .slice(i + 1)
        .replace(/\./g, "")
        .slice(0, 2)
    );
  }
  const bind = (id, fn) =>
    $("#" + id).addEventListener("input", (e) => {
      const v = fn(e.target.value);
      if (v !== e.target.value) e.target.value = v;
    });
  bind("cP", (v) => {
    const d = digits(v, 12);
    return d ? (+d).toLocaleString("en-US") : "";
  });
  bind("cN", (v) => digits(v, 3));
  bind("cR", rateFmt);
  $("#cR").addEventListener("blur", (e) => {
    const rate = Number.parseFloat(e.target.value.replace(",", "."));
    if (Number.isFinite(rate)) e.target.value = rate.toFixed(2);
  });
  const method = () => $('input[name="calcMethod"]:checked').value;
  const fieldOf = (id) => $("#" + id).closest(".fld");
  // Gõ lại vào ô nào thì bỏ trạng thái báo lỗi của ô đó
  ["cP", "cN", "cR"].forEach((id) =>
    $("#" + id).addEventListener("input", () =>
      fieldOf(id).classList.remove("err"),
    ),
  );
  // Nút "Áp dụng": kiểm tra dữ liệu rồi mới tính và hiển thị kết quả
  $("#calcApply").addEventListener("click", () => {
    const { P, n, r } = vals();
    const bad = [
      ["cP", P > 0],
      ["cN", n > 0],
      ["cR", r >= 0],
    ]
      .filter(([, ok]) => !ok)
      .map(([id]) => id);
    ["cP", "cN", "cR"].forEach((id) =>
      fieldOf(id).classList.toggle("err", bad.includes(id)),
    );
    if (bad.length) {
      reset();
      $("#" + bad[0]).focus();
      return toast("Vui lòng nhập đầy đủ số tiền, thời hạn vay và lãi suất vay");
    }
    document.activeElement?.blur();
    calc(method());
    const sc = $("#calc");
    sc.scrollTo({ top: $(".calc-out").offsetTop - 12, behavior: "smooth" });
  });
  // Nút "Làm mới": xoá toàn bộ giá trị đã nhập và đưa kết quả về trạng thái ban đầu
  document.querySelectorAll('input[name="calcMethod"]').forEach((input) => {
    input.addEventListener("change", () => {
      const { P, n, r } = vals();
      if (!(P > 0 && n > 0 && r >= 0)) return;
      calc(method());
      const sc = $("#calc");
      sc.scrollTo({ top: $(".calc-out").offsetTop - 12, behavior: "smooth" });
    });
  });
  $("#calcRefresh").addEventListener("click", () => {
    ["cP", "cN", "cR"].forEach((id) => {
      $("#" + id).value = "";
      fieldOf(id).classList.remove("err");
    });
    reset();
  });
  reset();
})();

/* ===== Đăng ký vay tín chấp / thế chấp ===== */
const rFmt = (n) => Math.round(n).toLocaleString("en-US");
const rPad = (n) => String(n).padStart(2, "0");
const VNU = [
  "không",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
];
function doc3(n, full) {
  const tr = Math.floor(n / 100),
    ch = Math.floor((n % 100) / 10),
    u = n % 10,
    s = [];
  if (tr > 0) s.push(VNU[tr] + " trăm");
  else if (full) s.push("không trăm");
  if (ch === 0) {
    if (u > 0) {
      if (tr > 0 || full) s.push("lẻ");
      s.push(VNU[u]);
    }
  } else if (ch === 1) {
    s.push("mười");
    if (u === 5) s.push("lăm");
    else if (u > 0) s.push(VNU[u]);
  } else {
    s.push(VNU[ch] + " mươi");
    if (u === 1) s.push("mốt");
    else if (u === 5) s.push("lăm");
    else if (u > 0) s.push(VNU[u]);
  }
  return s.join(" ").trim();
}
function docSo(n) {
  n = Math.round(n);
  if (n <= 0) return "Không đồng";
  const g = [
    [1e9, "tỷ"],
    [1e6, "triệu"],
    [1e3, "nghìn"],
    [1, ""],
  ];
  let out = [],
    started = false;
  for (const [v, name] of g) {
    const q = Math.floor(n / v) % 1000;
    if (q > 0) {
      out.push((doc3(q, started) || "") + (name ? " " + name : ""));
      started = true;
    }
  }
  let s = out.join(" ").replace(/\s+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1) + " đồng";
}
const PK_EL = document.getElementById("sheetPick");
const PK_LIST = document.getElementById("pkList");
const PK_TITLE = document.getElementById("pkTitle");
let pkOpts = [],
  pkCb = null,
  pkMode = "single",
  pkSelected = new Set();
function openPickSheet(title, opts, cb) {
  PK_TITLE.textContent = title;
  PK_LIST.innerHTML = opts
    .map(
      (o, i) =>
        o.balance
          ? `<button class="close-account-option savings-sopt${o.selected ? " on" : ""}" type="button" data-opt="${i}" aria-pressed="${!!o.selected}">
              <span class="ac-body">
                <span class="ac-bal">${o.balance} <span class="ac-unit">VND</span></span>
                <span class="ac-name"><span>${o.l}</span><span class="ac-divider">|</span><span>${o.s}</span></span>
              </span>
              <span class="ac-check"><svg><use href="#check" /></svg></span>
            </button>`
          : `<button class="sopt${o.check ? " savings-sopt" : ""}${o.selected ? " is-selected" : ""}" data-opt="${i}"${o.check ? ` aria-pressed="${!!o.selected}"` : ""}>${o.check ? '<span class="sopt-copy">' : ""}<b>${o.l}</b>${o.s ? `<span>${o.s}</span>` : ""}${o.check ? `</span><svg class="sopt-check" aria-hidden="true"><use href="#check" /></svg>` : ""}</button>`,
    )
    .join("");
  pkOpts = opts;
  pkCb = cb;
  pkMode = "single";
  document.getElementById("scrim").classList.add("on");
  PK_EL.classList.add("on");
}
function openMultiPickSheet(title, opts, selected, cb) {
  PK_TITLE.textContent = title;
  pkOpts = opts;
  pkCb = cb;
  pkMode = "multi";
  pkSelected = new Set(selected);
  PK_LIST.innerHTML =
    opts
      .map((option, i) => {
        const isSelected = pkSelected.has(option.v);
        return `<button class="sopt multi-sopt${isSelected ? " on" : ""}" data-opt="${i}" aria-pressed="${isSelected}"><b>${option.l}</b><span class="multi-checkbox" aria-hidden="true"><svg class="multi-check"><use href="#check-mark" /></svg></span></button>`;
      })
      .join("") +
    '<button class="submit multi-confirm" type="button" data-pk-confirm>Xác nhận</button>';
  document.getElementById("scrim").classList.add("on");
  PK_EL.classList.add("on");
}
function closePickSheet() {
  const restoreSavingsFocus = PK_EL.classList.contains("savings-pick");
  PK_EL.classList.remove("on");
  PK_EL.classList.remove("savings-pick");
  document.getElementById("scrim").classList.remove("on");
  const savingsTrigger = document.getElementById("demand-savings-trigger");
  if (savingsTrigger) {
    savingsTrigger.setAttribute("aria-expanded", "false");
    if (restoreSavingsFocus) savingsTrigger.focus();
  }
}
document.getElementById("pkClose").onclick = closePickSheet;
PK_LIST.addEventListener("click", (e) => {
  const confirm = e.target.closest("[data-pk-confirm]");
  if (confirm) {
    const cb = pkCb;
    const values = pkOpts
      .filter((option) => pkSelected.has(option.v))
      .map((option) => option.v);
    closePickSheet();
    if (cb) cb(values);
    return;
  }
  const b = e.target.closest("[data-opt]");
  if (!b) return;
  if (pkMode === "multi") {
    const option = pkOpts[+b.dataset.opt];
    if (!option) return;
    if (pkSelected.has(option.v)) pkSelected.delete(option.v);
    else pkSelected.add(option.v);
    const isSelected = pkSelected.has(option.v);
    b.classList.toggle("on", isSelected);
    b.setAttribute("aria-pressed", isSelected);
    return;
  }
  const o = pkOpts[+b.dataset.opt],
    cb = pkCb;
  closePickSheet();
  if (cb && o) cb(o);
});
const PICKS = {
  purpose: {
    t: "Nhu cầu vay",
    o: [
      "Vay tiêu dùng",
      "Vay kinh doanh",
      "Vay mua ô tô",
      "Vay mua nhà",
      "Vay thấu chi",
    ],
  },
  term: {
    t: "Thời hạn vay",
    o: ["Dưới 1 năm", "Từ 1 - 5 năm", "Trên 5 năm"],
  },
  asset: {
    t: "Loại tài sản",
    o: [
      "Bất động sản",
      "Ô tô",
      "Sổ tiết kiệm",
    ],
  },
  assetValue: {
    t: "Giá trị tài sản ước tính",
    o: ["Dưới 1 tỷ", "Từ 1 - 5 tỷ", "Từ 5 - 10 tỷ", "Trên 10 tỷ"],
  },
  occ: {
    t: "Nghề nghiệp",
    o: [
      "Cá nhân kinh doanh",
      "Cán bộ, công chức, viên chức",
      "Chủ doanh nghiệp",
      "Lực lượng vũ trang",
      "Nhân viên văn phòng",
      "Khác",
    ],
  },
  income: {
    t: "Thu nhập hàng tháng",
    o: [
      "Dưới 10 triệu đồng",
      "Từ 10 - 30 triệu đồng",
      "Từ 30 - 50 triệu đồng",
      "Trên 50 triệu đồng",
    ],
  },
  plan: {
    t: "Phương án sử dụng vốn",
    o: [
      "Chi trả cho các hoạt động du lịch, vui chơi",
      "Đặt cọc, thanh toán tiền mua nhà/xe",
      "Khám, chữa bệnh",
      "Mua sắm trang thiết bị, nội thất, đồ dùng gia đình",
      "Tiêu dùng, phục vụ nhu cầu đời sống",
    ],
  },
};
const PURPOSE_MAP = {
  "Vay tiêu dùng": "Vay tiêu dùng",
  "Vay kinh doanh": "Vay kinh doanh",
  "Vay mua nhà": "Vay mua nhà",
  "Vay mua ô tô": "Vay mua ô tô",
  "Vay thấu chi": "Vay thấu chi",
};
// Sản phẩm có tài sản bảo đảm mở form Thế chấp; các sản phẩm còn lại mở form Tín chấp.
const SECURED_PRODS = ["Vay mua nhà", "Vay mua ô tô"];
const UNSECURED_PURPOSES = new Set([
  "Vay tiêu dùng",
  "Vay kinh doanh",
  "Vay thấu chi",
]);
let regType = "thechap";
function getRegMinLoanAmount() {
  return REG_MIN_LOAN_AMOUNTS[regType];
}
function getPurposeOptions() {
  return regType === "thechap"
    ? PICKS.purpose.o
    : PICKS.purpose.o.filter((purpose) => UNSECURED_PURPOSES.has(purpose));
}
function applyRegType(v) {
  regType = v;
  document.getElementById("secAsset").hidden = v !== "thechap";
  const purposeField = document.querySelector('[data-pick="purpose"]');
  if (
    purposeField &&
    purposeField.dataset.val &&
    !getPurposeOptions().includes(purposeField.dataset.val)
  ) {
    delete purposeField.dataset.val;
    const label = purposeField.querySelector(".lb");
    if (label) {
      label.textContent = "";
      label.hidden = true;
    }
    const value = purposeField.querySelector(".vl");
    if (value) {
      value.textContent = purposeField.dataset.ph;
      value.classList.add("ph");
    }
  }
  updateRegNextState();
}
document
  .querySelectorAll('input[name="regType"]')
  .forEach((r) => r.addEventListener("change", () => applyRegType(r.value)));
function setPickVal(key, val) {
  const b = document.querySelector(`[data-pick="${key}"]`);
  if (!b) return;
  const prev = b.dataset.val;
  b.dataset.val = val;
  const lb = b.querySelector(".lb");
  if (lb) {
    lb.textContent = PICKS[key].t;
    lb.hidden = false;
  }
  const vl = b.querySelector(".vl");
  if (vl) {
    vl.textContent = val;
    vl.classList.remove("ph");
  }
  // Đổi Tỉnh/Thành phố → Xã/Phường quay về phường/xã đầu tiên của tỉnh đó
  if (ADDR_PAIRS[key] && prev !== val && WARDS[val])
    setPickVal(ADDR_PAIRS[key], WARDS[val][0]);
  updateRegNextState();
}
/* ===== Địa chỉ: Tỉnh/Thành phố + Xã/Phường (dữ liệu mẫu) — dùng chung Thấu chi và Đăng ký vay ===== */
const WARDS = {
  "TP. Hà Nội": [
    "Xã Tiền Yên",
    "Phường Thanh Xuân",
    "Phường Cầu Giấy",
    "Phường Hoàn Kiếm",
  ],
  "TP. Hồ Chí Minh": [
    "Phường Bến Nghé",
    "Phường Bến Thành",
    "Phường Tân Định",
    "Phường Sài Gòn",
  ],
  "TP. Đà Nẵng": [
    "Phường Hải Châu",
    "Phường Thanh Khê",
    "Phường Sơn Trà",
    "Phường Ngũ Hành Sơn",
  ],
  "TP. Hải Phòng": [
    "Phường Hồng Bàng",
    "Phường Ngô Quyền",
    "Phường Lê Chân",
    "Phường Hải An",
  ],
};
// khóa pick của Tỉnh/Thành phố → khóa pick của Xã/Phường tương ứng
const ADDR_PAIRS = { odProvince: "odWard", regProvince: "regWard" };
Object.entries(ADDR_PAIRS).forEach(([pk, wk]) => {
  PICKS[pk] = { t: "Tỉnh/Thành phố", o: Object.keys(WARDS) };
  PICKS[wk] = {
    t: "Xã/Phường",
    get o() {
      const p = document.querySelector(`[data-pick="${pk}"]`);
      return WARDS[p && p.dataset.val] || [];
    },
  };
});
/* Ô địa chỉ: tự giãn chiều cao; bấm bút → hiện Tỉnh/Thành phố + Xã/Phường (cùng hàng);
   "Hủy chỉnh sửa" → khôi phục giá trị trước khi bấm bút và ẩn lại */
function initAddrEdit({
  addr,
  edit = null,
  cancel,
  prov,
  ward,
  keepPickersUnlocked = false,
}) {
  const pickBtns = [prov, ward].map((k) =>
    document.querySelector(`[data-pick="${k}"]`),
  );
  const pickVal = (k) =>
    document.querySelector(`[data-pick="${k}"]`).dataset.val;
  let snap = null;
  const fit = () => {
    addr.style.height = "auto";
    addr.style.height = addr.scrollHeight + "px";
  };
  // on = true: khóa Tỉnh/Thành phố + Xã/Phường và ẩn nút Hủy
  const lock = (on) => {
    pickBtns.forEach((b) => {
      b.disabled = on;
      b.classList.toggle("is-locked", on);
    });
    cancel.hidden = on;
  };
  const resetLock = () => {
    lock(!keepPickersUnlocked);
    if (keepPickersUnlocked) cancel.hidden = true;
  };
  addr.addEventListener("input", () => {
    if (/[\r\n]/.test(addr.value))
      addr.value = addr.value.replace(/[\r\n]+/g, " ");
    fit();
  });
  addr.addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.preventDefault();
  });
  window.addEventListener("resize", fit);
  if (edit) {
    edit.addEventListener("click", () => {
      if (!cancel.hidden) return; // đang ở chế độ sửa rồi
      snap = { addr: addr.value, prov: pickVal(prov), ward: pickVal(ward) };
      lock(false);
    });
  }
  cancel.addEventListener("click", () => {
    if (snap) {
      addr.value = snap.addr;
      setPickVal(prov, snap.prov); // đổi tỉnh sẽ đặt lại xã/phường
      setPickVal(ward, snap.ward);
    }
    snap = null;
    addr.blur();
    resetLock();
    fit();
  });
  resetLock();
  return {
    fit,
    reset() {
      snap = null;
      resetLock();
      fit();
    },
  };
}
function openFieldPick(key) {
  const c = PICKS[key];
  if (!c) return;
  const btn = document.querySelector(`[data-pick="${key}"]`);
  if (btn && btn.disabled) return; // trường đang khóa
  if (key === "asset") {
    const selected = JSON.parse(btn.dataset.val || "[]");
    openMultiPickSheet(
      c.t,
      c.o.map((v) => ({ l: v, v })),
      selected,
      renderAssetChips,
    );
    return;
  }
  const options = key === "purpose" ? getPurposeOptions() : c.o;
  openPickSheet(
    c.t,
    options.map((v) => ({ l: v, v })),
    (o) => setPickVal(key, o.v),
  );
}
function renderAssetChips(values) {
  const field = document.querySelector('[data-pick="asset"]');
  const list = document.getElementById("assetValues");
  const placeholder = document.getElementById("assetPlaceholder");
  if (!field || !list || !placeholder) return;

  field.dataset.val = JSON.stringify(values);
  field.classList.toggle("has-value", values.length > 0);
  const label = field.querySelector(".asset-multi__label");
  if (label) label.hidden = values.length === 0;
  list.replaceChildren();
  placeholder.hidden = values.length > 0;
  list.append(placeholder);
  values.forEach((value, index) => {
    const chip = document.createElement("span");
    chip.className = "asset-chip";
    const text = document.createElement("span");
    text.textContent = value;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "asset-chip__remove";
    remove.dataset.removeAsset = String(index);
    remove.setAttribute("aria-label", `Xóa ${value}`);
    remove.innerHTML = '<svg aria-hidden="true"><use href="#close" /></svg>';
    chip.append(text, remove);
    list.append(chip);
  });
  updateRegNextState();
}
function startReg(prod, loanType) {
  resetRegForm();
  const type = loanType || (SECURED_PRODS.includes(prod) ? "thechap" : "tinchap");
  const typeRadio = document.querySelector(
    `input[name="regType"][value="${type}"]`,
  );
  if (!typeRadio) {
    console.error(`Không tìm thấy hình thức vay "${type}" cho sản phẩm "${prod}"`);
    return;
  }
  typeRadio.checked = true;
  applyRegType(type);
  setPickVal("purpose", PURPOSE_MAP[prod] || prod);
  navigateTo("regform");
}
function resetRegForm() {
  const rt = document.querySelector('input[name="regType"][value="thechap"]');
  if (rt) rt.checked = true;
  applyRegType("thechap");
  const a = document.getElementById("fAmt");
  if (a) a.value = "";
  updateRegAmountWords();
  const nt = document.getElementById("fNote");
  if (nt) nt.value = "";
  document.getElementById("fNoteCnt").textContent = "0 / 240";
  document.getElementById("fAgree").checked = false;
  document.getElementById("fSubmit").disabled = true;
  document.getElementById("fConfirmSubmit").disabled = true;
  document.querySelectorAll("#regform [data-pick]").forEach((b) => {
    delete b.dataset.val;
    const lb = b.querySelector(".lb");
    if (lb) {
      lb.textContent = "";
      lb.hidden = true;
    }
    const vl = b.querySelector(".vl");
    if (vl) {
      vl.textContent = b.dataset.ph;
      vl.classList.add("ph");
    }
  });
  renderAssetChips([]);
  const fa = document.getElementById("fAddr");
  if (fa) fa.value = fa.defaultValue;
  setPickVal("regProvince", "TP. Hà Nội");
  setPickVal("regWard", "Phường Hoàn Kiếm");
  regAddr.reset();
  const regFormBody = document.querySelector("#regform .regform-body");
  if (regFormBody) regFormBody.scrollTop = 0;
  updateRegNextState();
}
function bindNum(id, max) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", () => {
    const d = el.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, max);
    el.value = d ? (+d).toLocaleString("en-US") : "";
  });
}
bindNum("fAmt", 12);
function updateRegAmountWords() {
  const amountInput = document.getElementById("fAmt");
  const words = document.getElementById("fAmtWords");
  if (!amountInput || !words) return;
  const amount = +(amountInput.value.replace(/\D/g, "") || 0);
  words.textContent = amount > 0 ? docSo(amount) : "";
}
document.getElementById("fAmt").addEventListener("input", updateRegAmountWords);
document.getElementById("fAmt").addEventListener("input", updateRegNextState);
const regAddr = initAddrEdit({
  addr: document.getElementById("fAddr"),
  cancel: document.getElementById("fAddr-cancel"),
  prov: "regProvince",
  ward: "regWard",
  keepPickersUnlocked: true,
});
document.getElementById("fAddr").addEventListener("input", updateRegNextState);
document.getElementById("fNote").addEventListener("input", (e) => {
  document.getElementById("fNoteCnt").textContent =
    e.target.value.length + " / 240";
});
document.getElementById("fAgree").addEventListener("change", (e) => {
  document.getElementById("fConfirmSubmit").disabled = !e.target.checked;
});
// Kích hoạt các nút thấu chi (phải nằm ngoài submitReg)
document.querySelectorAll("#loan .card.offer").forEach((c) => {
  if (/thấu chi/i.test(c.querySelector(".nm").textContent)) {
    const b = c.querySelector(".cf-vay-now");
    b.removeAttribute("data-soon");
    b.dataset.go = "od-demand";
  }
});
document.querySelectorAll("#currentRecords .loan").forEach((c) => {
  if (!/thấu chi/i.test(c.querySelector(".t").textContent)) return;
  const b = c.querySelector(".btns button:not(.pri)");
  if (!b) return;
  b.textContent = "Đóng hạn mức";
  b.dataset.soon = "Tính năng Đóng hạn mức chưa có trong mock-up";
});

function getRegData() {
  const amt = +(
    (document.getElementById("fAmt").value || "").replace(/\D/g, "") || 0
  );
  const fieldVal = (key) =>
    document.querySelector(`[data-pick="${key}"]`).dataset.val || "";
  return {
    amount: amt,
    term: fieldVal("term"),
    purpose: fieldVal("purpose"),
    occupation: fieldVal("occ"),
    income: fieldVal("income"),
    assetTypes:
      regType === "thechap" ? JSON.parse(fieldVal("asset") || "[]") : [],
    assetValue: regType === "thechap" ? fieldVal("assetValue") : "",
    province: fieldVal("regProvince"),
    ward: fieldVal("regWard"),
    address: document.getElementById("fAddr").value.trim(),
    note: document.getElementById("fNote").value.trim(),
  };
}
function isRegDataComplete(data = getRegData()) {
  return Boolean(
    data.amount >= getRegMinLoanAmount() &&
    data.purpose &&
    data.term &&
    data.address &&
    data.province &&
    data.ward &&
    data.occupation &&
    data.income &&
    (regType !== "thechap" || (data.assetTypes.length > 0 && data.assetValue)),
  );
}
function updateRegNextState() {
  const amountInput = document.getElementById("fAmt");
  const amountError = document.getElementById("fAmtError");
  const amount = +((amountInput.value || "").replace(/\D/g, "") || 0);
  const minimumAmount = getRegMinLoanAmount();
  const belowMinimum = amount > 0 && amount < minimumAmount;
  amountError.hidden = !belowMinimum;
  amountError.textContent = `Số tiền vay tối thiểu là ${minimumAmount.toLocaleString("en-US")}đ`;
  amountInput.setAttribute("aria-invalid", String(belowMinimum));
  amountInput.closest(".reg-amount-field").classList.toggle("is-error", belowMinimum);
  const button = document.getElementById("fSubmit");
  if (button) button.disabled = !isRegDataComplete();
}
function validateRegData(data, requireConsent = false) {
  if (data.amount < getRegMinLoanAmount()) {
    updateRegNextState();
    if (data.amount === 0) toast("Vui lòng nhập số tiền đề nghị vay");
    return false;
  }
  if (!data.term) {
    toast("Vui lòng chọn thời hạn vay");
    return false;
  }
  if (!data.purpose) {
    toast("Vui lòng chọn nhu cầu vay");
    return false;
  }
  if (regType === "thechap") {
    if (!data.assetTypes.length) {
      toast("Vui lòng chọn loại tài sản bảo đảm");
      return false;
    }
    if (!data.assetValue) {
      toast("Vui lòng chọn giá trị tài sản ước tính");
      return false;
    }
  }
  if (!data.occupation) {
    toast("Vui lòng chọn nghề nghiệp");
    return false;
  }
  if (!data.income) {
    toast("Vui lòng chọn mức thu nhập");
    return false;
  }
  if (!data.address) {
    toast("Vui lòng nhập nơi ở hiện tại");
    return false;
  }
  if (!data.province || !data.ward) {
    toast("Vui lòng chọn Tỉnh/Thành phố và Xã/Phường");
    return false;
  }
  if (requireConsent && !document.getElementById("fAgree").checked) {
    toast("Vui lòng đồng ý với điều khoản để tiếp tục");
    return false;
  }
  return true;
}
function fillRegReview(data) {
  const setText = (id, value) => {
    document.getElementById(id).textContent = value || "Không có";
  };
  setText(
    "regReviewType",
    regType === "thechap" ? "Thế chấp" : "Tín chấp",
  );
  setText("regReviewPurpose", data.purpose);
  setText("regReviewAmount", rFmt(data.amount) + " VND");
  setText("regReviewTerm", data.term);
  document.getElementById("regReviewAssetSection").hidden =
    regType !== "thechap";
  setText("regReviewAssetTypes", data.assetTypes.join(", "));
  setText("regReviewAssetValue", data.assetValue);
  setText("regReviewName", CUSTOMER_PROFILE.name);
  setText("regReviewPhone", CUSTOMER_PROFILE.phone);
  setText("regReviewProvince", data.province);
  setText("regReviewWard", data.ward);
  setText("regReviewAddress", data.address);
  setText("regReviewOccupation", data.occupation);
  setText("regReviewIncome", data.income);
  setText("regReviewNote", data.note);
}
function continueReg() {
  const data = getRegData();
  if (!validateRegData(data)) return;
  fillRegReview(data);
  navigateTo("reg-confirm");
}
function arrangeCollateralChips(container) {
  const chips = [...container.querySelectorAll(".asset-chip")];
  if (!chips.length) return;

  const gap = parseFloat(getComputedStyle(container).rowGap) || 0;
  const capacity = container.clientWidth + gap;
  const items = chips
    .map((chip) => ({ chip, width: chip.getBoundingClientRect().width + gap }))
    .sort((a, b) => b.width - a.width);

  let rows = null;
  for (let count = 1; count <= items.length && !rows; count++) {
    const remaining = Array(count).fill(capacity);
    const assignment = Array.from({ length: count }, () => []);
    const place = (index) => {
      if (index === items.length) return true;
      const item = items[index];
      const tried = new Set();
      for (let row = 0; row < count; row++) {
        if (remaining[row] < item.width || tried.has(remaining[row])) continue;
        tried.add(remaining[row]);
        remaining[row] -= item.width;
        assignment[row].push(item.chip);
        if (place(index + 1)) return true;
        assignment[row].pop();
        remaining[row] += item.width;
      }
      return false;
    };
    if (place(0)) rows = assignment;
  }

  if (!rows) return;
  container.replaceChildren(
    ...rows.map((rowChips) => {
      const row = document.createElement("div");
      row.className = "collateral-chip-row";
      row.append(...rowChips);
      return row;
    }),
  );
}
let collateralResizeTimer;
window.addEventListener("resize", () => {
  if (!$("#regdone").classList.contains("on")) return;
  clearTimeout(collateralResizeTimer);
  collateralResizeTimer = setTimeout(
    () => arrangeCollateralChips($("#dAssets")),
    100,
  );
});
function submitReg() {
  const data = getRegData();
  if (!validateRegData(data, true)) return;
  const { amount: amt, term, purpose, assetTypes } = data;
  const executedAt = new Date();
  document.getElementById("dAmt").innerHTML = rFmt(amt) + " <u>VND</u>";
  document.getElementById("dWords").textContent = "(" + docSo(amt) + ")";
  document.getElementById("dExecutionTime").textContent =
    `${rPad(executedAt.getDate())}/${rPad(executedAt.getMonth() + 1)}/${executedAt.getFullYear()}`;
  const purposeNames = {
    "Vay tiêu dùng": "Tiêu dùng",
    "Vay kinh doanh": "Kinh doanh",
    "Vay thấu chi": "Thấu chi",
  };
  const purposeName = purposeNames[purpose];
  document.getElementById("dPurpose").textContent = purposeName
    ? `${purposeName} ${regType === "thechap" ? "thế chấp" : "tín chấp"}`
    : purpose;
  document.getElementById("dTerm").textContent = term;
  document.getElementById("dCollateralRow").hidden = regType !== "thechap";
  const assetList = document.getElementById("dAssets");
  assetList.replaceChildren();
  if (assetTypes.length) {
    assetTypes.forEach((asset) => {
      const chip = document.createElement("span");
      chip.className = "asset-chip";
      chip.textContent = asset;
      assetList.append(chip);
    });
  }
  navigateTo("regdone");
  arrangeCollateralChips(assetList);
}

/* ===== Luồng Vay cầm cố sổ tiết kiệm ===== */
let demandMax = 0; // Hạn mức vay tối đa của sổ đang chọn
let borrowMoreMode = false;
let borrowMoreDebt = 0;
const savingsData = {
  s1: {
    amount: "50,000,000",
    balance: "375,000,000",
    max: 300000000,
    rate: 8.6,
    endDate: "31/12/2027",
    account: "000001105208",
    maturity: "31/12/2027",
    name: "Tiết kiệm lĩnh lãi cuối kỳ",
  },
  s2: {
    amount: "50,000,000",
    balance: "500,000,000",
    max: 400000000,
    rate: 8.65,
    endDate: "31/12/2028",
    account: "000002710195",
    maturity: "31/12/2028",
    name: "Tiết kiệm lĩnh lãi cuối kỳ",
  },
};
const securedLoanMax = Object.values(savingsData).reduce(
  (total, savings) => total + savings.max,
  0,
);
const securedLoanOfferAmount = document.getElementById(
  "secured-loan-offer-amount",
);
if (securedLoanOfferAmount) {
  securedLoanOfferAmount.textContent = securedLoanMax.toLocaleString("en-US");
}

function handleSavingsSelect(id) {
  const data = savingsData[id];
  if (!data) return;
  demandMax = Math.max(0, data.max - (borrowMoreMode ? borrowMoreDebt : 0));
  const savingsSelect = document.getElementById("demand-savings");
  if (savingsSelect) savingsSelect.value = id;
  const savingsLabel = document.getElementById("demand-savings-label");
  if (savingsLabel)
    savingsLabel.textContent = `${data.account} - ${data.name}`;
  document.getElementById("demand-max").textContent =
    demandMax.toLocaleString("en-US") + " VND";
  document.getElementById("demand-rate").textContent =
    `${formatInterestRate(data.rate)}/năm`;
  document.getElementById("demand-end-date").textContent = data.endDate;
  document.getElementById("confirm-loan-rate").textContent =
    `${formatInterestRate(data.rate)}/năm`;
  document.getElementById("confirm-loan-end").textContent = data.endDate;
  document.getElementById("confirm-deposit-maturity").textContent = data.maturity;
  document.getElementById("confirm-collateral").textContent =
    `${data.account} - ${data.name}`;
  document.getElementById("contract-account").textContent = data.account;
  syncDemandAmount();
}
const demandInput = document.getElementById("demand-amount");
const demandErr = document.getElementById("demand-amount-err");
const demandNext = document.getElementById("btn-demand-next");
const savingsTrigger = document.getElementById("demand-savings-trigger");
const savingsSelect = document.getElementById("demand-savings");
const demandPlan = document.querySelector('#loan-demand [data-pick="plan"]');
const demandEquity = document.getElementById("demand-equity");
const disbursementAccounts = PAYMENT_ACCOUNTS.map((account) => ({
  ...account,
  type: "Tài khoản thanh toán",
  balance: `${account.balance} VND`,
}));
let selectedDisbursementAccount = PAYMENT_ACCOUNTS[1].number;
const disbursementTrigger = document.getElementById("demand-disburse-trigger");
const disbursementSheet = document.getElementById("sheetDisburseAccount");
const disbursementList = document.getElementById("demandAccountList");
function setBorrowMoreMode(enabled) {
  borrowMoreMode = enabled;
  const form = document.getElementById("loan-demand");
  form.classList.toggle("borrow-more", enabled);
  document.getElementById("demand-max-label").textContent = enabled
    ? "Hạn mức vay thêm tối đa"
    : "Số tiền vay tối đa";
  document.getElementById("confirm-loan-title").textContent = enabled
    ? "Xác nhận đăng ký vay thêm"
    : "Xác nhận đăng ký vay";
  document.getElementById("confirm-loan-amount-label").textContent = enabled
    ? "Số tiền vay thêm"
    : "Số tiền vay";
  savingsTrigger.disabled = enabled;
  savingsSelect.disabled = enabled;
  demandPlan.disabled = enabled;
  demandEquity.readOnly = enabled;
  demandEquity.setAttribute("aria-readonly", String(enabled));
  disbursementTrigger.disabled = enabled;
  [
    document.getElementById("savings-select-field"),
    demandPlan,
    document.getElementById("demand-equity-field"),
    disbursementTrigger,
  ].forEach((field) => field.classList.toggle("is-readonly", enabled));
}
function startBorrowMoreDemand() {
  const loan = document.querySelector(
    '#currentRecords .loan[data-detail="savings-pledge"]',
  );
  const debtText = loan?.querySelector(".loan-balance b")?.textContent || "";
  const savingsId = loan?.dataset.savingsId;
  const debt = Number(debtText.replace(/\D/g, ""));
  if (!loan || !savingsData[savingsId] || !Number.isFinite(debt) || debt <= 0) {
    console.error("Không thể xác định khoản vay cầm cố sổ tiết kiệm hiện tại.");
    toast("Không thể tải thông tin khoản vay hiện tại");
    return false;
  }
  borrowMoreDebt = debt;
  setBorrowMoreMode(true);
  handleSavingsSelect(savingsId);
  demandInput.value = "";
  syncDemandAmount();
  document.getElementById("confirm-agree").checked = false;
  document.getElementById("btn-confirm-loan").disabled = true;
  return true;
}
function closeDisbursementSheet(restoreFocus = false) {
  disbursementSheet.classList.remove("on");
  document.getElementById("scrim").classList.remove("on");
  disbursementTrigger.setAttribute("aria-expanded", "false");
  if (restoreFocus) disbursementTrigger.focus();
}
function openDisbursementSheet() {
  disbursementList.innerHTML = disbursementAccounts
    .map(
      (account) => `
        <button class="close-account-option ${selectedDisbursementAccount === account.id ? "on" : ""}" type="button" data-disbursement-account="${account.id}">
          <span class="ac-bank-icon"><img src="SeAMobile_logo.png" alt="" /></span>
          <span class="ac-body">
            <span class="ac-bal">${account.balance.replace(/\s*VND$/, "")} <span class="ac-unit">VND</span></span>
            <span class="ac-name">
              <span>${account.number}</span>
              <span class="ac-divider">|</span>
              <span>${account.type}</span>
            </span>
          </span>
          <span class="ac-check"><svg><use href="#check" /></svg></span>
        </button>`,
    )
    .join("");
  disbursementSheet.classList.add("on");
  document.getElementById("scrim").classList.add("on");
  disbursementTrigger.setAttribute("aria-expanded", "true");
}
disbursementTrigger.addEventListener("click", openDisbursementSheet);
document
  .getElementById("closeDisburseAccountSheet")
  .addEventListener("click", () => closeDisbursementSheet(true));
disbursementList.addEventListener("click", (event) => {
  const option = event.target.closest("[data-disbursement-account]");
  if (!option) return;
  selectedDisbursementAccount = option.dataset.disbursementAccount;
  document.getElementById("demand-disburse-value").textContent =
    selectedDisbursementAccount;
  document.getElementById("confirm-disburse-account").textContent =
    selectedDisbursementAccount;
  closeDisbursementSheet(true);
});
document
  .getElementById("scrim")
  .addEventListener("click", () => closeDisbursementSheet());
function openSavingsPickSheet() {
  const selectedId = document.getElementById("demand-savings").value;
  const savingsOptions = [
    {
      v: "s1",
      l: "000001105208",
      s: "Tiết kiệm lĩnh lãi cuối kỳ",
      balance: savingsData.s1.balance,
      selected: selectedId === "s1",
    },
    {
      v: "s2",
      l: "000002710195",
      s: "Tiết kiệm lĩnh lãi cuối kỳ",
      balance: savingsData.s2.balance,
      selected: selectedId === "s2",
    },
  ];
  openPickSheet("Tài sản bảo đảm", savingsOptions, (option) => {
    handleSavingsSelect(option.v);
  });
  const sheet = document.getElementById("sheetPick");
  sheet.classList.add("savings-pick");
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("aria-labelledby", "pkTitle");
  savingsTrigger.setAttribute("aria-expanded", "true");
}
savingsTrigger.addEventListener("click", openSavingsPickSheet);

function syncDemandAmount() {
  const n = +demandInput.value.replace(/\D/g, "") || 0;
  document.getElementById("demand-amount-words").textContent =
    n > 0 ? docSo(n) : "";
  const over = demandMax > 0 && n > demandMax;
  const belowMinimum = n > 0 && n < 10000000;
  const noRemainingLimit = borrowMoreMode && demandMax <= 0;
  const invalid = belowMinimum || over || noRemainingLimit;
  demandErr.hidden = !invalid;
  demandErr.textContent = noRemainingLimit
    ? "Khoản vay hiện tại không còn hạn mức vay thêm"
    : belowMinimum
      ? "Số tiền vay tối thiểu là 10,000,000đ"
    : over
        ? (borrowMoreMode
            ? "Hạn mức vay thêm tối đa là "
            : "Số tiền vay tối đa là ") +
          demandMax.toLocaleString("en-US") +
          " VND"
        : "";
  demandInput.setAttribute("aria-invalid", String(invalid));
  demandInput.closest(".fld").classList.toggle("is-error", invalid);
  demandNext.disabled = n < 10000000 || over || noRemainingLimit;
  // đồng bộ số tiền người dùng nhập sang màn Xác nhận & Hợp đồng
  const txt = demandInput.value || "0";
  document.getElementById("confirm-loan-amount").textContent = txt + " VND";
  document.getElementById("confirm-loan-total").textContent = txt + " VND";
  document.getElementById("contract-loan-amount").textContent = txt;
}
demandInput.addEventListener("input", () => {
  const d = demandInput.value
    .replace(/\D/g, "")
    .replace(/^0+/, "")
    .slice(0, 12);
  demandInput.value = d ? (+d).toLocaleString("en-US") : "";
  syncDemandAmount();
});
document
  .getElementById("confirm-agree")
  .addEventListener("change", function () {
    document.getElementById("btn-confirm-loan").disabled = !this.checked;
  });
function startBiometric() {
  const circle = document.getElementById("bio-circle");
  const text = document.getElementById("bio-text");
  const sub = document.getElementById("bio-sub");
  circle.className = "bio-circle loading";
  text.textContent = "Đang ghi nhận khuôn mặt";
  sub.textContent = "Nhìn thẳng vào camera và giữ yên điện thoại.";
  sub.style.display = "block";
  setTimeout(() => {
    circle.className = "bio-circle success";
    text.textContent = "";
    sub.style.display = "none";
    circle.innerHTML =
      '<svg style="width:80px;height:80px;color:#22b35e"><use href="#check"/></svg>';
    setTimeout(() => navigateTo("otp"), 1000);
  }, 2000);
}
let otpValue = "";
const otpBoxes = document.querySelectorAll(".otp-box");
const keypad = document.getElementById("keypad");
const otpCountdown = document.getElementById("otp-countdown");
let otpCountdownTimer = null;
function startOtpCountdown() {
  clearInterval(otpCountdownTimer);
  let seconds = 59;
  otpCountdown.textContent = String(seconds);
  otpCountdownTimer = setInterval(() => {
    seconds -= 1;
    otpCountdown.textContent = String(seconds);
    if (seconds <= 0) {
      clearInterval(otpCountdownTimer);
      otpCountdownTimer = null;
    }
  }, 1000);
}
function updateOtpUI() {
  otpBoxes.forEach((box, idx) => {
    box.textContent = otpValue[idx] ? "•" : "";
    box.classList.toggle("filled", !!otpValue[idx]);
  });
}
const otpProcessing = document.getElementById("otp-processing");
let otpProcessingTimer = null;
function completeOtpProcessing() {
  if (!otpProcessing || !otpProcessing.hidden) return;
  otpProcessing.hidden = false;
  otpProcessingTimer = setTimeout(() => {
    otpProcessing.hidden = true;
    otpProcessingTimer = null;
    navigateTo("final-success");
  }, 1400);
}
keypad.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn || !otpProcessing.hidden) return;
  const val = btn.textContent;
  if (val === "⌫") otpValue = otpValue.slice(0, -1);
  else if (val >= "0" && val <= "9" && otpValue.length < 4) otpValue += val;
  updateOtpUI();
  if (otpValue.length === 4) completeOtpProcessing();
});
const stars = document.querySelectorAll("#rating-stars svg");
let selectedStar = 0;
// Pop-up lời cảm ơn sau khi người dùng chọn số sao
const rateThanks = document.getElementById("rate-thanks");
const rateThanksClose = document.getElementById("rate-thanks-close");
function closeRateThanks() {
  rateThanks.hidden = true;
}
stars.forEach((star) => {
  star.addEventListener("click", () => {
    selectedStar = parseInt(star.dataset.star);
    stars.forEach((s, idx) => s.classList.toggle("active", idx < selectedStar));
    rateThanks.hidden = false;
    rateThanksClose.focus();
  });
});
rateThanksClose.addEventListener("click", closeRateThanks);
rateThanks.addEventListener("click", (e) => {
  if (e.target === rateThanks) closeRateThanks(); // bấm ra ngoài hộp thoại
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !rateThanks.hidden) closeRateThanks();
});
const originalNavigateTo = navigateTo;
navigateTo = function (id, push) {
  originalNavigateTo(id, push);
  if (id === "biometric") startBiometric();
  if (id === "otp") {
    otpValue = "";
    updateOtpUI();
    startOtpCountdown();
  } else {
    clearInterval(otpCountdownTimer);
    otpCountdownTimer = null;
  }
};

const CASES = {
  1: {
    desc: "KVHH (✗), HSVV (✗), PDT (✗)",
    start: "loan",
    activeTab: null,
    promo: false,
    pending: false,
    current: false,
  },
  2: {
    desc: "KVHH (✗), HSVV (✗), PDT (✔)",
    start: "loan",
    activeTab: null,
    promo: true,
    pending: false,
    current: false,
  },
  3: {
    desc: "KVHH (✗), HSVV (✔), PDT (✗)",
    start: "profile",
    activeTab: "1",
    promo: false,
    pending: true,
    current: false,
  },
  4: {
    desc: "KVHH (✗), HSVV (✔), PDT (✔)",
    start: "profile",
    activeTab: "1",
    promo: true,
    pending: true,
    current: false,
  },
  5: {
    desc: "KVHH (✔), HSVV (✗), PDT (✗)",
    start: "profile",
    activeTab: "2",
    promo: false,
    pending: false,
    current: true,
  },
  6: {
    desc: "KVHH (✔), HSVV (✗), PDT (✔)",
    start: "profile",
    activeTab: "2",
    promo: true,
    pending: false,
    current: true,
  },
  7: {
    desc: "KVHH (✔), HSVV (✔), PDT (✗)",
    start: "profile",
    activeTab: "2",
    promo: false,
    pending: true,
    current: true,
  },
  8: {
    desc: "KVHH (✔), HSVV (✔), PDT (✔)",
    start: "profile",
    activeTab: "2",
    promo: true,
    pending: true,
    current: true,
  },
};
const caseModal = document.getElementById("caseModal");
const caseList = document.getElementById("caseList");
let currentCase = 1;
function colorDesc(text) {
  return text
    .replace(/(\S+)\s*\(✔\)/g, '<span class="cond-ok">$1 (✔)</span>')
    .replace(/(\S+)\s*\(✗\)/g, '<span class="cond-no">$1 (✗)</span>');
}
function renderCaseList() {
  caseList.innerHTML = Object.entries(CASES)
    .map(
      ([k, c]) => `
    <label class="case-opt">
      <input type="radio" name="case" value="${k}" ${+k === currentCase ? "checked" : ""}>
      <div>
        <b>Trường hợp ${k}</b>
        <span>${colorDesc(c.desc)}</span>
      </div>
    </label>
  `,
    )
    .join("");
}
/* Mở / đóng modal */
function openCaseModal() {
  renderCaseList();
  caseModal.classList.add("on");
}
function closeCaseModal() {
  caseModal.classList.remove("on");
}

document.getElementById("caseClose").addEventListener("click", closeCaseModal);
document.getElementById("caseBg").addEventListener("click", closeCaseModal);
/* Áp dụng case đã chọn */
document.getElementById("caseApply").addEventListener("click", () => {
  const sel = document.querySelector('input[name="case"]:checked');
  if (!sel) return;
  currentCase = +sel.value;
  applyCase(currentCase);
  closeCaseModal();
  toast("Đã áp dụng Trường hợp " + currentCase);
});
function applyCase(num) {
  const c = CASES[num];
  if (!c) return;
  /* 1) Reset history & điều hướng về màn hình bắt đầu */
  loanNavEnabled = true;
  historyStack = ["home", c.start];
  render(c.start);
  /* 2) Trạng thái tab trên Hồ sơ & Khoản vay
              - Lưu vào biến toàn cục để handler click tab biết
                phải giữ tab nào khi user bấm nav "Hồ sơ & Khoản vay". */
  caseOverridesTab = c.activeTab;
  if (c.activeTab) {
    setTab(c.activeTab);
  } else {
    // Case 1, 2: không có tab active đặc biệt → mặc định tab 1
    setTab("1");
  }
  /* 3) Hiển thị promo theo cấu hình của từng case */
  document.getElementById("profilePromo").style.display = c.promo ? "" : "none";
  /* 4) Bản ghi "Hồ sơ đang đề nghị" */
  document.getElementById("pendingRecords").style.display = c.pending
    ? ""
    : "none";
  document.getElementById("pendingEmpty").style.display = c.pending
    ? "none"
    : "";
  /* 5) Bản ghi "Khoản vay hiện tại" */
  document.getElementById("currentRecords").style.display = c.current
    ? ""
    : "none";
  document.getElementById("currentEmpty").style.display = c.current
    ? "none"
    : "";
  /* 6) Cập nhật badge số lượng trên tab */
  const bp = document.getElementById("tabBadgePending");
  const bc = document.getElementById("tabBadgeCurrent");
  if (bp) bp.style.display = c.pending ? "" : "none";
  if (bc) bc.style.display = c.current ? "" : "none";
  const hasPDT = /PDT \(✔\)/.test(c.desc); // case 2, 4, 6, 8
  document.getElementById("preApproved").hidden = !hasPDT;
  document.getElementById("allProdsTitle").hidden = !hasPDT;
  document.getElementById("loan").classList.toggle("no-pre-approved", !hasPDT);
  if (window.cfRefresh) cfRefresh();
}
function updateTabBadges() {
  const pCount = document.querySelectorAll("#pendingRecords .acc").length;
  const cCount = document.querySelectorAll("#currentRecords .loan").length;
  const bp = document.getElementById("tabBadgePending");
  const bc = document.getElementById("tabBadgeCurrent");
  if (bp) bp.textContent = pCount;
  if (bc) bc.textContent = cCount;
}

updateTabBadges();
(function syncTotalAndPromo() {
  const loanEl = document.getElementById("loan");
  const totalEl = document.getElementById("totalAmount");
  const promoEl = document.getElementById("promoAmount");
  if (!loanEl || !totalEl || !promoEl) return;
  // Cache lại để phòng vòng lặp vô hạn do observer lắng nghe chính nó
  let lastTotal = null;
  function updateTotal() {
    // Cộng dồn mọi .amt trong .card.offer
    let sum = 0;
    loanEl.querySelectorAll(".card.offer .amt").forEach((el) => {
      const digits = el.textContent.replace(/\D/g, ""); // bỏ dấu phẩy, chữ "đ"
      if (digits) sum += +digits;
    });
    // Nếu giá trị không đổi → thoát, tránh trigger observer lần 2
    if (sum === lastTotal) return;
    lastTotal = sum;
    // Cập nhật card total (giữ nguyên thẻ <u>đ</u>)
    totalEl.innerHTML =
      sum.toLocaleString("en-US") + ' <u style="font-size:14px">VND</u>';
    // Cập nhật promo — luôn khớp với total
    promoEl.textContent = sum.toLocaleString("en-US") + " VND";
  }
  // Chạy lần đầu khi load
  updateTotal();
  // Theo dõi #loan: khi thêm/xoá offer hoặc đổi số tiền trong .amt
  new MutationObserver(updateTotal).observe(loanEl, {
    childList: true,
    subtree: true,
    characterData: true,
  });
})();

/* --- Offer info descriptions toggle only on click --- */
(() => {
  const closeAll = () => {
    document.querySelectorAll(".cf-card.offer.desc-open").forEach((card) => {
      card.classList.remove("desc-open");
      card.querySelector(".info-btn")?.setAttribute("aria-expanded", "false");
    });
  };
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".cf-card.offer .info-btn");
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest(".cf-card.offer");
      const wasOpen = card.classList.contains("desc-open");
      closeAll();
      if (!wasOpen) {
        card.classList.add("desc-open");
        btn.setAttribute("aria-expanded", "true");
      }
      return;
    }
    if (!e.target.closest(".cf-card.offer .cf-desc")) closeAll();
  });
  const loan = document.getElementById("loan");
  if (loan) loan.addEventListener("scroll", closeAll, { passive: true });
})();

/* --- Contract Bottom Sheet overlay logic - keep confirm-loan as background --- */
(() => {
  const sheet = document.getElementById("contractSheet");
  const scrim = document.getElementById("contractScrim");
  const closeBtn = document.getElementById("contractCloseBtn");
  const content = document.getElementById("contract-content");
  const agree = document.getElementById("contract-agree");
  const hint = document.getElementById("contract-hint");
  const btn = document.getElementById("btn-contract");
  if (!sheet || !scrim) return;
  let readDone = false;
  window.openContractSheet = function () {
    readDone = false;
    if (agree) {
      agree.disabled = true;
      agree.checked = false;
    }
    if (btn) btn.disabled = true;
    if (hint) hint.style.display = "block";
    if (content) content.scrollTop = 0;
    sheet.classList.add("on");
    scrim.classList.add("on");
  };
  window.closeContractSheet = function () {
    sheet.classList.remove("on");
    scrim.classList.remove("on");
  };
  scrim.addEventListener("click", closeContractSheet);
  if (closeBtn) closeBtn.addEventListener("click", closeContractSheet);
  if (content) {
    content.addEventListener("scroll", function () {
      if (
        this.scrollTop + this.clientHeight >= this.scrollHeight - 12 &&
        !readDone
      ) {
        readDone = true;
        if (agree) agree.disabled = false;
        if (hint) hint.style.display = "none";
      }
    });
  }
  if (agree) {
    agree.addEventListener("change", function () {
      if (btn) btn.disabled = !this.checked;
    });
  }
  if (btn) {
    btn.addEventListener("click", function () {
      closeContractSheet();
      // navigate to biometric after confirm
      const target = document.getElementById("biometric");
      if (target) {
        // use existing navigateTo if available
        if (typeof navigateTo === "function") navigateTo("biometric");
        else if (typeof render === "function") render("biometric");
      }
    });
  }
})();
/* ===== Luồng Thấu chi ===== */
(() => {
  const $i = (id) => document.getElementById(id);
  const f = (n) => Math.round(n).toLocaleString("en-US");
  const pad = (n) => String(n).padStart(2, "0");
  const dm = (d) =>
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const dig = (v) => String(v).replace(/\D/g, "");
  const esc = (s) =>
    s.replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  // Tham số mock — chỉnh tại đây. Mặc định (100tr, 12 tháng) khớp đúng số trong ảnh thiết kế.
  const OD = {
    max: 100000000,
    rate: 12,
    openFee: 0.0011,
    mgmtFee: 0.0033,
    payDay: 5,
  };
  let transactionDate = new Date();
  let selectedInterestAccount = PAYMENT_ACCOUNTS[1];
  let limit = 100000000;
  const RELS = [
    "Bố/Mẹ",
    "Anh/Chị/Em ruột",
    "Vợ/Chồng",
    "Bạn bè/Đồng nghiệp",
    "Người thân khác",
  ];
  Object.assign(PICKS, {
    odRel1: { t: "Mối quan hệ", o: RELS },
    odRel2: { t: "Mối quan hệ", o: RELS },
    odBranch: {
      t: "Chi nhánh",
      o: [
        "CN Hà Nội",
        "CN Cầu Giấy",
        "CN Hồ Chí Minh",
        "CN Đà Nẵng",
        "CN Hải Phòng",
      ],
    },
  });
  /* --- Nơi ở hiện tại: dùng chung hành vi địa chỉ với màn Đăng ký vay --- */
  const addrEdit = initAddrEdit({
    addr: $i("od-addr"),
    cancel: $i("od-addr-cancel"),
    prov: "odProvince",
    ward: "odWard",
    keepPickersUnlocked: true,
  });
  let term = 12;
  const amt = () => +dig($i("od-amt").value);
  const payDaySheet = $i("odPayDaySheet");
  const payDayCalendar = $i("odPayDayCalendar");
  const payDayScrim = $i("odPayDayScrim");
  function renderPayDayCalendar() {
    const monthStart = new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth(),
      1,
    );
    const daysInMonth = new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth() + 1,
      0,
    ).getDate();
    const startOffset = (monthStart.getDay() + 6) % 7;
    $i("odPayDayMonth").textContent = transactionDate.toLocaleDateString(
      "vi-VN",
      { month: "long", year: "numeric" },
    );
    payDayCalendar.innerHTML =
      ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
        .map((day) => `<span class="od-pay-day-weekday">${day}</span>`)
        .join("") +
      Array.from(
        { length: startOffset },
        () => '<span aria-hidden="true"></span>',
      ).join("") +
      Array.from(
        { length: daysInMonth },
        (_, index) => {
          const day = index + 1;
          return `<button type="button" class="od-pay-day-option${day === OD.payDay ? " is-selected" : ""}" data-pay-day="${day}" aria-label="Ngày ${day}" aria-pressed="${day === OD.payDay}">${day}</button>`;
        },
      ).join("");
  }
  function togglePayDaySheet(open) {
    payDaySheet.classList.toggle("on", open);
    payDaySheet.setAttribute("aria-hidden", String(!open));
    payDayScrim.classList.toggle("on", open);
    $i("od-pay-day").setAttribute("aria-expanded", String(open));
  }
  window.closeOdPayDaySheet = () => {
    const wasOpen = payDaySheet.classList.contains("on");
    togglePayDaySheet(false);
    if (wasOpen) $i("od-pay-day").focus();
    return wasOpen;
  };
  $i("od-pay-day").addEventListener("click", () => {
    renderPayDayCalendar();
    togglePayDaySheet(true);
  });
  $i("odPayDayClose").addEventListener("click", () =>
    window.closeOdPayDaySheet(),
  );
  payDayScrim.addEventListener("click", () => window.closeOdPayDaySheet());
  payDayCalendar.addEventListener("click", (event) => {
    const option = event.target.closest("[data-pay-day]");
    if (!option) return;
    OD.payDay = Number(option.dataset.payDay);
    $i("od-pay-day-value").textContent = String(OD.payDay);
    window.closeOdPayDaySheet();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") window.closeOdPayDaySheet();
  });
  function renderInterestAccounts() {
    $i("odInterestAccountList").innerHTML = PAYMENT_ACCOUNTS.map(
      (account) => `
        <button class="close-account-option ${selectedInterestAccount.number === account.number ? "on" : ""}" type="button" data-od-interest-account="${account.number}" aria-pressed="${selectedInterestAccount.number === account.number}">
          <span class="ac-bank-icon"><img src="SeAMobile_logo.png" alt="" /></span>
          <span class="ac-body">
            <span class="ac-bal">${account.balance} <span class="ac-unit">VND</span></span>
            <span class="ac-name"><span>${account.number}</span><span class="ac-divider">|</span><span>Tài khoản thanh toán</span></span>
          </span>
          <span class="ac-check"><svg><use href="#check" /></svg></span>
        </button>`,
    ).join("");
  }
  function toggleInterestAccountSheet(open) {
    $i("odInterestAccountSheet").classList.toggle("on", open);
    $i("odInterestAccountScrim").classList.toggle("on", open);
    $i("od-interest-account").setAttribute("aria-expanded", String(open));
  }
  window.closeOdInterestAccountSheet = () => {
    const wasOpen = $i("odInterestAccountSheet").classList.contains("on");
    toggleInterestAccountSheet(false);
    return wasOpen;
  };
  $i("od-interest-account").addEventListener("click", () => {
    renderInterestAccounts();
    toggleInterestAccountSheet(true);
  });
  $i("odInterestAccountClose").addEventListener("click", () =>
    toggleInterestAccountSheet(false),
  );
  $i("odInterestAccountScrim").addEventListener("click", () =>
    toggleInterestAccountSheet(false),
  );
  $i("odInterestAccountList").addEventListener("click", (event) => {
    const option = event.target.closest("[data-od-interest-account]");
    if (!option) return;
    const account = PAYMENT_ACCOUNTS.find(
      (item) => item.number === option.dataset.odInterestAccount,
    );
    if (!account) return;
    selectedInterestAccount = account;
    $i("od-interest-account-value").textContent = account.number;
    $i("od-interest-account").setAttribute(
      "aria-label",
      `Tài khoản thu lãi phí ${account.number}`,
    );
    toggleInterestAccountSheet(false);
    $i("od-interest-account").focus();
  });
  document.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest('[data-go="od-demand"]');
      const a =
        b && b.closest(".offer") && b.closest(".offer").querySelector(".amt");
      if (a) limit = +dig(a.textContent) || limit;
    },
    true,
  );
  /* --- Thông tin thanh toán tạm tính --- */
  function upd() {
    const a = amt();
    const overLimit = a > limit;
    const amountField = $i("od-amt").closest(".od-demand-amount");
    const amountError = $i("od-amt-error");
    amountField.classList.toggle("is-error", overLimit);
    amountError.hidden = !overLimit;
    amountError.textContent = overLimit
      ? "Số tiền tối đa là " + f(limit) + " VND"
      : "";
    $i("od-pay").innerHTML = [
      ["Lãi suất vay", `${formatInterestRate(OD.rate)}/năm`],
      ["Phí mở hạn mức", f(a * OD.openFee) + " <small>VND</small>"],
      [
        "Phí quản lý tài khoản thấu chi",
        f(a * OD.mgmtFee) + " <small>VND</small>",
      ],
      [
        "Lãi trả hàng tháng",
        f((a * OD.rate * 30) / (365 * 100)) + " <small>VND</small>",
      ],
    ]
      .map(([l, v]) => `<div class="od-row"><span>${l}</span><b>${v}</b></div>`)
      .join("");
  }
  ["od-amt", "od-eq"].forEach((id) =>
    $i(id).addEventListener("input", (e) => {
      const d = dig(e.target.value)
        .replace(/^0+(?=\d)/, "")
        .slice(0, 12);
      e.target.value = d ? (+d).toLocaleString("en-US") : "";
      upd();
    }),
  );
  ["od-p1", "od-p2"].forEach((id) =>
    $i(id).addEventListener("input", (e) => {
      e.target.value = dig(e.target.value)
        .slice(0, 10)
        .replace(/(\d{3})(\d{1,3})?(\d{1,4})?/, (m, a, b, c) =>
          [a, b, c].filter(Boolean).join(" "),
        );
    }),
  );

  /* --- Sheet Kỳ hạn (1–12 tháng) --- */
  const tg = $i("od-term-grid");
  tg.innerHTML = Array.from(
    { length: 12 },
    (_, i) => `<button data-t="${i + 1}">${i + 1} tháng</button>`,
  ).join("");
  const termSheet = (on) => {
    $i("sheetTerm").classList.toggle("on", on);
    $i("scrim").classList.toggle("on", on);
  };
  $i("od-term-btn").onclick = () => {
    [...tg.children].forEach((b) =>
      b.classList.toggle("on", +b.dataset.t === term),
    );
    termSheet(true);
  };
  $i("od-term-close").onclick = () => termSheet(false);
  $i("scrim").addEventListener("click", () => termSheet(false));
  tg.onclick = (e) => {
    const b = e.target.closest("[data-t]");
    if (!b) return;
    term = +b.dataset.t;
    $i("od-term-val").textContent = term + " tháng";
    termSheet(false);
  };

  /* --- Reset dữ liệu mỗi lần vào luồng --- */
  function reset() {
    transactionDate = new Date();
    OD.payDay = 5;
    $i("od-pay-day-value").textContent = String(OD.payDay);
    togglePayDaySheet(false);
    term = 12;
    $i("od-term-val").textContent = "12 tháng";
    selectedInterestAccount = PAYMENT_ACCOUNTS[1];
    $i("od-interest-account-value").textContent = selectedInterestAccount.number;
    $i("od-interest-account").setAttribute("aria-label", "Tài khoản thu lãi phí");
    toggleInterestAccountSheet(false);
    $i("od-amt").value = f(limit);
    $i("od-eq").value = "0";
    upd();
    $i("od-p1").value = "099 888 9999";
    $i("od-p2").value = "098 765 4322";
    $i("od-addr").value = "25 Trần Hưng Đạo";
    $i("od-ref1").value = $i("od-ref2").value = "";
    setPickVal("odRel1", RELS[0]);
    setPickVal("odRel2", RELS[2]);
    setPickVal("odBranch", "CN Hà Nội");
    setPickVal("odProvince", "TP. Hà Nội");
    setPickVal("odWard", "Phường Hoàn Kiếm");
    addrEdit.reset();
    $i("oc-agree").checked = false;
    $i("oc-btn").disabled = true;
  }

  /* --- Tiếp tục: validate --- */
  $i("od-next1").onclick = () => {
    const a = amt();
    if (!a) return toast("Vui lòng nhập số tiền");
    if (a > limit) return;
    if (!$i("od-eq").value) return toast("Vui lòng nhập vốn tự có");
    navigateTo("od-profile");
  };
  $i("od-next2").onclick = () => {
    const p = ["od-p1", "od-p2"].map((i) => dig($i(i).value));
    if (!p.every((x) => /^0\d{9}$/.test(x)))
      return toast(
        "Vui lòng nhập số điện thoại người tham chiếu hợp lệ (10 số)",
      );
    if (p[0] === p[1])
      return toast("Hai số điện thoại tham chiếu không được trùng nhau");
    if (!$i("od-addr").value.trim())
      return toast("Vui lòng nhập nơi ở hiện tại");
    if (
      !document.querySelector('[data-pick="odProvince"]').dataset.val ||
      !document.querySelector('[data-pick="odWard"]').dataset.val
    )
      return toast("Vui lòng chọn Tỉnh/Thành phố và Xã/Phường");
    navigateTo("od-confirm");
  };

  /* --- Màn Xác nhận thông tin --- */
  function fillConfirm() {
    const a = amt(),
      now = new Date(transactionDate),
      end = new Date(now);
    end.setMonth(end.getMonth() + term);
    const phones = ["od-p1", "od-p2"].map((i) => dig($i(i).value));
    const formatAddress = (detail, ward, province) =>
      [detail.trim().replace(/[,.\s]+$/, ""), ward, province]
        .filter(Boolean)
        .join(", ");
    const permanentAddress = formatAddress(
      "25 Trần Hưng Đạo",
      "Phường Hoàn Kiếm",
      "TP. Hà Nội",
    );
    const currentAddress = formatAddress(
      $i("od-addr").value,
      document.querySelector('[data-pick="odWard"]').dataset.val,
      document.querySelector('[data-pick="odProvince"]').dataset.val,
    );
    const card = (t, r) =>
      `<div class="dcard">${t ? `<h3>${t}</h3>` : ""}${r.map(([l, v]) => `<div class="confirm-row"><span>${l}</span><b>${v}</b></div>`).join("")}</div>`;
    $i("oc-cards").innerHTML =
      card("Thông tin khách hàng", [
        ["Họ và tên", CUSTOMER_PROFILE.name],
        ["Số giấy tờ tùy thân", CUSTOMER_PROFILE.identityNumber],
        ["Ngày cấp", "18/02/2022"],
        ["Nơi cấp", "Bộ Công an"],
        ["Số điện thoại", CUSTOMER_PROFILE.phone],
        ["Email", "nguyenminhngoc@gmail.com"],
        ["Địa chỉ thường trú", esc(permanentAddress)],
        [
          "Nơi ở hiện tại",
          esc(currentAddress),
        ],
        ["Số điện thoại người tham chiếu", phones.join("<br>")],
      ]) +
      card("Thông tin khoản vay", [
        ["Mục đích vay", "Tiêu dùng phục vụ đời sống"],
        ["Hạn mức vay", f(a) + " VND"],
        ["Thời hạn vay", term + " tháng"],
        ["Lãi suất vay", `${formatInterestRate(OD.rate)}/năm`],
        ["Tài khoản trả lãi", selectedInterestAccount.number],
        [
          "Tài khoản trả gốc",
          "Tài khoản thấu chi do SeABank mở cho Khách hàng",
        ],
        ["Ngày trả lãi hàng tháng", `Ngày ${OD.payDay} hàng tháng`],
        ["Ngày trả gốc", dm(end)],
      ]) +
      card("Thông tin khác", [
        ["Phí mở hạn mức thấu chi", f(a * OD.openFee) + " VND"],
        ["Phí quản lý hạn mức thấu chi", f(a * OD.mgmtFee) + " VND"],
        ["Tài khoản trả phí", selectedInterestAccount.number],
        ["Kênh nhận thông báo", "Tin nhắn SMS"],
        ["Ngày đề nghị vay", dm(now)],
      ]);
    $i("od-confirm").scrollTop = 0;
  }
  $i("oc-agree").onchange = (e) => ($i("oc-btn").disabled = !e.target.checked);

  /* --- Sheet Điều khoản & điều kiện → sinh trắc học → OTP → thành công (luồng cũ) --- */
  const sh = $i("odSheet"),
    sc = $i("odScrim"),
    ct = $i("od-content"),
    ag = $i("od-agree"),
    ok = $i("od-ok"),
    hint = $i("od-hint");
  const unlock = () => {
    ag.disabled = false;
    hint.style.display = "none";
  };
  $i("oc-btn").onclick = () => {
    ag.checked = false;
    ag.disabled = true;
    ok.disabled = true;
    hint.style.display = "block";
    ct.scrollTop = 0;
    sh.classList.add("on");
    sc.classList.add("on");
    setTimeout(() => {
      if (ct.scrollHeight <= ct.clientHeight + 12) unlock();
    }, 400);
  };
  window.closeOdTerms = () => {
    const was = sh.classList.contains("on");
    sh.classList.remove("on");
    sc.classList.remove("on");
    return was;
  };
  ct.addEventListener("scroll", () => {
    if (ct.scrollTop + ct.clientHeight >= ct.scrollHeight - 12) unlock();
  });
  ag.onchange = () => (ok.disabled = !ag.checked);
  $i("odClose").onclick = sc.onclick = () => window.closeOdTerms();
  ok.onclick = () => {
    window.closeOdTerms();
    navigateTo("biometric");
  };

  /* --- Hook điều hướng --- */
  /* --- Hook điều hướng --- */
  const _nav = navigateTo;
  navigateTo = function (id, push) {
    _nav(id, push);
    if (id === "od-demand") reset();
    if (id === "od-confirm") fillConfirm();
    if (id === "od-profile") {
      $i("od-profile").querySelector(".od-body").scrollTop = 0;
      requestAnimationFrame(addrEdit.fit);
    }
  };
  reset();
})();

(() => {
  const $i = (id) => document.getElementById(id);
  const f = (n) => Math.round(n).toLocaleString("en-US");
  const dig = (v) => String(v).replace(/\D/g, "");
  const pad = (n) => String(n).padStart(2, "0");
  const dm = (d) =>
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

  // Hạn mức hiện tại = số tiền giải ngân trừ dư nợ hiện tại.
  const INC = {
    acc: "000001234567",
    disbursed: 100000000,
    debt: 50000000,
    min: 10000000,
    max: 80000000,
    rate: 20.39,
    fee: 110000,
    opened: "03/04/2026",
    expires: "03/04/2027",
  };
  let cur = {
    acc: INC.acc,
    disbursed: INC.disbursed,
    debt: INC.debt,
    limit: Math.max(0, INC.disbursed - INC.debt),
    min: INC.min,
    max: INC.max,
    rate: INC.rate,
  };
  let incFlow = false;
  let incTransactionDate = "";
  let selectedIncFeeAccount = "";

  const vnDigits = [
    "không",
    "một",
    "hai",
    "ba",
    "bốn",
    "năm",
    "sáu",
    "bảy",
    "tám",
    "chín",
  ];
  const vnGroups = ["", "nghìn", "triệu", "tỷ"];
  function readIncGroup(value, forceHundreds) {
    const hundred = Math.floor(value / 100);
    const ten = Math.floor((value % 100) / 10);
    const one = value % 10;
    const words = [];
    if (hundred || forceHundreds) words.push(vnDigits[hundred], "trăm");
    if (ten > 1) {
      words.push(vnDigits[ten], "mươi");
      if (one === 1) words.push("mốt");
      else if (one === 5) words.push("lăm");
      else if (one) words.push(vnDigits[one]);
    } else if (ten === 1) {
      words.push("mười");
      if (one === 5) words.push("lăm");
      else if (one) words.push(vnDigits[one]);
    } else if (one) {
      if (hundred || forceHundreds) words.push("lẻ");
      words.push(vnDigits[one]);
    }
    return words.join(" ");
  }
  function incAmountInWords(value) {
    let remaining = Math.floor(Number(value) || 0);
    if (!remaining) return "Không đồng";
    const groups = [];
    while (remaining > 0) {
      groups.push(remaining % 1000);
      remaining = Math.floor(remaining / 1000);
    }
    const words = groups
      .map((group, index) =>
        group
          ? `${readIncGroup(group, index < groups.length - 1)} ${vnGroups[index] || "tỷ"}`.trim()
          : "",
      )
      .filter(Boolean)
      .reverse()
      .join(" ");
    return `${words.charAt(0).toLocaleUpperCase("vi-VN")}${words.slice(1)} đồng`;
  }
  function updateIncAmount() {
    const amount = +dig($i("inc-amt").value);
    const overMax = amount > cur.max;
    $i("inc-error").hidden = !overMax;
    $i("inc-amount-card").classList.toggle("is-invalid", overMax);
    $i("inc-amt").setAttribute("aria-invalid", String(overMax));
    $i("inc-max-error").textContent = f(cur.max);
    $i("inc-words").textContent = amount ? incAmountInWords(amount) : "";
    $i("inc-next").disabled = overMax;
  }

  /* --- Nối nút "Tăng hạn mức" của mọi khoản vay thấu chi ở Khoản vay hiện tại --- */
  document.querySelectorAll("#currentRecords .loan").forEach((c) => {
    if (!/thấu chi/i.test(c.querySelector(".t").textContent)) return;
    const b = c.querySelector(".btns .pri");
    if (!b) return;
    b.removeAttribute("data-soon");
    b.dataset.go = "od-inc-demand";
  });
  // capture: chạy trước handler điều hướng để biết đang bấm từ khoản vay nào
  document.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest('.loan .btns [data-go="od-inc-demand"]');
      if (!b) return;
      const c = b.closest(".loan"),
        d = c.dataset;
      const disbursed = Number.isFinite(+d.disbursed)
        ? +d.disbursed
        : INC.disbursed;
      const debt = Number.isFinite(+d.debt) ? +d.debt : INC.debt;
      cur = {
        acc: dig(c.querySelector(".no").textContent) || cur.acc,
        disbursed,
        debt,
        min: +d.min || INC.min,
        max: +d.max || INC.max,
        rate: +d.rate || INC.rate,
      };
      cur.limit = Math.max(0, cur.disbursed - cur.debt);
    },
    true,
  );

  function toggleIncFeeAccountSheet(open) {
    $i("incFeeAccountSheet").classList.toggle("on", open);
    $i("incFeeAccountScrim").classList.toggle("on", open);
    $i("inc-fee-account-picker").setAttribute("aria-expanded", String(open));
  }
  function renderIncFeeAccountOptions() {
    $i("incFeeAccountList").innerHTML = PAYMENT_ACCOUNTS.map(
      (account) => `
        <button class="close-account-option ${selectedIncFeeAccount === account.number ? "on" : ""}" type="button" data-inc-fee-account="${account.number}">
          <span class="ac-bank-icon"><img src="SeAMobile_logo.png" alt="" /></span>
          <span class="ac-body">
            <span class="ac-bal">${account.balance} <span class="ac-unit">VND</span></span>
            <span class="ac-name"><span>${account.number}</span><span class="ac-divider">|</span><span>Tài khoản thanh toán</span></span>
          </span>
          <span class="ac-check"><svg><use href="#check" /></svg></span>
        </button>`,
    ).join("");
  }
  window.closeIncFeeAccountSheet = () => {
    const wasOpen = $i("incFeeAccountSheet").classList.contains("on");
    toggleIncFeeAccountSheet(false);
    return wasOpen;
  };
  $i("inc-fee-account-picker").addEventListener("click", () => {
    renderIncFeeAccountOptions();
    toggleIncFeeAccountSheet(true);
  });
  $i("incFeeAccountClose").addEventListener("click", () =>
    toggleIncFeeAccountSheet(false),
  );
  $i("incFeeAccountScrim").addEventListener("click", () =>
    toggleIncFeeAccountSheet(false),
  );
  $i("incFeeAccountList").addEventListener("click", (event) => {
    const option = event.target.closest("[data-inc-fee-account]");
    if (!option) return;
    const account = PAYMENT_ACCOUNTS.find(
      (item) => item.number === option.dataset.incFeeAccount,
    );
    if (!account) return;
    selectedIncFeeAccount = account.number;
    $i("inc-fee-account-value").textContent = account.number;
    $i("inc-fee-account-picker").setAttribute(
      "aria-label",
      `Tài khoản thu phí ${account.number}`,
    );
    toggleIncFeeAccountSheet(false);
  });

  /* --- Màn Thay đổi hạn mức --- */
  function reset() {
    incTransactionDate = "";
    selectedIncFeeAccount = "";
    $i("inc-fee-account-value").textContent = "Tài khoản thu phí";
    $i("inc-fee-account-picker").setAttribute("aria-label", "Tài khoản thu phí");
    toggleIncFeeAccountSheet(false);
    $i("inc-acc").textContent = cur.acc;
    $i("inc-other-acc").textContent = cur.acc;
    $i("inc-cur").textContent = f(cur.limit);
    $i("inc-max").textContent = f(cur.max);
    $i("inc-rate").textContent = `${formatInterestRate(cur.rate)}/năm`;
    $i("inc-max-error").textContent = f(cur.max);
    $i("inc-amt").value = f(100000000);
    $i("inc-eq").value = "0";
    updateIncAmount();
  }
  $i("inc-amt").addEventListener("input", (e) => {
    const d = dig(e.target.value).replace(/^0+(?=\d)/, "").slice(0, 12);
    e.target.value = d ? (+d).toLocaleString("en-US") : "";
    updateIncAmount();
  });
  $i("inc-eq").addEventListener("input", (e) => {
    const d = dig(e.target.value).replace(/^0+(?=\d)/, "").slice(0, 12);
    e.target.value = d ? (+d).toLocaleString("en-US") : "0";
  });
  $i("inc-next").onclick = () => {
    const a = +dig($i("inc-amt").value);
    if (!a) return toast("Vui lòng nhập hạn mức đề xuất");
    if (a < cur.min)
      return toast("Hạn mức đề xuất tối thiểu là " + f(cur.min) + " VND");
    if (a > cur.max) return toast("Hạn mức tối đa là " + f(cur.max) + " VND");
    navigateTo("od-inc-confirm");
  };

  /* --- Màn Xác nhận thông tin --- */
  function fillConfirm() {
    const a = +dig($i("inc-amt").value);
    incTransactionDate = new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Bangkok",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date());
    const feeAccount = selectedIncFeeAccount || "Chưa chọn";
    const card = (t, r) =>
      `<div class="dcard">${t ? `<h3>${t}</h3>` : ""}${r.map(([l, v]) => `<div class="confirm-row"><span>${l}</span><b>${v}</b></div>`).join("")}</div>`;
    $i("inc-cards").innerHTML =
      card("Thông tin khách hàng", [
        ["Họ và tên", CUSTOMER_PROFILE.name],
        ["Số giấy tờ tùy thân", CUSTOMER_PROFILE.identityNumber],
        ["Ngày cấp", "18/02/2009"],
        ["Nơi cấp", "CA Hà Nội"],
        ["Địa chỉ thường trú", CUSTOMER_PROFILE.address],
        ["Nơi ở hiện tại", CUSTOMER_PROFILE.address],
        ["Số điện thoại", CUSTOMER_PROFILE.phone],
      ]) +
      card("Thông tin khoản vay", [
        ["Tài khoản thấu chi", cur.acc],
        ["Hạn mức hiện tại", f(cur.limit) + " VND"],
        ["Hạn mức đề xuất", f(a) + " VND"],
        ["Ngày mở", INC.opened],
        ["Ngày hết hạn", INC.expires],
        ["Lãi suất", `${formatInterestRate(cur.rate)}/năm`],
        ["Vốn tự có", (f(+dig($i("inc-eq").value)) || "0") + " VND"],
        ["Nội dung khác", `Giữ nguyên theo tài khoản thấu chi (${cur.acc})`],
      ]) +
      card("Thông tin khác", [
        ["Phí tăng hạn mức", f(INC.fee) + " VND"],
        ["Tài khoản trả phí", feeAccount],
        ["Ngày thực hiện", incTransactionDate],
      ]);
    $i("inc-cards").scrollTop = 0;
    $i("inc-agree").checked = false;
    $i("inc-ok").disabled = true;
  }
  $i("inc-agree").addEventListener("change", (e) => {
    $i("inc-ok").disabled = !e.target.checked;
  });
  // Xác nhận → sinh trắc học → OTP (luồng cũ) → màn Cập nhật thành công
  $i("inc-ok").onclick = () => {
    incFlow = true;
    navigateTo("biometric");
  };

  /* --- Màn thành công: xem chi tiết khoản vay (về Hồ sơ & Khoản vay > Khoản vay hiện tại > Chi tiết) --- */
  $i("inc-view").onclick = () => {
    loanNavEnabled = true;
    caseOverridesTab = "1";
    historyStack = ["loan", "profile"];
    setTab("1");
    render("profile");
  };

  /* --- Hook điều hướng: OTP xong thì chuyển sang màn thành công riêng của luồng này --- */
  const _nav = navigateTo;
  navigateTo = function (id, push) {
    if (id === "final-success" && incFlow) id = "od-inc-success";
    if (id !== "biometric" && id !== "otp") incFlow = false;
    _nav(id, push);
    if (id === "od-inc-demand") reset();
    if (id === "od-inc-confirm") fillConfirm();
    if (id === "od-inc-success") {
      $i("inc-success-current-limit").textContent = f(cur.limit) + " VND";
      $i("inc-success-acc").textContent = cur.acc;
      $i("inc-success-limit").textContent =
        f(+dig($i("inc-amt").value)) + " VND";
      $i("inc-success-date").textContent = incTransactionDate;
    }
  };
  const t = document.querySelector('.tb2 button[data-soon*="Tăng hạn mức"]');
  if (t) {
    t.removeAttribute("data-soon");
    t.dataset.go = "od-inc-demand";
  }
  reset();
})();

/* ===== Luồng Đóng hạn mức thấu chi ===== */
(() => {
  const $i = (id) => document.getElementById(id);
  const f = (n) => Math.round(n).toLocaleString("en-US");
  const dm = (d) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  const CLOSE = {
    acc: "000001234567",
    limit: 50000000,
    debt: 50000000,
    interest: 849583,
    fee: 0,
  };
  let selectedCloseAccount = PAYMENT_ACCOUNTS[1];
  let closeFlow = false;
  let closeTransactionDate = "";
  const formatCloseTransactionDate = (date) =>
    new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Bangkok",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);

  function closeTotal() {
    return CLOSE.debt + CLOSE.interest + CLOSE.fee;
  }

  function renderCloseDemand() {
    $i("close-acc").textContent = CLOSE.acc;
    $i("close-limit").textContent = f(CLOSE.limit);
    $i("close-debt").textContent = f(CLOSE.debt);
    $i("close-interest").textContent = f(CLOSE.interest);
    $i("close-fee").textContent = f(CLOSE.fee);
    $i("close-total").textContent = f(closeTotal());
    $i("close-account-balance").textContent = selectedCloseAccount.balance;
    $i("close-account-number").textContent = selectedCloseAccount.number;
  }

  function setSelectedCloseAccount(value) {
    const account = PAYMENT_ACCOUNTS.find((item) => item.number === value);
    if (!account) return;
    selectedCloseAccount = account;
    $i("close-account-balance").textContent = account.balance;
    $i("close-account-number").textContent = account.number;
    document.querySelectorAll("[data-close-account]").forEach((b) => {
      b.classList.toggle("on", b.dataset.closeAccount === account.number);
    });
  }

  function closeAccountSheet(on) {
    if (on) {
      $i("closeAccountList").innerHTML = PAYMENT_ACCOUNTS.map(
        (account) => `
          <button class="close-account-option ${selectedCloseAccount.number === account.number ? "on" : ""}" type="button" data-close-account="${account.number}">
            <span class="ac-bank-icon"><img src="SeAMobile_logo.png" alt="" /></span>
            <span class="ac-body">
              <span class="ac-bal">${account.balance} <span class="ac-unit">VND</span></span>
              <span class="ac-name"><span>${account.number}</span><span class="ac-divider">|</span><span>Tài khoản thanh toán</span></span>
            </span>
            <span class="ac-check"><svg><use href="#check" /></svg></span>
          </button>`,
      ).join("");
    }
    $i("closeAccountSheet").classList.toggle("on", on);
    $i("closeAccountScrim").classList.toggle("on", on);
    $i("close-account-picker").setAttribute("aria-expanded", String(on));
  }

  window.closeCloseAccountSheet = () => {
    const was = $i("closeAccountSheet").classList.contains("on");
    closeAccountSheet(false);
    return was;
  };

  $i("close-account-picker").onclick = () => closeAccountSheet(true);
  $i("closeAccountClose").onclick = () => closeAccountSheet(false);
  $i("closeAccountScrim").onclick = () => closeAccountSheet(false);
  $i("closeAccountList").addEventListener("click", (event) => {
    const option = event.target.closest("[data-close-account]");
    if (!option) return;
    setSelectedCloseAccount(option.dataset.closeAccount);
    closeAccountSheet(false);
    $i("close-account-picker").focus();
  });

  function fillCloseConfirm() {
    const now = new Date();
    closeTransactionDate = formatCloseTransactionDate(now);
    const card = (title, rows) =>
      `<div class="dcard"><h3>${title}</h3>${rows
        .map(
          ([l, v]) =>
            `<div class="confirm-row"><span>${l}</span><b>${v}</b></div>`,
        )
        .join("")}</div>`;

    $i("close-card-details").innerHTML =
      card("Thông tin khách hàng", [
        ["Họ và tên", CUSTOMER_PROFILE.name],
        ["Số giấy tờ tùy thân", CUSTOMER_PROFILE.identityNumber],
        ["Ngày cấp", "18/02/2022"],
        ["Nơi cấp", "Bộ Công an"],
        [
          "Địa chỉ thường trú",
          CUSTOMER_PROFILE.address,
        ],
        [
          "Nơi ở hiện tại",
          CUSTOMER_PROFILE.address,
        ],
        ["Số điện thoại", CUSTOMER_PROFILE.phone],
      ]) +
      card("Thông tin khoản vay", [
        ["Tài khoản thấu chi", CLOSE.acc],
        ["Hạn mức hiện tại", f(CLOSE.limit) + " VND"],
        ["Dư nợ hiện tại", f(CLOSE.debt) + " VND"],
        ["Tiền lãi", f(CLOSE.interest) + " VND"],
        ["Phí đóng hạn mức (gồm VAT)", f(CLOSE.fee) + " VND"],
      ]) +
      card("Thông tin giao dịch", [
        ["Tài khoản thu nợ", `${selectedCloseAccount.number} • TK Thanh toán`],
        ["Tổng tiền thanh toán", f(closeTotal()) + " VND"],
        ["Ngày thực hiện", closeTransactionDate],
      ]);
    $i("close-cards").scrollTop = 0;
    $i("close-agree").checked = false;
    $i("close-ok").disabled = true;
  }

  $i("close-next").onclick = () => {
    if (!selectedCloseAccount) return toast("Vui lòng chọn tài khoản thu nợ");
    navigateTo("od-close-confirm");
  };

  $i("close-agree").onchange = (e) => {
    $i("close-ok").disabled = !e.target.checked;
  };

  $i("close-ok").onclick = () => {
    if (!$i("close-agree").checked) return;
    closeFlow = true;
    navigateTo("biometric");
  };

  $i("close-home").onclick = () => {
    closeFlow = false;
    historyStack = ["loan", "profile"];
    setTab("2");
    render("profile");
  };

  // Hook điều hướng cho luồng đóng hạn mức.
  const _navClose = navigateTo;
  navigateTo = function (id, push) {
    if (id === "final-success" && closeFlow) {
      id = "od-close-success";
      document.getElementById("close-success-date").textContent =
        closeTransactionDate || formatCloseTransactionDate(new Date());
    }
    if (id !== "biometric" && id !== "otp" && id !== "od-close-success")
      closeFlow = false;
    _navClose(id, push);
    if (id === "od-close-demand") renderCloseDemand();
    if (id === "od-close-confirm") fillCloseConfirm();
  };

  // Nối nút Đóng hạn mức của khoản vay Thấu chi lương.
  document.querySelectorAll("#currentRecords .loan").forEach((c) => {
    if (!/thấu chi lương/i.test(c.querySelector(".t")?.textContent || ""))
      return;
    const btn = [...c.querySelectorAll(".btns button")].find((b) =>
      /đóng hạn mức/i.test(b.textContent),
    );
    if (!btn) return;
    btn.removeAttribute("data-soon");
    btn.dataset.go = "od-close-demand";
  });

  renderCloseDemand();
})();
/* ===== Luồng Giảm hạn mức thấu chi ===== */
(() => {
  const $d = (id) => document.getElementById(id);
  const format = (value) => Math.round(value).toLocaleString("en-US");
  const digits = (value) => String(value).replace(/\D/g, "");
  const DEC = {
    account: "000001234567",
    limit: 80000000,
    debt: 70000000,
    min: 10000000,
  };
  const digitWords = [
    "không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín",
  ];
  const groupWords = ["", "nghìn", "triệu", "tỷ"];
  let decFlow = false;
  let decTransactionDate = "";
  const formatDecDate = (date) =>
    new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Bangkok",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);

  function readDecGroup(value, forceHundreds) {
    const hundred = Math.floor(value / 100);
    const ten = Math.floor((value % 100) / 10);
    const one = value % 10;
    const words = [];
    if (hundred || forceHundreds) words.push(digitWords[hundred], "trăm");
    if (ten > 1) {
      words.push(digitWords[ten], "mươi");
      if (one === 1) words.push("mốt");
      else if (one === 5) words.push("lăm");
      else if (one) words.push(digitWords[one]);
    } else if (ten === 1) {
      words.push("mười");
      if (one === 5) words.push("lăm");
      else if (one) words.push(digitWords[one]);
    } else if (one) {
      if (hundred || forceHundreds) words.push("lẻ");
      words.push(digitWords[one]);
    }
    return words.join(" ");
  }
  function decAmountInWords(value) {
    let remaining = Math.floor(Number(value) || 0);
    if (!remaining) return "Không đồng";
    const groups = [];
    while (remaining > 0) {
      groups.push(remaining % 1000);
      remaining = Math.floor(remaining / 1000);
    }
    const words = groups
      .map((group, index) =>
        group
          ? `${readDecGroup(group, index < groups.length - 1)} ${groupWords[index] || "tỷ"}`.trim()
          : "",
      )
      .filter(Boolean)
      .reverse()
      .join(" ");
    return `${words.charAt(0).toLocaleUpperCase("vi-VN")}${words.slice(1)} đồng`;
  }
  function updateDecAmount() {
    const amount = +digits($d("dec-amt").value);
    const underMin = amount < DEC.min;
    const overLimit = amount >= DEC.limit;
    const invalid = underMin || overLimit;
    $d("dec-error").hidden = !invalid;
    $d("dec-error").textContent = underMin
      ? `Hạn mức tối thiểu ${format(DEC.min)} VND`
      : `Hạn mức đề nghị phải thấp hơn ${format(DEC.limit)} VND`;
    $d("dec-amount-card").classList.toggle("is-invalid", invalid);
    $d("dec-amt").setAttribute("aria-invalid", String(invalid));
    $d("dec-words").textContent = amount ? decAmountInWords(amount) : "";
  }
  function resetDecDemand() {
    $d("dec-acc").textContent = DEC.account;
    $d("dec-current").textContent = format(DEC.limit);
    $d("dec-debt").textContent = format(DEC.debt);
    $d("dec-other-acc").textContent = DEC.account;
    $d("dec-date").textContent = formatDecDate(new Date());
    $d("dec-amt").value = format(5000000);
    updateDecAmount();
  }
  function fillDecConfirm() {
    const amount = +digits($d("dec-amt").value);
    decTransactionDate = formatDecDate(new Date());
    $d("dec-date").textContent = decTransactionDate;
    const card = (title, rows) =>
      `<div class="dcard"><h3>${title}</h3>${rows
        .map(([label, value]) => `<div class="confirm-row"><span>${label}</span><b>${value}</b></div>`)
        .join("")}</div>`;
    $d("dec-cards").innerHTML =
      card("Thông tin khách hàng", [
        ["Họ và tên", CUSTOMER_PROFILE.name],
        ["Số giấy tờ tùy thân", CUSTOMER_PROFILE.identityNumber],
        ["Địa chỉ thường trú", CUSTOMER_PROFILE.address],
        ["Số điện thoại", CUSTOMER_PROFILE.phone],
      ]) +
      card("Thông tin khoản vay", [
        ["Tài khoản thấu chi", DEC.account],
        ["Hạn mức hiện tại", `${format(DEC.limit)} VND`],
        ["Dư nợ hiện tại", `${format(DEC.debt)} VND`],
        ["Hạn mức đề nghị", `${format(amount)} VND`],
        ["Các nội dung khác", `Giữ nguyên theo tài khoản thấu chi số ${DEC.account}`],
      ]) +
      card("Thông tin khác", [["Ngày thực hiện", decTransactionDate]]);
    $d("dec-cards").scrollTop = 0;
    $d("dec-agree").checked = false;
    $d("dec-ok").disabled = true;
  }

  $d("dec-amt").addEventListener("input", (event) => {
    const value = digits(event.target.value).replace(/^0+(?=\d)/, "").slice(0, 12);
    event.target.value = value ? (+value).toLocaleString("en-US") : "";
    updateDecAmount();
  });
  $d("dec-next").addEventListener("click", () => {
    const amount = +digits($d("dec-amt").value);
    if (!amount) return toast("Vui lòng nhập hạn mức đề nghị");
    if (amount < DEC.min)
      return toast(`Hạn mức đề nghị tối thiểu là ${format(DEC.min)} VND`);
    if (amount >= DEC.limit)
      return toast(`Hạn mức đề nghị phải thấp hơn ${format(DEC.limit)} VND`);
    navigateTo("od-dec-confirm");
  });
  $d("dec-agree").addEventListener("change", (event) => {
    $d("dec-ok").disabled = !event.target.checked;
  });
  $d("dec-ok").addEventListener("click", () => {
    if (!$d("dec-agree").checked) return;
    decFlow = true;
    navigateTo("biometric");
  });
  $d("dec-view").addEventListener("click", () => {
    loanNavEnabled = true;
    caseOverridesTab = "1";
    historyStack = ["loan", "profile"];
    setTab("1");
    render("profile");
  });

  const _navReduce = navigateTo;
  navigateTo = function (id, push) {
    if (id === "final-success" && decFlow) id = "od-dec-success";
    if (id !== "biometric" && id !== "otp" && id !== "od-dec-success")
      decFlow = false;
    _navReduce(id, push);
    if (id === "od-dec-demand") resetDecDemand();
    if (id === "od-dec-confirm") fillDecConfirm();
    if (id === "od-dec-success") {
      $d("dec-success-current").textContent = `${format(DEC.limit)} VND`;
      $d("dec-success-limit").textContent = `${format(+digits($d("dec-amt").value))} VND`;
      $d("dec-success-acc").textContent = DEC.account;
      $d("dec-success-date").textContent = decTransactionDate;
    }
  };
  document.querySelectorAll('.tb2 button[data-soon*="Giảm hạn mức"]').forEach((button) => {
    button.removeAttribute("data-soon");
    button.dataset.go = "od-dec-demand";
  });
  resetDecDemand();
})();
(() => {
  const cf = document.getElementById("cf");
  if (!cf) return;
  const cards = [...cf.querySelectorAll(".cf-card")];
  const dots = document.getElementById("cfDots");
  const N = cards.length;
  let active = 0,
    dx = 0,
    x0 = 0,
    down = false,
    moved = false;
  dots.innerHTML = cards
    .map(
      (_, i) =>
        `<button type="button" data-i="${i}" aria-label="Ưu đãi ${i + 1}"></button>`,
    )
    .join("");

  function paint() {
    const W = cf.clientWidth;
    if (!W) return; // đang ẩn (case không có PDT)
    const s = W * 0.385; // khoảng cách giữa 2 card
    cards.forEach((c, i) => {
      const p = i - active + dx / s; // 0 = card giữa
      const a = Math.abs(p),
        k = Math.max(-2, Math.min(2, p));
      c.style.transform = `translateX(${p * s}px) translateZ(${-Math.min(a, 2) * 80}px) rotateY(${-k * 30}deg) scale(${1 - Math.min(a, 2) * 0.07})`;
      c.style.opacity = a < 1 ? 1 - a * 0.15 : Math.max(0, 0.85 - (a - 1));
      c.style.zIndex = Math.round(100 - a * 10);
      c.style.setProperty("--dim", Math.min(a, 1) * 0.4);
      c.style.pointerEvents = a > 1.5 ? "none" : "auto";
    });
    [...dots.children].forEach((b, i) =>
      b.classList.toggle("on", i === active),
    );
  }
  const go = (i) => {
    active = Math.max(0, Math.min(N - 1, i));
    dx = 0;
    paint();
  };

  cf.addEventListener("pointerdown", (e) => {
    down = true;
    moved = false;
    x0 = e.clientX;
    cf.classList.add("drag");
  });
  window.addEventListener("pointermove", (e) => {
    if (!down) return;
    const d = e.clientX - x0;
    if (Math.abs(d) > 6) moved = true;
    const edge = (active === 0 && d > 0) || (active === N - 1 && d < 0);
    dx = edge ? d * 0.35 : d; // đàn hồi ở 2 đầu
    paint();
  });
  const end = () => {
    if (!down) return;
    down = false;
    cf.classList.remove("drag");
    go(active + (dx < -40 ? 1 : dx > 40 ? -1 : 0));
    setTimeout(() => (moved = false), 60);
  };
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);

  // Chặn click sau khi kéo; chạm card bên cạnh chỉ đưa vào giữa (capture để chạy trước handler toàn cục)
  cf.addEventListener(
    "click",
    (e) => {
      const c = e.target.closest(".cf-card");
      const side = c && cards.indexOf(c) !== active;
      if (moved || side) {
        e.stopPropagation();
        e.preventDefault();
        if (!moved && side) go(cards.indexOf(c));
      }
    },
    true,
  );
  dots.addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]");
    if (b) go(+b.dataset.i);
  });
  cf.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") go(active + 1);
    if (e.key === "ArrowLeft") go(active - 1);
  });
  window.addEventListener("resize", paint);

  // Vẽ lại không animation (lần đầu và khi case đổi từ ẩn sang hiện)
  window.cfRefresh = () => {
    cf.classList.add("drag");
    go(active);
    void cf.offsetWidth;
    cf.classList.remove("drag");
  };
  cfRefresh();
})();

/* ===== Khoản vay hiện tại: chip lọc Tất cả / Online / Tại quầy =====
   Quy ước: bản ghi có cụm nút ở ngoài (.btns) = khoản vay Online;
   không có = khoản vay Tại quầy. Thêm bản ghi mới chỉ cần theo đúng quy ước này. */
(() => {
  const wrap = document.getElementById("currentRecords");
  const bar = document.getElementById("loanFilter");
  if (!wrap || !bar) return;
  const loans = [...wrap.querySelectorAll(".loan")];
  const emptyEl = document.getElementById("loanFilterEmpty");
  const donutEl = document.getElementById("debtDonut");
  const legendEl = document.getElementById("debtLegend");
  const toNum = (s) => +String(s).replace(/\D/g, "") || 0;
  const chartColors = ["#f36b2b", "#173451", "#a9b2c0", "#d7191f"];

  loans.forEach((c) => {
    c.dataset.channel = c.querySelector(".btns") ? "online" : "counter";
  });

  // Tổng dư nợ luôn là tổng của TẤT CẢ khoản vay, không đổi theo chip đang chọn
  const totalEl = document.getElementById("totalDebt");
  const balances = loans.map((loan) => {
    const debtRow = [...loan.querySelectorAll(".row")].find((row) =>
      /^\s*Dư nợ (?:hiện tại|còn lại)/i.test(row.textContent),
    );
    return {
      loan,
      amount: debtRow ? toNum(debtRow.querySelector("b")?.textContent || "") : 0,
    };
  });
  const totalDebt = balances.reduce((sum, item) => sum + item.amount, 0);
  if (totalEl) {
    totalEl.firstChild.nodeValue = totalDebt.toLocaleString("en-US") + " ";
  }
  if (donutEl && legendEl) {
    let accumulated = 0;
    const svgNS = "http://www.w3.org/2000/svg";
    const chart = document.createElementNS(svgNS, "svg");
    const center = 71;
    const radius = 62;
    const strokeWidth = 7;
    const gap = 2;
    const circumference = 2 * Math.PI * radius;
    chart.setAttribute("class", "debt-donut-chart");
    chart.setAttribute("viewBox", "0 0 142 142");
    chart.setAttribute("aria-hidden", "true");
    chart.replaceChildren();

    const track = document.createElementNS(svgNS, "circle");
    track.setAttribute("class", "debt-donut-track");
    track.setAttribute("cx", String(center));
    track.setAttribute("cy", String(center));
    track.setAttribute("r", String(radius));
    chart.append(track);
    legendEl.replaceChildren();
    balances.forEach(({ loan, amount }, index) => {
      if (!amount) return;
      const start = accumulated;
      const segmentPercent = (amount / totalDebt) * 100;
      accumulated += segmentPercent;
      const color = chartColors[index % chartColors.length];
      const arcLength = (segmentPercent / 100) * circumference;
      const visibleLength = Math.max(0.1, arcLength - gap - strokeWidth);
      const segment = document.createElementNS(svgNS, "circle");
      segment.setAttribute("class", "debt-donut-segment");
      segment.setAttribute("cx", String(center));
      segment.setAttribute("cy", String(center));
      segment.setAttribute("r", String(radius));
      segment.setAttribute("stroke", color);
      segment.setAttribute("stroke-width", String(strokeWidth));
      segment.setAttribute(
        "stroke-dasharray",
        `${visibleLength} ${circumference - visibleLength}`,
      );
      segment.setAttribute(
        "stroke-dashoffset",
        String(-((start / 100) * circumference + (gap + strokeWidth) / 2)),
      );
      chart.append(segment);

      const item = document.createElement("div");
      item.className = "debt-legend-item";
      const swatch = document.createElement("span");
      swatch.className = "debt-legend-swatch";
      swatch.style.backgroundColor = color;
      const copy = document.createElement("div");
      copy.className = "debt-legend-copy";
      const name = document.createElement("span");
      name.className = "debt-legend-name";
      name.textContent = loan.dataset.overviewName;
      const percent = document.createElement("span");
      percent.className = "debt-legend-percent";
      percent.textContent = ((amount / totalDebt) * 100).toFixed(2) + "%";
      copy.append(name, percent);
      item.append(swatch, copy);
      legendEl.append(item);
    });
    donutEl.querySelector(".debt-donut-chart")?.remove();
    donutEl.prepend(chart);
    donutEl.setAttribute(
      "aria-label",
      `Tổng dư nợ vay ${totalDebt.toLocaleString("en-US")} VND`,
    );
  }

  // Bộ đếm trên từng chip (đếm theo bản ghi thật trong DOM, không phụ thuộc chip đang chọn)
  const counts = {
    all: loans.length,
    online: loans.filter((c) => c.dataset.channel === "online").length,
    counter: loans.filter((c) => c.dataset.channel === "counter").length,
  };
  bar.querySelectorAll("[data-lf]").forEach((b) => {
    const i = b.querySelector("i");
    if (i) i.textContent = counts[b.dataset.lf];
  });

  function applyFilter(key) {
    let shown = 0;
    loans.forEach((c) => {
      const ok = key === "all" || c.dataset.channel === key;
      c.classList.toggle("lf-off", !ok);
      if (ok) shown++;
    });
    bar.querySelectorAll(".lf-chip").forEach((b) => {
      const on = b.dataset.lf === key;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on);
    });
    if (emptyEl) emptyEl.style.display = shown ? "none" : "";
  }
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lf]");
    if (b) applyFilter(b.dataset.lf);
  });
  applyFilter("all");
})();

/* ===== Sản phẩm nổi bật: chip lọc theo hình thức vay ===== */
(() => {
  const wrap = document.querySelector("#loan .prods");
  const bar = document.getElementById("productFilter");
  if (!wrap || !bar) return;
  const products = [...wrap.querySelectorAll(".prod")];

  function applyFilter(key) {
    products.forEach((product) => {
      product.classList.toggle(
        "pf-off",
        key !== "all" && product.dataset.loanType !== key,
      );
    });
    bar.querySelectorAll(".lf-chip").forEach((button) => {
      const selected = button.dataset.productFilter === key;
      button.classList.toggle("on", selected);
      button.setAttribute("aria-selected", String(selected));
    });
  }

  bar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product-filter]");
    if (button && bar.contains(button)) {
      applyFilter(button.dataset.productFilter);
    }
  });
  applyFilter("all");
})();

/* ===== Hồ sơ vay: chip lọc Tất cả / Online / Tại quầy ===== */
(() => {
  const wrap = document.getElementById("pendingRecords");
  const bar = document.getElementById("pendingFilter");
  if (!wrap || !bar) return;
  const records = [...wrap.querySelectorAll(".acc")];
  const emptyEl = document.getElementById("pendingFilterEmpty");
  const counts = {
    all: records.length,
    online: records.filter((record) => record.dataset.channel === "online")
      .length,
    counter: records.filter((record) => record.dataset.channel === "counter")
      .length,
  };

  bar.querySelectorAll("[data-pf]").forEach((button) => {
    const count = button.querySelector("i");
    if (count) count.textContent = counts[button.dataset.pf];
  });

  function applyFilter(key) {
    let shown = 0;
    records.forEach((record) => {
      const visible = key === "all" || record.dataset.channel === key;
      record.classList.toggle("lf-off", !visible);
      if (visible) shown++;
    });
    bar.querySelectorAll(".lf-chip").forEach((button) => {
      const selected = button.dataset.pf === key;
      button.classList.toggle("on", selected);
      button.setAttribute("aria-selected", selected);
    });
    if (emptyEl) emptyEl.style.display = shown ? "none" : "";
  }

  bar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-pf]");
    if (button) applyFilter(button.dataset.pf);
  });
  applyFilter("all");
})();

/* ===== Chi tiết khoản vay: hiển thị theo từng bản ghi =====
   Mặc định (không có trong DETAILS) = nội dung gốc trong HTML của khoản vay cầm cố sổ tiết kiệm.
   Các khoản vay có dữ liệu riêng khai báo bên dưới, khóa theo số hợp đồng; nhãn phải trùng nhãn trong màn Chi tiết. */
(() => {
  const detail = document.getElementById("detail");
  if (!detail) return;
  const rows = [...detail.querySelectorAll(".dcard .row")];
  const labelNodeOf = (r) =>
    r.querySelector("span") ||
    [...r.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
    );
  const labelOf = (r) => {
    const label = labelNodeOf(r);
    const text =
      (label &&
        [...label.childNodes]
          .map((node) => (node.nodeName === "BR" ? " " : node.textContent))
          .join("")) ||
      [...r.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
      )?.textContent ||
      "";
    return text.replace(/\s+/g, " ").trim();
  };
  const valEl = (r) => r.querySelector("b");
  const base = rows.map((r) => ({
    r,
    label: labelOf(r),
    labelNode: labelNodeOf(r),
    value: valEl(r).textContent,
  }));

  const DETAILS = {
    // Vay mua bất động sản - giải ngân 1,5 tỷ, 240 tháng, 9,5%/năm, trả niên kim; đã trả 10 kỳ
    LD2531514476: {
      "Số hợp đồng vay": "LD2531514476",
      "Mục đích vay": "Mua bất động sản",
      "Số tiền vay": "1,500,000,000 VND",
      "Dư nợ hiện tại": "1,478,163,647 VND",
      "Lãi suất vay": "9.50%/năm",
      "Tiền lãi tạm tính": "9,233,461 VND",
      "Hạn thanh toán kỳ tiếp theo": "15/10/2026",
      "Số tiền thanh toán kỳ tiếp theo": "13,981,968 VND",
      "Thời gian vay": "240 tháng",
      "Ngày giải ngân": "11/11/2025",
      "Ngày đến hạn": "15/11/2045",
      "Tài khoản thu nợ": "666414666",
      "Chi nhánh quản lý": "CN Cầu Giấy",
    },
    // Vay mua ô tô - giải ngân 608,5 triệu, 96 tháng, 8,9%/năm, trả niên kim; đã trả 39 kỳ
    LD2316300948: {
      "Số hợp đồng vay": "LD2316300948",
      "Mục đích vay": "Mua ô tô",
      "Số tiền vay": "608,500,000 VND",
      "Dư nợ hiện tại": "411,697,000 VND",
      "Lãi suất vay": "8.90%/năm",
      "Tiền lãi tạm tính": "1,606,168 VND",
      "Hạn thanh toán kỳ tiếp theo": "23/10/2026",
      "Số tiền thanh toán kỳ tiếp theo": "8,883,792 VND",
      "Thời gian vay": "96 tháng",
      "Ngày giải ngân": "12/06/2023",
      "Ngày đến hạn": "23/06/2031",
      "Tài khoản thu nợ": "666414666",
      "Chi nhánh quản lý": "CN Cầu Giấy",
    },
    "od-luong": {
      "Số hợp đồng vay": "000001234567",
      "Mục đích vay": "Tiêu dùng phục vụ đời sống",
      "Số tiền giải ngân": "100,000,000 VND",
      "Dư nợ hiện tại": "50,000,000 VND",
      "Lãi suất vay": "20.39%/năm",
      "Tiền lãi tạm tính": "849,583 VND",
      "Kỳ thanh toán tiếp theo": [
        "Ngày trả lãi kỳ tiếp theo",
        "25/10/2026",
      ],
      "Số tiền thanh toán kỳ tiếp theo": [
        "Số tiền lãi kỳ tiếp theo",
        "849,583 VND",
      ],
      "Thời gian cho vay": ["Thời hạn vay", "12 tháng"],
      "Ngày giải ngân": ["Ngày mở hạn mức", "03/04/2026"],
      "Ngày đến hạn": ["Ngày hết hạn", "03/04/2027"],
      "Tài khoản thu nợ": "666414666",
      "Chi nhánh quản lý": "CN Cầu Giấy",
    },
  };

  // Lịch niên kim: paid = số kỳ đã trả; first = [tháng, năm] của kỳ 1.
  // Khoản vay ngắn hạn dùng payments để chỉ hiển thị các kỳ đã thanh toán.
  const SCHEDULES = {
    LD2531514476: {
      name: "Vay mua bất động sản",
      principal: 1500000000,
      rate: 9.5,
      term: 240,
      paid: 10,
      pmt: 13981968,
      balance: 1478163647,
      day: 15,
      first: [12, 2025],
    },
    LD2316300948: {
      name: "Vay mua ô tô",
      principal: 608500000,
      rate: 8.9,
      term: 96,
      paid: 39,
      pmt: 8883792,
      balance: 411697000,
      day: 23,
      first: [7, 2023],
      overdueDaysByInstallment: { 38: 31, 39: 5 },
      overdueInterestBase: 5744841,
    },
    "000001234567": {
      name: "Thấu chi lương",
      paidOnly: true,
      term: 12,
      payments: [
        { date: "25/04/2026", total: 849583 },
        { date: "25/05/2026", total: 849583 },
        { date: "25/06/2026", total: 849583 },
        { date: "25/07/2026", total: 849583 },
        { date: "25/08/2026", total: 849583 },
        { date: "25/09/2026", total: 849583 },
      ],
    },
    "000001105208": {
      name: "Vay cầm cố sổ tiết kiệm",
      paidOnly: true,
      term: 12,
      payments: [],
    },
  };
  window.LOAN_SCHEDULES = SCHEDULES;
  document.querySelectorAll("[data-loan-progress]").forEach((progress) => {
    const contract = progress.dataset.loanProgress;
    const schedule = SCHEDULES[contract];
    if (!schedule) {
      console.error(`Không tìm thấy lịch thanh toán cho hợp đồng ${contract}`);
      return;
    }
    const paid = schedule.paidOnly
      ? schedule.payments.length
      : schedule.paid - Object.keys(schedule.overdueDaysByInstallment || {})
          .length;
    const percent = schedule.term ? (paid / schedule.term) * 100 : 0;
    const count = progress.querySelector(".loan-progress-count");
    const track = progress.querySelector('[role="progressbar"]');
    const fill = progress.querySelector(".loan-progress-fill");
    if (!count || !track || !fill) {
      console.error(`Thiếu thành phần tiến độ thanh toán cho hợp đồng ${contract}`);
      return;
    }
    count.textContent = `${paid}/${schedule.term}`;
    track.setAttribute("aria-label", `Tiến độ trả nợ ${schedule.name}`);
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", String(schedule.term));
    track.setAttribute("aria-valuenow", String(paid));
    fill.style.width = `${percent}%`;
  });

  function openLoanContract() {
    const url = new URL("HDTD.pdf", window.location.href).href;
    document.getElementById("doc-preview-title").textContent =
      "Hợp đồng tín dụng";
    document.getElementById("doc-preview-frame").src = url;
    document.getElementById("doc-open-external").href = url;
    navigateTo("doc-preview");
  }

  function configureDetailActions(key) {
    const buttons = [...document.querySelectorAll("#detail .tb2 button")];
    const isSavingsPledge = key === "savings-pledge";
    const iconFolder = isSavingsPledge
      ? "assets/seavalue_online_icon_btn/"
      : "assets/ovd_icon_btn/";
    const iconFiles = isSavingsPledge
      ? [
          "contract_view.png",
          "borrow_more.png",
          "early_repayment.png",
          "payoff.png",
        ]
      : [
          "contract_view.png",
          "limit_increase.png",
          "limit_reduce.png",
          "limit_close.png",
        ];
    const actions =
      isSavingsPledge
        ? [
            { label: "Xem hợp\u00a0đồng", document: true },
            {
              label: "Vay thêm",
              go: "loan-demand",
              borrowMore: true,
            },
            { label: "Trả nợ một\u00a0phần", prepay: "partial" },
            { label: "Tất toán", prepay: "settle" },
          ]
        : [
            {
              label: key === "od-luong" ? "Xem\nhợp đồng" : "Xem hợp đồng",
              document: true,
            },
            key === "od-luong"
              ? { label: "Tăng\nhạn mức", go: "od-inc-demand" }
              : {
                  label: "Tăng hạn mức",
                  soon: "Tính năng Tăng hạn mức chưa có trong mock-up",
                },
            key === "od-luong"
              ? { label: "Giảm\nhạn mức", go: "od-dec-demand" }
              : {
                  label: "Giảm hạn mức",
                  soon: "Tính năng Giảm hạn mức chưa có trong mock-up",
                },
            key === "od-luong"
              ? { label: "Đóng\nhạn mức", go: "od-close-demand" }
              : {
                  label: "Đóng hạn mức",
                  soon: "Tính năng Đóng hạn mức chưa có trong mock-up",
                },
          ];

    buttons.forEach((button, index) => {
      const action = actions[index];
      if (!action) return;
      const label = button.querySelector(".tb2-label");
      if (label) label.textContent = action.label;
      const icon = button.querySelector(".o img");
      if (icon) icon.src = iconFolder + iconFiles[index];
      button
        .querySelector(".o")
        ?.classList.toggle(
          "off",
          !isSavingsPledge && index === 3 && key !== "od-luong",
        );
      button.removeAttribute("data-go");
      button.removeAttribute("data-soon");
      button.removeAttribute("data-borrow-more");
      button.onclick = null;
      if (action.go) button.dataset.go = action.go;
      if (action.borrowMore) button.dataset.borrowMore = "";
      else if (action.soon) button.dataset.soon = action.soon;
      else if (action.document) button.onclick = openLoanContract;
      else if (action.prepay)
        button.onclick = () => window.startPrepayFromDetail(action.prepay);
    });
  }

  function showDetail(contract, channel, key) {
    window.currentDetailContract = contract || "";
    const hasSchedule = Boolean(SCHEDULES[contract]);
    const sl = document.getElementById("schedLink");
    if (sl) sl.hidden = !hasSchedule;
    const scheduleFooter = document.getElementById("detailFooter");
    if (scheduleFooter) scheduleFooter.hidden = !hasSchedule;
    document.getElementById("phone").dataset.loanChannel = channel || "";
    configureDetailActions(key);
    const d = DETAILS[key || contract] || {};
    base.forEach(({ r, label, labelNode, value }) => {
      const o = d[label];
      const [l, v] = Array.isArray(o) ? o : [label, o ?? value];
      if (l !== label) labelNode.textContent = l;
      valEl(r).textContent = v;
    });
  }
  // capture: chạy trước handler điều hướng để biết đang mở chi tiết của khoản vay nào
  document.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest('[data-go="detail"]');
      if (!b) return;
      const loan = b.closest(".loan");
      const no = loan ? loanContractNumber(loan) : "";
      showDetail(no, loan && loan.dataset.channel, loan && loan.dataset.detail);
    },
    true,
  );
})();

/* ===== Màn Lịch trả nợ (khoản vay tại quầy) ===== */
(() => {
  const link = document.getElementById("schedLink");
  const list = document.getElementById("rsList");
  if (!link || !list) return;
  const f = (n) => Math.round(n).toLocaleString("en-US");
  const pad = (n) => String(n).padStart(2, "0");
  const el = (id) => document.getElementById(id);
  const yearPicker = el("rsYearPicker");
  const yearPickerValue = el("rsYearPickerValue");
  const yearOptions = el("rsYearOptions");
  const yearNavButtons = [...document.querySelectorAll("[data-year-nav]")];
  let rows = [];
  let selectedYear = "";

  // Dựng lịch từ mốc dư nợ hiện tại: các kỳ sau tính xuôi, các kỳ đã trả tính ngược.
  // Kỳ cuối tất toán hết dư nợ; kỳ 1 khớp đúng số tiền cho vay đã hiển thị.
  function build(c) {
    const i = c.rate / 1200;
    const date = (k) => {
      const d = new Date(c.first[1], c.first[0] - 1 + (k - 1), c.day);
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    };
    const out = [];
    let b = c.balance;
    for (let k = c.paid; k >= 1; k--) {
      // b = dư nợ sau kỳ k → dư nợ trước kỳ k
      const before = k === 1 ? c.principal : Math.round((b + c.pmt) / (1 + i));
      const principal = before - b;
      const interest = c.pmt - principal;
      const overdueDays = c.overdueDaysByInstallment?.[k] || 0;
      const overduePrincipal = c.overdueInterestBase ?? principal;
      const lateInterest = overdueDays
        ? Math.round((0.1 * interest * overdueDays) / 365)
        : 0;
      const overdueInterest = overdueDays
        ? Math.round(
            (1.5 * (c.rate / 100) * overduePrincipal * overdueDays) / 365,
          )
        : 0;
      out.unshift({
        k,
        date: date(k),
        principal,
        interest,
        total: c.pmt + lateInterest + overdueInterest,
        balance: b,
        st: overdueDays ? "overdue" : "paid",
        overdueDays,
        lateInterest,
        overdueInterest,
      });
      b = before;
    }
    b = c.balance;
    for (let k = c.paid + 1; k <= c.term; k++) {
      const interest = Math.round(b * i);
      const principal = k === c.term ? b : c.pmt - interest;
      b -= principal;
      out.push({
        k,
        date: date(k),
        principal,
        interest,
        total: principal + interest,
        balance: b,
        st: k === c.paid + 1 ? "next" : "plan",
      });
    }
    return out;
  }

  function item(r) {
    const paid = r.st === "paid";
    const overdue = r.st === "overdue";
    return `<div class="rs-item${paid ? " is-paid" : ""}">
      <div class="rs-payment-main">
        <b>Kỳ ${r.k}</b>
        <span class="rs-breakdown-label">Gốc phải trả</span>
        <span class="rs-breakdown-label">Lãi phải trả</span>
        ${overdue ? '<span class="rs-breakdown-label">Lãi chậm trả</span><span class="rs-breakdown-label">Lãi quá hạn</span>' : ""}
        <span>${r.date}</span>
      </div>
      <div class="rs-payment-side">
        <b class="rs-amount">${f(r.total)} <small>VND</small></b>
        <span class="rs-breakdown-amount">${f(r.principal)} <small>VND</small></span>
        <span class="rs-breakdown-amount">${f(r.interest)} <small>VND</small></span>
        ${overdue ? `<span class="rs-breakdown-amount">${f(r.lateInterest)} <small>VND</small></span><span class="rs-breakdown-amount">${f(r.overdueInterest)} <small>VND</small></span>` : ""}
        <span class="rs-status${paid ? " is-paid" : overdue ? " is-overdue" : ""}">${paid ? "Đã thanh toán" : overdue ? "Đang quá hạn" : "Chưa đến hạn"}</span>
      </div>
    </div>`;
  }
  function paint() {
    const years = new Map();
    rows.forEach((row) => {
      const year = Number(row.date.split("/")[2]);
      if (!years.has(year)) years.set(year, []);
      years.get(year).push(row);
    });
    const availableYears = [...years.keys()].sort((a, b) => a - b);
    const defaultRow =
      rows.find((row) => row.st !== "paid") || rows[rows.length - 1];
    if (!availableYears.includes(Number(selectedYear))) {
      selectedYear = String(
        Number(defaultRow?.date.split("/")[2]) || availableYears[0] || "",
      );
    }

    yearPickerValue.textContent = selectedYear;
    yearPicker.disabled = availableYears.length === 0;
    yearOptions.innerHTML = availableYears
      .map(
        (year) => `
          <button
            class="rs-year-option"
            type="button"
            role="option"
            data-year="${year}"
            aria-selected="${year === Number(selectedYear)}"
          >${year}</button>`,
      )
      .join("");
    const selectedIndex = availableYears.indexOf(Number(selectedYear));
    yearNavButtons.forEach((button) => {
      const action = button.dataset.yearNav;
      button.disabled =
        selectedIndex < 0 ||
        (action === "first" && selectedIndex === 0) ||
        (action === "previous" && selectedIndex === 0) ||
        (action === "next" && selectedIndex === availableYears.length - 1) ||
        (action === "last" && selectedIndex === availableYears.length - 1);
    });

    const installments = years.get(Number(selectedYear)) || [];
    closeYearOptions();
    list.innerHTML = installments.length
      ? installments.slice(0, 12).map(item).join("")
      : '<p class="rs-empty">Chưa có kỳ thanh toán nào được ghi nhận.</p>';
  }
  function closeYearOptions(returnFocus = false) {
    yearOptions.hidden = true;
    yearPicker.setAttribute("aria-expanded", "false");
    yearPicker.closest(".rs-year-picker-wrap").setAttribute("aria-expanded", "false");
    if (returnFocus) yearPicker.focus();
  }
  function open(contract) {
    const cfg = (window.LOAN_SCHEDULES || {})[contract];
    if (!cfg) return;
    rows = cfg.paidOnly
      ? cfg.payments.map((payment, index) => ({
          ...payment,
          principal: payment.principal || 0,
          interest: payment.interest ?? payment.total,
          k: index + 1,
          st: "paid",
        }))
      : build(cfg);
    const overdueRows = rows.filter((r) => r.st === "overdue");
    el("rsSummary").hidden = overdueRows.length === 0;
    el("rsOverdueTotal").textContent = f(
      overdueRows.reduce((sum, row) => sum + row.total, 0),
    );
    const firstUnpaidRow =
      rows.find((row) => row.st !== "paid") || rows[rows.length - 1];
    selectedYear = firstUnpaidRow?.date.split("/")[2] || "";
    paint();
  }
  yearPicker.addEventListener("click", () => {
    if (yearPicker.disabled) return;
    const expanded = yearPicker.getAttribute("aria-expanded") === "true";
    if (expanded) {
      closeYearOptions();
      return;
    }
    yearOptions.hidden = false;
    yearPicker.setAttribute("aria-expanded", "true");
    yearPicker.closest(".rs-year-picker-wrap").setAttribute("aria-expanded", "true");
    yearOptions
      .querySelector('[aria-selected="true"]')
      ?.focus({ preventScroll: true });
  });
  yearOptions.addEventListener("click", (event) => {
    const option = event.target.closest(".rs-year-option");
    if (!option) return;
    selectedYear = option.dataset.year;
    paint();
    yearPicker.focus();
  });
  yearOptions.addEventListener("keydown", (event) => {
    const options = [...yearOptions.querySelectorAll(".rs-year-option")];
    const currentIndex = options.indexOf(document.activeElement);
    let nextIndex = currentIndex;
    if (event.key === "Escape") {
      closeYearOptions(true);
    } else if (event.key === "ArrowRight") {
      nextIndex = Math.min(currentIndex + 1, options.length - 1);
    } else if (event.key === "ArrowLeft") {
      nextIndex = Math.max(currentIndex - 1, 0);
    } else if (event.key === "ArrowDown") {
      nextIndex = Math.min(currentIndex + 3, options.length - 1);
    } else if (event.key === "ArrowUp") {
      nextIndex = Math.max(currentIndex - 3, 0);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = options.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    options[nextIndex]?.focus();
  });
  document.addEventListener("click", (event) => {
    if (!yearPicker.closest(".rs-year-picker-wrap").contains(event.target)) {
      closeYearOptions();
    }
  });
  yearNavButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closeYearOptions();
      const years = [...new Set(
        rows.map((row) => Number(row.date.split("/")[2])),
      )].sort((a, b) => a - b);
      const currentIndex = years.indexOf(Number(selectedYear));
      const nextIndex = {
        first: 0,
        previous: currentIndex - 1,
        next: currentIndex + 1,
        last: years.length - 1,
      }[button.dataset.yearNav];
      if (nextIndex < 0 || nextIndex >= years.length) return;
      selectedYear = String(years[nextIndex]);
      paint();
    });
  });
  document
    .querySelector("#repay-schedule .rs-backdrop")
    .addEventListener("click", goBack);
  // capture: chạy trước handler điều hướng để dựng lịch của đúng khoản vay đang xem
  link.addEventListener(
    "click",
    () => open(window.currentDetailContract),
    true,
  );
})();
/* ===== Luồng Trả nợ trước hạn (một phần / tất toán) khoản vay cầm cố sổ tiết kiệm ===== */
(() => {
  const $i = (id) => document.getElementById(id);
  const f = (n) => Math.round(n).toLocaleString("en-US");
  let prepayFlow = false;

  const PREPAY = {
    mode: "settle", // 'partial' | 'settle'
    contract: "000001105208",
    debt: 100000000, // Dư nợ hiện tại (đọc lại từ thẻ khi mở luồng)
    interest: 7200000, // Tiền lãi (đọc lại từ thẻ khi mở luồng)
    amount: 0, // Số tiền trả nợ / tất toán
    source: null, // 'payment' | 'savings'
    account: null,
    accountName: "",
  };

  const FUND_SOURCES = [
    { id: "payment", label: "Từ tài khoản thanh toán" },
    { id: "savings", label: "Từ tài sản bảo đảm là sổ tiết kiệm" },
  ];
  const PREPAY_MODES = [
    {
      l: "Trả nợ trước hạn một phần",
      s: "Trả trước một phần dư nợ",
      v: "partial",
    },
    {
      l: "Tất toán khoản vay",
      s: "Thanh toán toàn bộ dư nợ và tiền lãi",
      v: "settle",
    },
  ];
  const ACCOUNTS = {
    payment: PAYMENT_ACCOUNTS.map((account) => ({
      ...account,
      id: `${account.number}_TK`,
      name: `${account.number} • TK TG THANH TOÁN`,
      type: "Tài khoản thanh toán",
      balance: `${account.balance} VND`,
    })),
    savings: [
      {
        id: "000001105208_SV",
        name: "000001105208 - Tiết kiệm lĩnh lãi cuối kỳ",
        number: "000001105208",
        type: "Tiết kiệm lĩnh lãi cuối kỳ",
        balance: "100,000,000,000 VND",
      },
    ],
  };

  /* --- Đọc số liệu từ thẻ "Khoản vay hiện tại" để luôn đồng nhất với thẻ bên ngoài --- */
  const rowNum = (card, re) => {
    const r = [...card.querySelectorAll(".row")].find((x) =>
      re.test(x.textContent),
    );
    return r ? +r.querySelector("b").textContent.replace(/\D/g, "") || 0 : 0;
  };
  function loadLoan(card) {
    const debt = rowNum(card, /^\s*Dư nợ (?:còn lại|hiện tại)/);
    const nextPay = rowNum(card, /^\s*Số tiền thanh toán kỳ\s+tiếp theo/);
    PREPAY.contract = loanContractNumber(card);
    PREPAY.debt = debt;
    PREPAY.interest = Math.max(0, nextPay - debt); // 107,200,000 − 100,000,000 = 7,200,000
  }

  /* --- Bottom sheet chọn hình thức (dùng lại sheetPick) --- */
  function openTypeSheet(card) {
    loadLoan(card);
    openPickSheet("Hình thức", PREPAY_MODES, (o) => {
      PREPAY.mode = o.v;
      navigateTo("prepay-loan");
    });
  }

  window.startPrepayFromDetail = (mode) => {
    const card = document.querySelector(
      '#currentRecords .loan[data-detail="savings-pledge"]',
    );
    if (!card) return;
    loadLoan(card);
    PREPAY.mode = mode;
    navigateTo("prepay-loan");
  };

  /* --- Ô nhập số tiền (chỉ dùng khi trả một phần) --- */
  const amountIn = $i("prepay-amount");
  const amountErr = $i("prepay-amount-err");
  function syncAmount() {
    const partial = PREPAY.mode === "partial";
    const n = partial
      ? +amountIn.value.replace(/\D/g, "") || 0
      : PREPAY.debt + PREPAY.interest;
    const over = partial && n > PREPAY.debt;
    PREPAY.amount = n;
    $i("prepay-amount-words").textContent = n > 0 ? docSo(n) : "";
    amountErr.hidden = !over;
    if (over)
      amountErr.textContent =
        "Số tiền trả nợ tối đa là " + f(PREPAY.debt) + " VND";
    $i("prepay-amount-field").classList.toggle("is-error", over);
    $i("prepay-next").disabled = over;
  }
  amountIn.addEventListener("input", () => {
    const d = amountIn.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 12);
    amountIn.value = d ? (+d).toLocaleString("en-US") : "";
    syncAmount();
  });

  function updatePrepayFields() {
    const partial = PREPAY.mode === "partial";
    const source = FUND_SOURCES.find((s) => s.id === PREPAY.source);
    const savings = PREPAY.mode === "settle" && PREPAY.source === "savings";
    const amountLabel = $i("prepay-amount-field").querySelector(
      ".reg-amount-label",
    );
    amountLabel.textContent = partial ? "Số tiền" : "Số tiền";
    amountIn.readOnly = !partial;
    amountIn.setAttribute(
      "aria-label",
      partial ? "Số tiền trả nợ" : "Số tiền tất toán",
    );
    if (!partial) {
      PREPAY.amount = PREPAY.debt + PREPAY.interest;
      amountIn.value = f(PREPAY.amount);
    }
    $i("prepay-mode-value").textContent = partial
      ? "Trả nợ trước hạn một phần"
      : "Tất toán khoản vay";
    $i("prepay-source-picker").hidden = partial;
    $i("prepay-source-value").textContent = source?.label || "Chọn nguồn tiền";
    $i("prepay-source-value").classList.toggle("ph", !source);
    $i("prepay-account-picker").hidden =
      !partial && PREPAY.source !== "payment";
    $i("prepay-savings-field").hidden = !savings;
    $i("prepay-savings-value").textContent = savings
      ? `${ACCOUNTS.savings[0].number} | ${ACCOUNTS.savings[0].type}`
      : "";
    $i("prepay-sec").textContent = partial
      ? "Thông tin trả nợ"
      : "Thông tin tất toán";
  }

  function selectPrepayMode(mode) {
    if (PREPAY.mode !== mode) {
      PREPAY.mode = mode;
      PREPAY.source = mode === "partial" ? "payment" : null;
      PREPAY.account = null;
      PREPAY.accountName = "";
      amountIn.value = "";
      $i("prepay-account-value").textContent = "Chọn tài khoản trả nợ";
      $i("prepay-account-value").classList.add("ph");
    }
    updatePrepayFields();
    syncAmount();
  }

  /* --- Dựng lại màn hình mỗi lần vào luồng --- */
  function resetPrepay() {
    const partial = PREPAY.mode === "partial";
    PREPAY.account = null;
    PREPAY.accountName = "";
    PREPAY.source = partial ? "payment" : null;
    PREPAY.amount = partial ? 0 : PREPAY.debt + PREPAY.interest; // tất toán = dư nợ + tiền lãi

    $i("pp-contract").textContent = PREPAY.contract;
    $i("pp-debt").textContent = f(PREPAY.debt) + " VND";
    $i("pp-interest").textContent = f(PREPAY.interest) + " VND";

    amountIn.value = "";
    $i("prepay-account-value").textContent = "Chọn tài khoản trả nợ";
    $i("prepay-account-value").classList.add("ph");
    updatePrepayFields();
    syncAmount();
  }

  function openSourceSheet() {
    if (PREPAY.mode === "partial") return;
    $i("prepaySourceList").innerHTML = FUND_SOURCES.map(
      (s) => `
      <button class="close-account-option${PREPAY.source === s.id ? " on" : ""}" data-source="${s.id}">
        <span class="ac-ic"><svg><use href="#wallet"/></svg></span>
        <span class="ac-body">
          <span class="ac-name">${s.label}</span>
        </span>
        <span class="ac-check"><svg><use href="#check"/></svg></span>
      </button>`,
    ).join("");
    $i("scrim").classList.add("on");
    $i("sheetPrepaySource").classList.add("on");
  }

  function openAccountSheet() {
    if (!PREPAY.source) return toast("Vui lòng chọn nguồn tiền trả nợ trước");
    $i("prepayAccountList").innerHTML = (ACCOUNTS[PREPAY.source] || [])
      .map(
        (a) => `
      <button class="close-account-option ${PREPAY.account === a.id ? "on" : ""}" data-account="${a.id}" data-name="${a.name}">
        <span class="ac-bank-icon"><img src="SeAMobile_logo.png" alt="" /></span>
        <span class="ac-body">
          <span class="ac-bal">${a.balance.replace(/\s*VND$/, "")} <span class="ac-unit">VND</span></span>
          <span class="ac-name">
            <span>${a.number}</span>
            <span class="ac-divider">|</span>
            <span>${a.type}</span>
          </span>
        </span>
        <span class="ac-check"><svg><use href="#check"/></svg></span>
      </button>`,
      )
      .join("");
    $i("scrim").classList.add("on");
    $i("sheetPrepayAccount").classList.add("on");
  }

  function closeSheets() {
    $i("scrim").classList.remove("on");
    $i("sheetPrepaySource").classList.remove("on");
    $i("sheetPrepayAccount").classList.remove("on");
  }

  /* --- Màn Xác nhận --- */
  function renderPrepayConfirm() {
    const partial = PREPAY.mode === "partial";
    const sourceLabel =
      FUND_SOURCES.find((s) => s.id === PREPAY.source)?.label || "";
    const amtLabel = partial ? "Số tiền trả nợ" : "Số tiền tất toán";
    const accountLabel =
      !partial && PREPAY.source === "savings"
        ? "Sổ tiết kiệm"
        : "Tài khoản trả nợ";

    const card1 = `
      <div class="dcard">
        <h3>Thông tin khoản vay</h3>
        <div class="confirm-row"><span>Số hợp đồng vay</span><b>${PREPAY.contract}</b></div>
        <div class="confirm-row"><span>Dư nợ hiện tại</span><b>${f(PREPAY.debt)} VND</b></div>
        <div class="confirm-row"><span>Lãi suất vay</span><b>9.00%/năm</b></div>
        <div class="confirm-row"><span>Tiền lãi</span><b>${f(PREPAY.interest)} VND</b></div>
        <div class="confirm-row"><span>Ngày vay</span><b>5/10/2023</b></div>
        <div class="confirm-row"><span>Ngày đến hạn</span><b>18/05/2024</b></div>
        <div class="confirm-row"><span>Đơn vị cho vay</span><b>CN Ha Noi</b></div>
        <div class="confirm-row"><span>${amtLabel}</span><b style="color: var(--red);">${f(PREPAY.amount)} VND</b></div>
      </div>`;
    const card2 = `
      <div class="dcard">
        <h3>${partial ? "Thông tin trả nợ trước hạn" : "Thông tin tất toán khoản vay"}</h3>
        <div class="confirm-row"><span>${partial ? "Số tiền trả nợ" : "Tổng số tiền tất toán"}</span><b>${f(PREPAY.amount)} VND</b></div>
        <div class="confirm-row"><span>Nguồn tiền trả nợ</span><b>${sourceLabel}</b></div>
        <div class="confirm-row"><span>${accountLabel}</span><b>${PREPAY.accountName || ""}</b></div>
      </div>`;
    $i("prepay-confirm-cards").innerHTML = card1 + card2;
    $i("prepay-confirm").scrollTop = 0;
  }

  /* --- Màn Thành công --- */
  function fillSuccess() {
    const partial = PREPAY.mode === "partial";
    $i("prepay-done-title").textContent = "Đăng ký thành công";
    $i("prepay-done-msg").textContent = partial
      ? "SeABank đã tiếp nhận yêu cầu trả nợ trước hạn một phần của Quý khách"
      : "SeABank đã xử lý yêu cầu tất toán khoản vay của Quý khách";

    const sourceLabel =
      FUND_SOURCES.find((source) => source.id === PREPAY.source)?.label || "";
    const accountLabel =
      PREPAY.source === "savings" ? "Sổ tiết kiệm" : "Tài khoản trả nợ";
    $i("prepay-success-contract").textContent = PREPAY.contract;
    $i("prepay-success-source").textContent = sourceLabel;
    $i("prepay-success-account-label").textContent = accountLabel;
    $i("prepay-success-account").textContent = PREPAY.accountName;
    $i("prepay-success-amount").textContent = `${f(PREPAY.amount)} VND`;
    $i("prepay-success-date").textContent =
      new Date().toLocaleDateString("vi-VN");
  }

  // --- Gắn sự kiện ---

  // 1. Nút "Trả nợ trước hạn" ở thẻ khoản vay cầm cố → mở bottom sheet chọn hình thức
  document.querySelectorAll("#currentRecords .loan").forEach((c) => {
    if (!/cầm cố sổ tiết kiệm/i.test(c.querySelector(".t").textContent)) return;
    const btn = [...c.querySelectorAll(".btns button")].find((b) =>
      /trả nợ trước hạn/i.test(b.textContent),
    );
    if (!btn) return;
    btn.removeAttribute("data-soon");
    btn.addEventListener("click", () => openTypeSheet(c));
  });

  // 2. Mở các bottom sheet chọn nguồn / tài khoản
  $i("prepay-mode-picker").onclick = () =>
    openPickSheet("Hình thức", PREPAY_MODES, (option) =>
      selectPrepayMode(option.v),
    );
  $i("prepay-source-picker").onclick = openSourceSheet;
  $i("prepay-account-picker").onclick = openAccountSheet;

  $i("prepaySourceList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-source]");
    if (!btn) return;
    PREPAY.source = btn.dataset.source;
    PREPAY.account = null;
    PREPAY.accountName = "";
    $i("prepay-account-value").textContent = "Chọn tài khoản trả nợ";
    $i("prepay-account-value").classList.add("ph");
    closeSheets();
    if (PREPAY.source === "savings") {
      const acc = ACCOUNTS.savings[0];
      PREPAY.account = acc.id;
      PREPAY.accountName = acc.name;
      $i("prepay-account-value").textContent = acc.name;
      $i("prepay-account-value").classList.remove("ph");
    }
    updatePrepayFields();
  });
  $i("prepayAccountList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-account]");
    if (!btn) return;
    PREPAY.account = btn.dataset.account;
    PREPAY.accountName = btn.dataset.name;
    $i("prepay-account-value").textContent = PREPAY.accountName;
    $i("prepay-account-value").classList.remove("ph");
    closeSheets();
  });
  document
    .querySelectorAll(".close-sheet-btn")
    .forEach((btn) => (btn.onclick = closeSheets));
  $i("scrim").addEventListener("click", closeSheets);

  // 3. Tiếp tục ở màn nhập thông tin
  $i("prepay-next").onclick = () => {
    if (!PREPAY.mode) return toast("Vui lòng chọn hình thức trả nợ");
    if (PREPAY.mode === "partial" && !(PREPAY.amount > 0))
      return toast("Vui lòng nhập số tiền trả nợ");
    if (PREPAY.mode === "settle" && !PREPAY.source)
      return toast("Vui lòng chọn nguồn tiền trả nợ");
    if (!PREPAY.account) return toast("Vui lòng chọn tài khoản trả nợ");
    if (PREPAY.mode === "settle" && PREPAY.source === "savings") {
      $i("prepay-warning").hidden = false;
      $i("phone").scrollTop = 0;
      $i("prepay-warning-continue").focus({ preventScroll: true });
      return;
    }
    navigateTo("prepay-confirm");
  };

  const closePrepayWarning = () => {
    $i("prepay-warning").hidden = true;
    $i("prepay-next").focus({ preventScroll: true });
  };
  $i("prepay-warning-cancel").onclick = closePrepayWarning;
  $i("prepay-warning-close").onclick = closePrepayWarning;
  $i("prepay-warning-continue").onclick = () => {
    $i("prepay-warning").hidden = true;
    navigateTo("prepay-confirm");
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$i("prepay-warning").hidden)
      closePrepayWarning();
  });

  // 4. Tiếp tục ở màn Xác nhận → Sinh trắc học
  $i("prepay-confirm-btn").onclick = () => {
    prepayFlow = true;
    navigateTo("biometric");
  };

  // 5. Về Hồ sơ & Khoản vay
  $i("prepay-home").onclick = () => {
    historyStack = ["loan", "profile"];
    setTab("2");
    render("profile");
  };

  // --- Hook điều hướng ---
  const _navPrepay = navigateTo;
  navigateTo = function (id, push) {
    if (id === "final-success" && prepayFlow) id = "prepay-success";
    if (id !== "biometric" && id !== "otp" && id !== "prepay-success")
      prepayFlow = false;
    _navPrepay(id, push);
    if (id === "prepay-loan") resetPrepay();
    if (id === "prepay-confirm") renderPrepayConfirm();
    if (id === "prepay-success") fillSuccess();
  };

  resetPrepay();
})();
/* Điền thông tin vào card ở màn Đăng ký thành công (dùng chung Thấu chi & Vay cầm cố sổ tiết kiệm) */
(() => {
  const $i = (id) => document.getElementById(id);

  const addMonths = (d, n) => {
    const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
    r.setDate(
      Math.min(
        d.getDate(),
        new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate(),
      ),
    );
    return r;
  };
  // Thời hạn vay = Ngày kết thúc − hôm nay (thời gian thực), dạng "x Tháng y Ngày"
  const termText = (endStr) => {
    const [dd, mm, yyyy] = endStr.split("/").map(Number);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(yyyy, mm - 1, dd);
    if (!(end > start)) return "0 Ngày";
    let months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      end.getMonth() -
      start.getMonth();
    if (addMonths(start, months) > end) months--;
    const days = Math.round((end - addMonths(start, months)) / 864e5);
    return (
      [months && months + " Tháng", days && days + " Ngày"]
        .filter(Boolean)
        .join(" ") || "0 Ngày"
    );
  };

  const fillSummary = () => {
    if (!$i("fs-limit") || !$i("fs-term")) return;
    const fmt = (v) => (v ? (+v).toLocaleString("en-US") : "");

    // Đang đi luồng Vay cầm cố sổ tiết kiệm (đã qua màn Xác nhận đăng ký vay)
    if (historyStack.includes("confirm-loan")) {
      const amount = $i("demand-amount").value.replace(/\D/g, "");
      $i("fs-limit-lb").textContent = borrowMoreMode
        ? "Số tiền vay thêm"
        : "Số tiền vay";
      $i("fs-term-lb").textContent = "Thời hạn vay";
      $i("fs-rate-lb").textContent = "Lãi suất vay";
      $i("fs-limit").textContent = (fmt(amount) || "0") + " VND";
      $i("fs-term").textContent = termText(
        $i("confirm-loan-end").textContent.trim(),
      );
      $i("fs-rate").textContent = $i("confirm-loan-rate").textContent;
      const [savingsAccount, ...savingsName] = $i("confirm-collateral")
        .textContent.trim()
        .split(" - ");
      $i("fs-collateral-account").textContent = `${savingsAccount} -`;
      $i("fs-collateral-name").textContent = savingsName.join(" - ");
      $i("fs-collateral-row").hidden = false;
      return;
    }

    // Luồng Thấu chi: giữ nguyên như cũ
    const odAmt = ($i("od-amt").value || "").replace(/\D/g, "");
    $i("fs-rate-lb").textContent = "Lãi suất vay";
    $i("fs-collateral-row").hidden = true;
    $i("fs-limit-lb").textContent = "Hạn mức thấu chi";
    $i("fs-term-lb").textContent = "Thời hạn";
    $i("fs-rate").textContent = "12.00%/năm";
    $i("fs-limit").textContent = `${fmt(odAmt || 10000000)} VND`;
    $i("fs-term").textContent = $i("od-term-val").textContent.replace(
      /tháng/i,
      "Tháng",
    );
  };

  const _nav = navigateTo;
  navigateTo = function (id, push) {
    _nav(id, push);
    if (id === "final-success") fillSummary();
  };
})();
render("home");
