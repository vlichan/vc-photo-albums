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
      className="fixed right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-ink text-paper shadow-soft transition hover:scale-105"
      style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      target="_blank"
      rel="noreferrer"
    >
      <MessageCircle className="h-5 w-5" />
    </a>
  );
}
