import { z } from 'zod';

// Family member schema
export const familyMemberSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  birth_date: z.coerce.date().nullable(),
  gender: z.enum(['male', 'female', 'other']).nullable(),
  created_at: z.coerce.date()
});

export type FamilyMember = z.infer<typeof familyMemberSchema>;

// Input schema for creating family members
export const createFamilyMemberInputSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  birth_date: z.coerce.date().nullable(),
  gender: z.enum(['male', 'female', 'other']).nullable()
});

export type CreateFamilyMemberInput = z.infer<typeof createFamilyMemberInputSchema>;

// Input schema for updating family members
export const updateFamilyMemberInputSchema = z.object({
  id: z.number(),
  first_name: z.string().min(1, "First name is required").optional(),
  last_name: z.string().min(1, "Last name is required").optional(),
  birth_date: z.coerce.date().nullable().optional(),
  gender: z.enum(['male', 'female', 'other']).nullable().optional()
});

export type UpdateFamilyMemberInput = z.infer<typeof updateFamilyMemberInputSchema>;

// Marriage relationship schema
export const marriageSchema = z.object({
  id: z.number(),
  spouse1_id: z.number(),
  spouse2_id: z.number(),
  marriage_date: z.coerce.date().nullable(),
  divorce_date: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type Marriage = z.infer<typeof marriageSchema>;

// Input schema for creating marriages
export const createMarriageInputSchema = z.object({
  spouse1_id: z.number().positive("Spouse 1 ID must be a positive number"),
  spouse2_id: z.number().positive("Spouse 2 ID must be a positive number"),
  marriage_date: z.coerce.date().nullable(),
  divorce_date: z.coerce.date().nullable()
}).refine(data => data.spouse1_id !== data.spouse2_id, {
  message: "A person cannot marry themselves",
  path: ["spouse2_id"]
}).refine(data => {
  if (data.marriage_date && data.divorce_date) {
    return data.marriage_date <= data.divorce_date;
  }
  return true;
}, {
  message: "Divorce date must be after marriage date",
  path: ["divorce_date"]
});

export type CreateMarriageInput = z.infer<typeof createMarriageInputSchema>;

// Input schema for updating marriages
export const updateMarriageInputSchema = z.object({
  id: z.number(),
  marriage_date: z.coerce.date().nullable().optional(),
  divorce_date: z.coerce.date().nullable().optional()
}).refine(data => {
  if (data.marriage_date && data.divorce_date) {
    return data.marriage_date <= data.divorce_date;
  }
  return true;
}, {
  message: "Divorce date must be after marriage date",
  path: ["divorce_date"]
});

export type UpdateMarriageInput = z.infer<typeof updateMarriageInputSchema>;

// Parent-child relationship schema
export const parentChildSchema = z.object({
  id: z.number(),
  parent_id: z.number(),
  child_id: z.number(),
  created_at: z.coerce.date()
});

export type ParentChild = z.infer<typeof parentChildSchema>;

// Input schema for creating parent-child relationships
export const createParentChildInputSchema = z.object({
  parent_id: z.number().positive("Parent ID must be a positive number"),
  child_id: z.number().positive("Child ID must be a positive number")
}).refine(data => data.parent_id !== data.child_id, {
  message: "A person cannot be their own parent",
  path: ["child_id"]
});

export type CreateParentChildInput = z.infer<typeof createParentChildInputSchema>;

// Extended family member schema with relationships
export const familyMemberWithRelationshipsSchema = familyMemberSchema.extend({
  marriages: z.array(marriageSchema),
  parent_relationships: z.array(parentChildSchema),
  child_relationships: z.array(parentChildSchema)
});

export type FamilyMemberWithRelationships = z.infer<typeof familyMemberWithRelationshipsSchema>;