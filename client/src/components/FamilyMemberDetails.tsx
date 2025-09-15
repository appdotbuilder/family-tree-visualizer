import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Heart, Users, Baby, Skull } from 'lucide-react';
import type { FamilyMemberWithRelationships } from '../../../server/src/schema';

interface FamilyMemberDetailsProps {
  memberDetails: FamilyMemberWithRelationships;
}

export function FamilyMemberDetails({ memberDetails }: FamilyMemberDetailsProps) {
  const { member, parents, children, spouses } = memberDetails;

  // Helper function to format dates
  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Calculate age
  const calculateAge = (birthDate: Date | null, deathDate: Date | null) => {
    if (!birthDate) return null;
    const endDate = deathDate || new Date();
    return endDate.getFullYear() - birthDate.getFullYear();
  };

  // Get initials for avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const age = calculateAge(member.birth_date, member.death_date);
  const isDeceased = !!member.death_date;

  return (
    <div className="space-y-4">
      {/* Main Member Info */}
      <div className="text-center">
        <Avatar className="w-20 h-20 mx-auto mb-3 border-4 border-white shadow-lg">
          <AvatarImage src={member.picture_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white text-lg font-bold">
            {getInitials(member.first_name, member.last_name)}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-bold text-gray-900">
          {member.first_name} {member.last_name}
        </h2>
        {age && (
          <p className="text-gray-600">
            {isDeceased ? `Lived ${age} years` : `${age} years old`}
          </p>
        )}
      </div>

      <Separator />

      {/* Life Dates */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          Life Timeline
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Born:</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {formatDate(member.birth_date)}
            </Badge>
          </div>
          
          {isDeceased && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Died:</span>
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                <Skull className="w-3 h-3 mr-1" />
                {formatDate(member.death_date)}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Parents */}
      {parents.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Parents ({parents.length})
            </h3>
            <div className="space-y-2">
              {parents.map((parent) => (
                <div key={parent.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={parent.picture_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white text-xs">
                      {getInitials(parent.first_name, parent.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {parent.first_name} {parent.last_name}
                    </p>
                    {parent.birth_date && (
                      <p className="text-xs text-gray-500">
                        Born {new Date(parent.birth_date).getFullYear()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Spouses */}
      {spouses.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Heart className="w-4 h-4 mr-2 text-pink-500" />
              {spouses.length === 1 ? 'Spouse' : 'Spouses'} ({spouses.length})
            </h3>
            <div className="space-y-2">
              {spouses.map((spouseData) => {
                const { spouse, marriage } = spouseData;
                const marriageYear = marriage.marriage_date ? new Date(marriage.marriage_date).getFullYear() : null;
                const divorceYear = marriage.divorce_date ? new Date(marriage.divorce_date).getFullYear() : null;
                
                return (
                  <div key={spouse.id} className="p-2 rounded-lg bg-pink-50 border border-pink-100">
                    <div className="flex items-center space-x-3 mb-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={spouse.picture_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-xs">
                          {getInitials(spouse.first_name, spouse.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {spouse.first_name} {spouse.last_name}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          {marriageYear && (
                            <span>Married {marriageYear}</span>
                          )}
                          {divorceYear && (
                            <span>• Divorced {divorceYear}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Children */}
      {children.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Baby className="w-4 h-4 mr-2" />
              Children ({children.length})
            </h3>
            <div className="space-y-2">
              {children.map((child) => (
                <div key={child.id} className="flex items-center space-x-3 p-2 rounded-lg bg-yellow-50">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={child.picture_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xs">
                      {getInitials(child.first_name, child.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {child.first_name} {child.last_name}
                    </p>
                    {child.birth_date && (
                      <p className="text-xs text-gray-500">
                        Born {new Date(child.birth_date).getFullYear()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Empty state for relationships */}
      {parents.length === 0 && spouses.length === 0 && children.length === 0 && (
        <>
          <Separator />
          <div className="text-center py-4 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No family relationships recorded</p>
          </div>
        </>
      )}
    </div>
  );
}