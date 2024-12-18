import { ExtensionPage } from "@/features/extensions-page/extension-page";
import { FindAllExtensionForCurrentUser } from "@/features/extensions-page/extension-services/extension-service";
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
    let graphApiUrl = "https://graph.microsoft.com/v1.0/users?$filter=userType eq 'Member' and accountEnabled eq true and endswith(userPrincipalName, '@techschweiz.com')&$count=true&$top=999"
    let allUsers: any[] = [];
    var apiCallCount = 1;

    // Fetch users until there are no more pages
    while (graphApiUrl) {
      const response = await fetch(graphApiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token.token}`,
          "Content-Type": "application/json",
          "ConsistencyLevel":"eventual"
        },
        
      });

      if (!response.ok) {
        
        throw new Error(`Error fetching users: ${response.statusText}`);
      }

      const data = await response.json();
      allUsers = [...allUsers, ...data.value];
      graphApiUrl = data["@odata.nextLink"];
      console.log("User Count: ",data["@odata.count"]);
      console.log("APICall Count: ",apiCallCount++);
      console.log("ALL User Count: ",allUsers.length);
    }

    return {
      status: "OK",
      error: [
        {
          message: '',
        },
      ],
      errors: [{ message:'' }],
      users:allUsers // This will return the list of users

    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      status: "ERROR",
      error,
      errors: [{ message: `Error fetching users from AD: ${error}` }],
    };
  }
}

export default async function Home() {
  const extensionResponse = await FindAllExtensionForCurrentUser();

  if (extensionResponse.status !== "OK") {
    return <DisplayError errors={extensionResponse.errors} />;
  }

  // Fetch users from Azure AD
  const usersResponse = await fetchAzureUsers();

  if (usersResponse.status== "ERROR") {
    return <DisplayError errors={usersResponse.errors} />;
  }

  return (
    <ExtensionPage
      extensions={extensionResponse.response}
      users={usersResponse.users!} // Pass the users to the component
    />
  );
}
