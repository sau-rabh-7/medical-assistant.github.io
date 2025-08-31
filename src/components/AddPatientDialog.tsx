import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AddPatientDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onPatientAdded: () => void;
}

export const AddPatientDialog = ({ open: externalOpen, onOpenChange: externalOnOpenChange, onPatientAdded }: AddPatientDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(externalOpen || false);
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    sex: '',
    blood_group: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    recent_operations: '',
    emergency_contact: ''
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const insertData = {
      user_id: user.id,
      name: patientData.name,
      ...(patientData.age && { age: parseInt(patientData.age) }),
      ...(patientData.sex && { sex: patientData.sex }),
      ...(patientData.blood_group && { blood_group: patientData.blood_group }),
      ...(patientData.medical_history && { medical_history: patientData.medical_history }),
      ...(patientData.allergies && { allergies: patientData.allergies }),
      ...(patientData.current_medications && { current_medications: patientData.current_medications }),
      ...(patientData.recent_operations && { recent_operations: patientData.recent_operations }),
      ...(patientData.emergency_contact && { emergency_contact: patientData.emergency_contact })
    };

    const { error } = await supabase
      .from('patients')
      .insert(insertData as any);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add patient. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Patient added successfully!"
      });
      setPatientData({
        name: '',
        age: '',
        sex: '',
        blood_group: '',
        medical_history: '',
        allergies: '',
        current_medications: '',
        recent_operations: '',
        emergency_contact: ''
      });
      setOpen(false);
      onPatientAdded();
    }

    setLoading(false);
  };

  return (
    <Dialog open={externalOpen !== undefined ? externalOpen : open} onOpenChange={externalOnOpenChange || setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Patient</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={patientData.name}
                onChange={(e) => setPatientData({...patientData, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={patientData.age}
                onChange={(e) => setPatientData({...patientData, age: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <Select value={patientData.sex} onValueChange={(value) => setPatientData({...patientData, sex: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="blood_group">Blood Group</Label>
              <Select value={patientData.blood_group} onValueChange={(value) => setPatientData({...patientData, blood_group: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((group) => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical_history">Medical History</Label>
            <Textarea
              id="medical_history"
              placeholder="Previous medical conditions, surgeries, etc."
              value={patientData.medical_history}
              onChange={(e) => setPatientData({...patientData, medical_history: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea
              id="allergies"
              placeholder="Known allergies to medications, foods, etc."
              value={patientData.allergies}
              onChange={(e) => setPatientData({...patientData, allergies: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_medications">Current Medications</Label>
            <Textarea
              id="current_medications"
              placeholder="Currently taking medications with dosages"
              value={patientData.current_medications}
              onChange={(e) => setPatientData({...patientData, current_medications: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recent_operations">Recent Operations</Label>
            <Textarea
              id="recent_operations"
              placeholder="Recent surgeries or medical procedures"
              value={patientData.recent_operations}
              onChange={(e) => setPatientData({...patientData, recent_operations: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_contact">Emergency Contact</Label>
            <Input
              id="emergency_contact"
              placeholder="Emergency contact name and phone number"
              value={patientData.emergency_contact}
              onChange={(e) => setPatientData({...patientData, emergency_contact: e.target.value})}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Adding...' : 'Add Patient'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};