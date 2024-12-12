import { refineFromEmpty } from "@/features/common/schema-validation";
import { z } from "zod";

export const EXTENSION_ATTRIBUTE = "EXTENSION";

export type ExtensionModel = z.infer<typeof ExtensionModelSchema>;
export type ExtensionFunctionModel = z.infer<typeof ExtensionFunctionSchema>;
export type HeaderModel = z.infer<typeof HeaderSchema>;

export const UserSchema = z.object({
  id: z.string(),
  displayName: z.string().min(1), // Assuming displayName should be a non-empty string
  userPrincipalName: z.string().email(), // Assuming userPrincipalName should be an email address
});

export const HeaderSchema = z.object({
  id: z.string(),
  key: z
    .string()
    .min(1, {
      message: "Header key cannot be empty",
    })
    .refine(refineFromEmpty, "Header key cannot be empty"),
  value: z
    .string()
    .min(1, {
      message: "Header value cannot be empty",
    })
    .refine(refineFromEmpty, "Header value cannot be empty"),
});

export type EndpointType = z.infer<typeof EndpointTypeSchema>;

export const EndpointTypeSchema = z.enum([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

export const ExtensionFunctionSchema = z.object({
  id: z.string({ required_error: "Function ID is required" }),
  code: z
    .string()
    .min(1, {
      message: "Function code cannot be empty",
    })
    .refine(refineFromEmpty, "Function code cannot be empty"),
  endpoint: z
    .string()
    .min(1, {
      message: "Function endpoint cannot be empty",
    })
    .refine(refineFromEmpty, "Function endpoint cannot be empty"),
  endpointType: EndpointTypeSchema,
  isOpen: z.boolean(),
});

export const ExtensionModelSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z
    .string({ invalid_type_error: "Invalid title" })
    .min(1)
    .refine(refineFromEmpty, "Title cannot be empty"),
  description: z
    .string({ invalid_type_error: "Invalid description" })
    .min(1)
    .refine(refineFromEmpty, "Description cannot be empty"),
  executionSteps: z
    .string({ invalid_type_error: "Invalid execution steps" })
    .min(1)
    .refine(refineFromEmpty, "Execution steps cannot be empty"),
  isPublished: z.boolean(),
  type: z.literal(EXTENSION_ATTRIBUTE),
  createdAt: z.date(),
  functions: z.array(z.any()),
  headers: z.array(z.any()),
  shareWith: z
    .array(
      z.object({
        id: z.string(),
        displayName: z.string(),
        userPrincipalName: z.string(),
      })
    ),
});
