"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";
import Image from "next/image";
import { Fredoka, Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleAlert,
  CircleUserRound,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

import AccountLockedModal from "@/components/auth/AccountLockedModal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useLogin } from "@/hooks/auth/useLogin";
import { getFirstAllowedRoute } from "@/constants/route-permissions";

const INVALID_CREDENTIALS_MESSAGE =
  "Usuario o contraseña incorrectos.";

const EMPTY_FIELDS_MESSAGE =
  "Por favor, completa todos los campos para continuar";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/*
 * Estos errores se representan en los campos o mediante un modal.
 * Por eso no deben mostrarse nuevamente como error general.
 */
const HIDDEN_GENERAL_ERROR_TYPES = new Set([
  "user_not_registered",
  "incorrect_password",
  "invalid_credentials",
  "user_inactive",
  "account_locked",
]);

const loginSchema = z.object({
  usuario: z
    .string()
    .trim()
    .min(1, "El correo electrónico es obligatorio.")
    .email("El correo electrónico no es válido."),

  password: z
    .string()
    .min(1, "La contraseña es obligatoria.")
    .min(
      6,
      "La contraseña debe tener al menos 6 caracteres.",
    ),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isPasswordVisible, setIsPasswordVisible] =
    useState(false);
  const [hasEmptyFieldsError, setHasEmptyFieldsError] =
    useState(false);

  const router = useRouter();
  const { establishSession } = useAuth();
  const {
    login,
    isLoading,
    error,
    resetError,
  } = useLogin();

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      usuario: "",
      password: "",
    },

    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const {
    name: usuarioName,
    onBlur: onUsuarioBlur,
    onChange: onUsuarioFieldChange,
    ref: usuarioRegisterRef,
  } = register("usuario");

  const {
    name: passwordName,
    onBlur: onPasswordBlur,
    onChange: onPasswordFieldChange,
    ref: passwordRegisterRef,
  } = register("password");

  /*
   * Los errores de campos no se repiten como error general.
   * Los errores de red, servidor, timeout o validación del BFF
   * sí se muestran debajo del formulario.
   */
  const formErrorMessage =
    error &&
    !HIDDEN_GENERAL_ERROR_TYPES.has(error.type)
      ? error.message
      : undefined;

  const hasFormError = Boolean(formErrorMessage);
  const usuarioHasError =
    hasEmptyFieldsError || Boolean(errors.usuario);
  const passwordHasError =
    hasEmptyFieldsError || Boolean(errors.password);
  const isAccountLockedModalOpen =
    error?.type === "account_locked";

  /*
   * Traduce el error normalizado del servicio a su
   * representación correspondiente en la interfaz.
   */
  useEffect(() => {
    if (!error) {
      return;
    }

    if (error.type === "user_not_registered") {
      setError("usuario", {
        type: "server",
        message: error.message,
      });

      return;
    }

    if (error.type === "incorrect_password") {
      setError("password", {
        type: "server",
        message: error.message,
      });

      return;
    }

    if (error.type === "user_inactive") {
      setError("usuario", {
        type: "server",
        message: "Usuario inactivo",
      });

      return;
    }

    /*
     * Cuando backend no indica cuál credencial falló,
     * ambos campos se marcan como incorrectos.
     */
    if (error.type === "invalid_credentials") {
      setError("usuario", {
        type: "server",
        message: INVALID_CREDENTIALS_MESSAGE,
      });

      setError("password", {
        type: "server",
        message: INVALID_CREDENTIALS_MESSAGE,
      });

      return;
    }

    /*
     * El bloqueo no se muestra debajo del formulario.
     * Se limpian los campos y se abre el modal.
     */
    if (error.type === "account_locked") {
      clearErrors();
    }
  }, [error, setError, clearErrors]);

  const handleUsuarioChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    void onUsuarioFieldChange(event);

    if (hasEmptyFieldsError) {
      setHasEmptyFieldsError(false);
      clearErrors();
    }

    if (errors.usuario?.type === "server") {
      clearErrors("usuario");
    }

    resetError();
  };

  const handlePasswordChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    void onPasswordFieldChange(event);

    if (hasEmptyFieldsError) {
      setHasEmptyFieldsError(false);
      clearErrors();
    }

    if (errors.password?.type === "server") {
      clearErrors("password");
    }

    resetError();
  };

  const clearServerFieldErrors = (): void => {
    if (errors.usuario?.type === "server") {
      clearErrors("usuario");
    }

    if (errors.password?.type === "server") {
      clearErrors("password");
    }
  };

  const handlePasswordVisibility = (): void => {
    setIsPasswordVisible(
      (currentValue) => !currentValue,
    );
  };

  const handleAccountLockedAcknowledge = (): void => {
    resetError();
  };

  const onSubmit = async (
    values: LoginFormValues,
  ): Promise<void> => {
    setHasEmptyFieldsError(false);
    resetError();
    clearServerFieldErrors();

    const session = await login({
      email: values.usuario.trim(),
      password: values.password,
    });

    if (session === null) {
      return;
    }

    try {
      await establishSession(session);

      if (session.mustChangePassword) {
        router.replace("/cambiar-password");
        router.refresh();
        return;
      }

      const destination = getFirstAllowedRoute(session.user.permissions) ?? "/dashboard";

      router.replace(destination);
      router.refresh();


    } catch {
      /*
       * AuthContext controla los errores producidos
       * al establecer la sesión.
       */
    }
  };

  const onInvalidSubmit = (): void => {
    const values = getValues();
    const hasEmptyField =
      values.usuario.trim().length === 0 ||
      values.password.trim().length === 0;

    setHasEmptyFieldsError(hasEmptyField);

    if (hasEmptyField) {
      resetError();
    }
  };

  return (
    <main className={`${inter.className} flex min-h-screen items-center bg-white px-5 py-8 text-[#4A4A4A] sm:px-8 lg:px-12 lg:py-9`}>
      <div className="mx-auto grid w-full max-w-[1160px] overflow-hidden rounded-sm bg-white lg:h-[565px] lg:grid-cols-[minmax(360px,1fr)_500px]">
        {/* Columna izquierda */}
        <section className="flex flex-col px-3 pb-10 pt-3 sm:px-10 lg:px-16 lg:pb-16 lg:pt-16">
          <Image
            src="/images/auth/logo-iris.png"
            alt="Iris Accesorios"
            width={297}
            height={114}
            priority
            className="h-auto w-[260px] object-contain"
          />

          <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center py-12 lg:py-8">
            <h1 className={`${fredoka.className} text-center text-[34px] font-semibold leading-tight text-[#4A4A4A] sm:text-[38px]`}>
              Iniciar sesión
            </h1>

            <form
              onSubmit={handleSubmit(
                onSubmit,
                onInvalidSubmit,
              )}
              aria-label="Inicio de sesión"
              noValidate
              className="mt-10 flex flex-col sm:mt-12"
            >
              <div className="flex flex-col gap-6">
                {/* Campo de usuario */}
                <Input
                  id="usuario"
                  name={usuarioName}
                  placeholder="Usuario"
                  autoComplete="username"
                  inputMode="email"
                  spellCheck={false}
                  error={usuarioHasError}
                  errorMessage={
                    hasEmptyFieldsError
                      ? undefined
                      : errors.usuario?.message
                  }
                  aria-invalid={usuarioHasError}
                  aria-describedby={
                    hasEmptyFieldsError
                      ? "login-empty-fields-error"
                      : errors.usuario
                      ? "usuario-error"
                      : hasFormError
                        ? "login-form-error"
                        : undefined
                  }
                  icon={
                    usuarioHasError ? (
                      <CircleAlert
                        aria-hidden="true"
                        size={20}
                        className="text-[#FF5A5A]"
                      />
                    ) : (
                      <CircleUserRound
                        aria-hidden="true"
                        size={24}
                      />
                    )
                  }
                  onBlur={onUsuarioBlur}
                  onChange={handleUsuarioChange}
                  ref={usuarioRegisterRef}
                />

                {/* Campo de contraseña */}
                <Input
                  id="password"
                  name={passwordName}
                  type={
                    isPasswordVisible
                      ? "text"
                      : "password"
                  }
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  className="pr-24"
                  error={passwordHasError}
                  errorMessage={
                    hasEmptyFieldsError
                      ? undefined
                      : errors.password?.message
                  }
                  aria-invalid={passwordHasError}
                  aria-describedby={
                    hasEmptyFieldsError
                      ? "login-empty-fields-error"
                      : errors.password
                      ? "password-error"
                      : hasFormError
                        ? "login-form-error"
                        : undefined
                  }
                  icon={
                    <span className="flex items-center gap-2">
                      {passwordHasError ? (
                        <CircleAlert
                          aria-hidden="true"
                          size={20}
                          className="text-[#FF5A5A]"
                        />
                      ) : (
                        <LockKeyhole
                          aria-hidden="true"
                          size={24}
                        />
                      )}

                      <button
                        type="button"
                        aria-label={
                          isPasswordVisible
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                        aria-pressed={isPasswordVisible}
                        onClick={handlePasswordVisibility}
                      className="rounded-sm text-[#878A92] transition-colors hover:text-[#B80A18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B80A18] focus-visible:ring-offset-2"
                      >
                        {isPasswordVisible ? (
                          <EyeOff
                            aria-hidden="true"
                            size={24}
                          />
                        ) : (
                          <Eye
                            aria-hidden="true"
                            size={24}
                          />
                        )}
                      </button>
                    </span>
                  }
                  onBlur={onPasswordBlur}
                  onChange={handlePasswordChange}
                  ref={passwordRegisterRef}
                />
              </div>

              {hasEmptyFieldsError && (
                <p
                  id="login-empty-fields-error"
                  role="alert"
                  aria-live="polite"
                  className="mt-5 flex items-center gap-2 text-sm text-[#F44336]"
                >
                  <CircleAlert
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0"
                  />

                  <span>{EMPTY_FIELDS_MESSAGE}</span>
                </p>
              )}

              {/* Errores generales de red, servidor o timeout */}
              {hasFormError && (
                <p
                  id="login-form-error"
                  role="alert"
                  aria-live="polite"
                  className="mt-5 flex items-center gap-2 text-sm text-[#F44336]"
                >
                  <CircleAlert
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0"
                  />

                  <span>{formErrorMessage}</span>
                </p>
              )}

              <div className="mt-10 flex justify-center">
                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={isLoading}
                  className="w-full !bg-[#B80A18] font-semibold hover:!bg-[#9E0815] active:!bg-[#870711] focus-visible:!ring-[#B80A18]"
                >
                  Iniciar sesión
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Columna derecha */}
        <section className="relative hidden h-[565px] lg:block">
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src="/images/auth/login-erp.png"
              alt="Exhibición de Iris Accesorios"
              fill
              priority
              sizes="500px"
              className="object-cover object-center"
            />
          </div>
        </section>
      </div>

      <AccountLockedModal
        open={isAccountLockedModalOpen}
        onAcknowledge={handleAccountLockedAcknowledge}
      />
    </main>
  );
}
