import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import {
  GripVertical, Plus, Trash2, Edit, Eye, EyeOff, Settings, X,
  Type, Image, HelpCircle, Grid3X3, Mail, Heading, MousePointer,
  Minus, Code, Video, FormInput, ChevronDown, ChevronUp, Save,
  AlignLeft, AlignCenter, AlignRight, Columns, LayoutGrid, Monitor, Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/ui/lazy-rich-text-editor";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DOMPurify from "dompurify";

interface CmsSection {
  id: number;
  pageId: number;
  sectionType: string;
  title: string | null;
  content: any;
  displayOrder: number;
  isVisible: boolean;
  settings?: any;
}

interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
  width?: "full" | "half";
}

const blockTypes = [
  { type: "columns", label: "Columns/Row", icon: Columns, description: "Multi-column layout (2-4 columns)", category: "layout" },
  { type: "rich_text", label: "Rich Text", icon: Type, description: "Formatted text with headings, lists, and links", category: "content" },
  { type: "heading", label: "Heading", icon: Heading, description: "Section heading (H1-H6)", category: "content" },
  { type: "image", label: "Image", icon: Image, description: "Single image with caption", category: "media" },
  { type: "button", label: "Button/CTA", icon: MousePointer, description: "Call-to-action button", category: "content" },
  { type: "divider", label: "Divider/Spacer", icon: Minus, description: "Line divider or empty space", category: "layout" },
  { type: "faq", label: "FAQ Accordion", icon: HelpCircle, description: "Question & answer accordion", category: "content" },
  { type: "card_grid", label: "Card Grid", icon: Grid3X3, description: "Grid of content cards", category: "content" },
  { type: "embed", label: "Embed", icon: Video, description: "YouTube video or Google Map", category: "media" },
  { type: "custom_html", label: "Custom HTML", icon: Code, description: "Raw HTML code (admin only)", category: "advanced" },
  { type: "form_builder", label: "Form Builder", icon: FormInput, description: "Custom form with validation", category: "forms" },
  { type: "contact_form", label: "Contact Form", icon: Mail, description: "Standard contact form", category: "forms" },
];

const blockTypeIcons: Record<string, any> = {
  columns: Columns,
  rich_text: Type,
  heading: Heading,
  image: Image,
  button: MousePointer,
  divider: Minus,
  faq: HelpCircle,
  card_grid: Grid3X3,
  embed: Video,
  custom_html: Code,
  form_builder: FormInput,
  contact_form: Mail,
};

const columnLayouts = [
  { value: "1", label: "1 Column", widths: ["100%"] },
  { value: "2", label: "2 Columns (50/50)", widths: ["50%", "50%"] },
  { value: "2-left", label: "2 Columns (66/33)", widths: ["66.66%", "33.33%"] },
  { value: "2-right", label: "2 Columns (33/66)", widths: ["33.33%", "66.66%"] },
  { value: "3", label: "3 Columns", widths: ["33.33%", "33.33%", "33.33%"] },
  { value: "4", label: "4 Columns", widths: ["25%", "25%", "25%", "25%"] },
];

