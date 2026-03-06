import { NextRequest, NextResponse } from "next/server";
import { parseExpenseText } from "@/lib/openai";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text } = body as { text: string };

        if (!text?.trim()) {
            return NextResponse.json({ error: "請輸入記帳文字" }, { status: 400 });
        }

        // 取得台灣時區今日日期
        const today = new Date().toLocaleDateString("zh-TW", {
            timeZone: "Asia/Taipei",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).replace(/\//g, "-");

        const result = await parseExpenseText(text, today);
        return NextResponse.json(result);
    } catch (error) {
        console.error("解析失敗：", error);
        return NextResponse.json({ error: "解析失敗，請再試一次" }, { status: 500 });
    }
}
