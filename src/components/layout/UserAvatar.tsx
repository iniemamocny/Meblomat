import type { ReactNode } from "react";
import Image from "next/image";
import clsx from "classnames";

type Props = {
  imageUrl?: string | null;
  initials?: string;
  fallbackIcon?: ReactNode;
  alt?: string;
  className?: string;
};

export function UserAvatar({ imageUrl, initials, fallbackIcon, alt = "User avatar", className }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex size-10 items-center justify-center overflow-hidden rounded-full bg-black/5 text-sm font-medium text-black dark:bg-white/10 dark:text-white",
        className,
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          width={40}
          height={40}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : fallbackIcon ? (
        fallbackIcon
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <span aria-hidden="true" className="text-base">
          👤
        </span>
      )}
    </span>
  );
}
