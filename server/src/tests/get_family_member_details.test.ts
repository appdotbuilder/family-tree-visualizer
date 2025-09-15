import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable, marriagesTable, parentChildTable } from '../db/schema';
import { getFamilyMemberDetails } from '../handlers/get_family_member_details';

describe('getFamilyMemberDetails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent member', async () => {
    const result = await getFamilyMemberDetails(999);
    expect(result).toBeNull();
  });

  it('should return member with empty relationships when no relationships exist', async () => {
    // Create a single family member
    const memberResult = await db.insert(familyMembersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        birth_date: '1990-01-01',
        death_date: null,
        picture_url: null
      })
      .returning()
      .execute();

    const memberId = memberResult[0].id;

    const result = await getFamilyMemberDetails(memberId);

    expect(result).not.toBeNull();
    expect(result!.member.first_name).toEqual('John');
    expect(result!.member.last_name).toEqual('Doe');
    expect(result!.member.birth_date).toEqual(new Date('1990-01-01'));
    expect(result!.parents).toHaveLength(0);
    expect(result!.children).toHaveLength(0);
    expect(result!.spouses).toHaveLength(0);
  });

  it('should return member with all relationship types', async () => {
    // Create family members
    const memberResults = await db.insert(familyMembersTable)
      .values([
        {
          first_name: 'John',
          last_name: 'Doe',
          birth_date: '1990-01-01',
          death_date: null,
          picture_url: null
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          birth_date: '1985-06-15',
          death_date: null,
          picture_url: 'http://example.com/jane.jpg'
        },
        {
          first_name: 'Bob',
          last_name: 'Doe',
          birth_date: '1960-03-20',
          death_date: null,
          picture_url: null
        },
        {
          first_name: 'Alice',
          last_name: 'Johnson',
          birth_date: '1965-11-10',
          death_date: null,
          picture_url: null
        },
        {
          first_name: 'Little',
          last_name: 'Doe',
          birth_date: '2015-08-25',
          death_date: null,
          picture_url: null
        }
      ])
      .returning()
      .execute();

    const [john, jane, bob, alice, littleDoe] = memberResults;

    // Create marriage between John and Jane
    await db.insert(marriagesTable)
      .values({
        person1_id: john.id,
        person2_id: jane.id,
        marriage_date: '2010-05-20',
        divorce_date: null
      })
      .execute();

    // Create parent-child relationships (Bob and Alice are John's parents)
    await db.insert(parentChildTable)
      .values([
        { parent_id: bob.id, child_id: john.id },
        { parent_id: alice.id, child_id: john.id }
      ])
      .execute();

    // Create parent-child relationship (John is Little Doe's parent)
    await db.insert(parentChildTable)
      .values({
        parent_id: john.id,
        child_id: littleDoe.id
      })
      .execute();

    const result = await getFamilyMemberDetails(john.id);

    expect(result).not.toBeNull();
    
    // Check member details
    expect(result!.member.first_name).toEqual('John');
    expect(result!.member.last_name).toEqual('Doe');
    expect(result!.member.id).toEqual(john.id);

    // Check parents
    expect(result!.parents).toHaveLength(2);
    const parentNames = result!.parents.map(p => p.first_name).sort();
    expect(parentNames).toEqual(['Alice', 'Bob']);

    // Check children
    expect(result!.children).toHaveLength(1);
    expect(result!.children[0].first_name).toEqual('Little');
    expect(result!.children[0].last_name).toEqual('Doe');

    // Check spouses
    expect(result!.spouses).toHaveLength(1);
    expect(result!.spouses[0].spouse.first_name).toEqual('Jane');
    expect(result!.spouses[0].spouse.last_name).toEqual('Smith');
    expect(result!.spouses[0].marriage.marriage_date).toEqual(new Date('2010-05-20'));
    expect(result!.spouses[0].marriage.divorce_date).toBeNull();
  });

  it('should handle multiple spouses and divorced relationships', async () => {
    // Create family members
    const memberResults = await db.insert(familyMembersTable)
      .values([
        {
          first_name: 'John',
          last_name: 'Doe',
          birth_date: '1980-01-01',
          death_date: null,
          picture_url: null
        },
        {
          first_name: 'First',
          last_name: 'Wife',
          birth_date: '1982-02-14',
          death_date: null,
          picture_url: null
        },
        {
          first_name: 'Second',
          last_name: 'Wife',
          birth_date: '1985-07-30',
          death_date: null,
          picture_url: null
        }
      ])
      .returning()
      .execute();

    const [john, firstWife, secondWife] = memberResults;

    // Create marriages - first one divorced, second one current
    await db.insert(marriagesTable)
      .values([
        {
          person1_id: john.id,
          person2_id: firstWife.id,
          marriage_date: '2005-06-15',
          divorce_date: '2012-08-20'
        },
        {
          person1_id: john.id,
          person2_id: secondWife.id,
          marriage_date: '2014-03-10',
          divorce_date: null
        }
      ])
      .execute();

    const result = await getFamilyMemberDetails(john.id);

    expect(result).not.toBeNull();
    expect(result!.spouses).toHaveLength(2);

    // Check that both spouses are returned with their marriage details
    const spouseNames = result!.spouses.map(s => s.spouse.first_name).sort();
    expect(spouseNames).toEqual(['First', 'Second']);

    // Verify marriage details
    const firstMarriage = result!.spouses.find(s => s.spouse.first_name === 'First')!;
    expect(firstMarriage.marriage.divorce_date).toEqual(new Date('2012-08-20'));

    const secondMarriage = result!.spouses.find(s => s.spouse.first_name === 'Second')!;
    expect(secondMarriage.marriage.divorce_date).toBeNull();
  });

  it('should handle member as person2 in marriage', async () => {
    // Test case where the queried member is person2_id in the marriage table
    const memberResults = await db.insert(familyMembersTable)
      .values([
        {
          first_name: 'Alice',
          last_name: 'Johnson',
          birth_date: '1988-04-12',
          death_date: null,
          picture_url: null
        },
        {
          first_name: 'Bob',
          last_name: 'Wilson',
          birth_date: '1985-09-05',
          death_date: null,
          picture_url: null
        }
      ])
      .returning()
      .execute();

    const [alice, bob] = memberResults;

    // Create marriage with Bob as person1 and Alice as person2
    await db.insert(marriagesTable)
      .values({
        person1_id: bob.id,
        person2_id: alice.id,
        marriage_date: '2015-12-01',
        divorce_date: null
      })
      .execute();

    // Query Alice's details (she's person2 in the marriage)
    const result = await getFamilyMemberDetails(alice.id);

    expect(result).not.toBeNull();
    expect(result!.spouses).toHaveLength(1);
    expect(result!.spouses[0].spouse.first_name).toEqual('Bob');
    expect(result!.spouses[0].spouse.last_name).toEqual('Wilson');
  });

  it('should save relationships to database correctly', async () => {
    // Create test data
    const memberResults = await db.insert(familyMembersTable)
      .values([
        {
          first_name: 'Parent',
          last_name: 'Test',
          birth_date: '1970-01-01',
          death_date: null,
          picture_url: null
        },
        {
          first_name: 'Child',
          last_name: 'Test',
          birth_date: '2000-01-01',
          death_date: null,
          picture_url: null
        }
      ])
      .returning()
      .execute();

    const [parent, child] = memberResults;

    // Create parent-child relationship
    await db.insert(parentChildTable)
      .values({
        parent_id: parent.id,
        child_id: child.id
      })
      .execute();

    // Verify the relationship was saved correctly in database
    const parentDetails = await getFamilyMemberDetails(parent.id);
    const childDetails = await getFamilyMemberDetails(child.id);

    expect(parentDetails!.children).toHaveLength(1);
    expect(parentDetails!.children[0].first_name).toEqual('Child');

    expect(childDetails!.parents).toHaveLength(1);
    expect(childDetails!.parents[0].first_name).toEqual('Parent');
  });
});