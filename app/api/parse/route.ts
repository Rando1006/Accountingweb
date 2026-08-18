export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { parseExpenseText } from "@/lib/openai";
import { parseWithGroq } from "@/lib/groq";

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

        // 1. 優先使用 Groq 高速引擎
        if (process.env.GROQ_API_KEY) {
            try {
                const result = await parseWithGroq(text, today);
                return NextResponse.json(result);
            } catch (groqError) {
                console.warn("Groq 解析失敗，自動降級嘗試使用 OpenAI:", groqError);
            }
        }

        // 2. 若 Groq 未設定或失敗，使用 OpenAI
        if (process.env.OPENAI_API_KEY) {
            try {
                const result = await parseExpenseText(text, today);
                return NextResponse.json(result);
            } catch (openaiError) {
                console.error("OpenAI 解析失敗:", openaiError);
            }
        }

        return NextResponse.json(
            { error: "AI 服務暫時無法使用，請檢查 API 金鑰或模型設定" },
            { status: 500 }
        );
    } catch (error) {
        console.error("解析過程發生異常：", error);
        return NextResponse.json({ error: "解析失敗，請再試一次" }, { status: 500 });
    }
}
