"use client";

import { useEffect, useState } from "react";

import { AccountDisabledModal } from "./AccountDisabledModal";

export function AccountAccessListener() {
  const [isAccountDisabled, setIsAccountDisabled] =
    useState(false);

  useEffect(() => {
    const handleAccountDisabled = () => {
      setIsAccountDisabled(true);
    };

    window.addEventListener(
      "auth:account-disabled",
      handleAccountDisabled,
    );

    return () => {
      window.removeEventListener(
        "auth:account-disabled",
        handleAccountDisabled,
      );
    };
  }, []);

  return (
    <AccountDisabledModal
      isOpen={isAccountDisabled}
      onClose={() =>
        setIsAccountDisabled(false)
      }
    />
  );
}