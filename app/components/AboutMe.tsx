import Image from "next/image";
import React from "react";
import { GitHub, LinkedIn, Note, Qiita, SpeakerDeck, X } from "../icons";
import me from "../img/me-square.png";

const AboutMe: React.FC = () => {
  return (
    <section className="mx-auto pb-5">
      <div className="text-7xl text-center p-5 pt-0 font-bold">About Me</div>
      <div className="text-center">
        <Image
          className="rounded-full mx-auto mb-2"
          src={me}
          alt="Toru Takahashi"
          width={200}
          height={200}
        ></Image>
        <p className="text-3xl font-bold mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6 inline"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
          Toru Takahashi
        </p>
        <p className="text-xl mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6 inline"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
          Software Engineer
        </p>
        <p className="text-xl mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="red"
            className="size-6 inline"
          >
            <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
          </svg>
          <span>Java, Next.js, AWS Amplify</span>
        </p>
        <p className="text-xl mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6 inline"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
            />
          </svg>
          <a
            href="https://aws.amazon.com/jp/developer/community/community-builders/community-builders-directory/?cb-cards.sort-by=item.additionalFields.cbName&cb-cards.sort-order=asc&awsf.builder-category=*all&awsf.location=*all&awsf.year=*all&cb-cards.q=toru%2Btakahashi&cb-cards.q_operator=AND"
            target="_blank"
            className="hover:opacity-50"
          >
            AWS Community Builder
            <br />
            <span className="text-sm">Category: Front-End Web and Mobile</span>
          </a>
        </p>
        <div className="flex justify-center items-center gap-x-4 mb-3">
          <a
            href="https://x.com/tttol777"
            target="_blank"
            className="hover:opacity-50"
          >
            <X />
          </a>
          <a
            href="https://www.linkedin.com/in/toru-takahashi-23b26729a/"
            target="_blank"
            className="hover:opacity-50"
          >
            <LinkedIn />
          </a>
          <a
            href="https://github.com/tttol"
            target="_blank"
            className="hover:opacity-50"
          >
            <GitHub />
          </a>
        </div>
        <div className="flex justify-center items-center gap-x-4">
          <a
            href="https://qiita.com/tttol777"
            target="_blank"
            className="hover:opacity-50"
          >
            <Qiita />
          </a>
          <a
            href="https://speakerdeck.com/tttol"
            target="_blank"
            className="hover:opacity-50"
          >
            <SpeakerDeck />
          </a>
          <a
            href="https://note.com/tttol777/"
            target="_blank"
            className="hover:opacity-50"
          >
            <Note />
          </a>

        </div>
      </div>
    </section>
  );
};
export default AboutMe;
