import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FamilyMember, Marriage, ParentChild } from '../../../server/src/schema';

interface FamilyMemberCardProps {
  member: FamilyMember;
  spouses: Marriage[];
  children: ParentChild[];
  parents: ParentChild[];
  isSelected: boolean;
  onSelect: () => void;
  getMemberName: (id: number) => string;
}

export function FamilyMemberCard({ 
  member, 
  spouses, 
  children, 
  parents, 
  isSelected, 
  onSelect, 
  getMemberName 
}: FamilyMemberCardProps) {
  const getGenderEmoji = (gender: 'male' | 'female' | 'other' | null): string => {
    switch (gender) {
      case 'male': return '👨';
      case 'female': return '👩';
      case 'other': return '🧑';
      default: return '👤';
    }
  };

  const getAge = (): string => {
    if (!member.birth_date) return '';
    const today = new Date();
    const birthDate = new Date(member.birth_date);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return ` (${age - 1} years old)`;
    }
    return ` (${age} years old)`;
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg animate-fade-in-up ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-2xl shadow-md">
            {getGenderEmoji(member.gender)}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-900">
              {member.first_name} {member.last_name}
            </CardTitle>
            <div className="text-sm text-gray-600 space-y-1">
              {member.birth_date && (
                <p>
                  Born: {member.birth_date.toLocaleDateString()}
                  {getAge()}
                </p>
              )}
              {member.gender && (
                <p className="capitalize">
                  Gender: {member.gender}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Parents */}
          {parents.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Parents:</p>
              <div className="flex flex-wrap gap-2">
                {parents.map((relation: ParentChild) => (
                  <Badge key={relation.id} variant="outline" className="parent-badge">
                    👨‍👩 {getMemberName(relation.parent_id)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Spouses */}
          {spouses.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Married to:</p>
              <div className="flex flex-wrap gap-2">
                {spouses.map((marriage: Marriage) => {
                  const spouseId = marriage.spouse1_id === member.id ? marriage.spouse2_id : marriage.spouse1_id;
                  const isCurrentlyMarried = !marriage.divorce_date;
                  return (
                    <Badge 
                      key={marriage.id} 
                      variant="outline" 
                      className={isCurrentlyMarried ? "marriage-badge" : "bg-gray-100 text-gray-600"}
                    >
                      {isCurrentlyMarried ? '💍' : '💔'} {getMemberName(spouseId)}
                      {marriage.marriage_date && (
                        <span className="ml-1 text-xs">
                          ({marriage.marriage_date.getFullYear()})
                        </span>
                      )}
                      {marriage.divorce_date && (
                        <span className="ml-1 text-xs">
                          - {marriage.divorce_date.getFullYear()}
                        </span>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Children */}
          {children.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Children:</p>
              <div className="flex flex-wrap gap-2">
                {children.map((relation: ParentChild) => (
                  <Badge key={relation.id} variant="outline" className="child-badge">
                    👶 {getMemberName(relation.child_id)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {parents.length === 0 && spouses.length === 0 && children.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 italic">No relationships defined yet</p>
              <p className="text-xs text-gray-400 mt-1">Click to select and view details</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Added: {member.created_at.toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}