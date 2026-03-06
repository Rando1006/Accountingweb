import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "default-secret-key-change-me"
);

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (password === process.env.ACCESS_PASSWORD) {
            // 簽署 JWT
            const token = await new SignJWT({ authenticated: true })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("30d") // 30 天有效期
                .sign(JWT_SECRET);

            const response = NextResponse.json({ success: true });

            // 設定 HttpOnly Cookie
            response.cookies.set("session", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 30, // 30 天
                path: "/",
            });

            return response;
        }

        return NextResponse.json({ error: "密碼錯誤" }, { status: 401 });
    } catch (error) {
        console.error("登入失敗:", error);
        return NextResponse.json({ error: "系統錯誤" }, { status: 500 });
    }
}
