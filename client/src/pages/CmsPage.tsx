import { useRoute } from "wouter";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronRight, Send, AlertCircle, CheckCircle, FileText, Clock, ArrowUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { PublicLayout } from "@/components/PublicLayout";
import DOMPurify from "dompurify";
import NotFound from "@/pages/not-found";

interface CmsPageData {
  page: {
    id: number;
    title: string;
    slug: string;
    pageType: string;
    metaTitle: string | null;
    metaDescription: string | null;
    heroTitle: string | null;
    heroSubtitle: string | null;
    heroImageUrl: string | null;
  };
  sections: {
    id: number;
    sectionType: string;
    title: string | null;
    content: any;
    displayOrder: number;
    isVisible: boolean;
  }[];
}

function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await apiRequest("POST", "/api/public/cms-forms", {
        formType: "contact",
        ...formData,
      });
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: any) {
      setError(err.message || "Failed to submit form");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
        <CardContent className="py-8 text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
          <h3 className="text-xl font-semibold text-emerald-800 mb-2">Thank You!</h3>
          <p className="text-emerald-600">We've received your message and will get back to you soon.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Tara Singh"
            data-testid="input-contact-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="tara@gmail.com"
            data-testid="input-contact-email"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 9876543210"
            data-testid="input-contact-phone"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="How can we help?"
            data-testid="input-contact-subject"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          required
          rows={5}
          placeholder="Your message..."
          data-testid="input-contact-message"
        />
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
        data-testid="button-contact-submit"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
        <Send className="w-4 h-4 ml-2" />
      </Button>
    </form>
  );
}

