import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable, marriagesTable, parentChildTable } from '../db/schema';
import { getFamilyTreeNetwork } from '../handlers/get_family_tree_network';

describe('getFamilyTreeNetwork', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty network when no data exists', async () => {
    const result = await getFamilyTreeNetwork();

    expect(result.members).toHaveLength(0);
    expect(result.marriages).toHaveLength(0);
    expect(result.parentChildRelations).toHaveLength(0);
  });

  it('should return all family members', async () => {
    // Create test family members
    await db.insert(familyMembersTable).values([
      {
        first_name: 'John',
        last_name: 'Doe',
        birth_date: '1970-01-15',
        death_date: null,
        picture_url: 'https://example.com/john.jpg'
      },
      {
        first_name: 'Jane',
        last_name: 'Smith',
        birth_date: '1975-03-20',
        death_date: null,
        picture_url: null
      },
      {
        first_name: 'Bob',
        last_name: 'Doe',
        birth_date: '2000-06-10',
        death_date: null,
        picture_url: null
      }
    ]).execute();

    const result = await getFamilyTreeNetwork();

    expect(result.members).toHaveLength(3);
    
    // Verify member data structure
    const johnMember = result.members.find(m => m.first_name === 'John');
    expect(johnMember).toBeDefined();
    expect(johnMember!.last_name).toEqual('Doe');
    expect(johnMember!.birth_date).toEqual(new Date('1970-01-15'));
    expect(johnMember!.death_date).toBeNull();
    expect(johnMember!.picture_url).toEqual('https://example.com/john.jpg');
    expect(johnMember!.id).toBeDefined();
    expect(johnMember!.created_at).toBeInstanceOf(Date);

    const janeMember = result.members.find(m => m.first_name === 'Jane');
    expect(janeMember).toBeDefined();
    expect(janeMember!.picture_url).toBeNull();
    expect(janeMember!.birth_date).toEqual(new Date('1975-03-20'));
  });

  it('should return all marriages', async () => {
    // Create family members first
    const membersResult = await db.insert(familyMembersTable).values([
      {
        first_name: 'John',
        last_name: 'Doe',
        birth_date: '1970-01-15',
        death_date: null,
        picture_url: null
      },
      {
        first_name: 'Jane',
        last_name: 'Smith',
        birth_date: '1975-03-20',
        death_date: null,
        picture_url: null
      }
    ]).returning().execute();

    const [john, jane] = membersResult;

    // Create marriages
    await db.insert(marriagesTable).values([
      {
        person1_id: john.id,
        person2_id: jane.id,
        marriage_date: '2000-06-15',
        divorce_date: null
      }
    ]).execute();

    const result = await getFamilyTreeNetwork();

    expect(result.marriages).toHaveLength(1);
    
    const marriage = result.marriages[0];
    expect(marriage.person1_id).toEqual(john.id);
    expect(marriage.person2_id).toEqual(jane.id);
    expect(marriage.marriage_date).toEqual(new Date('2000-06-15'));
    expect(marriage.divorce_date).toBeNull();
    expect(marriage.id).toBeDefined();
    expect(marriage.created_at).toBeInstanceOf(Date);
  });

  it('should return all parent-child relationships', async () => {
    // Create family members first
    const membersResult = await db.insert(familyMembersTable).values([
      {
        first_name: 'John',
        last_name: 'Doe',
        birth_date: '1970-01-15',
        death_date: null,
        picture_url: null
      },
      {
        first_name: 'Bob',
        last_name: 'Doe',
        birth_date: '2000-06-10',
        death_date: null,
        picture_url: null
      }
    ]).returning().execute();

    const [john, bob] = membersResult;

    // Create parent-child relationship
    await db.insert(parentChildTable).values([
      {
        parent_id: john.id,
        child_id: bob.id
      }
    ]).execute();

    const result = await getFamilyTreeNetwork();

    expect(result.parentChildRelations).toHaveLength(1);
    
    const relation = result.parentChildRelations[0];
    expect(relation.parent_id).toEqual(john.id);
    expect(relation.child_id).toEqual(bob.id);
    expect(relation.id).toBeDefined();
    expect(relation.created_at).toBeInstanceOf(Date);
  });

  it('should return complete family network with all relationship types', async () => {
    // Create a multi-generation family
    const membersResult = await db.insert(familyMembersTable).values([
      {
        first_name: 'Grandpa',
        last_name: 'Smith',
        birth_date: '1940-01-01',
        death_date: '2020-12-31',
        picture_url: null
      },
      {
        first_name: 'Grandma',
        last_name: 'Smith',
        birth_date: '1945-05-15',
        death_date: null,
        picture_url: 'https://example.com/grandma.jpg'
      },
      {
        first_name: 'Father',
        last_name: 'Smith',
        birth_date: '1970-03-10',
        death_date: null,
        picture_url: null
      },
      {
        first_name: 'Mother',
        last_name: 'Johnson',
        birth_date: '1972-08-25',
        death_date: null,
        picture_url: null
      },
      {
        first_name: 'Child',
        last_name: 'Smith',
        birth_date: '2005-11-20',
        death_date: null,
        picture_url: null
      }
    ]).returning().execute();

    const [grandpa, grandma, father, mother, child] = membersResult;

    // Create marriages
    await db.insert(marriagesTable).values([
      {
        person1_id: grandpa.id,
        person2_id: grandma.id,
        marriage_date: '1969-06-20',
        divorce_date: null
      },
      {
        person1_id: father.id,
        person2_id: mother.id,
        marriage_date: '2004-09-15',
        divorce_date: null
      }
    ]).execute();

    // Create parent-child relationships
    await db.insert(parentChildTable).values([
      {
        parent_id: grandpa.id,
        child_id: father.id
      },
      {
        parent_id: grandma.id,
        child_id: father.id
      },
      {
        parent_id: father.id,
        child_id: child.id
      },
      {
        parent_id: mother.id,
        child_id: child.id
      }
    ]).execute();

    const result = await getFamilyTreeNetwork();

    // Verify all data is present
    expect(result.members).toHaveLength(5);
    expect(result.marriages).toHaveLength(2);
    expect(result.parentChildRelations).toHaveLength(4);

    // Verify data integrity
    const memberIds = result.members.map(m => m.id);
    
    // All marriage participants should exist in members
    result.marriages.forEach(marriage => {
      expect(memberIds).toContain(marriage.person1_id);
      expect(memberIds).toContain(marriage.person2_id);
    });

    // All parent-child relationship participants should exist in members
    result.parentChildRelations.forEach(relation => {
      expect(memberIds).toContain(relation.parent_id);
      expect(memberIds).toContain(relation.child_id);
    });

    // Verify specific relationships exist
    const grandparentsMarriage = result.marriages.find(m => 
      (m.person1_id === grandpa.id && m.person2_id === grandma.id) ||
      (m.person1_id === grandma.id && m.person2_id === grandpa.id)
    );
    expect(grandparentsMarriage).toBeDefined();
    expect(grandparentsMarriage!.marriage_date).toEqual(new Date('1969-06-20'));

    const fatherChildRelation = result.parentChildRelations.find(r => 
      r.parent_id === father.id && r.child_id === child.id
    );
    expect(fatherChildRelation).toBeDefined();

    // Verify date conversions work correctly
    const grandpaData = result.members.find(m => m.first_name === 'Grandpa');
    expect(grandpaData!.birth_date).toEqual(new Date('1940-01-01'));
    expect(grandpaData!.death_date).toEqual(new Date('2020-12-31'));

    const grandmaData = result.members.find(m => m.first_name === 'Grandma');
    expect(grandmaData!.birth_date).toEqual(new Date('1945-05-15'));
    expect(grandmaData!.death_date).toBeNull();
  });

  it('should handle marriages with divorce dates', async () => {
    // Create family members first
    const membersResult = await db.insert(familyMembersTable).values([
      {
        first_name: 'Ex-Husband',
        last_name: 'Brown',
        birth_date: '1980-01-01',
        death_date: null,
        picture_url: null
      },
      {
        first_name: 'Ex-Wife',
        last_name: 'Green',
        birth_date: '1982-05-10',
        death_date: null,
        picture_url: null
      }
    ]).returning().execute();

    const [husband, wife] = membersResult;

    // Create marriage with divorce date
    await db.insert(marriagesTable).values([
      {
        person1_id: husband.id,
        person2_id: wife.id,
        marriage_date: '2005-08-20',
        divorce_date: '2010-03-15'
      }
    ]).execute();

    const result = await getFamilyTreeNetwork();

    expect(result.marriages).toHaveLength(1);
    
    const marriage = result.marriages[0];
    expect(marriage.marriage_date).toEqual(new Date('2005-08-20'));
    expect(marriage.divorce_date).toEqual(new Date('2010-03-15'));
  });
});