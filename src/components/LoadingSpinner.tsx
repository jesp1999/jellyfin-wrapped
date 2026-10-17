import { Spinner } from "@radix-ui/themes";

export function LoadingSpinner({
  backgroundColor = "var(--green-8)",
}: {
  backgroundColor?: string;
}) {
  return (
    <main
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: `color-mix(in srgb, ${backgroundColor} 58%, black)`,
      }}
    >
      <span role="status">
        <Spinner size="3" />
        <span className="wrapped-sr-only">Loading</span>
      </span>
    </main>
  );
}
