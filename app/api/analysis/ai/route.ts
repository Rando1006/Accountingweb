export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(request: NextRequest) {
    try {
        const { expenses, period } = await request.json();

        if (!expenses || expenses.length === 0) {
            return NextResponse.json({ advice: "目前還沒有紀錄，AI 無法為您分析。多記幾筆帳吧！🌱" });
        }

        // 準備資料摘要給 AI
        const summary = expenses.map((e: any) => `- ${e.date} ${e.category} ${e.item} $${e.amount}`).join("\n");

        const prompt = `
根據使用者的「${period}」消費紀錄，進行深度理財分析。

請嚴格依照以下格式輸出：
【診斷】（一句話總結 ${period} 支出狀況，必須帶入總金額或大幅變動的類別金額）
【問題根源】（指出導致超支或消費集中的 1-2 個關鍵類別）
【建議對策】（提供 2 個量化、可執行的改進建議，例如：每日外食預算控制在 $XXX 以內）
【鼓勵】（用一句輕鬆溫暖的口吻結尾）

請注意：
- 禁止提供籠統過時的建議。
- 必須直接引用「數據說話」（例如：總支出 $XXXX、佔比 XX% 等）。
- 使用項目符號（Bullet points）條列建議。
- 關鍵數據（金額、百分比）請使用 **加粗**。

消費紀錄：
${summary}
`;

        const client = process.env.GROQ_API_KEY ? groq : openai;
        const model = process.env.GROQ_API_KEY ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

        const completion = await client.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: "你是一位充滿熱情且專業的皮克敏理財導師，專長於行為金融學與極簡生活。" },
                { role: "user", content: prompt },
            ],
            temperature: 0.7,
        });

        return NextResponse.json({ advice: completion.choices[0].message.content });
    } catch (error) {
        console.error("AI 分析失敗:", error);
        return NextResponse.json({ error: "AI 暫時迷路了，請稍後再試" }, { status: 500 });
    }
}
