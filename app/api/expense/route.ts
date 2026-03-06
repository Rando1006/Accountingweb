import { NextRequest, NextResponse } from "next/server";
import { appendExpenses, getExpenses, ExpenseRow } from "@/lib/sheets";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam) : 50;
        const userId = searchParams.get("userId");

        // 取得較多資料以應對過濾需求
        let expenses = await getExpenses(500);

        if (userId) {
            const normalizedUserId = userId.toLowerCase().trim();
            expenses = expenses.filter(e => e.userId.toLowerCase().trim() === normalizedUserId);
        }

        return NextResponse.json(expenses.slice(0, limit));
    } catch (error: any) {
        console.error("讀取失敗：", error);
        return NextResponse.json({ error: `讀取失敗：${error.message}` }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 支援多筆與單筆
        const dataList = Array.isArray(body) ? body : [body];

        if (dataList.length === 0) {
            return NextResponse.json({ error: "無效的資料格式" }, { status: 400 });
        }

        // 驗證必要欄位
        for (const data of dataList) {
            if (!data.date || !data.item || !data.amount || !data.userId) {
                return NextResponse.json({ error: "欄位不正確", received: data }, { status: 400 });
            }
        }

        const ids = await appendExpenses(dataList as ExpenseRow[]);

        return NextResponse.json({
            success: true,
            message: `成功種下 ${ids.length} 顆消費種子！🌱`,
            ids
        });
    } catch (error: any) {
        console.error("儲存失敗：", error);
        return NextResponse.json({ error: `儲存失敗：${error.message}` }, { status: 500 });
    }
}
