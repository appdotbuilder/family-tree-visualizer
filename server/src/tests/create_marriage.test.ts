import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marriagesTable, familyMembersTable } from '../db/schema';
import { type CreateMarriageInput } from '../schema';
import { createMarriage } from '../handlers/create_marriage';
import { eq } from 'drizzle-orm';

describe('createMarriage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test family members
  const createTestPerson = async (firstName: string, lastName: string) => {
    const result = await db.insert(familyMembersTable)
      .values({
        first_name: firstName,
        last_name: lastName,
        birth_date: '1990-01-01',
        death_date: null,
        picture_url: null
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a marriage with valid input', async () => {
    // Create two test family members
    const person1 = await createTestPerson('John', 'Doe');
    const person2 = await createTestPerson('Jane', 'Smith');

    const testInput: CreateMarriageInput = {
      person1_id: person1.id,
      person2_id: person2.id,
      marriage_date: new Date('2020-06-15'),
      divorce_date: null
    };

    const result = await createMarriage(testInput);

    // Validate return values
    expect(result.person1_id).toEqual(person1.id);
    expect(result.person2_id).toEqual(person2.id);
    expect(result.marriage_date).toBeInstanceOf(Date);
    expect(result.marriage_date?.toISOString().split('T')[0]).toEqual('2020-06-15');
    expect(result.divorce_date).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a marriage with both marriage and divorce dates', async () => {
    const person1 = await createTestPerson('Alice', 'Johnson');
    const person2 = await createTestPerson('Bob', 'Wilson');

    const testInput: CreateMarriageInput = {
      person1_id: person1.id,
      person2_id: person2.id,
      marriage_date: new Date('2018-08-20'),
      divorce_date: new Date('2022-12-10')
    };

    const result = await createMarriage(testInput);

    expect(result.marriage_date).toBeInstanceOf(Date);
    expect(result.marriage_date?.toISOString().split('T')[0]).toEqual('2018-08-20');
    expect(result.divorce_date).toBeInstanceOf(Date);
    expect(result.divorce_date?.toISOString().split('T')[0]).toEqual('2022-12-10');
  });

  it('should create a marriage with null dates', async () => {
    const person1 = await createTestPerson('Charlie', 'Brown');
    const person2 = await createTestPerson('Lucy', 'Van Pelt');

    const testInput: CreateMarriageInput = {
      person1_id: person1.id,
      person2_id: person2.id,
      marriage_date: null,
      divorce_date: null
    };

    const result = await createMarriage(testInput);

    expect(result.marriage_date).toBeNull();
    expect(result.divorce_date).toBeNull();
    expect(result.person1_id).toEqual(person1.id);
    expect(result.person2_id).toEqual(person2.id);
  });

  it('should save marriage to database', async () => {
    const person1 = await createTestPerson('David', 'Miller');
    const person2 = await createTestPerson('Emma', 'Davis');

    const testInput: CreateMarriageInput = {
      person1_id: person1.id,
      person2_id: person2.id,
      marriage_date: new Date('2019-09-05'),
      divorce_date: null
    };

    const result = await createMarriage(testInput);

    // Verify it was saved to database
    const marriages = await db.select()
      .from(marriagesTable)
      .where(eq(marriagesTable.id, result.id))
      .execute();

    expect(marriages).toHaveLength(1);
    expect(marriages[0].person1_id).toEqual(person1.id);
    expect(marriages[0].person2_id).toEqual(person2.id);
    expect(marriages[0].marriage_date).toEqual('2019-09-05');
    expect(marriages[0].divorce_date).toBeNull();
    expect(marriages[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when person1 does not exist', async () => {
    const person2 = await createTestPerson('Sarah', 'Connor');

    const testInput: CreateMarriageInput = {
      person1_id: 9999, // Non-existent ID
      person2_id: person2.id,
      marriage_date: new Date('2020-01-01'),
      divorce_date: null
    };

    expect(() => createMarriage(testInput)).toThrow(/Person with ID 9999 not found/);
  });

  it('should throw error when person2 does not exist', async () => {
    const person1 = await createTestPerson('Kyle', 'Reese');

    const testInput: CreateMarriageInput = {
      person1_id: person1.id,
      person2_id: 8888, // Non-existent ID
      marriage_date: new Date('2020-01-01'),
      divorce_date: null
    };

    expect(() => createMarriage(testInput)).toThrow(/Person with ID 8888 not found/);
  });

  it('should throw error when person tries to marry themselves', async () => {
    const person = await createTestPerson('Narcissus', 'Self');

    const testInput: CreateMarriageInput = {
      person1_id: person.id,
      person2_id: person.id, // Same person
      marriage_date: new Date('2020-01-01'),
      divorce_date: null
    };

    expect(() => createMarriage(testInput)).toThrow(/A person cannot marry themselves/);
  });

  it('should handle multiple marriages for the same person', async () => {
    const person1 = await createTestPerson('Elizabeth', 'Taylor');
    const person2 = await createTestPerson('Richard', 'Burton');
    const person3 = await createTestPerson('Eddie', 'Fisher');

    // Create first marriage
    const firstMarriage = await createMarriage({
      person1_id: person1.id,
      person2_id: person2.id,
      marriage_date: new Date('1964-03-15'),
      divorce_date: new Date('1974-06-26')
    });

    // Create second marriage for same person
    const secondMarriage = await createMarriage({
      person1_id: person1.id,
      person2_id: person3.id,
      marriage_date: new Date('1959-05-12'),
      divorce_date: new Date('1964-03-06')
    });

    expect(firstMarriage.id).not.toEqual(secondMarriage.id);
    expect(firstMarriage.person1_id).toEqual(secondMarriage.person1_id);
    expect(firstMarriage.person2_id).not.toEqual(secondMarriage.person2_id);

    // Verify both marriages exist in database
    const allMarriages = await db.select()
      .from(marriagesTable)
      .execute();

    expect(allMarriages).toHaveLength(2);
  });
});