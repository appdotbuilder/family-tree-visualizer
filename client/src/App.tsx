import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

  // Form states
  const [memberFormData, setMemberFormData] = useState<CreateFamilyMemberInput>({
    first_name: '',
    last_name: '',
    birth_date: null,
    death_date: null,
    picture_url: null
  });

  const [marriageFormData, setMarriageFormData] = useState<CreateMarriageInput>({
    person1_id: 0,
    person2_id: 0,
    marriage_date: null,
    divorce_date: null
  });

  const [parentChildFormData, setParentChildFormData] = useState<CreateParentChildInput>({
    parent_id: 0,
    child_id: 0
  });

  // Dialog states
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [showMarriageDialog, setShowMarriageDialog] = useState(false);
  const [showParentChildDialog, setShowParentChildDialog] = useState(false);

  const loadFamilyTreeData = useCallback(async () => {
    try {
      const result = await trpc.getFamilyTreeNetwork.query();
      setFamilyMembers(result.members);
      setMarriages(result.marriages);
      setParentChildRelations(result.parentChildRelations);
    } catch (error) {
      console.error('Failed to load family tree data:', error);
    }
  }, []);

  useEffect(() => {
    loadFamilyTreeData();
  }, [loadFamilyTreeData]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createFamilyMember.mutate(memberFormData);
      setFamilyMembers((prev: FamilyMember[]) => [...prev, response]);
      setMemberFormData({
        first_name: '',
        last_name: '',
        birth_date: null,
        death_date: null,
        picture_url: null
      });
      setShowMemberDialog(false);
    } catch (error) {
      console.error('Failed to create family member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMarriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (marriageFormData.person1_id === 0 || marriageFormData.person2_id === 0) {
      alert('Please select both family members for the marriage');
      return;
    }
    setIsLoading(true);
    try {
      const response = await trpc.createMarriage.mutate(marriageFormData);
      setMarriages((prev: Marriage[]) => [...prev, response]);
      setMarriageFormData({
        person1_id: 0,
        person2_id: 0,
        marriage_date: null,
        divorce_date: null
      });
      setShowMarriageDialog(false);
    } catch (error) {
      console.error('Failed to create marriage:', error);
      alert('Failed to create marriage. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateParentChildRelation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parentChildFormData.parent_id === 0 || parentChildFormData.child_id === 0) {
      alert('Please select both parent and child for the relationship');
      return;
    }
    setIsLoading(true);
    try {
      const response = await trpc.createParentChildRelation.mutate(parentChildFormData);
      setParentChildRelations((prev: ParentChild[]) => [...prev, response]);
      setParentChildFormData({
        parent_id: 0,
        child_id: 0
      });
      setShowParentChildDialog(false);
    } catch (error) {
      console.error('Failed to create parent-child relationship:', error);
      alert('Failed to create parent-child relationship. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getMemberName = (id: number): string => {
    const member = familyMembers.find(m => m.id === id);
    return member ? `${member.first_name} ${member.last_name}` : 'Unknown';
  };

  const getMarriagesForMember = (memberId: number): Marriage[] => {
    return marriages.filter(m => m.person1_id === memberId || m.person2_id === memberId);
  };

  const getChildrenForMember = (memberId: number): ParentChild[] => {
    return parentChildRelations.filter(pc => pc.parent_id === memberId);
  };

  const getParentsForMember = (memberId: number): ParentChild[] => {
    return parentChildRelations.filter(pc => pc.child_id === memberId);
  };

  return (
    <div className="container mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-900 mb-2">🌳 Family Tree Explorer</h1>
        <p className="text-indigo-700">Explore your family connections and relationships</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8 justify-center">
        <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              👤 Add Family Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Family Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={memberFormData.first_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMemberFormData((prev: CreateFamilyMemberInput) => ({ ...prev, first_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={memberFormData.last_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMemberFormData((prev: CreateFamilyMemberInput) => ({ ...prev, last_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="birth_date">Birth Date (Optional)</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={memberFormData.birth_date ? memberFormData.birth_date.toISOString().split('T')[0] : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMemberFormData((prev: CreateFamilyMemberInput) => ({ 
                      ...prev, 
                      birth_date: e.target.value ? new Date(e.target.value) : null 
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="picture_url">Picture URL (Optional)</Label>
                <Input
                  id="picture_url"
                  type="url"
                  value={memberFormData.picture_url || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMemberFormData((prev: CreateFamilyMemberInput) => ({ 
                      ...prev, 
                      picture_url: e.target.value || null 
                    }))
                  }
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating...' : 'Add Member'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showMarriageDialog} onOpenChange={setShowMarriageDialog}>
          <DialogTrigger asChild>
            <Button className="bg-pink-600 hover:bg-pink-700 text-white">
              💍 Create Marriage
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Marriage Relationship</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateMarriage} className="space-y-4">
              <div>
                <Label>First Person</Label>
                <Select 
                  value={marriageFormData.person1_id.toString()} 
                  onValueChange={(value) => setMarriageFormData(prev => ({ ...prev, person1_id: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select first person" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyMembers.map((member: FamilyMember) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Second Person</Label>
                <Select 
                  value={marriageFormData.person2_id.toString()} 
                  onValueChange={(value) => setMarriageFormData(prev => ({ ...prev, person2_id: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select second person" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyMembers.map((member: FamilyMember) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="marriage_date">Marriage Date (Optional)</Label>
                <Input
                  id="marriage_date"
                  type="date"
                  value={marriageFormData.marriage_date ? marriageFormData.marriage_date.toISOString().split('T')[0] : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMarriageFormData((prev: CreateMarriageInput) => ({ 
                      ...prev, 
                      marriage_date: e.target.value ? new Date(e.target.value) : null 
                    }))
                  }
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating...' : 'Create Marriage'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showParentChildDialog} onOpenChange={setShowParentChildDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              👨‍👩‍👧‍👦 Add Parent-Child Relationship
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Parent-Child Relationship</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateParentChildRelation} className="space-y-4">
              <div>
                <Label>Parent</Label>
                <Select 
                  value={parentChildFormData.parent_id.toString()} 
                  onValueChange={(value) => setParentChildFormData(prev => ({ ...prev, parent_id: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyMembers.map((member: FamilyMember) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Child</Label>
                <Select 
                  value={parentChildFormData.child_id.toString()} 
                  onValueChange={(value) => setParentChildFormData(prev => ({ ...prev, child_id: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyMembers.map((member: FamilyMember) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating...' : 'Create Relationship'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Family Members Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {familyMembers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-600 text-lg">No family members yet. Add your first family member above! 👆</p>
          </div>
        ) : (
          familyMembers.map((member: FamilyMember) => {
            const memberMarriages = getMarriagesForMember(member.id);
            const memberChildren = getChildrenForMember(member.id);
            const memberParents = getParentsForMember(member.id);

            return (
              <Card 
                key={member.id} 
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedMember?.id === member.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    {member.picture_url ? (
                      <img 
                        src={member.picture_url} 
                        alt={`${member.first_name} ${member.last_name}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-lg font-semibold">
                        {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {member.first_name} {member.last_name}
                      </CardTitle>
                      {member.birth_date && (
                        <p className="text-sm text-gray-600">
                          Born: {member.birth_date.toLocaleDateString()}
                        </p>
                      )}
                      {member.death_date && (
                        <p className="text-sm text-gray-600">
                          Died: {member.death_date.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Parents */}
                    {memberParents.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Parents:</p>
                        <div className="flex flex-wrap gap-1">
                          {memberParents.map((relation: ParentChild) => (
                            <Badge key={relation.id} variant="outline" className="text-xs">
                              👨‍👩 {getMemberName(relation.parent_id)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Spouses */}
                    {memberMarriages.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Married to:</p>
                        <div className="flex flex-wrap gap-1">
                          {memberMarriages.map((marriage: Marriage) => {
                            const spouseId = marriage.person1_id === member.id ? marriage.person2_id : marriage.person1_id;
                            return (
                              <Badge key={marriage.id} variant="outline" className="text-xs">
                                💍 {getMemberName(spouseId)}
                                {marriage.marriage_date && (
                                  <span className="ml-1">
                                    ({marriage.marriage_date.getFullYear()})
                                  </span>
                                )}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Children */}
                    {memberChildren.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Children:</p>
                        <div className="flex flex-wrap gap-1">
                          {memberChildren.map((relation: ParentChild) => (
                            <Badge key={relation.id} variant="outline" className="text-xs">
                              👶 {getMemberName(relation.child_id)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {memberParents.length === 0 && memberMarriages.length === 0 && memberChildren.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No relationships defined yet</p>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-3">
                    Added: {member.created_at.toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Relationship Summary */}
      {(marriages.length > 0 || parentChildRelations.length > 0) && (
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-indigo-900">Family Relationships</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {marriages.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-800 mb-2">💍 Marriages ({marriages.length})</h3>
                <div className="space-y-1">
                  {marriages.map((marriage: Marriage) => (
                    <p key={marriage.id} className="text-sm text-gray-600">
                      {getMemberName(marriage.person1_id)} ↔ {getMemberName(marriage.person2_id)}
                      {marriage.marriage_date && (
                        <span className="ml-2 text-xs">
                          ({marriage.marriage_date.toLocaleDateString()})
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            {parentChildRelations.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-800 mb-2">👨‍👩‍👧‍👦 Parent-Child ({parentChildRelations.length})</h3>
                <div className="space-y-1">
                  {parentChildRelations.map((relation: ParentChild) => (
                    <p key={relation.id} className="text-sm text-gray-600">
                      {getMemberName(relation.parent_id)} → {getMemberName(relation.child_id)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;