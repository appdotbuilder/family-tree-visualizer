import { db } from '../db';
import { marriagesTable, familyMembersTable } from '../db/schema';
import { type CreateMarriageInput, type Marriage } from '../schema';
import { eq } from 'drizzle-orm';

export const createMarriage = async (input: CreateMarriageInput): Promise<Marriage> => {
  try {
    // Verify both family members exist
    const person1 = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, input.person1_id))
      .execute();

    const person2 = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, input.person2_id))
      .execute();

    if (person1.length === 0) {
      throw new Error(`Person with ID ${input.person1_id} not found`);
    }

    if (person2.length === 0) {
      throw new Error(`Person with ID ${input.person2_id} not found`);
    }

    // Prevent self-marriage
    if (input.person1_id === input.person2_id) {
      throw new Error('A person cannot marry themselves');
    }

    // Insert marriage record
    const result = await db.insert(marriagesTable)
      .values({
        person1_id: input.person1_id,
        person2_id: input.person2_id,
        marriage_date: input.marriage_date ? input.marriage_date.toISOString().split('T')[0] : null,
        divorce_date: input.divorce_date ? input.divorce_date.toISOString().split('T')[0] : null
      })
      .returning()
      .execute();

    // Convert string dates back to Date objects
    const marriage = result[0];
    return {
      ...marriage,
      marriage_date: marriage.marriage_date ? new Date(marriage.marriage_date) : null,
      divorce_date: marriage.divorce_date ? new Date(marriage.divorce_date) : null,
      created_at: new Date(marriage.created_at)
    };
  } catch (error) {
    console.error('Marriage creation failed:', error);
    throw error;
  }
};