import { db } from '../db';
import { familyMembersTable, marriagesTable, parentChildTable } from '../db/schema';
import { type FamilyMemberWithRelationships } from '../schema';
import { eq, or } from 'drizzle-orm';

export async function getFamilyMemberDetails(memberId: number): Promise<FamilyMemberWithRelationships | null> {
  try {
    // Get the family member
    const members = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, memberId))
      .execute();

    if (members.length === 0) {
      return null;
    }

    const member = members[0];

    // Get parents (where this member is a child)
    const parentResults = await db.select({
      parent: familyMembersTable
    })
      .from(parentChildTable)
      .innerJoin(familyMembersTable, eq(parentChildTable.parent_id, familyMembersTable.id))
      .where(eq(parentChildTable.child_id, memberId))
      .execute();

    const parents = parentResults.map(result => result.parent);

    // Get children (where this member is a parent)
    const childResults = await db.select({
      child: familyMembersTable
    })
      .from(parentChildTable)
      .innerJoin(familyMembersTable, eq(parentChildTable.child_id, familyMembersTable.id))
      .where(eq(parentChildTable.parent_id, memberId))
      .execute();

    const children = childResults.map(result => result.child);

    // Get spouses (marriages where this member is either person1 or person2)
    const marriageResults = await db.select({
      marriage: marriagesTable,
      spouse: familyMembersTable
    })
      .from(marriagesTable)
      .innerJoin(
        familyMembersTable, 
        or(
          eq(marriagesTable.person1_id, familyMembersTable.id),
          eq(marriagesTable.person2_id, familyMembersTable.id)
        )
      )
      .where(
        or(
          eq(marriagesTable.person1_id, memberId),
          eq(marriagesTable.person2_id, memberId)
        )
      )
      .execute();

    // Filter out the member themselves from the spouse results
    const spouses = marriageResults
      .filter(result => result.spouse.id !== memberId)
      .map(result => ({
        spouse: result.spouse,
        marriage: result.marriage
      }));

    // Convert date strings to Date objects for schema compliance
    const convertDates = (familyMember: any) => ({
      ...familyMember,
      birth_date: familyMember.birth_date ? new Date(familyMember.birth_date) : null,
      death_date: familyMember.death_date ? new Date(familyMember.death_date) : null,
      created_at: new Date(familyMember.created_at)
    });

    const convertMarriageDates = (marriage: any) => ({
      ...marriage,
      marriage_date: marriage.marriage_date ? new Date(marriage.marriage_date) : null,
      divorce_date: marriage.divorce_date ? new Date(marriage.divorce_date) : null,
      created_at: new Date(marriage.created_at)
    });

    return {
      member: convertDates(member),
      parents: parents.map(convertDates),
      children: children.map(convertDates),
      spouses: spouses.map(spouse => ({
        spouse: convertDates(spouse.spouse),
        marriage: convertMarriageDates(spouse.marriage)
      }))
    };
  } catch (error) {
    console.error('Family member details retrieval failed:', error);
    throw error;
  }
}