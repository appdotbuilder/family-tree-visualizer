import { useRef, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Skull } from 'lucide-react';
import type { FamilyTreeNetwork as FamilyTreeNetworkType } from '../../../server/src/schema';

interface FamilyTreeNetworkProps {
  data: FamilyTreeNetworkType;
  selectedMemberId: number | null;
  onMemberSelect: (memberId: number) => void;
}

interface NetworkNode {
  id: number;
  x: number;
  y: number;
  member: FamilyTreeNetworkType['members'][0];
}

interface NetworkEdge {
  from: number;
  to: number;
  type: 'marriage' | 'parent-child';
  data?: FamilyTreeNetworkType['marriages'][0] | FamilyTreeNetworkType['parentChildRelations'][0];
}

export function FamilyTreeNetwork({ data, selectedMemberId, onMemberSelect }: FamilyTreeNetworkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Process network data for visualization
  const { nodes, edges } = useMemo(() => {
    if (!data || data.members.length === 0) {
      return { nodes: [], edges: [] };
    }

    const containerWidth = 800;
    const containerHeight = 600;
    
    // Create nodes with positions - use more sophisticated layout
    const nodes: NetworkNode[] = data.members.map((member, index) => {
      const numMembers = data.members.length;
      let x, y;
      
      if (numMembers === 1) {
        // Center single member
        x = containerWidth / 2;
        y = containerHeight / 2;
      } else if (numMembers <= 6) {
        // Circular layout for small families
        const angle = (index / numMembers) * 2 * Math.PI;
        const radius = Math.min(containerWidth, containerHeight) * 0.25;
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      } else {
        // Grid layout for larger families
        const cols = Math.ceil(Math.sqrt(numMembers));
        const rows = Math.ceil(numMembers / cols);
        const col = index % cols;
        const row = Math.floor(index / cols);
        const spacingX = (containerWidth - 200) / (cols - 1 || 1);
        const spacingY = (containerHeight - 200) / (rows - 1 || 1);
        x = 100 + col * spacingX;
        y = 100 + row * spacingY;
      }
      
      return {
        id: member.id,
        x,
        y,
        member
      };
    });

    // Create edges for relationships
    const edges: NetworkEdge[] = [];

    // Add marriage edges
    data.marriages.forEach(marriage => {
      edges.push({
        from: marriage.person1_id,
        to: marriage.person2_id,
        type: 'marriage',
        data: marriage
      });
    });

    // Add parent-child edges
    data.parentChildRelations.forEach(relation => {
      edges.push({
        from: relation.parent_id,
        to: relation.child_id,
        type: 'parent-child',
        data: relation
      });
    });

    return { nodes, edges };
  }, [data]);



  // Get initials for avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get node position by ID
  const getNodeById = (id: number) => nodes.find(node => node.id === id);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">🌳</div>
          <p>No family members to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50">
      <div ref={containerRef} className="relative w-full h-full">
        {/* SVG for connections */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#94a3b8"
              />
            </marker>
          </defs>
          
          {edges.map((edge, index) => {
            const fromNode = getNodeById(edge.from);
            const toNode = getNodeById(edge.to);
            
            if (!fromNode || !toNode) return null;

            const isMarriage = edge.type === 'marriage';
            
            return (
              <g key={`${edge.from}-${edge.to}-${index}`}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isMarriage ? '#ec4899' : '#8b5cf6'}
                  strokeWidth={isMarriage ? 3 : 2}
                  strokeDasharray={isMarriage ? '0' : '5,5'}
                  markerEnd={isMarriage ? '' : 'url(#arrowhead)'}
                />
                {isMarriage && (
                  <text
                    x={(fromNode.x + toNode.x) / 2}
                    y={(fromNode.y + toNode.y) / 2}
                    textAnchor="middle"
                    dy="-5"
                    className="text-xs fill-pink-600"
                  >
                    💕
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Family member bubbles */}
        {nodes.map((node) => {
          const isSelected = selectedMemberId === node.id;
          const birthYear = node.member.birth_date ? new Date(node.member.birth_date).getFullYear() : null;
          const deathYear = node.member.death_date ? new Date(node.member.death_date).getFullYear() : null;
          const age = birthYear ? (deathYear ? deathYear - birthYear : new Date().getFullYear() - birthYear) : null;

          return (
            <Card
              key={node.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-110 min-w-48 ${
                isSelected 
                  ? 'ring-4 ring-purple-500 shadow-2xl scale-110 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-300' 
                  : 'hover:shadow-xl bg-white/95 backdrop-blur-sm border-gray-200 hover:border-purple-300 hover:bg-gradient-to-br hover:from-white hover:to-purple-25'
              }`}
              style={{
                left: node.x,
                top: node.y,
                zIndex: isSelected ? 10 : 2
              }}
              onClick={() => onMemberSelect(node.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                    <AvatarImage src={node.member.picture_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white font-semibold">
                      {getInitials(node.member.first_name, node.member.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {node.member.first_name} {node.member.last_name}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {birthYear && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          <Calendar className="w-3 h-3 mr-1" />
                          {birthYear}
                        </Badge>
                      )}
                      {age && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          {age}y
                        </Badge>
                      )}
                      {deathYear && (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                          <Skull className="w-3 h-3 mr-1" />
                          {deathYear}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-0.5 bg-pink-500"></div>
            <span>Marriage 💕</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-0.5 bg-purple-500 border-dashed border-t-2 border-purple-500"></div>
            <span>Parent → Child</span>
          </div>
        </div>
      </div>
    </div>
  );
}