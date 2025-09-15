import { serial, text, pgTable, timestamp, date, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const familyMembersTable = pgTable('family_members', {
  id: serial('id').primaryKey(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  birth_date: date('birth_date'), // Nullable by default
  death_date: date('death_date'), // Nullable by default
  picture_url: text('picture_url'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const marriagesTable = pgTable('marriages', {
  id: serial('id').primaryKey(),
  person1_id: integer('person1_id').references(() => familyMembersTable.id).notNull(),
  person2_id: integer('person2_id').references(() => familyMembersTable.id).notNull(),
  marriage_date: date('marriage_date'), // Nullable by default
  divorce_date: date('divorce_date'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const parentChildTable = pgTable('parent_child', {
  id: serial('id').primaryKey(),
  parent_id: integer('parent_id').references(() => familyMembersTable.id).notNull(),
  child_id: integer('child_id').references(() => familyMembersTable.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations for easier querying
export const familyMembersRelations = relations(familyMembersTable, ({ many }) => ({
  marriagesAsPerson1: many(marriagesTable, { relationName: 'person1_marriages' }),
  marriagesAsPerson2: many(marriagesTable, { relationName: 'person2_marriages' }),
  parentRelations: many(parentChildTable, { relationName: 'parent_relations' }),
  childRelations: many(parentChildTable, { relationName: 'child_relations' }),
}));

export const marriagesRelations = relations(marriagesTable, ({ one }) => ({
  person1: one(familyMembersTable, {
    fields: [marriagesTable.person1_id],
    references: [familyMembersTable.id],
    relationName: 'person1_marriages',
  }),
  person2: one(familyMembersTable, {
    fields: [marriagesTable.person2_id],
    references: [familyMembersTable.id],
    relationName: 'person2_marriages',
  }),
}));

export const parentChildRelations = relations(parentChildTable, ({ one }) => ({
  parent: one(familyMembersTable, {
    fields: [parentChildTable.parent_id],
    references: [familyMembersTable.id],
    relationName: 'parent_relations',
  }),
  child: one(familyMembersTable, {
    fields: [parentChildTable.child_id],
    references: [familyMembersTable.id],
    relationName: 'child_relations',
  }),
}));

// TypeScript types for the table schemas
export type FamilyMember = typeof familyMembersTable.$inferSelect;
export type NewFamilyMember = typeof familyMembersTable.$inferInsert;
export type Marriage = typeof marriagesTable.$inferSelect;
export type NewMarriage = typeof marriagesTable.$inferInsert;
export type ParentChild = typeof parentChildTable.$inferSelect;
export type NewParentChild = typeof parentChildTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  familyMembers: familyMembersTable,
  marriages: marriagesTable,
  parentChild: parentChildTable
};