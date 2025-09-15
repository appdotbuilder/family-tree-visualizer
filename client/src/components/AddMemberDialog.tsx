import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { CalendarIcon, User, Camera, Save, X } from 'lucide-react';
import type { CreateFamilyMemberInput } from '../../../server/src/schema';

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded: () => void;
}

export function AddMemberDialog({ isOpen, onClose, onMemberAdded }: AddMemberDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateFamilyMemberInput>({
    first_name: '',
    last_name: '',
    birth_date: null,
    death_date: null,
    picture_url: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await trpc.createFamilyMember.mutate(formData);
      onMemberAdded();
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        birth_date: null,
        death_date: null,
        picture_url: null
      });
    } catch (error) {
      console.error('Failed to create family member:', error);
      // In a real app, you'd show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      // Reset form when closing
      setFormData({
        first_name: '',
        last_name: '',
        birth_date: null,
        death_date: null,
        picture_url: null
      });
    }
  };

  // Helper function to convert date string to Date or null
  const handleDateChange = (value: string, field: 'birth_date' | 'death_date') => {
    const date = value ? new Date(value) : null;
    setFormData((prev: CreateFamilyMemberInput) => ({
      ...prev,
      [field]: date
    }));
  };

  // Helper function to format date for input
  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
              <User className="w-4 h-4 text-white" />
            </div>
            <span>Add Family Member</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.first_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateFamilyMemberInput) => ({ 
                    ...prev, 
                    first_name: e.target.value 
                  }))
                }
                placeholder="John"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.last_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateFamilyMemberInput) => ({ 
                    ...prev, 
                    last_name: e.target.value 
                  }))
                }
                placeholder="Doe"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Date Fields */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="birthDate" className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4" />
                <span>Birth Date</span>
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={formatDateForInput(formData.birth_date)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleDateChange(e.target.value, 'birth_date')
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deathDate" className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4" />
                <span>Death Date (if applicable)</span>
              </Label>
              <Input
                id="deathDate"
                type="date"
                value={formatDateForInput(formData.death_date)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleDateChange(e.target.value, 'death_date')
                }
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Picture URL */}
          <div className="space-y-2">
            <Label htmlFor="pictureUrl" className="flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>Picture URL</span>
            </Label>
            <Input
              id="pictureUrl"
              type="url"
              value={formData.picture_url || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateFamilyMemberInput) => ({
                  ...prev,
                  picture_url: e.target.value || null
                }))
              }
              placeholder="https://example.com/photo.jpg"
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.first_name.trim() || !formData.last_name.trim()}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </form>

        <div className="text-xs text-gray-500 mt-4">
          <p>💡 <strong>Tip:</strong> After adding family members, you can create relationships (marriages, parent-child) through the relationship management features.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}