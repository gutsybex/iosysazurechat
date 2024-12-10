import { proxy, useSnapshot } from "valtio";
import { RevalidateCache } from "../common/navigation-helpers";
import { PERSONA_ATTRIBUTE, PersonaModel } from "./persona-services/models";
import {
  CreatePersona,
  UpsertPersona,
} from "./persona-services/persona-service";

// Correct User type definition
interface User {
  id: string;
  displayName: string;
  userPrincipalName: string;
}

class PersonaState {
  private defaultModel: PersonaModel = {
    id: "",
    name: "",
    description: "",
    personaMessage: "",
    createdAt: new Date(),
    isPublished: false,
    type: "PERSONA",
    userId: "",
    shareWith: [], // Default empty array
  };

  public isOpened: boolean = false;
  public errors: string[] = [];
  public persona: PersonaModel = { ...this.defaultModel };

  public updateOpened(value: boolean) {
    this.isOpened = value;
  }

  public updatePersona(persona: PersonaModel) {
    this.persona = { ...persona };
    this.isOpened = true;
  }

  public newPersona() {
    this.persona = { ...this.defaultModel };
    this.isOpened = true;
  }

  public newPersonaAndOpen(persona: {
    name: string;
    description: string;
    personaMessage: string;
  }) {
    this.persona = {
      ...this.defaultModel,
      name: persona.name,
      description: persona.description,
      personaMessage: persona.personaMessage,
    };
    this.isOpened = true;
  }

  public updateErrors(errors: string[]) {
    this.errors = errors;
  }
}

export const personaStore = proxy(new PersonaState());

export const usePersonaState = () => {
  return useSnapshot(personaStore);
};

export const addOrUpdatePersona = async (previous: any, formData: FormData) => {
  personaStore.updateErrors([]);

  const model = FormDataToPersonaModel(formData);

  const response =
    model.id && model.id !== ""
      ? await UpsertPersona(model)
      : await CreatePersona(model);

  if (response.status === "OK") {
    personaStore.updateOpened(false);
    RevalidateCache({ page: "persona" });
  } else {
    personaStore.updateErrors(response.errors.map((e) => e.message));
  }
  return response;
};

// Corrected Type-safe Model Conversion
export const FormDataToPersonaModel = (formData: FormData): PersonaModel => {
  const shareWithData = formData.get("shareWith") as string | null;
  let shareWith: User[] = [];

  if (shareWithData) {
    try {
      const parsedShareWith = JSON.parse(shareWithData) as Partial<User>[];

      // Correct type-checking filter
      shareWith = parsedShareWith.filter(
        (user): user is User =>
          typeof user.id === "string" &&
          typeof user.displayName === "string" &&
          typeof user.userPrincipalName === "string"
      );
    } catch (e) {
      console.error("Error parsing shareWith:", e);
    }
  }

  return {
    id: formData.get("id") as string,
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    personaMessage: formData.get("personaMessage") as string,
    isPublished: formData.get("isPublished") === "on",
    userId: "", // Will be set on the server
    createdAt: new Date(),
    type: PERSONA_ATTRIBUTE,
    shareWith, // Correctly typed list
  };
};