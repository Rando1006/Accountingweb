import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// 必須在 import ../lib/sheets 之前設定，因為 lib/sheets 會在載入時讀取 process.env.SPREADSHEET_ID
process.env.SPREADSHEET_ID = "1g1e2Qzz1lTU9YCkdHyDzmIrSQclUmtvy1MOg1EkpuhY";

import fs from "fs";
import path from "path";
import { appendExpenses, ExpenseRow } from "../lib/sheets";

async function sync() {
    console.log("🚀 開始同步 Fortunecity 資料...");
    console.log(`使用試算表 ID: ${process.env.SPREADSHEET_ID}`);

    // 取得絕對路徑，確保讀取正確
    const csvPath = path.join(process.cwd(), "..", "Fortunecity-records.csv");
    console.log("正在讀取 CSV:", csvPath);

    if (!fs.existsSync(csvPath)) {
        console.error("❌ 找不到 CSV 檔案:", csvPath);
        process.exit(1);
    }

    const content = fs.readFileSync(csvPath, "utf-8");
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== "");

    // 移除 Header
    const dataLines = lines.slice(1);

    console.log(`統計：共發現 ${dataLines.length} 筆資料待同步。`);

    const expenses: ExpenseRow[] = dataLines.map(line => {
        const [paymentMethod, category, amount, date, item, userId] = line.split(",").map(s => s?.trim());

        return {
            date: date || "",
            item: item || "",
            amount: parseFloat(amount) || 0,
            category: category || "其他",
            userId: userId || "jolie",
            paymentMethod: paymentMethod || "現金"
        };
    });

    try {
        const batchSize = 100;
        for (let i = 0; i < expenses.length; i += batchSize) {
            const batch = expenses.slice(i, i + batchSize);
            await appendExpenses(batch, "jolie");
            console.log(`✅ 已完成第 ${i + 1} ~ ${Math.min(i + batchSize, expenses.length)} 筆同步...`);
        }

        console.log("✨ 同步完成！所有資料已成功種入 jolie 分頁。");
    } catch (error) {
        console.error("❌ 同步失敗:", error);
    }
}

sync();
