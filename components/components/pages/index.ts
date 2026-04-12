export { default as CreatePageForm } from './CreatePageForm.js';
export { default as PagesList } from './PagesList.js';


export { default as UnifyPage } from './Page.js';

export interface UnifyPageProps {
  page?: any;
  currentUser?: any;
  posts?: any[];
  photos?: any[];
  videos?: any[];
  events?: any[];
  reviews?: any[];
  similarPages?: any[];
  followersCount?: number;
  likesCount?: number;
  checkInsCount?: number;
  businessHours?: any;
  socialLinks?: any;
  className?: string;
  showSuggestions?: boolean;
  enableReviews?: boolean;
  enableVideos?: boolean;
  enableEvents?: boolean;
  loading?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onLike?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
  onPostCreate?: (post: any) => Promise<void> | void;
  onPostReaction?: (postId: string, emoji: string) => void;
  onPostComment?: (postId: string, comment: string) => void;
  onCommentLike?: (postId: string, commentId: string) => void;
  onCommentReply?: (postId: string, commentId: string, reply: string) => void;
  onReviewSubmit?: (review: any) => void;
  onPostSave?: (postId: string) => void;
  onPostDelete?: (postId: string) => void;
  onTabChange?: (tab: string) => void;
  onPageUpdate?: (pageData: any) => void;
}
