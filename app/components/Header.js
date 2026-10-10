import Link from "next/link";
import { site } from "../../lib/site";
import LogoutButton from "../files/LogoutButton";

export default function Header({ role }) {
  return (
    <header className="border-b border-white/10 bg-white/5">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="text-2xl">🎓</span>
          {site.name}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {role === "admin" && (
            <>
              <Link href="/upload" className="text-blue-300 hover:underline">
                Upload
              </Link>
              <Link href="/files" className="text-blue-300 hover:underline">
                Manage
              </Link>
            </>
          )}
          {role && <LogoutButton />}
        </nav>
      </div>
    </header>
  );
}
