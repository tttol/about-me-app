import { Suspense } from "react";
import "server-only";
import AboutMe from "./components/AboutMe";
import Header from "./components/Header";
import Meeting from "./components/Meeting";
import Version from "./components/Version";

export default function Home() {
  return (
    <main className="text-slate-800 dark:text-slate-200">
      <div className="bg-gradient-to-b to-white from-blue-300 dark:to-blue-700 dark:from-black h-screen">
        <Version />
        <Header />
        <AboutMe />
        <Suspense> 
          <Meeting />
        </Suspense>
      </div>
    </main>
  );
}
