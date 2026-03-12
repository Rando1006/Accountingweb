import { sql } from "@vercel/postgres";

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

// ─── 核心資料庫操作 ────────────────────────────────────────────────────────────

/**
 * 取得支出紀錄（資料庫優先）
 */
export async function getExpensesFromDB(userId: string, limit: number = 20, filters: ExpenseFilter = {}): Promise<ExpenseRow[]> {
    const { keyword, startDate, endDate, category, paymentMethod } = filters;

    // 基礎參數
    const params: any[] = [userId];
    let queryStr = `
        SELECT id, date::text as date, item, amount::float, category, user_id as "userId", payment_method as "paymentMethod"
        FROM expenses
        WHERE user_id = $1
    `;
    let paramIndex = 2;

    if (keyword) {
        queryStr += ` AND (item ILIKE $${paramIndex} OR category ILIKE $${paramIndex} OR payment_method ILIKE $${paramIndex})`;
        params.push(`%${keyword}%`);
        paramIndex++;
    }

    if (startDate) {
        queryStr += ` AND date >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
    }

    if (endDate) {
        queryStr += ` AND date <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
    }
    
    if (category && category !== "全部") {
        queryStr += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
    }

    if (paymentMethod && paymentMethod !== "全部") {
        if (paymentMethod === "現金") {
            queryStr += ` AND payment_method = '現金'`;
        } else if (paymentMethod === "信用卡/行動支付") {
            queryStr += ` AND payment_method != '現金'`;
        }
    }

    queryStr += ` ORDER BY date DESC, created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const { rows } = await sql.query(queryStr, params);
    return rows as ExpenseRow[];
}

/**
 * 新增支出紀錄
 */
/**
 * 批量新增支出紀錄
 */
export async function appendExpensesToDB(dataList: ExpenseRow[]) {
    const results = [];
    for (const data of dataList) {
        const id = data.id || `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await sql`
            INSERT INTO expenses (id, date, item, amount, category, user_id, payment_method)
            VALUES (${id}, ${data.date}, ${data.item}, ${data.amount}, ${data.category}, ${data.userId}, ${data.paymentMethod || "現金"})
        `;
        results.push(id);
    }
    return results;
}

export async function appendExpenseToDB(data: ExpenseRow) {
    const ids = await appendExpensesToDB([data]);
    return ids[0];
}

/**
 * 刪除支出紀錄
 */
export async function deleteExpenseFromDB(id: string, userId: string) {
    await sql`DELETE FROM expenses WHERE id = ${id} AND user_id = ${userId}`;
}

/**
 * 更新支出紀錄
 */
export async function updateExpenseInDB(id: string, updatedData: Partial<ExpenseRow>, userId: string) {
    // 取得舊資料確保 Partial 更新正確
    const { rows } = await sql`SELECT * FROM expenses WHERE id = ${id} AND user_id = ${userId}`;
    if (rows.length === 0) throw new Error("找不到該筆紀錄");

    const current = rows[0];
    const newDate = updatedData.date || current.date;
    const newItem = updatedData.item || current.item;
    const newAmount = updatedData.amount !== undefined ? updatedData.amount : current.amount;
    const newCategory = updatedData.category || current.category;
    const newPaymentMethod = updatedData.paymentMethod || current.payment_method;

    await sql`
        UPDATE expenses 
        SET date = ${newDate}, 
            item = ${newItem}, 
            amount = ${newAmount}, 
            category = ${newCategory}, 
            payment_method = ${newPaymentMethod}
        WHERE id = ${id} AND user_id = ${userId}
    `;
}
