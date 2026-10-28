/** 设置 → 插件 → 微信读书：API Key 保存、重新校验与断开。Key 只存当前工作区。 */

import { useState } from "react";
import { ExternalLink, KeyRound } from "lucide-react";
import { Button, Input, toast } from "@tau/ui";
import { openExternal, useWeRead, useWeReadState } from "../hooks";
import { WEREAD_API_KEY_URL } from "./ConnectPanel";

const STATUS_TEXT = {
  none: "未连接",
  checking: "校验中…",
  valid: "已连接",
  invalid: "API Key 已失效",
} as const;

export function WeReadSettings() {
  const { runtime } = useWeRead();
  const connection = useWeReadState(state => state.connection);
  const reason = useWeReadState(state => state.connectionError);
  const saved = useWeReadState(state => state.apiKey);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<boolean>, success: string) => {
    setBusy(true);
    try {
      if (await action()) toast.success(success);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wr:flex wr:flex-col wr:gap-3">
      <div className="wr:flex wr:items-center wr:gap-2">
        <span className="wr:text-tau-body wr:text-ink-1 wr:font-medium">连接状态</span>
        <span
          className={
            connection === "valid"
              ? "wr:text-ok wr:text-tau-meta"
              : connection === "invalid"
                ? "wr:text-danger wr:text-tau-meta"
                : "wr:text-ink-2 wr:text-tau-meta"
          }
        >
          {STATUS_TEXT[connection]}
        </span>
      </div>
      {connection === "invalid" && reason && (
        <p className="wr:text-tau-sm wr:text-danger">{reason}</p>
      )}
      <form
        className="wr:flex wr:gap-2"
        onSubmit={event => {
          event.preventDefault();
          const value = draft.trim();
          if (!value) return;
          void run(async () => {
            const valid = await runtime.saveApiKey(value);
            if (valid) setDraft("");
            else toast.error(runtime.getState().connectionError || "API Key 校验失败");
            return valid;
          }, "已连接微信读书");
        }}
      >
        <Input
          lead={KeyRound}
          type="password"
          autoComplete="off"
          value={draft}
          disabled={busy}
          onChange={event => setDraft(event.target.value)}
          placeholder={saved ? "已保存，粘贴新的 API Key 替换" : "粘贴 API Key"}
          aria-label="微信读书 API Key"
        />
        <Button type="submit" variant="primary" disabled={!draft.trim()} loading={busy}>
          保存并校验
        </Button>
      </form>
      <div className="wr:flex wr:flex-wrap wr:gap-1">
        <Button
          variant="ghost"
          size="sm"
          icon={ExternalLink}
          onClick={() => openExternal(WEREAD_API_KEY_URL)}
        >
          获取 API Key
        </Button>
        {saved && (
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => void run(() => runtime.validate(), "API Key 有效")}
            >
              重新校验
            </Button>
            <Button
              variant="danger-soft"
              size="sm"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await runtime.saveApiKey("");
                  return true;
                }, "已断开，书架与摘录保留")
              }
            >
              断开
            </Button>
          </>
        )}
      </div>
      <p className="wr:text-tau-sm wr:text-ink-3">
        API Key 只保存在当前工作区。断开后书架缓存和已同步到 Tau 的划线保留。
      </p>
    </div>
  );
}
