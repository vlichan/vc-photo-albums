import { MessageCircle } from "lucide-react";

export function WhatsappButton() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  if (!phone) {
    return null;
  }

  const message = encodeURIComponent("Hello, I would like to ask about this album.");
  const href = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={href}
      aria-label="Contact on WhatsApp"
      className="fixed right-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-ink/92 text-paper shadow-soft transition hover:bg-black md:right-5 md:h-12 md:w-12"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      target="_blank"
      rel="noreferrer"
    >
      <MessageCircle className="h-5 w-5" />
    </a>
  );
}
