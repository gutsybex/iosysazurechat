import { FC } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { AddExtension } from "./add-extension/add-new-extension";
import { ExtensionCard } from "./extension-card/extension-card";
import { ExtensionHero } from "./extension-hero/extension-hero";
import { ExtensionModel } from "./extension-services/models";

interface Props {
  extensions: ExtensionModel[];
  users: any[]; // Add users prop here
}

export const ExtensionPage: FC<Props> = ({ extensions, users }) => {
  return (
    <ScrollArea className="flex-1">
      <main className="flex flex-1 flex-col">
        <ExtensionHero />
        <div className="container max-w-4xl py-3">
          <div className="grid grid-cols-3 gap-3">
            {extensions.map((extension) => {
              return (
                <ExtensionCard
                  extension={extension}
                  key={extension.id}
                  showContextMenu
                />
              );
            })}
          </div>
        </div>
        <AddExtension users={users} />
      </main>
    </ScrollArea>
  );
};
