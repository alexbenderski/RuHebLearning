import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import AuthGate from './pages/AuthGate';
import AlphabetModule from './components/alphabet/AlphabetModule';
import WordsModule from './components/words/WordsModule';
import MyWordsPage from './pages/MyWordsPage';
import GrammarModule from './components/grammar/GrammarModule';
import { useUser } from './hooks/useUser';
import { NikudProvider } from './context/NikudContext';

function App() {
  const { firebaseUser, userProfile, loading } = useUser();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!firebaseUser) {
    return <AuthGate />;
  }

  return (
    <NikudProvider>
      <BrowserRouter>
        <Layout userProfile={userProfile}>
          <Routes>
            <Route
              path="/"
              element={<Home userId={firebaseUser.uid} userName={userProfile?.displayName ?? firebaseUser.displayName ?? 'Друг'} />}
            />
            <Route path="/alphabet" element={<AlphabetModule userId={firebaseUser.uid} />} />
            <Route path="/words" element={<WordsModule userId={firebaseUser.uid} />} />
            <Route path="/my-words" element={<MyWordsPage userId={firebaseUser.uid} />} />
            <Route path="/grammar" element={<GrammarModule />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </NikudProvider>
  );
}

export default App;
