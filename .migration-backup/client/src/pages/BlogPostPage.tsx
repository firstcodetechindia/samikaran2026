import { Link, useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { buildArticleSchema, buildBreadcrumbSchema, BASE_URL } from "@/utils/seo";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import { 
  Calendar, Eye, ArrowLeft, Tag, Share2, 
  Facebook, Twitter, Linkedin, Link2, Clock
} from "lucide-react";
import { SiFacebook, SiX, SiLinkedin } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { PublicLayout } from "@/components/PublicLayout";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  color?: string;
}

interface BlogTag {
  id: number;
  name: string;
  slug: string;
  color?: string;
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  categoryId?: number;
  status: string;
  publishedAt?: string;
  viewCount: number;
  metaTitle?: string;
  metaDescription?: string;
  category?: BlogCategory;
  tags?: BlogTag[];
}

export default function BlogPostPage() {
  const [, params] = useRoute("/blog/:slug");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const slug = params?.slug;

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: ["/api/public/blog/posts", slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/blog/posts/${slug}`);
      if (!res.ok) throw new Error("Post not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: relatedPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ["/api/public/blog/posts", "related", post?.categoryId],
    queryFn: async () => {
      const res = await fetch("/api/public/blog/posts?limit=4");
      return res.json();
    },
    enabled: !!post,
  });

  const postTitle = post ? (post.metaTitle || post.title) : "Loading...";
  const postDescription = post ? (post.metaDescription || post.excerpt || "") : "";
  const postImage = post?.featuredImage || "/logo.png";

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || "";
    
    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        toast({ title: "Link copied to clipboard!" });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  const filteredRelated = relatedPosts
    .filter(p => p.id !== post?.id)
    .slice(0, 3);

  const estimateReadTime = (content: string | null | undefined) => {
    if (!content || typeof content !== 'string') return 1;
    const wordsPerMinute = 200;
    const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  if (isLoading) {
    return (
      <PublicLayout showNotificationBar={false}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-6 w-48 mb-8" />
          <Skeleton className="aspect-video w-full mb-8" />
          <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !post) {
    return (
      <PublicLayout showNotificationBar={false}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The article you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => setLocation("/blog")} data-testid="button-back-to-blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout showNotificationBar={false}>
      <Helmet>
        <title>{`${postTitle} | Samikaran Olympiad`}</title>
        <meta name="description" content={postDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${BASE_URL}/blog/${post?.slug || ''}`} />
        <meta property="og:title" content={postTitle} />
        <meta property="og:description" content={postDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${BASE_URL}/blog/${post?.slug || ''}`} />
        <meta property="og:image" content={postImage.startsWith('http') ? postImage : `${BASE_URL}${postImage}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Samikaran Olympiad" />
        <meta property="og:locale" content="en_IN" />
        <meta property="article:published_time" content={post?.publishedAt ? new Date(post.publishedAt).toISOString() : ''} />
        <meta property="article:modified_time" content={post?.updatedAt ? new Date(post.updatedAt).toISOString() : ''} />
        <meta property="article:author" content="Samikaran Olympiad" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@SamikaranOlympiad" />
        <meta name="twitter:title" content={postTitle} />
        <meta name="twitter:description" content={postDescription} />
        <meta name="twitter:image" content={postImage.startsWith('http') ? postImage : `${BASE_URL}${postImage}`} />
        {post && <script type="application/ld+json">{JSON.stringify(buildArticleSchema({
          title: postTitle,
          description: postDescription,
          url: `${BASE_URL}/blog/${post.slug}`,
          image: postImage.startsWith('http') ? postImage : `${BASE_URL}${postImage}`,
          datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString(),
          dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString(),
        }))}</script>}
        <script type="application/ld+json">{JSON.stringify(buildBreadcrumbSchema([
          { name: "Home", url: BASE_URL },
          { name: "Blog", url: `${BASE_URL}/blog` },
          { name: postTitle, url: `${BASE_URL}/blog/${post?.slug || ''}` }
        ]))}</script>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30">
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/blog">
            <Button variant="ghost" className="mb-6" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {post.category && (
                <Badge 
                  variant="outline"
                  style={post.category.color ? { borderColor: post.category.color, color: post.category.color } : undefined}
                  data-testid="badge-category"
                >
                  {post.category.name}
                </Badge>
              )}
              {post.tags?.map((tag) => (
                <Badge 
                  key={tag.id} 
                  variant="secondary" 
                  className="text-xs"
                  data-testid={`badge-tag-${tag.id}`}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag.name}
                </Badge>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4" data-testid="text-post-title">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              {post.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(post.publishedAt), "MMMM d, yyyy")}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {estimateReadTime(post.content)} min read
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.viewCount || 0} views
              </span>
            </div>
          </header>

          {post.featuredImage && (
            <div className="aspect-video overflow-hidden rounded-xl mb-8 shadow-lg">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-full object-cover"
                data-testid="img-featured"
              />
            </div>
          )}

          <div 
            className="prose prose-lg max-w-none mb-8 prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-violet-600 prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
            data-testid="content-body"
          />

          <Separator className="my-8" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Share this article:</span>
              <div className="flex gap-1">
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={() => handleShare("facebook")}
                  data-testid="button-share-facebook"
                >
                  <SiFacebook className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={() => handleShare("twitter")}
                  data-testid="button-share-twitter"
                >
                  <SiX className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={() => handleShare("linkedin")}
                  data-testid="button-share-linkedin"
                >
                  <SiLinkedin className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={() => handleShare("copy")}
                  data-testid="button-share-copy"
                >
                  <Link2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {post.tags?.map((tag) => (
                <Badge 
                  key={tag.id} 
                  variant="outline"
                  style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </motion.div>

        {filteredRelated.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {filteredRelated.map((relPost) => (
                <Link key={relPost.id} href={`/blog/${relPost.slug}`}>
                  <Card 
                    className="overflow-hidden h-full hover-elevate cursor-pointer group"
                    data-testid={`card-related-${relPost.id}`}
                  >
                    <div className="aspect-video overflow-hidden bg-muted">
                      {relPost.featuredImage ? (
                        <img
                          src={relPost.featuredImage}
                          alt={relPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-300 to-fuchsia-300 flex items-center justify-center">
                          <span className="text-white/50 text-3xl font-bold">S</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 group-hover:text-violet-600 transition-colors">
                        {relPost.title}
                      </h3>
                      {relPost.publishedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(relPost.publishedAt), "MMM d, yyyy")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
        </article>
      </div>
    </PublicLayout>
  );
}
