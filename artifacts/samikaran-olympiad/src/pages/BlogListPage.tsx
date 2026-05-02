import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { buildBreadcrumbSchema, BASE_URL } from "@/utils/seo";
import { motion } from "framer-motion";
import { Calendar, Clock, Eye, Tag, ChevronRight, Search, Filter, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicLayout } from "@/components/PublicLayout";
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
  category?: BlogCategory;
  tags?: BlogTag[];
}

export default function BlogListPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const { data: posts = [], isLoading: loadingPosts } = useQuery<BlogPost[]>({
    queryKey: ["/api/public/blog/posts"],
  });

  const { data: categories = [] } = useQuery<BlogCategory[]>({
    queryKey: ["/api/public/blog/categories"],
  });

  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || 
      post.category?.slug === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1);

  return (
    <PublicLayout showNotificationBar={false}>
      <Helmet>
        <title>Blog | Samikaran Olympiad — Tips, News & Olympiad Insights</title>
        <meta name="description" content="Read the latest articles, insights, and updates about Olympiad examinations, study tips, and educational resources from Samikaran Olympiad." />
        <link rel="canonical" href="https://www.samikaranolympiad.com/blog" />
        <meta property="og:title" content="Blog | Samikaran Olympiad — Tips, News & Olympiad Insights" />
        <meta property="og:description" content="Insights, tips, and updates from the world of Olympiad examinations." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.samikaranolympiad.com/blog" />
        <meta property="og:image" content="https://www.samikaranolympiad.com/logo.png" />
        <meta property="og:site_name" content="Samikaran Olympiad" />
        <meta name="keywords" content="olympiad blog, study tips, olympiad preparation, samikaran news, student resources" />
        <meta name="robots" content="index, follow" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@SamikaranOlympiad" />
        <meta name="twitter:title" content="Blog | Samikaran Olympiad — Tips, News & Olympiad Insights" />
        <meta name="twitter:description" content="Insights, tips, and updates from the world of Olympiad examinations." />
        <meta name="twitter:image" content="https://www.samikaranolympiad.com/og-image.png" />
        <link rel="alternate" type="application/rss+xml" title="Samikaran Olympiad Blog RSS" href="https://www.samikaranolympiad.com/blog/rss.xml" />
        <script type="application/ld+json">{JSON.stringify(buildBreadcrumbSchema([
          { name: "Home", url: BASE_URL },
          { name: "Blog", url: `${BASE_URL}/blog` }
        ]))}</script>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30">
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
          <div className="container mx-auto px-4 py-16 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Blog</h1>
              <p className="text-lg md:text-xl text-white/80">
                Insights, tips, and updates from the world of Olympiad examinations
              </p>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
              data-testid="input-search-blog"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px] bg-white" data-testid="select-category-filter">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.filter(cat => cat.slug).map((cat) => (
                <SelectItem key={cat.id} value={cat.slug || `cat-${cat.id}`}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loadingPosts ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No articles found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            {featuredPost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
              >
                <Link href={`/blog/${featuredPost.slug}`}>
                  <Card className="overflow-hidden hover-elevate cursor-pointer group" data-testid={`card-featured-post-${featuredPost.id}`}>
                    <div className="grid md:grid-cols-2">
                      <div className="aspect-video md:aspect-auto md:h-full overflow-hidden bg-muted">
                        {featuredPost.featuredImage ? (
                          <img
                            src={featuredPost.featuredImage}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center">
                            <span className="text-white/50 text-6xl font-bold">S</span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="default" className="bg-violet-600">Featured</Badge>
                          {featuredPost.category && (
                            <Badge variant="outline">{featuredPost.category.name}</Badge>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold mb-3 group-hover:text-violet-600 transition-colors">
                          {featuredPost.title}
                        </h2>
                        {featuredPost.excerpt && (
                          <p className="text-muted-foreground mb-4 line-clamp-2">
                            {featuredPost.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {featuredPost.publishedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(featuredPost.publishedAt), "MMM d, yyyy")}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {featuredPost.viewCount || 0} views
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-violet-600 font-medium mt-4 group-hover:gap-3 transition-all">
                          Read more <ArrowRight className="w-4 h-4" />
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regularPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/blog/${post.slug}`}>
                    <Card 
                      className="overflow-hidden h-full hover-elevate cursor-pointer group"
                      data-testid={`card-post-${post.id}`}
                    >
                      <div className="aspect-video overflow-hidden bg-muted">
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-violet-300 to-fuchsia-300 flex items-center justify-center">
                            <span className="text-white/50 text-4xl font-bold">S</span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {post.category && (
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={post.category.color ? { borderColor: post.category.color, color: post.category.color } : undefined}
                            >
                              {post.category.name}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {post.publishedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(post.publishedAt), "MMM d, yyyy")}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.viewCount || 0}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
        </div>
      </div>
    </PublicLayout>
  );
}
