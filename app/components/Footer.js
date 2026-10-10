import { site } from "../../lib/site";

export default function Footer() {
  return (
    <footer className="mx-auto max-w-4xl px-4 py-8 text-center text-xs text-gray-500">
      {site.footer}
    </footer>
  );
}
