import { sql } from "@vercel/postgres";
import { google } from "googleapis";
import * as dotenv from "dotenv";
import * as crypto from "crypto";

// 加載環境變數
dotenv.config({ path: ".env.local" });

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

function getAuth() {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "";
    const credentials = JSON.parse(raw.trim().replace(/^['"]|['"]$/g, ""));
    if (credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
    }
    return new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
}

function generateStableId(row: any[], userId: string): string {
    // 使用內容雜湊確保 ID 唯一且穩定
    // 即使重複執行遷移，相同內容也不會產生多筆資料
    const content = `${row[0]}_${row[1]}_${row[2]}_${row[3]}_${userId.toLowerCase()}`;
    return crypto.createHash("md5").update(content).digest("hex");
}

async function migrate() {
    console.log("🚀 開始精準搬家流程 (穩定 ID 模式)");

    if (!SPREADSHEET_ID) {
        console.error("❌ 錯誤：缺少 SPREADSHEET_ID 環境變數");
        return;
    }

    // ─── 第一步：清空舊資料 (清洗環境) ──────────────────────────────────────────
    console.log("🧹 正在清空資料庫舊資料...");
    await sql`TRUNCATE TABLE expenses`;

    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
    });

    const sheetTitles = spreadsheet.data.sheets?.map(s => s.properties?.title).filter(Boolean) as string[] || [];
    console.log(`[1/3] 找到 ${sheetTitles.length} 個使用者 (Tabs): ${sheetTitles.join(", ")}`);

    let totalMigrated = 0;

    for (const userId of sheetTitles) {
        console.log(`\n正在處理使用者: [${userId}]...`);

        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${userId}!A2:G`,
        });

        const rows = res.data.values;
        if (!rows || rows.length === 0) {
            console.log(` -> 尚無資料，跳過。`);
            continue;
        }

        console.log(` -> 抓到 ${rows.length} 筆資料，準備寫入...`);

        for (const row of rows) {
            const date = row[0];
            const item = row[1];
            const amount = parseFloat(row[2]) || 0;
            const category = row[3];
            const paymentMethod = row[6] || "現金";
            
            if (!date || !item) continue;

            const normalizedUserId = userId.toLowerCase();
            const id = generateStableId(row, userId);

            try {
                await sql`
                    INSERT INTO expenses (id, date, item, amount, category, user_id, payment_method)
                    VALUES (${id}, ${date}, ${item}, ${amount}, ${category}, ${normalizedUserId}, ${paymentMethod})
                `;
                totalMigrated++;
            } catch (err: any) {
                // 忽略真正的內容重複（靜默去重）
                if (!err.message.includes("unique constraint")) {
                    console.error(` ❌ 寫入失敗:`, err.message);
                }
            }
        }
    }

    console.log(`\n✅ 搬家完成！共遷移了 ${totalMigrated} 筆不重複資料。`);
}

migrate().catch(console.error);
