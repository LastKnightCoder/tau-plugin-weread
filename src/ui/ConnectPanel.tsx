/**
 * 首次使用：未填 API Key 时书架的纸内引导。校验通过即触发首次同步。
 * API Key 的完整管理（重新校验 / 断开）在设置 → 插件 → 微信读书。
 */

import { useState } from "react";
import { BookOpen, ExternalLink, KeyRound } from "lucide-react";
import { useI18n } from "@tau/plugins";
import { Button, Input } from "@tau/ui";
import { messages } from "../i18n";
import { openExternal, useWeRead, useWeReadState } from "../hooks";

export const WEREAD_API_KEY_URL = "https://weread.qq.com/r/weread-skills";

export function ConnectPanel({ onConnected }: { onConnected(): void }) {
  const { runtime } = useWeRead();
  const { t } = useI18n(messages);
  const reason = useWeReadState(state => state.connectionError);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const value = apiKey.trim();
    if (!value || loading) return;
    setLoading(true);
    setError("");
    try {
      if (!(await runtime.saveApiKey(value))) {
        setError(runtime.getState().connectionError || t("settings.validateFailed"));
        return;
      }
      onConnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.validateFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wr:flex wr:flex-col wr:items-center wr:px-5 wr:py-20 wr:text-center">
      <span className="wr:bg-accent-soft wr:text-accent-text wr:mb-3.5 wr:grid wr:size-[52px] wr:place-items-center wr:rounded-[16px]">
        <BookOpen className="wr:size-6" strokeWidth={1.5} />
      </span>
      <p className="wr:text-ink-1 wr:text-[15px] wr:font-semibold">{t("connect.title")}</p>
      <p className="wr:text-tau-meta wr:text-ink-2 wr:mt-1.5 wr:max-w-[42ch]">
        {t("connect.description")}
      </p>
      <ol className="wr:text-tau-meta wr:text-ink-2 wr:mt-5 wr:flex wr:flex-col wr:gap-2 wr:text-left">
        <li className="wr:flex wr:items-center wr:gap-2.5">
          <Step n={1} />
          {t("connect.step1")}
          <button
            type="button"
            onClick={() => openExternal(WEREAD_API_KEY_URL)}
            className="wr:text-accent-text wr:inline-flex wr:items-center wr:gap-1 wr:font-medium wr:hover:underline"
          >
            {t("connect.step1Open")}
            <ExternalLink className="wr:size-3" strokeWidth={1.75} />
          </button>
        </li>
        <li className="wr:flex wr:items-center wr:gap-2.5">
          <Step n={2} />
          {t("connect.step2")}
        </li>
      </ol>
      <form
        className="wr:mt-5 wr:flex wr:w-full wr:max-w-[420px] wr:gap-2"
        onSubmit={e => {
          e.preventDefault();
          void submit();
        }}
      >
        <Input
          lead={KeyRound}
          type="password"
          autoComplete="off"
          value={apiKey}
          disabled={loading}
          onChange={e => setApiKey(e.target.value)}
          placeholder={t("connect.placeholder")}
          aria-label={t("connect.ariaKey")}
        />
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          loadingText={t("connect.validating")}
          disabled={!apiKey.trim()}
          className="wr:shrink-0"
        >
          {t("connect.saveAndSync")}
        </Button>
      </form>
      {(error || reason) && (
        <p className="wr:text-tau-sm wr:text-danger wr:mt-2.5 wr:max-w-[420px]">
          {error || reason}
        </p>
      )}
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="wr:bg-accent-soft wr:text-accent-text wr:grid wr:size-5 wr:shrink-0 wr:place-items-center wr:rounded-full wr:text-[11px] wr:font-semibold">
      {n}
    </span>
  );
}
