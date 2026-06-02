import { MessageCircle } from "lucide-react";

export function WhatsappButton() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const href = phone ? `https://wa.me/${phone}` : "https://wa.me/";

  return (
    <a
      href={href}
      aria-label="Contact on WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-ink text-paper shadow-soft transition hover:scale-105"
      target="_blank"
      rel="noreferrer"
    >
      <MessageCircle className="h-5 w-5" />
    </a>
  );
}
