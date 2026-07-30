import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the game with installable-app metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Maldita Cosecha Digital<\/title>/i);
  assert.match(html, /<link rel="manifest" href="\/manifest\.webmanifest"\/>/i);
  assert.match(html, /<link rel="apple-touch-icon" href="\/icons\/apple-touch-icon\.png"\/>/i);
  assert.match(html, /<meta name="theme-color" content="#183b25"\/>/i);
  assert.match(html, /Empezar partida/i);
});

test("keeps mobile navigation and PWA support in the production source", async () => {
  const [page, css, layout, manifest, register, serviceWorker] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/manifest.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/pwa-register.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
  ]);

  assert.match(page, /type MobileView = "field" \| "cards" \| "market" \| "status"/);
  assert.match(page, /className="mobile-nav"/);
  assert.match(page, /Navegación de la partida/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /\.dashboard\.mobile-field \.field-zone/);
  assert.match(css, /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(layout, /manifest:\s*"\/manifest\.webmanifest"/);
  assert.match(layout, /<PwaRegister \/>/);
  assert.match(manifest, /display:\s*"standalone"/);
  assert.match(manifest, /icon-512\.png/);
  assert.match(register, /navigator\.serviceWorker\.register\("\/sw\.js"\)/);
  assert.match(serviceWorker, /self\.addEventListener\("fetch"/);
});
