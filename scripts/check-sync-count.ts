import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// 確保 SPREADSHEET_ID 有設定
process.env.SPREADSHEET_ID = "1g1e2Qzz1lTU9YCkdHyDzmIrSQclUmtvy1MOg1EkpuhY";

import { getExpenses } from "../lib/sheets";

async function check() {
    try {
        console.log("🔍 正在核對 jolie 分頁資料...");
        const expenses = await getExpenses("jolie", 1000); // 讀取較大範圍
        console.log(`✅ 同步驗證完成！`);
        console.log(`📊 jolie 分頁目前的總筆數: ${expenses.length}`);

        if (expenses.length >= 563) {
            console.log("✨ 歷史資料已成功同步。");
        } else {
            console.log("⚠ 資料筆數小於預期，請檢查同步腳本。");
        }
    } catch (error) {
        console.error("❌ 驗證失敗:", error);
    }
}

check();
