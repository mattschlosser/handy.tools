"use client";
import Link from "next/link";
import { ModeToggle } from "../ui/mode-toggle";
import { FireExtinguisher, KeyboardMusic, Pause } from "lucide-react";
import { Button } from "../ui/button";
import { useRef, useState } from "react";

export function Navigation() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

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
      <div className="ml-auto flex gap">
        <Button variant="outline" size="icon" onClick={toggleAudio}>
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
