"use client";
import Link from "next/link";
import { ModeToggle } from "../ui/mode-toggle";
import { FireExtinguisher, KeyboardMusic, Pause } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useRef } from "react";
import useAudioStore from "@/hooks/use-audio-store";

export function Navigation() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isPlaying, setAudioElement, toggle } = useAudioStore();

  useEffect(() => {
    if (audioRef.current) {
      setAudioElement(audioRef.current);
    }
  }, [setAudioElement]);

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 w-full z-50">
      <nav className="flex-col gap-6 text-lg font-medium md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <FireExtinguisher />
          <div className="text-2xl">Tiny Vid</div>
        </Link>
      </nav>
      <div className="ml-auto flex gap-2">
        <Button variant="outline" size="icon" onClick={toggle}>
          {isPlaying ? <Pause /> : <KeyboardMusic />}
        </Button>
        <ModeToggle />
      </div>
      <audio className="sr-only" ref={audioRef}>
        <source src="/music.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </header>
  );
}
