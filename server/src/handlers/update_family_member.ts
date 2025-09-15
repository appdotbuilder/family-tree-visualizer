import { db } from '../db';
import { familyMembersTable } from '../db/schema';
import { type UpdateFamilyMemberInput, type FamilyMember } from '../schema';
import { eq } from 'drizzle-orm';

export const updateFamilyMember = async (input: UpdateFamilyMemberInput): Promise<FamilyMember | null> => {
  try {
    const { id, ...updateFields } = input;

    // Check if family member exists
    const existingMember = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, id))
      .execute();

    if (existingMember.length === 0) {
      return null;
    }

    // Build update object with proper typing and date conversion
    const fieldsToUpdate: Partial<typeof familyMembersTable.$inferInsert> = {};
    
    if (updateFields.first_name !== undefined) {
      fieldsToUpdate.first_name = updateFields.first_name;
    }
    
    if (updateFields.last_name !== undefined) {
      fieldsToUpdate.last_name = updateFields.last_name;
    }
    
    if (updateFields.birth_date !== undefined) {
      // Convert Date to string for database storage, or keep null
      fieldsToUpdate.birth_date = updateFields.birth_date ? updateFields.birth_date.toISOString().split('T')[0] : null;
    }
    
    if (updateFields.death_date !== undefined) {
      // Convert Date to string for database storage, or keep null
      fieldsToUpdate.death_date = updateFields.death_date ? updateFields.death_date.toISOString().split('T')[0] : null;
    }
    
    if (updateFields.picture_url !== undefined) {
      fieldsToUpdate.picture_url = updateFields.picture_url;
    }

    // If no fields to update, return the existing member with converted dates
    if (Object.keys(fieldsToUpdate).length === 0) {
      return {
        ...existingMember[0],
        birth_date: existingMember[0].birth_date ? new Date(existingMember[0].birth_date) : null,
        death_date: existingMember[0].death_date ? new Date(existingMember[0].death_date) : null,
        created_at: new Date(existingMember[0].created_at)
      };
    }

    // Update the family member
    const result = await db.update(familyMembersTable)
      .set(fieldsToUpdate)
      .where(eq(familyMembersTable.id, id))
      .returning()
      .execute();

    // Convert date strings back to Date objects
    const updatedMember = result[0];
    return {
      ...updatedMember,
      birth_date: updatedMember.birth_date ? new Date(updatedMember.birth_date) : null,
      death_date: updatedMember.death_date ? new Date(updatedMember.death_date) : null,
      created_at: new Date(updatedMember.created_at)
    };
  } catch (error) {
    console.error('Family member update failed:', error);
    throw error;
  }
};