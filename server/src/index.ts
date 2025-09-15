import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createFamilyMemberInputSchema,
  updateFamilyMemberInputSchema,
  createMarriageInputSchema,
  updateMarriageInputSchema,
  createParentChildInputSchema
} from './schema';

// Import handlers
import { createFamilyMember } from './handlers/create_family_member';
import { getFamilyMembers } from './handlers/get_family_members';
import { getFamilyMemberById } from './handlers/get_family_member_by_id';
import { updateFamilyMember } from './handlers/update_family_member';
import { createMarriage } from './handlers/create_marriage';
import { getMarriages } from './handlers/get_marriages';
import { updateMarriage } from './handlers/update_marriage';
import { deleteMarriage } from './handlers/delete_marriage';
import { createParentChild } from './handlers/create_parent_child';
import { getParentChildRelationships } from './handlers/get_parent_child_relationships';
import { deleteParentChild } from './handlers/delete_parent_child';
import { getFamilyMemberWithRelationships } from './handlers/get_family_member_with_relationships';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Family Member Routes
  createFamilyMember: publicProcedure
    .input(createFamilyMemberInputSchema)
    .mutation(({ input }) => createFamilyMember(input)),
  
  getFamilyMembers: publicProcedure
    .query(() => getFamilyMembers()),
  
  getFamilyMemberById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getFamilyMemberById(input.id)),
  
  updateFamilyMember: publicProcedure
    .input(updateFamilyMemberInputSchema)
    .mutation(({ input }) => updateFamilyMember(input)),

  getFamilyMemberWithRelationships: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getFamilyMemberWithRelationships(input.id)),

  // Marriage Routes
  createMarriage: publicProcedure
    .input(createMarriageInputSchema)
    .mutation(({ input }) => createMarriage(input)),
  
  getMarriages: publicProcedure
    .query(() => getMarriages()),
  
  updateMarriage: publicProcedure
    .input(updateMarriageInputSchema)
    .mutation(({ input }) => updateMarriage(input)),
  
  deleteMarriage: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMarriage(input.id)),

  // Parent-Child Relationship Routes
  createParentChild: publicProcedure
    .input(createParentChildInputSchema)
    .mutation(({ input }) => createParentChild(input)),
  
  getParentChildRelationships: publicProcedure
    .query(() => getParentChildRelationships()),
  
  deleteParentChild: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteParentChild(input.id)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();