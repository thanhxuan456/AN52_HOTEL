import { useState, useEffect, useRef } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Rooms from '@/components/Rooms';
import Amenities from '@/components/Amenities';
import Gallery from '@/components/Gallery';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';
import BookingModal from '@/components/BookingModal';
import AuthModal from '@/components/AuthModal';
import BackToTop from '@/components/BackToTop';
import Dashboard from '@/components/Dashboard';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

function AppContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(undefined);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showDashboard, setShowDashboard] = useState(false);
  const wasSignedIn = useRef(false);

  useEffect(() => {
    if (isSignedIn && !wasSignedIn.current && authOpen) {
      wasSignedIn.current = true;
      setAuthOpen(false);
      setShowDashboard(true);
    }
    if (isSignedIn) {
      wasSignedIn.current = true;
    } else if (isLoaded) {
      wasSignedIn.current = false;
    }
  }, [isSignedIn, isLoaded, authOpen]);

  const openBooking = (roomId?: string) => {
    setSelectedRoomId(roomId);
    setBookingOpen(true);
  };

  const closeBooking = () => {
    setBookingOpen(false);
    setSelectedRoomId(undefined);
  };

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  if (showDashboard) {
    return (
      <div className="min-h-screen bg-white dark:bg-secondary-950 transition-colors">
        <Dashboard onBack={() => setShowDashboard(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-950 transition-colors">
      <Navbar
        onBookClick={() => openBooking()}
        onAuthClick={openAuth}
        onDashboardClick={() => setShowDashboard(true)}
      />
      <main>
        <Hero onBookClick={() => openBooking()} />
        <About />
        <Rooms onBookClick={(roomId) => openBooking(roomId)} />
        <Amenities />
        <Gallery />
        <Testimonials />
      </main>
      <Footer onBookClick={() => openBooking()} />
      <BookingModal open={bookingOpen} onClose={closeBooking} initialRoomId={selectedRoomId} />
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
      <BackToTop />
    </div>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <AppProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AppProvider>
    </ClerkProvider>
  );
}
