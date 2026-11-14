import type { Metadata } from "next";
import { ReviewsSection } from "@/components/ReviewsSection";

export const metadata: Metadata = {
  title: "Reviews of Compare Empire",
  description: "What shoppers say about Compare Empire, the price comparison site that shows the real price history. Every genuine review is published.",
  alternates: { canonical: "/reviews" },
};

export default function ReviewsPage() {
  return (
    <div className="container-x max-w-5xl pt-6 sm:pt-10">
      <h1 className="mb-6 page-title">Reviews</h1>
      <ReviewsSection full />
    </div>
  );
}
