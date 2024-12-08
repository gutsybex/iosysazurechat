import { ChatPersonaPage } from "@/features/persona-page/persona-page";
import { FindAllPersonaForCurrentUser } from "@/features/persona-page/persona-services/persona-service";
import { DisplayError } from "@/features/ui/error/display-error";

// This function fetches users from Azure AD
async function fetchAzureUsers() {
  try {
    const tenantId = process.env.AZURE_AD_TENANT_ID;
    const clientId = process.env.AZURE_AD_CLIENT_ID;
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error("Missing required environment variables");
    }

    // Use ClientSecretCredential to authenticate
    const { ClientSecretCredential } = require("@azure/identity");
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret
    );

    // Get the access token for Microsoft Graph API
    const token = await credential.getToken(
      "https://graph.microsoft.com/.default"
    );

    if (!token) {
      throw new Error("Unable to retrieve token from Azure AD");
    }

    // Microsoft Graph API URL to get all users
    const graphApiUrl = "https://graph.microsoft.com/v1.0/users";

    // Fetch the users
    const response = await fetch(graphApiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching users: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value; // This will return the list of users
  } catch (error) {
    console.error("Error fetching users:", error);
    return { error: "Error fetching users from Azure AD" };
  }
}

export default async function Home() {
  // Fetch personas for the current user
  const personasResponse = await FindAllPersonaForCurrentUser();

  if (personasResponse.status !== "OK") {
    return <DisplayError errors={personasResponse.errors} />;
  }

  // Fetch users from Azure AD
  const usersResponse = await fetchAzureUsers();

  if (usersResponse.error) {
    return <DisplayError errors={[usersResponse.error]} />;
  }

  // Now pass users data to the component
  return (
    <ChatPersonaPage
      personas={personasResponse.response}
      users={usersResponse} // Pass the users to the component
    />
  );
}
