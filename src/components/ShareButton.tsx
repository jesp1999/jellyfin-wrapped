import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button, Dialog, Flex, Text } from "@radix-ui/themes";
import { Share2 } from "lucide-react";
import { canShareFile, makeFile, saveFile, shareFile, warmShare } from "@/lib/share";

// The image is rendered first and shown in a preview. Sharing then happens on a second tap:
// iOS only allows navigator.share() right after a tap, and rendering can take a few seconds.
export function ShareButton({ capture }: { capture: () => Promise<Blob> }) {
  const { pathname } = useLocation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null);

  // Encode the fonts once in the background so the first share is not slower than the rest.
  useEffect(() => {
    const t = setTimeout(warmShare, 2000);
    return () => clearTimeout(t);
  }, []);

  const file = useMemo(
    () => (shot ? makeFile(shot.blob, `wrapped${pathname.replace(/\W+/g, "-")}.png`) : null),
    [shot, pathname]
  );

  const close = () => {
    if (shot) URL.revokeObjectURL(shot.url);
    setShot(null);
    setFailed(false);
  };

  const start = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await capture();
      setShot({ blob, url: URL.createObjectURL(blob) });
    } catch (error) {
      console.error("Share render failed:", error);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button size="4" color="gray" aria-label="Share this page" disabled={busy} onClick={() => void start()}>
        {busy ? "…" : <Share2 size={20} />}
      </Button>
      <Dialog.Root open={!!shot || failed} onOpenChange={(open) => !open && close()}>
        <Dialog.Content maxWidth="420px">
          <Dialog.Title>Share this page</Dialog.Title>
          <Dialog.Description size="2" mb="3">
            {failed ? "Could not create the image." : "Save it or send it to your apps."}
          </Dialog.Description>
          {shot && (
            <img
              src={shot.url}
              alt="Preview of the page as an image"
              style={{ display: "block", margin: "0 auto", maxWidth: "100%", maxHeight: "60vh", objectFit: "contain", borderRadius: 8 }}
            />
          )}
          {failed && <Text size="2">Try again, or take a screenshot.</Text>}
          <Flex gap="3" mt="4" justify="end">
            <Button variant="soft" color="gray" onClick={close}>
              Close
            </Button>
            {file && (
              <Button variant="soft" onClick={() => saveFile(file)}>
                Save image
              </Button>
            )}
            {file && canShareFile(file) && (
              <Button color="green" onClick={() => void shareFile(file).catch(() => saveFile(file))}>
                Share
              </Button>
            )}
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
