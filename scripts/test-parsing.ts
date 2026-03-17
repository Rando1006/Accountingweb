
import { parseExpenseText } from '../lib/openai';

async function testParsing() {
  const today = new Date().toISOString().split('T')[0];
  const testCases = [
    "買衣服 1000",
    "做美甲 1500",
    "洗頭 300",
    "買保養品 2000",
    "化妝品 500"
  ];
  
  console.log('Testing AI Parsing Logic...');
  for (const text of testCases) {
    const result = await parseExpenseText(text, today);
    console.log(`Input: "${text}" -> Category: "${result.expenses[0]?.category}"`);
  }
}

testParsing();
