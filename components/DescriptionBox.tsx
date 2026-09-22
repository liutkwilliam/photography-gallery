interface DescriptionBoxProps {
  spec: string | undefined;
}

export default function DescriptionBox({ spec }: DescriptionBoxProps) {
  return (
    <>
      <div className="rounded border border-foreground bg-primary text-background font-semibold px-2 py-1">
        <dt className="sr-only">Photo spec</dt>
        <dd>{spec}</dd>
      </div>
    </>
  );
}
