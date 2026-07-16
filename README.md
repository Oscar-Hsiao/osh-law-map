# 職業安全衛生法子法地圖（5M）— 法規異動自動追蹤

把「職安法子法架構圖（5M 分類）」做成可嵌入部落格的互動工具，
異動日期每週自動同步全國法規資料庫。

## 檔案結構

```
osh-law-map/
├── index.html                        # 主頁面（單檔，含內嵌種子資料）
├── laws.json                         # 法規清單 + 異動日期（機器可讀）
├── scripts/update-laws.mjs           # 同步腳本
└── .github/workflows/update-laws.yml # 每週一 08:00 自動執行
```

## 部署步驟（GitHub Pages，與 law-registry 相同模式）

1. GitHub 建新 repo（例：`osh-law-map`），把本資料夾內容全部推上去
2. Settings → Pages → Source 選 `main` branch、`/ (root)` → Save
3. Settings → Actions → General → Workflow permissions
   → 勾選 **Read and write permissions**（否則 bot 無法 commit）
4. Actions 頁籤 → 「每週同步法規異動日期」→ **Run workflow** 手動跑第一次
   → 成功後 laws.json 會填入所有異動日期，頁面「待同步」徽章消失
5. 網址：`https://<帳號>.github.io/osh-law-map/`

## 嵌入部落格

```html
<iframe src="https://<帳號>.github.io/osh-law-map/"
        style="width:100%;height:1200px;border:none;" loading="lazy"
        title="職業安全衛生法子法地圖"></iframe>
```

## 資料機制

- **matchType: "exact"**：以法規名稱與全庫完全比對，自動更新
  異動日期（民國年格式）、法規網址、廢止註記
- **matchType: "grouping"**：架構圖上的彙整類別（如「承攬管理相關規定」），
  非單一法規，顯示「彙整」徽章、不比對日期
- 比對不到的 exact 條目會在 Actions log 印出 ⚠️ 警告
  （通常代表法規已更名，到全國法規資料庫查新名稱後改 laws.json 即可）
- 90 天內修正 → 紅色「新」徽章並進入頁首「異動雷達」；365 天內 → 琥珀色日期

## 法規異動時的維運

- 新增法規：在 laws.json 對應 category 加一筆（照現有格式），推上去即可
- 全庫下載端點若變動：改 workflow 中的 curl URL
  （官方 Open API 文件：https://law.moj.gov.tw/api/swagger/index.html）

## 授權與聲明

資料來源：全國法規資料庫（https://law.moj.gov.tw/），依其公開資料
使用規範需標註來源（頁尾已標註）。本工具僅供快速參考，法規效力以
主管機關公告為準。
