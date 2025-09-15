import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable } from '../db/schema';
import { getFamilyMembers } from '../handlers/get_family_members';

describe('getFamilyMembers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no family members exist', async () => {
    const result = await getFamilyMembers();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all family members with proper date conversion', async () => {
    // Create test family members with various date combinations
    const testMembers = [
      {
        first_name: 'John',
        last_name: 'Doe',
        birth_date: '1980-01-15',
        death_date: null,
        picture_url: 'https://example.com/john.jpg'
      },
      {
        first_name: 'Jane',
        last_name: 'Smith',
        birth_date: '1985-03-22',
        death_date: '2020-12-10',
        picture_url: null
      },
      {
        first_name: 'Bob',
        last_name: 'Johnson',
        birth_date: null,
        death_date: null,
        picture_url: null
      }
    ];

    await db.insert(familyMembersTable)
      .values(testMembers)
      .execute();

    const result = await getFamilyMembers();

    expect(result).toHaveLength(3);
    
    // Sort by first name for consistent testing
    const sortedResult = result.sort((a, b) => a.first_name.localeCompare(b.first_name));

    // Test Bob Johnson (all dates null)
    expect(sortedResult[0].first_name).toBe('Bob');
    expect(sortedResult[0].last_name).toBe('Johnson');
    expect(sortedResult[0].birth_date).toBeNull();
    expect(sortedResult[0].death_date).toBeNull();
    expect(sortedResult[0].picture_url).toBeNull();
    expect(sortedResult[0].id).toBeDefined();
    expect(sortedResult[0].created_at).toBeInstanceOf(Date);

    // Test Jane Smith (has both dates)
    expect(sortedResult[1].first_name).toBe('Jane');
    expect(sortedResult[1].last_name).toBe('Smith');
    expect(sortedResult[1].birth_date).toBeInstanceOf(Date);
    expect(sortedResult[1].birth_date?.getFullYear()).toBe(1985);
    expect(sortedResult[1].birth_date?.getMonth()).toBe(2); // March is month 2 (0-indexed)
    expect(sortedResult[1].birth_date?.getDate()).toBe(22);
    expect(sortedResult[1].death_date).toBeInstanceOf(Date);
    expect(sortedResult[1].death_date?.getFullYear()).toBe(2020);
    expect(sortedResult[1].picture_url).toBeNull();

    // Test John Doe (birth date only)
    expect(sortedResult[2].first_name).toBe('John');
    expect(sortedResult[2].last_name).toBe('Doe');
    expect(sortedResult[2].birth_date).toBeInstanceOf(Date);
    expect(sortedResult[2].birth_date?.getFullYear()).toBe(1980);
    expect(sortedResult[2].death_date).toBeNull();
    expect(sortedResult[2].picture_url).toBe('https://example.com/john.jpg');
  });

  it('should handle multiple family members correctly', async () => {
    // Insert multiple family members
    const familyMembers = Array.from({ length: 5 }, (_, i) => ({
      first_name: `Person${i + 1}`,
      last_name: `Family${i + 1}`,
      birth_date: `19${80 + i}-01-01`,
      death_date: null,
      picture_url: `https://example.com/person${i + 1}.jpg`
    }));

    await db.insert(familyMembersTable)
      .values(familyMembers)
      .execute();

    const result = await getFamilyMembers();

    expect(result).toHaveLength(5);
    
    // Verify all members have proper structure
    result.forEach((member, index) => {
      expect(member.first_name).toBe(`Person${index + 1}`);
      expect(member.last_name).toBe(`Family${index + 1}`);
      expect(member.birth_date).toBeInstanceOf(Date);
      expect(member.death_date).toBeNull();
      expect(member.picture_url).toBe(`https://example.com/person${index + 1}.jpg`);
      expect(member.id).toBeDefined();
      expect(member.created_at).toBeInstanceOf(Date);
      expect(typeof member.id).toBe('number');
    });
  });

  it('should verify data persists in database', async () => {
    // Create and verify family member
    await db.insert(familyMembersTable)
      .values({
        first_name: 'Test',
        last_name: 'Person',
        birth_date: '1990-06-15',
        death_date: null,
        picture_url: 'https://example.com/test.jpg'
      })
      .execute();

    const result = await getFamilyMembers();
    
    expect(result).toHaveLength(1);
    
    // Verify the database contains the same data
    const dbResult = await db.select()
      .from(familyMembersTable)
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(dbResult[0].first_name).toBe('Test');
    expect(dbResult[0].last_name).toBe('Person');
    expect(dbResult[0].birth_date).toBe('1990-06-15');
    expect(dbResult[0].picture_url).toBe('https://example.com/test.jpg');
  });
});