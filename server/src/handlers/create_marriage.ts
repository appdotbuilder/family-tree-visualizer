import { db } from '../db';
import { marriagesTable, familyMembersTable } from '../db/schema';
import { type CreateMarriageInput, type Marriage } from '../schema';
import { eq } from 'drizzle-orm';

export async function createMarriage(input: CreateMarriageInput): Promise<Marriage> {
  try {
    // Validate that both persons exist in the database
    const person1 = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, input.person1_id))
      .execute();
    
    if (person1.length === 0) {
      throw new Error(`Person with ID ${input.person1_id} not found`);
    }

    const person2 = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, input.person2_id))
      .execute();
    
    if (person2.length === 0) {
      throw new Error(`Person with ID ${input.person2_id} not found`);
    }

    // Prevent marriage to oneself
    if (input.person1_id === input.person2_id) {
      throw new Error('A person cannot marry themselves');
    }

    // Insert marriage record
    const result = await db.insert(marriagesTable)
      .values({
        person1_id: input.person1_id,
        person2_id: input.person2_id,
        marriage_date: input.marriage_date?.toISOString().split('T')[0] || null, // Convert Date to string format
        divorce_date: input.divorce_date?.toISOString().split('T')[0] || null // Convert Date to string format
      })
      .returning()
      .execute();

    // Convert date strings back to Date objects for response
    const marriage = result[0];
    return {
      ...marriage,
      marriage_date: marriage.marriage_date ? new Date(marriage.marriage_date) : null,
      divorce_date: marriage.divorce_date ? new Date(marriage.divorce_date) : null
    };
  } catch (error) {
    console.error('Marriage creation failed:', error);
    throw error;
  }
}