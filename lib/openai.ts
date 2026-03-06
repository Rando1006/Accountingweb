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
從使用者輸入中解析出一或多筆記帳資訊，以 JSON 格式回應，不得有多餘文字或 markdown 標記：
{
  "expenses": [
    {
      "item": "項目名稱",
      "amount": 數字,
      "category": "從[${CATEGORIES.join(",")}]選一個最合適的",
      "date": "YYYY-MM-DD"
    }
  ]
}
規則：
- 必須能夠辨識多筆消費。例如「午餐150 飲料35」應拆分為兩筆。
- 若句子中有明確的日期詞（昨天、大前天、3/5等），應將其應用於其後跟隨的所有項目，直到出現下一個日期詞為止。
- 範例：「昨天早餐50 捷運20 今天晚餐100」應解析為：
  1. 早餐 50 (昨天日期)
  2. 捷運 20 (昨天日期)
  3. 晚餐 100 (今天日期)
- 「大前天」是指今天日期 (${today}) 減 3 天。
- 「前天」是指今天日期 (${today}) 減 2 天。
- 若未提及日期，預設使用今天日期 (${today})。
- 若無法辨識金額，amount 設為 0。
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
