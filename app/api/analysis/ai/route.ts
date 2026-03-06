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
你是一位專業的皮克敏理財導師。請根據以下使用者的「${period}」消費紀錄，提供一段口吻親切、充滿正能量且實用的消費行為分析與理財建議。

請注意：
1. 使用繁體中文。
2. 風格要清新、療癒、自然（類似皮克敏遊戲的氛圍）。
3. 分析其消費趨勢（例如：飲食支出過多、娛樂集中在週末等）。
4. 提供 2-3 個具体的改善建議。
5. 長度約 200-300 字。

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
