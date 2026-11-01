// The beta forum (docs/forum.md). Prerendered at the release with the threads as
// they were then (for search engines); the browser fetches the newest posts from
// GitHub itself, so new posts show without a build or a function.
import type { Metadata } from "next";
import { ForumApp } from "@/components/forum/Forum";
import "@/components/forum/forum.css";
import { forumIndexable } from "@/lib/forum/core";
import { FORUM_SITE } from "@/lib/forum/site";
import { readForum } from "@/lib/forum/store";

export async function generateMetadata(): Promise<Metadata> {
  const forum = await readForum(FORUM_SITE, false);
  return {
    title: "Community forum: what to buy, deals and prices",
    description: "The Compare Empire community forum. Ask what to buy, share deals and talk tech and appliance prices. No account needed.",
    alternates: { canonical: "/forum" },
    ...(forumIndexable(forum) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function Page() {
  const forum = await readForum(FORUM_SITE, false);
  return (
    <div className="container-x max-w-6xl pt-6">
      <ForumApp site={FORUM_SITE} initial={forum} now={Date.now()} />
    </div>
  );
}
