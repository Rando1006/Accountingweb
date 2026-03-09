import { NextRequest, NextResponse } from "next/server";
import { deleteExpense, updateExpense } from "@/lib/sheets";

// DELETE /api/expense/[id] - 刪除指定 ID 的記帳
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!id) return NextResponse.json({ error: "缺少 ID" }, { status: 400 });
        if (!userId) return NextResponse.json({ error: "缺少 userId" }, { status: 400 });

        await deleteExpense(id, userId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("刪除失敗:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/expense/[id] - 修改指定 ID 的記帳
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: "缺少 ID" }, { status: 400 });

        const body = await request.json();
        const userId = body.userId;

        if (!userId) return NextResponse.json({ error: "缺少 userId" }, { status: 400 });

        await updateExpense(id, body, userId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("更新失敗:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

