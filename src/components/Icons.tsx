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

export const ChevronUpIcon = (p: IconProps) =>
  base(p, <path d="M18 15l-6-6-6 6" />);

export const ChevronDownIcon = (p: IconProps) =>
  base(p, <path d="M6 9l6 6 6-6" />);

export const SearchIcon = (p: IconProps) =>
  base(
    p,
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </>,
  );

export const WandIcon = (p: IconProps) =>
  base(
    p,
    <>
      <path d="m15 4 5 5" />
      <path d="m18 1 5 5" />
      <path d="M2 22l12-12" />
      <path d="M9 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
    </>,
  );

export const KeyboardIcon = (p: IconProps) =>
  base(
    p,
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M6 12h.001M10 12h.001M14 12h.001M18 12h.001M7 16h10" />
    </>,
  );

export const ShareIcon = (p: IconProps) =>
  base(
    p,
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98m-.01-10.98-6.82 3.98" />
    </>,
  );

export const FileCodeIcon = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="m10 13-2 2 2 2m4-4 2 2-2 2" />
    </>,
  );

export const PasteIcon = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </>,
  );

export const ExpandUpIcon = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M12 19V5m0 0-4 4m4-4 4 4" />
      <path d="M5 3h14" />
    </>,
  );

export const ExpandDownIcon = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M12 5v14m0 0-4-4m4 4 4-4" />
      <path d="M5 21h14" />
    </>,
  );

export const ExpandAllIcon = (p: IconProps) =>
  base(
    p,
    <>
      <path d="M7 8l5-5 5 5" />
      <path d="M7 16l5 5 5-5" />
    </>,
  );

export const LogoIcon = ({ size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <rect x="2" y="4" width="12" height="24" rx="3" fill="var(--del-text, #e5484d)" opacity="0.95" />
    <rect x="18" y="4" width="12" height="24" rx="3" fill="var(--add-text, #30a46c)" opacity="0.95" />
    <rect x="2" y="4" width="12" height="24" rx="3" fill="none" stroke="color-mix(in srgb, var(--border-strong, #cbd4e0) 60%, transparent)" strokeWidth="0.8" />
    <rect x="18" y="4" width="12" height="24" rx="3" fill="none" stroke="color-mix(in srgb, var(--border-strong, #cbd4e0) 60%, transparent)" strokeWidth="0.8" />
  </svg>
);
