import { db } from '../db';
import { familyMembersTable, marriagesTable, parentChildTable } from '../db/schema';
import { type FamilyTreeNetwork } from '../schema';

export const getFamilyTreeNetwork = async (): Promise<FamilyTreeNetwork> => {
  try {
    // Get all family members
    const members = await db.select()
      .from(familyMembersTable)
      .orderBy(familyMembersTable.created_at)
      .execute();

    // Get all marriages
    const marriages = await db.select()
      .from(marriagesTable)
      .orderBy(marriagesTable.created_at)
      .execute();

    // Get all parent-child relationships
    const parentChildRelations = await db.select()
      .from(parentChildTable)
      .orderBy(parentChildTable.created_at)
      .execute();

    // Convert string dates back to Date objects
    const convertedMembers = members.map(member => ({
      ...member,
      birth_date: member.birth_date ? new Date(member.birth_date) : null,
      death_date: member.death_date ? new Date(member.death_date) : null,
      created_at: new Date(member.created_at)
    }));

    const convertedMarriages = marriages.map(marriage => ({
      ...marriage,
      marriage_date: marriage.marriage_date ? new Date(marriage.marriage_date) : null,
      divorce_date: marriage.divorce_date ? new Date(marriage.divorce_date) : null,
      created_at: new Date(marriage.created_at)
    }));

    const convertedParentChildRelations = parentChildRelations.map(relation => ({
      ...relation,
      created_at: new Date(relation.created_at)
    }));

    return {
      members: convertedMembers,
      marriages: convertedMarriages,
      parentChildRelations: convertedParentChildRelations
    };
  } catch (error) {
    console.error('Failed to get family tree network:', error);
    throw error;
  }
};