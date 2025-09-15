import { db } from '../db';
import { parentChildTable, familyMembersTable } from '../db/schema';
import { type CreateParentChildInput, type ParentChild } from '../schema';
import { eq } from 'drizzle-orm';

export async function createParentChildRelation(input: CreateParentChildInput): Promise<ParentChild> {
  try {
    // Verify that both parent and child exist
    const [parentExists, childExists] = await Promise.all([
      db.select({ id: familyMembersTable.id })
        .from(familyMembersTable)
        .where(eq(familyMembersTable.id, input.parent_id))
        .limit(1)
        .execute(),
      db.select({ id: familyMembersTable.id })
        .from(familyMembersTable)
        .where(eq(familyMembersTable.id, input.child_id))
        .limit(1)
        .execute()
    ]);

    if (parentExists.length === 0) {
      throw new Error(`Parent with ID ${input.parent_id} does not exist`);
    }

    if (childExists.length === 0) {
      throw new Error(`Child with ID ${input.child_id} does not exist`);
    }

    // Insert parent-child relationship
    const result = await db.insert(parentChildTable)
      .values({
        parent_id: input.parent_id,
        child_id: input.child_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Parent-child relation creation failed:', error);
    throw error;
  }
}