const LOGO_SRC =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20261027-WA0078%281%29-UfE3fDwc4pxdZGDc7nr7MzG6qCAiPV.jpg";

export function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <img
      src={LOGO_SRC}
      alt="United Bank Offshore — Global Banking. Borderless Opportunities."
      width={1280}
      height={853}
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
    />
  );
}
