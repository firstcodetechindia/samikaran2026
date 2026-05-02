import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Edit, Eye, Search, FileText, Tag, FolderOpen, Sparkles,
  Calendar, Image, ChevronRight, ChevronDown, MoreVertical, ExternalLink,
  Send, Archive, Save, X, Loader2, Globe, Lock, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { format } from "date-fns";

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
  displayOrder: number;
  isActive: boolean;
  color?: string;
  createdAt: string;
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
  authorId?: string;
  status: string;
  visibility: string;
  publishedAt?: string;
  viewCount: number;
  isAiGenerated?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
  category?: BlogCategory;
  tags?: BlogTag[];
}

interface BlogAdminTabProps {
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

export function BlogAdminTab({ toast }: BlogAdminTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"posts" | "categories" | "tags">("posts");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null);
  const [showAiGenerator, setShowAiGenerator] = useState(false);

  const { data: posts = [], isLoading: loadingPosts } = useQuery<BlogPost[]>({
    queryKey: ["/api/sysctrl/blog/posts"],
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery<BlogCategory[]>({
    queryKey: ["/api/sysctrl/blog/categories"],
  });

  const { data: tags = [], isLoading: loadingTags } = useQuery<BlogTag[]>({
    queryKey: ["/api/sysctrl/blog/tags"],
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/sysctrl/blog/posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/blog/posts"] });
      toast({ title: "Post deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete post", variant: "destructive" });
    },
  });

  const publishPostMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/sysctrl/blog/posts/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/blog/posts"] });
      toast({ title: "Post published successfully" });
    },
  });

  const unpublishPostMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/sysctrl/blog/posts/${id}/unpublish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/blog/posts"] });
      toast({ title: "Post unpublished" });
    },
  });

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; color: string }> = {
      published: { variant: "default", color: "bg-emerald-500" },
      draft: { variant: "secondary", color: "" },
      scheduled: { variant: "outline", color: "" },
      archived: { variant: "secondary", color: "bg-gray-400" },
    };
    const config = variants[status] || variants.draft;
    return (
      <Badge variant={config.variant} className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Blog Management
          </h2>
          <p className="text-muted-foreground">Create and manage blog posts, categories, and tags</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAiGenerator(true)}
            data-testid="button-ai-generate"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Generate
          </Button>
          <Button 
            onClick={() => { setEditingPost(null); setShowPostEditor(true); }}
            data-testid="button-new-post"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as typeof activeSubTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="posts" data-testid="tab-posts">
            <FileText className="w-4 h-4 mr-2" />
            Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">
            <FolderOpen className="w-4 h-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="tags" data-testid="tab-tags">
            <Tag className="w-4 h-4 mr-2" />
            Tags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-posts"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPosts ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredPosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No posts found. Create your first post!
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPosts.map((post) => (
                      <TableRow key={post.id} data-testid={`row-post-${post.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {post.featuredImage ? (
                              <img 
                                src={post.featuredImage} 
                                alt="" 
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium line-clamp-1">{post.title}</p>
                              {post.isAiGenerated && (
                                <Badge variant="outline" className="text-xs">
                                  <Sparkles className="w-3 h-3 mr-1" /> AI
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {post.category ? (
                            <Badge variant="outline">{post.category.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(post.status)}</TableCell>
                        <TableCell>{post.viewCount || 0}</TableCell>
                        <TableCell>
                          {post.publishedAt 
                            ? format(new Date(post.publishedAt), "MMM d, yyyy")
                            : format(new Date(post.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-post-actions-${post.id}`}>
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingPost(post); setShowPostEditor(true); }}>
                                <Edit className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`/blog/${post.slug}`, '_blank')}>
                                <ExternalLink className="w-4 h-4 mr-2" /> Preview
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {post.status === "draft" ? (
                                <DropdownMenuItem onClick={() => publishPostMutation.mutate(post.id)}>
                                  <Send className="w-4 h-4 mr-2" /> Publish
                                </DropdownMenuItem>
                              ) : post.status === "published" ? (
                                <DropdownMenuItem onClick={() => unpublishPostMutation.mutate(post.id)}>
                                  <Archive className="w-4 h-4 mr-2" /> Unpublish
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this post?")) {
                                    deletePostMutation.mutate(post.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingCategory(null); setShowCategoryDialog(true); }} data-testid="button-new-category">
              <Plus className="w-4 h-4 mr-2" />
              New Category
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingCategories ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No categories yet. Create your first category!
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((cat) => (
                      <TableRow key={cat.id} data-testid={`row-category-${cat.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {cat.color && (
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: cat.color }}
                              />
                            )}
                            <span className="font-medium">{cat.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                        <TableCell>{posts.filter(p => p.categoryId === cat.id).length}</TableCell>
                        <TableCell>
                          <Badge variant={cat.isActive ? "default" : "secondary"}>
                            {cat.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => { setEditingCategory(cat); setShowCategoryDialog(true); }}
                            data-testid={`button-edit-category-${cat.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingTag(null); setShowTagDialog(true); }} data-testid="button-new-tag">
              <Plus className="w-4 h-4 mr-2" />
              New Tag
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              {loadingTags ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : tags.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No tags yet. Create your first tag!
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge 
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover-elevate text-sm py-1 px-3"
                      style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                      onClick={() => { setEditingTag(tag); setShowTagDialog(true); }}
                      data-testid={`tag-${tag.id}`}
                    >
                      {tag.name}
                      <span className="ml-2 text-muted-foreground">
                        ({posts.filter(p => p.tags?.some(t => t.id === tag.id)).length})
                      </span>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PostEditorDialog 
        open={showPostEditor}
        onOpenChange={setShowPostEditor}
        post={editingPost}
        categories={categories}
        tags={tags}
        toast={toast}
      />

      <CategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        category={editingCategory}
        categories={categories}
        toast={toast}
      />

      <TagDialog
        open={showTagDialog}
        onOpenChange={setShowTagDialog}
        tag={editingTag}
        toast={toast}
      />

      <AIGeneratorDialog
        open={showAiGenerator}
        onOpenChange={setShowAiGenerator}
        onGenerated={(content) => {
          setEditingPost({
            id: 0,
            title: content.title || "",
            slug: "",
            content: content.content || "",
            excerpt: content.excerpt || "",
            status: "draft",
            visibility: "public",
            viewCount: 0,
            isAiGenerated: true,
            metaDescription: content.metaDescription || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setShowAiGenerator(false);
          setShowPostEditor(true);
        }}
        toast={toast}
      />
    </motion.div>
  );
}

function PostEditorDialog({ 
  open, 
  onOpenChange, 
  post, 
  categories,
  tags,
  toast 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: BlogPost | null;
  categories: BlogCategory[];
  tags: BlogTag[];
  toast: BlogAdminTabProps["toast"];
}) {
  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [content, setContent] = useState(post?.content || "");
  const [categoryId, setCategoryId] = useState<string>(post?.categoryId?.toString() || "none");
  const [selectedTags, setSelectedTags] = useState<number[]>(post?.tags?.map(t => t.id) || []);
  const [featuredImage, setFeaturedImage] = useState(post?.featuredImage || "");
  const [visibility, setVisibility] = useState(post?.visibility || "public");
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription || "");

  const isEditing = post && post.id > 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        excerpt,
        content,
        categoryId: categoryId && categoryId !== "none" ? parseInt(categoryId) : null,
        featuredImage: featuredImage || null,
        visibility,
        metaTitle: metaTitle || title,
        metaDescription,
        tags: selectedTags,
        isAiGenerated: post?.isAiGenerated || false,
      };
      
      if (isEditing) {
        return apiRequest("PATCH", `/api/sysctrl/blog/posts/${post.id}`, data);
      } else {
        return apiRequest("POST", "/api/sysctrl/blog/posts", { ...data, status: "draft" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/blog/posts"] });
      toast({ title: isEditing ? "Post updated" : "Post created" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to save post", variant: "destructive" });
    },
  });

  // Reset form when post changes
  useEffect(() => {
    if (post) {
      setTitle(post.title || "");
      setSlug(post.slug || "");
      setExcerpt(post.excerpt || "");
      setContent(post.content || "");
      setCategoryId(post.categoryId?.toString() || "none");
      setSelectedTags(post.tags?.map(t => t.id) || []);
      setFeaturedImage(post.featuredImage || "");
      setVisibility(post.visibility || "public");
      setMetaTitle(post.metaTitle || "");
      setMetaDescription(post.metaDescription || "");
    } else {
      setTitle("");
      setSlug("");
      setExcerpt("");
      setContent("");
      setCategoryId("none");
      setSelectedTags([]);
      setFeaturedImage("");
      setVisibility("public");
      setMetaTitle("");
      setMetaDescription("");
    }
  }, [post]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{isEditing ? "Edit Post" : "New Post"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your blog post" : "Create a new blog post"}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 max-h-[calc(90vh-180px)] pr-4">
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!isEditing && !slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                    }
                  }}
                  placeholder="Enter post title"
                  data-testid="input-post-title"
                />
              </div>
              
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="post-url-slug"
                  data-testid="input-post-slug"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger data-testid="select-post-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.filter(c => c.isActive).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary of the post..."
                  rows={2}
                  data-testid="input-post-excerpt"
                />
              </div>
              
              <div className="col-span-2">
                <Label>Content</Label>
                <div className="mt-1 border rounded-md">
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                    placeholder="Write your blog post content here..."
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="featuredImage">Featured Image URL</Label>
                <Input
                  id="featuredImage"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="https://..."
                  data-testid="input-featured-image"
                />
              </div>
              
              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger data-testid="select-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" /> Public
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Private
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedTags(prev => 
                          prev.includes(tag.id) 
                            ? prev.filter(id => id !== tag.id)
                            : [...prev, tag.id]
                        );
                      }}
                      data-testid={`toggle-tag-${tag.id}`}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="col-span-2 border-t pt-4">
                <h4 className="font-medium mb-3">SEO Settings</h4>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="SEO title (defaults to post title)"
                      data-testid="input-meta-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="SEO description (150-160 characters)"
                      rows={2}
                      data-testid="input-meta-description"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {metaDescription.length}/160 characters
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !title}
            data-testid="button-save-post"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? "Update" : "Save Draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryDialog({
  open,
  onOpenChange,
  category,
  categories,
  toast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: BlogCategory | null;
  categories: BlogCategory[];
  toast: BlogAdminTabProps["toast"];
}) {
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [description, setDescription] = useState(category?.description || "");
  const [parentId, setParentId] = useState<string>(category?.parentId?.toString() || "none");
  const [color, setColor] = useState(category?.color || "#8B5CF6");
  const [isActive, setIsActive] = useState(category?.isActive ?? true);

  const isEditing = !!category;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        description: description || null,
        parentId: parentId && parentId !== "none" ? parseInt(parentId) : null,
        color,
        isActive,
      };
      
      if (isEditing) {
        return apiRequest("PATCH", `/api/sysctrl/blog/categories/${category.id}`, data);
      } else {
        return apiRequest("POST", "/api/sysctrl/blog/categories", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/blog/categories"] });
      toast({ title: isEditing ? "Category updated" : "Category created" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to save category", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/sysctrl/blog/categories/${category?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/blog/categories"] });
      toast({ title: "Category deleted" });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Category" : "New Category"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="catName">Name</Label>
            <Input
              id="catName"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!isEditing) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                }
              }}
              placeholder="Category name"
              data-testid="input-category-name"
            />
          </div>
          
          <div>
            <Label htmlFor="catSlug">Slug</Label>
            <Input
              id="catSlug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="category-slug"
              data-testid="input-category-slug"
            />
          </div>
          
          <div>
            <Label htmlFor="catDesc">Description</Label>
            <Textarea
              id="catDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              data-testid="input-category-description"
            />
          </div>
          
          <div>
            <Label>Parent Category</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger data-testid="select-parent-category">
                <SelectValue placeholder="None (top level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (top level)</SelectItem>
                {categories.filter(c => c.id !== category?.id).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="catColor">Color</Label>
            <div className="flex gap-2">
              <Input
                id="catColor"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-9 p-1"
                data-testid="input-category-color"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#8B5CF6"
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="catActive">Active</Label>
            <Switch
              id="catActive"
              checked={isActive}
              onCheckedChange={setIsActive}
              data-testid="switch-category-active"
            />
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          {isEditing && (
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Are you sure you want to delete this category?")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-category"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !name}
            data-testid="button-save-category"
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isEditing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TagDialog({
  open,
  onOpenChange,
  tag,
  toast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: BlogTag | null;
  toast: BlogAdminTabProps["toast"];
}) {
  const [name, setName] = useState(tag?.name || "");
  const [slug, setSlug] = useState(tag?.slug || "");
  const [color, setColor] = useState(tag?.color || "#8B5CF6");

  const isEditing = !!tag;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        color,
      };
      
      if (isEditing) {
        return apiRequest("PATCH", `/api/sysctrl/blog/tags/${tag.id}`, data);
      } else {
        return apiRequest("POST", "/api/sysctrl/blog/tags", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/blog/tags"] });
      toast({ title: isEditing ? "Tag updated" : "Tag created" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to save tag", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/sysctrl/blog/tags/${tag?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/blog/tags"] });
      toast({ title: "Tag deleted" });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Tag" : "New Tag"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="tagName">Name</Label>
            <Input
              id="tagName"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!isEditing) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                }
              }}
              placeholder="Tag name"
              data-testid="input-tag-name"
            />
          </div>
          
          <div>
            <Label htmlFor="tagSlug">Slug</Label>
            <Input
              id="tagSlug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="tag-slug"
              data-testid="input-tag-slug"
            />
          </div>
          
          <div>
            <Label htmlFor="tagColor">Color</Label>
            <div className="flex gap-2">
              <Input
                id="tagColor"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-9 p-1"
                data-testid="input-tag-color"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#8B5CF6"
                className="flex-1"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          {isEditing && (
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Are you sure you want to delete this tag?")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-tag"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !name}
            data-testid="button-save-tag"
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isEditing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AIGeneratorDialog({
  open,
  onOpenChange,
  onGenerated,
  toast,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (content: { title?: string; excerpt?: string; content?: string; metaDescription?: string }) => void;
  toast: BlogAdminTabProps["toast"];
}) {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sysctrl/blog/generate", {
        topic,
        keywords,
        tone,
        length,
      });
      return res.json();
    },
    onSuccess: (data) => {
      onGenerated(data);
      toast({ title: "Content generated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to generate content", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            AI Content Generator
          </DialogTitle>
          <DialogDescription>
            Generate a blog post using AI. Provide a topic and optional preferences.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What should the blog post be about?"
              data-testid="input-ai-topic"
            />
          </div>
          
          <div>
            <Label htmlFor="keywords">Keywords (optional)</Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="olympiad, education, learning..."
              data-testid="input-ai-keywords"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger data-testid="select-ai-tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="inspirational">Inspirational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger data-testid="select-ai-length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (300-500 words)</SelectItem>
                  <SelectItem value="medium">Medium (600-800 words)</SelectItem>
                  <SelectItem value="long">Long (1000-1500 words)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || !topic}
            data-testid="button-generate-ai-content"
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
