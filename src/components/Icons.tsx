interface IconProps {
  size?: number;
  className?: string;
}

function base(props: IconProps, children: React.ReactNode, viewBox = '0 0 24 24') {
  return (
    <svg
      width={props.size ?? 16}
      height={props.size ?? 16}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const UploadIcon = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M12 15V3m0 0-4 4m4-4 4 4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </>,
  );

export const CloseIcon = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M6 6l12 12M18 6 6 18" />
    </>,
  );

export const SwapIcon = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M3 7h13m0 0-4-4m4 4-4 4" />
      <path d="M21 17H8m0 0 4 4m-4-4 4-4" />
    </>,
  );

export const SunIcon = (p: IconProps) =>
  base(
    p,
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
    </>,
  );

export const MoonIcon = (p: IconProps) =>
  base(
    p,
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  );

export const CopyIcon = (p: IconProps) =>
  base(
    p,
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>,
  );

export const DownloadIcon = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </>,
  );

export const CheckIcon = (p: IconProps) =>
  base(
    p,
    <path d="M4 12.5 9 17.5 20 6.5" />,
  );

export const ResetIcon = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </>,
  );

export const LogoIcon = ({ size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <rect x="2" y="4" width="12" height="24" rx="3" fill="#e5484d" />
    <rect x="18" y="4" width="12" height="24" rx="3" fill="#30a46c" />
  </svg>
);
