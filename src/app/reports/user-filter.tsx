"use client";

import { input } from "@/lib/ui";

export function UserFilter({
  members,
  selected,
}: {
  members: { user_id: string; display_name: string | null }[];
  selected?: string;
}) {
  return (
    <form className="flex items-center gap-2 text-sm">
      <label htmlFor="user" className="text-slate-500">
        ดูรายการของ
      </label>
      <select
        id="user"
        name="user"
        defaultValue={selected ?? ""}
        className={input}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">ทุกคน</option>
        {members.map((m) => (
          <option key={m.user_id} value={m.user_id}>
            {m.display_name ?? "ไม่ระบุชื่อ"}
          </option>
        ))}
      </select>
    </form>
  );
}
