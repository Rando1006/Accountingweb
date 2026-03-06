"use client";

import { useState, useEffect } from "react";

interface UserSettingProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newId: string) => void;
    currentId: string;
}

export default function UserSetting({
    isOpen,
    onClose,
    onSave,
    currentId,
}: UserSettingProps) {
    const [tempId, setTempId] = useState(currentId);

    useEffect(() => {
        setTempId(currentId);
    }, [currentId, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-card w-full max-w-xs p-6 animate-slide-up">
                <h2 className="text-xl font-bold mb-4 text-center" style={{ color: "var(--text-primary)" }}>
                    使用者設定
                </h2>
                <p className="text-sm mb-6 text-center" style={{ color: "var(--text-muted)" }}>
                    設定您的使用者 ID，以便區分不同人的記帳紀錄。
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold mb-2 tracking-wider uppercase" style={{ color: "var(--accent-light)" }}>
                            使用者 ID
                        </label>
                        <input
                            type="text"
                            className="expense-input !py-3"
                            value={tempId}
                            onChange={(e) => setTempId(e.target.value)}
                            placeholder="例如：Mountain"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button className="btn-secondary flex-1" onClick={onClose}>
                            取消
                        </button>
                        <button
                            className="btn-primary flex-1"
                            onClick={() => {
                                onSave(tempId || "default");
                                onClose();
                            }}
                        >
                            儲存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
