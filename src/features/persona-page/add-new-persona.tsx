"use client";

import { useSession } from "next-auth/react";
import { FC, useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ServerActionResponse } from "../common/server-action-response";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { LoadingIndicator } from "../ui/loading";
import { ScrollArea } from "../ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import {
  addOrUpdatePersona,
  personaStore,
  usePersonaState,
} from "./persona-store";
import { fetchUsers } from "./persona-services/persona-service";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/tooltip";

// Define the types for users (you can refine this if needed)
interface User {
  id: string;
  displayName: string;
  userPrincipalName: string;
  givenName?: string;
  surname?: string;
  mail?: string;
}

interface Props {}

export const AddNewPersona: FC<Props> = ({}) => {
  const initialState: ServerActionResponse | undefined = undefined;
  const { isOpened, persona } = usePersonaState();
  const [formState, formAction] = useFormState(
    addOrUpdatePersona,
    initialState
  );

  const { data } = useSession();

  const [shareWith, setShareWith] = useState<User[]>([]); // State for selected users
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  const [matchedUsers, setMatchedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(persona.isPublished);

  // Debounced search for users
  useEffect(() => {
    async function getUsers(term: string) {
      if (!term || term.length < 3) {
        setMatchedUsers([]);
        return [];
      }
      try {
        setLoading(true);
        const fetchedUsers = await fetchUsers(term);
        setMatchedUsers(fetchedUsers); // Update state with fetched users
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Error fetching users:", error);
      }
    }

    const debounce = setTimeout(() => {
      getUsers(searchTerm); // Call async function
    }, 300); // Debounce delay (300ms)

    return () => clearTimeout(debounce); // Cleanup the timeout
  }, [searchTerm]);

  // Filter users based on the search term, excluding already selected users
  const filteredUsers = matchedUsers.filter(
    (user) => !shareWith.some((selected) => selected.id === user.id)
  );

  // Handle adding user to "Share with" list
  const handleSelectUser = (user: User) => {
    setShareWith((prev) => [...prev, user]);
    // setSearchTerm(""); // Clear the search field after selection
  };

  // Handle removing user from "Share with" list
  const handleRemoveUser = (userId: string) => {
    setShareWith((prev) => prev.filter((user) => user.id !== userId));
  };

  const PublicSwitch = () => {
    if (data === undefined || data === null) return null;

    if (data?.user?.isAdmin) {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            name="isPublished"
            defaultChecked={persona.isPublished}
            checked={isPublic}
            onCheckedChange={(checked) => setIsPublic(checked)}
          />
          <TooltipProvider>
            <div>
              <label htmlFor="description" className="flex items-center">
                Share with entire Org
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info
                      size={16}
                      className="ml-2 cursor-pointer"
                      aria-label="Info"
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    style={{ maxWidth: "24rem" }}
                    side="top"
                    align="center"
                  >
                    This will share with the entire organization. All users will
                    be able to see this. Sharing with specific users will be
                    disabled.
                  </TooltipContent>
                </Tooltip>
              </label>
            </div>
          </TooltipProvider>
        </div>
      );
    }
  };

  useEffect(() => {
    if (isOpened && persona.id) {
      if (persona.shareWith && persona.shareWith.length) {
        setShareWith([...persona.shareWith]);
      }
    }
  }, [isOpened, persona.id, persona.shareWith]);

  useEffect(() => {
    if (!isOpened || isPublic) {
      setShareWith([]);
      setSearchTerm("");
    }
  }, [isOpened, isPublic]);

  return (
    <Sheet
      open={isOpened}
      onOpenChange={(value) => {
        personaStore.updateOpened(value);
      }}
    >
      <SheetContent className="min-w-[480px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Persona</SheetTitle>
        </SheetHeader>
        <form action={formAction} className="flex-1 flex flex-col">
          <ScrollArea
            className="flex-1 -mx-6 flex max-h-[calc(100vh-140px)]"
            type="always"
          >
            <div className="pb-6 px-6 flex gap-8 flex-col  flex-1">
              <input type="hidden" name="id" defaultValue={persona.id} />
              {formState && formState.status === "OK" ? null : (
                <>
                  {formState &&
                    formState.errors.map((error, index) => (
                      <div key={index} className="text-red-500">
                        {error.message}
                      </div>
                    ))}
                </>
              )}
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  type="text"
                  required
                  name="name"
                  defaultValue={persona.name}
                  placeholder="Name of your persona"
                />
              </div>
              {/* "Share With" dropdown with chips */}
              <div className="grid gap-2">
                <Label htmlFor="shareWith" className="flex gap-2 items-center">
                  Share With
                  <LoadingIndicator isLoading={loading} />
                </Label>
                <div className="relative">
                  {/* Chips for selected users */}
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
                  {/* Search input */}
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for users by name or email"
                    disabled={isPublic}
                  />
                  {searchTerm && (
                    <div className="absolute z-10 rounded-lg w-full mt-2 max-h-40 overflow-y-auto bg-[#020817] border border-gray-700 text-white">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="p-2 cursor-pointer hover:bg-gray-700"
                          onClick={() => handleSelectUser(user)}
                        >
                          {user.displayName} - {user.userPrincipalName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Short description</Label>
                <Input
                  type="text"
                  required
                  defaultValue={persona.description}
                  name="description"
                  placeholder="Short description"
                />
              </div>
              <div className="grid gap-2 flex-1 ">
                <Label htmlFor="personaMessage">Personality</Label>
                <Textarea
                  className="min-h-[300px]"
                  required
                  defaultValue={persona.personaMessage}
                  name="personaMessage"
                  placeholder="Personality of your persona"
                />
              </div>
            </div>
          </ScrollArea>
          <SheetFooter className="py-2 flex sm:justify-between flex-row">
            <PublicSwitch />
            <input
              type="hidden"
              name="shareWith"
              value={JSON.stringify(shareWith)} // Serialize shareWith to JSON
            />
            <Submit />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

function Submit() {
  const status = useFormStatus();
  return (
    <Button disabled={status.pending} className="gap-2">
      <LoadingIndicator isLoading={status.pending} />
      Save
    </Button>
  );
}
