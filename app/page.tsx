import { Suspense } from "react";
import "server-only";
import AboutMe from "./components/AboutMe";
import Connections from "./components/Connections";
import Meeting from "./components/Meeting";

export default function Home(): React.JSX.Element {
  return (
    <main className="portfolio">
      <AboutMe />
      <Connections />
      <Suspense>
        <Meeting />
      </Suspense>
    </main>
  );
}
