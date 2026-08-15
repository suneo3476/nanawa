import type { Metadata } from "next";
import Link from "next/link";
import { getAllVenues } from "@/lib/data";
import { formatDateShort, yearOf } from "@/lib/format";

export const metadata: Metadata = {
  title: "会場",
  description: "七輪が出演してきた会場の一覧。出演回数順。",
};

export default function VenuesPage() {
  const venues = getAllVenues();
  return (
    <div className="pt-8">
      <section className="pb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">会場</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          これまでに出演した{venues.length}
          ヶ所。「あの会場でやったのいつだっけ?」はここから辿れます。
        </p>
      </section>
      <ul className="grid gap-3 sm:grid-cols-2">
        {venues.map((v) => (
          <li key={v.slug}>
            <Link
              href={`/venues/${v.slug}`}
              className="group flex h-full items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
            >
              <div className="min-w-0">
                <h2 className="truncate font-semibold group-hover:text-accent-strong">
                  {v.name}
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  {v.liveCount === 1
                    ? formatDateShort(v.firstDate)
                    : `${yearOf(v.firstDate)}年 〜 ${yearOf(v.lastDate)}年`}
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-accent-soft px-2 py-1 text-center">
                <span className="block font-mono text-lg font-bold leading-none tabular-nums text-accent-strong">
                  {v.liveCount}
                </span>
                <span className="text-[10px] text-accent-strong/80">回</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
