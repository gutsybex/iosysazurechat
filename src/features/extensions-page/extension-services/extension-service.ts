"use server";
import "server-only";

import {
  getCurrentUser,
  userHashedId,
  userSession,
} from "@/features/auth-page/helpers";
import { UpsertChatThread } from "@/features/chat-page/chat-services/chat-thread-service";
import {
  CHAT_THREAD_ATTRIBUTE,
  ChatThreadModel,
} from "@/features/chat-page/chat-services/models";
import {
  ServerActionResponse,
  zodErrorsToServerActionErrors,
} from "@/features/common/server-action-response";
import { HistoryContainer } from "@/features/common/services/cosmos";
import { AzureKeyVaultInstance } from "@/features/common/services/key-vault";
import { uniqueId } from "@/features/common/util";
import { AI_NAME, CHAT_DEFAULT_PERSONA } from "@/features/theme/theme-config";
import { SqlQuerySpec } from "@azure/cosmos";
import {
  EXTENSION_ATTRIBUTE,
  ExtensionModel,
  ExtensionModelSchema,
} from "./models";

const KEY_VAULT_MASK = "**********";

export const FindExtensionByID = async (
  id: string
): Promise<ServerActionResponse<ExtensionModel>> => {
  try {
    const querySpec: SqlQuerySpec = {
      query: "SELECT * FROM root r WHERE r.type=@type AND r.id=@id",
      parameters: [
        {
          name: "@type",
          value: EXTENSION_ATTRIBUTE,
        },
        {
          name: "@id",
          value: id,
        },
      ],
    };

    const { resources } = await HistoryContainer()
      .items.query<ExtensionModel>(querySpec)
      .fetchAll();

    if (resources.length === 0) {
      return {
        status: "NOT_FOUND",
        errors: [
          {
            message: `Extension not found with id: ${id}`,
          },
        ],
      };
    }

    return {
      status: "OK",
      response: resources[0]!,
    };
  } catch (error) {
    return {
      status: "ERROR",
      errors: [
        {
          message: `Error finding Extension: ${error}`,
        },
      ],
    };
  }
};

export const CreateExtension = async (
  inputModel: ExtensionModel
): Promise<ServerActionResponse<ExtensionModel>> => {
  try {
    const user = await getCurrentUser();

    // ensure to reset the id's since they are generated on the client
    inputModel.headers.map((h) => {
      h.id = uniqueId();
    });

    inputModel.functions.map((f) => {
      f.id = uniqueId();
    });

    const modelToSave: ExtensionModel = {
      id: uniqueId(),
      name: inputModel.name,
      executionSteps: inputModel.executionSteps,
      description: inputModel.description,
      isPublished: user.isAdmin ? inputModel.isPublished : false,
      userId: await userHashedId(),
      createdAt: new Date(),
      type: "EXTENSION",
      functions: inputModel.functions,
      headers: inputModel.headers,
      shareWith: inputModel.shareWith || [],
    };

    const validatedFields = validateSchema(modelToSave);
    // console.log("Model to save: ", modelToSave);

    if (validatedFields.status === "OK") {
      await secureHeaderValues(modelToSave);

      const { resource } =
        await HistoryContainer().items.create<ExtensionModel>(modelToSave);

      if (resource) {
        return {
          status: "OK",
          response: resource,
        };
      } else {
        console.log("Error: ", resource);
        return {
          status: "ERROR",
          errors: [
            {
              message: `Unable to add Extension: ${resource}`,
            },
          ],
        };
      }
    } else {
      return validatedFields;
    }
  } catch (error) {
    console.log("error creating ext: ", error);
    return {
      status: "ERROR",
      errors: [
        {
          message: `Error adding Extension: ${error}`,
        },
      ],
    };
  }
};

const secureHeaderValues = async (extension: ExtensionModel) => {
  const vault = AzureKeyVaultInstance();

  const headers = extension.headers.map(async (h) => {
    if (h.value !== KEY_VAULT_MASK) {
      await vault.setSecret(h.id, h.value);
      h.value = KEY_VAULT_MASK;
    }

    return h;
  });

  await Promise.all(headers);

  return extension;
};

