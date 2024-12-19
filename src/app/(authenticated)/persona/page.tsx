import { ChatPersonaPage } from "@/features/persona-page/persona-page";
import { FindAllPersonaForCurrentUser } from "@/features/persona-page/persona-services/persona-service";
import { DisplayError } from "@/features/ui/error/display-error";

export default async function Home() {
  // Fetch personas for the current user
  const personasResponse = await FindAllPersonaForCurrentUser();

  if (personasResponse.status !== "OK") {
    return <DisplayError errors={personasResponse.errors} />;
  }

  // Now pass users data to the component
  return <ChatPersonaPage personas={personasResponse.response} />;
}
