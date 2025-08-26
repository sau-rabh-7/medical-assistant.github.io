import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, User, Calendar, Droplets } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  age?: number;
  sex?: string;
  blood_group?: string;
  created_at: string;
}

interface PatientCardProps {
  patient: Patient;
  onStartChat: (patientId: string) => void;
}

export const PatientCard = ({ patient, onStartChat }: PatientCardProps) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{patient.name}</h3>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
              {patient.age && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{patient.age} years</span>
                </div>
              )}
              {patient.sex && (
                <span className="capitalize">{patient.sex}</span>
              )}
              {patient.blood_group && (
                <div className="flex items-center space-x-1">
                  <Droplets className="w-3 h-3" />
                  <span>{patient.blood_group}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => onStartChat(patient.id)}
          className="flex items-center space-x-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chat</span>
        </Button>
      </div>
    </Card>
  );
};