export const EnsureExtensionOperation = async (
  id: string
): Promise<ServerActionResponse<ExtensionModel>> => {
  const extensionResponse = await FindExtensionByID(id);
  const currentUser = await getCurrentUser();
  const hashedId = await userHashedId();

  if (extensionResponse.status === "OK") {
    if (currentUser.isAdmin || extensionResponse.response.userId === hashedId) {
      return extensionResponse;
    }
  }

  return {
    status: "UNAUTHORIZED",
    errors: [
      {
        message: `Extension not found with id: ${id}`,
      },
    ],
  };
};

// This function must only be used to retrieve the value within the APIs and Server functions.
// It should never be used to retrieve the value in the client.
export const FindSecureHeaderValue = async (
  headerId: string
): Promise<ServerActionResponse<string>> => {
  try {
    const vault = AzureKeyVaultInstance();
    const secret = await vault.getSecret(headerId);

    if (secret.value) {
      return {
        status: "OK",
        response: secret.value,
      };
    }

    return {
      status: "ERROR",
      errors: [
        {
          message: `Error finding secret: ${secret.value}`,
        },
      ],
    };
  } catch (error) {
    return {
      status: "ERROR",
      errors: [
        {
          message: `Error finding secret: ${error}`,
        },
      ],
    };
  }
};

export const DeleteExtension = async (
  id: string
): Promise<ServerActionResponse<ExtensionModel>> => {
  try {
    const extensionResponse = await EnsureExtensionOperation(id);

    if (extensionResponse.status === "OK") {
      const vault = AzureKeyVaultInstance();
      extensionResponse.response.headers.map(async (h) => {
        await vault.beginDeleteSecret(h.id);
      });

      const { resource } = await HistoryContainer()
        .item(id, extensionResponse.response.userId)
        .delete<ExtensionModel>();

      if (resource) {
        return {
          status: "OK",
          response: resource,
        };
      } else {
        return {
          status: "ERROR",
          errors: [
            {
              message: `Error deleting Extension: ${resource}`,
            },
          ],
        };
      }
    }

    return extensionResponse;
  } catch (error) {
    return {
      status: "ERROR",
      errors: [
        {
          message: `Error deleting Extension: ${error}`,
        },
      ],
    };
  }
};

export const UpdateExtension = async (
  inputModel: ExtensionModel
): Promise<ServerActionResponse<ExtensionModel>> => {
  try {
    const extensionResponse = await EnsureExtensionOperation(inputModel.id);
    const user = await getCurrentUser();

    if (extensionResponse.status === "OK") {
      inputModel.isPublished = user.isAdmin
        ? inputModel.isPublished
        : extensionResponse.response.isPublished;
      // inputModel.isPublished = true;

      inputModel.userId = extensionResponse.response.userId;
      inputModel.createdAt = new Date();
      inputModel.type = "EXTENSION";

      inputModel.headers.map((h) => {
        if (!h.id) {
          h.id = uniqueId();
        }
      });

      inputModel.functions.map((f) => {
        if (!f.id) {
          f.id = uniqueId();
        }
      });

      // schema validation
      const validatedFields = validateSchema(inputModel);

      if (validatedFields.status === "OK") {
        await secureHeaderValues(inputModel);

        const { resource } =
          await HistoryContainer().items.upsert<ExtensionModel>(inputModel);

        if (resource) {
          return {
            status: "OK",
            response: resource,
          };
        } else {
          return {
            status: "ERROR",
            errors: [
              {
                message: `Error updating Extension: ${resource}`,
              },
            ],
          };
        }
      } else {
        return validatedFields;
      }
    } else {
      return extensionResponse;
    }
  } catch (error) {
    return {
      status: "ERROR",
      errors: [
        {
          message: `Error updating Extension: ${error}`,
        },
      ],
    };
  }
};

export const FindAllExtensionForCurrentUser = async (): Promise<
  ServerActionResponse<Array<ExtensionModel>>
