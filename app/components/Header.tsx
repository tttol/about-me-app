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
      <div className="cursor-pointer mr-2 text-2xl font-bold hover:opacity-50 self-end underline">
        Blog
      </div>
      <div
        id="sun"
        className="cursor-pointer mr-1 hover:opacity-50 self-end"
        onClick={switchLight}
      >
        <Sun />
      </div>
      <div
        id="moon"
        className="cursor-pointer opacity-50 hover:opacity-100 self-end"
        onClick={switchDark}
      >
        <Moon />
      </div>
    </header>
  );
}
