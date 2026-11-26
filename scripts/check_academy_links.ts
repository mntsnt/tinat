import { academyModulesData } from "../lib/academy/content";

console.log("🌐 Tinat Academy URL & Citation Link Verification Tool\n");

type UrlRecord = {
  url: string;
  source: string;
  isVerified: boolean;
  notes?: string;
};

const urlRegistry: UrlRecord[] = [];

for (const module of academyModulesData) {
  for (const resource of module.resources) {
    if (resource.url) {
      urlRegistry.push({
        url: resource.url,
        source: `Module ${module.number} Resource: "${resource.title}"`,
        isVerified: resource.isVerified,
      });
    }
  }

  for (const lesson of module.lessons) {
    for (const ref of lesson.references) {
      if (ref.url) {
        urlRegistry.push({
          url: ref.url,
          source: `Module ${module.number} Lesson "${lesson.title}" Ref: "${ref.id}"`,
          isVerified: ref.isVerified,
          notes: ref.needsReviewReason,
        });
      }
    }
  }
}

console.log(`Discovered ${urlRegistry.length} URLs in curriculum references and resources.\n`);

async function verifyAll() {
  const results: Array<{ url: string; source: string; status: string; httpCode?: number }> = [];

  for (const item of urlRegistry) {
    process.stdout.write(`Testing: ${item.url.slice(0, 60).padEnd(60)} ... `);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(item.url, {
        method: "HEAD",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TinatAcademyVerifier/1.0" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const ok = resp.status >= 200 && resp.status < 400;
      const statusText = ok ? "✅ ACTIVE" : `⚠️ HTTP ${resp.status}`;
      console.log(statusText);
      results.push({ url: item.url, source: item.source, status: statusText, httpCode: resp.status });
    } catch (err: any) {
      const isAbort = err.name === "AbortError";
      const statusText = isAbort ? "⏱️ TIMEOUT" : "❌ UNREACHABLE";
      console.log(statusText);
      results.push({ url: item.url, source: item.source, status: statusText });
    }
  }

  console.log("\n=======================================================");
  console.log("ACADEMY URL STATUS VERIFICATION REPORT");
  console.log("=======================================================");
  console.table(results);
}

verifyAll();
