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
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendExpense = appendExpense;
exports.appendExpenses = appendExpenses;
exports.getExpenses = getExpenses;
exports.deleteExpense = deleteExpense;
exports.updateExpense = updateExpense;
var googleapis_1 = require("googleapis");
function getAuth() {
    var raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!raw)
        throw new Error("缺少 GOOGLE_SERVICE_ACCOUNT_JSON 環境變數");
    try {
        // 安全處理：移除 Vercel 或本地可能誤寫在全句首尾的單/雙引號
        raw = raw.trim().replace(/^['"]|['"]$/g, '');
        var credentials = JSON.parse(raw);
        // 修復私鑰中的換行符號問題。
        if (credentials.private_key && typeof credentials.private_key === 'string') {
            credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
        }
        return new googleapis_1.google.auth.GoogleAuth({
            credentials: credentials,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
    }
    catch (error) {
        throw new Error("\u8A8D\u8B49\u8CC7\u6599\u89E3\u6790\u5931\u6557: ".concat(error.message));
    }
}
var SPREADSHEET_ID = process.env.SPREADSHEET_ID;
// 輔助函式：動態獲取 指定使用者工作表 的 sheetId (用於維度操作 API)
function getSheetId(sheets, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var spreadsheet, sheet;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, sheets.spreadsheets.get({
                        spreadsheetId: SPREADSHEET_ID,
                    })];
                case 1:
                    spreadsheet = _c.sent();
                    sheet = spreadsheet.data.sheets.find(function (s) { return s.properties.title === userId; });
                    return [2 /*return*/, (_b = (_a = sheet === null || sheet === void 0 ? void 0 : sheet.properties) === null || _a === void 0 ? void 0 : _a.sheetId) !== null && _b !== void 0 ? _b : 0];
            }
        });
    });
}
function appendExpense(data) {
    return __awaiter(this, void 0, void 0, function () {
        var ids;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, appendExpenses([data], data.userId)];
                case 1:
                    ids = _a.sent();
                    return [2 /*return*/, ids[0]];
            }
        });
    });
}
function appendExpenses(dataList, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var auth, sheets, values;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    auth = getAuth();
                    sheets = googleapis_1.google.sheets({ version: "v4", auth: auth });
                    values = dataList.map(function (data) {
                        var id = "".concat(Date.now(), "_").concat(Math.floor(Math.random() * 1000));
                        return [data.date, data.item, data.amount, data.category, data.userId, id, data.paymentMethod || "現金"];
                    });
                    return [4 /*yield*/, sheets.spreadsheets.values.append({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "".concat(userId, "!A2"),
                            valueInputOption: "USER_ENTERED",
                            requestBody: {
                                values: values,
                            },
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, values.map(function (v) { return v[5]; })]; // 回傳 IDs 陣列
            }
        });
    });
}
function getExpenses(userId_1) {
    return __awaiter(this, arguments, void 0, function (userId, limit, filters) {
        var auth, sheets, res, rows;
        if (limit === void 0) { limit = 30; }
        if (filters === void 0) { filters = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    auth = getAuth();
                    sheets = googleapis_1.google.sheets({ version: "v4", auth: auth });
                    return [4 /*yield*/, sheets.spreadsheets.values.get({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "".concat(userId, "!A2:G"),
                        })];
                case 1:
                    res = _a.sent();
                    rows = res.data.values;
                    if (!rows || rows.length === 0)
                        return [2 /*return*/, []];
                    return [2 /*return*/, rows
                            .map(function (row) { return ({
                            date: row[0] || "",
                            item: row[1] || "",
                            amount: parseFloat(row[2]) || 0,
                            category: row[3] || "",
                            userId: row[4] || "",
                            id: row[5] || "",
                            paymentMethod: row[6] || "現金",
                        }); })
                            .filter(function (entry) {
                            var _a;
                            var keyword = filters.keyword, startDate = filters.startDate, endDate = filters.endDate, category = filters.category, paymentMethod = filters.paymentMethod;
                            if (startDate && entry.date < startDate)
                                return false;
                            if (endDate && entry.date > endDate)
                                return false;
                            if (category && category !== "全部" && entry.category !== category)
                                return false;
                            if (paymentMethod && paymentMethod !== "全部") {
                                if (paymentMethod === "現金" && entry.paymentMethod !== "現金")
                                    return false;
                                if (paymentMethod === "信用卡/行動支付" && entry.paymentMethod === "現金")
                                    return false;
                            }
                            if (keyword) {
                                var keywordLower = keyword.toLowerCase();
                                var matchKeyword = entry.item.toLowerCase().includes(keywordLower) ||
                                    entry.category.toLowerCase().includes(keywordLower) ||
                                    (((_a = entry.paymentMethod) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "").includes(keywordLower);
                                if (!matchKeyword)
                                    return false;
                            }
                            return true;
                        })
                            .reverse()
                            .slice(0, limit)];
            }
        });
    });
}
function deleteExpense(id, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var auth, sheets, res, values, rowIndex, sheetId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    auth = getAuth();
                    sheets = googleapis_1.google.sheets({ version: "v4", auth: auth });
                    return [4 /*yield*/, sheets.spreadsheets.values.get({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "".concat(userId, "!F:F"),
                        })];
                case 1:
                    res = _a.sent();
                    values = res.data.values;
                    if (!values)
                        throw new Error("找不到資料表內容");
                    rowIndex = values.findIndex(function (row) { return row[0] === id; });
                    if (rowIndex === -1)
                        throw new Error("找不到該筆紀錄");
                    return [4 /*yield*/, getSheetId(sheets, userId)];
                case 2:
                    sheetId = _a.sent();
                    return [4 /*yield*/, sheets.spreadsheets.batchUpdate({
                            spreadsheetId: SPREADSHEET_ID,
                            requestBody: {
                                requests: [
                                    {
                                        deleteDimension: {
                                            range: {
                                                sheetId: sheetId,
                                                dimension: "ROWS",
                                                startIndex: rowIndex,
                                                endIndex: rowIndex + 1,
                                            },
                                        },
                                    },
                                ],
                            },
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function updateExpense(id, updatedData, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var auth, sheets, res, rows, index, rowIndex, currentRow, newValues;
        var _a, _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    auth = getAuth();
                    sheets = googleapis_1.google.sheets({ version: "v4", auth: auth });
                    return [4 /*yield*/, sheets.spreadsheets.values.get({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "".concat(userId, "!A2:G"),
                        })];
                case 1:
                    res = _g.sent();
                    rows = res.data.values;
                    if (!rows)
                        throw new Error("無資料");
                    index = rows.findIndex(function (row) { return row[5] === id; });
                    if (index === -1)
                        throw new Error("找不到該筆紀錄");
                    rowIndex = index + 2;
                    currentRow = rows[index];
                    newValues = [
                        (_a = updatedData.date) !== null && _a !== void 0 ? _a : currentRow[0],
                        (_b = updatedData.item) !== null && _b !== void 0 ? _b : currentRow[1],
                        (_c = updatedData.amount) !== null && _c !== void 0 ? _c : currentRow[2],
                        (_d = updatedData.category) !== null && _d !== void 0 ? _d : currentRow[3],
                        (_e = updatedData.userId) !== null && _e !== void 0 ? _e : currentRow[4],
                        id,
                        (_f = updatedData.paymentMethod) !== null && _f !== void 0 ? _f : (currentRow[6] || "現金")
                    ];
                    return [4 /*yield*/, sheets.spreadsheets.values.update({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "".concat(userId, "!A").concat(rowIndex, ":G").concat(rowIndex),
                            valueInputOption: "USER_ENTERED",
                            requestBody: {
                                values: [newValues],
                            },
                        })];
                case 2:
                    _g.sent();
                    return [2 /*return*/];
            }
        });
    });
}
