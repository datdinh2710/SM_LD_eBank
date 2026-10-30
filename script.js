const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let historyStack = ["home"],
  toastTimer;
let caseOverridesTab = null;
let loanNavEnabled = false;
function syncMainTabbar() {
  const navHome = $("#nav-home");
  const navLoan = $("#nav-loan");
  const navQr = $("#nav-qr");
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
  const cur = historyStack[historyStack.length - 1];
  if (id === cur) return;
  if (push) historyStack.push(id);
  render(id);
}
function goBack() {
  if (window.closeCloseAccountSheet && window.closeCloseAccountSheet()) return;
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
      id === "prepay-success" ||
      id === "repay-schedule" ||
      id === "doc-preview" ||
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
$(".hb-copy").addEventListener("click", async () => {
  const accountNumber = $(".hb-acc").textContent.trim();
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
  const eye = $(".hb-eye");
  const amount = $(".hb-amount b");
  const currency = $(".hb-amount u");
  const visibleAmount = amount.textContent;
  let hidden = false;
  eye.addEventListener("click", () => {
    hidden = !hidden;
    amount.textContent = hidden ? "••••••••" : visibleAmount;
    eye.setAttribute("aria-pressed", String(hidden));
    eye.setAttribute("aria-label", hidden ? "Hiện số dư" : "Ẩn số dư");
    eye.innerHTML = hidden
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="m3 3 18 18"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  });
})();
/* --- Nút "Theo dõi kết quả" ở màn Đăng ký thành công --- */
(() => {
  const trackBtn = document.getElementById("final-track");
  if (!trackBtn) return;
  trackBtn.addEventListener("click", () => {
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
  else if (el.dataset.choose) startReg(el.dataset.choose);
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
      return toast("Vui lòng nhập đầy đủ số tiền, thời hạn và lãi suất vay");
    }
    document.activeElement?.blur();
    calc(method());
    const sc = $("#calc");
    sc.scrollTo({ top: $(".calc-out").offsetTop - 12, behavior: "smooth" });
  });
  // Nút "Làm mới": xoá toàn bộ giá trị đã nhập và đưa kết quả về trạng thái ban đầu
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
        `<button class="sopt" data-opt="${i}"><b>${o.l}</b>${o.s ? `<span>${o.s}</span>` : ""}</button>`,
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
  PK_EL.classList.remove("on");
  document.getElementById("scrim").classList.remove("on");
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
      "Phương tiện vận tải",
      "Sổ tiết kiệm",
      "Máy móc - thiết bị",
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
    t: "Chi tiết phương án sử dụng vốn",
    o: [
      "Mua tài sản, tiêu dùng cá nhân khác",
      "Bù đắp vốn lưu động",
      "Đầu tư kinh doanh",
    ],
  },
  disburse: {
    t: "Tài khoản nhận tiền giải ngân",
    o: ["666888666", "666414666", "888899999"],
  },
};
const PURPOSE_MAP = {
  "Vay tiêu dùng": "Vay tiêu dùng",
  "Vay kinh doanh": "Vay kinh doanh",
  "Vay mua nhà": "Vay mua nhà",
  "Vay mua ô tô": "Vay mua ô tô",
  "Vay thấu chi": "Vay thấu chi",
};
// Sản phẩm có tài sản bảo đảm sẽ chọn sẵn hình thức Thế chấp.
const SECURED_PRODS = ["Vay mua nhà", "Vay mua ô tô"];
const UNSECURED_PURPOSES = new Set([
  "Vay tiêu dùng",
  "Vay kinh doanh",
  "Vay thấu chi",
]);
let regType = "thechap";
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
function startReg(prod) {
  resetRegForm();
  setPickVal("purpose", PURPOSE_MAP[prod] || prod);
  if (SECURED_PRODS.includes(prod)) {
    const rt = document.querySelector('input[name="regType"][value="thechap"]');
    if (rt) rt.checked = true;
    applyRegType("thechap");
  }
  navigateTo("regform");
}
function resetRegForm() {
  const rt = document.querySelector('input[name="regType"][value="thechap"]');
  if (rt) rt.checked = true;
  applyRegType("thechap");
  const rg = document.getElementById("regTypeGrp");
  if (rg) rg.hidden = false;
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
  setPickVal("regWard", "Xã Tiền Yên");
  regAddr.reset();
  document.getElementById("regform").scrollTop = 0;
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
    data.amount > 0 &&
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
  const button = document.getElementById("fSubmit");
  if (button) button.disabled = !isRegDataComplete();
}
function validateRegData(data, requireConsent = false) {
  if (!(data.amount > 0)) {
    toast("Vui lòng nhập số tiền đề nghị vay");
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
    regType === "thechap" ? "Vay thế chấp" : "Vay tín chấp",
  );
  setText("regReviewPurpose", data.purpose);
  setText("regReviewAmount", rFmt(data.amount) + " VND");
  setText("regReviewTerm", data.term);
  document.getElementById("regReviewAssetSection").hidden =
    regType !== "thechap";
  setText("regReviewAssetTypes", data.assetTypes.join(", "));
  setText("regReviewAssetValue", data.assetValue);
  setText("regReviewName", "Nguyen Van A");
  setText("regReviewPhone", "0989777999");
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
    `${rPad(executedAt.getHours())}:${rPad(executedAt.getMinutes())} - ${rPad(executedAt.getDate())}/${rPad(executedAt.getMonth() + 1)}/${executedAt.getFullYear()}`;
  document.getElementById("dPurpose").textContent = purpose;
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
let demandMax = 0; // Số tiền vay tối đa của sổ đang chọn

function handleSavingsSelect(id) {
  const savingsData = {
    s1: {
      amount: "80,000,000",
      max: 80000000,
      rate: "12%/năm",
      endDate: "15/09/2027", // = Ngày đáo hạn của sổ
      account: "000001105208",
      maturity: "15/09/2027",
      term: "15",
    },
    s2: {
      amount: "95,000,000",
      max: 400000000,
      rate: "8.65%/năm",
      endDate: "30/09/2027",
      account: "000002710195",
      maturity: "31/12/2027",
      term: "15",
    },
  };
  const data = savingsData[id];
  if (!data) return;
  demandMax = data.max; // thêm dòng này
  // ... phần còn lại giữ nguyên ...
  document.getElementById("contract-account").textContent = data.account;
  syncDemandAmount(); // thêm dòng này ở cuối hàm
}
const demandInput = document.getElementById("demand-amount");
const demandErr = document.getElementById("demand-amount-err");
const demandNext = document.getElementById("btn-demand-next");

function syncDemandAmount() {
  const n = +demandInput.value.replace(/\D/g, "") || 0;
  const over = demandMax > 0 && n > demandMax;
  demandErr.hidden = !over;
  if (over)
    demandErr.textContent =
      "Số tiền vay tối đa là " + demandMax.toLocaleString("en-US") + " VND";
  demandInput.closest(".fld").classList.toggle("is-error", over);
  demandNext.disabled = over;
  // đồng bộ số tiền người dùng nhập sang màn Xác nhận & Hợp đồng
  const txt = demandInput.value || "0";
  document.getElementById("confirm-loan-amount").textContent = txt + " VND";
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
      '<svg style="width:60px;height:60px;color:#22b35e"><use href="#check"/></svg>';
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

/* --- Offer info popover logic: show at info icon position --- */
(() => {
  const closeAll = () => {
    document
      .querySelectorAll(".offer-popover.on")
      .forEach((p) => p.classList.remove("on"));
  };
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-info-toggle]");
    const insidePopover = e.target.closest(".offer-popover");
    if (!btn && !insidePopover) {
      closeAll();
      return;
    }
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const wrap = btn.closest(".info-wrap");
      const pop = wrap ? wrap.querySelector(".offer-popover") : null;
      if (!pop) return;
      const wasOpen = pop.classList.contains("on");
      closeAll();
      if (!wasOpen) pop.classList.add("on");
    }
  });
  // close on scroll of loan screen
  const loan = document.getElementById("loan");
  if (loan) loan.addEventListener("scroll", closeAll, { passive: true });
  // close on navigation
  window.addEventListener("hashchange", closeAll);
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
    interest: 0.002375,
    payDay: 25,
    acc: "666414666",
  };
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
  /* --- Nơi ở hiện tại: bấm bút → Tỉnh/Thành phố + Xã/Phường, có Hủy chỉnh sửa (logic dùng chung: initAddrEdit) --- */
  const addrEdit = initAddrEdit({
    addr: $i("od-addr"),
    edit: $i("od-addr-edit"),
    extra: $i("od-addr-extra"),
    cancel: $i("od-addr-cancel"),
    prov: "odProvince",
    ward: "odWard",
  });
  let term = 12;
  const amt = () => +dig($i("od-amt").value);
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
    $i("od-pay").innerHTML = [
      ["Lãi suất vay", OD.rate + "%"],
      ["Phí mở hạn mức", f(a * OD.openFee) + " VND"],
      ["Phí quản lý hạn mức", f(a * OD.mgmtFee) + " VND"],
      ["Lãi trả hàng tháng ước tính", f(a * OD.interest) + " VND"],
    ]
      .map(([l, v]) => `<div class="od-row">${l}<b>${v}</b></div>`)
      .join("");
  }
  ["od-amt", "od-eq"].forEach((id) =>
    $i(id).addEventListener("input", (e) => {
      let d = dig(e.target.value)
        .replace(/^0+(?=\d)/, "")
        .slice(0, 12);
      if (id === "od-amt" && +d > limit) {
        d = String(limit);
        toast("Số tiền vay tối đa là " + f(limit) + " VND");
      }
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
    term = 12;
    $i("od-term-val").textContent = "12 tháng";
    $i("od-amt").value = f(limit);
    $i("od-eq").value = "0";
    upd();
    $i("od-p1").value = "099 888 9999";
    $i("od-p2").value = "098 765 4322";
    $i("od-addr").value =
      "Xóm 2, Yên Thái, Xã Tiền Yên, Huyện Hoài Đức, Hà Nội";
    $i("od-ref1").value = $i("od-ref2").value = "";
    setPickVal("odRel1", RELS[0]);
    setPickVal("odRel2", RELS[2]);
    setPickVal("odBranch", "CN Hà Nội");
    setPickVal("odProvince", "TP. Hà Nội");
    setPickVal("odWard", "Xã Tiền Yên");
    addrEdit.reset();
    $i("oc-agree").checked = false;
    $i("oc-btn").disabled = true;
  }

  /* --- Tiếp tục: validate --- */
  $i("od-next1").onclick = () => {
    const a = amt();
    if (!a) return toast("Vui lòng nhập số tiền");
    if (a > limit) return toast("Số tiền tối đa là " + f(limit) + " VND");
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
    navigateTo("od-confirm");
  };

  /* --- Màn Xác nhận thông tin --- */
  function fillConfirm() {
    const a = amt(),
      now = new Date(),
      end = new Date(now);
    end.setMonth(end.getMonth() + term);
    const phones = ["od-p1", "od-p2"].map((i) => dig($i(i).value));
    const card = (t, r) =>
      `<div class="dcard">${t ? `<h3>${t}</h3>` : ""}${r.map(([l, v]) => `<div class="confirm-row"><span>${l}</span><b>${v}</b></div>`).join("")}</div>`;
    $i("oc-cards").innerHTML =
      card("Thông tin khách hàng", [
        ["Họ và tên", "NGUYEN VAN A"],
        ["Số giấy tờ tùy thân", "003588617942"],
        ["Ngày cấp", "18/02/2022"],
        ["Nơi cấp", "Bộ Công an"],
        [
          "Địa chỉ thường trú",
          "Số 25 đường Nguyễn Tuân, phường Thanh Xuân, TP. Hà Nội",
        ],
        ["Nơi ở hiện tại", esc($i("od-addr").value.trim())],
        ["Số điện thoại liên hệ", "0934599999"],
        ["Email", "nguyenvana@gmail.com"],
        ["Số điện thoại Người tham chiếu", phones.join("<br>")],
      ]) +
      card("Thông tin khoản vay", [
        ["Hạn mức vay", f(a) + " VND"],
        ["Thời hạn vay", term + " tháng"],
        ["Lãi suất vay", OD.rate + "%/năm"],
        ["Mục đích vay", "Tiêu dùng phục vụ đời sống"],
        ["Tài khoản trả lãi", OD.acc],
        [
          "Tài khoản trả gốc",
          "Tài khoản thấu chi do SeABank mở cho Khách hàng",
        ],
        ["Ngày trả lãi hàng tháng", OD.payDay],
        ["Ngày trả gốc", dm(end)],
      ]) +
      card("Thông tin khác", [
        ["Phí mở hạn mức thấu chi", f(a * OD.openFee) + " VND/Tài khoản"],
        ["Phí quản lý hạn mức thấu chi", f(a * OD.mgmtFee) + " VND/Tài khoản"],
        ["Tài khoản trả phí", OD.acc],
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
    if (id === "od-profile") requestAnimationFrame(addrEdit.fit);
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

  // Mặc định theo ảnh thiết kế. Ghi đè riêng từng khoản vay bằng data-limit / data-debt / data-max trên thẻ .loan
  const INC = {
    limit: 100000000,
    debt: 100000000,
    min: 10000000,
    max: 50000000,
    rate: 12,
    opened: "03/04/2026",
    expires: "03/04/2027",
  };
  let cur = {
    acc: "000001105208",
    limit: INC.limit,
    debt: INC.debt,
    min: INC.min,
    max: INC.max,
  };
  let incFlow = false;

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
      cur = {
        acc: dig(c.querySelector(".no").textContent) || cur.acc,
        limit: +d.limit || INC.limit,
        debt: +d.debt || INC.debt,
        min: +d.min || INC.min,
        max: +d.max || INC.max,
      };
    },
    true,
  );

  /* --- Màn Thay đổi hạn mức --- */
  function reset() {
    $i("inc-acc").textContent = cur.acc;
    $i("inc-cur").textContent = f(cur.limit) + " VND";
    $i("inc-debt").textContent = f(cur.debt) + " VND";
    $i("inc-min").textContent = f(cur.min) + " VND";
    $i("inc-max").textContent = f(cur.max) + " VND";
    $i("inc-amt").value = "";
  }
  $i("inc-amt").addEventListener("input", (e) => {
    let d = dig(e.target.value)
      .replace(/^0+(?=\d)/, "")
      .slice(0, 12);
    if (+d > cur.max) {
      d = String(cur.max);
      toast("Hạn mức tối đa là " + f(cur.max) + " VND");
    }
    e.target.value = d ? (+d).toLocaleString("en-US") : "";
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
    const card = (t, r) =>
      `<div class="dcard">${t ? `<h3>${t}</h3>` : ""}${r.map(([l, v]) => `<div class="confirm-row"><span>${l}</span><b>${v}</b></div>`).join("")}</div>`;
    $i("inc-cards").innerHTML =
      card("Thông tin khách hàng", [
        ["Họ và tên", "NGUYEN VAN A"],
        ["Số giấy tờ tùy thân", "xxx"],
        ["Ngày cấp", "18/02/2009"],
        ["Nơi cấp", "CA Hà Nội"],
        ["Địa chỉ thường trú", "25 Tran Hung Dao, Ha Noi"],
        ["Nơi ở hiện tại", "25 Tran Hung Dao, Ha Noi"],
        ["Số điện thoại", "0934599999"],
      ]) +
      card("Thông tin khoản vay", [
        ["Tài khoản thấu chi", cur.acc],
        ["Hạn mức hiện tại", f(cur.limit) + " VND"],
        ["Hạn mức đề xuất", f(a) + " VND"],
        ["Ngày mở", INC.opened],
        ["Ngày hết hạn", INC.expires],
        ["Lãi suất", INC.rate + "%/năm"],
        ["Nội dung khác", `Giữ nguyên theo tài khoản thấu chi (${cur.acc})`],
      ]);
    $i("inc-cards").scrollTop = 0;
  }
  // Xác nhận → sinh trắc học → OTP (luồng cũ) → màn Cập nhật thành công
  $i("inc-ok").onclick = () => {
    incFlow = true;
    navigateTo("biometric");
  };

  /* --- Màn thành công: xem chi tiết khoản vay (về Hồ sơ & Khoản vay > Khoản vay hiện tại > Chi tiết) --- */
  $i("inc-view").onclick = () => {
    historyStack = ["loan", "profile"];
    setTab("2");
    navigateTo("detail");
  };

  /* --- Hook điều hướng: OTP xong thì chuyển sang màn thành công riêng của luồng này --- */
  const _nav = navigateTo;
  navigateTo = function (id, push) {
    if (id === "final-success" && incFlow) id = "od-inc-success";
    if (id !== "biometric" && id !== "otp") incFlow = false;
    _nav(id, push);
    if (id === "od-inc-demand") reset();
    if (id === "od-inc-confirm") fillConfirm();
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
    acc: "000001105208",
    limit: 100000000,
    debt: 100000000,
    interest: 1000000,
    fee: 0,
  };
  const closeAccounts = [
    "000004829999 • TK TG THANH TOÁN",
    "666414666 • TK TG THANH TOÁN",
  ];
  let selectedCloseAccount = closeAccounts[1];
  let closeFlow = false;

  function closeTotal() {
    return CLOSE.debt + CLOSE.interest + CLOSE.fee;
  }

  function renderCloseDemand() {
    $i("close-acc").textContent = CLOSE.acc;
    $i("close-limit").textContent = f(CLOSE.limit) + " VND";
    $i("close-debt").textContent = f(CLOSE.debt) + " VND";
    $i("close-interest").textContent = f(CLOSE.interest) + " VND";
    $i("close-fee").textContent = f(CLOSE.fee) + " VND";
    $i("close-total").textContent = f(closeTotal()) + " VND";
    $i("close-account-value").textContent = selectedCloseAccount;
  }

  function setSelectedCloseAccount(value) {
    selectedCloseAccount = value;
    $i("close-account-value").textContent = value;
    document.querySelectorAll("[data-close-account]").forEach((b) => {
      b.classList.toggle("on", b.dataset.closeAccount === value);
    });
  }

  function closeAccountSheet(on) {
    $i("closeAccountSheet").classList.toggle("on", on);
    $i("closeAccountScrim").classList.toggle("on", on);
  }

  window.closeCloseAccountSheet = () => {
    const was = $i("closeAccountSheet").classList.contains("on");
    closeAccountSheet(false);
    return was;
  };

  $i("close-account-picker").onclick = () => closeAccountSheet(true);
  $i("closeAccountClose").onclick = () => closeAccountSheet(false);
  $i("closeAccountScrim").onclick = () => closeAccountSheet(false);
  document.querySelectorAll("[data-close-account]").forEach((b) => {
    b.addEventListener("click", () =>
      setSelectedCloseAccount(b.dataset.closeAccount),
    );
  });

  function fillCloseConfirm() {
    const now = new Date();
    const card = (title, rows) =>
      `<div class="dcard"><h3>${title}</h3>${rows
        .map(
          ([l, v]) =>
            `<div class="confirm-row"><span>${l}</span><b>${v}</b></div>`,
        )
        .join("")}</div>`;

    $i("close-cards").innerHTML =
      card("Thông tin khách hàng", [
        ["Họ và tên", "NGUYEN VAN A"],
        ["Số giấy tờ tùy thân", "003588617942"],
        ["Ngày cấp", "18/02/2022"],
        ["Nơi cấp", "Bộ Công an"],
        [
          "Địa chỉ thường trú",
          "Số 25 đường Nguyễn Tuân, phường Thanh Xuân, TP. Hà Nội",
        ],
        [
          "Nơi ở hiện tại",
          "Số 25 đường Nguyễn Tuân, phường Thanh Xuân, TP. Hà Nội",
        ],
        ["Số điện thoại", "0934599999"],
      ]) +
      card("Thông tin tài khoản thấu chi sẽ đóng", [
        ["Tài khoản thấu chi", CLOSE.acc],
        ["Hạn mức hiện tại", f(CLOSE.limit) + " VND"],
        ["Dư nợ hiện tại", f(CLOSE.debt) + " VND"],
        ["Tiền lãi", f(CLOSE.interest) + " VND"],
        ["Phí đóng hạn mức (gồm VAT)", f(CLOSE.fee) + " VND"],
      ]) +
      card("Thông tin giao dịch", [
        ["Tài khoản thu nợ", selectedCloseAccount],
        ["Tổng tiền thanh toán", f(closeTotal()) + " VND"],
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
    if (id === "final-success" && closeFlow) id = "od-close-success";
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
  const toNum = (s) => +String(s).replace(/\D/g, "") || 0;

  loans.forEach((c) => {
    c.dataset.channel = c.querySelector(".btns") ? "online" : "counter";
  });

  // Tổng dư nợ luôn là tổng của TẤT CẢ khoản vay, không đổi theo chip đang chọn
  const totalEl = document.getElementById("totalDebt");
  if (totalEl) {
    const sum = loans.reduce((s, c) => {
      const r = [...c.querySelectorAll(".row")].find((x) =>
        /^\s*Dư nợ còn lại/.test(x.textContent),
      );
      return s + (r ? toNum(r.querySelector("b").textContent) : 0);
    }, 0);
    totalEl.firstChild.nodeValue = sum.toLocaleString("en-US") + " ";
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
   Khoản vay tại quầy khai báo dữ liệu riêng bên dưới, khóa theo số hợp đồng; nhãn phải trùng nhãn trong màn Chi tiết. */
(() => {
  const detail = document.getElementById("detail");
  if (!detail) return;
  const rows = [...detail.querySelectorAll(".dcard .row")];
  const labelOf = (r) =>
    r.childNodes[0].textContent.replace(/\s+/g, " ").trim();
  const valEl = (r) => r.querySelector("b");
  const base = rows.map((r) => ({
    r,
    label: labelOf(r),
    value: valEl(r).textContent,
  }));

  const DETAILS = {
    // Vay mua bất động sản - giải ngân 1,5 tỷ, 240 tháng, 9,5%/năm, trả niên kim; đã trả 10 kỳ
    LD2531514476: {
      "Số hợp đồng vay": "LD2531514476",
      "Mục đích vay": "Mua bất động sản",
      "Số tiền cho vay": "1,500,000,000 VND",
      "Dư nợ hiện tại": "1,478,163,647 VND",
      "Lãi suất cho vay": "9.50%/năm",
      "Tiền lãi tạm tính": "9,233,461 VND",
      "Hạn thanh toán kỳ tiếp theo": "15/10/2026",
      "Số tiền thanh toán kỳ tiếp theo": "13,981,968 VND",
      "Thời gian cho vay": "240 tháng",
      "Ngày giải ngân": "11/11/2025",
      "Ngày đến hạn": "15/11/2045",
      "Tài khoản thu nợ": "666414666",
      "Chi nhánh quản lý": "CN Cầu Giấy",
    },
    // Vay mua ô tô - giải ngân 608,5 triệu, 96 tháng, 8,9%/năm, trả niên kim; đã trả 39 kỳ
    LD2316300948: {
      "Số hợp đồng vay": "LD2316300948",
      "Mục đích vay": "Mua ô tô",
      "Số tiền cho vay": "608,500,000 VND",
      "Dư nợ hiện tại": "411,697,000 VND",
      "Lãi suất cho vay": "8.90%/năm",
      "Tiền lãi tạm tính": "1,606,168 VND",
      "Hạn thanh toán kỳ tiếp theo": "23/10/2026",
      "Số tiền thanh toán kỳ tiếp theo": "8,883,792 VND",
      "Thời gian cho vay": "96 tháng",
      "Ngày giải ngân": "12/06/2023",
      "Ngày đến hạn": "23/06/2031",
      "Tài khoản thu nợ": "666414666",
      "Chi nhánh quản lý": "CN Cầu Giấy",
    },
    "od-luong": {
      "Số hợp đồng vay": "000001105208",
      "Mục đích vay": "Tiêu dùng phục vụ đời sống",
      "Số tiền cho vay": ["Hạn mức thấu chi", "100,000,000 VND"],
      "Dư nợ hiện tại": "100,000,000 VND",
      "Lãi suất cho vay": "12.00%/năm",
      "Tiền lãi tạm tính": "720,000 VND",
      "Hạn thanh toán kỳ tiếp theo": [
        "Ngày trả lãi kỳ tiếp theo",
        "25/10/2026",
      ],
      "Số tiền thanh toán kỳ tiếp theo": [
        "Số tiền lãi kỳ tiếp theo",
        "720,000 VND",
      ],
      "Thời gian cho vay": ["Thời hạn vay", "12 tháng"],
      "Ngày giải ngân": ["Ngày mở hạn mức", "03/04/2026"],
      "Ngày đến hạn": ["Ngày hết hạn", "03/04/2027"],
      "Tài khoản thu nợ": "666414666",
      "Chi nhánh quản lý": "CN Cầu Giấy",
    },
  };

  // Tham số lịch trả nợ (niên kim, lãi r/12). paid = số kỳ đã trả; pmt/balance khớp danh sách & chi tiết.
  // first = [tháng, năm] của kỳ 1; day = ngày trả nợ hằng tháng. Thêm khoản vay trả định kỳ khác = thêm 1 mục ở đây.
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
    },
  };
  window.LOAN_SCHEDULES = SCHEDULES;

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
    const actions =
      key === "savings-pledge"
        ? [
            { label: "Xem hợp đồng", document: true },
            {
              label: "Vay thêm",
              soon: "Tính năng Vay thêm chưa có trong mock-up",
            },
            { label: "Trả nợ một phần", prepay: "partial" },
            { label: "Tất toán", prepay: "settle" },
          ]
        : [
            { label: "Xem hợp đồng", document: true },
            key === "od-luong"
              ? { label: "Tăng hạn mức", go: "od-inc-demand" }
              : {
                  label: "Tăng hạn mức",
                  soon: "Tính năng Tăng hạn mức chưa có trong mock-up",
                },
            {
              label: "Giảm hạn mức",
              soon: "Tính năng Giảm hạn mức chưa có trong mock-up",
            },
            {
              label: "Đóng hạn mức",
              soon: "Tính năng Đóng hạn mức chưa có trong mock-up",
            },
          ];

    buttons.forEach((button, index) => {
      const action = actions[index];
      if (!action) return;
      const label = button.querySelector(".tb2-label");
      if (label) label.textContent = action.label;
      button.removeAttribute("data-go");
      button.removeAttribute("data-soon");
      button.onclick = null;
      if (action.go) button.dataset.go = action.go;
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
    base.forEach(({ r, label, value }) => {
      const o = d[label];
      const [l, v] = Array.isArray(o) ? o : [label, o ?? value];
      r.childNodes[0].textContent = l;
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
      const no = loan
        ? loan
            .querySelector(".no")
            .textContent.replace(/^.*:\s*/, "")
            .trim()
        : "";
      showDetail(no, loan && loan.dataset.channel, loan && loan.dataset.detail);
      if (incView)
        incView.addEventListener(
          "click",
          () => showDetail("", "online", "od-luong"),
          true,
        );
    },
    true,
  );
  // Luồng Tăng hạn mức thấu chi → "Xem chi tiết khoản vay": giữ hành vi cũ (nội dung mặc định)
  const incView = document.getElementById("inc-view");
  if (incView)
    incView.addEventListener(
      "click",
      () => showDetail("", "online", "od-luong"),
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
  let rows = [];

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
      out.unshift({
        k,
        date: date(k),
        principal,
        interest: c.pmt - principal,
        total: c.pmt,
        balance: b,
        st: "paid",
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
    return `<div class="rs-item${paid ? " is-paid" : ""}">
      <div class="rs-payment-main">
        <b>Kỳ ${r.k}</b>
        <span>${r.date}</span>
      </div>
      <div class="rs-payment-side">
        <b class="rs-amount">${f(r.total)} <small>VND</small></b>
        <span class="rs-status${paid ? " is-paid" : ""}">${paid ? "Đã thanh toán" : "Chưa đến hạn"}</span>
      </div>
    </div>`;
  }
  function paint() {
    const years = new Map();
    rows.forEach((row) => {
      const year = row.date.slice(-4);
      if (!years.has(year)) years.set(year, []);
      years.get(year).push(row);
    });
    const expandedYear =
      rows.find((row) => row.st !== "paid")?.date.slice(-4) ||
      rows[0]?.date.slice(-4);
    list.innerHTML = [...years]
      .map(([year, installments]) => {
        const expanded = year === expandedYear;
        return `
          <section class="rs-year">
            <button class="rs-year-toggle" type="button" aria-expanded="${expanded}">
              <span class="rs-year-title">${year}</span>
              <span class="rs-year-count">${installments.length} kỳ</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            <div class="rs-year-content"${expanded ? "" : " hidden"}>
              ${installments.map(item).join("")}
            </div>
          </section>`;
      })
      .join("");
  }
  function open(contract) {
    const cfg = (window.LOAN_SCHEDULES || {})[contract];
    if (!cfg) return;
    rows = build(cfg);
    const paidRows = rows.filter((r) => r.st === "paid");
    el("rsProgTxt").textContent = `${cfg.paid}/${cfg.term}`;
    el("rsFill").style.width = (cfg.paid / cfg.term) * 100 + "%";
    el("rsPaid").textContent = f(
      paidRows.reduce((s, r) => s + r.total, 0),
    );
    paint();
  }
  list.addEventListener("click", (event) => {
    const button = event.target.closest(".rs-year-toggle");
    if (!button) return;
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    button.nextElementSibling.hidden = expanded;
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
    payment: [
      {
        id: "000004829999_TK",
        name: "000004829999 • TK TG THANH TOÁN",
        number: "000004829999",
        type: "Tài khoản thanh toán",
        balance: "800,000,000 VND",
      },
      {
        id: "666414666_TK",
        name: "666414666 • TK TG THANH TOÁN",
        number: "666414666",
        type: "Tài khoản thanh toán",
        balance: "800,000,000 VND",
      },
    ],
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
    const debt = rowNum(card, /^\s*Dư nợ còn lại/);
    const nextPay = rowNum(card, /^\s*Số tiền thanh toán kỳ tiếp theo/);
    PREPAY.contract = card
      .querySelector(".no")
      .textContent.replace(/^.*:\s*/, "")
      .trim();
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
    const n = partial ? +amountIn.value.replace(/\D/g, "") || 0 : 0;
    const over = partial && n > PREPAY.debt;
    if (partial) PREPAY.amount = n;
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
    if (!partial) PREPAY.amount = PREPAY.debt + PREPAY.interest;
    $i("prepay-mode-value").textContent = partial
      ? "Trả nợ trước hạn một phần"
      : "Tất toán khoản vay";
    $i("prepay-amount-row").hidden = partial;
    $i("prepay-amount-field").hidden = !partial;
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
    $i("prepay-title").textContent = partial
      ? "Trả nợ một phần"
      : "Tất toán khoản vay";
    $i("prepay-amount-display").textContent = f(
      PREPAY.debt + PREPAY.interest,
    ) + " VND";
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
        <div class="confirm-row"><span>Lãi suất cho vay</span><b>9%/năm</b></div>
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
    $i("prepay-done-title").textContent = partial
      ? "Trả nợ trước hạn thành công"
      : "Tất toán thành công";
    $i("prepay-done-msg").textContent = partial
      ? "SeABank đã xử lý yêu cầu trả nợ trước hạn một phần của Quý khách."
      : "SeABank đã xử lý yêu cầu tất toán khoản vay của Quý khách.";
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
    navigateTo("prepay-confirm");
  };

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
      $i("fs-title").textContent = "Thông tin vay cầm cố sổ tiết kiệm";
      $i("fs-limit-lb").textContent = "Số tiền vay";
      $i("fs-term-lb").textContent = "Thời hạn vay";
      $i("fs-limit").textContent = (fmt(amount) || "0") + " VND";
      $i("fs-term").textContent = termText(
        $i("confirm-loan-end").textContent.trim(),
      );
      $i("fs-rate").textContent = $i("confirm-loan-rate").textContent;
      return;
    }

    // Luồng Thấu chi: giữ nguyên như cũ
    const odAmt = ($i("od-amt").value || "").replace(/\D/g, "");
    $i("fs-title").textContent = "Thông tin thấu chi";
    $i("fs-limit-lb").textContent = "Hạn mức thấu chi";
    $i("fs-term-lb").textContent = "Thời hạn";
    $i("fs-rate").textContent = "12%/năm";
    $i("fs-limit").textContent = odAmt ? fmt(odAmt) + " VND" : "10.000.000 VND";
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
document
  .querySelectorAll('[data-go="loan"][aria-label="Trang chủ vay"]')
  .forEach((btn) => {
    btn.dataset.go = "home";
  });
render("home");
