import { z } from 'zod';

// Family member schema with proper date and nullable field handling
export const familyMemberSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  birth_date: z.coerce.date().nullable(), // Can be null if unknown
  death_date: z.coerce.date().nullable(), // Can be null if still alive
  picture_url: z.string().nullable(), // Can be null if no picture available
  created_at: z.coerce.date()
});

export type FamilyMember = z.infer<typeof familyMemberSchema>;

// Marriage schema to represent marriages between family members
export const marriageSchema = z.object({
  id: z.number(),
  person1_id: z.number(),
  person2_id: z.number(),
  marriage_date: z.coerce.date().nullable(), // Can be null if date unknown
  divorce_date: z.coerce.date().nullable(), // Can be null if still married or date unknown
  created_at: z.coerce.date()
});

export type Marriage = z.infer<typeof marriageSchema>;

// Parent-child relationship schema
export const parentChildSchema = z.object({
  id: z.number(),
  parent_id: z.number(),
  child_id: z.number(),
  created_at: z.coerce.date()
});

export type ParentChild = z.infer<typeof parentChildSchema>;

// Input schema for creating family members
export const createFamilyMemberInputSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  birth_date: z.coerce.date().nullable(),
  death_date: z.coerce.date().nullable(),
  picture_url: z.string().url().nullable()
});

export type CreateFamilyMemberInput = z.infer<typeof createFamilyMemberInputSchema>;

// Input schema for updating family members
export const updateFamilyMemberInputSchema = z.object({
  id: z.number(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  birth_date: z.coerce.date().nullable().optional(),
  death_date: z.coerce.date().nullable().optional(),
  picture_url: z.string().url().nullable().optional()
});

export type UpdateFamilyMemberInput = z.infer<typeof updateFamilyMemberInputSchema>;

// Input schema for creating marriages
export const createMarriageInputSchema = z.object({
  person1_id: z.number(),
  person2_id: z.number(),
  marriage_date: z.coerce.date().nullable(),
  divorce_date: z.coerce.date().nullable()
});

export type CreateMarriageInput = z.infer<typeof createMarriageInputSchema>;

// Input schema for creating parent-child relationships
export const createParentChildInputSchema = z.object({
  parent_id: z.number(),
  child_id: z.number()
});

export type CreateParentChildInput = z.infer<typeof createParentChildInputSchema>;

// Schema for family member with relationships (for detailed view)
export const familyMemberWithRelationshipsSchema = z.object({
  member: familyMemberSchema,
  parents: z.array(familyMemberSchema),
  children: z.array(familyMemberSchema),
  spouses: z.array(z.object({
    spouse: familyMemberSchema,
    marriage: marriageSchema
  }))
});

export type FamilyMemberWithRelationships = z.infer<typeof familyMemberWithRelationshipsSchema>;

// Schema for family tree network data
export const familyTreeNetworkSchema = z.object({
  members: z.array(familyMemberSchema),
  marriages: z.array(marriageSchema),
  parentChildRelations: z.array(parentChildSchema)
});

export type FamilyTreeNetwork = z.infer<typeof familyTreeNetworkSchema>;