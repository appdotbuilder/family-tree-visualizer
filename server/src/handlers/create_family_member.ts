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
        birth_date: input.birth_date ? input.birth_date.toISOString().split('T')[0] : null,
        death_date: input.death_date ? input.death_date.toISOString().split('T')[0] : null,
        picture_url: input.picture_url
      })
      .returning()
      .execute();

    // Convert string dates back to Date objects
    const member = result[0];
    return {
      ...member,
      birth_date: member.birth_date ? new Date(member.birth_date) : null,
      death_date: member.death_date ? new Date(member.death_date) : null,
      created_at: new Date(member.created_at)
    };
  } catch (error) {
    console.error('Family member creation failed:', error);
    throw error;
  }
};