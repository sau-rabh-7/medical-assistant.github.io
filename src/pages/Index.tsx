import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogOut, Users, Stethoscope } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PatientCard } from '@/components/PatientCard';
import { AddPatientDialog } from '@/components/AddPatientDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Patient {
  id: string;
  name: string;
  age?: number;
  sex?: string;
  blood_group?: string;
  created_at: string;
}

const Dashboard = () => {
  console.log('Dashboard component rendering...');
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchPatients();
  }, [user, loading, navigate]);

  const fetchPatients = async () => {
    if (!user) return;
    
    setLoadingPatients(true);
    const { data, error } = await supabase
      .from('patients')
      .select('id, name, age, sex, blood_group, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive"
      });
    } else {
      setPatients(data || []);
    }
    setLoadingPatients(false);
  };

  const handleStartChat = async (patientId: string) => {
    if (!user) return;

    // Create a new chat session for this patient
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        patient_id: patientId,
        title: 'New Consultation'
      })
      .select('id')
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start chat session",
        variant: "destructive"
      });
    } else {
      // Navigate to chat page with session ID and patient ID
      navigate(`/chat/${data.id}?patient=${patientId}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Stethoscope className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Medical Assistant</h1>
              <p className="text-muted-foreground">Welcome back, {user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="flex items-center space-x-2">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>

        {/* Patients Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Your Patients</h2>
            </div>
            <AddPatientDialog onPatientAdded={fetchPatients} />
          </div>

          {loadingPatients ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-3 bg-muted rounded w-16"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : patients.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Patients Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first patient to start medical consultations
              </p>
              <AddPatientDialog onPatientAdded={fetchPatients} />
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {patients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onStartChat={handleStartChat}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;