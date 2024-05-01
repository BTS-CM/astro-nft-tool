import { useState, useEffect } from "react";
import { ReloadIcon } from "@radix-ui/react-icons";

import { CommandItem } from "@/components/ui/command";

interface MenuRowProperties {
  url: string;
  text: string;
  icon: string;
}

export default function MenuRow({ url, text, icon }: MenuRowProperties) {
  const [hover, setHover] = useState<boolean>(false);
  const [isCurrentPage, setIsCurrentPage] = useState<boolean>(false);

  useEffect(() => {
    setIsCurrentPage(window.location.pathname === url);
  }, [url]);

  const [clicked, setClicked] = useState<boolean>(false);

  return (
    <a
      href={url}
      onClick={() => {
        setClicked(true);
      }}
    >
      <CommandItem
        onMouseEnter={() => {
          setHover(true);
        }}
        onMouseLeave={() => {
          setHover(false);
        }}
        style={{
          backgroundColor: hover || isCurrentPage ? "#F1F1F1" : "",
        }}
      >
        <span className="grid grid-cols-8 w-full">
          <span className="col-span-1">{icon}</span>
          <span className="col-span-6">{text}</span>
          <span className="col-span-1 text-right">
            {clicked && !isCurrentPage ? <ReloadIcon className="ml-2 mt-1 animate-spin" /> : ""}
          </span>
        </span>
      </CommandItem>
    </a>
  );
}
