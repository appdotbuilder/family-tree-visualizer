import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import type { CreateParentChildInput, FamilyMember } from '../../../server/src/schema';

interface ParentChildFormProps {
  onSubmit: (data: CreateParentChildInput) => Promise<void>;
  familyMembers: FamilyMember[];
  isLoading?: boolean;
  onCancel?: () => void;
}

export function ParentChildForm({ onSubmit, familyMembers, isLoading = false, onCancel }: ParentChildFormProps) {
  const [formData, setFormData] = useState<CreateParentChildInput>({
    parent_id: 0,
    child_id: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.parent_id === 0 || formData.child_id === 0) {
      throw new Error('Please select both parent and child for the relationship');
    }
    if (formData.parent_id === formData.child_id) {
      throw new Error('A person cannot be their own parent');
    }
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      parent_id: 0,
      child_id: 0
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

  const getMemberAge = (member: FamilyMember): string => {
    if (!member.birth_date) return '';
    const today = new Date();
    const birthDate = new Date(member.birth_date);
    const age = today.getFullYear() - birthDate.getFullYear();
    return ` (${age} years old)`;
  };

  const availableChildren = familyMembers.filter(member => member.id !== formData.parent_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Parent *</Label>
        <Select 
          value={formData.parent_id.toString()} 
          onValueChange={(value) => setFormData(prev => ({ 
            ...prev, 
            parent_id: parseInt(value),
            // Reset child if it's the same as parent
            child_id: prev.child_id === parseInt(value) ? 0 : prev.child_id
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select parent" />
          </SelectTrigger>
          <SelectContent>
            {familyMembers.map((member: FamilyMember) => (
              <SelectItem key={member.id} value={member.id.toString()}>
                {getGenderEmoji(member.gender)} {member.first_name} {member.last_name}
                {getMemberAge(member)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Child *</Label>
        <Select 
          value={formData.child_id.toString()} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, child_id: parseInt(value) }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select child" />
          </SelectTrigger>
          <SelectContent>
            {availableChildren.map((member: FamilyMember) => (
              <SelectItem key={member.id} value={member.id.toString()}>
                {getGenderEmoji(member.gender)} {member.first_name} {member.last_name}
                {getMemberAge(member)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-2 pt-2">
        <Button 
          type="submit" 
          disabled={isLoading || !formData.parent_id || !formData.child_id} 
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Creating...' : 'Create Relationship'}
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