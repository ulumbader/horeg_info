export type PublicCommentDTO = {
  id: string;
  body: string;
  authorType: "ANONYMOUS" | "ADMIN";
  createdAt: string;
  editedAt: string | null;
};

export type EngagementSummary = {
  likeCount: number;
  commentCount: number;
  viewerLiked: boolean;
};

export function formatCompactCount(value: number) {
  return value > 99 ? "99+" : String(Math.max(0, value));
}

export function canAdminEditComment(authorType: "ANONYMOUS" | "ADMIN") {
  return authorType === "ADMIN";
}
