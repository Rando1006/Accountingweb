"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bottom-nav relative">
            {/* 記帳 */}
            <Link href="/" className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative group">
                {isActive("/") && (
                    <div className="absolute top-[1px] w-6 h-[4px] bg-[#2a3d16] rounded-full shadow-sm" />
                )}
                <div className={`p-1 transition-all ${isActive("/") ? "text-[#2a3d16]" : "text-[var(--text-muted)]"}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                </div>
                <span className={`text-[10px] font-bold ${isActive("/") ? "text-[#2a3d16]" : "text-[var(--text-muted)]"}`}>
                    記帳
                </span>
            </Link>

            {/* 紀錄 */}
            <Link href="/history" className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative group">
                {isActive("/history") && (
                    <div className="absolute top-[1px] w-6 h-[4px] bg-[#2a3d16] rounded-full shadow-sm" />
                )}
                <div className={`p-1 transition-all ${isActive("/history") ? "text-[#2a3d16]" : "text-[var(--text-muted)]"}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                        <rect x="9" y="3" width="6" height="4" rx="1" />
                        <line x1="9" y1="12" x2="15" y2="12" />
                    </svg>
                </div>
                <span className={`text-[10px] font-bold ${isActive("/history") ? "text-[#2a3d16]" : "text-[var(--text-muted)]"}`}>
                    紀錄
                </span>
            </Link>

            {/* 分析 */}
            <Link href="/analysis" className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative group">
                {isActive("/analysis") && (
                    <div className="absolute top-[1px] w-6 h-[4px] bg-[#2a3d16] rounded-full shadow-sm" />
                )}
                <div className={`p-1 transition-all ${isActive("/analysis") ? "text-[#2a3d16]" : "text-[var(--text-muted)]"}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                        <path d="M22 12A10 10 0 0 0 12 2v10z" />
                    </svg>
                </div>
                <span className={`text-[10px] font-bold ${isActive("/analysis") ? "text-[#2a3d16]" : "text-[var(--text-muted)]"}`}>
                    分析
                </span>
            </Link>

            {/* 搜尋 */}
            <Link href="/search" className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative group">
                {isActive("/search") && (
                    <div className="absolute top-[1px] w-6 h-[4px] bg-[#2a3d16] rounded-full shadow-sm" />
                )}
                <div className={`p-1 transition-all ${isActive("/search") ? "text-[#2a3d16]" : "text-[var(--text-muted)]"}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.3-4.3" />
                    </svg>
                </div>
                <span className={`text-[10px] font-bold ${isActive("/search") ? "text-[#2a3d16]" : "text-[var(--text-muted)]"}`}>
                    搜尋
                </span>
            </Link>
        </nav>
    );
}
