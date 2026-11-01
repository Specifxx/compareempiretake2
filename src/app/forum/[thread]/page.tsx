// One forum thread (docs/forum.md), prerendered at the release for every thread
// that existed then. A newer thread opens at /forum#t=<id>, drawn by the browser.
// A thread with no replies is noindex.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ForumApp } from "@/components/forum/Forum";
import "@/components/forum/forum.css";
import { findThread, idFromSegment, threadDescription, threadIndexable, threadJsonLd, threadPath, visibleThreads } from "@/lib/forum/core";
import { FORUM_SITE } from "@/lib/forum/site";
import { readForum } from "@/lib/forum/store";
import { SITE } from "@/lib/site";

export const dynamicParams = false;

export async function generateStaticParams() {
  const forum = await readForum(FORUM_SITE, false);
  return visibleThreads(forum).map((t) => ({ thread: threadPath(FORUM_SITE, t).split("/").pop()! }));
}

type Props = { params: Promise<{ thread: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = idFromSegment((await params).thread);
  const t = id ? findThread(await readForum(FORUM_SITE, false), id) : null;
  if (!t) return { title: "Community forum", robots: { index: false, follow: true } };
  return {
    title: `${t.title} | Community forum`,
    description: threadDescription(t),
    alternates: { canonical: threadPath(FORUM_SITE, t) },
    ...(threadIndexable(t) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function Page({ params }: Props) {
  const id = idFromSegment((await params).thread);
  const forum = await readForum(FORUM_SITE, false);
  const t = id ? findThread(forum, id) : null;
  if (!id || !t) notFound();
  return (
    <div className="container-x max-w-6xl pt-6">
      {threadIndexable(t) && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(threadJsonLd(SITE, FORUM_SITE, t)).replace(/</g, "\\u003c") }} />}
      <ForumApp site={FORUM_SITE} initial={forum} threadId={id} now={Date.now()} />
    </div>
  );
}
