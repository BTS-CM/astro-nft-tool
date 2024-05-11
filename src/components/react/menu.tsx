import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";

import MenuRow from "@/components/react/menurow";

export default function Menu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <HamburgerMenuIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mt-3 p-0">
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder={"Search.."} />
          <CommandList>
            <CommandEmpty>Not found...</CommandEmpty>
            <CommandGroup heading={"Bitshares Astro NFT tool"}>
              <MenuRow url="/" text="Homepage" icon="🏠" />
              <MenuRow url="/create" text="Create an NFT" icon="➕" />
              <MenuRow url="/lookup" text="Lookup NFTs" icon="🔎" />
              <MenuRow url="/issue" text="Issue an NFT" icon="🚀" />
              <MenuRow url="/about" text="About" icon="❔" />
              <MenuRow url="/webring" text="Webring" icon="🔗" />
            </CommandGroup>
          </CommandList>
        </Command>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
