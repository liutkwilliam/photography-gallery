interface sectionBlockProps {
  bgColor?: string;
  color?: string;
  children?: React.ReactNode;
}

const SectionBlock = ({ bgColor = "bg-background", color = "text-foreground", children }: sectionBlockProps) => (
  <section
    className={`${bgColor} ${color} flex min-h-[100vh] items-center sticky top-0 z-99`}
  >
    <div className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6 lg:px-8 space-y-4">
      {children}
    </div>
  </section>
);

export default SectionBlock;