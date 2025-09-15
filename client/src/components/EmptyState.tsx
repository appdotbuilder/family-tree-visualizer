import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: string;
}

export function EmptyState({ title, description, actionText, onAction, icon = "🌳" }: EmptyStateProps) {
  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="text-center py-12">
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
        {actionText && onAction && (
          <Button onClick={onAction} className="bg-green-600 hover:bg-green-700">
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}