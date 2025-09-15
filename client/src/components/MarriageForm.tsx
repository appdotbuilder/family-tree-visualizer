import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import type { CreateMarriageInput, FamilyMember } from '../../../server/src/schema';

interface MarriageFormProps {
  onSubmit: (data: CreateMarriageInput) => Promise<void>;
  familyMembers: FamilyMember[];
  isLoading?: boolean;
  onCancel?: () => void;
}

export function MarriageForm({ onSubmit, familyMembers, isLoading = false, onCancel }: MarriageFormProps) {
  const [formData, setFormData] = useState<CreateMarriageInput>({
    spouse1_id: 0,
    spouse2_id: 0,
    marriage_date: null,
    divorce_date: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.spouse1_id === 0 || formData.spouse2_id === 0) {
      throw new Error('Please select both family members for the marriage');
    }
    if (formData.spouse1_id === formData.spouse2_id) {
      throw new Error('A person cannot marry themselves');
    }
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      spouse1_id: 0,
      spouse2_id: 0,
      marriage_date: null,
      divorce_date: null
    });
  };

  const getGenderEmoji = (gender: 'male' | 'female' | 'other' | null): string => {
    switch (gender) {
      case 'male': return '👨';
      case 'female': return '👩';
      case 'other': return '🧑';
      default: return '👤';
    }
  };

  const availableSecondSpouses = familyMembers.filter(member => member.id !== formData.spouse1_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>First Spouse *</Label>
        <Select 
          value={formData.spouse1_id.toString()} 
          onValueChange={(value) => setFormData(prev => ({ 
            ...prev, 
            spouse1_id: parseInt(value),
            // Reset spouse2 if it's the same as spouse1
            spouse2_id: prev.spouse2_id === parseInt(value) ? 0 : prev.spouse2_id
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select first spouse" />
          </SelectTrigger>
          <SelectContent>
            {familyMembers.map((member: FamilyMember) => (
              <SelectItem key={member.id} value={member.id.toString()}>
                {getGenderEmoji(member.gender)} {member.first_name} {member.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Second Spouse *</Label>
        <Select 
          value={formData.spouse2_id.toString()} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, spouse2_id: parseInt(value) }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select second spouse" />
          </SelectTrigger>
          <SelectContent>
            {availableSecondSpouses.map((member: FamilyMember) => (
              <SelectItem key={member.id} value={member.id.toString()}>
                {getGenderEmoji(member.gender)} {member.first_name} {member.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="marriage_date">Marriage Date (Optional)</Label>
        <Input
          id="marriage_date"
          type="date"
          value={formData.marriage_date ? formData.marriage_date.toISOString().split('T')[0] : ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateMarriageInput) => ({ 
              ...prev, 
              marriage_date: e.target.value ? new Date(e.target.value) : null 
            }))
          }
        />
      </div>
      
      <div>
        <Label htmlFor="divorce_date">Divorce Date (Optional)</Label>
        <Input
          id="divorce_date"
          type="date"
          value={formData.divorce_date ? formData.divorce_date.toISOString().split('T')[0] : ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateMarriageInput) => ({ 
              ...prev, 
              divorce_date: e.target.value ? new Date(e.target.value) : null 
            }))
          }
        />
        {formData.marriage_date && formData.divorce_date && formData.divorce_date <= formData.marriage_date && (
          <p className="text-sm text-red-600 mt-1">Divorce date must be after marriage date</p>
        )}
      </div>
      
      <div className="flex gap-2 pt-2">
        <Button 
          type="submit" 
          disabled={isLoading || !formData.spouse1_id || !formData.spouse2_id} 
          className="flex-1 bg-pink-600 hover:bg-pink-700"
        >
          {isLoading ? 'Creating...' : 'Create Marriage'}
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