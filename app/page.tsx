"use client"

import CoverPhoto from "@/components/CoverPhoto";
import InfoBlock from "@/components/InfoBlock";
import SectionBlock from "@/components/SectionBlock";
import { useRouter } from 'next/navigation'

export default function Home() {
  const blockLinks = [
    { label: "Gallery", href: "/gallery", imgSrc: "/photo-example.jpg" },
    { label: "Map", href: "/map", imgSrc: "/photo-map.png" },
  ];

  const router = useRouter()

  return (
    <>
      <CoverPhoto />
      <SectionBlock bgColor="bg-primary" color="text-background">
        <h1 className="text-3xl font-semibold">
          About this photography gallery
        </h1>
        <h2 className="text-lg font-semibold">
          More than just a photo collection
        </h2>
        <p>
          This custom web app brings together visual storytelling and technical
          craft. You can explore my full gallery through a traditional layout or
          drop into an interactive map to discover photos by clicking on
          location pins. Filtering by camera settings, timing, and locations
          brings my love for photography together with my passion for coding and
          UI/UX design to create something truly meaningful.
        </p>
      </SectionBlock>
      <SectionBlock>
        <h1 className="text-3xl font-semibold text-primary">
          Explore my world of photography through:
        </h1>
        <div className="grid grid-cols-2 gap-4 py-4">
          {blockLinks.map((item) => (
            <InfoBlock
              key={item.label}
              text={item.label}
              imgSrc={item.imgSrc}
              alt={item.imgSrc}
              onClick={() => router.push(item.href)}
            />
          ))}
        </div>
      </SectionBlock>
    </>
  );
}
