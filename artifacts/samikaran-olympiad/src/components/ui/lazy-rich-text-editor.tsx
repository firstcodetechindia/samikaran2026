import { lazy, Suspense } from "react";

const RichTextEditorCore = lazy(() =>
  import("./rich-text-editor").then((m) => ({ default: m.RichTextEditor }))
);

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor(props: RichTextEditorProps) {
  return (
    <Suspense
      fallback={
        <div
          className="animate-pulse rounded-md border border-input bg-muted"
          style={{ minHeight: props.minHeight ?? "200px" }}
        />
      }
    >
      <RichTextEditorCore {...props} />
    </Suspense>
  );
}
