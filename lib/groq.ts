import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export interface ParsedExpense {
  item: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
}

export interface ParseResult {
  expenses: ParsedExpense[];
}

const CATEGORIES = ["飲食", "交通", "購物", "居家", "娛樂", "醫療", "治裝", "其他"];

export async function parseWithGroq(
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
      "date": "YYYY-MM-DD",
      "paymentMethod": "付款方式（例如：現金、元大信用卡、Line Pay等。注意：只填機構或卡名，絕對不能包含金額數字！）" 
    }
  ]
}

類別定義（必須嚴格遵守）：
- 飲食：所有食物、飲料、餐點。包含早餐、午餐、晚餐、下午茶、點心、消夜、咖啡、手搖飲、食材原料、餐廳。
- 交通：捷運、公車、計程車、Uber、加油、停車、火車、高鐵、共享汽機車。
- 購物：日常生活用品、雜物、電器、便利超商商品。
- 居家：房租、水電燃氣費、網路費、房屋修繕、家具搬運、清潔用品、室內盆栽等居家相關雜支。
- 娛樂：電影、遊戲、門票、課金、訂閱服務（Netflix、Spotify等）、運動健身。
- 醫療：掛號費、門診、藥品、復健。
- 治裝：美甲、頭髮（美髮/剪髮）、美妝（彩妝）、保養、衣服。
- 其他：不屬於上述範圍的支出。

規則：
- 【極度重要】「item」欄位應提取出「單純的項目名稱與原始修飾詞」，但**絕對不可包含金額、數字，也不要包含付款方式或銀行名稱**。
- 【極度重要】paymentMethod 欄位：只要使用者有提到「卡」、「信用卡」、「Pay」、「行動支付」、「街口」或任何銀行名稱，請**務必**將該名稱完整抽出填入本欄，絕對不能填「現金」。若完全沒提到非現金支付，才填「現金」。

【解析範例】
輸入：「中午吃飯 150 今天」
輸出：[{"item": "中午吃飯", "amount": 150, "category": "飲食", "date": "${today}", "paymentMethod": "現金"}]

輸入：「星巴克 90 台新信用卡」
輸出：[{"item": "星巴克", "amount": 90, "category": "飲食", "date": "${today}", "paymentMethod": "台新信用卡"}]
`;

  const modelsToTry = Array.from(
    new Set([
      process.env.GROQ_MODEL,
      "openai/gpt-oss-120b",
      "qwen/qwen3.6-27b",
      "openai/gpt-oss-20b",
    ].filter(Boolean))
  ) as string[];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await groq.chat.completions.create({
        model,
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

      // 驗證與強制分類邏輯 (保持與 OpenAI 版本一致)
      const APPAREL_KEYWORDS = ['美甲', '頭髮', '美妝', '保養', '衣服'];
      
      parsed.expenses.forEach(expense => {
        const shouldBeApparel = APPAREL_KEYWORDS.some(keyword => expense.item.includes(keyword));
        if (shouldBeApparel) {
          expense.category = "治裝";
        }

        if (!CATEGORIES.includes(expense.category)) {
          expense.category = "其他";
        }
      });

      return parsed;
    } catch (err: any) {
      console.warn(`Groq 模型 ${model} 解析失敗，嘗試下一個備用方案:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("所有 Groq 模型皆無法使用");
}
