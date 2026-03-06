import { google } from "googleapis";

function getAuth() {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error("缺少 GOOGLE_SERVICE_ACCOUNT_JSON 環境變數");

    try {
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
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;
const SHEET_NAME = "工作表1"; // 修正：從 Sheet1 改為工作表1
const RANGE = `${SHEET_NAME}!A2:F`;

// 輔助函式：動態獲取 工作表1 的 sheetId (用於維度操作 API)
async function getSheetId(sheets: any) {
    const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
    });
    const sheet = spreadsheet.data.sheets.find((s: any) => s.properties.title === SHEET_NAME);
    return sheet?.properties?.sheetId ?? 0;
}

export async function appendExpense(data: ExpenseRow) {
    const ids = await appendExpenses([data]);
    return ids[0];
}

export async function appendExpenses(dataList: ExpenseRow[]) {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const values = dataList.map(data => {
        const id = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        return [data.date, data.item, data.amount, data.category, data.userId, id];
    });

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: values,
        },
    });
    return values.map(v => v[5]); // 回傳 IDs 陣列
}

export async function getExpenses(limit: number = 30): Promise<ExpenseRow[]> {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) return [];

    return rows
        .map((row) => ({
            date: row[0] || "",
            item: row[1] || "",
            amount: parseFloat(row[2]) || 0,
            category: row[3] || "",
            userId: row[4] || "",
            id: row[5] || "",
        }))
        .reverse()
        .slice(0, limit);
}

export async function deleteExpense(id: string) {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!F:F`,
    });

    const values = res.data.values;
    if (!values) throw new Error("找不到資料表內容");

    const rowIndex = values.findIndex(row => row[0] === id);
    if (rowIndex === -1) throw new Error("找不到該筆紀錄");

    const sheetId = await getSheetId(sheets);

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
}

export async function updateExpense(id: string, data: Partial<ExpenseRow>) {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!F:F`,
    });

    const values = res.data.values;
    if (!values) throw new Error("找不到資料表內容");

    const rowIndex = values.findIndex(row => row[0] === id);
    if (rowIndex === -1) throw new Error("找不到該筆紀錄");

    const sheetLine = rowIndex + 1;

    const originalRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${sheetLine}:F${sheetLine}`,
    });

    const original = originalRes.data.values?.[0] || [];

    const updatedValues = [
        data.date ?? original[0],
        data.item ?? original[1],
        data.amount ?? original[2],
        data.category ?? original[3],
        original[4],
        original[5],
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${sheetLine}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [updatedValues],
        },
    });
}
