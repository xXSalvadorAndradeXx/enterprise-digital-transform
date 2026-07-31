"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";
import Image from "next/image";
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

import loginIllustration from "@/assets/login/login-illustration.png";
import AccountLockedModal from "@/components/auth/AccountLockedModal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useLogin } from "@/hooks/auth/useLogin";

const INVALID_CREDENTIALS_MESSAGE =
  "Usuario o contraseña incorrectos.";

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

  const [
    isAccountLockedModalOpen,
    setIsAccountLockedModalOpen,
  ] = useState(false);

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
      setIsAccountLockedModalOpen(true);
    }
  }, [error, setError, clearErrors]);

  const handleUsuarioChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    void onUsuarioFieldChange(event);

    if (errors.usuario?.type === "server") {
      clearErrors("usuario");
    }

    resetError();
  };

  const handlePasswordChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    void onPasswordFieldChange(event);

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
    setIsAccountLockedModalOpen(false);
    resetError();
  };

  const onSubmit = async (
    values: LoginFormValues,
  ): Promise<void> => {
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

      const normalizedRole = session.user.rol
  .trim()
  .toUpperCase();

const destination =
  normalizedRole === "EMPLEADO"
    ? "/pedidos"
    : "/dashboard";

router.replace(destination);
router.refresh();


    } catch {
      /*
       * AuthContext controla los errores producidos
       * al establecer la sesión.
       */
    }
  };

  return (
    <main className="min-h-screen bg-white px-6 md:px-12 lg:px-16">
      <div className="mx-auto grid min-h-screen max-w-[1200px] gap-12 lg:grid-cols-[1fr_420px] lg:gap-16">
        {/* Columna izquierda */}
        <section className="flex items-center justify-center">
          <div className="w-full min-w-0 max-w-[362px]">
            <h1 className="text-center font-[var(--font-title)] text-[38px] font-bold leading-tight text-[#4A4A4A]">
              Iniciar sesión
            </h1>

            <form
              onSubmit={handleSubmit(onSubmit)}
              aria-label="Inicio de sesión"
              noValidate
              className="mt-20 flex flex-col"
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
                  error={Boolean(errors.usuario)}
                  errorMessage={errors.usuario?.message}
                  aria-invalid={Boolean(errors.usuario)}
                  aria-describedby={
                    errors.usuario
                      ? "usuario-error"
                      : hasFormError
                        ? "login-form-error"
                        : undefined
                  }
                  icon={
                    errors.usuario ? (
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
                  error={Boolean(errors.password)}
                  errorMessage={errors.password?.message}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password
                      ? "password-error"
                      : hasFormError
                        ? "login-form-error"
                        : undefined
                  }
                  icon={
                    <span className="flex items-center gap-2">
                      {errors.password ? (
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
                        className="rounded-sm text-[#878A92] transition-colors hover:text-[#4A4A4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C21D1] focus-visible:ring-offset-2"
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

              <div className="mt-12 flex justify-center">
                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={isLoading}
                  className="w-[296px] max-w-full"
                >
                  Iniciar sesión
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Columna derecha */}
        <section className="hidden lg:block">
          <div className="relative ml-auto h-[calc(100vh-16px)] w-[420px] overflow-hidden rounded-t-full bg-[#F2F5FC]">
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

      <AccountLockedModal
        open={isAccountLockedModalOpen}
        onAcknowledge={handleAccountLockedAcknowledge}
      />
    </main>
  );
}