import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable } from '../db/schema';
import { type CreateFamilyMemberInput } from '../schema';
import { createFamilyMember } from '../handlers/create_family_member';
import { eq, gte, between, and } from 'drizzle-orm';

// Test inputs with all fields
const testInputWithAllFields: CreateFamilyMemberInput = {
  first_name: 'John',
  last_name: 'Doe',
  birth_date: new Date('1980-05-15'),
  death_date: null,
  picture_url: 'https://example.com/john.jpg'
};

const testInputMinimal: CreateFamilyMemberInput = {
  first_name: 'Jane',
  last_name: 'Smith',
  birth_date: null,
  death_date: null,
  picture_url: null
};

const testInputDeceased: CreateFamilyMemberInput = {
  first_name: 'Robert',
  last_name: 'Johnson',
  birth_date: new Date('1950-03-20'),
  death_date: new Date('2020-12-10'),
  picture_url: 'https://example.com/robert.jpg'
};

describe('createFamilyMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a family member with all fields', async () => {
    const result = await createFamilyMember(testInputWithAllFields);

    // Basic field validation
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.birth_date).toEqual(new Date('1980-05-15'));
    expect(result.death_date).toBeNull();
    expect(result.picture_url).toEqual('https://example.com/john.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a family member with minimal fields', async () => {
    const result = await createFamilyMember(testInputMinimal);

    // Basic field validation
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.birth_date).toBeNull();
    expect(result.death_date).toBeNull();
    expect(result.picture_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a deceased family member', async () => {
    const result = await createFamilyMember(testInputDeceased);

    // Basic field validation
    expect(result.first_name).toEqual('Robert');
    expect(result.last_name).toEqual('Johnson');
    expect(result.birth_date).toEqual(new Date('1950-03-20'));
    expect(result.death_date).toEqual(new Date('2020-12-10'));
    expect(result.picture_url).toEqual('https://example.com/robert.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save family member to database', async () => {
    const result = await createFamilyMember(testInputWithAllFields);

    // Query using proper drizzle syntax
    const familyMembers = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, result.id))
      .execute();

    expect(familyMembers).toHaveLength(1);
    expect(familyMembers[0].first_name).toEqual('John');
    expect(familyMembers[0].last_name).toEqual('Doe');
    expect(familyMembers[0].birth_date).toEqual('1980-05-15'); // Date stored as string in DB
    expect(familyMembers[0].death_date).toBeNull();
    expect(familyMembers[0].picture_url).toEqual('https://example.com/john.jpg');
    expect(familyMembers[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null dates correctly in database', async () => {
    const result = await createFamilyMember(testInputMinimal);

    // Query using proper drizzle syntax
    const familyMembers = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, result.id))
      .execute();

    expect(familyMembers).toHaveLength(1);
    expect(familyMembers[0].birth_date).toBeNull();
    expect(familyMembers[0].death_date).toBeNull();
    expect(familyMembers[0].picture_url).toBeNull();
  });

  it('should query family members by date range correctly', async () => {
    // Create test family member
    await createFamilyMember(testInputWithAllFields);

    // Test date filtering - demonstration of correct date handling
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Proper query building - step by step
    const familyMembers = await db.select()
      .from(familyMembersTable)
      .where(
        and(
          gte(familyMembersTable.created_at, yesterday),
          between(familyMembersTable.created_at, yesterday, tomorrow)
        )
      )
      .execute();

    expect(familyMembers.length).toBeGreaterThan(0);
    familyMembers.forEach(member => {
      expect(member.created_at).toBeInstanceOf(Date);
      expect(member.created_at >= yesterday).toBe(true);
      expect(member.created_at <= tomorrow).toBe(true);
    });
  });

  it('should create multiple family members with unique IDs', async () => {
    const result1 = await createFamilyMember(testInputWithAllFields);
    const result2 = await createFamilyMember(testInputMinimal);

    // Verify both have different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();

    // Verify both exist in database
    const allMembers = await db.select()
      .from(familyMembersTable)
      .execute();

    expect(allMembers).toHaveLength(2);
    expect(allMembers.map(m => m.id)).toContain(result1.id);
    expect(allMembers.map(m => m.id)).toContain(result2.id);
  });

  it('should preserve date precision when converting', async () => {
    const specificDate = new Date('1975-08-23T10:30:00.000Z');
    const inputWithSpecificDate: CreateFamilyMemberInput = {
      first_name: 'Alice',
      last_name: 'Wilson',
      birth_date: specificDate,
      death_date: null,
      picture_url: null
    };

    const result = await createFamilyMember(inputWithSpecificDate);

    // The returned date should match the input date (ignoring time portion since we store as date)
    expect(result.birth_date).toEqual(new Date('1975-08-23'));
    
    // Verify in database the date is stored correctly
    const dbRecord = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, result.id))
      .execute();

    expect(dbRecord[0].birth_date).toEqual('1975-08-23');
  });
});