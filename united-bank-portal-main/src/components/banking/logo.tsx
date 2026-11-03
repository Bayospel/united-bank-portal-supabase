import logoAsset from "@/assets/united-bank-logo.png.asset.json";

export function Logo({ className = "h-10" }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="United Bank Offshore — Global Banking. Borderless Opportunities."
      className={className}
    />
  );
}
