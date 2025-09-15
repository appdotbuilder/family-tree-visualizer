import { useState, useEffect, useCallback, useMemo } from 'react';
import { trpc } from '@/utils/trpc';
import { FamilyTreeNetwork } from './components/FamilyTreeNetwork';
import { FamilyMemberDetails } from './components/FamilyMemberDetails';
import { AddMemberDialog } from './components/AddMemberDialog';
import { DemoNotice } from './components/DemoNotice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, TreePine } from 'lucide-react';
import type { FamilyTreeNetwork as FamilyTreeNetworkType, FamilyMemberWithRelationships, FamilyMember } from '../../server/src/schema';

function App() {
  const [networkData, setNetworkData] = useState<FamilyTreeNetworkType | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedMemberDetails, setSelectedMemberDetails] = useState<FamilyMemberWithRelationships | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Load family tree network data
  const loadNetworkData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.getFamilyTreeNetwork.query();
      setNetworkData(data);
    } catch (error) {
      console.error('Failed to load family tree network:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasMembers = networkData && networkData.members.length > 0;

  // Demo data for when no real data is available
  const demoNetworkData: FamilyTreeNetworkType = useMemo(() => ({
    members: [
      {
        id: 1,
        first_name: 'John',
        last_name: 'Smith',
        birth_date: new Date('1950-05-15'),
        death_date: null,
        picture_url: null,
        created_at: new Date()
      },
      {
        id: 2,
        first_name: 'Mary',
        last_name: 'Smith',
        birth_date: new Date('1952-08-22'),
        death_date: null,
        picture_url: null,
        created_at: new Date()
      },
      {
        id: 3,
        first_name: 'Sarah',
        last_name: 'Johnson',
        birth_date: new Date('1975-03-10'),
        death_date: null,
        picture_url: null,
        created_at: new Date()
      },
      {
        id: 4,
        first_name: 'Michael',
        last_name: 'Smith',
        birth_date: new Date('1978-11-05'),
        death_date: null,
        picture_url: null,
        created_at: new Date()
      }
    ],
    marriages: [
      {
        id: 1,
        person1_id: 1,
        person2_id: 2,
        marriage_date: new Date('1973-06-20'),
        divorce_date: null,
        created_at: new Date()
      }
    ],
    parentChildRelations: [
      {
        id: 1,
        parent_id: 1,
        child_id: 3,
        created_at: new Date()
      },
      {
        id: 2,
        parent_id: 2,
        child_id: 3,
        created_at: new Date()
      },
      {
        id: 3,
        parent_id: 1,
        child_id: 4,
        created_at: new Date()
      },
      {
        id: 4,
        parent_id: 2,
        child_id: 4,
        created_at: new Date()
      }
    ]
  }), []);

  const displayData = hasMembers ? networkData : demoNetworkData;

  // Load selected member details
  const loadMemberDetails = useCallback(async (memberId: number) => {
    try {
      const details = await trpc.getFamilyMemberDetails.query({ memberId });
      if (details) {
        setSelectedMemberDetails(details);
      } else if (!hasMembers) {
        // Create demo details for demo mode
        const demoMember = demoNetworkData.members.find(m => m.id === memberId);
        if (demoMember) {
          const demoDetails: FamilyMemberWithRelationships = {
            member: demoMember,
            parents: demoNetworkData.parentChildRelations
              .filter(rel => rel.child_id === memberId)
              .map(rel => demoNetworkData.members.find(m => m.id === rel.parent_id))
              .filter(Boolean) as FamilyMember[],
            children: demoNetworkData.parentChildRelations
              .filter(rel => rel.parent_id === memberId)
              .map(rel => demoNetworkData.members.find(m => m.id === rel.child_id))
              .filter(Boolean) as FamilyMember[],
            spouses: demoNetworkData.marriages
              .filter(marriage => marriage.person1_id === memberId || marriage.person2_id === memberId)
              .map(marriage => {
                const spouseId = marriage.person1_id === memberId ? marriage.person2_id : marriage.person1_id;
                const spouse = demoNetworkData.members.find(m => m.id === spouseId);
                return spouse ? { spouse, marriage } : null;
              })
              .filter(Boolean) as { spouse: FamilyMember; marriage: typeof demoNetworkData.marriages[0] }[]
          };
          setSelectedMemberDetails(demoDetails);
        }
      } else {
        setSelectedMemberDetails(null);
      }
    } catch (error) {
      console.error('Failed to load member details:', error);
      setSelectedMemberDetails(null);
    }
  }, [hasMembers, demoNetworkData]);

  useEffect(() => {
    loadNetworkData();
  }, [loadNetworkData]);

  useEffect(() => {
    if (selectedMemberId) {
      loadMemberDetails(selectedMemberId);
    } else {
      setSelectedMemberDetails(null);
    }
  }, [selectedMemberId, loadMemberDetails]);

  const handleMemberSelect = useCallback((memberId: number) => {
    setSelectedMemberId(memberId);
  }, []);

  const handleMemberAdded = useCallback(() => {
    // Refresh the network data to include the new member
    loadNetworkData();
    setIsAddDialogOpen(false);
  }, [loadNetworkData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
                <TreePine className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Family Tree Explorer 🌳
                </h1>
                <p className="text-sm text-gray-600">Interactive family network visualization</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {(hasMembers || displayData.members.length > 0) && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white/70 px-3 py-1 rounded-full">
                  <Users className="w-4 h-4" />
                  <span>
                    {displayData.members.length} member{displayData.members.length !== 1 ? 's' : ''}
                    {!hasMembers && ' (demo)'}
                  </span>
                </div>
              )}
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Demo Notice */}
        {!hasMembers && !isLoading && (
          <DemoNotice onAddMember={() => setIsAddDialogOpen(true)} />
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading family tree...</p>
            </div>
          </div>
        ) : !hasMembers ? (
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
              <CardHeader className="text-center pb-6">
                <div className="p-6 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                  <TreePine className="w-16 h-16 text-purple-600" />
                </div>
                <CardTitle className="text-3xl text-gray-800 mb-2">Welcome to Family Tree Explorer! 🌳</CardTitle>
                <p className="text-lg text-gray-600">
                  Create your interactive family network visualization
                </p>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                    <div className="text-2xl mb-2">👥</div>
                    <h3 className="font-semibold text-green-800 mb-1">Add Members</h3>
                    <p className="text-sm text-green-600">Start by adding family members with their photos and dates</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg">
                    <div className="text-2xl mb-2">💕</div>
                    <h3 className="font-semibold text-pink-800 mb-1">Connect Relationships</h3>
                    <p className="text-sm text-pink-600">Link marriages and parent-child relationships</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                    <div className="text-2xl mb-2">🌐</div>
                    <h3 className="font-semibold text-blue-800 mb-1">Explore Network</h3>
                    <p className="text-sm text-blue-600">Navigate your interactive family bubble network</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Button 
                    onClick={() => setIsAddDialogOpen(true)}
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-lg px-8 py-3"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Start Building Your Family Tree
                  </Button>
                  <p className="text-sm text-gray-500">
                    Or check out the demo mode above to see how it works! 👆
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Family Tree Network Visualization */}
            <div className="lg:col-span-3">
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TreePine className="w-5 h-5 text-purple-600" />
                      <span>Family Network</span>
                    </div>
                    {!hasMembers && (
                      <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        📝 Demo Mode - Add your own family!
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FamilyTreeNetwork
                    data={displayData}
                    selectedMemberId={selectedMemberId}
                    onMemberSelect={handleMemberSelect}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Member Details Panel */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200 sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span>Member Details</span>
                    </div>
                    {!hasMembers && selectedMemberDetails && (
                      <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        📋 Sample
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedMemberDetails ? (
                    <FamilyMemberDetails memberDetails={selectedMemberDetails} />
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <p>Click on a family member bubble to view their details and relationships 👆</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Dialog */}
      <AddMemberDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onMemberAdded={handleMemberAdded}
      />
    </div>
  );
}

export default App;