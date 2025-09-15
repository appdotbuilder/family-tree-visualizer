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
  createParentChildInputSchema
} from './schema';

// Import handlers
import { createFamilyMember } from './handlers/create_family_member';
import { getFamilyMembers } from './handlers/get_family_members';
import { getFamilyMemberDetails } from './handlers/get_family_member_details';
import { getFamilyTreeNetwork } from './handlers/get_family_tree_network';
import { createMarriage } from './handlers/create_marriage';
import { createParentChildRelation } from './handlers/create_parent_child_relation';
import { updateFamilyMember } from './handlers/update_family_member';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Family member operations
  createFamilyMember: publicProcedure
    .input(createFamilyMemberInputSchema)
    .mutation(({ input }) => createFamilyMember(input)),

  getFamilyMembers: publicProcedure
    .query(() => getFamilyMembers()),

  getFamilyMemberDetails: publicProcedure
    .input(z.object({ memberId: z.number() }))
    .query(({ input }) => getFamilyMemberDetails(input.memberId)),

  updateFamilyMember: publicProcedure
    .input(updateFamilyMemberInputSchema)
    .mutation(({ input }) => updateFamilyMember(input)),

  // Family tree network data for visualization
  getFamilyTreeNetwork: publicProcedure
    .query(() => getFamilyTreeNetwork()),

  // Marriage operations
  createMarriage: publicProcedure
    .input(createMarriageInputSchema)
    .mutation(({ input }) => createMarriage(input)),

  // Parent-child relationship operations
  createParentChildRelation: publicProcedure
    .input(createParentChildInputSchema)
    .mutation(({ input }) => createParentChildRelation(input)),
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
  console.log(`Family Tree TRPC server listening at port: ${port}`);
}

start();