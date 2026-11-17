import Link from "next/link";

const links = [
  ["/", "示範首頁", "Demo"],
  ["/staff", "人員收件匣", "Inbox"],
  ["/catalog", "目錄", "Catalog"],
  ["/compare", "同業對照", "Comparison"],
  ["/metrics", "試點指標", "Metrics"],
];

export function Nav() {
  return (
    <header className="no-print border-b border-stone-300 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="font-semibold text-stone-900">
          和盛磁磚
          <span className="en">Hesheng Tile demo</span>
        </Link>
        <nav className="flex flex-wrap gap-2 text-sm">
          {links.map(([href, zh, en]) => (
            <Link key={href} href={href} className="rounded-md px-2 py-1 hover:bg-stone-100">
              {zh}
              <span className="en">{en}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
