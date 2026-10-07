import { useTranslation } from "react-i18next";
import LanguageSelector from "@/components/LanguageSelector";
import AccountSettings from "@/pages/workspace/AccountSettings";

export default function AdminSettings() {
  const { t } = useTranslation("auth");
  return (
    <>
      <LanguageSelector />
      <AccountSettings backTo="/admin/dashboard" backLabel={t("account.backToAdmin")} memberLabel={t("account.administrator")} />
    </>
  );
}
