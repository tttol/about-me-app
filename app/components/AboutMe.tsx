import Image from "next/image";

export default function AboutMe(): React.JSX.Element {
  return (
    <header className="profile">
      <h1>About Me</h1>
      <Image
        className="profile__portrait"
        src="/me-square.png"
        alt="Toru Takahashi"
        loading="eager"
        width={200}
        height={200}
      />
      <p className="profile__name">Toru Takahashi</p>
    </header>
  );
}
