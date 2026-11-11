const paths = {
  home: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  list: "M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01",
  chart: "M4 20V10m7 10V4m7 16v-7",
  plus: "M12 5v14M5 12h14",
  wallet: "M3 5h18v15H3z M3 5l14-3v3m4 6h-6v5h6m-3-2.5h.01",
  food: "M5 3v7m3-7v7M3 3v5a3 3 0 0 0 6 0V3M6 11v10M18 3c-4 4-4 10 0 10V3v18",
  ride: "M4 5h16v13H4z M4 11h16M8 18v3m8-3v3M8 15h.01M16 15h.01M8 5V3h8v2",
  bag: "M4 8h16l-1 13H5L4 8ZM8 8V6a4 4 0 0 1 8 0v2",
  phone: "M6 2h12v20H6z M10 18h4",
  bill: "M5 3h14v18l-3-2-4 2-4-2-3 2V3ZM9 7h6m-6 5h6",
  other: "M8 12h.01M12 12h.01M16 12h.01",
  target: "M12 2v3m0 14v3M2 12h3m14 0h3",
};
export type IconName = keyof typeof paths;
export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {(name === "target" || name === "other") && (
        <circle cx="12" cy="12" r="8" />
      )}
      {name === "target" && <circle cx="12" cy="12" r="4" />}
      <path d={paths[name]} />
    </svg>
  );
}
