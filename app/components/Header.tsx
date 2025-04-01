"use client"
import { Moon, Sun } from "../icons";

export default function Header() {
  const switchLight = () => {
    document.querySelector("main")?.classList.remove("dark");
    document.querySelector("#sun")?.classList.remove("opacity-50");
    document.querySelector("#moon")?.classList.add("opacity-50");
  };
  const switchDark = () => {
    document.querySelector("main")?.classList.add("dark");
    document.querySelector("#moon")?.classList.remove("opacity-50");
    document.querySelector("#sun")?.classList.add("opacity-50");
  };
  return (
    <header className="flex justify-end p-2">
      <div
        id="sun"
        className="cursor-pointer rounded-full p-2 bg-black text-white dark:bg-slate-500 mr-1"
        onClick={switchLight}
      >
        <Sun />
      </div>
      <div
        id="moon"
        className="cursor-pointer rounded-full p-2 bg-black text-white dark:bg-slate-500 opacity-50"
        onClick={switchDark}
      >
        <Moon />
      </div>
    </header>
  );
}
