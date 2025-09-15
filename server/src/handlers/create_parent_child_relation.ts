import { db } from '../db';
import { parentChildTable, familyMembersTable } from '../db/schema';
import { type CreateParentChildInput, type ParentChild } from '../schema';
import { eq } from 'drizzle-orm';

export const createParentChildRelation = async (input: CreateParentChildInput): Promise<ParentChild> => {
  try {
    // Verify both family members exist
    const parent = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, input.parent_id))
      .execute();

    const child = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, input.child_id))
      .execute();

    if (parent.length === 0) {
      throw new Error(`Parent with ID ${input.parent_id} does not exist`);
    }

    if (child.length === 0) {
      throw new Error(`Child with ID ${input.child_id} does not exist`);
    }

    // Prevent self-parenting
    if (input.parent_id === input.child_id) {
      throw new Error('A person cannot be their own parent');
    }

    // Insert parent-child relationship record
    const result = await db.insert(parentChildTable)
      .values({
        parent_id: input.parent_id,
        child_id: input.child_id
      })
      .returning()
      .execute();

    // Convert string dates back to Date objects
    const relation = result[0];
    return {
      ...relation,
      created_at: new Date(relation.created_at)
    };
  } catch (error) {
    console.error('Parent-child relationship creation failed:', error);
    throw error;
  }
};