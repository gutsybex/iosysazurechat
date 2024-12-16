"use client";

import { FC, useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { ServerActionResponse } from "@/features/common/server-action-response";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { ScrollArea } from "../../ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../../ui/sheet";
import { Switch } from "../../ui/switch";
import { Textarea } from "../../ui/textarea";
import {
  AddOrUpdateExtension,
  extensionStore,
  useExtensionState,
} from "../extension-store";
import { LoadingIndicator } from "@/features/ui/loading";
import { EndpointHeader } from "./endpoint-header";
import { AddFunction } from "./add-function";

interface User {
  id: string;
  displayName: string;
  userPrincipalName: string;
}

interface Props {
  users?: User[];
}

export const AddExtension: FC<Props> = ({ users = [] }) => {
  const { isOpened, extension } = useExtensionState();
  const initialState: ServerActionResponse | undefined = undefined;

  const [formState, formAction] = useFormState(
    async (state: void | undefined, formData: FormData): Promise<void> => {
      // Append shareWith to formData as a JSON string
      formData.append("shareWith", JSON.stringify(shareWith));
      await AddOrUpdateExtension(state, formData); // Corrected call, removed `state`
    },
    initialState
  );
  const [shareWith, setShareWith] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users
    .filter((user) => !shareWith.some((selected) => selected.id === user.id))
    .filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userPrincipalName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleSelectUser = (user: User) => {
    setShareWith((prev) => [...prev, user]);
    setSearchTerm("");
  };

  const handleRemoveUser = (userId: string) => {
    setShareWith((prev) => prev.filter((user) => user.id !== userId));
  };

  const PublicSwitch = () => {
    if (!extension) return null;
    return (
      <div className="flex items-center space-x-2">
        <Switch name="isPublished" defaultChecked={extension.isPublished} />
        <Label htmlFor="description">Publish</Label>
      </div>
    );
  };

  useEffect(() => {
    if (!isOpened) {
      setShareWith([]);
      setSearchTerm("");
    }
  }, [isOpened]);

  return (
    <Sheet
      open={isOpened}
      onOpenChange={(value) => {
        extensionStore.updateOpened(value);
      }}
    >
      <SheetContent className="min-w-[680px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Extension</SheetTitle>
        </SheetHeader>
        <form action={formAction} className="flex-1 flex flex-col">
          <ScrollArea
            className="h-full -mx-6 max-h-[calc(100vh-140px)]"
            type="always"
          >
            <div className="pb-6 px-6 flex gap-8 flex-col">
              <input type="hidden" name="id" defaultValue={extension?.id} />
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  type="text"
                  required
                  name="name"
                  defaultValue={extension?.name}
                  placeholder="Name of your Extension"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Short description</Label>
                <Input
                  type="text"
                  required
                  defaultValue={extension?.description}
                  name="description"
                  placeholder="Short description"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="shareWith">Share With</Label>
                <div className="relative">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {shareWith.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-1 bg-blue-200 text-blue-800 rounded-full px-3 py-1"
                      >
                        <span>{user.displayName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user.id)}
                          className="text-red-500 text-xs"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>

                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for users by name or email"
                  />

                  {searchTerm && filteredUsers.length > 0 && (
                    <div className="absolute z-10 rounded-lg w-full mt-2 max-h-40 overflow-y-auto bg-[#020817] border border-gray-700 text-white">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="p-2 cursor-pointer hover:bg-gray-700"
                          onClick={() => handleSelectUser(user)}
                        >
                          {user.displayName} ({user.userPrincipalName})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Detail description</Label>
                <Textarea
                  required
                  defaultValue={extension?.executionSteps}
                  name="executionSteps"
                  placeholder="Describe specialties and the steps to execute the extension"
                />
              </div>
              <EndpointHeader />
              <AddFunction />
            </div>
          </ScrollArea>

          <SheetFooter className="py-2 flex sm:justify-between flex-row">
            <PublicSwitch />
            <Submit />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

function Submit() {
  const { isLoading } = useExtensionState();
  return (
    <Button disabled={isLoading} className="gap-2">
      <LoadingIndicator isLoading={isLoading} />
      Save
    </Button>
  );
}