function DynamicForm({ section, pageId }: { section: CmsPageData["sections"][0]; pageId: number }) {
  const { title, content } = section;
  const fields = content?.fields || [];
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validateField = (field: any, value: any): string => {
    if (field.required && (!value || (typeof value === "string" && !value.trim()))) {
      return `${field.label} is required`;
    }
    if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Please enter a valid email address";
    }
    if (field.type === "phone" && value && !/^[\d\s\-+()]+$/.test(value)) {
      return "Please enter a valid phone number";
    }
    if (field.validation?.minLength && value?.length < field.validation.minLength) {
      return `Minimum ${field.validation.minLength} characters required`;
    }
    if (field.validation?.maxLength && value?.length > field.validation.maxLength) {
      return `Maximum ${field.validation.maxLength} characters allowed`;
    }
    if (field.validation?.pattern && value && !new RegExp(field.validation.pattern).test(value)) {
      return field.validation.message || "Invalid format";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    fields.forEach((field: any) => {
      const error = validateField(field, formData[field.name]);
      if (error) newErrors[field.name] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await apiRequest("POST", "/api/public/cms-forms", {
        formType: content?.formName || "custom",
        pageId: pageId,
        name: formData.name || formData.full_name || "Anonymous",
        email: formData.email || "",
        phone: formData.phone || "",
        message: formData.message || "",
        formData: formData,
      });
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit form");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
        <CardContent className="py-8 text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
          <h3 className="text-xl font-semibold text-emerald-800 mb-2">
            {content?.successTitle || "Thank You!"}
          </h3>
          <p className="text-emerald-600">
            {content?.successMessage || "Your form has been submitted successfully."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderField = (field: any) => {
    const fieldError = errors[field.name];
    const commonProps = {
      id: field.name,
      name: field.name,
      placeholder: field.placeholder || "",
      required: field.required,
      className: `${fieldError ? "border-red-500 animate-shake" : ""}`,
      "data-testid": `form-field-${field.name}`,
    };

    switch (field.type) {
      case "text":
      case "email":
      case "phone":
      case "number":
      case "url":
        return (
          <Input
            {...commonProps}
            type={field.type === "phone" ? "tel" : field.type}
            value={formData[field.name] || ""}
            onChange={(e) => {
              setFormData({ ...formData, [field.name]: e.target.value });
              if (errors[field.name]) setErrors({ ...errors, [field.name]: "" });
            }}
          />
        );

      case "textarea":
        return (
          <Textarea
            {...commonProps}
            rows={field.rows || 4}
            value={formData[field.name] || ""}
            onChange={(e) => {
              setFormData({ ...formData, [field.name]: e.target.value });
              if (errors[field.name]) setErrors({ ...errors, [field.name]: "" });
            }}
          />
        );

      case "select":
        return (
          <select
            {...commonProps}
            value={formData[field.name] || ""}
            onChange={(e) => {
              setFormData({ ...formData, [field.name]: e.target.value });
              if (errors[field.name]) setErrors({ ...errors, [field.name]: "" });
            }}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${fieldError ? "border-red-500 animate-shake" : ""}`}
          >
            <option value="">{field.placeholder || "Select..."}</option>
            {field.options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={field.name}
              checked={formData[field.name] || false}
              onChange={(e) => {
                setFormData({ ...formData, [field.name]: e.target.checked });
                if (errors[field.name]) setErrors({ ...errors, [field.name]: "" });
              }}
              className={`h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 ${fieldError ? "border-red-500 animate-shake" : ""}`}
              data-testid={`form-field-${field.name}`}
            />
            <label htmlFor={field.name} className="text-sm text-gray-600">{field.checkboxLabel || field.label}</label>
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((opt: any) => (
              <div key={opt.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  id={`${field.name}-${opt.value}`}
                  name={field.name}
                  value={opt.value}
                  checked={formData[field.name] === opt.value}
                  onChange={(e) => {
                    setFormData({ ...formData, [field.name]: e.target.value });
                    if (errors[field.name]) setErrors({ ...errors, [field.name]: "" });
                  }}
                  className={`h-4 w-4 border-gray-300 text-violet-600 focus:ring-violet-500 ${fieldError ? "border-red-500 animate-shake" : ""}`}
                />
                <label htmlFor={`${field.name}-${opt.value}`} className="text-sm text-gray-600">{opt.label}</label>
              </div>
            ))}
          </div>
        );

      case "date":
        return (
          <Input
            {...commonProps}
            type="date"
            value={formData[field.name] || ""}
            onChange={(e) => {
              setFormData({ ...formData, [field.name]: e.target.value });
              if (errors[field.name]) setErrors({ ...errors, [field.name]: "" });
            }}
          />
        );

      case "file":
        return (
          <Input
            {...commonProps}
            type="file"
            accept={field.accept || "*"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              setFormData({ ...formData, [field.name]: file?.name || "" });
              if (errors[field.name]) setErrors({ ...errors, [field.name]: "" });
            }}
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            type="text"
            value={formData[field.name] || ""}
            onChange={(e) => {
              setFormData({ ...formData, [field.name]: e.target.value });
              if (errors[field.name]) setErrors({ ...errors, [field.name]: "" });
            }}
          />
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {title && <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>}
      {content?.description && <p className="text-gray-600 mb-6">{content.description}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {submitError}
          </div>
        )}

        {fields.map((field: any, idx: number) => (
          <div key={idx} className={`space-y-2 ${field.width === "half" ? "inline-block w-[48%] mr-[4%] align-top" : ""}`}>
            {field.type !== "checkbox" && (
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            {renderField(field)}
            {errors[field.name] && (
              <p className="text-sm text-red-500">{errors[field.name]}</p>
            )}
          </div>
        ))}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
          data-testid="button-form-submit"
        >
          {isSubmitting ? "Submitting..." : (content?.submitButtonText || "Submit")}
          <Send className="w-4 h-4 ml-2" />
        </Button>
      </form>
    </div>
  );
}

function RenderSection({ section, pageId }: { section: CmsPageData["sections"][0]; pageId: number }) {
  const { sectionType, title, content } = section;

  if (!section.isVisible) return null;

  switch (sectionType) {
    case "rich_text":
      const htmlContent = content?.html || "";
      const hasSideBySide = htmlContent.includes("flex") && htmlContent.includes("md:flex-row");
      return (
        <motion.div
          className="max-w-none"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {title && (
            <h2 className="text-xl font-black text-foreground mb-5 flex items-center gap-3">
              <span className="inline-block w-1 h-5 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500 shrink-0" />
              {title}
            </h2>
          )}
          <div
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
            className={hasSideBySide
              ? "text-gray-600 dark:text-gray-400 leading-relaxed [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:pl-1 [&_strong]:text-gray-800 dark:[&_strong]:text-white [&_img]:rounded-2xl [&_img]:shadow-lg"
              : [
                  "text-gray-600 dark:text-gray-400 leading-[1.85] text-[15px]",
                  "[&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-foreground [&_h1]:mt-8 [&_h1]:mb-3",
                  "[&_h2]:text-xl [&_h2]:font-black [&_h2]:text-foreground [&_h2]:mt-7 [&_h2]:mb-3 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-3",
                  "[&_h3]:text-base [&_h3]:font-bold [&_h3]:text-foreground [&_h3]:mt-5 [&_h3]:mb-2",
                  "[&_h4]:text-sm [&_h4]:font-bold [&_h4]:text-foreground [&_h4]:mt-4 [&_h4]:mb-1.5",
                  "[&_p]:mb-4 [&_p]:leading-[1.85]",
                  "[&_ul]:my-4 [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:list-disc",
                  "[&_ol]:my-4 [&_ol]:pl-5 [&_ol]:space-y-2 [&_ol]:list-decimal",
                  "[&_li]:pl-1 [&_li]:leading-relaxed",
                  "[&_strong]:text-gray-900 dark:[&_strong]:text-white [&_strong]:font-semibold",
                  "[&_a]:text-violet-600 dark:[&_a]:text-violet-400 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-violet-700",
                  "[&_blockquote]:border-l-4 [&_blockquote]:border-violet-300 [&_blockquote]:pl-5 [&_blockquote]:py-1 [&_blockquote]:my-5 [&_blockquote]:text-gray-500 [&_blockquote]:italic [&_blockquote]:bg-violet-50/50 [&_blockquote]:rounded-r-xl",
                  "[&_table]:w-full [&_table]:text-sm [&_table]:border-collapse [&_table]:my-5",
                  "[&_th]:text-left [&_th]:font-bold [&_th]:text-foreground [&_th]:px-4 [&_th]:py-2.5 [&_th]:bg-gray-50 dark:[&_th]:bg-white/5 [&_th]:border [&_th]:border-gray-100 dark:[&_th]:border-white/10",
                  "[&_td]:px-4 [&_td]:py-2.5 [&_td]:border [&_td]:border-gray-100 dark:[&_td]:border-white/10 [&_td]:text-gray-600 dark:[&_td]:text-gray-400",
                  "[&_hr]:my-8 [&_hr]:border-gray-100 dark:[&_hr]:border-white/10",
                  "[&_code]:bg-gray-100 dark:[&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_code]:font-mono [&_code]:text-violet-700 dark:[&_code]:text-violet-300",
                ].join(" ")
            }
          />
        </motion.div>
      );

    case "faq":
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {title && (
            <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent mb-6">
              {title}
            </h2>
          )}
          <Accordion type="single" collapsible className="space-y-3">
            {content?.items?.map((item: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <AccordionItem 
                  value={`faq-${idx}`}
                  className="bg-gradient-to-r from-violet-50/50 to-fuchsia-50/50 border border-violet-100 rounded-xl px-5 shadow-sm"
                >
                  <AccordionTrigger className="text-left font-semibold text-gray-800 py-4">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      );

    case "card_grid":
      return (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {title && (
            <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent mb-6">
              {title}
            </h2>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {content?.cards?.map((card: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Card className="h-full bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 border-violet-100/50 shadow-lg shadow-violet-100/30 hover:shadow-xl hover:shadow-violet-200/40 transition-all duration-300 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader className="relative pb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-3 shadow-lg shadow-violet-300/50">
                      <span className="text-white text-xl font-bold">{card.title?.[0]}</span>
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-800">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-gray-600 text-sm leading-relaxed">{card.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      );

    case "contact_form":
      return (
        <motion.div 
          className="max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {title && (
            <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent mb-6 text-center">
              {title}
            </h2>
          )}
          <Card className="bg-gradient-to-br from-white via-violet-50/30 to-fuchsia-50/30 border-violet-100/50 shadow-xl shadow-violet-100/30 p-6">
            <ContactForm />
          </Card>
        </motion.div>
      );

    case "heading":
      const headingLevel = content?.level || 2;
      const HeadingTag = `h${headingLevel}` as keyof JSX.IntrinsicElements;
      const headingSizes: Record<number, string> = {
        1: "text-4xl",
        2: "text-3xl",
        3: "text-2xl",
        4: "text-xl",
        5: "text-lg",
        6: "text-base",
      };
      return (
        <HeadingTag 
          className={`font-bold text-gray-800 ${headingSizes[headingLevel] || "text-2xl"} ${content?.align === "center" ? "text-center" : content?.align === "right" ? "text-right" : ""}`}
        >
          {content?.text || title}
        </HeadingTag>
      );

    case "button":
      const buttonVariant = content?.variant === "outline" ? "outline" : content?.variant === "ghost" ? "ghost" : "default";
      return (
        <div className={`${content?.align === "center" ? "text-center" : content?.align === "right" ? "text-right" : ""}`}>
          <Button
            asChild
            variant={buttonVariant}
            className={buttonVariant === "default" ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 border-violet-600" : ""}
            data-testid={`button-cta-${section.id}`}
          >
            <a
              href={content?.url || "#"}
              target={content?.openInNewTab ? "_blank" : "_self"}
              rel={content?.openInNewTab ? "noopener noreferrer" : undefined}
            >
              {content?.text || "Click Here"}
            </a>
          </Button>
        </div>
      );

    case "columns":
      const columnsData = content?.columns || [];
      const layout = content?.layout || "2";
      const colCount = layout === "1" ? 1 : layout === "3" ? 3 : layout === "4" ? 4 : 2;
      const gridClass = layout === "1" ? "md:grid-cols-1" :
                        layout === "2" ? "md:grid-cols-2" :
                        layout === "2-left" ? "md:grid-cols-[2fr_1fr]" :
                        layout === "2-right" ? "md:grid-cols-[1fr_2fr]" :
                        layout === "3" ? "md:grid-cols-3" :
                        layout === "4" ? "md:grid-cols-4" : "md:grid-cols-2";
      
      return (
        <div className="w-full">
          {title && (
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
          )}
          <div 
            className={`grid grid-cols-1 ${gridClass}`}
            style={{ gap: `${content?.gap || 24}px` }}
          >
            {Array.from({ length: colCount }).map((_, index) => {
              const column = columnsData[index] || {};
              return (
                <div key={index}>
                  <div 
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(column.content || "") }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      );

    case "divider":
      return (
        <div 
          className={`${content?.type === "spacer" ? "" : "border-t border-gray-200"}`}
          style={{ 
            marginTop: `${content?.marginTop || 20}px`, 
            marginBottom: `${content?.marginBottom || 20}px`,
            height: content?.type === "spacer" ? `${content?.height || 40}px` : undefined
          }}
        />
      );

    case "image":
      const imageUrl = content?.url || content?.src || "";
      return (
        <motion.figure 
          className={`${content?.align === "center" ? "text-center mx-auto" : content?.align === "right" ? "text-right ml-auto" : ""}`}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: content?.maxWidth || "100%" }}
        >
          <div className="relative rounded-2xl shadow-xl shadow-violet-100/50 overflow-hidden">
            <img 
              src={imageUrl} 
              alt={content?.alt || title || "Image"} 
              className={`${content?.fullWidth ? "w-full" : "max-w-full"} h-auto object-cover`}
            />
          </div>
          {content?.caption && (
            <figcaption className="text-sm text-gray-500 mt-4 italic">{content.caption}</figcaption>
          )}
        </motion.figure>
      );

    case "embed":
      if (content?.type === "youtube") {
        const videoId = content?.url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
        return (
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={content?.title || "YouTube Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        );
      }
      if (content?.type === "map") {
        return (
          <div className="rounded-lg overflow-hidden" style={{ height: content?.height || 400 }}>
            <iframe
              src={content?.url}
              title={content?.title || "Map"}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        );
      }
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content?.html || "", { ADD_TAGS: ["iframe"], ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"] }) }} 
          className="rounded-lg overflow-hidden"
        />
      );

    case "custom_html":
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content?.html || "") }} 
          className="prose prose-lg max-w-none"
        />
      );

    case "form_builder":
      return <DynamicForm section={section} pageId={pageId} />;

    default:
      return null;
  }
}

export default function CmsPage() {
  const [, params] = useRoute("/:slug");
  const slug = params?.slug || "";

  const { data, isLoading, error } = useQuery<CmsPageData>({
    queryKey: ["/api/public/pages", slug],
    enabled: !!slug,
  });

  useEffect(() => {
    const setOrCreateMeta = (selector: string, attr: string, attrValue: string, content: string) => {
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, attrValue);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    if (data?.page) {
      const { page } = data;
      const pageTitle = page.metaTitle || `${page.title} - Samikaran Olympiad`;
      const pageDescription = page.metaDescription || `${page.title} - Learn more about Samikaran Olympiad`;
      const pageUrl = `${window.location.origin}/${page.slug}`;
      const defaultImage = `${window.location.origin}/og-image.png`;
      
      document.title = pageTitle;

      setOrCreateMeta('meta[name="description"]', 'name', 'description', pageDescription);
      
      setOrCreateMeta('meta[property="og:title"]', 'property', 'og:title', pageTitle);
      setOrCreateMeta('meta[property="og:description"]', 'property', 'og:description', pageDescription);
      setOrCreateMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
      setOrCreateMeta('meta[property="og:url"]', 'property', 'og:url', pageUrl);
      setOrCreateMeta('meta[property="og:image"]', 'property', 'og:image', defaultImage);
      setOrCreateMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'Samikaran Olympiad');
      
      setOrCreateMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
      setOrCreateMeta('meta[name="twitter:title"]', 'name', 'twitter:title', pageTitle);
      setOrCreateMeta('meta[name="twitter:description"]', 'name', 'twitter:description', pageDescription);
      setOrCreateMeta('meta[name="twitter:image"]', 'name', 'twitter:image', defaultImage);
    }

    return () => {
      document.title = 'Samikaran Olympiad';
    };
  }, [data]);

  if (isLoading) {
    return (
      <PublicLayout showNotificationBar={false}>
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !data) {
    return <NotFound />;
  }

  const { page, sections } = data;

  return (
    <PublicLayout showNotificationBar={false}>
      <Helmet>
        <title>{page.metaTitle || `${page.title} | Samikaran Olympiad`}</title>
        <meta name="description" content={page.metaDescription || `${page.title} — Learn more about Samikaran Olympiad`} />
        <meta property="og:title" content={page.metaTitle || `${page.title} | Samikaran Olympiad`} />
        <meta property="og:description" content={page.metaDescription || `${page.title} — Learn more about Samikaran Olympiad`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://www.samikaranolympiad.com/${page.slug}`} />
        <meta property="og:image" content="https://www.samikaranolympiad.com/og-image.png" />
        <link rel="canonical" href={`https://www.samikaranolympiad.com/${page.slug}`} />
        <meta property="og:site_name" content="Samikaran Olympiad" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.metaTitle || `${page.title} | Samikaran Olympiad`} />
        <meta name="twitter:description" content={page.metaDescription || `${page.title} — Learn more about Samikaran Olympiad`} />
        <meta name="twitter:image" content="https://www.samikaranolympiad.com/og-image.png" />
      </Helmet>
      {/* ══ HERO ══ */}
      <section className="relative pt-14 pb-12 overflow-hidden bg-gradient-to-br from-[#0d0720] via-[#130d2a] to-[#0d0720]">
        {/* Ambient glows */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-violet-600/12 rounded-full blur-[140px] -translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-fuchsia-600/8 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        {/* Hero image overlay */}
        {page.heroImageUrl && (
          <>
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${page.heroImageUrl})` }} />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0d0720]/95 via-[#130d2a]/90 to-[#0d0720]/95" />
          </>
        )}

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-white/40 mb-5"
          >
            <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60">{page.title}</span>
          </motion.nav>

          {/* Icon badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-5"
          >
            <FileText className="w-5 h-5 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 leading-tight tracking-tight"
          >
            {page.heroTitle || page.title}
          </motion.h1>

          {page.heroSubtitle && (
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base text-gray-400 max-w-xl mx-auto leading-relaxed"
            >
              {page.heroSubtitle}
            </motion.p>
          )}

          {/* Meta row */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-4 mt-5"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/35">
              <Clock className="w-3 h-3" /> Last updated: May 2026
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[11px] font-medium text-white/35">Samikaran Olympiad</span>
          </motion.div>
        </div>
      </section>

      {/* ══ CONTENT ══ */}
      <div className="bg-gray-50 dark:bg-background py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-white dark:bg-card rounded-3xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden"
          >
            <div className="px-6 sm:px-10 lg:px-14 py-10 sm:py-12 space-y-10">
              {sections.map((section) => (
                <RenderSection key={section.id} section={section} pageId={data.page.id} />
              ))}
            </div>

            {/* Footer strip */}
            <div className="border-t border-gray-100 dark:border-white/8 px-6 sm:px-10 lg:px-14 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/60 dark:bg-white/2">
              <p className="text-[11px] text-muted-foreground">
                For questions about this policy, contact us at <a href="mailto:support@samikaranolympiad.com" className="text-violet-600 dark:text-violet-400 hover:underline font-medium">support@samikaranolympiad.com</a>
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors shrink-0"
              >
                <ArrowUp className="w-3 h-3" /> Back to top
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
}
