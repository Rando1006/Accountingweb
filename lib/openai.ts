import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ParsedExpense {
  item: string;
  amount: number;
  category: string;
  date: string;
}

export interface ParseResult {
  expenses: ParsedExpense[];
}

const CATEGORIES = ["飲食", "交通", "購物", "娛樂", "醫療", "其他"];

export async function parseExpenseText(
  text: string,
  today: string
): Promise<ParseResult> {
  const systemPrompt = `你是記帳助手。今天日期是 ${today}。
從使用者輸入中解析出一或多筆記帳資訊，以 JSON 格式回應：
{
  "expenses": [
    {
      "item": "項目名稱",
      "amount": 數字,
      "category": "分類",
      "date": "YYYY-MM-DD"
    }
  ]
}

類別定義（必須嚴格遵守）：
- 飲食：所有食物、飲料、餐點。包含早餐、午餐、晚餐、下午茶、點心、消夜、咖啡、手搖飲、食材原料、餐廳。
- 交通：捷運、公車、計程車、Uber、加油、停車、火車、高鐵、共享汽機車。
- 購物：日常生活用品、衣服、雜物、電器、美妝藥妝（非藥品）、便利超商商品。
- 娛樂：電影、遊戲、門票、課金、訂閱服務（Netflix、Spotify等）、運動健身。
- 醫療：掛號費、門診、藥品、復健。
- 其他：不屬於上述範圍的支出。

規則：
- 必須能夠辨識多筆消費。例如「午餐150 飲料35」應拆分為兩筆。
- 下午茶與點心必須歸類在「飲食」。
- 若未提及日期，預設使用今天日期 (${today})。
- amount 只能是純數字，不得有負號。`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content ?? "{\"expenses\":[]}";
  let parsed = JSON.parse(content) as ParseResult;

  if (!parsed.expenses || !Array.isArray(parsed.expenses)) {
    parsed = { expenses: [] };
  }

  // 驗證分類是否在清單內
  parsed.expenses.forEach(expense => {
    if (!CATEGORIES.includes(expense.category)) {
      expense.category = "其他";
    }
  });

  return parsed;
}
