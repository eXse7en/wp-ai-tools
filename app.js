const $ = (id) => document.getElementById(id);

function slugify(s){
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function setStatus(msg){ $("status").textContent = msg || ""; }

function toSeoText(seo){
  return [
    `Title: ${seo.title || ""}`,
    `Slug: ${seo.slug || ""}`,
    `Meta description: ${seo.meta_description || ""}`,
    `Tags: ${(seo.tags || []).join(", ")}`
  ].join("\n");
}

async function copyToClipboard(text){
  await navigator.clipboard.writeText(text);
}

function tabInit(){
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      tabs.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".tabpane").forEach(p=>p.classList.remove("show"));
      document.getElementById("tab-" + btn.dataset.tab).classList.add("show");
    });
  });
}

async function generate(){
  const topic = $("topic").value.trim();
  const keyword = $("keyword").value.trim();
  const length = $("length").value;
  const myths = $("myths").value;
  const ctaText = $("ctaText").value.trim() || "Baca Panduan Lainnya";
  const ctaUrl = $("ctaUrl").value.trim() || "https://contoh.com";
  const workerUrl = $("workerUrl").value.trim();

  if(!topic) return setStatus("Isi topik dulu.");
  if(!workerUrl) return setStatus("Tempel dulu Worker URL kamu (…/generate).");

  $("btnGen").disabled = true;
  $("btnCopyGutenberg").disabled = true;
  $("btnCopySeo").disabled = true;
  $("outGutenberg").value = "";
  $("outSeo").value = "";
  setStatus("Generating…");

  try{
    const payload = {
      topic,
      keyword,
      length,
      include_myths: myths === "yes",
      cta: { text: ctaText, url: ctaUrl },
      tone: "edukasi_santai_kesehatan",
      audience: "masyarakat umum"
    };

    const res = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });

    if(!res.ok){
      const t = await res.text();
      throw new Error(`Worker error (${res.status}): ${t}`);
    }

    const data = await res.json();
    $("outGutenberg").value = data.gutenberg_html || "";
    $("outSeo").value = toSeoText(data.seo || {});

    $("btnCopyGutenberg").disabled = !data.gutenberg_html;
    $("btnCopySeo").disabled = !data.seo;

    setStatus("Selesai ✅ Tinggal Copy Gutenberg → paste ke Jetpack (Editor Kode).");
  }catch(e){
    console.error(e);
    setStatus("Gagal: " + (e.message || e));
  }finally{
    $("btnGen").disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  tabInit();

  // Auto bantu slug saat user isi topik (opsional)
  $("topic").addEventListener("input", ()=>{
    // no-op, just placeholder if you want extra UX later
  });

  $("btnGen").addEventListener("click", generate);

  $("btnCopyGutenberg").addEventListener("click", async ()=>{
    await copyToClipboard($("outGutenberg").value);
    setStatus("Gutenberg copied ✅");
  });

  $("btnCopySeo").addEventListener("click", async ()=>{
    await copyToClipboard($("outSeo").value);
    setStatus("SEO Pack copied ✅");
  });
});
