import Billboard from "@/components/Billboard";
import sampleData from '@/lib/sampleData.json';
import { MediaItem } from '@/types/media';
// import InfoModal from "@/components/InfoModal";
// import MovieList from "@/components/MovieList";
import PhotoGalleryUpload from "@/components/PhotoGalleryUpload";
// import useFavorites from "@/hooks/useFavorites";
// import useInfoModal from "@/hooks/useInfoModal";
// import useMovieList from "@/hooks/useMovieList";
// import { getSession } from "next-auth/react"

// export async function getServerSideProps(context: NextPageContext) {
//   // const session = await getSession(context);

//   // if (!session) { // if available session exisits, logout
//   //   return {
//   //     redirect: {
//   //       destination: '/auth',
//   //       permanent: false,
//   //     }
//   //   }
//   // }

//   return {
//     props: {}
//   }
// }

export function getAllMedia(): MediaItem[] {
  return sampleData.media as MediaItem[];
}

export default function Home() {
  // const movies = getAllMedia();

  return (
    <>
      {/* <InfoModal visible={isOpen} onClose={closeModal} /> */}
      <Billboard />
      {/* <div className="pb-40"> */}
        {/* <MovieList title="Latest Work" data={movies} /> */}
        {/* <MovieList title="My List" data={favorites} /> */}
      {/* </div> */}
      <PhotoGalleryUpload />
    </>
  )
}
