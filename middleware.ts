import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "default-secret-key-change-me"
);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 允許存取登入頁面與 API，以及靜態資源
    if (
        pathname.startsWith("/login") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico"
    ) {
        return NextResponse.next();
    }

    // 檢查 session cookie
    const token = request.cookies.get("session")?.value;

    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        // 驗證 JWT
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.next();
    } catch (error) {
        console.error("JWT 驗證失敗:", error);
        return NextResponse.redirect(new URL("/login", request.url));
    }
}

// 僅針對頁面與 API 進行過濾
export const config = {
    matcher: [
        /*
         * 匹配所有路徑，除了:
         * 1. /api/auth/* (登入 API)
         * 2. /_next/static (靜態資源)
         * 3. /_next/image (圖片優化)
         * 4. /favicon.ico (圖示)
         */
        "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
    ],
};
