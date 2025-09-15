import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DemoNoticeProps {
  onAddMember: () => void;
}

export function DemoNotice({ onAddMember }: DemoNoticeProps) {
  return (
    <Alert className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <strong>Demo Mode Active!</strong> You're viewing sample family data. 
            <span className="ml-1">Start building your own family tree by adding members.</span>
          </div>
          <Button
            onClick={onAddMember}
            size="sm"
            className="ml-4 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Your Family
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}