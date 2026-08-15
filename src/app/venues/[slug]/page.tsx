import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllLives, getAllVenues, getVenueBySlug } from "@/lib/data";
import { LiveCard } from "@/components/LiveCard";

export function generateStaticParams() {
  return getAllVenues().map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/venues/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) return {};
  return {
    title: venue.name,
    description: `${venue.name} での出演記録 ${venue.liveCount}回分。`,
  };
}

export default async function VenuePage({
  params,
}: PageProps<"/venues/[slug]">) {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) notFound();

  const liveIds = new Set(venue.liveIds);
  const lives = getAllLives().filter((l) => liveIds.has(l.id)); // 新しい順

  return (
    <div className="pt-8">
      <nav className="text-xs text-muted" aria-label="パンくず">
        <Link href="/venues" className="hover:text-accent-strong hover:underline">
          会場
        </Link>
        <span className="mx-1.5">/</span>
        <span>{venue.name}</span>
      </nav>
      <header className="mt-3 pb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{venue.name}</h1>
        <p className="mt-2 text-sm text-muted">出演 {venue.liveCount}回</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {lives.map((live) => (
          <LiveCard key={live.id} live={live} />
        ))}
      </div>
    </div>
  );
}
