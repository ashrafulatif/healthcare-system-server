import z from "zod";

export const updateAdminZodSchema = z.object({
  admin: z.object({
    name: z.string("Name must be a string").optional(),
    profilePhoto: z.url("Profile photo must be a valid url").optional(),
    contactNumber: z
      .string("Contact number must be a string")
      .min(11, "Contact number should be atleast 11 character")
      .max(15, "Contact number must be withing 15 character")
      .optional(),
  }),
});
