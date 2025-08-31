import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogOut, Users, Stethoscope, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PatientCard } from '@/components/PatientCard';
import { AddPatientDialog } from '@/components/AddPatientDialog';
import { PatientSearch } from '@/components/PatientSearch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Patient {
  id: string;
  name: string;
  age?: number;
  sex?: string;
  blood_group?: string;
  patient_id?: string;
  created_at: string;
}

const Dashboard = () => {
  console.log('Dashboard component rendering...');
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

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
      .select('id, name, age, sex, blood_group, patient_id, created_at')
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
      setFilteredPatients(data || []);
    }
    setLoadingPatients(false);
  };

  const handleStartChat = async (patientId: string) => {
    if (!user) return;

    try {
      // First check if there's an existing chat session for this patient
      const { data: existingSessions, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessionError) {
        console.error('Error checking existing sessions:', sessionError);
        toast({
          title: "Error",
          description: "Failed to check chat sessions",
          variant: "destructive"
        });
        return;
      }

      let sessionId = existingSessions?.[0]?.id;

      // If no existing session, create a new one
      if (!sessionId) {
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            patient_id: patientId,
            title: 'Medical Consultation'
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating new session:', createError);
          toast({
            title: "Error",
            description: "Failed to start chat session",
            variant: "destructive"
          });
          return;
        }
        
        sessionId = newSession.id;
      }

      // Navigate to chat page with session ID and patient ID
      navigate(`/chat/${sessionId}?patient=${patientId}`);
    } catch (error) {
      console.error('Error in handleStartChat:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
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

        {/* Main Content */}
        <div className="space-y-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Medical Dashboard</h1>
              <p className="text-muted-foreground mt-2">Manage your patients and consultations</p>
            </div>
            <Button onClick={() => setIsAddPatientOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <PatientSearch 
              patients={patients} 
              onFilteredPatientsChange={setFilteredPatients}
            />
            <div className="text-sm text-muted-foreground">
              {filteredPatients.length} of {patients.length} patients
            </div>
          </div>
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
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              {patients.length === 0 ? (
                <>
                  <h3 className="text-lg font-semibold mb-2">No patients yet</h3>
                  <p className="text-muted-foreground mb-4">Add your first patient to get started</p>
                  <Button onClick={() => setIsAddPatientOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Patient
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-2">No matching patients</h3>
                  <p className="text-muted-foreground">Try adjusting your search terms</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onStartChat={handleStartChat}
                />
              ))}
            </div>
          )}
        
        <AddPatientDialog
          open={isAddPatientOpen}
          onOpenChange={setIsAddPatientOpen}
          onPatientAdded={() => {
            fetchPatients();
            setIsAddPatientOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;