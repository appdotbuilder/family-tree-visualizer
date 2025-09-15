import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FamilyMember, Marriage, ParentChild } from '../../../server/src/schema';

interface FamilyStatsProps {
  familyMembers: FamilyMember[];
  marriages: Marriage[];
  parentChildRelations: ParentChild[];
}

export function FamilyStats({ familyMembers, marriages, parentChildRelations }: FamilyStatsProps) {
  const currentMarriages = marriages.filter(m => !m.divorce_date);
  const divorces = marriages.filter(m => m.divorce_date);
  
  const genderCounts = familyMembers.reduce((acc, member) => {
    const gender = member.gender || 'unknown';
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageAge = (): string => {
    const membersWithAge = familyMembers.filter(m => m.birth_date);
    if (membersWithAge.length === 0) return 'N/A';
    
    const totalAge = membersWithAge.reduce((sum, member) => {
      const today = new Date();
      const birthDate = new Date(member.birth_date!);
      const age = today.getFullYear() - birthDate.getFullYear();
      return sum + age;
    }, 0);
    
    return `${Math.round(totalAge / membersWithAge.length)} years`;
  };

  const generationsCount = (): number => {
    // Simple heuristic: find the maximum depth in parent-child relationships
    const parents = new Set(parentChildRelations.map(pc => pc.parent_id));
    const children = new Set(parentChildRelations.map(pc => pc.child_id));
    
    // Root generation: people who are parents but not children
    const rootGeneration = familyMembers.filter(m => parents.has(m.id) && !children.has(m.id));
    
    if (rootGeneration.length === 0) return 1; // No clear hierarchy
    
    let maxDepth = 1;
    const visited = new Set<number>();
    
    const dfs = (memberId: number, depth: number) => {
      if (visited.has(memberId)) return depth;
      visited.add(memberId);
      
      const childRelations = parentChildRelations.filter(pc => pc.parent_id === memberId);
      let maxChildDepth = depth;
      
      for (const relation of childRelations) {
        const childDepth = dfs(relation.child_id, depth + 1);
        maxChildDepth = Math.max(maxChildDepth, childDepth);
      }
      
      return maxChildDepth;
    };
    
    for (const root of rootGeneration) {
      maxDepth = Math.max(maxDepth, dfs(root.id, 1));
    }
    
    return maxDepth;
  };

  const stats = [
    {
      title: 'Family Members',
      value: familyMembers.length,
      icon: '👥',
      color: 'bg-blue-500'
    },
    {
      title: 'Current Marriages',
      value: currentMarriages.length,
      icon: '💍',
      color: 'bg-pink-500'
    },
    {
      title: 'Parent-Child Links',
      value: parentChildRelations.length,
      icon: '👨‍👩‍👧‍👦',
      color: 'bg-green-500'
    },
    {
      title: 'Generations',
      value: generationsCount(),
      icon: '🌳',
      color: 'bg-emerald-500'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center text-white text-xl`}>
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {familyMembers.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-4 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Family Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-600 mb-2">Gender Distribution</p>
                <div className="space-y-1">
                  {Object.entries(genderCounts).map(([gender, count]) => (
                    <div key={gender} className="flex justify-between text-sm">
                      <span className="capitalize">{gender === 'unknown' ? 'Not specified' : gender}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Marriage Statistics</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Active marriages:</span>
                    <span className="font-medium">{currentMarriages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Divorces:</span>
                    <span className="font-medium">{divorces.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total marriages:</span>
                    <span className="font-medium">{marriages.length}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Age Information</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Average age:</span>
                    <span className="font-medium">{averageAge()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>With birth dates:</span>
                    <span className="font-medium">
                      {familyMembers.filter(m => m.birth_date).length}/{familyMembers.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Generations:</span>
                    <span className="font-medium">{generationsCount()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}