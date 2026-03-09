"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var sheets_1 = require("../lib/sheets");
var dotenv_1 = __importDefault(require("dotenv"));
// 載入環境變數
dotenv_1.default.config({ path: ".env.local" });
function sync() {
    return __awaiter(this, void 0, void 0, function () {
        var csvPath, content, lines, dataLines, expenses, batchSize, i, batch, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("🚀 開始同步 Fortunecity 資料...");
                    csvPath = path_1.default.join(process.cwd(), "..", "Fortunecity-records.csv");
                    console.log("正在讀取 CSV:", csvPath);
                    if (!fs_1.default.existsSync(csvPath)) {
                        console.error("❌ 找不到 CSV 檔案:", csvPath);
                        process.exit(1);
                    }
                    content = fs_1.default.readFileSync(csvPath, "utf-8");
                    lines = content.split(/\r?\n/).filter(function (line) { return line.trim() !== ""; });
                    dataLines = lines.slice(1);
                    console.log("\u7D71\u8A08\uFF1A\u5171\u767C\u73FE ".concat(dataLines.length, " \u7B46\u8CC7\u6599\u5F85\u540C\u6B65\u3002"));
                    expenses = dataLines.map(function (line) {
                        var _a = line.split(",").map(function (s) { return s === null || s === void 0 ? void 0 : s.trim(); }), paymentMethod = _a[0], category = _a[1], amount = _a[2], date = _a[3], item = _a[4], userId = _a[5];
                        return {
                            date: date || "",
                            item: item || "",
                            amount: parseFloat(amount) || 0,
                            category: category || "其他",
                            userId: userId || "jolie",
                            paymentMethod: paymentMethod || "現金"
                        };
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    batchSize = 100;
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < expenses.length)) return [3 /*break*/, 5];
                    batch = expenses.slice(i, i + batchSize);
                    return [4 /*yield*/, (0, sheets_1.appendExpenses)(batch, "jolie")];
                case 3:
                    _a.sent();
                    console.log("\u2705 \u5DF2\u5B8C\u6210\u7B2C ".concat(i + 1, " ~ ").concat(Math.min(i + batchSize, expenses.length), " \u7B46\u540C\u6B65..."));
                    _a.label = 4;
                case 4:
                    i += batchSize;
                    return [3 /*break*/, 2];
                case 5:
                    console.log("✨ 同步完成！所有資料已成功種入 jolie 分頁。");
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    console.error("❌ 同步失敗:", error_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
sync();
