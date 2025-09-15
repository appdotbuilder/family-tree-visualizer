import { serial, text, pgTable, timestamp, date, pgEnum, integer, primaryKey, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Gender enum
export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);

// Family members table
export const familyMembersTable = pgTable('family_members', {
  id: serial('id').primaryKey(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  birth_date: date('birth_date'), // Nullable by default
  gender: genderEnum('gender'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Marriages table
export const marriagesTable = pgTable('marriages', {
  id: serial('id').primaryKey(),
  spouse1_id: integer('spouse1_id').notNull().references(() => familyMembersTable.id, { onDelete: 'cascade' }),
  spouse2_id: integer('spouse2_id').notNull().references(() => familyMembersTable.id, { onDelete: 'cascade' }),
  marriage_date: date('marriage_date'), // Nullable by default
  divorce_date: date('divorce_date'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Ensure no duplicate marriages (either direction)
  uniqueMarriage: unique('unique_marriage').on(table.spouse1_id, table.spouse2_id),
  // Ensure spouse1_id is always less than spouse2_id to prevent duplicate entries
  // This will be handled in application logic
}));

// Parent-child relationships table
export const parentChildTable = pgTable('parent_child_relationships', {
  id: serial('id').primaryKey(),
  parent_id: integer('parent_id').notNull().references(() => familyMembersTable.id, { onDelete: 'cascade' }),
  child_id: integer('child_id').notNull().references(() => familyMembersTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Ensure no duplicate parent-child relationships
  uniqueParentChild: unique('unique_parent_child').on(table.parent_id, table.child_id),
}));

// Relations definitions for Drizzle queries
export const familyMembersRelations = relations(familyMembersTable, ({ many }) => ({
  marriagesAsSpouse1: many(marriagesTable, { relationName: 'spouse1' }),
  marriagesAsSpouse2: many(marriagesTable, { relationName: 'spouse2' }),
  asParent: many(parentChildTable, { relationName: 'parent' }),
  asChild: many(parentChildTable, { relationName: 'child' }),
}));

export const marriagesRelations = relations(marriagesTable, ({ one }) => ({
  spouse1: one(familyMembersTable, {
    fields: [marriagesTable.spouse1_id],
    references: [familyMembersTable.id],
    relationName: 'spouse1',
  }),
  spouse2: one(familyMembersTable, {
    fields: [marriagesTable.spouse2_id],
    references: [familyMembersTable.id],
    relationName: 'spouse2',
  }),
}));

export const parentChildRelations = relations(parentChildTable, ({ one }) => ({
  parent: one(familyMembersTable, {
    fields: [parentChildTable.parent_id],
    references: [familyMembersTable.id],
    relationName: 'parent',
  }),
  child: one(familyMembersTable, {
    fields: [parentChildTable.child_id],
    references: [familyMembersTable.id],
    relationName: 'child',
  }),
}));

// TypeScript types for the table schemas
export type FamilyMember = typeof familyMembersTable.$inferSelect;
export type NewFamilyMember = typeof familyMembersTable.$inferInsert;

export type Marriage = typeof marriagesTable.$inferSelect;
export type NewMarriage = typeof marriagesTable.$inferInsert;

export type ParentChild = typeof parentChildTable.$inferSelect;
export type NewParentChild = typeof parentChildTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  familyMembers: familyMembersTable,
  marriages: marriagesTable,
  parentChild: parentChildTable,
};