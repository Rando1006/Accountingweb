import { getExpensesFromDB, appendExpensesToDB, deleteExpenseFromDB, updateExpenseInDB } from "./db";

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

// ─── 公開 API ─────────────────────────────────────────────────────────────────

export async function appendExpense(data: ExpenseRow) {
    const ids = await appendExpenses([data], data.userId);
    return ids[0];
}

export async function appendExpenses(dataList: ExpenseRow[], userId: string) {
    console.log(`[appendExpenses] 新增資料至資料庫, userId: ${userId}, 筆數: ${dataList.length}`);
    return await appendExpensesToDB(dataList);
}

export async function getExpenses(userId: string, limit: number = 30, filters: ExpenseFilter = {}): Promise<ExpenseRow[]> {
    console.log(`[getExpenses] 讀取資料庫, userId: ${userId}, limit: ${limit}`);
    try {
        return await getExpensesFromDB(userId, limit, filters);
    } catch (err) {
        console.error("[getExpenses] 資料庫讀取失敗:", err);
        throw err;
    }
}

export async function deleteExpense(id: string, userId: string) {
    console.log(`[deleteExpense] 從資料庫刪除, id: ${id}, userId: ${userId}`);
    await deleteExpenseFromDB(id, userId);
}

export async function updateExpense(id: string, updatedData: Partial<ExpenseRow>, userId: string) {
    console.log(`[updateExpense] 從資料庫更新, id: ${id}, userId: ${userId}`);
    await updateExpenseInDB(id, updatedData, userId);
}
