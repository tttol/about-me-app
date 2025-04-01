import z from "zod";
import { CreateItemException } from "../exception/exceptions";

const schema = z.object({
    name: z
      .string({
        required_error: "Name is required.",
      })
      .min(1, "At least 1 character is required.")
      .trim(),
  });
  
export const validateForm = (formData: FormData) => {
  const parse = schema.safeParse({
    name: formData.get("name"),
  });
  if (!parse.success) {
    console.log("parse error", parse.error);
    throw new CreateItemException("Validation error.");
  }
};

