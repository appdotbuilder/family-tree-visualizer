import { db } from '../db';
import { familyMembersTable } from '../db/schema';
import { type CreateFamilyMemberInput, type FamilyMember } from '../schema';

export const createFamilyMember = async (input: CreateFamilyMemberInput): Promise<FamilyMember> => {
  try {
    // Insert family member record
    const result = await db.insert(familyMembersTable)
      .values({
        first_name: input.first_name,
        last_name: input.last_name,
        birth_date: input.birth_date ? input.birth_date.toISOString().split('T')[0] : null, // Convert Date to date string
        death_date: input.death_date ? input.death_date.toISOString().split('T')[0] : null, // Convert Date to date string
        picture_url: input.picture_url
      })
      .returning()
      .execute();

    const familyMember = result[0];
    return {
      ...familyMember,
      birth_date: familyMember.birth_date ? new Date(familyMember.birth_date) : null, // Convert back to Date
      death_date: familyMember.death_date ? new Date(familyMember.death_date) : null // Convert back to Date
    };
  } catch (error) {
    console.error('Family member creation failed:', error);
    throw error;
  }
};