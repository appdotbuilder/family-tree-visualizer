import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FamilyMemberForm } from '@/components/FamilyMemberForm';
import { MarriageForm } from '@/components/MarriageForm';
import { ParentChildForm } from '@/components/ParentChildForm';
import { FamilyMemberCard } from '@/components/FamilyMemberCard';
import { FamilyStats } from '@/components/FamilyStats';
import { EmptyState } from '@/components/EmptyState';
import { SuccessToast } from '@/components/SuccessToast';
import { QuickStartGuide } from '@/components/QuickStartGuide';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { 
  FamilyMember, 
  CreateFamilyMemberInput, 
  CreateMarriageInput, 
  CreateParentChildInput,
  Marriage,
  ParentChild
} from '../../server/src/schema';

function App() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [marriages, setMarriages] = useState<Marriage[]>([]);
  const [parentChildRelations, setParentChildRelations] = useState<ParentChild[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [error, setError] = useState<string>('');
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{ title: string; message: string } | null>(null);

  // No need for form states since we use component forms

  // Dialog states
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [showMarriageDialog, setShowMarriageDialog] = useState(false);
  const [showParentChildDialog, setShowParentChildDialog] = useState(false);

  const loadFamilyTreeData = useCallback(async () => {
    try {
      const [membersResponse, marriagesResponse, relationsResponse] = await Promise.all([
        trpc.getFamilyMembers.query(),
        trpc.getMarriages.query(),
        trpc.getParentChildRelationships.query()
      ]);
      setFamilyMembers(membersResponse);
      setMarriages(marriagesResponse);
      setParentChildRelations(relationsResponse);
    } catch (error) {
      console.error('Failed to load family tree data:', error);
      setError('Failed to load family tree data. Please try refreshing the page.');
      setShowError(true);
    }
  }, []);

  useEffect(() => {
    loadFamilyTreeData();
  }, [loadFamilyTreeData]);

  const handleCreateMember = async (memberData: CreateFamilyMemberInput) => {
    setIsLoading(true);
    try {
      const response = await trpc.createFamilyMember.mutate(memberData);
      setFamilyMembers((prev: FamilyMember[]) => [...prev, response]);
      setShowMemberDialog(false);
      setSuccessMessage({
        title: 'Family Member Added!',
        message: `${response.first_name} ${response.last_name} has been successfully added to your family tree.`
      });
    } catch (error) {
      console.error('Failed to create family member:', error);
      setError('Failed to create family member. Please try again.');
      setShowError(true);
      throw error; // Re-throw to let the form handle it
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMarriage = async (marriageData: CreateMarriageInput) => {
    setIsLoading(true);
    try {
      const response = await trpc.createMarriage.mutate(marriageData);
      setMarriages((prev: Marriage[]) => [...prev, response]);
      setShowMarriageDialog(false);
      setSuccessMessage({
        title: 'Marriage Created!',
        message: `The marriage between ${getMemberName(response.spouse1_id)} and ${getMemberName(response.spouse2_id)} has been recorded.`
      });
    } catch (error) {
      console.error('Failed to create marriage:', error);
      setError('Failed to create marriage. Please check that both people are not already married to each other.');
      setShowError(true);
      throw error; // Re-throw to let the form handle it
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateParentChildRelation = async (relationData: CreateParentChildInput) => {
    setIsLoading(true);
    try {
      const response = await trpc.createParentChild.mutate(relationData);
      setParentChildRelations((prev: ParentChild[]) => [...prev, response]);
      setShowParentChildDialog(false);
      setSuccessMessage({
        title: 'Relationship Created!',
        message: `The parent-child relationship between ${getMemberName(response.parent_id)} and ${getMemberName(response.child_id)} has been established.`
      });
    } catch (error) {
      console.error('Failed to create parent-child relationship:', error);
      setError('Failed to create parent-child relationship. Please check that this relationship does not already exist.');
      setShowError(true);
      throw error; // Re-throw to let the form handle it
    } finally {
      setIsLoading(false);
    }
  };

  const getMemberName = (id: number): string => {
    const member = familyMembers.find(m => m.id === id);
    return member ? `${member.first_name} ${member.last_name}` : 'Unknown';
  };

  const getSpousesForMember = (memberId: number): Marriage[] => {
    return marriages.filter(m => 
      (m.spouse1_id === memberId || m.spouse2_id === memberId) && !m.divorce_date
    );
  };

  const getChildrenForMember = (memberId: number): ParentChild[] => {
    return parentChildRelations.filter(pc => pc.parent_id === memberId);
  };

  const getParentsForMember = (memberId: number): ParentChild[] => {
    return parentChildRelations.filter(pc => pc.child_id === memberId);
  };



  return (
    <div className="container mx-auto p-6 bg-gradient-to-br from-green-50 to-blue-100 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-green-900 mb-2">🌳 Family Tree Manager</h1>
        <p className="text-green-700 text-lg">Build and explore your family connections</p>
        <p className="text-green-600 text-sm mt-2 max-w-2xl mx-auto">
          Create a comprehensive family tree by adding family members and defining their relationships. 
          Track marriages, parent-child connections, and explore your family's story through generations.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8 justify-center">
        <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white shadow-lg">
              👤 Add Family Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                👤 Add New Family Member
              </DialogTitle>
            </DialogHeader>
            <FamilyMemberForm 
              onSubmit={handleCreateMember}
              isLoading={isLoading}
              onCancel={() => setShowMemberDialog(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showMarriageDialog} onOpenChange={setShowMarriageDialog}>
          <DialogTrigger asChild>
            <Button className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg" disabled={familyMembers.length < 2}>
              💍 Create Marriage
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                💍 Create Marriage Relationship
              </DialogTitle>
            </DialogHeader>
            <MarriageForm 
              onSubmit={handleCreateMarriage}
              familyMembers={familyMembers}
              isLoading={isLoading}
              onCancel={() => setShowMarriageDialog(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showParentChildDialog} onOpenChange={setShowParentChildDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg" disabled={familyMembers.length < 2}>
              👨‍👩‍👧‍👦 Add Parent-Child Relationship
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                👨‍👩‍👧‍👦 Create Parent-Child Relationship
              </DialogTitle>
            </DialogHeader>
            <ParentChildForm 
              onSubmit={handleCreateParentChildRelation}
              familyMembers={familyMembers}
              isLoading={isLoading}
              onCancel={() => setShowParentChildDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Start Guide - show only when no family members exist */}
      {familyMembers.length === 0 && (
        <div className="mb-8">
          <QuickStartGuide
            onAddMember={() => setShowMemberDialog(true)}
            onAddMarriage={() => setShowMarriageDialog(true)}
            onAddRelationship={() => setShowParentChildDialog(true)}
            hasFamilyMembers={familyMembers.length > 0}
            canCreateRelationships={familyMembers.length >= 2}
          />
        </div>
      )}

      {/* Statistics */}
      {familyMembers.length > 0 && (
        <FamilyStats 
          familyMembers={familyMembers}
          marriages={marriages}
          parentChildRelations={parentChildRelations}
        />
      )}

      {/* Main Content */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="members" className="flex items-center gap-2">
            👥 Family Members ({familyMembers.length})
          </TabsTrigger>
          <TabsTrigger value="marriages" className="flex items-center gap-2">
            💍 Marriages ({marriages.length})
          </TabsTrigger>
          <TabsTrigger value="relationships" className="flex items-center gap-2">
            👨‍👩‍👧‍👦 Parent-Child ({parentChildRelations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          {familyMembers.length === 0 ? (
            <EmptyState
              title="No family members yet"
              description="Start building your family tree by adding your first family member. You can then create relationships between family members to map out your family connections."
              actionText="Add First Member"
              onAction={() => setShowMemberDialog(true)}
              icon="👥"
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {familyMembers.map((member: FamilyMember) => {
                const memberSpouses = getSpousesForMember(member.id);
                const memberChildren = getChildrenForMember(member.id);
                const memberParents = getParentsForMember(member.id);

                return (
                  <FamilyMemberCard
                    key={member.id}
                    member={member}
                    spouses={memberSpouses}
                    children={memberChildren}
                    parents={memberParents}
                    isSelected={selectedMember?.id === member.id}
                    onSelect={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
                    getMemberName={getMemberName}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="marriages">
          {marriages.length === 0 ? (
            <EmptyState
              title="No marriages recorded yet"
              description="Connect family members through marriage relationships. You can specify marriage dates and even divorce dates if applicable."
              actionText={familyMembers.length >= 2 ? "Create Marriage" : undefined}
              onAction={familyMembers.length >= 2 ? () => setShowMarriageDialog(true) : undefined}
              icon="💍"
            />
          ) : (
            <div className="grid gap-4">
              {marriages.map((marriage: Marriage) => {
                const isCurrentlyMarried = !marriage.divorce_date;
                const marriageDuration = marriage.marriage_date && marriage.divorce_date 
                  ? `${marriage.divorce_date.getFullYear() - marriage.marriage_date.getFullYear()} years`
                  : marriage.marriage_date 
                  ? `${new Date().getFullYear() - marriage.marriage_date.getFullYear()} years`
                  : null;

                return (
                  <Card key={marriage.id} className="bg-white hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="text-3xl">{isCurrentlyMarried ? '💍' : '💔'}</div>
                          <div className="flex-1">
                            <p className="font-medium text-lg">
                              {getMemberName(marriage.spouse1_id)} ↔ {getMemberName(marriage.spouse2_id)}
                            </p>
                            <div className="text-sm text-gray-600 space-y-1 mt-2">
                              {marriage.marriage_date && (
                                <p>
                                  <span className="font-medium">Married:</span> {marriage.marriage_date.toLocaleDateString()}
                                  {marriageDuration && <span className="ml-2 text-xs text-gray-500">({marriageDuration})</span>}
                                </p>
                              )}
                              {marriage.divorce_date && (
                                <p>
                                  <span className="font-medium">Divorced:</span> {marriage.divorce_date.toLocaleDateString()}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                Added to family tree: {marriage.created_at.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge 
                            variant={isCurrentlyMarried ? "default" : "destructive"}
                            className={isCurrentlyMarried ? "bg-green-100 text-green-800" : ""}
                          >
                            {isCurrentlyMarried ? "Currently Married" : "Divorced"}
                          </Badge>
                          {marriage.marriage_date && (
                            <span className="text-xs text-gray-500">
                              {marriage.marriage_date.getFullYear()}
                              {marriage.divorce_date && ` - ${marriage.divorce_date.getFullYear()}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="relationships">
          {parentChildRelations.length === 0 ? (
            <EmptyState
              title="No parent-child relationships yet"
              description="Build your family lineage by defining parent-child relationships. This helps establish the generational structure of your family tree."
              actionText={familyMembers.length >= 2 ? "Add Relationship" : undefined}
              onAction={familyMembers.length >= 2 ? () => setShowParentChildDialog(true) : undefined}
              icon="👨‍👩‍👧‍👦"
            />
          ) : (
            <div className="grid gap-4">
              {parentChildRelations.map((relation: ParentChild) => {
                const parent = familyMembers.find(m => m.id === relation.parent_id);
                const child = familyMembers.find(m => m.id === relation.child_id);
                const getAge = (member: FamilyMember | undefined) => {
                  if (!member?.birth_date) return null;
                  const today = new Date();
                  const birthDate = new Date(member.birth_date);
                  return today.getFullYear() - birthDate.getFullYear();
                };

                return (
                  <Card key={relation.id} className="bg-white hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">👨‍👩‍👧‍👦</div>
                        <div className="flex-1">
                          <p className="font-medium text-lg">
                            {getMemberName(relation.parent_id)} → {getMemberName(relation.child_id)}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            Parent-Child relationship
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="p-2 bg-blue-50 rounded border">
                              <p className="font-medium text-blue-800">Parent</p>
                              <p className="text-blue-700">
                                {getMemberName(relation.parent_id)}
                                {getAge(parent) && <span className="ml-1">({getAge(parent)} years old)</span>}
                              </p>
                            </div>
                            <div className="p-2 bg-green-50 rounded border">
                              <p className="font-medium text-green-800">Child</p>
                              <p className="text-green-700">
                                {getMemberName(relation.child_id)}
                                {getAge(child) && <span className="ml-1">({getAge(child)} years old)</span>}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-3">
                            Relationship added: {relation.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Error Dialog */}
      <AlertDialog open={showError} onOpenChange={setShowError}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>❌ Error</AlertDialogTitle>
            <AlertDialogDescription>
              {error}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setShowError(false)} className="bg-red-600 hover:bg-red-700">
              OK
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Toast */}
      {successMessage && (
        <SuccessToast
          isOpen={!!successMessage}
          onClose={() => setSuccessMessage(null)}
          title={successMessage.title}
          message={successMessage.message}
        />
      )}
    </div>
  );
}

export default App;