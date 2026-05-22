import { ReactNode } from "react";
import { audio } from "@/lib/audio";
import { Button, ButtonProps } from "@/components/ui/button";

export interface SoundButtonProps extends ButtonProps {
  playSelectSound?: boolean;
}

export function SoundButton({ onMouseEnter, onClick, playSelectSound = true, ...props }: SoundButtonProps) {
  return (
    <Button
      {...props}
      onMouseEnter={(e) => {
        audio.playHover();
        onMouseEnter?.(e);
      }}
      onClick={(e) => {
        if (playSelectSound) {
          audio.playSelect();
        } else {
          audio.playHover();
        }
        onClick?.(e);
      }}
    />
  );
}
