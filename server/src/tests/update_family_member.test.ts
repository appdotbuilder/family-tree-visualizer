import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable } from '../db/schema';
import { type UpdateFamilyMemberInput, type CreateFamilyMemberInput } from '../schema';
import { updateFamilyMember } from '../handlers/update_family_member';
import { eq } from 'drizzle-orm';

// Helper function to create a test family member
const createTestFamilyMember = async (data: CreateFamilyMemberInput) => {
  const result = await db.insert(familyMembersTable)
    .values({
      first_name: data.first_name,
      last_name: data.last_name,
      birth_date: data.birth_date ? data.birth_date.toISOString().split('T')[0] : null,
      death_date: data.death_date ? data.death_date.toISOString().split('T')[0] : null,
      picture_url: data.picture_url
    })
    .returning()
    .execute();
  
  // Convert date strings back to Date objects for consistency
  const member = result[0];
  return {
    ...member,
    birth_date: member.birth_date ? new Date(member.birth_date) : null,
    death_date: member.death_date ? new Date(member.death_date) : null,
    created_at: new Date(member.created_at)
  };
};

const testMemberData: CreateFamilyMemberInput = {
  first_name: 'John',
  last_name: 'Doe',
  birth_date: new Date('1980-01-15'),
  death_date: null,
  picture_url: 'https://example.com/john.jpg'
};

describe('updateFamilyMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of an existing family member', async () => {
    // Create a test family member
    const createdMember = await createTestFamilyMember(testMemberData);

    const updateInput: UpdateFamilyMemberInput = {
      id: createdMember.id,
      first_name: 'Jane',
      last_name: 'Smith',
      birth_date: new Date('1985-03-20'),
      death_date: new Date('2020-12-25'),
      picture_url: 'https://example.com/jane.jpg'
    };

    const result = await updateFamilyMember(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdMember.id);
    expect(result!.first_name).toEqual('Jane');
    expect(result!.last_name).toEqual('Smith');
    expect(result!.birth_date).toEqual(new Date('1985-03-20'));
    expect(result!.death_date).toEqual(new Date('2020-12-25'));
    expect(result!.picture_url).toEqual('https://example.com/jane.jpg');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const createdMember = await createTestFamilyMember(testMemberData);

    const updateInput: UpdateFamilyMemberInput = {
      id: createdMember.id,
      first_name: 'Jane'
    };

    const result = await updateFamilyMember(updateInput);

    expect(result).not.toBeNull();
    expect(result!.first_name).toEqual('Jane');
    expect(result!.last_name).toEqual('Doe'); // Should remain unchanged
    expect(result!.birth_date).toEqual(new Date('1980-01-15')); // Should remain unchanged
    expect(result!.picture_url).toEqual('https://example.com/john.jpg'); // Should remain unchanged
  });

  it('should handle nullable fields correctly', async () => {
    const createdMember = await createTestFamilyMember(testMemberData);

    const updateInput: UpdateFamilyMemberInput = {
      id: createdMember.id,
      birth_date: null,
      death_date: new Date('2023-01-01'),
      picture_url: null
    };

    const result = await updateFamilyMember(updateInput);

    expect(result).not.toBeNull();
    expect(result!.birth_date).toBeNull();
    expect(result!.death_date).toEqual(new Date('2023-01-01'));
    expect(result!.picture_url).toBeNull();
  });

  it('should persist changes to database', async () => {
    const createdMember = await createTestFamilyMember(testMemberData);

    const updateInput: UpdateFamilyMemberInput = {
      id: createdMember.id,
      first_name: 'Updated Name',
      last_name: 'Updated Last'
    };

    await updateFamilyMember(updateInput);

    // Query database directly to verify changes were persisted
    const updatedMemberFromDB = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, createdMember.id))
      .execute();

    expect(updatedMemberFromDB).toHaveLength(1);
    expect(updatedMemberFromDB[0].first_name).toEqual('Updated Name');
    expect(updatedMemberFromDB[0].last_name).toEqual('Updated Last');
    // Date comes back as string from DB, so we convert it for comparison
    expect(new Date(updatedMemberFromDB[0].birth_date!)).toEqual(new Date('1980-01-15')); // Unchanged
  });

  it('should return null for non-existent family member', async () => {
    const updateInput: UpdateFamilyMemberInput = {
      id: 99999, // Non-existent ID
      first_name: 'Test'
    };

    const result = await updateFamilyMember(updateInput);

    expect(result).toBeNull();
  });

  it('should return existing member when no fields are provided for update', async () => {
    const createdMember = await createTestFamilyMember(testMemberData);

    const updateInput: UpdateFamilyMemberInput = {
      id: createdMember.id
      // No update fields provided
    };

    const result = await updateFamilyMember(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdMember.id);
    expect(result!.first_name).toEqual('John');
    expect(result!.last_name).toEqual('Doe');
    expect(result!.birth_date).toEqual(new Date('1980-01-15'));
  });

  it('should handle date updates correctly', async () => {
    const createdMember = await createTestFamilyMember({
      ...testMemberData,
      birth_date: null,
      death_date: null
    });

    const updateInput: UpdateFamilyMemberInput = {
      id: createdMember.id,
      birth_date: new Date('1990-05-10'),
      death_date: new Date('2023-10-15')
    };

    const result = await updateFamilyMember(updateInput);

    expect(result).not.toBeNull();
    expect(result!.birth_date).toEqual(new Date('1990-05-10'));
    expect(result!.death_date).toEqual(new Date('2023-10-15'));
  });

  it('should update picture_url independently', async () => {
    const createdMember = await createTestFamilyMember(testMemberData);

    const updateInput: UpdateFamilyMemberInput = {
      id: createdMember.id,
      picture_url: 'https://example.com/new-picture.jpg'
    };

    const result = await updateFamilyMember(updateInput);

    expect(result).not.toBeNull();
    expect(result!.picture_url).toEqual('https://example.com/new-picture.jpg');
    expect(result!.first_name).toEqual('John'); // Other fields unchanged
    expect(result!.last_name).toEqual('Doe');
  });
});