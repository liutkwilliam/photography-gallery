// import useBillboard from '@/hooks/useBillboard';
// import useInfoModal from '@/hooks/useInfoModal';
import React, { useCallback } from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";
import PlayButton from "./PlayButton";
import Image from "next/image";
import Buttons from "./Buttons";

const Billboard = () => {
  //   const { data } = useBillboard();
  //   const { openModal } = useInfoModal();
  //   const handleOpenModal = useCallback(() => {
  //     openModal(data?.id);
  //   }, [openModal, data?.id]);

  return (
    <div className="relative h-[56.25vw]">
      {/* <video
        className="
            w-full
            h-[56.25vw]
            object-cover
            brightness-[60%]
            "
        autoPlay
        muted
        loop
        poster={data?.thumbnailUrl}
        src={data?.videoUrl}
      ></video> */}
      <Image
        className="w-full h-[56.25vw] object-cover brightness-[50%]"
        src="/luzern_switzerland_2022.jpg"
        alt="Hero Image"
        width={1920}
        height={1080}
      />
      <div className="absolute top-[30%] md:top-[40%] ml-4 md:ml-16">
        <p
          className="
                text-white 
                text-1xl 
                md:text-5xl 
                h-full 
                w-[50%] 
                lg:text-6xl 
                font-bold 
                drop-shadow-xl
                "
        >
          {/* {data?.title} */}
          Welcome to My Photography Gallery!
        </p>
        <p
          className="
                text-white
                text-[8px]
                md:text-lg
                mt-3
                md:mt-8
                w-[80%]
                md:w-[90%]
                lg:w-[50%]
                drop-shadow-xl
                "
        >
          {/* {data?.description} */}
          Explore stunning visuals, understand my journey and immerse yourself
          in the art of photography.
        </p>
        <div className="flex flex-row items-center mt-3 md:mt-4 gap-3">
          {/* <PlayButton movieId={data?.id} /> */}
          <Buttons bgColor="white" color="black">
            <AiOutlineInfoCircle className="w-4 md:w-7 mr-1" />
            More Info
          </Buttons>
        </div>
      </div>
    </div>
  );
};

export default Billboard;
