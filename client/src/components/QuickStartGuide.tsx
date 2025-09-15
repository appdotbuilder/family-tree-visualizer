import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QuickStartGuideProps {
  onAddMember: () => void;
  onAddMarriage: () => void;
  onAddRelationship: () => void;
  hasFamilyMembers: boolean;
  canCreateRelationships: boolean;
}

export function QuickStartGuide({ 
  onAddMember, 
  onAddMarriage, 
  onAddRelationship, 
  hasFamilyMembers,
  canCreateRelationships 
}: QuickStartGuideProps) {
  const steps = [
    {
      title: "Add Family Members",
      description: "Start by adding individual family members with their basic information.",
      action: "Add Member",
      onAction: onAddMember,
      completed: hasFamilyMembers,
      icon: "👤"
    },
    {
      title: "Create Marriages",
      description: "Connect family members through marriage relationships.",
      action: "Create Marriage",
      onAction: onAddMarriage,
      disabled: !canCreateRelationships,
      icon: "💍"
    },
    {
      title: "Define Parent-Child Relationships",
      description: "Establish family lineage by connecting parents with their children.",
      action: "Add Relationship",
      onAction: onAddRelationship,
      disabled: !canCreateRelationships,
      icon: "👨‍👩‍👧‍👦"
    }
  ];

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🚀 Quick Start Guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">
          Build your family tree in three simple steps:
        </p>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-white rounded-lg border">
              <div className="text-2xl">{step.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  {step.completed && <Badge variant="secondary" className="text-green-700 bg-green-100">✓ Done</Badge>}
                </div>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
              <Button
                onClick={step.onAction}
                disabled={step.disabled}
                size="sm"
                className={step.disabled ? "opacity-50" : ""}
              >
                {step.action}
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Add at least two family members before creating relationships between them.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}