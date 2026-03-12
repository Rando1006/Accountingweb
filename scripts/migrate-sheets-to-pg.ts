import { sql } from "@vercel/postgres";
import { google } from "googleapis";
import * as dotenv from "dotenv";

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

async function migrate() {
    console.log("🚀 開始搬家流程：Google Sheets -> Vercel Postgres");

    if (!SPREADSHEET_ID) {
        console.error("❌ 錯誤：缺少 SPREADSHEET_ID 環境變數");
        return;
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // 1. 取得所有 Sheet Tabs (每個 Tab 是一個 userId)
    const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
    });

    const sheetTitles = spreadsheet.data.sheets?.map(s => s.properties?.title).filter(Boolean) as string[] || [];
    console.log(`[1/3] 找到 ${sheetTitles.length} 個使用者 (Tabs): ${sheetTitles.join(", ")}`);

    let totalMigrated = 0;

    for (const userId of sheetTitles) {
        console.log(`\n正在處理使用者: [${userId}]...`);

        // 2. 抓取該使用者的所有資料
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${userId}!A2:G`,
        });

        const rows = res.data.values;
        if (!rows || rows.length === 0) {
            console.log(` -> 尚無資料，跳過。`);
            continue;
        }

        console.log(` -> 抓到 ${rows.length} 筆資料，準備寫入資料庫...`);

        // 3. 批量寫入 Postgres
        for (const row of rows) {
            const date = row[0];
            const item = row[1];
            const amount = parseFloat(row[2]) || 0;
            const category = row[3];
            const uId = row[4]; // 實際資料內的 userId
            const id = row[5];
            const paymentMethod = row[6] || "現金";

            if (!id || !date) continue;

            try {
                // 使用 ON CONFLICT 避免重複執行時報錯，並更新最新內容 (Upsert)
                await sql`
                    INSERT INTO expenses (id, date, item, amount, category, user_id, payment_method)
                    VALUES (${id}, ${date}, ${item}, ${amount}, ${category}, ${userId}, ${paymentMethod})
                    ON CONFLICT (id) DO UPDATE SET
                        date = EXCLUDED.date,
                        item = EXCLUDED.item,
                        amount = EXCLUDED.amount,
                        category = EXCLUDED.category,
                        user_id = EXCLUDED.user_id,
                        payment_method = EXCLUDED.payment_method;
                `;
                totalMigrated++;
            } catch (err: any) {
                console.error(` ❌ 寫入失敗 (ID: ${id}):`, err.message);
            }
        }
    }

    console.log(`\n✅ 搬家完成！共遷移了 ${totalMigrated} 筆資料。`);
}

migrate().catch(console.error);
