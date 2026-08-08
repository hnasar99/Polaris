"use client";

import type { ReactNode } from "react";
import { ChainProvider } from "@/features/chain/ChainProvider";
import { PatientProvider } from "@/features/patient/PatientProvider";
import { RoleProvider } from "@/features/role/RoleProvider";
import { WalletProvider } from "@/features/wallet/WalletProvider";
import { I18nProvider } from "@/i18n";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <RoleProvider>
        <WalletProvider>
          <PatientProvider>
            <ChainProvider>{children}</ChainProvider>
          </PatientProvider>
        </WalletProvider>
      </RoleProvider>
    </I18nProvider>
  );
}
