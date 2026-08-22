export default function LogoIcon({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="40" height="40" rx="8" fill="#0B3CC8" />
      <path d="M12 12H28V16H16V18.5H25V22.5H16V24H28V28H12V12Z" fill="white" />
    </svg>
  );
}
