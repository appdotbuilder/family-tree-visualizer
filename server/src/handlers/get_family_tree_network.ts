import { db } from '../db';
import { familyMembersTable, marriagesTable, parentChildTable } from '../db/schema';
import { type FamilyTreeNetwork } from '../schema';

export const getFamilyTreeNetwork = async (): Promise<FamilyTreeNetwork> => {
  try {
    // Fetch all family members
    const membersResult = await db.select()
      .from(familyMembersTable)
      .execute();

    // Convert date strings to Date objects for members
    const members = membersResult.map(member => ({
      ...member,
      birth_date: member.birth_date ? new Date(member.birth_date) : null,
      death_date: member.death_date ? new Date(member.death_date) : null
    }));

    // Fetch all marriages
    const marriagesResult = await db.select()
      .from(marriagesTable)
      .execute();

    // Convert date strings to Date objects for marriages
    const marriages = marriagesResult.map(marriage => ({
      ...marriage,
      marriage_date: marriage.marriage_date ? new Date(marriage.marriage_date) : null,
      divorce_date: marriage.divorce_date ? new Date(marriage.divorce_date) : null
    }));

    // Fetch all parent-child relationships
    const parentChildRelations = await db.select()
      .from(parentChildTable)
      .execute();

    // Return the complete family tree network data
    return {
      members,
      marriages,
      parentChildRelations
    };
  } catch (error) {
    console.error('Failed to fetch family tree network:', error);
    throw error;
  }
};