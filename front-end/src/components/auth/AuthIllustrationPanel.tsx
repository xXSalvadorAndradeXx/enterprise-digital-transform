import Image from "next/image";

interface AuthIllustrationPanelProps {
  variant?: "login" | "registro";
}

const panelStyles = {
  login: {
    panel:
      "relative h-full min-h-[31rem] w-full overflow-hidden bg-[#FDE3EE]",
    image: "absolute inset-0",
    sizes: "(min-width: 768px) 50vw, 0px",
  },
  registro: {
    panel:
      "relative h-full min-h-[31rem] w-full overflow-hidden bg-[#FDE3EE]",
    image: "absolute inset-0",
    sizes: "(min-width: 768px) 50vw, 0px",
  },
} as const;

export function AuthIllustrationPanel({
  variant = "login",
}: AuthIllustrationPanelProps) {
  const styles = panelStyles[variant];

  return (
    <div className={styles.panel}>
      <div className={styles.image}>
        <Image
          src="/images/auth/login-iris.png"
          alt="Cliente de Iris Accesorios mostrando una compra"
          fill
          priority
          sizes={styles.sizes}
          className="object-cover object-center"
        />
      </div>
    </div>
  );
}
