import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Patient {
  id: string;
  name: string;
  age?: number;
  sex?: string;
  blood_group?: string;
  patient_id?: string;
  created_at: string;
}

interface PatientSearchProps {
  patients: Patient[];
  onFilteredPatientsChange: (filteredPatients: Patient[]) => void;
}

export const PatientSearch = ({ patients, onFilteredPatientsChange }: PatientSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) {
      return patients;
    }

    const term = searchTerm.toLowerCase();
    return patients.filter(patient => 
      patient.name.toLowerCase().includes(term) ||
      patient.patient_id?.toLowerCase().includes(term) ||
      patient.id.toLowerCase().includes(term)
    );
  }, [patients, searchTerm]);

  // Notify parent component whenever filtered patients change
  useMemo(() => {
    onFilteredPatientsChange(filteredPatients);
  }, [filteredPatients, onFilteredPatientsChange]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search patients by name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};