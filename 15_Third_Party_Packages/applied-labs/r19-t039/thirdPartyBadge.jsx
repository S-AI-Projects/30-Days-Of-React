// Vendor display component — stands in for a third-party package.
// Its props are its own: `text` (string) and `tone`
// ("info" | "success" | "error"). Application code must not modify
// this file; it talks to the component only through adaptBadgeProps.
export default function ThirdPartyBadge({ text, tone }) {
  return <span data-tone={tone}>{text}</span>;
}
