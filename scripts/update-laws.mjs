#!/usr/bin/env node
/**
 * update-laws.mjs — 同步全國法規資料庫的最新異動日期
 *
 * 用法（GitHub Actions 內）：
 *   curl -sL -o chlaw.zip "https://law.moj.gov.tw/api/ch/law/json"
 *   unzip -o chlaw.zip
 *   node scripts/update-laws.mjs ChLaw.json
 *
 * 行為：
 *   1. 讀取全庫 JSON（法規名稱 / 法規網址 / 最新異動日期 / 廢止註記）
 *   2. 以「法規名稱完全一致」比對 laws.json 中 matchType=exact 的條目
 *   3. 更新 amendDate（民國年 YYYMMDD）、url、abolished
 *   4. 寫回 laws.json 並更新 updated 時間戳
 *   5. 任何 exact 條目比對不到 → 印出警告（名稱可能已修正，需人工確認）
 */
import { readFileSync, writeFileSync } from "node:fs";

const dbPath = process.argv[2];
if (!dbPath) { console.error("用法: node scripts/update-laws.mjs <ChLaw.json 路徑>"); process.exit(1); }

// ── 讀取全庫資料（容錯：頂層可能是陣列或 {Laws:[...]}）──
const raw = JSON.parse(readFileSync(dbPath, "utf8").replace(/^﻿/, ""));
const all = Array.isArray(raw) ? raw : (raw.Laws || raw.laws || []);
if (!all.length) { console.error("❌ 全庫資料為空，中止（不覆寫既有日期）"); process.exit(1); }

// 建立 名稱 → 法規 的索引（容錯不同欄位命名）
const pick = (o, keys) => { for (const k of keys) if (o[k] != null && o[k] !== "") return o[k]; return null; };
const index = new Map();
for (const law of all) {
  const name = pick(law, ["法規名稱", "LawName", "name"]);
  if (name) index.set(String(name).trim(), law);
}
console.log(`📚 全庫載入 ${index.size} 部法規`);

// ── 比對更新 ──
const registryPath = new URL("../laws.json", import.meta.url).pathname;
const registry = JSON.parse(readFileSync(registryPath, "utf8"));
let updated = 0, unmatched = [];

for (const item of registry.laws) {
  if (item.matchType !== "exact") continue;
  const hit = index.get(item.name.trim());
  if (!hit) { unmatched.push(item.name); continue; }

  const date = pick(hit, ["最新異動日期", "LawModifiedDate", "modifiedDate"]);
  const url = pick(hit, ["法規網址", "LawURL", "url"]);
  const abolished = String(pick(hit, ["廢止註記", "LawAbandonNote"]) || "").trim() !== "";

  const before = JSON.stringify([item.amendDate, item.url, item.abolished]);
  if (date) item.amendDate = String(date).trim();
  if (url) item.url = String(url).trim();
  item.abolished = abolished;
  if (JSON.stringify([item.amendDate, item.url, item.abolished]) !== before) updated++;
}

registry.updated = new Date().toISOString();
writeFileSync(registryPath, JSON.stringify(registry, null, 2) + "\n", "utf8");

// ── 同步嵌入 index.html 的種子資料（讓本機/離線預覽也拿到最新日期）──
const htmlPath = new URL("../index.html", import.meta.url).pathname;
let html = readFileSync(htmlPath, "utf8");
html = html.replace(
  /(<script id="seed" type="application\/json">)[\s\S]*?(<\/script>)/,
  `$1${JSON.stringify(registry)}$2`
);
writeFileSync(htmlPath, html, "utf8");

console.log(`✅ 更新 ${updated} 筆，時間戳 ${registry.updated}`);
if (unmatched.length) {
  console.log(`⚠️  以下 ${unmatched.length} 筆名稱在全庫中比對不到（法規可能已更名，請人工確認）：`);
  unmatched.forEach(n => console.log("   - " + n));
}
