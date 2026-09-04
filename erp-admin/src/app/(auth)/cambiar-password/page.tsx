"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import loginIllustration from "@/assets/login/login-illustration.png";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordRequirementsHint from "@/components/ui/PasswordRequirementsHint";
import { useAuth } from "@/contexts/AuthContext";
import { getFirstAllowedRoute } from "@/constants/route-permissions";
import { changePassword } from "@/services/auth/change-password.service";

import SuccessAlert from "./components/SuccessAlert";

const changePasswordSchema = z
  .object({
    temporaryPassword: z
      .string()
      .min(1, "La contraseña temporal es obligatoria."),
    newPassword: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres.")
      .regex(/[A-Z]/, "Debe incluir una letra mayúscula.")
      .regex(/[a-z]/, "Debe incluir una letra minúscula.")
      .regex(/\d/, "Debe incluir un número.")
      .regex(
        /[^A-Za-z0-9]/,
        "Debe incluir un carácter especial.",
      ),
    confirmPassword: z.string().min(
      1,
      "Debe confirmar la nueva contraseña.",
    ),
  })
  .refine(
    (values) =>
      values.newPassword === values.confirmPassword,
    {
      path: ["confirmPassword"],
      message: "Las contraseñas no coinciden.",
    },
  );

type ChangePasswordForm = z.infer<
  typeof changePasswordSchema
>;

export default function ChangePasswordPage() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [requestError, setRequestError] = useState<
    string | null
  >(null);

  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isInitializing,
    mustChangePassword,
  } = useAuth();

  const {
    register,
    control,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
      isValid,
    },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
    defaultValues: {
      temporaryPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (!mustChangePassword) {
      const destination = getFirstAllowedRoute(user.permissions) ?? "/dashboard";

      router.replace(destination);
    }
  }, [
    isAuthenticated,
    isInitializing,
    mustChangePassword,
    router,
    user,
  ]);

  const password =
    useWatch({
      control,
      name: "newPassword",
    }) ?? "";

  const passwordRules = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const onSubmit = async (
    data: ChangePasswordForm,
  ): Promise<void> => {
    setRequestError(null);

    try {
      await changePassword({
        currentPassword: data.temporaryPassword,
        newPassword: data.newPassword,
      });

      setShowSuccess(true);
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "No fue posible cambiar la contraseña.",
      );
    }
  };

  if (
    isInitializing ||
    !isAuthenticated ||
    !user ||
    !mustChangePassword
  ) {
    return (
      <main
        className="grid min-h-screen place-items-center bg-white"
        role="status"
      >
        <p className="text-sm text-[#4A4A4A]">
          Validando sesión...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen w-full items-center gap-16 px-9 py-12 lg:grid-cols-[580px_420px] lg:px-12">
        <section className="flex justify-start">
          <div className="w-full max-w-[580px]">
            <h1 className="text-[40px] font-bold leading-tight text-black">
              Crea una nueva contraseña
            </h1>

            <p className="mt-3 text-[16px] leading-relaxed text-[#4A4A4A]">
              Por seguridad, debes cambiar tu contraseña temporal antes de acceder al ERP.
            </p>

            <form
              className="mt-8 flex flex-col gap-6"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <div className="flex w-full max-w-[362px] flex-col gap-3">
                <Input
                  label="Contraseña temporal actual"
                  type="password"
                  autoComplete="current-password"
                  error={Boolean(errors.temporaryPassword)}
                  errorMessage={errors.temporaryPassword?.message}
                  {...register("temporaryPassword")}
                />

                <Input
                  id="newPassword"
                  label="Nueva contraseña"
                  type="password"
                  autoComplete="new-password"
                  error={Boolean(errors.newPassword)}
                  errorMessage={errors.newPassword?.message}
                  {...register("newPassword")}
                />

                <Input
                  id="confirmPassword"
                  label="Confirmar nueva contraseña"
                  type="password"
                  autoComplete="new-password"
                  error={Boolean(errors.confirmPassword)}
                  errorMessage={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />

                <PasswordRequirementsHint
                  rules={passwordRules}
                />

                {requestError && (
                  <p
                    role="alert"
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  >
                    {requestError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!isValid || isSubmitting}
                className="mt-1 w-[352px] self-center"
              >
                Cambiar contraseña y acceder
              </Button>
            </form>
          </div>
        </section>

        <section className="hidden lg:block">
          <div className="relative ml-auto h-[calc(100vh-48px)] w-[420px] overflow-hidden rounded-t-full bg-[#F2F5FC]">
            <Image
              src={loginIllustration}
              alt=""
              priority
              aria-hidden="true"
              sizes="420px"
              className="absolute left-1/2 top-[32%] h-auto w-[165%] max-w-none -translate-x-1/2 object-contain"
            />
          </div>
        </section>
      </div>

      <SuccessAlert
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="¡Contraseña actualizada!"
        message="Se guardó su contraseña correctamente."
        buttonText="Aceptar"
      />
    </main>
  );
}
