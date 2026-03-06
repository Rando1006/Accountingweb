import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
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
根據使用者的「${period}」消費紀錄進行精簡分析。

請嚴格遵守以下格式：
🔍 **核心習慣分析**：一句話直接點出本週期最重要的消費趨勢或問題。
💡 **改善對策**：提供 2 點極其具體的動作點，每點不超過 20 個字。
💊 **總結**：一句話。

禁止使用任何廢話、客套話或修飾語（例如：親愛的主人、皮克敏建議等）。直接根據數據給出診斷。

消費紀錄：
${summary}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
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
