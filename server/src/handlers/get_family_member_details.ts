import { db } from '../db';
import { familyMembersTable, marriagesTable, parentChildTable } from '../db/schema';
import { type FamilyMemberWithRelationships } from '../schema';
import { eq, or } from 'drizzle-orm';

export const getFamilyMemberDetails = async (memberId: number): Promise<FamilyMemberWithRelationships> => {
  try {
    // Get the family member
    const member = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, memberId))
      .execute();

    if (member.length === 0) {
      return null as any; // Return null for non-existent member
    }

    // Get parents
    const parentRelations = await db.select()
      .from(parentChildTable)
      .innerJoin(familyMembersTable, eq(parentChildTable.parent_id, familyMembersTable.id))
      .where(eq(parentChildTable.child_id, memberId))
      .execute();

    const parents = parentRelations.map(relation => ({
      ...relation.family_members,
      birth_date: relation.family_members.birth_date ? new Date(relation.family_members.birth_date) : null,
      death_date: relation.family_members.death_date ? new Date(relation.family_members.death_date) : null,
      created_at: new Date(relation.family_members.created_at)
    }));

    // Get children
    const childRelations = await db.select()
      .from(parentChildTable)
      .innerJoin(familyMembersTable, eq(parentChildTable.child_id, familyMembersTable.id))
      .where(eq(parentChildTable.parent_id, memberId))
      .execute();

    const children = childRelations.map(relation => ({
      ...relation.family_members,
      birth_date: relation.family_members.birth_date ? new Date(relation.family_members.birth_date) : null,
      death_date: relation.family_members.death_date ? new Date(relation.family_members.death_date) : null,
      created_at: new Date(relation.family_members.created_at)
    }));

    // Get spouses and marriages
    const marriages = await db.select()
      .from(marriagesTable)
      .where(or(
        eq(marriagesTable.person1_id, memberId),
        eq(marriagesTable.person2_id, memberId)
      ))
      .execute();

    const spousesWithMarriages = [];
    for (const marriage of marriages) {
      const spouseId = marriage.person1_id === memberId ? marriage.person2_id : marriage.person1_id;
      const spouse = await db.select()
        .from(familyMembersTable)
        .where(eq(familyMembersTable.id, spouseId))
        .execute();

      if (spouse.length > 0) {
        spousesWithMarriages.push({
          spouse: {
            ...spouse[0],
            birth_date: spouse[0].birth_date ? new Date(spouse[0].birth_date) : null,
            death_date: spouse[0].death_date ? new Date(spouse[0].death_date) : null,
            created_at: new Date(spouse[0].created_at)
          },
          marriage: {
            ...marriage,
            marriage_date: marriage.marriage_date ? new Date(marriage.marriage_date) : null,
            divorce_date: marriage.divorce_date ? new Date(marriage.divorce_date) : null,
            created_at: new Date(marriage.created_at)
          }
        });
      }
    }

    return {
      member: {
        ...member[0],
        birth_date: member[0].birth_date ? new Date(member[0].birth_date) : null,
        death_date: member[0].death_date ? new Date(member[0].death_date) : null,
        created_at: new Date(member[0].created_at)
      },
      parents,
      children,
      spouses: spousesWithMarriages
    };
  } catch (error) {
    console.error('Failed to get family member details:', error);
    throw error;
  }
};