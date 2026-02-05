const $ = (id) => document.getElementById(id);

function setStatus(msg) {
  $("status").textContent = msg || "";
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

function toSeoText(seo) {
  return [
    `Title: ${seo?.title || ""}`,
    `Slug: ${seo?.slug || ""}`,
    `Meta description: ${seo?.meta_description || ""}`,
    `Tags: ${(seo?.tags || []).join(", ")}`
  ].join("\n");
}

function tabInit() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".tabpane").forEach((p) => p.classList.remove("show"));
      document.getElementById("tab-" + btn.dataset.tab).classList.add("show");
    });
  });
}

function resetOutputs() {
  $("outGutenberg").value = "";
  $("outSeo").value = "";
  $("outDisclaimer").value = "";
  $("outSchema").value = "";

  $("btnCopyGutenberg").disabled = true;
  $("btnCopySeo").disabled = true;
  $("btnCopyDisclaimer").disabled = true;
  $("btnCopySchema").disabled = true;
}

async function generate() {
  const topic = $("topic").value.trim();
  const keyword = $("keyword").value.trim();
  const length = $("length").value;
  const model = $("model").value;
  const myths = $("myths").value;
  const ctaText = $("ctaText").value.trim() || "Baca Panduan Lainnya";
  const ctaUrl = $("ctaUrl").value.trim() || "https://contoh.com";
  const workerUrl = $("workerUrl").value.trim();

  if (!topic) return setStatus("Isi topik dulu.");
  if (!workerUrl) return setStatus("Tempel dulu Worker URL kamu (…/generate).");

  $("btnGen").disabled = true;
  resetOutputs();
  setStatus("Generating…");

  try {
    const payload = {
      topic,
      keyword,
      length,
      model,
      include_myths: myths === "yes",
      cta: { text: ctaText, url: ctaUrl }
    };

    const res = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const raw = await res.text();

    if (!res.ok) {
      // Kalau error JSON (misal cooldown), tampilkan pesan bagus
      try {
        const j = JSON.parse(raw);

        if (res.status === 429 && j.retry_after_seconds) {
          throw new Error(`Cooldown: tunggu ${j.retry_after_seconds} detik sebelum generate lagi.`);
        }

        if (j.message) throw new Error(j.message);
        if (j.error) throw new Error(typeof j.error === "string" ? j.error : JSON.stringify(j.error));

        throw new Error(raw);
      } catch {
        throw new Error(raw);
      }
    }

    const data = JSON.parse(raw);

    // Isi output
    $("outGutenberg").value = data.gutenberg_html || "";
    $("outSeo").value = toSeoText(data.seo || {});
    $("outDisclaimer").value = data.disclaimer_text || "";
    $("outSchema").value = data.faq_schema_jsonld || "";

    // Enable tombol copy
    $("btnCopyGutenberg").disabled = !data.gutenberg_html;
    $("btnCopySeo").disabled = !data.seo;
    $("btnCopyDisclaimer").disabled = !data.disclaimer_text;
    $("btnCopySchema").disabled = !data.faq_schema_jsonld;

    setStatus(`Selesai ✅ Model: ${data.model || model}`);
  } catch (e) {
    console.error(e);
    setStatus("Gagal: " + (e?.message || e));
  } finally {
    $("btnGen").disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  tabInit();

  $("btnGen").addEventListener("click", generate);

  $("btnCopyGutenberg").addEventListener("click", async () => {
    await copyToClipboard($("outGutenberg").value);
    setStatus("Gutenberg copied ✅");
  });

  $("btnCopySeo").addEventListener("click", async () => {
    await copyToClipboard($("outSeo").value);
    setStatus("SEO Pack copied ✅");
  });

  $("btnCopyDisclaimer").addEventListener("click", async () => {
    await copyToClipboard($("outDisclaimer").value);
    setStatus("Disclaimer copied ✅");
  });

  $("btnCopySchema").addEventListener("click", async () => {
    await copyToClipboard($("outSchema").value);
    setStatus("FAQ Schema copied ✅");
  });
});
