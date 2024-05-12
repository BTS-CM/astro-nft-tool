import React, { useEffect, useState, useSyncExternalStore } from "react";
import { InView } from "react-intersection-observer";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  type User,
  $currentUser,
  setCurrentUser,
  $userStorage,
  removeUser,
} from "@/stores/users.ts";

import AccountSelect from "@/components/react/AccountSelect";
import { Avatar } from "@/components/react/Avatar";
import { useInitCache } from "@/effects/Init.ts";

export default function CurrentUser() {
  const usr = useSyncExternalStore($currentUser.subscribe, $currentUser.get, $currentUser.get);
  useInitCache();

  const [inView, setInView] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    if (usr && usr.id && usr.id.length) {
      setOpen(false);
    }
  }, [usr]);

  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-1 mt-3">
        <Card key={usr.id} className="w-full" style={{ transform: "scale(0.75)" }}>
          <CardHeader>
            <CardTitle
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <div className="grid grid-cols-3">
                <div className="col-span-1 pr-3 pt-3">
                  <InView onChange={setInView}>
                    {inView ? (
                      <Avatar
                        size={50}
                        name={usr.username}
                        extra=""
                        expression={{
                          eye: "normal",
                          mouth: "open",
                        }}
                        colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
                      />
                    ) : null}
                  </InView>
                </div>
                <div className="col-span-2 pl-3">
                  <span className="text-xl">
                    {usr && usr.username ? usr.username : "null-account"}
                  </span>
                  <br />
                  <span className="text-sm">
                    {usr && usr.chain ? usr.chain : "bitshares"}
                    <br />
                    {usr && usr.id ? usr.id : "1.2.3"}
                  </span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
          }}
        >
          <DialogTrigger asChild>
            <Button className="h-5 p-3">Switch account/chain</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-white">
            <DialogHeader>
              <DialogTitle>Account management console</DialogTitle>
            </DialogHeader>
            <AccountSelect />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
