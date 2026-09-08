interface DescriptionBoxProps {
  key: string | undefined;
  spec: string | undefined;
}

export default function DescriptionBox({ key, spec }: DescriptionBoxProps) {
  return (
    <>
      <div
        key={key}
        className="rounded border border-zinc-100 bg-zinc-800 text-zinc-100 px-2 py-1"
      >
        <dt className="sr-only">Photo spec</dt>
        <dd>{spec}</dd>
      </div>
    </>
  );
}
