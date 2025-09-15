import { db } from '../db';
import { familyMembersTable } from '../db/schema';
import { type FamilyMember } from '../schema';

export const getFamilyMembers = async (): Promise<FamilyMember[]> => {
  try {
    const result = await db.select()
      .from(familyMembersTable)
      .orderBy(familyMembersTable.created_at)
      .execute();

    // Convert string dates back to Date objects
    return result.map(member => ({
      ...member,
      birth_date: member.birth_date ? new Date(member.birth_date) : null,
      death_date: member.death_date ? new Date(member.death_date) : null,
      created_at: new Date(member.created_at)
    }));
  } catch (error) {
    console.error('Failed to get family members:', error);
    throw error;
  }
};