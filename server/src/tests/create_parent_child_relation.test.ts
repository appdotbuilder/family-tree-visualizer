import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { parentChildTable, familyMembersTable } from '../db/schema';
import { type CreateParentChildInput } from '../schema';
import { createParentChildRelation } from '../handlers/create_parent_child_relation';
import { eq } from 'drizzle-orm';

describe('createParentChildRelation', () => {
  let parentId: number;
  let childId: number;

  beforeEach(async () => {
    await createDB();

    // Create test family members
    const parentResult = await db.insert(familyMembersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        birth_date: '1970-01-01',
        death_date: null,
        picture_url: null
      })
      .returning()
      .execute();

    const childResult = await db.insert(familyMembersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Doe',
        birth_date: '2000-01-01',
        death_date: null,
        picture_url: null
      })
      .returning()
      .execute();

    parentId = parentResult[0].id;
    childId = childResult[0].id;
  });

  afterEach(resetDB);

  it('should create a parent-child relationship', async () => {
    const testInput: CreateParentChildInput = {
      parent_id: parentId,
      child_id: childId
    };

    const result = await createParentChildRelation(testInput);

    // Basic field validation
    expect(result.parent_id).toEqual(parentId);
    expect(result.child_id).toEqual(childId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save parent-child relationship to database', async () => {
    const testInput: CreateParentChildInput = {
      parent_id: parentId,
      child_id: childId
    };

    const result = await createParentChildRelation(testInput);

    // Query the database to verify the relationship was saved
    const relations = await db.select()
      .from(parentChildTable)
      .where(eq(parentChildTable.id, result.id))
      .execute();

    expect(relations).toHaveLength(1);
    expect(relations[0].parent_id).toEqual(parentId);
    expect(relations[0].child_id).toEqual(childId);
    expect(relations[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when parent does not exist', async () => {
    const testInput: CreateParentChildInput = {
      parent_id: 99999, // Non-existent parent ID
      child_id: childId
    };

    expect(createParentChildRelation(testInput)).rejects.toThrow(/Parent with ID 99999 does not exist/i);
  });

  it('should throw error when child does not exist', async () => {
    const testInput: CreateParentChildInput = {
      parent_id: parentId,
      child_id: 99999 // Non-existent child ID
    };

    expect(createParentChildRelation(testInput)).rejects.toThrow(/Child with ID 99999 does not exist/i);
  });

  it('should throw error when both parent and child do not exist', async () => {
    const testInput: CreateParentChildInput = {
      parent_id: 99998,
      child_id: 99999
    };

    expect(createParentChildRelation(testInput)).rejects.toThrow(/Parent with ID 99998 does not exist/i);
  });

  it('should allow multiple children for same parent', async () => {
    // Create another child
    const secondChildResult = await db.insert(familyMembersTable)
      .values({
        first_name: 'Bob',
        last_name: 'Doe',
        birth_date: '2002-01-01',
        death_date: null,
        picture_url: null
      })
      .returning()
      .execute();

    const secondChildId = secondChildResult[0].id;

    // Create relationships for both children
    const firstRelation = await createParentChildRelation({
      parent_id: parentId,
      child_id: childId
    });

    const secondRelation = await createParentChildRelation({
      parent_id: parentId,
      child_id: secondChildId
    });

    // Verify both relationships exist
    expect(firstRelation.parent_id).toEqual(parentId);
    expect(firstRelation.child_id).toEqual(childId);
    expect(secondRelation.parent_id).toEqual(parentId);
    expect(secondRelation.child_id).toEqual(secondChildId);

    // Verify in database
    const relations = await db.select()
      .from(parentChildTable)
      .where(eq(parentChildTable.parent_id, parentId))
      .execute();

    expect(relations).toHaveLength(2);
  });

  it('should allow multiple parents for same child', async () => {
    // Create another parent
    const secondParentResult = await db.insert(familyMembersTable)
      .values({
        first_name: 'Mary',
        last_name: 'Doe',
        birth_date: '1972-01-01',
        death_date: null,
        picture_url: null
      })
      .returning()
      .execute();

    const secondParentId = secondParentResult[0].id;

    // Create relationships with both parents
    const firstRelation = await createParentChildRelation({
      parent_id: parentId,
      child_id: childId
    });

    const secondRelation = await createParentChildRelation({
      parent_id: secondParentId,
      child_id: childId
    });

    // Verify both relationships exist
    expect(firstRelation.parent_id).toEqual(parentId);
    expect(firstRelation.child_id).toEqual(childId);
    expect(secondRelation.parent_id).toEqual(secondParentId);
    expect(secondRelation.child_id).toEqual(childId);

    // Verify in database
    const relations = await db.select()
      .from(parentChildTable)
      .where(eq(parentChildTable.child_id, childId))
      .execute();

    expect(relations).toHaveLength(2);
  });
});