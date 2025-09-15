import { db } from '../db';
import { familyMembersTable } from '../db/schema';
import { type UpdateFamilyMemberInput, type FamilyMember } from '../schema';
import { eq } from 'drizzle-orm';

export const updateFamilyMember = async (input: UpdateFamilyMemberInput): Promise<FamilyMember> => {
  try {
    // Build update object with only defined fields
    const updateData: any = {};
    if (input.first_name !== undefined) updateData.first_name = input.first_name;
    if (input.last_name !== undefined) updateData.last_name = input.last_name;
    if (input.birth_date !== undefined) {
      updateData.birth_date = input.birth_date ? input.birth_date.toISOString().split('T')[0] : null;
    }
    if (input.death_date !== undefined) {
      updateData.death_date = input.death_date ? input.death_date.toISOString().split('T')[0] : null;
    }
    if (input.picture_url !== undefined) updateData.picture_url = input.picture_url;

    // Allow empty updates - just return the existing record if no fields are provided
    if (Object.keys(updateData).length === 0) {
      const existing = await db.select()
        .from(familyMembersTable)
        .where(eq(familyMembersTable.id, input.id))
        .execute();
      
      if (existing.length === 0) {
        return null as any;
      }
      
      const member = existing[0];
      return {
        ...member,
        birth_date: member.birth_date ? new Date(member.birth_date) : null,
        death_date: member.death_date ? new Date(member.death_date) : null,
        created_at: new Date(member.created_at)
      };
    }

    // Update family member record
    const result = await db.update(familyMembersTable)
      .set(updateData)
      .where(eq(familyMembersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null as any; // Return null for non-existent member
    }

    // Convert string dates back to Date objects
    const member = result[0];
    return {
      ...member,
      birth_date: member.birth_date ? new Date(member.birth_date) : null,
      death_date: member.death_date ? new Date(member.death_date) : null,
      created_at: new Date(member.created_at)
    };
  } catch (error) {
    console.error('Family member update failed:', error);
    throw error;
  }
};