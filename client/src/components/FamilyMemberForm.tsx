import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import type { CreateFamilyMemberInput } from '../../../server/src/schema';

interface FamilyMemberFormProps {
  onSubmit: (data: CreateFamilyMemberInput) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function FamilyMemberForm({ onSubmit, isLoading = false, onCancel }: FamilyMemberFormProps) {
  const [formData, setFormData] = useState<CreateFamilyMemberInput>({
    first_name: '',
    last_name: '',
    birth_date: null,
    gender: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      first_name: '',
      last_name: '',
      birth_date: null,
      gender: null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="first_name">First Name *</Label>
        <Input
          id="first_name"
          value={formData.first_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateFamilyMemberInput) => ({ ...prev, first_name: e.target.value }))
          }
          placeholder="Enter first name"
          required
        />
      </div>
      <div>
        <Label htmlFor="last_name">Last Name *</Label>
        <Input
          id="last_name"
          value={formData.last_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateFamilyMemberInput) => ({ ...prev, last_name: e.target.value }))
          }
          placeholder="Enter last name"
          required
        />
      </div>
      <div>
        <Label htmlFor="birth_date">Birth Date (Optional)</Label>
        <Input
          id="birth_date"
          type="date"
          value={formData.birth_date ? formData.birth_date.toISOString().split('T')[0] : ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateFamilyMemberInput) => ({ 
              ...prev, 
              birth_date: e.target.value ? new Date(e.target.value) : null 
            }))
          }
        />
      </div>
      <div>
        <Label htmlFor="gender">Gender (Optional)</Label>
        <Select 
          value={formData.gender || 'none'} 
          onValueChange={(value) => setFormData(prev => ({ 
            ...prev, 
            gender: value === 'none' ? null : value as 'male' | 'female' | 'other'
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Prefer not to say</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700">
          {isLoading ? 'Creating...' : 'Add Member'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}