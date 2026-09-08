import SocialButton from "@/components/SocialButton";
import { MdOutlineEmail } from "react-icons/md";
import { FaInstagram, FaLinkedin, FaGithub } from "react-icons/fa";

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 pt-20 text-zinc-100 sm:px-6 lg:px-8 space-y-4">
      <h1 className="text-3xl font-semibold">About</h1>
      <h2 className="text-xl">
        I am William (he/him). Living in Sydney, Australia.
      </h2>
      <p className="mt-4 text-zinc-200 tracking-wide text-lg/8">
        I am a frontend developer, photographer and designer. my journey into
        photography began in 2015 where I learned about the fundamentals of
        photography, lighting and how to use a camera. I have been taking photos
        ever since, and I have developed a passion for capturing moments and
        telling stories through my lens. As I also learnt about web development,
        I decided to combine my two passions and create this photography
        database. While this database is developing in progress, I hope to share
        my work and connect with other photographers and enthusiasts. I am
        always looking for new opportunities to learn and grow as a photographer
        and developer, and I am excited to see where this journey takes me.
      </p>
      <div className="py-4 space-y-6 ">
        <h5 className="text-lg font-semibold">Follow my journey</h5>
        <SocialButton
          icon={<FaInstagram />}
          href="https://www.instagram.com/liutkwilliam"
          content="Instagram (Mainly photography)"
        />
        <SocialButton
          icon={<MdOutlineEmail />}
          href="mailto:liutk.william@gmail.com"
          content="liutk.william (@) gmail.com"
        />

        <SocialButton
          icon={<FaLinkedin />}
          href="https://www.linkedin.com/in/liutkwilliam/"
          content="Connect Me on LinkedIn"
        />

        <SocialButton
          icon={<FaGithub />}
          href="https://www.github.com/liutkwilliam/"
          content="GitHub"
        />
      </div>
    </main>
  );
}
