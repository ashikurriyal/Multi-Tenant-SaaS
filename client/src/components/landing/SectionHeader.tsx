import { cn } from "@/lib/utils";
import { eyebrow as eyebrowClass, reveal } from "./ui";

type Props = {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode; // the description under the title
  className?: string;
  titleClassName?: string;
};

// The eyebrow, heading and description that open each landing section
export default function SectionHeader({
  eyebrow,
  title,
  children,
  className,
  titleClassName,
}: Props) {
  return (
    <div className={cn(reveal, "flex max-w-180 flex-col gap-3", className)}>
      <p className={eyebrowClass}>{eyebrow}</p>
      <h2
        className={cn(
          "text-[clamp(30px,3.4vw,44px)] leading-[1.1] font-[650] tracking-tight",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {children && <p className="text-[17px] leading-[1.6] text-body">{children}</p>}
    </div>
  );
}
