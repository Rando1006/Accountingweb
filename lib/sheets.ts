import { google } from "googleapis";

function getAuth() {
    let raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error("缺少 GOOGLE_SERVICE_ACCOUNT_JSON 環境變數");

    try {
        // 安全處理：移除 Vercel 或本地可能誤寫在全句首尾的單/雙引號
        raw = raw.trim().replace(/^['"]|['"]$/g, '');

        const credentials = JSON.parse(raw);

        // 修復私鑰中的換行符號問題。
        if (credentials.private_key && typeof credentials.private_key === 'string') {
            credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
        }

        return new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
    } catch (error: any) {
        throw new Error(`認證資料解析失敗: ${error.message}`);
    }
}

export interface ExpenseRow {
    date: string;
    item: string;
    amount: number;
    category: string;
    userId: string;
    id?: string;
    paymentMethod?: string;
}

export interface ExpenseFilter {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
    paymentMethod?: string;
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;

// ─── 記憶體快取 ────────────────────────────────────────────────────────────────
// 快取全量資料，TTL 60 秒
interface CacheEntry {
    data: ExpenseRow[];
    expiredAt: number;
}
const expenseCache = new Map<string, CacheEntry>();

function getCached(userId: string): ExpenseRow[] | null {
    const entry = expenseCache.get(userId);
    if (!entry) return null;
    if (Date.now() > entry.expiredAt) {
        expenseCache.delete(userId);
        return null;
    }
    return entry.data;
}

function setCache(userId: string, data: ExpenseRow[]) {
    expenseCache.set(userId, { data, expiredAt: Date.now() + 60_000 });
}

function invalidateCache(userId: string) {
    expenseCache.delete(userId);
}

// ─── sheetId 快取（sheetId 幾乎不變，可長時間快取）─────────────────────────────
const sheetIdCache = new Map<string, number>();

async function getSheetId(sheets: any, userId: string): Promise<number> {
    const cached = sheetIdCache.get(userId);
    if (cached !== undefined) return cached;

    const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
    });
    const sheet = spreadsheet.data.sheets.find((s: any) => s.properties.title === userId);
    const sheetId = sheet?.properties?.sheetId ?? 0;
    sheetIdCache.set(userId, sheetId);
    return sheetId;
}

// ─── 核心讀取：真正從 Sheets 撈全量並回寫快取 ──────────────────────────────────
async function fetchAllFromSheets(userId: string): Promise<ExpenseRow[]> {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${userId}!A2:G`,
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) return [];

    const data: ExpenseRow[] = rows.map((row: any[]) => ({
        date: row[0] || "",
        item: row[1] || "",
        amount: parseFloat(row[2]) || 0,
        category: row[3] || "",
        userId: row[4] || "",
        id: row[5] || "",
        paymentMethod: row[6] || "現金",
    }));

    setCache(userId, data);
    return data;
}

// ─── 公開 API ─────────────────────────────────────────────────────────────────

export async function appendExpense(data: ExpenseRow) {
    const ids = await appendExpenses([data], data.userId);
    return ids[0];
}

export async function appendExpenses(dataList: ExpenseRow[], userId: string) {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const values = dataList.map(data => {
        const id = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        return [data.date, data.item, data.amount, data.category, data.userId, id, data.paymentMethod || "現金"];
    });

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${userId}!A2`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
    });

    // 新增後使快取失效，下次讀取時重新抓
    invalidateCache(userId);
    return values.map(v => v[5]);
}

export async function getExpenses(userId: string, limit: number = 30, filters: ExpenseFilter = {}): Promise<ExpenseRow[]> {
    // 嘗試從快取取得全量資料
    const allRows = getCached(userId) ?? await fetchAllFromSheets(userId);

    return allRows
        .filter(entry => {
            const { keyword, startDate, endDate, category, paymentMethod } = filters;

            if (startDate && entry.date < startDate) return false;
            if (endDate && entry.date > endDate) return false;
            if (category && category !== "全部" && entry.category !== category) return false;
            if (paymentMethod && paymentMethod !== "全部") {
                if (paymentMethod === "現金" && entry.paymentMethod !== "現金") return false;
                if (paymentMethod === "信用卡/行動支付" && entry.paymentMethod === "現金") return false;
            }

            if (keyword) {
                const keywordLower = keyword.toLowerCase();
                const matchKeyword =
                    entry.item.toLowerCase().includes(keywordLower) ||
                    entry.category.toLowerCase().includes(keywordLower) ||
                    (entry.paymentMethod?.toLowerCase() || "").includes(keywordLower);

                if (!matchKeyword) return false;
            }

            return true;
        })
        .reverse()
        .slice(0, limit);
}

export async function deleteExpense(id: string, userId: string) {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${userId}!F:F`,
    });

    const values = res.data.values;
    if (!values) throw new Error("找不到資料表內容");

    const rowIndex = values.findIndex(row => row[0] === id);
    if (rowIndex === -1) throw new Error("找不到該筆紀錄");

    // sheetId 現在從快取取得，免去重複 API 呼叫
    const sheetId = await getSheetId(sheets, userId);

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
            requests: [
                {
                    deleteDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: "ROWS",
                            startIndex: rowIndex,
                            endIndex: rowIndex + 1,
                        },
                    },
                },
            ],
        },
    });

    // 刪除後使快取失效
    invalidateCache(userId);
}

export async function updateExpense(id: string, updatedData: Partial<ExpenseRow>, userId: string) {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${userId}!A2:G`,
    });

    const rows = res.data.values;
    if (!rows) throw new Error("無資料");

    const index = rows.findIndex((row) => row[5] === id);
    if (index === -1) throw new Error("找不到該筆紀錄");

    const rowIndex = index + 2;
    const currentRow = rows[index];

    const newValues = [
        updatedData.date ?? currentRow[0],
        updatedData.item ?? currentRow[1],
        updatedData.amount ?? currentRow[2],
        updatedData.category ?? currentRow[3],
        updatedData.userId ?? currentRow[4],
        id,
        updatedData.paymentMethod ?? (currentRow[6] || "現金")
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${userId}!A${rowIndex}:G${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [newValues] },
    });

    // 更新後使快取失效
    invalidateCache(userId);
}