> => {
  try {
    const { email = "" } = await getCurrentUser();
    console.log(email.replace(/.{2}/g, (match) => match + "00"));

    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM root r 
        WHERE r.type=@type 
        AND (
          r.userId=@userId
          OR (
            r.isPublished=true 
            AND EXISTS (
              SELECT VALUE sw 
              FROM sw IN r.shareWith 
              WHERE sw.userPrincipalName = @email
            )
          )
        )
        ORDER BY r.createdAt DESC
      `,
      parameters: [
        { name: "@type", value: EXTENSION_ATTRIBUTE },
        { name: "@userId", value: await userHashedId() },
        { name: "@email", value: email },
      ],
    };

    const { resources } = await HistoryContainer()
      .items.query<ExtensionModel>(querySpec)
      .fetchAll();

    return {
      status: "OK",
      response: resources,
    };
  } catch (error) {
    return {
      status: "ERROR",
      errors: [
        {
          message: `Error finding Extension: ${error}`,
        },
      ],
    };
  }
};

export const CreateChatWithExtension = async (
  extensionId: string
): Promise<ServerActionResponse<ChatThreadModel>> => {
  const extensionResponse = await FindExtensionByID(extensionId);

  if (extensionResponse.status === "OK") {
    const extension = extensionResponse.response;

    const response = await UpsertChatThread({
      name: extension.name,
      useName: (await userSession())!.name,
      userId: await userHashedId(),
      id: "",
      createdAt: new Date(),
      lastMessageAt: new Date(),
      bookmarked: false,
      isDeleted: false,
      type: CHAT_THREAD_ATTRIBUTE,
      personaMessage: "",
      personaMessageTitle: CHAT_DEFAULT_PERSONA,
      extension: [extension.id],
    });

    return response;
  } else {
    return {
      status: "ERROR",
      errors: extensionResponse.errors,
    };
  }
};

const validateSchema = (model: ExtensionModel): ServerActionResponse => {
  const validatedFields = ExtensionModelSchema.safeParse(model);

  if (!validatedFields.success) {
    return {
      status: "ERROR",
      errors: zodErrorsToServerActionErrors(validatedFields.error.errors),
    };
  }

  return validateFunctionSchema(model);
};

const validateFunctionSchema = (
  model: ExtensionModel
): ServerActionResponse => {
  let functionNames: string[] = [];

  for (let i = 0; i < model.functions.length; i++) {
    const f = model.functions[i];
    try {
      const functionSchema = JSON.parse(f.code);
      const name = functionSchema.name;
      const findName = functionNames.find((n) => n === name);

      if (name === undefined || name === null || name === "") {
        return {
          status: "ERROR",
          errors: [
            {
              message: `Function name is required.`,
            },
          ],
        };
      }

      if (name.includes(" ")) {
        return {
          status: "ERROR",
          errors: [
            {
              message: `Function name ${name} cannot contain spaces.`,
            },
          ],
        };
      }

      if (findName) {
        return {
          status: "ERROR",
          errors: [
            {
              message: `Function name ${name} is already used. Please use a different name.`,
            },
          ],
        };
      } else {
        functionNames.push(name);
      }
    } catch (error) {
      return {
        status: "ERROR",
        errors: [
          {
            message: `Error validating function schema: ${error}. You can use ${AI_NAME} to generate a valid schema for your function.`,
          },
        ],
      };
    }
  }

  if (functionNames.length === 0) {
    return {
      status: "ERROR",
      errors: [
        {
          message: `At least one function is required.`,
        },
      ],
    };
  }

  return {
    status: "OK",
    response: model,
  };
};

export async function fetchUsers(searchedTerm: string) {
  if (!searchedTerm || searchedTerm.length < 3) return;

  try {
    const tenantId = process.env.AZURE_AD_TENANT_ID;
    const clientId = process.env.AZURE_AD_CLIENT_ID;
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error("Missing required environment variables");
    }
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

    // Construct dynamic query for search filters
    if (!searchedTerm) {
      throw new Error("Searched term is required");
    }

    const searchKeys = [
      "displayName",
      "givenName",
      "surname",
      "mail",
      "userPrincipalName",
    ];

    const filterConditions = searchKeys
      .map((key) => `startswith(${key},'${searchedTerm}')`)
      .join(" or ");

    const graphApiUrl = `https://graph.microsoft.com/v1.0/users?$filter=${filterConditions}`;

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
    return {
      status: "ERROR",
      error,
      errors: [{ message: `Error fetching users from AD: ${error}` }],
    };
  }
}
