import Image from "next/image";

interface InfoBlockProp {
  imgSrc: string;
  alt: string;
  text?: string;
  onClick?: () => void;
}

export default function InfoBlock({
  imgSrc,
  alt,
  text,
  onClick,
}: InfoBlockProp) {
  return (
    <div
      className="relative aspect-3/2 shadow-lg hover:opacity-80 hover:scale-105 transition ease-in-out duration-300 cursor-pointer"
      onClick={onClick}
    >
      {imgSrc && (
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className="object-cover aspect-3/2 border border-foreground hover:border-primary rounded-4xl"
        />
      )}
      <div className="absolute z-[999] p-2 w-full h-full rounded-4xl aspect-3/2 flex items-center justify-center bg-background/20 border border-foreground hover:border-primary text-white hover:bg-primary/20">
        <p className="text-lg font-semibold">
          {text}
        </p>
      </div>
    </div>
  );
}
