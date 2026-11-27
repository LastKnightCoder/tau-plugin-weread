/** 设置 → 插件 → 微信读书：API Key 保存、重新校验与断开。Key 只存当前工作区。 */

import { useState } from "react";
import { ExternalLink, KeyRound } from "lucide-react";
import { useI18n } from "@tau/plugins";
import { Button, Input, toast } from "@tau/ui";
import { messages } from "../i18n";
import { openExternal, useWeRead, useWeReadState } from "../hooks";
import { WEREAD_API_KEY_URL } from "./ConnectPanel";

const STATUS_KEY = {
  none: "settings.status.none",
  checking: "settings.status.checking",
  valid: "settings.status.valid",
  invalid: "settings.status.invalid",
} as const;

export function WeReadSettings() {
  const { runtime } = useWeRead();
  const { t } = useI18n(messages);
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
      toast.error(error instanceof Error ? error.message : t("settings.actionFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wr:flex wr:flex-col wr:gap-3">
      <div className="wr:flex wr:items-center wr:gap-2">
        <span className="wr:text-tau-body wr:text-ink-1 wr:font-medium">{t("settings.connectionLabel")}</span>
        <span
          className={
            connection === "valid"
              ? "wr:text-ok wr:text-tau-meta"
              : connection === "invalid"
                ? "wr:text-danger wr:text-tau-meta"
                : "wr:text-ink-2 wr:text-tau-meta"
          }
        >
          {t(STATUS_KEY[connection])}
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
            else toast.error(runtime.getState().connectionError || t("settings.validateFailed"));
            return valid;
          }, t("settings.connectedToast"));
        }}
      >
        <Input
          lead={KeyRound}
          type="password"
          autoComplete="off"
          value={draft}
          disabled={busy}
          onChange={event => setDraft(event.target.value)}
          placeholder={saved ? t("settings.placeholderSaved") : t("settings.placeholder")}
          aria-label={t("settings.ariaKey")}
        />
        <Button type="submit" variant="primary" disabled={!draft.trim()} loading={busy}>
          {t("settings.saveAndValidate")}
        </Button>
      </form>
      <div className="wr:flex wr:flex-wrap wr:gap-1">
        <Button
          variant="ghost"
          size="sm"
          icon={ExternalLink}
          onClick={() => openExternal(WEREAD_API_KEY_URL)}
        >
          {t("settings.getApiKey")}
        </Button>
        {saved && (
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => void run(() => runtime.validate(), t("settings.validatedToast"))}
            >
              {t("settings.revalidate")}
            </Button>
            <Button
              variant="danger-soft"
              size="sm"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await runtime.saveApiKey("");
                  return true;
                }, t("settings.disconnectedToast"))
              }
            >
              {t("settings.disconnect")}
            </Button>
          </>
        )}
      </div>
      <p className="wr:text-tau-sm wr:text-ink-3">
        {t("settings.note")}
      </p>
    </div>
  );
}
