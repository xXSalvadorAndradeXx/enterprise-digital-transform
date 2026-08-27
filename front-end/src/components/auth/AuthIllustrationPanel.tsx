import Image from "next/image";

interface AuthIllustrationPanelProps {
  variant?: "login" | "registro";
}

const panelStyles = {
  login: {
    panel:
      "relative h-full min-h-[36rem] w-full max-w-[334px] overflow-hidden rounded-t-full bg-[#f0f3fc]",
    image: "absolute inset-x-[4%] bottom-0 h-[54%]",
    sizes: "(min-width: 768px) 308px, 0px",
  },
  registro: {
    panel:
      "relative h-full min-h-[28rem] w-full max-w-[334px] overflow-hidden rounded-t-full bg-[#f0f3fc]",
    image: "absolute inset-x-[2%] bottom-0 h-[74%]",
    sizes: "(min-width: 768px) 320px, 0px",
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
          src="/images/auth/login-illustration.png"
          alt=""
          fill
          priority
          sizes={styles.sizes}
          className="object-contain object-bottom"
        />
      </div>
    </div>
  );
}
