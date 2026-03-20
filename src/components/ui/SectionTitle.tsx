interface SectionTitleProps {
  children: React.ReactNode;
  subtitle?: string;
  align?: "left" | "center";
  gradient?: boolean;
  uppercase?: boolean;
}

export function SectionTitle({
  children,
  subtitle,
  align = "center",
  gradient = false,
  uppercase = false,
}: SectionTitleProps) {
  const alignClass = align === "center" ? "text-center" : "text-left";

  return (
    <div className={`${alignClass} mb-12`}>
      <h2
        className={`text-white mb-3 ${uppercase ? "tracking-[0.2em]" : ""}`}
        style={{
          fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
          fontWeight: 700,
          ...(gradient
            ? {
                background: "linear-gradient(135deg, #ffffff 30%, #00d4ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }
            : {}),
        }}
      >
        {children}
      </h2>
      {subtitle && (
        <p className="text-gray-400 max-w-2xl mx-auto text-sm leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}