function SortableBlock({
  section,
  onEdit,
  onDelete,
  onToggleVisibility,
}: {
  section: CmsSection;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const BlockIcon = blockTypeIcons[section.sectionType] || Type;
  const blockLabel = blockTypes.find(b => b.type === section.sectionType)?.label || section.sectionType;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        section.isVisible ? "bg-white" : "bg-gray-100 opacity-60"
      } ${isDragging ? "shadow-lg ring-2 ring-violet-400" : "hover:border-violet-300"}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100"
        data-testid={`drag-handle-${section.id}`}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </button>
      
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center flex-shrink-0">
        <BlockIcon className="w-4 h-4 text-violet-600" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">
          {section.title || blockLabel}
        </p>
        <p className="text-xs text-gray-500">
          {blockLabel}
        </p>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleVisibility}
          className="h-8 w-8"
          data-testid={`toggle-visibility-${section.id}`}
        >
          {section.isVisible ? (
            <Eye className="w-4 h-4 text-gray-500" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-400" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-8 w-8"
          data-testid={`edit-section-${section.id}`}
        >
          <Edit className="w-4 h-4 text-gray-500" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
          data-testid={`delete-section-${section.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function FormFieldBuilder({
  fields,
  onChange,
}: {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}) {
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const fieldTypes = [
    { value: "text", label: "Text Input" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "number", label: "Number" },
    { value: "textarea", label: "Text Area" },
    { value: "select", label: "Dropdown" },
    { value: "radio", label: "Radio Buttons" },
    { value: "checkbox", label: "Checkbox" },
    { value: "date", label: "Date Picker" },
    { value: "file", label: "File Upload" },
    { value: "url", label: "URL" },
  ];

  const addField = () => {
    setEditingField({
      name: `field_${fields.length + 1}`,
      label: "New Field",
      type: "text",
      required: false,
      width: "full",
    });
    setEditingIndex(null);
  };

  const saveField = () => {
    if (!editingField) return;
    
    const newFields = [...fields];
    if (editingIndex !== null) {
      newFields[editingIndex] = editingField;
    } else {
      newFields.push(editingField);
    }
    onChange(newFields);
    setEditingField(null);
    setEditingIndex(null);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    onChange(newFields);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Form Fields</Label>
        <Button size="sm" variant="outline" onClick={addField} data-testid="button-add-field">
          <Plus className="w-4 h-4 mr-1" /> Add Field
        </Button>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 rounded-lg border bg-gray-50"
          >
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => moveField(index, "up")}
                disabled={index === 0}
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => moveField(index, "down")}
                disabled={index === fields.length - 1}
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{field.label}</p>
              <p className="text-xs text-gray-500">
                {fieldTypes.find(t => t.value === field.type)?.label || field.type}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setEditingField(field);
                setEditingIndex(index);
              }}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500"
              onClick={() => removeField(index)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        {fields.length === 0 && (
          <p className="text-center py-4 text-gray-500 text-sm">No fields added yet</p>
        )}
      </div>

      <Dialog open={!!editingField} onOpenChange={(open) => !open && setEditingField(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Field" : "Add Field"}</DialogTitle>
          </DialogHeader>
          {editingField && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Field Name (ID)</Label>
                  <Input
                    value={editingField.name}
                    onChange={(e) => setEditingField({ ...editingField, name: e.target.value.replace(/\s/g, "_") })}
                    placeholder="field_name"
                    data-testid="input-field-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={editingField.label}
                    onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                    placeholder="Field Label"
                    data-testid="input-field-label"
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={editingField.type}
                    onValueChange={(v) => setEditingField({ ...editingField, type: v })}
                  >
                    <SelectTrigger data-testid="select-field-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Width</Label>
                  <Select
                    value={editingField.width || "full"}
                    onValueChange={(v) => setEditingField({ ...editingField, width: v as "full" | "half" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Width</SelectItem>
                      <SelectItem value="half">Half Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={editingField.placeholder || ""}
                  onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                  placeholder="Enter placeholder text..."
                />
              </div>

              {(editingField.type === "select" || editingField.type === "radio") && (
                <div className="space-y-2">
                  <Label>Options (one per line: value|label)</Label>
                  <Textarea
                    value={editingField.options?.map(o => `${o.value}|${o.label}`).join("\n") || ""}
                    onChange={(e) => {
                      const options = e.target.value.split("\n").filter(l => l.trim()).map(line => {
                        const [value, label] = line.split("|");
                        return { value: value?.trim() || "", label: label?.trim() || value?.trim() || "" };
                      });
                      setEditingField({ ...editingField, options });
                    }}
                    rows={4}
                    placeholder="option1|Option 1&#10;option2|Option 2"
                  />
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingField.required || false}
                    onCheckedChange={(checked) => setEditingField({ ...editingField, required: checked })}
                  />
                  <Label>Required</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Validation (optional)</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    type="number"
                    placeholder="Min length"
                    value={editingField.validation?.minLength || ""}
                    onChange={(e) => setEditingField({
                      ...editingField,
                      validation: { ...editingField.validation, minLength: parseInt(e.target.value) || undefined }
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max length"
                    value={editingField.validation?.maxLength || ""}
                    onChange={(e) => setEditingField({
                      ...editingField,
                      validation: { ...editingField.validation, maxLength: parseInt(e.target.value) || undefined }
                    })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingField(null)}>Cancel</Button>
            <Button onClick={saveField} data-testid="button-save-field">Save Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CMSPageBuilderProps {
  pageId: number;
  sections: CmsSection[];
  onSectionsChange: () => void;
  toast: any;
}

function BlockPreview({ section }: { section: CmsSection }) {
  const { sectionType, title, content } = section;
  
  const columnLayouts: Record<string, string[]> = {
    "1": ["100%"],
    "2": ["50%", "50%"],
    "2-left": ["66.66%", "33.33%"],
    "2-right": ["33.33%", "66.66%"],
    "3": ["33.33%", "33.33%", "33.33%"],
    "4": ["25%", "25%", "25%", "25%"],
  };

  switch (sectionType) {
    case "columns":
      const previewWidths = columnLayouts[content?.layout || "2"] || ["50%", "50%"];
      const previewColumns = content?.columns || [];
      const gridCols = previewWidths.length === 1 ? "1fr" : 
                       previewWidths.length === 2 ? (content?.layout === "2-left" ? "2fr 1fr" : content?.layout === "2-right" ? "1fr 2fr" : "1fr 1fr") :
                       previewWidths.length === 3 ? "1fr 1fr 1fr" : "1fr 1fr 1fr 1fr";
      return (
        <div className="w-full p-4 bg-white rounded-lg border">
          {title && <h3 className="font-semibold text-gray-700 mb-3">{title}</h3>}
          <div 
            className="grid"
            style={{ gridTemplateColumns: gridCols, gap: `${content?.gap || 24}px` }}
          >
            {previewWidths.map((_, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded p-3 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewColumns[i]?.content || "") }}
              />
            ))}
          </div>
        </div>
      );
    case "rich_text":
      return (
        <div className="p-4 bg-white rounded-lg border prose prose-sm max-w-none">
          {title && <h3 className="font-semibold text-gray-700 mb-2">{title}</h3>}
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content?.html || "") }} />
        </div>
      );
    case "heading":
      const HeadingTag = `h${content?.level || 2}` as keyof JSX.IntrinsicElements;
      return (
        <div className={`p-4 bg-white rounded-lg border text-${content?.align || "left"}`}>
          <HeadingTag className="font-bold text-gray-800">{content?.text || title}</HeadingTag>
        </div>
      );
    case "image":
      return (
        <div className={`p-4 bg-white rounded-lg border text-${content?.align || "center"}`}>
          {content?.url ? (
            <img src={content.url} alt={content?.alt || ""} className="max-w-full h-auto rounded" style={{ maxWidth: content?.maxWidth || "100%" }} />
          ) : (
            <div className="bg-gray-100 h-32 rounded flex items-center justify-center text-gray-400">No image</div>
          )}
          {content?.caption && <p className="text-sm text-gray-500 mt-2">{content.caption}</p>}
        </div>
      );
    case "button":
      return (
        <div className={`p-4 bg-white rounded-lg border text-${content?.align || "center"}`}>
          <button className={`px-6 py-2 rounded-lg font-medium ${
            content?.variant === "outline" ? "border-2 border-violet-500 text-violet-600" :
            content?.variant === "ghost" ? "text-violet-600 hover:bg-violet-50" :
            "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
          }`}>
            {content?.text || "Button"}
          </button>
        </div>
      );
    case "divider":
      return (
        <div className="py-2">
          {content?.type === "spacer" ? (
            <div style={{ height: content?.height || 40 }} />
          ) : (
            <hr className="border-gray-200" style={{ margin: `${content?.marginTop || 20}px 0 ${content?.marginBottom || 20}px` }} />
          )}
        </div>
      );
    case "faq":
      return (
        <div className="p-4 bg-white rounded-lg border space-y-2">
          {title && <h3 className="font-semibold text-gray-700 mb-2">{title}</h3>}
          {(content?.items || []).slice(0, 2).map((item: any, i: number) => (
            <div key={i} className="p-2 bg-gray-50 rounded">
              <p className="font-medium text-sm">{item.question}</p>
              <p className="text-xs text-gray-500 truncate">{item.answer}</p>
            </div>
          ))}
          {(content?.items?.length || 0) > 2 && <p className="text-xs text-gray-400">+{content.items.length - 2} more items</p>}
        </div>
      );
    case "card_grid":
      return (
        <div className="p-4 bg-white rounded-lg border">
          {title && <h3 className="font-semibold text-gray-700 mb-2">{title}</h3>}
          <div className="grid grid-cols-3 gap-2">
            {(content?.cards || []).slice(0, 3).map((card: any, i: number) => (
              <div key={i} className="p-2 bg-gray-50 rounded text-center">
                <p className="text-xs font-medium truncate">{card.title}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "embed":
      return (
        <div className="p-4 bg-white rounded-lg border text-center">
          <div className="bg-gray-100 h-24 rounded flex items-center justify-center text-gray-400">
            <Video className="w-8 h-8" />
            <span className="ml-2 text-sm">{content?.type === "youtube" ? "YouTube Video" : content?.type === "map" ? "Google Map" : "Embed"}</span>
          </div>
        </div>
      );
    case "contact_form":
    case "form_builder":
      return (
        <div className="p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-2 text-gray-500">
            <FormInput className="w-4 h-4" />
            <span className="text-sm">{title || (sectionType === "contact_form" ? "Contact Form" : "Custom Form")}</span>
          </div>
          {content?.fields?.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">{content.fields.length} field(s)</p>
          )}
        </div>
      );
    case "custom_html":
      return (
        <div className="p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-2 text-gray-500">
            <Code className="w-4 h-4" />
            <span className="text-sm">Custom HTML Block</span>
          </div>
        </div>
      );
    default:
      return (
        <div className="p-4 bg-gray-100 rounded-lg text-gray-500 text-sm">
          Preview not available
        </div>
      );
  }
}

export function CMSPageBuilder({ pageId, sections, onSectionsChange, toast }: CMSPageBuilderProps) {
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [editingSection, setEditingSection] = useState<CmsSection | null>(null);
  const [sectionContent, setSectionContent] = useState<any>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const createSectionMutation = useMutation({
    mutationFn: async (data: any) =>
      apiRequest("POST", `/api/sysctrl/cms/pages/${pageId}/sections`, data),
    onSuccess: () => {
      onSectionsChange();
      setShowBlockPicker(false);
      toast({ title: "Success", description: "Block added successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to add block", variant: "destructive" });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/sysctrl/cms/sections/${id}`, data),
    onSuccess: () => {
      onSectionsChange();
      setEditingSection(null);
      setSectionContent({});
      toast({ title: "Success", description: "Block updated successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to update block", variant: "destructive" });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/sysctrl/cms/sections/${id}`),
    onSuccess: () => {
      onSectionsChange();
      toast({ title: "Success", description: "Block deleted" });
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: async (sectionIds: number[]) =>
      apiRequest("POST", `/api/sysctrl/cms/pages/${pageId}/sections/reorder`, { sectionIds }),
    onSuccess: () => {
      onSectionsChange();
    },
  });

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      
      const newSections = arrayMove(sections, oldIndex, newIndex);
      const sectionIds = newSections.map((s) => s.id);
      reorderSectionsMutation.mutate(sectionIds);
    }
  }, [sections, reorderSectionsMutation]);

  const addBlock = (type: string) => {
    const defaultContent: Record<string, any> = {
      columns: { 
        layout: "2", 
        gap: 24,
        columns: [
          { content: "<p>Column 1 content</p>" },
          { content: "<p>Column 2 content</p>" }
        ]
      },
      rich_text: { html: "<p>Enter your content here...</p>" },
      heading: { text: "Section Heading", level: 2, align: "left" },
      image: { url: "", alt: "", align: "center" },
      button: { text: "Click Here", url: "#", variant: "primary", align: "center" },
      divider: { type: "line", marginTop: 20, marginBottom: 20 },
      faq: { items: [{ question: "Question 1?", answer: "Answer 1" }] },
      card_grid: { cards: [{ title: "Card 1", description: "Description" }] },
      embed: { type: "youtube", url: "" },
      custom_html: { html: "" },
      form_builder: { 
        formName: "custom_form",
        fields: [],
        submitButtonText: "Submit",
        successTitle: "Thank You!",
        successMessage: "Your form has been submitted successfully."
      },
      contact_form: {},
    };

    createSectionMutation.mutate({
      sectionType: type,
      title: blockTypes.find(b => b.type === type)?.label || "",
      content: defaultContent[type] || {},
      displayOrder: sections.length,
    });
  };

  const openEditor = (section: CmsSection) => {
    setEditingSection(section);
    setSectionContent(section.content || {});
  };

  const saveSection = () => {
    if (!editingSection) return;
    updateSectionMutation.mutate({
      id: editingSection.id,
      data: {
        title: editingSection.title,
        content: sectionContent,
        isVisible: editingSection.isVisible,
      },
    });
  };

  const toggleVisibility = (section: CmsSection) => {
    updateSectionMutation.mutate({
      id: section.id,
      data: { isVisible: !section.isVisible },
    });
  };

  const renderBlockEditor = () => {
    if (!editingSection) return null;

    switch (editingSection.sectionType) {
      case "columns":
        const selectedLayout = columnLayouts.find(l => l.value === sectionContent.layout) || columnLayouts[1];
        const columnCount = selectedLayout.widths.length;
        
        const handleLayoutChange = (newLayout: string) => {
          const layout = columnLayouts.find(l => l.value === newLayout);
          if (!layout) return;
          
          const newColumnCount = layout.widths.length;
          const currentColumns = sectionContent.columns || [];
          
          const newColumns = Array.from({ length: newColumnCount }, (_, i) => 
            currentColumns[i] || { content: `<p>Column ${i + 1} content</p>` }
          );
          
          setSectionContent({ ...sectionContent, layout: newLayout, columns: newColumns });
        };
        
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title (optional)</Label>
              <Input
                value={editingSection.title || ""}
                onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                placeholder="Section title"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Column Layout</Label>
              <div className="grid grid-cols-3 gap-2">
                {columnLayouts.map((layout) => (
                  <button
                    key={layout.value}
                    onClick={() => handleLayoutChange(layout.value)}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      sectionContent.layout === layout.value
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-gray-200 hover:border-violet-300"
                    }`}
                  >
                    <div className="flex gap-1 mb-1 justify-center">
                      {layout.widths.map((w, i) => (
                        <div
                          key={i}
                          className={`h-4 rounded ${sectionContent.layout === layout.value ? "bg-violet-400" : "bg-gray-300"}`}
                          style={{ width: w }}
                        />
                      ))}
                    </div>
                    <span className="text-xs">{layout.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Gap Between Columns (px)</Label>
              <Input
                type="number"
                value={sectionContent.gap || 24}
                onChange={(e) => setSectionContent({ ...sectionContent, gap: parseInt(e.target.value) || 24 })}
                min={0}
                max={100}
              />
            </div>
            
            <div className="space-y-4">
              <Label>Column Content</Label>
              {Array.from({ length: columnCount }).map((_, index) => {
                const columns = sectionContent.columns || [];
                const column = columns[index] || { content: "" };
                
                return (
                  <div key={index} className="space-y-2 p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-700">Column {index + 1}</span>
                      <Badge variant="outline" className="text-xs">
                        {selectedLayout.widths[index]}
                      </Badge>
                    </div>
                    <RichTextEditor
                      content={column.content || ""}
                      onChange={(html) => {
                        const newColumns = [...columns];
                        newColumns[index] = { ...column, content: html };
                        setSectionContent({ ...sectionContent, columns: newColumns });
                      }}
                      placeholder={`Enter content for column ${index + 1}...`}
                    />
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 bg-gray-100 rounded-lg">
              <Label className="mb-2 block">Layout Preview</Label>
              <div className="flex bg-white rounded border p-2" style={{ gap: `${sectionContent.gap || 24}px` }}>
                {selectedLayout.widths.map((w, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded p-3 min-h-[60px] flex items-center justify-center text-xs text-violet-600"
                    style={{ width: w }}
                  >
                    Col {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "rich_text":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title (optional)</Label>
              <Input
                value={editingSection.title || ""}
                onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                placeholder="Section title"
                data-testid="input-section-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <RichTextEditor
                content={sectionContent.html || ""}
                onChange={(html) => setSectionContent({ ...sectionContent, html })}
                placeholder="Enter your content..."
                minHeight="300px"
              />
            </div>
          </div>
        );

      case "heading":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Heading Text</Label>
              <Input
                value={sectionContent.text || ""}
                onChange={(e) => setSectionContent({ ...sectionContent, text: e.target.value })}
                placeholder="Enter heading..."
                data-testid="input-heading-text"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Heading Level</Label>
                <Select
                  value={String(sectionContent.level || 2)}
                  onValueChange={(v) => setSectionContent({ ...sectionContent, level: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">H1 - Main Title</SelectItem>
                    <SelectItem value="2">H2 - Section</SelectItem>
                    <SelectItem value="3">H3 - Subsection</SelectItem>
                    <SelectItem value="4">H4 - Small</SelectItem>
                    <SelectItem value="5">H5 - Smaller</SelectItem>
                    <SelectItem value="6">H6 - Smallest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alignment</Label>
                <div className="flex gap-1">
                  {[
                    { value: "left", icon: AlignLeft },
                    { value: "center", icon: AlignCenter },
                    { value: "right", icon: AlignRight },
                  ].map(({ value, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={sectionContent.align === value ? "default" : "outline"}
                      size="icon"
                      onClick={() => setSectionContent({ ...sectionContent, align: value })}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "button":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input
                value={sectionContent.text || ""}
                onChange={(e) => setSectionContent({ ...sectionContent, text: e.target.value })}
                placeholder="Click Here"
                data-testid="input-button-text"
              />
            </div>
            <div className="space-y-2">
              <Label>Link URL</Label>
              <Input
                value={sectionContent.url || ""}
                onChange={(e) => setSectionContent({ ...sectionContent, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Style</Label>
                <Select
                  value={sectionContent.variant || "primary"}
                  onValueChange={(v) => setSectionContent({ ...sectionContent, variant: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary (Gradient)</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                    <SelectItem value="ghost">Ghost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alignment</Label>
                <div className="flex gap-1">
                  {[
                    { value: "left", icon: AlignLeft },
                    { value: "center", icon: AlignCenter },
                    { value: "right", icon: AlignRight },
                  ].map(({ value, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={sectionContent.align === value ? "default" : "outline"}
                      size="icon"
                      onClick={() => setSectionContent({ ...sectionContent, align: value })}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={sectionContent.openInNewTab || false}
                onCheckedChange={(checked) => setSectionContent({ ...sectionContent, openInNewTab: checked })}
              />
              <Label>Open in new tab</Label>
            </div>
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={sectionContent.url || ""}
                onChange={(e) => setSectionContent({ ...sectionContent, url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>Alt Text (for accessibility)</Label>
              <Input
                value={sectionContent.alt || ""}
                onChange={(e) => setSectionContent({ ...sectionContent, alt: e.target.value })}
                placeholder="Describe the image..."
              />
            </div>
            <div className="space-y-2">
              <Label>Caption (optional)</Label>
              <Input
                value={sectionContent.caption || ""}
                onChange={(e) => setSectionContent({ ...sectionContent, caption: e.target.value })}
                placeholder="Image caption..."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Max Width (px)</Label>
                <Input
                  type="number"
                  value={sectionContent.maxWidth || ""}
                  onChange={(e) => setSectionContent({ ...sectionContent, maxWidth: parseInt(e.target.value) || undefined })}
                  placeholder="Auto"
                />
              </div>
              <div className="space-y-2">
                <Label>Alignment</Label>
                <div className="flex gap-1">
                  {[
                    { value: "left", icon: AlignLeft },
                    { value: "center", icon: AlignCenter },
                    { value: "right", icon: AlignRight },
                  ].map(({ value, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={sectionContent.align === value ? "default" : "outline"}
                      size="icon"
                      onClick={() => setSectionContent({ ...sectionContent, align: value })}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={sectionContent.fullWidth || false}
                onCheckedChange={(checked) => setSectionContent({ ...sectionContent, fullWidth: checked })}
              />
              <Label>Full width</Label>
            </div>
          </div>
        );

      case "divider":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={sectionContent.type || "line"}
                onValueChange={(v) => setSectionContent({ ...sectionContent, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Divider</SelectItem>
                  <SelectItem value="spacer">Spacer (no line)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Margin Top (px)</Label>
                <Input
                  type="number"
                  value={sectionContent.marginTop || 20}
                  onChange={(e) => setSectionContent({ ...sectionContent, marginTop: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Margin Bottom (px)</Label>
                <Input
                  type="number"
                  value={sectionContent.marginBottom || 20}
                  onChange={(e) => setSectionContent({ ...sectionContent, marginBottom: parseInt(e.target.value) })}
                />
              </div>
            </div>
            {sectionContent.type === "spacer" && (
              <div className="space-y-2">
                <Label>Height (px)</Label>
                <Input
                  type="number"
                  value={sectionContent.height || 40}
                  onChange={(e) => setSectionContent({ ...sectionContent, height: parseInt(e.target.value) })}
                />
              </div>
            )}
          </div>
        );

      case "embed":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Embed Type</Label>
              <Select
                value={sectionContent.type || "youtube"}
                onValueChange={(v) => setSectionContent({ ...sectionContent, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube Video</SelectItem>
                  <SelectItem value="map">Google Map</SelectItem>
                  <SelectItem value="custom">Custom Embed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL / Embed Code</Label>
              {sectionContent.type === "custom" ? (
                <Textarea
                  value={sectionContent.html || ""}
                  onChange={(e) => setSectionContent({ ...sectionContent, html: e.target.value })}
                  rows={4}
                  placeholder="Paste embed code here..."
                />
              ) : (
                <Input
                  value={sectionContent.url || ""}
                  onChange={(e) => setSectionContent({ ...sectionContent, url: e.target.value })}
                  placeholder={sectionContent.type === "youtube" ? "https://youtube.com/watch?v=..." : "https://maps.google.com/..."}
                />
              )}
            </div>
            {sectionContent.type === "map" && (
              <div className="space-y-2">
                <Label>Height (px)</Label>
                <Input
                  type="number"
                  value={sectionContent.height || 400}
                  onChange={(e) => setSectionContent({ ...sectionContent, height: parseInt(e.target.value) })}
                />
              </div>
            )}
          </div>
        );

      case "custom_html":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title (optional)</Label>
              <Input
                value={editingSection.title || ""}
                onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>HTML Code</Label>
              <Textarea
                value={sectionContent.html || ""}
                onChange={(e) => setSectionContent({ ...sectionContent, html: e.target.value })}
                rows={10}
                className="font-mono text-sm"
                placeholder="<div>Your HTML code here...</div>"
              />
              <p className="text-xs text-gray-500">Note: HTML will be sanitized for security</p>
            </div>
          </div>
        );

      case "faq":
        const faqItems = sectionContent.items || [];
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={editingSection.title || ""}
                onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                placeholder="Frequently Asked Questions"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>FAQ Items</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSectionContent({
                    ...sectionContent,
                    items: [...faqItems, { question: "", answer: "" }]
                  })}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </Button>
              </div>
              {faqItems.map((item: any, idx: number) => (
                <Card key={idx} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Input
                        value={item.question}
                        onChange={(e) => {
                          const newItems = [...faqItems];
                          newItems[idx].question = e.target.value;
                          setSectionContent({ ...sectionContent, items: newItems });
                        }}
                        placeholder="Question"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => {
                          const newItems = faqItems.filter((_: any, i: number) => i !== idx);
                          setSectionContent({ ...sectionContent, items: newItems });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={item.answer}
                      onChange={(e) => {
                        const newItems = [...faqItems];
                        newItems[idx].answer = e.target.value;
                        setSectionContent({ ...sectionContent, items: newItems });
                      }}
                      placeholder="Answer"
                      rows={2}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case "card_grid":
        const cards = sectionContent.cards || [];
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={editingSection.title || ""}
                onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Cards</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSectionContent({
                    ...sectionContent,
                    cards: [...cards, { title: "", description: "" }]
                  })}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Card
                </Button>
              </div>
              {cards.map((card: any, idx: number) => (
                <Card key={idx} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={card.title}
                        onChange={(e) => {
                          const newCards = [...cards];
                          newCards[idx].title = e.target.value;
                          setSectionContent({ ...sectionContent, cards: newCards });
                        }}
                        placeholder="Card Title"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => {
                          const newCards = cards.filter((_: any, i: number) => i !== idx);
                          setSectionContent({ ...sectionContent, cards: newCards });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={card.description}
                      onChange={(e) => {
                        const newCards = [...cards];
                        newCards[idx].description = e.target.value;
                        setSectionContent({ ...sectionContent, cards: newCards });
                      }}
                      placeholder="Card description"
                      rows={2}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case "form_builder":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Form Title</Label>
              <Input
                value={editingSection.title || ""}
                onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                placeholder="Contact Us"
              />
            </div>
            <div className="space-y-2">
              <Label>Form Description</Label>
              <Textarea
                value={sectionContent.description || ""}
                onChange={(e) => setSectionContent({ ...sectionContent, description: e.target.value })}
                placeholder="Fill out the form below..."
                rows={2}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Form Name (internal)</Label>
                <Input
                  value={sectionContent.formName || ""}
                  onChange={(e) => setSectionContent({ ...sectionContent, formName: e.target.value })}
                  placeholder="custom_form"
                />
              </div>
              <div className="space-y-2">
                <Label>Submit Button Text</Label>
                <Input
                  value={sectionContent.submitButtonText || ""}
                  onChange={(e) => setSectionContent({ ...sectionContent, submitButtonText: e.target.value })}
                  placeholder="Submit"
                />
              </div>
            </div>
            
            <FormFieldBuilder
              fields={sectionContent.fields || []}
              onChange={(fields) => setSectionContent({ ...sectionContent, fields })}
            />

            <div className="space-y-2">
              <Label>Success Title</Label>
              <Input
                value={sectionContent.successTitle || ""}
                onChange={(e) => setSectionContent({ ...sectionContent, successTitle: e.target.value })}
                placeholder="Thank You!"
              />
            </div>
            <div className="space-y-2">
              <Label>Success Message</Label>
              <Textarea
                value={sectionContent.successMessage || ""}
                onChange={(e) => setSectionContent({ ...sectionContent, successMessage: e.target.value })}
                placeholder="Your form has been submitted successfully."
                rows={2}
              />
            </div>
          </div>
        );

      case "contact_form":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={editingSection.title || ""}
                onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                placeholder="Get In Touch"
              />
            </div>
            <p className="text-sm text-gray-500">
              This is the standard contact form with name, email, phone, subject, and message fields.
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Editor not available for this block type
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="font-medium text-gray-700">Content Blocks</h4>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={!previewMode ? "default" : "outline"}
              onClick={() => setPreviewMode(false)}
              data-testid="button-edit-mode"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant={previewMode ? "default" : "outline"}
              onClick={() => setPreviewMode(true)}
              data-testid="button-preview-mode"
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
          </div>
          {previewMode && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={previewDevice === "desktop" ? "secondary" : "ghost"}
                onClick={() => setPreviewDevice("desktop")}
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={previewDevice === "mobile" ? "secondary" : "ghost"}
                onClick={() => setPreviewDevice("mobile")}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
          )}
          {!previewMode && (
            <Button
              size="sm"
              onClick={() => setShowBlockPicker(true)}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
              data-testid="button-add-block"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Block
            </Button>
          )}
        </div>
      </div>

      {previewMode ? (
        <div className={`mx-auto transition-all ${previewDevice === "mobile" ? "max-w-sm" : "w-full"}`}>
          <div className="bg-gray-50 border rounded-lg p-4 space-y-4">
            {sections.filter(s => s.isVisible).length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No visible blocks to preview</p>
              </div>
            ) : (
              sections.filter(s => s.isVisible).map((section) => (
                <BlockPreview key={section.id} section={section} />
              ))
            )}
          </div>
        </div>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sections.map((section) => (
                  <SortableBlock
                    key={section.id}
                    section={section}
                    onEdit={() => openEditor(section)}
                    onDelete={() => {
                      if (confirm("Delete this block?")) {
                        deleteSectionMutation.mutate(section.id);
                      }
                    }}
                    onToggleVisibility={() => toggleVisibility(section)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {sections.length === 0 && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
              <Type className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No content blocks yet</p>
              <p className="text-xs">Click "Add Block" to start building your page</p>
            </div>
          )}
        </>
      )}

      <Dialog open={showBlockPicker} onOpenChange={setShowBlockPicker}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Content Block</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2 max-h-[400px] overflow-y-auto p-1">
            {blockTypes.map((block) => {
              const BlockIcon = block.icon;
              return (
                <button
                  key={block.type}
                  onClick={() => addBlock(block.type)}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:border-violet-300 hover:bg-violet-50 transition-all text-left"
                  data-testid={`add-block-${block.type}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center flex-shrink-0">
                    <BlockIcon className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{block.label}</p>
                    <p className="text-xs text-gray-500">{block.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              Edit {blockTypes.find(b => b.type === editingSection?.sectionType)?.label || "Block"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)] py-4">
            {renderBlockEditor()}
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setEditingSection(null)}>
              Cancel
            </Button>
            <Button 
              onClick={saveSection}
              disabled={updateSectionMutation.isPending}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
              data-testid="button-save-block"
            >
              <Save className="w-4 h-4 mr-1" />
              {updateSectionMutation.isPending ? "Saving..." : "Save Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CMSPageBuilder;
